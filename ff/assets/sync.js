/* DRAFTLINE sync — the saved draft follows the account, not the browser.

   The board reads and writes localStorage synchronously all through app.js, and
   that is worth keeping: a draft happens in real time and no pick should ever
   wait on a network round trip. So this file does not replace local storage, it
   feeds it. hydrate() runs once before app.js is loaded and makes localStorage
   agree with the server; push() runs after every autosave and sends the result
   back up, debounced, failing quietly.

   The consequence to keep in mind: local is always the source of truth for the
   session in progress. If the server has newer state and this device has none of
   its own, we adopt it silently. If both have moved, that is a real conflict —
   two devices with two different drafts — and it is a person's call, not ours.
   The app shows a banner and asks. */
(function (root) {
  "use strict";

  var AUTH = root.DRAFTLINE_AUTH;
  var PUSH_DELAY = 1500;
  var REQUEST_TIMEOUT = 12000;
  var RETRY_STEPS = [5000, 15000, 45000, 60000];

  var user = null, keyState = "", keyRev = "", keyDirty = "";
  var timer = null, inflight = false, pending = null, conflictState = null;
  var retryAt = 0, retryTimer = null;

  function base() {
    var c = root.DRAFTLINE_CONFIG || {};
    return String(c.accountsApi || c.claudeProxy || "").replace(/\/+$/, "");
  }
  function readRaw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function writeRaw(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function rev()      { return parseInt(readRaw(keyRev) || "0", 10) || 0; }
  function setRev(n)  { writeRaw(keyRev, String(n)); }
  function dirty()    { return readRaw(keyDirty) === "1"; }
  function setDirty(on) { writeRaw(keyDirty, on ? "1" : "0"); }

  /** Enough to tell two of your own devices apart in a banner. Nothing more. */
  function deviceLabel() {
    var ua = navigator.userAgent || "";
    var os = /iPad/.test(ua) ? "iPad"
           : /iPhone/.test(ua) ? "iPhone"
           : /Android/.test(ua) ? "Android"
           : /Macintosh/.test(ua) ? "Mac"
           : /Windows/.test(ua) ? "Windows" : "a browser";
    var br = /Edg\//.test(ua) ? "Edge"
           : /Chrome\//.test(ua) ? "Chrome"
           : /Safari\//.test(ua) ? "Safari"
           : /Firefox\//.test(ua) ? "Firefox" : "";
    return br ? os + " · " + br : os;
  }

  /**
   * A saved draft has to have a league in it — every number on the board is
   * computed from one. Anything else is a blob from a different version, a
   * truncated write or an experiment, and adopting it hands the board an
   * undefined it will crash on. Better to leave the device on what it has.
   */
  function looksLikeADraft(raw) {
    try {
      var o = JSON.parse(raw);
      return !!(o && typeof o === "object" && o.league && typeof o.league === "object" &&
                o.league.teams && Array.isArray(o.picks));
    } catch (e) { return false; }
  }

  /**
   * The draft this browser saved under the old device-local profile.
   *
   * Before accounts, a profile id was minted per browser and the draft was filed
   * under `draftline.state.<that id>`. A new account gets a new id, so without
   * this the draft somebody had in progress would simply stop existing the first
   * time they signed in — technically still on disk, and gone as far as they can
   * tell. Newest profile wins; anything unreadable is skipped.
   */
  function legacyDraft() {
    try {
      var profiles = JSON.parse(localStorage.getItem("draftline.profiles") || "{}");
      var ids = Object.keys(profiles).sort(function (a, b) {
        return (profiles[b].lastSeen || 0) - (profiles[a].lastSeen || 0);
      });
      for (var i = 0; i < ids.length; i++) {
        var raw = readRaw("draftline.state." + ids[i]);
        if (raw && looksLikeADraft(raw)) return raw;
      }
    } catch (e) {}
    return null;
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { "content-type": "application/json" };
    var token = AUTH && AUTH.token();
    if (token) headers.Authorization = "Bearer " + token;

    // A request that never settles is worse than one that fails: it would hold
    // the in-flight latch and every later autosave behind it. Bad wifi does not
    // always answer with an error — sometimes it just stops talking.
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var killed = ctl && setTimeout(function () { ctl.abort(); }, REQUEST_TIMEOUT);

    return fetch(base() + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      keepalive: !!opts.keepalive,
      signal: ctl ? ctl.signal : undefined
    }).finally(function () { if (killed) clearTimeout(killed); })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok) return data;
          var err = new Error((data.error && data.error.message) || ("HTTP " + res.status));
          err.status = res.status; err.data = data;
          throw err;
        });
      });
  }

  var SYNC = {
    /** Set by the app to hear about adoption and conflicts. */
    onNotice: null,

    status: "idle",   // idle | syncing | saved | offline | conflict | off

    /**
     * Make localStorage agree with the account before the board reads it.
     * Always resolves — an unreachable server means the board opens on whatever
     * this device already had, which is the behavior that matters at draft time.
     */
    hydrate: function () {
      user = AUTH && AUTH.current();
      if (!user || !base()) { SYNC.status = "off"; return Promise.resolve({ mode: "local" }); }

      keyState = "draftline.state." + user.id;
      keyRev   = "draftline.rev."   + user.id;
      keyDirty = "draftline.dirty." + user.id;

      var localRaw = readRaw(keyState), broughtOver = false;
      if (!localRaw) {
        var old = legacyDraft();
        // Dirty on purpose: this draft has never been near the account, so if
        // the account already holds one, that is two real drafts and the
        // conflict path below has to ask rather than quietly drop either.
        if (old) { writeRaw(keyState, old); setDirty(true); localRaw = old; broughtOver = true; }
      }
      SYNC.status = "syncing";

      return api("/api/state").then(function (server) {
        var serverRev = server.rev || 0;

        // Nothing up there yet. If this device has a draft — the usual case the
        // first time an old device-local profile signs in to its new account —
        // it becomes the account's draft.
        if (!serverRev || server.state == null) {
          // Take the revision even when there is nothing in it. The account may
          // have been written and cleared, and a save that claims rev 0 against
          // a server sitting at rev 5 is a conflict over an empty draft.
          setRev(serverRev);
          if (localRaw) { setDirty(true); SYNC.push(localRaw); return { mode: "seeded", broughtOver: broughtOver }; }
          setDirty(false);
          return { mode: "empty" };
        }

        if (serverRev === rev()) {
          // This device is current. It may still owe an autosave from last time.
          if (dirty() && localRaw) SYNC.push(localRaw);
          SYNC.status = "saved";
          return { mode: "current" };
        }

        var incoming = typeof server.state === "string"
          ? server.state : JSON.stringify(server.state);

        if (!looksLikeADraft(incoming)) {
          // Do not overwrite a working board with something unreadable. Take the
          // revision so this device can write over it on the next save.
          setRev(serverRev);
          if (localRaw) { setDirty(true); SYNC.push(localRaw); }
          SYNC.status = "saved";
          return { mode: localRaw ? "seeded" : "empty", broughtOver: broughtOver };
        }

        if (!localRaw || !dirty()) {
          writeRaw(keyState, incoming);
          setRev(serverRev); setDirty(false);
          SYNC.status = "saved";
          return { mode: "adopted", from: server.device, at: server.updatedAt };
        }

        // Both moved. Keep this device running on its own draft and ask.
        conflictState = { rev: serverRev, state: incoming, device: server.device, at: server.updatedAt };
        SYNC.status = "conflict";
        return { mode: "conflict", from: server.device, at: server.updatedAt };
      }).catch(function (err) {
        SYNC.status = err && err.status === 401 ? "off" : "offline";
        return { mode: "offline" };
      });
    },

    /** Queue a save. Takes the exact JSON string that went into localStorage. */
    push: function (raw) {
      if (!user || !base() || SYNC.status === "off") return;
      pending = raw;
      setDirty(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, PUSH_DELAY);
    },

    /** Send anything queued right now — used on page hide. */
    flushNow: function () {
      if (timer) { clearTimeout(timer); timer = null; }
      flush(true);
    },

    hasConflict: function () { return !!conflictState; },
    conflict: function () { return conflictState; },

    /**
     * "theirs" takes the other device's draft and reloads onto it. "mine" keeps
     * this device's and overwrites the server. Both are destructive to one side,
     * which is why neither happens without being asked.
     */
    resolve: function (choice) {
      if (!conflictState) return Promise.resolve();
      if (choice === "theirs") {
        writeRaw(keyState, conflictState.state);
        setRev(conflictState.rev);
        setDirty(false);
        conflictState = null;
        return Promise.resolve({ reload: true });
      }
      var raw = readRaw(keyState);
      setRev(conflictState.rev);   // we are now writing on top of what is up there
      conflictState = null;
      SYNC.status = "syncing";
      return api("/api/state", {
        method: "PUT",
        body: { rev: rev(), force: true, state: raw, device: deviceLabel() }
      }).then(function (res) {
        setRev(res.rev); setDirty(false); SYNC.status = "saved";
        return { reload: false };
      }).catch(function () {
        SYNC.status = "offline";
        return { reload: false };
      });
    }
  };

  function notify(kind, info) {
    if (typeof SYNC.onNotice === "function") {
      try { SYNC.onNotice(kind, info || {}); } catch (e) {}
    }
  }

  function flush(keepalive) {
    if (inflight || pending == null || conflictState) return;
    var raw = pending;
    pending = null;
    inflight = true;
    SYNC.status = "syncing";

    api("/api/state", {
      method: "PUT",
      keepalive: !!keepalive,
      body: { rev: rev(), state: raw, device: deviceLabel() }
    }).then(function (res) {
      inflight = false;
      retryAt = 0;
      setRev(res.rev);
      if (pending == null) { setDirty(false); SYNC.status = "saved"; notify("saved", res); }
      else flush();
    }).catch(function (err) {
      inflight = false;
      if (err.status === 409 && err.data) {
        var d = err.data;
        var theirs = d.state == null ? null
          : (typeof d.state === "string" ? d.state : JSON.stringify(d.state));

        // Only a real draft on the other side is worth interrupting somebody
        // over. Anything else, catch up to the revision and write over it.
        if (!theirs || !looksLikeADraft(theirs)) {
          setRev(d.rev || 0);
          pending = raw;
          flush(keepalive);
          return;
        }
        conflictState = { rev: d.rev, state: theirs, device: d.device, at: d.updatedAt };
        SYNC.status = "conflict";
        notify("conflict", conflictState);
        return;
      }
      if (err.status === 401) { SYNC.status = "off"; notify("signedout", {}); return; }

      // Anything else is the network. The draft is safe in localStorage, so put
      // the write back at the front of the queue and keep trying on a backoff —
      // waiting for the next pick to retry would strand the last one of a draft.
      pending = pending == null ? raw : pending;
      setDirty(true);
      SYNC.status = "offline";
      notify("offline", {});
      scheduleRetry();
    });
  }

  function scheduleRetry() {
    if (retryTimer || conflictState) return;
    var wait = RETRY_STEPS[Math.min(retryAt, RETRY_STEPS.length - 1)];
    retryAt++;
    retryTimer = setTimeout(function () {
      retryTimer = null;
      flush();
    }, wait);
  }

  root.addEventListener("pagehide", function () { SYNC.flushNow(); });

  /* A backoff timer is the fallback, not the plan. Browsers throttle timers in a
     backgrounded tab to about once a minute, which is exactly the tab state a
     draft board is in while somebody is looking at the league site — so take the
     two events that actually say the situation changed. */
  root.addEventListener("online", function () { retryAt = 0; flush(); });
  root.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") SYNC.flushNow();
    else { retryAt = 0; flush(); }
  });

  root.DRAFTLINE_SYNC = SYNC;
})(globalThis);
