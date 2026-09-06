#!/usr/bin/env python3
"""
yahoo-probe.py — can we actually talk to Yahoo, and what does it give us?

This exists to answer the spike list in tools/yahoo-integration-spec.md before a
line of the integration is written. It is a throwaway diagnostic, not a
component: it uses no repo code, nothing imports it, and the integration itself
will live in the Worker.

Why a local script and not the Worker
  The Worker is the right home for the real thing — it holds the secret and the
  browser cannot call Yahoo directly (no CORS headers). But standing that up
  before knowing whether the API answers at all is building on an assumption.
  This gets the answer in ten minutes with no deploy.

The credentials never move
  Client id and secret are read from tools/.yahoo-creds.json, which .gitignore
  excludes. Tokens are cached beside it in .yahoo-token.json, also ignored.
  Neither file is ever printed — every value this script echoes is either your
  own league data or a yes/no about a field's existence.

Usage
  1. python yahoo-probe.py url            print the URL to open in a browser
  2. python yahoo-probe.py auth <code>    exchange the code, cache the tokens
  3. python yahoo-probe.py probe          run every spike, write fixtures

Step 2's code comes out of your browser's address bar. The callback URL is not
built yet, so the page will fail to load — that is expected and does not matter.
The code is in the query string: ...?code=THIS_PART&state=...
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CREDS = os.path.join(HERE, ".yahoo-creds.json")
TOKEN = os.path.join(HERE, ".yahoo-token.json")
FIXTURES = os.path.join(HERE, "fixtures", "yahoo")

AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth"
TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token"
API = "https://fantasysports.yahooapis.com/fantasy/v2"

# Must match what is registered on the Yahoo app, byte for byte — including the
# absence of a trailing slash. A mismatch here is the classic invalid_grant.
REDIRECT = "https://draftline-api.ken-lince.workers.dev/api/yahoo/callback"

# The scope question is the first spike and the docs disagree with the community.
# Yahoo's own OAuth guide does not list `scope` as an authorize parameter at all
# and says Fantasy permission is granted on the app; every wrapper library sends
# `fspt-r`. Empty string here means "send no scope" — try that first, and only
# fall back if the games call comes back empty.
SCOPE = os.environ.get("YAHOO_SCOPE", "")


# ----------------------------------------------------------------- plumbing

def die(msg):
    print("\n  " + msg + "\n")
    sys.exit(1)


def creds():
    """
    The two values, however they got into the file.

    Asking someone to hand-build JSON around two opaque 80-character strings is
    asking for a syntax error, and the error Python gives back for one of those
    ("Expecting value: line 1 column 1") says nothing about what to fix. So this
    takes JSON if it is there and otherwise just finds the values in whatever
    was pasted — the Yahoo app page copied wholesale works fine. On success the
    file is rewritten as clean JSON so this only ever happens once.

    The two are told apart by shape: Yahoo's client secret is 40 hex characters,
    and the client id is the long dj0y... token. Neither is ever printed.
    """
    if not os.path.exists(CREDS):
        die("No credentials file.\n\n"
            "  Create " + CREDS + "\n"
            "  and paste your Client ID and Client Secret into it. JSON is\n"
            "  nice but not required — pasting the whole Yahoo app page works.\n\n"
            "  The file is gitignored and is never printed by this script.")

    # utf-8-sig, because Notepad can leave a BOM and json.load chokes on it with
    # the same unhelpful message an empty file gives.
    with open(CREDS, encoding="utf-8-sig") as f:
        text = f.read()

    if not text.strip():
        die("The credentials file is empty.\n\n  " + CREDS)

    cid = sec = None
    try:
        c = json.loads(text)
        cid, sec = c.get("client_id"), c.get("client_secret")
    except json.JSONDecodeError:
        pass

    if not (cid and sec):
        import re
        # Hex, case-insensitive, 32-64 long. Yahoo's is 40 lowercase today, but
        # pinning the exact shape of someone else's credential is how this
        # rejects a perfectly good secret later.
        hexes = re.findall(r"(?<![0-9a-zA-Z])[0-9a-fA-F]{32,64}(?![0-9a-zA-Z])",
                           text)
        # The long opaque token - the client id. Excludes anything already
        # matched as the secret.
        longs = [t for t in re.findall(r"[A-Za-z0-9_\-\.]{50,}", text)
                 if t not in hexes]
        sec = sec or (hexes[0] if hexes else None)
        cid = cid or (longs[0] if longs else None)

    if not cid or not sec:
        # Naming which half is missing saves a round trip, and the usual cause
        # is specific enough to say out loud: Yahoo hides the secret behind a
        # reveal toggle, so copying the app page brings the heading and not the
        # value.
        missing = "Client ID" if not cid else "Client Secret"
        die("Could not find the %s in the credentials file.\n\n"
            "  Found: client id %s, client secret %s\n\n"
            "  If the file ends on the line 'Client Secret (Consumer Secret)'\n"
            "  with nothing after it, the value was never copied - Yahoo hides\n"
            "  it behind a reveal toggle on the app page. Show it, then paste\n"
            "  it on its own line in:\n\n    %s"
            % (missing, "yes" if cid else "MISSING",
               "yes" if sec else "MISSING", CREDS))

    # Normalize the file so the guessing happens exactly once.
    if text.strip() != json.dumps({"client_id": cid, "client_secret": sec}):
        with open(CREDS, "w", encoding="utf-8") as f:
            json.dump({"client_id": cid, "client_secret": sec}, f)
        try:
            os.chmod(CREDS, 0o600)
        except OSError:
            pass
        # Enough to confirm it grabbed the right things, not enough to leak
        # them. The id prefix is fair game — it travels in the authorize URL.
        print("  Read credentials: client_id %s... (%d chars), "
              "client_secret %d chars, 40-hex %s"
              % (cid[:6], len(cid), len(sec), "yes" if len(sec) == 40 else "NO"))
    return {"client_id": cid, "client_secret": sec}


def post_form(url, fields, basic=None):
    body = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    if basic:
        req.add_header("Authorization", "Basic " + basic)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:600]
        die("Yahoo said %s.\n\n  %s" % (e.code, detail))


def save_token(tok):
    tok["obtained_at"] = int(time.time())
    with open(TOKEN, "w") as f:
        json.dump(tok, f, indent=1)
    os.chmod(TOKEN, 0o600)


def load_token():
    if not os.path.exists(TOKEN):
        die("Not authorized yet. Run:  python yahoo-probe.py url")
    with open(TOKEN) as f:
        return json.load(f)


def access_token():
    """Cached token, refreshed when it is within five minutes of expiring."""
    tok = load_token()
    age = int(time.time()) - tok.get("obtained_at", 0)
    if age < tok.get("expires_in", 3600) - 300:
        return tok["access_token"]

    c = creds()
    print("  (access token expired - refreshing)")
    # redirect_uri is required on refresh too. Omitting it is the most common
    # reason a refresh that looks correct returns invalid_request.
    fresh = post_form(TOKEN_URL, {
        "grant_type": "refresh_token",
        "refresh_token": tok["refresh_token"],
        "redirect_uri": REDIRECT,
        "client_id": c["client_id"],
        "client_secret": c["client_secret"],
    })
    fresh.setdefault("refresh_token", tok["refresh_token"])
    save_token(fresh)
    return fresh["access_token"]


def get(path, label=None):
    """One GET against the Fantasy API. `?format=json` always goes last."""
    sep = "&" if "?" in path else "?"
    url = API + "/" + path + sep + "format=json"
    req = urllib.request.Request(url)
    req.add_header("Authorization", "Bearer " + access_token())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        # A 999 or an HTML body is a throttle, not a normal error, and retrying
        # extends the block. Say so rather than looping.
        if e.code == 999 or body.lstrip().startswith("<"):
            die("Rate limited by Yahoo (HTTP %s). Stop for a while - retrying "
                "makes it worse." % e.code)
        return {"__error__": e.code, "__body__": body}
    except Exception as e:
        return {"__error__": "network", "__body__": str(e)}

    data = json.loads(raw)
    if label:
        os.makedirs(FIXTURES, exist_ok=True)
        with open(os.path.join(FIXTURES, label + ".json"), "w") as f:
            json.dump(data, f, indent=1)
    return data


# ------------------------------------------------------- shape wrangling
# Yahoo's JSON is a mechanical XML transcode. Collections are objects keyed
# "0","1",... with a sibling "count"; a single entity's fields arrive as a list
# of one-key objects; and absent fields are OMITTED, which shifts every later
# index. So: never index by position, always search by key. These two helpers
# are the whole defense, and the real integration needs the same pair at its
# HTTP boundary.

def flat(node, into=None):
    """Collapse Yahoo's nested list-of-single-key-objects into one dict."""
    into = {} if into is None else into
    if isinstance(node, dict):
        for k, v in node.items():
            if k.isdigit() or k == "count":
                continue
            if isinstance(v, (dict, list)):
                flat(v, into)
            into.setdefault(k, v)
    elif isinstance(node, list):
        for item in node:
            flat(item, into)
    return into


