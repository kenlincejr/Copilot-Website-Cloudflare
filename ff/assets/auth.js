/* DRAFTLINE auth — deliberately small.
   There is no server behind this page, so there is nowhere to hold an account.
   A profile is a record in this browser's localStorage; the password is stored
   as a PBKDF2-SHA256 hash with a random salt so it isn't sitting in plain text,
   and it gates the profile on this device only. It is not account security and
   the UI says so. Everything is namespaced under a profileId so a real backend
   can be added later without a migration. */
(function (root) {
  "use strict";

  var PROFILES = "draftline.profiles";
  var SESSION  = "draftline.session";
  var ITER = 150000;

  function read(key, dflt) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : dflt; }
    catch (e) { return dflt; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }
  function bytesToHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf),
      function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function randomHex(n) {
    var a = new Uint8Array(n);
    (root.crypto || {}).getRandomValues ? crypto.getRandomValues(a)
      : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    return bytesToHex(a);
  }

  /** PBKDF2 where WebCrypto is available; a labeled weak fallback otherwise. */
  function hash(password, salt) {
    var subtle = (root.crypto || {}).subtle;
    if (!subtle || !subtle.importKey) {
      // No WebCrypto (very old browser, or an exotic file:// context). Still
      // salted, but iterated in JS and much weaker — recorded in the record.
      var h = 0x811c9dc5, s = salt + "|" + password;
      for (var r = 0; r < 20000; r++) {
        for (var i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0;
        }
        s = h.toString(16) + salt;
      }
      return Promise.resolve({ kdf: "fnv-fallback", hash: h.toString(16) });
    }
    var enc = new TextEncoder();
    return subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (key) {
        return subtle.deriveBits({
          name: "PBKDF2", salt: enc.encode(salt), iterations: ITER, hash: "SHA-256"
        }, key, 256);
      })
      .then(function (bits) { return { kdf: "pbkdf2-sha256-" + ITER, hash: bytesToHex(bits) }; });
  }

  var AUTH = {
    list: function () {
      var p = read(PROFILES, {});
      return Object.keys(p).map(function (id) {
        return { id: id, name: p[id].name, created: p[id].created, lastSeen: p[id].lastSeen };
      }).sort(function (a, b) { return (b.lastSeen || 0) - (a.lastSeen || 0); });
    },

    exists: function (name) {
      var p = read(PROFILES, {}), key = String(name || "").trim().toLowerCase();
      return Object.keys(p).some(function (id) { return p[id].name.toLowerCase() === key; });
    },

    create: function (name, password) {
      name = String(name || "").trim();
      if (name.length < 2) return Promise.reject(new Error("Pick a name with at least 2 characters."));
      if (String(password || "").length < 4) return Promise.reject(new Error("Password needs at least 4 characters."));
      if (AUTH.exists(name)) return Promise.reject(new Error("That name already exists on this device."));
      var salt = randomHex(16), id = "p_" + randomHex(8);
      return hash(password, salt).then(function (h) {
        var all = read(PROFILES, {});
        all[id] = { id: id, name: name, salt: salt, hash: h.hash, kdf: h.kdf,
                    created: Date.now(), lastSeen: Date.now() };
        if (!write(PROFILES, all))
          throw new Error("This browser is blocking local storage, so a profile can't be saved.");
        write(SESSION, { profileId: id, at: Date.now() });
        return { id: id, name: name };
      });
    },

    login: function (name, password) {
      var all = read(PROFILES, {});
      var id = Object.keys(all).find(function (k) {
        return all[k].name.toLowerCase() === String(name || "").trim().toLowerCase();
      });
      if (!id) return Promise.reject(new Error("No profile with that name on this device."));
      var rec = all[id];
      return hash(password, rec.salt).then(function (h) {
        if (h.hash !== rec.hash) throw new Error("Wrong password.");
        rec.lastSeen = Date.now(); write(PROFILES, all);
        write(SESSION, { profileId: id, at: Date.now() });
        return { id: id, name: rec.name };
      });
    },

    current: function () {
      var s = read(SESSION, null); if (!s) return null;
      var all = read(PROFILES, {}), rec = all[s.profileId];
      return rec ? { id: rec.id, name: rec.name } : null;
    },

    logout: function () { try { localStorage.removeItem(SESSION); } catch (e) {} },

    /** Remove a profile and everything it owns. */
    destroy: function (id) {
      var all = read(PROFILES, {}); delete all[id]; write(PROFILES, all);
      try {
        localStorage.removeItem("draftline.state." + id);
        localStorage.removeItem("draftline.league." + id);
        localStorage.removeItem("draftline.claude." + id);
      } catch (e) {}
      var s = read(SESSION, null);
      if (s && s.profileId === id) AUTH.logout();
    },

    storageWorks: function () {
      try { localStorage.setItem("draftline.probe", "1"); localStorage.removeItem("draftline.probe"); return true; }
      catch (e) { return false; }
    }
  };

  root.DRAFTLINE_AUTH = AUTH;
})(globalThis);
