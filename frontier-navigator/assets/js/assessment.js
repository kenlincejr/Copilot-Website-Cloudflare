(function () {
  const state = {
    questions: [],
    answers: {},
    index: 0
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function isVisible(question, answers) {
    return window.FrontierNavigator.isVisible(question, answers);
  }

  function visibleQuestions() {
    return state.questions.filter((question) => isVisible(question, state.answers));
  }

  function current() {
    return visibleQuestions()[state.index];
  }

  function valueForQuestion(question) {
    if (question.type === "checkbox") return Array.isArray(state.answers[question.id]) ? state.answers[question.id] : [];
    return state.answers[question.id] ?? "";
  }

  function renderInput(question) {
    const value = valueForQuestion(question);
    if (question.type === "select") {
      return `
        <div class="option-grid${question.options.length > 4 ? " dense" : ""}" role="radiogroup" aria-label="${escapeHtml(question.label)}">
          ${question.options.map((option, i) => `
            <button type="button" class="option-card${option.value === value ? " selected" : ""}" role="radio"
              aria-checked="${option.value === value}" data-option="${escapeHtml(option.value)}">
              <span class="option-key" aria-hidden="true">${i + 1}</span>
              <span class="option-text">
                <span class="option-label">${escapeHtml(option.label)}</span>
                ${option.hint ? `<span class="option-hint">${escapeHtml(option.hint)}</span>` : ""}
              </span>
            </button>
          `).join("")}
        </div>
      `;
    }

    if (question.type === "number") {
      return `
        <div class="stepper">
          <button type="button" class="stepper-btn" data-step="-1" aria-label="Decrease">&minus;</button>
          <input id="${question.id}" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off"
            value="${escapeHtml(value)}" placeholder="0" aria-label="${escapeHtml(question.label)}">
          <button type="button" class="stepper-btn" data-step="1" aria-label="Increase">+</button>
          ${question.unit ? `<span class="stepper-unit">${escapeHtml(question.unit)}</span>` : ""}
        </div>
      `;
    }

    if (question.type === "checkbox") {
      return `
        <div class="checkbox-grid">
          ${question.options.map((option) => `
            <label class="check-option${value.includes(option.value) ? " selected" : ""}">
              <input type="checkbox" name="${question.id}" value="${escapeHtml(option.value)}" ${value.includes(option.value) ? "checked" : ""}>
              <span class="option-text">
                <span class="option-label">${escapeHtml(option.label)}</span>
                ${option.hint ? `<span class="option-hint">${escapeHtml(option.hint)}</span>` : ""}
              </span>
            </label>
          `).join("")}
        </div>
      `;
    }

    return `<input id="${question.id}" type="text" value="${escapeHtml(value)}" aria-label="${escapeHtml(question.label)}">`;
  }

  function captureCurrent() {
    const question = current();
    if (!question) return true;

    if (question.type === "checkbox") {
      state.answers[question.id] = Array.from(document.querySelectorAll(`input[name="${question.id}"]:checked`)).map((item) => item.value);
    } else if (question.type === "number" || question.type === "text") {
      const input = document.getElementById(question.id);
      state.answers[question.id] = input ? input.value.trim() : "";
    }
    // select answers are written on click.

    pruneHidden();
    window.FrontierNavigator.saveAssessment(state.answers);
    return validateQuestion(question);
  }

  // Drop answers to questions that a changed upstream answer has hidden, so a
  // stale branch can never feed the score.
  function pruneHidden() {
    state.answers = window.FrontierNavigator.pruneAnswers(state.questions, state.answers);
  }

  function setError(text) {
    const error = document.querySelector("[data-form-error]");
    if (error) error.textContent = text || "";
  }

  function validateQuestion(question) {
    setError("");
    const value = state.answers[question.id];
    if (question.type === "number") {
      if (value === "" || value === undefined) {
        if (!question.required) return true;
        setError("Enter a number, or 0 if none.");
        return false;
      }
      if (!/^\d+$/.test(String(value))) {
        setError("Enter a whole number, using digits only.");
        return false;
      }
      const n = Number(value);
      if (question.max !== undefined && n > question.max) {
        setError(`That looks high. The most this question accepts is ${question.max.toLocaleString()}.`);
        return false;
      }
      return true;
    }
    if (!question.required) return true;
    const invalid = Array.isArray(value) ? value.length === 0 : value === "" || value === null || value === undefined;
    if (invalid) {
      setError("Pick an answer to continue.");
      return false;
    }
    return true;
  }

  function renderLive() {
    const mount = document.querySelector("[data-live-estimate]");
    if (!mount || !window.FrontierNavigator) return;
    const summary = window.FrontierNavigator.summarize(state.answers);
    const answered = visibleQuestions().filter((q) => {
      const v = state.answers[q.id];
      return Array.isArray(v) ? v.length > 0 || !q.required : v !== undefined && v !== "";
    }).length;
    if (answered < 2) {
      mount.innerHTML = `<p class="live-empty">Your running estimate appears here as you answer.</p>`;
      return;
    }
    mount.innerHTML = `
      <div class="live-score">
        <span class="live-number">${summary.pcs.total}</span>
        <span class="live-of">/ 100</span>
      </div>
      <div class="live-caption">${escapeHtml(summary.pcs.areaLabel)} points, running estimate</div>
      <div class="live-track"><span style="--w:${Math.min(100, summary.pcs.total)}%"></span><i style="left:70%"></i></div>
      <div class="live-stage">Stage so far: <strong>${escapeHtml(summary.stageDefinition.name)}</strong></div>
    `;
  }

  function renderDots(list) {
    const mount = document.querySelector("[data-step-dots]");
    if (!mount) return;
    mount.innerHTML = list.map((q, i) => {
      const v = state.answers[q.id];
      const done = Array.isArray(v) ? true : v !== undefined && v !== "";
      return `<button type="button" class="step-dot${i === state.index ? " current" : ""}${done ? " done" : ""}"
        data-jump="${i}" aria-label="Question ${i + 1}${done ? ", answered" : ""}" ${done || i <= state.index ? "" : "disabled"}></button>`;
    }).join("");
    mount.querySelectorAll("[data-jump]").forEach((dot) => {
      dot.addEventListener("click", () => {
        captureCurrent();
        state.index = Number(dot.dataset.jump);
        renderQuestion();
      });
    });
  }

  function goNext() {
    if (!captureCurrent()) {
      const card = document.querySelector("[data-question]");
      if (card) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
      return;
    }
    const list = visibleQuestions();
    if (state.index >= list.length - 1) {
      location.href = "results.html";
      return;
    }
    state.index += 1;
    renderQuestion("forward");
  }

  function renderQuestion(direction) {
    const list = visibleQuestions();
    if (state.index > list.length - 1) state.index = list.length - 1;
    const question = list[state.index];
    const mount = document.querySelector("[data-question]");
    const progress = Math.round((state.index / list.length) * 100);
    document.querySelector("[data-progress-fill]").style.setProperty("--w", `${progress}%`);
    document.querySelector("[data-progress-text]").textContent = `Question ${state.index + 1} of ${list.length}`;
    document.querySelector("[data-progress-percent]").textContent = `${progress}% complete`;
    const isLast = state.index === list.length - 1;

    mount.innerHTML = `
      <div class="question-inner${direction === "forward" ? " enter" : ""}" data-qid="${question.id}">
        <div class="question-number">${question.section ? `<span class="question-section">${escapeHtml(question.section)}</span>` : ""}Question ${state.index + 1} of ${list.length}</div>
        <h1 class="question-title">${escapeHtml(question.label)}</h1>
        <p class="help-text">${escapeHtml(question.help)}</p>
        <div class="field-control">${renderInput(question)}</div>
        <p class="form-error" data-form-error role="alert"></p>
        <div class="action-row question-actions">
          <button class="button secondary" type="button" data-prev ${state.index === 0 ? "disabled" : ""}>Back</button>
          <button class="button primary" type="button" data-next>${isLast ? "See my results" : "Next"}</button>
          <span class="key-hint">${question.type === "select" ? "Press 1-" + question.options.length + " to pick, Enter to continue" : "Press Enter to continue"}</span>
        </div>
      </div>
    `;

    mount.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        state.answers[question.id] = button.dataset.option;
        pruneHidden();
        window.FrontierNavigator.saveAssessment(state.answers);
        mount.querySelectorAll("[data-option]").forEach((b) => {
          const on = b === button;
          b.classList.toggle("selected", on);
          b.setAttribute("aria-checked", String(on));
        });
        setError("");
        renderLive();
        renderDots(visibleQuestions());
        // Single-choice questions advance on their own after a beat.
        clearTimeout(state.advanceTimer);
        state.advanceTimer = setTimeout(goNext, 260);
      });
    });

    mount.querySelectorAll("[data-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(question.id);
        const n = /^\d+$/.test(input.value.trim()) ? Number(input.value.trim()) : 0;
        const next = Math.max(question.min || 0, Math.min(question.max ?? Infinity, n + Number(button.dataset.step)));
        input.value = String(next);
        captureCurrent();
        renderLive();
      });
    });

    mount.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.addEventListener("change", () => {
        box.closest(".check-option").classList.toggle("selected", box.checked);
        captureCurrent();
        renderLive();
      });
    });

    const textInput = mount.querySelector('input[type="text"]');
    if (textInput) {
      textInput.addEventListener("input", () => { captureCurrent(); renderLive(); });
      if (window.matchMedia("(min-width: 721px)").matches) textInput.focus();
    }

    mount.querySelector("[data-prev]").addEventListener("click", () => {
      clearTimeout(state.advanceTimer);
      captureCurrent();
      state.index = Math.max(0, state.index - 1);
      renderQuestion();
    });
    mount.querySelector("[data-next]").addEventListener("click", () => {
      clearTimeout(state.advanceTimer);
      goNext();
    });

    renderLive();
    renderDots(list);
  }

  function onKey(event) {
    if (event.target && event.target.tagName === "BUTTON" && event.key === "Enter") return;
    const question = current();
    if (!question) return;
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(state.advanceTimer);
      goNext();
      return;
    }
    if (question.type === "select" && /^[1-9]$/.test(event.key) && !(event.target && event.target.tagName === "INPUT")) {
      const button = document.querySelectorAll("[data-option]")[Number(event.key) - 1];
      if (button) button.click();
    }
  }

  async function init() {
    const mount = document.querySelector("[data-question]");
    if (!mount) return;
    state.answers = window.FrontierNavigator.loadAssessment();
    state.questions = await window.FrontierUI.loadJson("../data/questions.json");
    pruneHidden();
    const list = visibleQuestions();
    const firstUnanswered = list.findIndex((question) => {
      const value = state.answers[question.id];
      return question.required && (value === undefined || value === "" || value === null);
    });
    state.index = firstUnanswered >= 0 ? firstUnanswered : 0;
    renderQuestion();
    document.addEventListener("keydown", onKey);

    document.querySelector("[data-clear]").addEventListener("click", () => {
      window.FrontierNavigator.clearAssessment();
      state.answers = {};
      state.index = 0;
      renderQuestion();
    });
  }

  window.FrontierAssessment = { isVisible };
  document.addEventListener("DOMContentLoaded", init);
})();