def rows(coll):
    """Turn {"0":{...},"1":{...},"count":2} into a real list."""
    if not isinstance(coll, dict):
        return []
    out = []
    for i in range(int(coll.get("count", 0) or 0)):
        v = coll.get(str(i))
        if v is not None:
            out.append(v)
    return out


def deep_find(node, needle):
    """Every key anywhere in the tree containing `needle`. Answers 'does Yahoo
       give us X at all', which is what most of these spikes reduce to."""
    hits = []

    def walk(n, path):
        if isinstance(n, dict):
            for k, v in n.items():
                if needle.lower() in str(k).lower():
                    hits.append((path + "." + str(k), v if not isinstance(v, (dict, list)) else "<%s>" % type(v).__name__))
                walk(v, path + "." + str(k))
        elif isinstance(n, list):
            for i, v in enumerate(n):
                walk(v, path + "[%d]" % i)

    walk(node, "")
    return hits


# ------------------------------------------------------------- commands

def cmd_url():
    c = creds()
    q = {
        "client_id": c["client_id"],
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "state": "probe" + str(int(time.time())),
    }
    if SCOPE:
        q["scope"] = SCOPE
    print("\n1. Open this in a browser and sign in to Yahoo:\n")
    print("   " + AUTH_URL + "?" + urllib.parse.urlencode(q))
    print("\n2. Approve. The browser lands on a URL that FAILS to load -")
    print("   that is expected, the callback is not built yet.")
    print("\n3. Copy the `code` value out of the address bar:")
    print("   ...\\api\\yahoo\\callback?code=<THIS>&state=...")
    print("\n4. Then run:\n")
    print("   python yahoo-probe.py auth <THIS>\n")
    if not SCOPE:
        print("   (Sending no `scope`. If step 5 finds no leagues, retry with")
        print('    $env:YAHOO_SCOPE="fspt-r" and start over.)\n')


