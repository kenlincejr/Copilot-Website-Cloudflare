#!/usr/bin/env bash
# tools/test-accounts.sh — end-to-end check of the accounts API.
# Start the Worker first:  cd ff/worker && npx wrangler dev --port 8787 --local
#
# Signup is invite-only, so this script mints its own codes through the admin
# route and therefore needs the same secret the Worker has. For a local run, put
#   ADMIN_TOKEN = "local-dev-admin-token"
# in ff/worker/.dev.vars (gitignored); against a deployed Worker, export
# DRAFTLINE_ADMIN_TOKEN to match the secret set with `wrangler secret put`.

B=${DRAFTLINE_API:-http://127.0.0.1:8787}
O="Origin: ${DRAFTLINE_ORIGIN:-http://localhost:8123}"
J='content-type: application/json'
ADMIN=${DRAFTLINE_ADMIN_TOKEN:-local-dev-admin-token}
pass=0; fail=0

# One fresh single-use code. Every signup below that is meant to SUCCEED calls
# this; the ones meant to fail for some other reason pass DUD instead, so a
# failure there proves the other check fired without spending a real code.
newcode() {
  curl -s -H "$O" -H "$J" -H "Authorization: Bearer $ADMIN" \
       -d '{"count":1,"note":"test-accounts.sh"}' $B/api/admin/codes \
    | sed -n 's/.*"codes":\["\([^"]*\)".*/\1/p'
}
DUD="AAAA2222"   # well-formed, and not a code anyone has ever been issued
ck() { # ck <label> <expected-substring> <actual>
  if [[ "$3" == *"$2"* ]]; then echo "  ok   $1"; pass=$((pass+1));
  else echo "  FAIL $1"; echo "       wanted: $2"; echo "       got:    $3"; fail=$((fail+1)); fi
}

NAME="klince+$RANDOM$RANDOM@outlook.com"
UPPER=$(echo "$NAME" | tr "[:lower:]" "[:upper:]")
PW="laredo"

echo "== bad origin is refused"
r=$(curl -s -H "Origin: https://evil.example" -H "$J" -d "{\"name\":\"x\",\"password\":\"yyyyyy\",\"invite\":\"$DUD\"}" $B/api/signup)
ck "origin allowlist" "Origin not allowed" "$r"

echo "== signup"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"$PW\",\"invite\":\"$(newcode)\"}" $B/api/signup)
ck "returns a token" '"token"' "$r"
TOK=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

echo "== signup rules"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"shorty\",\"password\":\"abc\",\"invite\":\"$DUD\"}" $B/api/signup)
ck "min password" "at least 6" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"another\",\"invite\":\"$DUD\"}" $B/api/signup)
ck "duplicate name" "already taken" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$UPPER\",\"password\":\"another\",\"invite\":\"$DUD\"}" $B/api/signup)
ck "duplicate is case-insensitive" "already taken" "$r"

echo "== invite codes"
# A fresh address per run, and a different one per purpose. A rejected code
# counts a failure on the iv: bucket for the caller's address, and ten of those
# inside fifteen minutes is a refusal — so fixed addresses here would mean the
# third or fourth run of this script in one sitting failing on a counter left
# behind by the second, which reads as a broken invite check and is not one.
# 198.18.0.0/15 is the benchmarking range: reserved, and never a real client.
rip() { echo "CF-Connecting-IP: 198.18.$((RANDOM % 256)).$((RANDOM % 256))"; }
IIP=$(rip)
signup() { # signup <name> <code> [ip-header]
  curl -s -H "$O" -H "$J" -H "${3:-$IIP}" \
       -d "{\"name\":\"$1\",\"password\":\"laredo-inv\",\"invite\":\"$2\"}" $B/api/signup
}

