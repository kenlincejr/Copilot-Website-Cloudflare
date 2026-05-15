(function () {
  const state = {
    questions: [],
    answers: {},
    index: 0
  };

  function valueForQuestion(question) {
    if (question.type === "checkbox") return state.answers[question.id] || [];
    return state.answers[question.id] ?? "";
  }

  function renderInput(question) {
    const value = valueForQuestion(question);
    if (question.type === "select") {
      return `
        <select id="${question.id}" aria-label="${question.label}">
          <option value="">Select an option</option>
          ${question.options.map((option) => `
            <option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>
          `).join("")}
        </select>
      `;
    }

    if (question.type === "number") {
      return `<input id="${question.id}" type="text" inputmode="numeric" pattern="[0-9]*" value="${value}" aria-label="${question.label}">`;
    }

    if (question.type === "checkbox") {
      return `
        <div class="checkbox-grid">
          ${question.options.map((option) => `
            <label class="check-option">
              <input type="checkbox" name="${question.id}" value="${option.value}" ${value.includes(option.value) ? "checked" : ""}>
              <span>${option.label}</span>
            </label>
          `).join("")}
        </div>
      `;
    }

    return `<input id="${question.id}" type="text" value="${value}" aria-label="${question.label}">`;
  }

  function captureCurrent() {
    const question = state.questions[state.index];
    if (!question) return true;

    if (question.type === "checkbox") {
      state.answers[question.id] = Array.from(document.querySelectorAll(`input[name="${question.id}"]:checked`)).map((item) => item.value);
    } else {
      const input = document.getElementById(question.id);
      state.answers[question.id] = input ? input.value : "";
    }

    window.FrontierNavigator.saveAssessment(state.answers);
    return validateQuestion(question);
  }

  function validateQuestion(question) {
    const error = document.querySelector("[data-form-error]");
    if (error) error.textContent = "";
    if (!question.required) return true;
    const value = state.answers[question.id];
    const invalid = Array.isArray(value) ? value.length === 0 : value === "" || value === null || value === undefined;
    if (invalid && error) {
      error.textContent = "Answer this question before continuing.";
      return false;
    }
    return true;
  }

  function renderQuestion() {
    const question = state.questions[state.index];
    const mount = document.querySelector("[data-question]");
    const progress = Math.round(((state.index + 1) / state.questions.length) * 100);
    document.querySelector("[data-progress-fill]").style.setProperty("--w", `${progress}%`);
    document.querySelector("[data-progress-text]").textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    document.querySelector("[data-progress-percent]").textContent = `${progress}% complete`;

    mount.innerHTML = `
      <div class="question-number">Question ${state.index + 1} of ${state.questions.length}</div>
      <h1 class="question-title">${question.label}</h1>
      <p class="help-text">${question.help}</p>
      <div class="field-control">${renderInput(question)}</div>
      <p class="form-error" data-form-error></p>
      <div class="action-row" style="margin-top:24px;">
        <button class="button secondary" type="button" data-prev ${state.index === 0 ? "disabled" : ""}>Back</button>
        <button class="button ghost" type="button" data-save>Save</button>
        <button class="button primary" type="button" data-next>${state.index === state.questions.length - 1 ? "See results" : "Next"}</button>
      </div>
    `;

    document.querySelector("[data-prev]").addEventListener("click", () => {
      captureCurrent();
      state.index = Math.max(0, state.index - 1);
      renderQuestion();
    });

    document.querySelector("[data-save]").addEventListener("click", () => {
      captureCurrent();
      const error = document.querySelector("[data-form-error]");
      if (error) error.textContent = "Saved locally in this browser.";
    });

    document.querySelector("[data-next]").addEventListener("click", () => {
      if (!captureCurrent()) return;
      if (state.index === state.questions.length - 1) {
        location.href = "results.html";
        return;
      }
      state.index += 1;
      renderQuestion();
    });
  }

  async function init() {
    const mount = document.querySelector("[data-question]");
    if (!mount) return;
    state.answers = window.FrontierNavigator.loadAssessment();
    state.questions = await window.FrontierUI.loadJson("../data/questions.json");
    const firstUnanswered = state.questions.findIndex((question) => {
      const value = state.answers[question.id];
      return question.required && (value === undefined || value === "" || value === null);
    });
    state.index = firstUnanswered >= 0 ? firstUnanswered : 0;
    renderQuestion();

    document.querySelector("[data-clear]").addEventListener("click", () => {
      localStorage.removeItem(window.FrontierNavigator.STORAGE_KEY);
      state.answers = {};
      state.index = 0;
      renderQuestion();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
