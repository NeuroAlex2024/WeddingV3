(function () {
  function attachDashboardView(App) {
    Object.assign(App, {
      renderDashboard() {
        this.ensureProfile();
        this.ensureDashboardData();
        this.state.websiteFormOpen = null;
        this.state.websiteFormDraft = null;
        this.teardownChecklistFocusTrap();
        const profile = this.state.profile;
        const hasProfile = Boolean(profile);
        const quizCompleted = Boolean(profile && profile.quizCompleted);
        const summaryItems = [];
        if (hasProfile && profile.vibe && profile.vibe.length) {
          summaryItems.push(`Атмосфера: ${profile.vibe.join(", ")}`);
        }
        if (hasProfile && profile.style) {
          summaryItems.push(`Стиль: ${profile.style}`);
        }
        if (hasProfile && profile.city) {
          summaryItems.push(`Город: ${profile.city}`);
        }
        if (hasProfile && quizCompleted && profile.guests) {
          summaryItems.push(`Гостей: ${profile.guests}`);
        }
        if (hasProfile && profile.budgetRange) {
          summaryItems.push(`Бюджет: ${profile.budgetRange}`);
        }
        const summaryLine = summaryItems.length
          ? `<div class="summary-line">${summaryItems.map((item) => `<span>${item}</span>`).join("")}</div>`
          : "";
        const summaryFallback = "";
        const introBlock = hasProfile ? summaryLine || summaryFallback : "";
        const heading = hasProfile
          ? `${profile.groomName || "Жених"} + ${profile.brideName || "Невеста"}, добро пожаловать!`
          : "Планирование свадьбы без стресса";
        const headingSubtext = hasProfile
          ? `<p class="dashboard-subtitle">Здесь вы можете собрать все необходимое для свадьбы мечты.</p>`
          : "";
        const heroImage = `
          <div class="dashboard-hero-image">
            <img src="https://images.unsplash.com/photo-1542379510-1026e928ed4f?q=80&w=3118&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Счастливая пара на свадьбе">
          </div>
        `;
        const daysBlock = hasProfile ? this.renderCountdown(profile) : "";
        const navItems = DASHBOARD_NAV_ITEMS.map((item) => `
          <button type="button" class="dashboard-nav__item" data-modal-target="${item.id}" data-title="${item.title}">
            ${item.title}
          </button>
        `).join("");
        const toolsCards = DASHBOARD_TOOL_ITEMS.map((item) => {
          let extraAttributes = "";
          if (item.id === "tools-test") {
            extraAttributes += ' data-tool-type="quiz"';
          }
          if (item.id === "tools-website") {
            extraAttributes += ' data-route="#/website"';
          }
          return `
          <button type="button" class="tool-card" data-modal-target="${item.id}" data-title="${item.title}"${extraAttributes}>
            <span class="tool-card__title">${item.title}</span>
            <span class="tool-card__description">${item.description}</span>
          </button>
        `;
        }).join("");
        const isChecklistExpanded = Boolean(this.state.isChecklistExpanded);
        const checklistOverlay = isChecklistExpanded
          ? '<button type="button" class="checklist-overlay" data-action="collapse-checklist" aria-label="Свернуть чек лист"></button>'
          : "";
        const checklistContainerClasses = [
          "dashboard-module",
          "checklist",
          isChecklistExpanded ? "checklist--expanded" : ""
        ]
          .filter(Boolean)
          .join(" ");
        const modulesClasses = [
          "dashboard-modules",
          isChecklistExpanded ? "dashboard-modules--checklist-expanded" : ""
        ]
          .filter(Boolean)
          .join(" ");
        const expandLabel = isChecklistExpanded ? "Свернуть чек лист" : "Развернуть чек лист";
        const expandIcon = isChecklistExpanded ? "✕" : "⤢";
        const backgroundInertAttributes = isChecklistExpanded ? ' aria-hidden="true" tabindex="-1"' : "";
        const checklistEditingId = this.state.checklistEditingId;
        const checklistDraft = this.state.checklistEditingDraft || {};
        const { tasks: checklistTasks, folders: checklistFolders } = this.getChecklistCollections(profile);
        this.syncChecklistFolderCollapse(checklistFolders);
        const checklistItems = this.renderChecklistItems(checklistTasks, checklistFolders);
        const budgetEntries = Array.isArray(profile?.budgetEntries) ? profile.budgetEntries : [];
        const decoratedBudgetEntries = budgetEntries.map((entry, index) => {
          const amountValue = Number(entry.amount);
          const amount = Number.isFinite(amountValue) ? Math.max(0, Math.round(amountValue)) : 0;
          const colors = this.BUDGET_COLORS && this.BUDGET_COLORS.length
            ? this.BUDGET_COLORS
            : ["#E07A8B"];
          const color = colors[index % colors.length];
          return {
            ...entry,
            color,
            amount
          };
        });
        const totalBudget = decoratedBudgetEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
        const previousTotal = this.state.lastBudgetTotal || 0;
        this.state.lastBudgetTotal = totalBudget;
        const positiveEntries = decoratedBudgetEntries.filter((entry) => Number(entry.amount) > 0);
        let startAngle = 0;
        const segments = positiveEntries.map((entry, index) => {
          const fraction = totalBudget > 0 ? Number(entry.amount) / totalBudget : 0;
          const endAngle = index === positiveEntries.length - 1 ? 360 : startAngle + fraction * 360;
          const segment = `${entry.color} ${startAngle.toFixed(2)}deg ${endAngle.toFixed(2)}deg`;
          startAngle = endAngle;
          return segment;
        });
        const chartBackground = segments.length
          ? `conic-gradient(from -90deg, ${segments.join(", ")})`
          : "conic-gradient(from -90deg, rgba(224, 122, 139, 0.25) 0deg 360deg)";
        const budgetVisual = decoratedBudgetEntries.length
          ? decoratedBudgetEntries
              .map((entry, index) => {
                const amount = Number(entry.amount || 0);
                const displayId = `budget-amount-${entry.id || index}`;
                const isEditing = this.state.budgetEditingId === entry.id;
                if (isEditing) {
                  const draft = this.state.budgetEditingDraft || {};
                  return `
                    <div class="budget-item budget-item--editing" data-budget-id="${entry.id}" style="--budget-color: ${entry.color};">
                      <input type="text" value="${this.escapeHtml(draft.title ?? entry.title ?? "")}" data-field="title">
                      <input type="number" value="${draft.amount ?? amount}" data-field="amount" min="0" step="1000">
                      <div class="budget-item__actions">
                        <button type="button" class="secondary" data-action="budget-cancel">Отмена</button>
                        <button type="button" data-action="budget-save">Сохранить</button>
                      </div>
                    </div>
                  `;
                }
                const amountFormatted = this.formatCurrency(amount);
                return `
                  <div class="budget-item" data-budget-id="${entry.id}" style="--budget-color: ${entry.color};">
                    <div class="budget-item__header">
                      <span class="budget-item__title">${this.escapeHtml(entry.title || "Новая статья")}</span>
                      <span class="budget-item__amount" id="${displayId}">${amountFormatted}</span>
                    </div>
                    <div class="budget-item__actions">
                      <button type="button" class="icon-button" data-action="budget-edit" aria-label="Редактировать">
                        ✎
                      </button>
                      <button type="button" class="icon-button" data-action="budget-delete" aria-label="Удалить">
                        ✕
                      </button>
                    </div>
                  </div>
                `;
              })
              .join("")
          : `<p class="budget-empty">Добавьте несколько статей расходов, чтобы увидеть распределение бюджета.</p>`;
        const marketplaceModule = this.renderMarketplaceModule(profile);
        const backgroundInertAttributesChecklist = isChecklistExpanded ? ' inert aria-hidden="true" tabindex="-1"' : "";
        this.appEl.innerHTML = `
          <section class="dashboard">
            <header class="dashboard-header"${backgroundInertAttributesChecklist}>
              <div class="dashboard-hero">
                <div class="dashboard-hero__text">
                  <h1>${heading}</h1>
                  ${headingSubtext}
                  ${introBlock}
                  ${daysBlock}
                  <div class="dashboard-actions">
                    <button type="button" class="secondary" data-action="open-quiz" data-route="#/quiz">
                      Пройти квиз заново
                    </button>
                    <button type="button" data-action="invite-export">Скачать приглашение</button>
                  </div>
                </div>
                ${heroImage}
              </div>
              <nav class="dashboard-nav" aria-label="Панель управления">
                ${navItems}
              </nav>
            </header>
            <div class="dashboard-modules-wrapper">
              <div class="dashboard-modules__background"${backgroundInertAttributes}></div>
              ${checklistOverlay}
              <div class="${modulesClasses}">
                <section class="${checklistContainerClasses}" data-area="checklist" aria-labelledby="checklist-title">
                  <div class="module-header">
                    <h2 id="checklist-title">Чек-лист подготовки</h2>
                    <button type="button" class="secondary" data-action="toggle-checklist">
                      ${expandIcon} ${expandLabel}
                    </button>
                  </div>
                  <div class="checklist-content">
                    ${checklistItems}
                  </div>
                  <footer class="checklist-footer">
                    <button type="button" data-action="checklist-add">Добавить задачу</button>
                    <button type="button" class="secondary" data-action="checklist-reset">Сбросить прогресс</button>
                  </footer>
                </section>
                <section class="dashboard-module budget" data-area="budget" aria-labelledby="budget-title"${backgroundInertAttributes}>
                  <div class="module-header">
                    <h2 id="budget-title">Бюджет</h2>
                  </div>
                  <div class="budget-summary">
                    <div class="budget-summary__chart" role="img" aria-label="Итоговый бюджет: ${this.formatCurrency(totalBudget)}" style="--budget-chart-bg: ${chartBackground};">
                      <div class="budget-summary__total">
                        <span class="budget-summary__value" id="budget-total" data-previous="${previousTotal}">${this.formatCurrency(totalBudget)}</span>
                      </div>
                    </div>
                  </div>
                  <div class="budget-visual">
                    ${budgetVisual}
                  </div>
                  <form id="budget-form" class="budget-form">
                    <div class="budget-form__fields">
                      <label for="budget-title" class="sr-only">Название статьи расходов</label>
                      <input id="budget-title" type="text" name="title" placeholder="Название" required>
                      <label for="budget-amount" class="sr-only">Сумма</label>
                      <input id="budget-amount" type="number" name="amount" placeholder="Сумма" min="0" step="1000" required>
                    </div>
                    <button type="submit">Добавить расход</button>
                  </form>
                </section>
                ${marketplaceModule}
              </div>
            </div>
          </section>
        `;
        document.body.classList.toggle("checklist-expanded", this.state.isChecklistExpanded);
        this.bindDashboardEvents(previousTotal, totalBudget);
      }
    });
  }

  window.AppViews = window.AppViews || {};
  window.AppViews.attachDashboard = attachDashboardView;
})();