CODE=$(newcode)
ck "the admin route hands back a hyphenated code" "-" "$CODE"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"nocode-$RANDOM\",\"password\":\"laredo-inv\"}" $B/api/signup)
ck "no code at all is refused" "eight characters" "$r"
r=$(signup "shortcode-$RANDOM" "K7M2")
ck "a short code is refused on its shape" "eight characters" "$r"
r=$(signup "badchar-$RANDOM" "K7M2PQ4I")
ck "a code using an excluded look-alike is refused on its shape" "eight characters" "$r"
r=$(signup "unknown-$RANDOM" "K7M2PQ4X")
ck "a well-formed code nobody was issued is refused" "isn't valid" "$r"

INAME="invited-$RANDOM$RANDOM"
r=$(signup "$INAME" "$CODE")
ck "a real code creates the account" '"token"' "$r"
r=$(signup "second-$RANDOM" "$CODE")
ck "the same code a second time is refused" "isn't valid" "$r"
r=$(signup "third-$RANDOM" "$(echo "$CODE" | tr -d - | tr "[:upper:]" "[:lower:]")")
ck "and refused again unhyphenated and lower case (normalizing is not a way around it)" \
   "isn't valid" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$INAME\",\"password\":\"laredo-inv\"}" $B/api/login)
ck "the account made with it still signs in afterwards" '"token"' "$r"

# Hyphens, spaces and case are all cosmetic on the way in.
r=$(signup "sloppy-$RANDOM" "$(newcode | tr "[:upper:]" "[:lower:]")")
ck "a code typed in lower case with its hyphen works" '"token"' "$r"

echo "== the admin route does not announce itself"
r=$(curl -s -H "$O" $B/api/admin/codes)
ck "no token gets the same 404 as an unknown route" "No such endpoint" "$r"
r=$(curl -s -H "$O" -H "$(rip)" -H "Authorization: Bearer not-the-admin-token" $B/api/admin/codes)
ck "a wrong token gets it too — never a 401" "No such endpoint" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $ADMIN" $B/api/admin/codes)
ck "the real token lists codes" '"codes"' "$r"
ck "and the listing shows the spent one against the account that used it" "$INAME" "$r"

echo "== ten wrong codes from one address is a refusal"
BIP=$(rip)
for i in $(seq 1 10); do signup "flood-$i-$RANDOM" "K7M2PQ4X" "$BIP" > /dev/null; done
r=$(signup "flood-11-$RANDOM" "K7M2PQ4X" "$BIP")
ck "the 11th is turned away before the code is even looked up" "Too many wrong signup codes" "$r"
# A good code from a clean address is unaffected — the bucket is per-IP, and
# unlike the sign-in name bucket it cannot be aimed at anybody.
r=$(signup "clean-$RANDOM" "$(newcode)" "$(rip)")
ck "a different address with a good code still signs up" '"token"' "$r"

echo "== login"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"$PW\"}" $B/api/login)
ck "correct password" '"token"' "$r"
TOK2=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"wrong!\"}" $B/api/login)
ck "wrong password" "don't match" "$r"
r=$(curl -s -H "$O" -H "$J" -d '{"name":"nobody-at-all","password":"whatever"}' $B/api/login)
ck "unknown name gives the same message" "don't match" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"  $UPPER \",\"password\":\"$PW\"}" $B/api/login)
ck "login trims and folds case" '"token"' "$r"

echo "== session"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK" $B/api/session)
ck "valid token" "$NAME" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer deadbeef" $B/api/session)
ck "junk token" "Not signed in" "$r"
r=$(curl -s -H "$O" $B/api/session)
ck "no token" "Not signed in" "$r"

echo "== state round trip (device A)"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK" $B/api/state)
ck "empty to start" '"rev":0' "$r"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK" \
    -d '{"rev":0,"state":"{\"picks\":[1,2,3]}","device":"Windows · Chrome"}' $B/api/state)
ck "first write is rev 1" '"rev":1' "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK2" $B/api/state)
ck "the other device sees it" 'picks' "$r"
ck "and the device label" 'Windows' "$r"

echo "== conflict"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK2" \
    -d '{"rev":0,"state":"{\"picks\":[9]}","device":"iPad · Safari"}' $B/api/state)
