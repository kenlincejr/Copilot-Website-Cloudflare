(function () {
  const storageKey = "customer-zero-starter-kit-checks";

  function loadChecks() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }

  function saveChecks(checks) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checks));
    } catch {
      // localStorage can be disabled; the printed checklist still works.
    }
  }

  function initChecks() {
    const checks = loadChecks();
    document.querySelectorAll('input[type="checkbox"][data-save]').forEach((box) => {
      if (Object.prototype.hasOwnProperty.call(checks, box.id)) {
        box.checked = Boolean(checks[box.id]);
      }
      box.addEventListener("change", () => {
        checks[box.id] = box.checked;
        saveChecks(checks);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initChecks();
  });
})();
