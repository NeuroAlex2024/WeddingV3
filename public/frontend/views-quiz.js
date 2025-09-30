(function () {
  function attachQuizView(App) {
    Object.assign(App, {
      renderQuiz() {
        this.teardownChecklistFocusTrap();
        document.body.classList.remove("checklist-expanded");
        if (this.state.isChecklistExpanded) {
          this.state.isChecklistExpanded = false;
          this.resetChecklistEditing();
        }
        this.state.websiteFormOpen = null;
        this.state.websiteFormDraft = null;
        this.ensureProfile();
        this.appEl.innerHTML = `
          <section class="card">
            <h1>Подбор профиля свадьбы</h1>
            <p>Ответьте на вопросы — мы настроим рекомендации под ваш стиль, город и бюджет.</p>
            <div class="progress" aria-hidden="true">
              <div class="progress__bar" id="quiz-progress"></div>
            </div>
            <p class="step-message" id="quiz-message" role="alert"></p>
            <div class="quiz-step" id="quiz-step"></div>
            <div class="actions">
              <button type="button" class="secondary" id="quiz-back">Назад</button>
              <button type="button" id="quiz-next">Далее</button>
            </div>
          </section>
        `;
        this.quizStepEl = document.getElementById("quiz-step");
        this.quizMessageEl = document.getElementById("quiz-message");
        this.progressBarEl = document.getElementById("quiz-progress");
        document.getElementById("quiz-back").addEventListener("click", () => {
          if (this.state.currentStep > 0) {
            this.state.currentStep -= 1;
            this.updateQuizView();
          }
        });
        document.getElementById("quiz-next").addEventListener("click", () => {
          this.handleQuizNext();
        });
        this.updateQuizView();
      }
    });
  }

  window.AppViews = window.AppViews || {};
  window.AppViews.attachQuiz = attachQuizView;
})();