ck "stale rev is refused" '"conflict":true' "$r"
ck "and hands back the current state" 'picks' "$r"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK2" \
    -d '{"rev":1,"state":"{\"picks\":[9]}","device":"iPad · Safari"}' $B/api/state)
ck "current rev is accepted" '"rev":2' "$r"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK2" \
    -d '{"rev":0,"force":true,"state":"{\"picks\":[42]}","device":"iPad · Safari"}' $B/api/state)
ck "force overrides" '"rev":3' "$r"

echo "== isolation between accounts"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"other-$RANDOM\",\"password\":\"laredo2\",\"invite\":\"$(newcode)\"}" $B/api/signup)
TOK3=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK3" $B/api/state)
ck "a new account sees no one else's draft" '"rev":0' "$r"

echo "== logout"
r=$(curl -s -X POST -H "$O" -H "Authorization: Bearer $TOK" $B/api/logout)
ck "logout ok" '"ok":true' "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK" $B/api/session)
ck "token is dead after logout" "Not signed in" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK2" $B/api/session)
ck "the other device stays signed in" "$NAME" "$r"

echo "== the Claude proxy is untouched at the root"
# Reaching the proxy's own validation is the proof that /api/ routing did not
# swallow the root. Which validation you hit depends on the target: a local dev
# run has no secret installed, a deployed one does and gets as far as the body.
r=$(curl -s -H "$O" -H "$J" -d '{"messages":[]}' $B/)
if [[ "$r" == *ANTHROPIC_API_KEY* ]]; then r="reached the proxy"; fi
if [[ "$r" == *"No messages"* ]];    then r="reached the proxy"; fi
ck "still its own endpoint" "reached the proxy" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK2" $B/api/nonsense)
ck "unknown api route" "No such endpoint" "$r"

echo "== lockout is per-IP, not per-account-name (workstream F fix)"
# The name-keyed lockout bucket was removed on purpose: anyone who knows the
# user's account name could otherwise send 20 wrong passwords from any address
# and lock the real owner out for 15 minutes — at 18:50 on draft night that is
# the whole app. accounts.js still COUNTS a per-name bucket (nm:<name>) so a
# pattern shows up afterwards, but only the per-IP bucket is allowed to REFUSE
# a login. This drives one address to the limit against a fixed name, then
# proves a correct password for that same name from a different address is
# unaffected.
LNAME="lockout-$RANDOM$RANDOM"
LPW="laredo-lock"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$LNAME\",\"password\":\"$LPW\",\"invite\":\"$(newcode)\"}" $B/api/signup)
ck "lockout fixture signs up" '"token"' "$r"
for i in $(seq 1 20); do
  curl -s -H "$O" -H "$J" -H "CF-Connecting-IP: 203.0.113.9" \
    -d "{\"name\":\"$LNAME\",\"password\":\"wrong-$i\"}" $B/api/login > /dev/null
done
r=$(curl -s -H "$O" -H "$J" -H "CF-Connecting-IP: 203.0.113.9" \
    -d "{\"name\":\"$LNAME\",\"password\":\"wrong-21\"}" $B/api/login)
ck "the 21st attempt from the SAME address is refused (the address is over its limit)" \
   "Too many sign-in attempts" "$r"
r=$(curl -s -H "$O" -H "$J" -H "CF-Connecting-IP: 198.51.100.4" \
    -d "{\"name\":\"$LNAME\",\"password\":\"$LPW\"}" $B/api/login)
ck "a CORRECT password for that same name from a DIFFERENT address still signs in " \
   '"token"' "$r"