def cmd_auth(code):
    c = creds()
    basic = base64.b64encode(
        ("%s:%s" % (c["client_id"], c["client_secret"])).encode()).decode()
    tok = post_form(TOKEN_URL, {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT,
    }, basic=basic)
    if "access_token" not in tok:
        die("No access token came back: " + json.dumps(tok)[:400])
    save_token(tok)
    print("\n  Authorized. Token cached (expires in %ss, refresh cached too)."
          % tok.get("expires_in"))
    print("  Now run:  python yahoo-probe.py probe\n")


def head(n, t):
    print("\n" + "=" * 66)
    print("SPIKE %s - %s" % (n, t))
    print("=" * 66)


def cmd_probe():
    print("\nProbing Yahoo. Raw payloads are written to tools/fixtures/yahoo/")
    print("so the real integration has something to test against.\n")

    # ---- 1 + 6: does anything answer, and what is this season's game key?
    head("1+6", "Connectivity, Fantasy scope, and the 2026 NFL game key")
    game = get("game/nfl", "game-nfl")
    if game.get("__error__"):
        die("Could not reach the game resource: %s %s\n\n"
            "  A 401 here means the token is bad. Anything else — especially\n"
            "  HTML — usually means the app has no Fantasy access yet, which\n"
            "  is the manual-review gate. That is the answer to spike 1."
            % (game["__error__"], game.get("__body__", "")[:200]))
    g = flat(game.get("fantasy_content", {}).get("game", []))
    game_key = g.get("game_key")
    print("  OK - connected.")
    print("  season      : %s" % g.get("season"))
    print("  game_key    : %s   <-- use this everywhere, do not hardcode" % game_key)

    # ---- league discovery
    head("1b", "Which leagues is this account in?")
    disc = get("users;use_login=1/games;game_keys=%s/leagues" % game_key, "leagues")
    users = disc.get("fantasy_content", {}).get("users", {})
    leagues = []
    for u in rows(users):
        for gm in rows(flat(u).get("games", {}) if isinstance(flat(u).get("games"), dict) else {}):
            pass
    # The nesting here is exactly the pathology described up top, so search by
    # key rather than trying to walk a fixed path.
    for k, v in deep_find(disc, "league_key"):
        if isinstance(v, str) and ".l." in v and v not in leagues:
            leagues.append(v)
    names = [v for _, v in deep_find(disc, "name") if isinstance(v, str)]
    if not leagues:
        print("  NO LEAGUES CAME BACK.")
        print("  This is the scope question. Re-run the url step with:")
        print('      $env:YAHOO_SCOPE="fspt-r"')
        print("  If that also returns nothing, the app is waiting on Yahoo's")
        print("  manual access review. See spec section 4.")
        return
    print("  Found %d league(s):" % len(leagues))
    for i, lk in enumerate(leagues):
        print("    [%d] %s   %s" % (i, lk, names[i] if i < len(names) else ""))

    lk = leagues[0]
    print("\n  Probing the first one: %s" % lk)

    # ---- 2: the one that decides whether we can score anything
    head("2", "stat_modifiers — can we recompute fantasy points?")
    st = get("league/%s/settings" % lk, "settings")
    mods = deep_find(st, "stat_modifiers")
    cats = deep_find(st, "stat_categories")
    print("  stat_categories present : %s" % ("YES" if cats else "NO"))
    print("  stat_modifiers present  : %s" % ("YES" if mods else "NO  <-- blocks Phase B"))
    for key in ("scoring_type", "waiver_type", "uses_faab", "num_teams",
                "draft_status", "draft_type", "is_auction_draft",
                "playoff_start_week", "current_week"):
        hit = [v for k, v in deep_find(st, key) if not str(v).startswith("<")]
        if hit:
            print("  %-20s: %s" % (key, hit[0]))
    kp = deep_find(st, "keeper")
    print("  keeper settings         : %s" % ("YES — " + str(kp[:3]) if kp else "not present"))

    roster = deep_find(st, "roster_positions")
    print("  roster_positions        : %s" % ("YES" if roster else "NO"))

    # ---- 4: waiver priority and FAAB
    head("4", "Team object — waiver_priority and faab_balance")
    tm = get("league/%s/teams" % lk, "teams")
    for key in ("waiver_priority", "faab_balance", "number_of_moves"):
        hit = deep_find(tm, key)
        print("  %-16s: %s" % (key, ("YES (%d teams)" % len(hit)) if hit else "NOT PRESENT"))

    # ---- 3: draft state
    head("3", "Draft results — shape and current state")
    dr = get("league/%s/draftresults" % lk, "draftresults")
    picks = deep_find(dr, "pick")
    status = [v for k, v in deep_find(dr, "draft_status") if isinstance(v, str)]
    print("  draft_status : %s" % (status[0] if status else "?"))
    print("  picks so far : %d" % len(picks))
    if picks:
        print("  fields on a pick: %s"
              % sorted({k.split(".")[-1] for k, _ in deep_find(dr, "")
                        if k.count(".") > 4})[:12])
    else:
        print("  (empty is EXPECTED before the draft - not an error)")
    print("\n  NOTE: live latency cannot be measured here. Join a Yahoo mock")
    print("  draft and re-run this repeatedly to time pick -> visible.")

    # ---- 5: the projection question
    head("5", "Player projections — the one that shapes the architecture")
    pl = get("league/%s/players;status=A;start=0;count=25" % lk, "players-available")
    hits = []
    for needle in ("projected", "projection", "proj_"):
        hits += deep_find(pl, needle)
    print("  player-level projection fields: %s"
          % ("FOUND — %s" % hits[:4] if hits else "NONE (expected)"))
    n_players = len([1 for k, v in deep_find(pl, "player_key")])
    print("  players returned in one page  : %d  (Yahoo caps this at 25)" % n_players)

    sb = get("league/%s/scoreboard" % lk, "scoreboard")
    tproj = deep_find(sb, "team_projected_points")
    print("  team_projected_points         : %s"
          % ("YES" if tproj else "not present (may be a completed week)"))

    print("\n  If player projections are absent, an external weekly projection")
    print("  source is a first-class dependency. See spec section 9.")

    # ---- in-season surfaces
    head("D", "In-season endpoints — do they answer?")
    for label, path in [
        ("transactions", "league/%s/transactions;types=add,drop,trade;count=10" % lk),
        ("free agents (FA)", "league/%s/players;status=FA;start=0;count=5" % lk),
        ("on waivers (W)", "league/%s/players;status=W;start=0;count=5" % lk),
        ("all rosters", "league/%s/teams/roster" % lk),
        ("percent_owned", "league/%s/players;status=A;start=0;count=5/percent_owned" % lk),
        ("draft_analysis (ADP)", "league/%s/players;status=A;start=0;count=5/draft_analysis" % lk),
    ]:
        r = get(path, label.split()[0].replace("(", "").replace(")", ""))
        if r.get("__error__"):
            print("  %-22s: ERROR %s" % (label, r["__error__"]))
        else:
            keys = len(deep_find(r, "player_key")) or len(deep_find(r, "transaction_key"))
            print("  %-22s: OK (%d records)" % (label, keys))

    print("\n" + "=" * 66)
    print("Fixtures written to tools/fixtures/yahoo/ - commit these.")
    print("Every test suite in the spec needs real payloads to run against,")
    print("and this is the only moment they get captured.")
    print("=" * 66 + "\n")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "url":
        cmd_url()
    elif cmd == "auth" and len(sys.argv) > 2:
        cmd_auth(sys.argv[2].strip())
    elif cmd == "probe":
        cmd_probe()
    else:
        print(__doc__)
