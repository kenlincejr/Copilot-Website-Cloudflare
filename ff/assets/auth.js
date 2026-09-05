/* DRAFTLINE auth — an account, not a device record.

   This used to keep profiles in localStorage: the name and password you made in
   one browser existed only in that browser, so signing in from a phone answered
   "No profile with that name on this device." That was true and it was useless.

   Accounts now live in the Worker (see worker/src/accounts.js). The password is
   sent over TLS and hashed there with PBKDF2-SHA256; what stays on this device
   is a session token and the display name, so current() can answer synchronously
   on page load without a round trip. The token is checked on the first real API
   call, and a rejected token signs you out.

   There is still no email on file, so there is still no password reset. The UI
   says so on the way in.

   Creating an account also takes a one-use signup code, issued out of band. The
   board spends a shared Anthropic key on every brief, so an account anyone can
   make is a bill anyone can run up. */
(function (root) {
  "use strict";

  var SESSION = "draftline.session";   // { token, user: { id, name } }
  var RECENT  = "draftline.recent";    // names typed on this device, newest first

  // Must match CODE_ALPHABET and CODE_LEN in worker/src/accounts.js. Kept here
  // only so a dropped character costs a typo message instead of a round trip;
  // the server never trusts this and re-normalizes everything it is sent.
  var CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  var CODE_LEN = 8;

  /** Fold a typed code to its canonical form, or "" if it cannot be one. */
  function normalizeCode(input) {
    var s = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (s.length !== CODE_LEN) return "";
    for (var i = 0; i < s.length; i++) {
      if (CODE_ALPHABET.indexOf(s.charAt(i)) < 0) return "";
    }
    return s;
  }

  function base() {
    var c = root.DRAFTLINE_CONFIG || {};
    return String(c.accountsApi || c.claudeProxy || "").replace(/\/+$/, "");
  }

  function read(key, dflt) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : dflt; }
    catch (e) { return dflt; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }
  function drop(key) { try { localStorage.removeItem(key); } catch (e) {} }

  /** Remember names for the one-tap pills on the sign-in screen. Names only. */
  function remember(name) {
    var list = read(RECENT, []).filter(function (n) { return n !== name; });
    list.unshift(name);
    write(RECENT, list.slice(0, 6));
  }

  /**
   * One place where every network failure turns into a sentence a person can
   * act on. A draft happens on a hotel wifi at 7pm; "TypeError: Failed to
   * fetch" is not a useful thing to put in front of somebody at that moment.
   */
  function call(path, opts) {
    opts = opts || {};
    var url = base() + path;
    if (!base()) {
      return Promise.reject(new Error(
        "This build has no accounts server configured, so signing in can't work. " +
        "Set claudeProxy in assets/config.js."));
    }
    var headers = { "content-type": "application/json" };
    var s = read(SESSION, null);
    if (s && s.token && !opts.anon) headers.Authorization = "Bearer " + s.token;

    // Without this a connection that hangs rather than fails leaves the Sign in
    // button disabled and the page looking dead.
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var killed = ctl && setTimeout(function () { ctl.abort(); }, 15000);

    return fetch(url, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      keepalive: !!opts.keepalive,
      signal: ctl ? ctl.signal : undefined
    }).finally(function () { if (killed) clearTimeout(killed); })
      .then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok) return data;
        if (res.status === 401 && data.signedOut && !opts.anon) AUTH.logout(true);
        var err = new Error((data.error && data.error.message) || ("Request failed (" + res.status + ")."));
        err.status = res.status;
        err.data = data;
        throw err;
      });
    }, function () {
      throw new Error("Can't reach the Draftline server. Check the connection and try again.");
    });
  }

  var AUTH = {
    /** Names used on this device — a convenience, not a list of accounts. */
    list: function () {
      return read(RECENT, []).map(function (n) { return { name: n }; });
    },

    /** Exposed so the sign-in screen can format the field as it is typed. */
    normalizeCode: normalizeCode,

    create: function (name, password, invite) {
      name = String(name || "").trim();
      var code = normalizeCode(invite);
      if (!code) {
        return Promise.reject(new Error(
          "That signup code doesn't look right — it's eight characters, like K7M2-PQ4X."));
      }
      if (name.length < 2) return Promise.reject(new Error("Pick a name with at least 2 characters."));
      if (String(password || "").length < 6) {
        return Promise.reject(new Error("Password needs at least 6 characters."));
      }
      if (!AUTH.storageWorks()) {
        return Promise.reject(new Error(
          "This browser is blocking local storage, so it can't hold a sign-in."));
      }
      return call("/api/signup", {
        method: "POST", anon: true,
        body: { name: name, password: password, invite: code }
      }).then(finish);
    },

    login: function (name, password) {
      name = String(name || "").trim();
      if (!AUTH.storageWorks()) {
        return Promise.reject(new Error(
          "This browser is blocking local storage, so it can't hold a sign-in."));
      }
      return call("/api/login", { method: "POST", anon: true, body: { name: name, password: password } })
        .then(finish);
    },

    /** Cached identity. Synchronous by design: the board renders off it. */
    current: function () {
      var s = read(SESSION, null);
      return s && s.user ? { id: s.user.id, name: s.user.name } : null;
    },

    token: function () {
      var s = read(SESSION, null);
      return s ? s.token : null;
    },

    /** Confirm the cached token is still good. Resolves to the user, or null. */
    verify: function () {
      if (!AUTH.current()) return Promise.resolve(null);
      return call("/api/session").then(function (d) {
        if (d && d.user) {
          var s = read(SESSION, null) || {};
          s.user = d.user;
          write(SESSION, s);
          return d.user;
        }
        return null;
      }, function (err) {
        // A dead token is signed out by call(); anything else is the network,
        // and the board still works offline off what is cached.
        return err.status === 401 ? null : AUTH.current();
      });
    },

    logout: function (localOnly) {
      if (!localOnly && AUTH.token()) {
        // keepalive so the request survives the navigation that follows.
        call("/api/logout", { method: "POST", keepalive: true }).catch(function () {});
      }
      drop(SESSION);
    },

    storageWorks: function () {
      try {
        localStorage.setItem("draftline.probe", "1");
        localStorage.removeItem("draftline.probe");
        return true;
      } catch (e) { return false; }
    }
  };

  function finish(data) {
    if (!data || !data.token || !data.user) throw new Error("The server didn't return a session.");
    write(SESSION, { token: data.token, user: data.user, at: Date.now() });
    remember(data.user.name);
    return data.user;
  }

  root.DRAFTLINE_AUTH = AUTH;
})(globalThis);