echo "== a 64 KB+ state body (workstream F: the pagehide keepalive limit)"
# The server's own ceiling is 512 KB (MAX_BODY_BYTES) — this proves the API
# itself has no trouble with a state past 64 KB. 64 KB matters on the OTHER
# side of this call: browsers cap the body of a `keepalive: true` fetch (the
# one pagehide sends) at 64 KB, and silently fail it over that, which curl has
# no equivalent for and cannot reproduce — that half of the risk is a client
# finding, recorded in qa-findings-G.md, not something this script can assert.
BIGNAME="bigstate-$RANDOM$RANDOM"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$BIGNAME\",\"password\":\"laredo-big\",\"invite\":\"$(newcode)\"}" $B/api/signup)
BIGTOK=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
node -e '
var fs = require("fs");
var pad = "x".repeat(70 * 1024);
var state = JSON.stringify({ league: { teams: 12 }, picks: [], pad: pad });
fs.writeFileSync(".buildtmp_bigstate.json", JSON.stringify({ rev: 0, state: state, device: "bigstate" }));
'
BYTES=$(wc -c < .buildtmp_bigstate.json)
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $BIGTOK" \
    --data-binary @.buildtmp_bigstate.json $B/api/state)
rm -f .buildtmp_bigstate.json
ck "a ~$((BYTES/1024)) KB state body is accepted and stored (well under the 512 KB server ceiling)" \
   '"rev":1' "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $BIGTOK" $B/api/state)
ck "reading it back returns the full state, not a truncated one" "pad" "$r"

echo "== two devices saving within the same instant (workstream F race)"
# accounts.js reads the current record, checks rev, then writes — three steps,
# not one atomic compare-and-swap. Two PUTs against the same base rev fired as
# close to simultaneously as this shell can manage exercise exactly the window
# where both could read the same "current" rev before either writes. Locally,
# against wrangler's single-isolate dev runtime, this has consistently come
# back as one winner and one clean 409 — never two 200s and never a state that
# silently vanished. That is the contract this test pins down. It is not
# proof the same holds against production's real, physically-distributed KV,
# where the get and the put of two requests landing on different colos have
# more room to interleave; that gap is structural (no CAS primitive is used)
# and is written up in qa-findings-G.md rather than "fixed" here.
RNAME="race-$RANDOM$RANDOM"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$RNAME\",\"password\":\"laredo-race\",\"invite\":\"$(newcode)\"}" $B/api/signup)
RTOK=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $RTOK" \
    -d '{"rev":0,"state":"{\"picks\":[0]}","device":"base"}' $B/api/state)
ck "race fixture starts at rev 1" '"rev":1' "$r"
( curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $RTOK" \
      -d '{"rev":1,"state":"{\"picks\":[1]}","device":"Laptop A"}' $B/api/state \
      > .buildtmp_raceA.json ) &
( curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $RTOK" \
      -d '{"rev":1,"state":"{\"picks\":[2]}","device":"iPad B"}' $B/api/state \
      > .buildtmp_raceB.json ) &
wait
RA=$(cat .buildtmp_raceA.json); RB=$(cat .buildtmp_raceB.json)
rm -f .buildtmp_raceA.json .buildtmp_raceB.json
AOK=0; [[ "$RA" == *'"rev"'* && "$RA" != *conflict* ]] && AOK=1
BOK=0; [[ "$RB" == *'"rev"'* && "$RB" != *conflict* ]] && BOK=1
ck "exactly one of the two simultaneous writes won outright (never both)" \
   "1" "$((AOK + BOK == 1 ? 1 : 0))"
LOSER_HAS_CONFLICT="no"
[[ "$AOK" == "0" && "$RA" == *'"conflict":true'* ]] && LOSER_HAS_CONFLICT="yes"
[[ "$BOK" == "0" && "$RB" == *'"conflict":true'* ]] && LOSER_HAS_CONFLICT="yes"
ck "the losing write got a 409 conflict, not a silent drop" "yes" "$LOSER_HAS_CONFLICT"
r=$(curl -s -H "$O" -H "Authorization: Bearer $RTOK" $B/api/state)
ck "the account ends on rev 2 — one write actually landed" '"rev":2' "$r"

echo
echo "$pass passed, $fail failed"
exit $((fail > 0))
