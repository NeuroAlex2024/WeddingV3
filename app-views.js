(function () {
  const core = window.AppCore || {};
  const monthNames = core.monthNames || [];
  const currencyFormatter = core.currencyFormatter || new Intl.NumberFormat("ru-RU");
  const BUDGET_COLORS = core.BUDGET_COLORS || [];
  const WEBSITE_THEMES = core.WEBSITE_THEMES || [];

  const AppViews = {
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
    },

    renderDashboard() {
      this.ensureProfile();
      this.ensureDashboardData();
      this.state.websiteFormOpen = null;
      this.state.websiteFormDraft = null;
      this.teardownChecklistFocusTrap();
      const profile = this.state.profile;
      const hasProfile = Boolean(profile);
      const quizCompleted = Boolean(profile && profile.quizCompleted);
      const serverSnapshot =
        typeof this.getServerProfileSnapshot === "function" ? this.getServerProfileSnapshot(profile) : null;
      const normalizedRole =
        typeof this.normalizeRole === "function"
          ? this.normalizeRole(serverSnapshot?.user?.role || profile?.role || this.state.currentRole)
          : this.state.currentRole;
      const activeServerProfile =
        typeof this.getActiveServerProfile === "function"
          ? this.getActiveServerProfile(serverSnapshot, normalizedRole)
          : null;
      const serverCompanyName =
        (activeServerProfile && typeof activeServerProfile.companyName === "string"
          ? activeServerProfile.companyName
          : profile?.companyName) || "";
      const serverCoupleNames =
        (activeServerProfile && typeof activeServerProfile.coupleNames === "string"
          ? activeServerProfile.coupleNames
          : profile?.coupleNames) || "";
      const serverLocation =
        (activeServerProfile && typeof activeServerProfile.location === "string"
          ? activeServerProfile.location
          : profile?.location) || "";
      const serverEventDate =
        (activeServerProfile && activeServerProfile.eventDate !== undefined
          ? activeServerProfile.eventDate
          : profile?.eventDate) || null;
      const summaryItems = [];
      if (hasProfile) {
        if (normalizedRole === "contractor" && serverCompanyName) {
          summaryItems.push(`Компания: ${this.escapeHtml(serverCompanyName)}`);
        } else if (serverCoupleNames) {
          summaryItems.push(`Пара: ${this.escapeHtml(serverCoupleNames)}`);
        }
        if (serverLocation) {
          summaryItems.push(`Локация: ${this.escapeHtml(serverLocation)}`);
        }
        const serverDateText =
          typeof this.formatServerEventDate === "function" ? this.formatServerEventDate(serverEventDate) : "";
        if (serverDateText) {
          summaryItems.push(`Дата: ${this.escapeHtml(serverDateText)}`);
        }
      }
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
      let headingText;
      if (!hasProfile) {
        headingText = "Планирование свадьбы без стресса";
      } else if (normalizedRole === "contractor") {
        const displayCompany = serverCompanyName || profile?.companyName || "Ваш профиль";
        headingText = `${displayCompany}, добро пожаловать!`;
      } else {
        const fallbackNames = `${profile?.groomName || "Жених"} + ${profile?.brideName || "Невеста"}`;
        const displayNames = serverCoupleNames || fallbackNames;
        headingText = `${displayNames}, добро пожаловать!`;
      }
      const heading = this.escapeHtml(headingText);
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
        const color = BUDGET_COLORS[index % BUDGET_COLORS.length];
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
                const draft = this.state.budgetEditingDraft || {
                  title: entry.title || "",
                  amount: String(amount ?? "")
                };
                return `
                  <div class="budget-visual__item budget-visual__item--editing" data-entry-id="${this.escapeHtml(entry.id)}">
                    <form class="budget-visual__edit" data-entry-id="${this.escapeHtml(entry.id)}">
                      <div class="budget-visual__edit-fields">
                        <span class="budget-visual__dot" style="--dot-color: ${entry.color}" aria-hidden="true"></span>
                        <div class="budget-visual__field">
                          <label for="budget-edit-title-${this.escapeHtml(entry.id)}" class="sr-only">Название статьи</label>
                          <input id="budget-edit-title-${this.escapeHtml(entry.id)}" type="text" name="title" value="${this.escapeHtml(draft.title || "")}" required>
                        </div>
                        <div class="budget-visual__field">
                          <label for="budget-edit-amount-${this.escapeHtml(entry.id)}" class="sr-only">Сумма</label>
                          <input id="budget-edit-amount-${this.escapeHtml(entry.id)}" type="number" name="amount" value="${this.escapeHtml(String(draft.amount ?? ""))}" min="0" step="1000" required>
                        </div>
                      </div>
                      <div class="budget-visual__edit-actions">
                        <button type="submit">Сохранить</button>
                        <button type="button" class="secondary" data-action="cancel-edit">Отменить</button>
                      </div>
                    </form>
                  </div>
                `;
              }
              return `
                <div class="budget-visual__item" data-entry-id="${this.escapeHtml(entry.id)}">
                  <div class="budget-visual__info">
                    <span class="budget-visual__dot" style="--dot-color: ${entry.color}" aria-hidden="true"></span>
                    <span class="budget-visual__title">${this.escapeHtml(entry.title || "")}</span>
                    <span class="budget-visual__amount" id="${this.escapeHtml(displayId)}" data-amount="${amount}">${this.formatCurrency(amount)}</span>
                    <div class="budget-visual__actions">
                      <button type="button" class="budget-visual__action" data-action="edit" data-entry-id="${this.escapeHtml(entry.id)}" aria-label="Редактировать статью">
                        <span aria-hidden="true">✏️</span>
                        <span class="sr-only">Изменить</span>
                      </button>
                      <button type="button" class="budget-visual__action budget-visual__action--danger" data-action="delete" data-entry-id="${this.escapeHtml(entry.id)}" aria-label="Удалить статью">
                        <span aria-hidden="true">🗑️</span>
                        <span class="sr-only">Удалить</span>
                      </button>
                    </div>
                  </div>
                  <div class="budget-visual__track">
                    <div class="budget-visual__bar" data-value="${amount}" data-total="${totalBudget}" style="--bar-color: ${entry.color}"></div>
                  </div>
                </div>
              `;
            })
            .join("")
        : '<p class="budget-empty">Добавьте статьи, чтобы увидеть распределение бюджета.</p>';
      const marketplaceModule = this.renderMarketplaceModule(backgroundInertAttributes);
      const warningBlock =
        this.state.profileSyncStatus === "degraded"
          ? '<div class="profile-warning" role="status" aria-live="polite">Сервер профиля временно недоступен. Показаны сохранённые данные.</div>'
          : "";
      this.appEl.innerHTML = `
        <section class="card dashboard">
          ${warningBlock}
          <nav class="dashboard-nav" aria-label="Основные разделы">
            ${navItems}
          </nav>
          ${heroImage}
          <header class="dashboard-header">
            <h1>${heading}</h1>
            ${headingSubtext}
            ${introBlock}
            ${daysBlock}
          </header>
          <div class="${modulesClasses}">
            ${checklistOverlay}
            <section class="${checklistContainerClasses}" data-area="checklist" aria-labelledby="checklist-title" data-expanded="${isChecklistExpanded}">
              <div class="module-header">
                <h2 id="checklist-title">Чек лист</h2>
                <div class="module-header__actions">
                  <button type="button" class="module-header__icon-button" data-action="create-checklist-folder" aria-label="Создать папку" title="Создать папку">
                    <span aria-hidden="true">📁</span>
                  </button>
                  <button type="button" class="module-header__icon-button" data-action="toggle-checklist-expand" aria-label="${expandLabel}" aria-expanded="${isChecklistExpanded}">
                    <span aria-hidden="true">${expandIcon}</span>
                  </button>
                </div>
              </div>
              <ul class="checklist-items">
                ${checklistItems}
              </ul>
              <form id="checklist-form" class="checklist-form" data-prevent-expand>
                <label for="checklist-input" class="sr-only">Новая задача</label>
                <input id="checklist-input" type="text" name="task" placeholder="Добавить задачу" autocomplete="off" required>
                <button type="submit">Добавить</button>
              </form>
            </section>
            <section class="dashboard-module tools" data-area="tools" aria-labelledby="tools-title"${backgroundInertAttributes}>
              <div class="module-header">
                <h2 id="tools-title">Инструменты</h2>
              </div>
              <div class="tools-grid">
                ${toolsCards}
              </div>
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
        </section>
      `;
      document.body.classList.toggle("checklist-expanded", this.state.isChecklistExpanded);
      this.bindDashboardEvents(previousTotal, totalBudget);
    },

    updateWebsitePreview() {
      const profile = this.state.profile || {};
      const invitation = this.ensureWebsiteInvitationData() || this.createDefaultWebsiteInvitation();
      const theme = this.resolveWebsiteTheme(invitation.theme);
      const isComplete = this.isWebsiteInvitationComplete(invitation);
      const previewMarkup = this.renderWebsitePreview(invitation, theme, isComplete);
      
      // Обновляем только предосмотр
      const previewEl = this.appEl.querySelector('.website-designer__preview');
      if (previewEl) {
        previewEl.innerHTML = previewMarkup;
      }
      
      // Обновляем переключатель музыки в боковой панели
      const musicToggle = this.appEl.querySelector('[data-action="website-music-toggle"]');
      if (musicToggle) {
        musicToggle.checked = invitation.enableMusic !== false;
        const toggleText = musicToggle.parentElement.querySelector('.website-summary__toggle-text');
        if (toggleText) {
          toggleText.textContent = invitation.enableMusic !== false ? 'Включена' : 'Отключена';
        }
      }
      this.bindMusicToggle();
    },

    renderWebsiteDesigner() {
      this.ensureProfile();
      this.teardownChecklistFocusTrap();
      document.body.classList.remove("checklist-expanded");
      const profile = this.state.profile || {};
      const invitation = this.ensureWebsiteInvitationData() || this.createDefaultWebsiteInvitation();
      const theme = this.resolveWebsiteTheme(invitation.theme);
      this.ensureWebsiteThemeFonts(theme);
      const isComplete = this.isWebsiteInvitationComplete(invitation);
      if (typeof this.state.websiteFormOpen !== "boolean") {
        this.state.websiteFormOpen = !isComplete;
      }
      const showForm = Boolean(this.state.websiteFormOpen);
      const themeStyle = this.buildWebsiteThemeStyle(theme);
      const previewMarkup = this.renderWebsitePreview(invitation, theme, isComplete);
      const themesMarkup = this.renderWebsiteThemes(invitation.theme);
      const summaryMarkup = this.renderWebsiteSummary(invitation);
      const formOverlay = showForm ? this.renderWebsiteForm(invitation, profile) : "";
      const disableActionsAttr = isComplete ? "" : " disabled";
      this.appEl.innerHTML = `
        <section class="website-designer-page">
          <header class="website-designer__header card">
            <div class="website-designer__header-left">
              <button type="button" class="secondary website-designer__back" data-action="website-back">← К инструментам</button>
              <div class="website-designer__title">
                <h1>Сайт-приглашение</h1>
                <p>Создайте персональную страницу свадьбы и поделитесь ею с гостями.</p>
              </div>
            </div>
            <div class="website-designer__actions">
              <button type="button" data-action="website-activate"${disableActionsAttr}>Активировать сайт</button>
              <button type="button" class="secondary" data-action="website-export"${disableActionsAttr}>Сохранить PDF</button>
            </div>
          </header>
          <div class="website-designer__layout">
            <div class="website-designer__preview card" data-theme="${this.escapeHtml(theme.id)}" style="${themeStyle}">
              ${previewMarkup}
            </div>
            <aside class="website-designer__sidebar card">
              <h2>Оформление</h2>
              <p>Выберите стиль, который отражает настроение вашего праздника.</p>
              <div class="website-themes">${themesMarkup}</div>
              <div class="website-summary">
                <h3>Детали события</h3>
                ${summaryMarkup}
                <button type="button" class="secondary website-summary__edit" data-action="website-edit">Изменить данные</button>
              </div>
            </aside>
          </div>
          ${formOverlay}
        </section>
      `;
      this.bindWebsiteDesignerEvents(invitation, isComplete, theme);
    },

    renderWebsitePreview(invitation, theme, isComplete) {
      const groom = invitation.groom && invitation.groom.trim().length ? invitation.groom.trim() : "Жених";
      const bride = invitation.bride && invitation.bride.trim().length ? invitation.bride.trim() : "Невеста";
      const dateText = this.formatWebsiteDate(invitation.date);
      const timeText = this.formatWebsiteTime(invitation.time);
      const venueName = invitation.venueName && invitation.venueName.trim().length ? invitation.venueName.trim() : "Место проведения";
      const venueAddressRaw = invitation.venueAddress && invitation.venueAddress.trim().length ? invitation.venueAddress.trim() : "Адрес уточняется";
      const venueAddress = this.escapeHtml(venueAddressRaw).replace(/\n/g, "<br>");
      const giftCard = invitation.giftCard && invitation.giftCard.trim().length ? invitation.giftCard.trim() : "";
      const dateParts = [];
      if (dateText) dateParts.push(dateText);
      if (timeText) dateParts.push(timeText);
      const dateLine = dateParts.length ? dateParts.join(" · ") : "Дата уточняется";
      const notice = isComplete
        ? ""
        : '<p class="website-preview__notice">Заполните анкету, чтобы активировать сайт и поделиться ссылкой с гостями.</p>';
      const giftBlock = giftCard
        ? `<div class="website-preview__gift"><span>Для подарков</span><strong>${this.escapeHtml(giftCard)}</strong></div>`
        : "";
      const tagline = theme && theme.tagline ? theme.tagline : "Приглашение на свадьбу";
      const enableMusic = invitation.enableMusic !== false; // По умолчанию включена
      const musicButton = enableMusic
        ? `<button class="music-button music-button--preview" id="previewMusicButton" onclick="togglePreviewMusic()">
            <span class="music-icon">🎵</span>
            <span id="previewMusicText">Включить<br>музыку</span>
          </button>`
        : '';
      
      return `
        <style>
          .website-preview__card {
            position: relative;
          }
          .music-button--preview {
            position: absolute;
            top: 1rem;
            right: 1rem;
            z-index: 10;
            padding: 0.2rem 0.4rem;
            font-size: 0.6rem;
            gap: 0.2rem;
            border-radius: 8px;
            line-height: 1.1;
            background: var(--website-accent);
            color: white;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: var(--website-body-font);
            font-weight: 500;
          }
          .music-button--preview:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          .music-button--preview.playing {
            background: var(--website-accent);
            opacity: 0.8;
          }
        </style>
        <div class="website-preview" aria-live="polite">
          <div class="website-preview__pattern" aria-hidden="true"></div>
          <div class="website-preview__card">
            ${musicButton}
            <p class="website-preview__eyebrow">${this.escapeHtml(tagline)}</p>
            <p class="website-preview__intro">Мы будем счастливы разделить этот день с вами.</p>
            <h2 class="website-preview__names">${this.escapeHtml(groom)} &amp; ${this.escapeHtml(bride)}</h2>
            <p class="website-preview__date">${this.escapeHtml(dateLine)}</p>
            <div class="website-preview__venue">
              <strong>${this.escapeHtml(venueName)}</strong>
              <span>${venueAddress}</span>
            </div>
            ${giftBlock}
            <p class="website-preview__closing">До встречи на празднике!</p>
            ${notice}
          </div>
        </div>
      `;
    },

    renderWebsiteThemes(currentThemeId) {
      if (!Array.isArray(WEBSITE_THEMES) || WEBSITE_THEMES.length === 0) {
        return '<p class="website-themes__empty">Стили скоро появятся.</p>';
      }
      return WEBSITE_THEMES.map((theme) => {
        if (!theme || typeof theme !== "object") {
          return "";
        }
        const isActive = theme.id === currentThemeId;
        const classes = ["website-theme", isActive ? "website-theme--active" : ""].filter(Boolean).join(" ");
        const swatchStyle = [
          theme.colors && theme.colors.accent ? `--theme-accent: ${theme.colors.accent}` : "",
          theme.colors && theme.colors.background ? `--theme-background: ${theme.colors.background}` : ""
        ]
          .filter(Boolean)
          .join("; ");
        return `
          <button type="button" class="${classes}" data-action="website-theme" data-theme-id="${this.escapeHtml(theme.id)}" style="${swatchStyle}">
            <span class="website-theme__preview" aria-hidden="true"></span>
            <span class="website-theme__text">
              <span class="website-theme__name">${this.escapeHtml(theme.name)}</span>
              <span class="website-theme__description">${this.escapeHtml(theme.description)}</span>
            </span>
          </button>
        `;
      }).join("");
    },

    renderWebsiteSummary(invitation) {
      const dateText = this.formatWebsiteDate(invitation.date) || "Добавьте дату";
      const timeText = this.formatWebsiteTime(invitation.time) || "Добавьте время";
      const venueName = invitation.venueName && invitation.venueName.trim().length ? invitation.venueName.trim() : "Название площадки";
      const venueAddress = invitation.venueAddress && invitation.venueAddress.trim().length
        ? this.escapeHtml(invitation.venueAddress.trim()).replace(/\n/g, "<br>")
        : "Адрес площадки";
      const giftCard = invitation.giftCard && invitation.giftCard.trim().length ? invitation.giftCard.trim() : "Добавьте номер карты";
      const updatedText = this.formatWebsiteUpdatedAt(invitation.updatedAt);
      const giftClass = invitation.giftCard && invitation.giftCard.trim().length ? "" : " website-summary__value--placeholder";
      const addressClass = invitation.venueAddress && invitation.venueAddress.trim().length ? "" : " website-summary__value--placeholder";
      const slug = invitation.publicSlug || invitation.publicId || "";
      const linkUrlRaw = invitation.publicUrl && invitation.publicUrl.trim().length
        ? invitation.publicUrl.trim()
        : this.buildPublicInvitationUrl(slug);
      const linkUrl = linkUrlRaw || "";
      const publishedText = slug ? this.formatWebsitePublishedAt(invitation.publishedAt) : "";
      const linkBlock = linkUrl
        ? `<li>
            <span class="website-summary__label">Публичная ссылка</span>
            <span class="website-summary__value website-summary__value--link">
              <a href="${this.escapeHtml(linkUrl)}" target="_blank" rel="noopener">${this.escapeHtml(linkUrl)}</a>
              <button type="button" class="website-summary__copy" data-action="website-copy-link" data-link="${this.escapeHtml(linkUrl)}">Скопировать</button>
            </span>
            ${publishedText ? `<span class="website-summary__hint">Активировано: ${this.escapeHtml(publishedText)}</span>` : ""}
          </li>`
        : "";
      const updatedBlock = updatedText
        ? `<p class="website-summary__updated">Обновлено: ${this.escapeHtml(updatedText)}</p>`
        : "";
      return `
        <ul class="website-summary__list">
          <li>
            <span class="website-summary__label">Дата</span>
            <span class="website-summary__value${dateText === "Добавьте дату" ? " website-summary__value--placeholder" : ""}">${this.escapeHtml(dateText)}</span>
          </li>
          <li>
            <span class="website-summary__label">Время</span>
            <span class="website-summary__value${timeText === "Добавьте время" ? " website-summary__value--placeholder" : ""}">${this.escapeHtml(timeText)}</span>
          </li>
          <li>
            <span class="website-summary__label">Место</span>
            <span class="website-summary__value">${this.escapeHtml(venueName)}</span>
          </li>
          <li>
            <span class="website-summary__label">Адрес</span>
            <span class="website-summary__value${addressClass}">${venueAddress}</span>
          </li>
          <li>
            <span class="website-summary__label">Подарки</span>
            <span class="website-summary__value${giftClass}">${this.escapeHtml(giftCard)}</span>
          </li>
          <li>
            <span class="website-summary__label">Музыка</span>
            <span class="website-summary__value">
              <label class="website-summary__toggle" for="musicToggle">
                <input type="checkbox" id="musicToggle" ${invitation.enableMusic !== false ? 'checked' : ''} data-action="website-music-toggle">
                <span class="website-summary__toggle-slider"></span>
                <span class="website-summary__toggle-text">${invitation.enableMusic !== false ? 'Включена' : 'Отключена'}</span>
              </label>
            </span>
          </li>
          ${linkBlock}
        </ul>
        ${updatedBlock}
      `;
    },

    renderWebsiteForm(invitation, profile) {
      const values = this.getWebsiteFormValuesForRender(invitation, profile);
      return `
        <div class="website-designer__overlay">
          <div class="website-designer__dialog" role="dialog" aria-modal="true" aria-labelledby="website-form-title">
            <h2 id="website-form-title">Заполните данные свадьбы</h2>
            <p class="website-form__subtitle">Эти данные автоматически появятся в приглашении и на сайте.</p>
            <form id="website-form" class="website-form">
              <div class="website-form__grid">
                <div class="website-form__field">
                  <label for="website-groom">Жених</label>
                  <input id="website-groom" name="groom" type="text" value="${this.escapeHtml(values.groom || "")}" placeholder="Иван" autocomplete="name" required>
                </div>
                <div class="website-form__field">
                  <label for="website-bride">Невеста</label>
                  <input id="website-bride" name="bride" type="text" value="${this.escapeHtml(values.bride || "")}" placeholder="Анна" autocomplete="name" required>
                </div>
                <div class="website-form__field">
                  <label for="website-date">Дата</label>
                  <input id="website-date" name="date" type="date" value="${this.escapeHtml(values.date || "")}" required>
                </div>
                <div class="website-form__field">
                  <label for="website-time">Время</label>
                  <input id="website-time" name="time" type="time" value="${this.escapeHtml(values.time || "")}" required>
                </div>
                <div class="website-form__field">
                  <label for="website-venue">Место (название)</label>
                  <input id="website-venue" name="venueName" type="text" value="${this.escapeHtml(values.venueName || "")}" placeholder="Сад Эрмитаж" required>
                </div>
                <div class="website-form__field website-form__field--wide">
                  <label for="website-address">Адрес</label>
                  <textarea id="website-address" name="venueAddress" rows="3" placeholder="Москва, Каретный ряд, 3" required>${this.escapeHtml(values.venueAddress || "")}</textarea>
                </div>
                <div class="website-form__field website-form__field--wide">
                  <label for="website-gift">Для денежных подарков (номер карты)</label>
                  <input id="website-gift" name="giftCard" type="text" value="${this.escapeHtml(values.giftCard || "")}" placeholder="0000 0000 0000 0000">
                  <p class="website-form__hint">Номер увидят только гости, у которых есть ссылка на сайт.</p>
                </div>
              </div>
              <div class="website-form__actions">
                <button type="submit">Сохранить</button>
                <button type="button" class="secondary" data-action="website-cancel-form">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      `;
    },
    bindWebsiteDesignerEvents(invitation, isComplete, theme) {
      const backButton = this.appEl.querySelector('[data-action="website-back"]');
      if (backButton) {
        backButton.addEventListener("click", () => {
          this.state.websiteFormOpen = null;
          this.state.websiteFormDraft = null;
          location.hash = "#/dashboard";
        });
      }
      const editButton = this.appEl.querySelector('[data-action="website-edit"]');
      if (editButton) {
        editButton.addEventListener("click", () => {
          this.state.websiteFormOpen = true;
          this.state.websiteFormDraft = null;
          this.renderWebsiteDesigner();
        });
      }
      this.appEl.querySelectorAll('[data-action="website-theme"]').forEach((button) => {
        button.addEventListener("click", () => {
          const themeId = button.dataset.themeId;
          this.setWebsiteTheme(themeId);
        });
      });
      const activateButton = this.appEl.querySelector('[data-action="website-activate"]');
      if (activateButton) {
        activateButton.addEventListener("click", async () => {
          if (activateButton.disabled) return;
          activateButton.disabled = true;
          activateButton.setAttribute("data-loading", "true");
          try {
            const currentInvitation = this.getWebsiteInvitation(this.state.profile);
            const currentTheme = this.resolveWebsiteTheme(currentInvitation.theme);
            await this.openWebsitePublicView(currentInvitation, currentTheme);
          } finally {
            activateButton.removeAttribute("data-loading");
            activateButton.disabled = false;
          }
        });
      }
      const exportButton = this.appEl.querySelector('[data-action="website-export"]');
      if (exportButton) {
        exportButton.addEventListener("click", () => {
          if (exportButton.disabled) return;
          const currentInvitation = this.getWebsiteInvitation(this.state.profile);
          const currentTheme = this.resolveWebsiteTheme(currentInvitation.theme);
          this.exportWebsiteInvitation(currentInvitation, currentTheme);
        });
      }
      this.bindMusicToggle();
      this.appEl.querySelectorAll('[data-action="website-copy-link"]').forEach((button) => {
        button.addEventListener("click", () => {
          const link = button.dataset.link;
          if (!link) {
            return;
          }
          const originalLabel = button.textContent;
          const setCopiedState = () => {
            button.textContent = "Скопировано";
            button.disabled = true;
            setTimeout(() => {
              button.textContent = originalLabel;
              button.disabled = false;
            }, 2000);
          };
          const fallbackCopy = () => {
            try {
              const textarea = document.createElement("textarea");
              textarea.value = link;
              textarea.setAttribute("readonly", "true");
              textarea.style.position = "absolute";
              textarea.style.left = "-9999px";
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand("copy");
              document.body.removeChild(textarea);
              setCopiedState();
            } catch (error) {
              alert("Не удалось скопировать ссылку. Пожалуйста, скопируйте её вручную.");
            }
          };
          if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard
              .writeText(link)
              .then(setCopiedState)
              .catch(() => {
                fallbackCopy();
              });
          } else {
            fallbackCopy();
          }
        });
      });
      const form = this.appEl.querySelector("#website-form");
      if (form) {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (typeof form.reportValidity === "function" && !form.reportValidity()) {
            return;
          }
          const values = this.collectWebsiteFormValues(form);
          this.saveWebsiteInvitation(values);
        });
        form.addEventListener("input", () => {
          this.captureWebsiteFormDraft(form);
        });
        form.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            this.state.websiteFormOpen = false;
            this.state.websiteFormDraft = null;
            this.renderWebsiteDesigner();
          }
        });
        requestAnimationFrame(() => {
          const firstField = form.querySelector("input, textarea, select");
          if (firstField) {
            firstField.focus();
          }
        });
      }
      const cancelButton = this.appEl.querySelector('[data-action="website-cancel-form"]');
      if (cancelButton) {
        cancelButton.addEventListener("click", () => {
          this.state.websiteFormOpen = false;
          this.state.websiteFormDraft = null;
          this.renderWebsiteDesigner();
        });
      }
    },
    collectWebsiteFormValues(form) {
      const formData = new FormData(form);
      const fields = ["groom", "bride", "date", "time", "venueName", "venueAddress", "giftCard"];
      const values = {};
      fields.forEach((field) => {
        const value = formData.get(field);
        values[field] = typeof value === "string" ? value.trim() : "";
      });
      return values;
    },
    captureWebsiteFormDraft(form) {
      this.state.websiteFormDraft = this.collectWebsiteFormValues(form);
    },
    saveWebsiteInvitation(values) {
      const current = this.getWebsiteInvitation(this.state.profile);
      const timestamp = Date.now();
      const nextRaw = {
        ...current,
        ...values,
        updatedAt: timestamp
      };
      const normalized = this.normalizeWebsiteInvitation(nextRaw, timestamp);
      this.state.websiteFormOpen = false;
      this.state.websiteFormDraft = null;
      this.updateProfile({ websiteInvitation: normalized.invitation });
      this.renderWebsiteDesigner();
    },
    setWebsiteTheme(themeId) {
      const theme = this.resolveWebsiteTheme(themeId);
      if (!theme) {
        return;
      }
      const current = this.getWebsiteInvitation(this.state.profile);
      if (current.theme === theme.id) {
        return;
      }
      const timestamp = Date.now();
      const nextRaw = {
        ...current,
        theme: theme.id,
        updatedAt: timestamp
      };
      const normalized = this.normalizeWebsiteInvitation(nextRaw, timestamp);
      this.updateProfile({ websiteInvitation: normalized.invitation });
      this.renderWebsiteDesigner();
    },
    ensureWebsiteInvitationData() {
      const profile = this.state.profile;
      const timestamp = Date.now();
      const normalized = this.normalizeWebsiteInvitation(profile ? profile.websiteInvitation : null, timestamp);
      if (!profile) {
        return normalized.invitation;
      }
      if (!profile.websiteInvitation || normalized.updated) {
        const nextProfile = {
          ...profile,
          websiteInvitation: normalized.invitation,
          updatedAt: Date.now()
        };
        this.saveProfile(nextProfile);
        return normalized.invitation;
      }
      return normalized.invitation;
    },
    createDefaultWebsiteInvitation(timestamp = Date.now()) {
      const defaultTheme = Array.isArray(WEBSITE_THEMES) && WEBSITE_THEMES.length ? WEBSITE_THEMES[0].id : "default";
      return {
        groom: "",
        bride: "",
        date: "",
        time: "",
        venueName: "",
        venueAddress: "",
        giftCard: "",
        theme: defaultTheme,
        enableMusic: true,
        updatedAt: timestamp,
        publicId: "",
        publicSlug: "",
        publicUrl: "",
        publishedAt: null
      };
    },
    normalizeWebsiteInvitation(invitation, timestamp = Date.now()) {
      const base = this.createDefaultWebsiteInvitation(timestamp);
      const source = invitation && typeof invitation === "object" ? invitation : {};
      const sanitized = {
        groom: typeof source.groom === "string" ? source.groom.trim() : base.groom,
        bride: typeof source.bride === "string" ? source.bride.trim() : base.bride,
        date: typeof source.date === "string" ? source.date.trim() : base.date,
        time: typeof source.time === "string" ? source.time.trim() : base.time,
        venueName: typeof source.venueName === "string" ? source.venueName.trim() : base.venueName,
        venueAddress: typeof source.venueAddress === "string" ? source.venueAddress.trim() : base.venueAddress,
        giftCard: typeof source.giftCard === "string" ? source.giftCard.trim() : base.giftCard,
        theme: this.resolveWebsiteTheme(source.theme).id,
        enableMusic: typeof source.enableMusic === "boolean" ? source.enableMusic : (source.enableMusic !== undefined ? source.enableMusic : base.enableMusic),
        updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : base.updatedAt,
        publicId: typeof source.publicId === "string" ? source.publicId.trim() : base.publicId,
        publicSlug: typeof source.publicSlug === "string" ? source.publicSlug.trim() : base.publicSlug,
        publicUrl: typeof source.publicUrl === "string" ? source.publicUrl.trim() : base.publicUrl,
        publishedAt: Number.isFinite(Number(source.publishedAt)) ? Number(source.publishedAt) : base.publishedAt
      };
      const keys = Object.keys(sanitized);
      const updated =
        !invitation ||
        keys.some((key) => {
          const original = source[key];
          return sanitized[key] !== (typeof original === "string" ? original.trim() : original);
        });
      return { invitation: sanitized, updated };
    },
    getWebsiteInvitation(profile) {
      if (!profile) {
        return this.createDefaultWebsiteInvitation();
      }
      const normalized = this.normalizeWebsiteInvitation(profile.websiteInvitation, profile.websiteInvitation?.updatedAt || Date.now());
      return normalized.invitation;
    },
    isWebsiteInvitationComplete(invitation) {
      if (!invitation || typeof invitation !== "object") {
        return false;
      }
      return Boolean(
        invitation.groom &&
          invitation.bride &&
          invitation.date &&
          invitation.time &&
          invitation.venueName &&
          invitation.venueAddress
      );
    },
    resolveWebsiteTheme(themeId) {
      if (!Array.isArray(WEBSITE_THEMES) || WEBSITE_THEMES.length === 0) {
        return {
          id: "default",
          name: "Базовый",
          description: "",
          tagline: "Приглашение",
          colors: {
            background: "#ffffff",
            card: "rgba(255, 255, 255, 0.92)",
            accent: "#e07a8b",
            accentSoft: "rgba(224, 122, 139, 0.14)",
            text: "#2f2a3b",
            muted: "#6e6781",
            pattern: "none"
          },
          headingFont: "'Playfair Display', 'Times New Roman', serif",
          bodyFont: "'Montserrat', 'Segoe UI', sans-serif"
        };
      }
      const found = WEBSITE_THEMES.find((theme) => theme && theme.id === themeId);
      return found || WEBSITE_THEMES[0];
    },
    buildWebsiteThemeStyle(theme) {
      if (!theme || typeof theme !== "object") {
        return "";
      }
      const colors = theme.colors || {};
      const entries = [
        ["--website-bg", colors.background || "#ffffff"],
        ["--website-card", colors.card || "rgba(255, 255, 255, 0.9)"],
        ["--website-accent", colors.accent || "#e07a8b"],
        ["--website-accent-soft", colors.accentSoft || "rgba(224, 122, 139, 0.14)"],
        ["--website-text", colors.text || "#2f2a3b"],
        ["--website-muted", colors.muted || "#6e6781"],
        ["--website-pattern", colors.pattern || "none"],
        ["--website-heading-font", theme.headingFont || "'Georgia', serif"],
        ["--website-body-font", theme.bodyFont || "'Segoe UI', sans-serif"]
      ];
      return entries
        .filter(([, value]) => typeof value === "string" && value.length)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");
    },
    formatWebsiteDate(value) {
      if (!value || typeof value !== "string") {
        return "";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      const day = date.getDate();
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex] || "";
      const year = date.getFullYear();
      return `${day} ${monthName.toLowerCase()} ${year}`.trim();
    },
    formatWebsiteTime(value) {
      if (!value || typeof value !== "string") {
        return "";
      }
      const parts = value.split(":");
      if (parts.length >= 2) {
        const [hours, minutes] = parts;
        if (hours.length === 2 && minutes.length === 2) {
          return `${hours}:${minutes}`;
        }
      }
      return value;
    },
    formatWebsiteUpdatedAt(timestamp) {
      const numeric = Number(timestamp);
      if (!Number.isFinite(numeric)) {
        return "";
      }
      try {
        return new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit"
        }).format(numeric);
      } catch (error) {
        return "";
      }
    },
    formatWebsitePublishedAt(timestamp) {
      const numeric = Number(timestamp);
      if (!Number.isFinite(numeric)) {
        return "";
      }
      try {
        return new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit"
        }).format(numeric);
      } catch (error) {
        return "";
      }
    },
    getWebsiteFormValuesForRender(invitation, profile) {
      const base = {
        groom: invitation.groom || (profile && profile.groomName) || "",
        bride: invitation.bride || (profile && profile.brideName) || "",
        date: invitation.date || "",
        time: invitation.time || "",
        venueName: invitation.venueName || "",
        venueAddress: invitation.venueAddress || "",
        giftCard: invitation.giftCard || ""
      };
      if (this.state.websiteFormDraft && typeof this.state.websiteFormDraft === "object") {
        return {
          ...base,
          ...this.state.websiteFormDraft
        };
      }
      return base;
    },
    async openWebsitePublicView(invitation, theme) {
      const publication = await this.publishWebsiteInvitation(invitation, theme);
      if (!publication || !publication.url) {
        return null;
      }
      this.renderWebsiteDesigner();
      const popup = window.open(publication.url, "_blank", "noopener");
      if (!popup) {
        alert("Не удалось открыть новое окно. Разрешите всплывающие окна, чтобы просмотреть сайт.");
        return publication;
      }
      popup.focus();
      return publication;
    },
    exportWebsiteInvitation(invitation, theme) {
      const html = this.renderWebsitePublicHtml(invitation, theme, { forPrint: true });
      const popup = window.open("", "_blank", "noopener");
      if (!popup) {
        alert("Не удалось открыть новое окно для сохранения PDF. Разрешите всплывающие окна и повторите попытку.");
        return;
      }
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      const triggerPrint = () => {
        if (popup.closed) {
          return;
        }
        const executePrint = () => {
          if (popup.closed) {
            return;
          }
          popup.focus();
          popup.print();
        };
        if (popup.document.fonts && typeof popup.document.fonts.ready?.then === "function") {
          popup.document.fonts.ready.then(() => setTimeout(executePrint, 120)).catch(executePrint);
        } else {
          setTimeout(executePrint, 120);
        }
      };
      if (popup.document.readyState === "complete") {
        triggerPrint();
      } else {
        popup.document.addEventListener(
          "readystatechange",
          () => {
            if (popup.document.readyState === "complete") {
              triggerPrint();
            }
          },
          { once: true }
        );
      }
    },

    renderWebsitePublicHtml(invitation, theme, options = {}) {
      const resolvedTheme = this.resolveWebsiteTheme(theme?.id || invitation.theme);
      const groom = this.escapeHtml(invitation.groom || "Жених");
      const bride = this.escapeHtml(invitation.bride || "Невеста");
      const dateText = this.escapeHtml(this.formatWebsiteDate(invitation.date) || "Дата уточняется");
      const timeText = this.escapeHtml(this.formatWebsiteTime(invitation.time) || "Время уточняется");
      const venueName = this.escapeHtml(invitation.venueName || "Место проведения");
      const venueAddress = this.escapeHtml((invitation.venueAddress || "Адрес уточняется").trim()).replace(/\n/g, "<br>");
      const giftCard = invitation.giftCard && invitation.giftCard.trim().length
        ? `<section class="invitation__gift"><h3>Для подарков</h3><p>${this.escapeHtml(invitation.giftCard.trim())}</p></section>`
        : "";
      const dateLineParts = [];
      if (dateText) dateLineParts.push(dateText);
      if (timeText) dateLineParts.push(timeText);
      const dateLine = dateLineParts.filter(Boolean).join(" · ");
      const fontLink = resolvedTheme.fontLink
        ? `<link rel="stylesheet" href="${this.escapeHtml(resolvedTheme.fontLink)}">`
        : "";
      const css = this.buildPublicInvitationCss(resolvedTheme, options);
      return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${groom} и ${bride} — свадебное приглашение</title>
  ${fontLink}
  <style>
    ${css}
  </style>
</head>
<body>
  <main class="invitation">
    <div class="invitation__content">
      <p class="invitation__eyebrow">${this.escapeHtml(resolvedTheme.tagline || "Приглашение")}</p>
      <h1>${groom} и ${bride}</h1>
      <p class="invitation__date">${dateLine}</p>
      <div class="invitation__venue">
        <strong>${venueName}</strong>
        <p>${venueAddress}</p>
      </div>
      ${giftCard}
      <footer>
        <p>Мы будем рады видеть вас в этот особенный день.</p>
      </footer>
    </div>
  </main>
</body>
</html>`;
    },

    renderMarketplaceModule(backgroundInertAttributes = "") {
      const categories = Array.isArray(CONTRACTOR_MARKETPLACE) ? CONTRACTOR_MARKETPLACE : [];
      if (!categories.length) {
        return "";
      }
      const favoritesSet = this.state.marketplaceFavorites instanceof Set ? this.state.marketplaceFavorites : new Set();
      const favoritesContractors = [];
      categories.forEach((category) => {
        if (!category || typeof category !== "object" || !Array.isArray(category.contractors)) {
          return;
        }
        const categoryTitle = typeof category.title === "string" ? category.title : String(category.title || "");
        category.contractors.forEach((contractor) => {
          if (
            contractor &&
            typeof contractor === "object" &&
            typeof contractor.id === "string" &&
            favoritesSet.has(contractor.id)
          ) {
            favoritesContractors.push({
              ...contractor,
              categoryTitle
            });
          }
        });
      });
      const favoritesCategory = {
        id: "favorites",
        title: "Избранное",
        contractors: favoritesContractors
      };
      const allCategories = [favoritesCategory, ...categories];
      let selectedId = this.state.marketplaceCategoryId;
      const firstRegularCategoryId = categories[0]?.id || favoritesCategory.id;
      if (!selectedId || !allCategories.some((category) => category && category.id === selectedId)) {
        selectedId = firstRegularCategoryId;
        this.state.marketplaceCategoryId = selectedId;
      }
      const visibleContractorsById = new Map();
      const categoriesMarkup = allCategories
        .map((category) => {
          if (!category || typeof category !== "object") {
            return "";
          }
          const rawId = typeof category.id === "string" ? category.id : String(category.id || "");
          if (!rawId) {
            return "";
          }
          const contractorsForCategory = rawId === "favorites"
            ? favoritesContractors
            : this.getRandomizedContractors(category);
          const decoratedContractors = contractorsForCategory
            .filter((contractor) => contractor && typeof contractor === "object")
            .map((contractor) => ({
              ...contractor,
              categoryTitle:
                typeof contractor.categoryTitle === "string" && contractor.categoryTitle.trim().length
                  ? contractor.categoryTitle
                  : category.title || ""
            }));
          visibleContractorsById.set(rawId, decoratedContractors);
          const safeId = this.escapeHtml(rawId);
          const title = this.escapeHtml(category.title || "");
          const contractorCount = decoratedContractors.length;
          const formattedCount = this.escapeHtml(currencyFormatter.format(contractorCount));
          const isActive = rawId === selectedId;
          const iconMarkup = rawId === "favorites"
            ? '<span class="marketplace-category__icon" aria-hidden="true">❤️</span>'
            : "";
          return `
            <button type="button" class="marketplace-category${isActive ? " marketplace-category--active" : ""}" data-category-id="${safeId}" aria-pressed="${isActive}" aria-controls="marketplace-panel-${safeId}">
              <span class="marketplace-category__name">
                ${iconMarkup}
                <span class="marketplace-category__label">${title}</span>
              </span>
              <span class="marketplace-category__count">${formattedCount}</span>
            </button>
          `;
        })
        .join("");
      const selectedCategory =
        allCategories.find((category) => category && category.id === selectedId) || allCategories[0];
      const selectedSafeId = this.escapeHtml(selectedCategory?.id || "all");
      const selectedContractors = visibleContractorsById.get(selectedCategory?.id) || [];
      const emptyMessage = selectedCategory?.id === "favorites"
        ? '<p class="marketplace-empty marketplace-empty--favorites">Добавьте подрядчиков в избранное, чтобы увидеть их здесь.</p>'
        : '<p class="marketplace-empty">Скоро добавим подрядчиков в эту категорию.</p>';
      const cardsMarkup = selectedContractors.length
        ? selectedContractors
            .map((contractor, index) => this.renderMarketplaceCard(contractor, selectedCategory, index))
            .join("")
        : emptyMessage;
      return `
        <section class="dashboard-module marketplace" data-area="marketplace" aria-labelledby="marketplace-title"${backgroundInertAttributes}>
          <div class="module-header">
            <h2 id="marketplace-title">Маркетплейс подрядчиков</h2>
            <p>Выбирайте проверенных специалистов для свадьбы мечты.</p>
          </div>
          <div class="marketplace-content">
            <nav class="marketplace-categories" aria-label="Категории подрядчиков">
              ${categoriesMarkup}
            </nav>
            <div class="marketplace-cards" role="list" id="marketplace-panel-${selectedSafeId}">
              ${cardsMarkup}
            </div>
          </div>
        </section>
      `;
    },

    renderMarketplaceCard(contractor, category, index) {
      if (!contractor || typeof contractor !== "object") {
        return "";
      }
      const fallbackName = `Подрядчик ${index + 1}`;
      const rawName = typeof contractor.name === "string" && contractor.name.trim().length
        ? contractor.name.trim()
        : fallbackName;
      const safeName = this.escapeHtml(rawName);
      const rawId = typeof contractor.id === "string" && contractor.id.trim().length
        ? contractor.id.trim()
        : `contractor-${index + 1}`;
      const favoritesSet = this.state.marketplaceFavorites instanceof Set ? this.state.marketplaceFavorites : new Set();
      const isFavorite = favoritesSet.has(rawId);
      const favoriteLabel = isFavorite ? "Убрать из избранного" : "Добавить в избранное";
      const priceValue = Number(contractor.price);
      const price = Number.isFinite(priceValue) ? Math.max(0, Math.round(priceValue)) : 0;
      const ratingValue = Number.parseFloat(contractor.rating);
      const rating = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "5.0";
      const ratingLabel = `Средняя оценка ${rating} из 5`;
      const reviewsValue = Number(contractor.reviews);
      const reviews = Number.isFinite(reviewsValue) ? Math.max(0, Math.round(reviewsValue)) : 0;
      const reviewsText = `${currencyFormatter.format(reviews)} оценок`;
      const location = typeof contractor.location === "string" && contractor.location.trim().length
        ? `<p class="marketplace-card__location">${this.escapeHtml(contractor.location)}</p>`
        : "";
      const description = typeof contractor.tagline === "string" && contractor.tagline.trim().length
        ? `<p class="marketplace-card__description">${this.escapeHtml(contractor.tagline)}</p>`
        : "";
      const imageUrl = typeof contractor.image === "string" && contractor.image
        ? contractor.image
        : (Array.isArray(MARKETPLACE_IMAGES) && MARKETPLACE_IMAGES.length ? MARKETPLACE_IMAGES[0] : "");
      const categoryTitle = typeof contractor.categoryTitle === "string" && contractor.categoryTitle.trim().length
        ? contractor.categoryTitle.trim()
        : category?.title || "";
      const altBase = typeof contractor.imageAlt === "string" && contractor.imageAlt.trim().length
        ? contractor.imageAlt
        : `${rawName}${categoryTitle ? ` — ${categoryTitle}` : ""}`;
      const altText = this.escapeHtml(altBase);
      const phoneValue = typeof contractor.phone === "string" && contractor.phone.trim().length
        ? contractor.phone.trim()
        : "+7 (999) 867 17 49";
      const safePhone = this.escapeHtml(phoneValue);
      const safeIdAttr = this.escapeHtml(rawId);
      return `
        <article class="marketplace-card" role="listitem">
          <div class="marketplace-card__image">
            <img src="${this.escapeHtml(imageUrl)}" alt="${altText}">
            <button type="button" class="marketplace-card__favorite" data-action="marketplace-favorite" data-vendor-id="${safeIdAttr}" aria-pressed="${isFavorite}" aria-label="${this.escapeHtml(favoriteLabel)}" title="${this.escapeHtml(favoriteLabel)}">
              <span class="marketplace-card__favorite-icon" aria-hidden="true">${isFavorite ? "❤️" : "♡"}</span>
            </button>
          </div>
          <div class="marketplace-card__info">
            <p class="marketplace-card__price"><strong>${this.formatCurrency(price)}</strong></p>
            <h3 class="marketplace-card__title">${safeName}</h3>
            <p class="marketplace-card__meta">
              <span class="marketplace-card__rating" aria-label="${this.escapeHtml(ratingLabel)}">⭐${rating}</span>
              <span class="marketplace-card__reviews">${this.escapeHtml(reviewsText)}</span>
            </p>
            ${location}
            ${description}
            <div class="marketplace-card__actions">
              <button type="button" class="marketplace-card__action marketplace-card__action--phone" data-action="marketplace-phone" data-vendor-name="${this.escapeHtml(rawName)}" data-vendor-phone="${safePhone}">Показать телефон</button>
            </div>
          </div>
        </article>
      `;
    },

    renderChecklistItems(tasks, folders) {
      const folderMarkup = folders
        .map((folder) => {
          const folderTasks = tasks.filter((task) => task.folderId === folder.id);
          return this.renderChecklistFolder(folder, folderTasks);
        })
        .join("");
      const ungroupedTasks = tasks.filter((task) => !task.folderId);
      const ungroupedMarkup = ungroupedTasks.map((task) => this.renderChecklistTask(task)).join("");
      const hasFolders = folders.length > 0;
      const dropZone = hasFolders
        ? '<li class="checklist-drop-zone" data-folder-drop-target="root" role="presentation"><span>Перетащите сюда, чтобы убрать из папки</span></li>'
        : "";
      let content = `${folderMarkup}${hasFolders ? dropZone : ""}${ungroupedMarkup}`;
      if (!content.trim()) {
        content = '<li class="checklist-empty">Добавьте задачи, чтобы начать планирование</li>';
      }
      return content;
    },
    renderChecklistTask(task, options = {}) {
      const nested = Boolean(options.nested);
      const itemKey = typeof task.id === "string" && task.id ? task.id : this.getChecklistItemKey(task, 0);
      const itemId = `check-${itemKey}`;
      const checkedAttr = task.done ? "checked" : "";
      const isEditingItem = this.state.checklistEditingId === itemKey;
      const classes = ["checklist-item"];
      if (isEditingItem) {
        classes.push("checklist-item--editing");
      }
      if (nested) {
        classes.push("checklist-item--nested");
      }
      const folderAttr = task.folderId ? ` data-folder-id="${this.escapeHtml(task.folderId)}"` : "";
      if (isEditingItem) {
        const draftTitle =
          typeof this.state.checklistEditingDraft?.title === "string" && this.state.checklistEditingId === itemKey
            ? this.state.checklistEditingDraft.title
            : task.title || "";
        return `
          <li class="${classes.join(" ")}" data-task-id="${this.escapeHtml(itemKey)}"${folderAttr}>
            <form class="checklist-item__edit" data-task-id="${this.escapeHtml(itemKey)}" data-prevent-expand>
              <label for="checklist-edit-${this.escapeHtml(itemKey)}" class="sr-only">Название задачи</label>
              <input id="checklist-edit-${this.escapeHtml(itemKey)}" type="text" name="title" value="${this.escapeHtml(draftTitle)}" required>
              <div class="checklist-item__edit-actions">
                <button type="submit">Сохранить</button>
                <button type="button" class="secondary" data-action="cancel-checklist-edit">Отменить</button>
              </div>
            </form>
          </li>
        `;
      }
      return `
        <li class="${classes.join(" ")}" data-task-id="${this.escapeHtml(itemKey)}"${folderAttr} draggable="true" data-draggable-task="true">
          <div class="checklist-item__main">
            <input type="checkbox" id="${this.escapeHtml(itemId)}" data-task-id="${this.escapeHtml(itemKey)}" ${checkedAttr} data-prevent-expand>
            <label for="${this.escapeHtml(itemId)}" data-prevent-expand>${this.escapeHtml(task.title || "")}</label>
          </div>
          <div class="checklist-item__actions" role="group" aria-label="Действия с задачей">
            <button type="button" class="checklist-item__action" data-action="edit-checklist" data-task-id="${this.escapeHtml(itemKey)}" aria-label="Редактировать задачу">
              <span aria-hidden="true">✏️</span>
              <span class="sr-only">Редактировать</span>
            </button>
            <button type="button" class="checklist-item__action checklist-item__action--danger" data-action="delete-checklist" data-task-id="${this.escapeHtml(itemKey)}" aria-label="Удалить задачу">
              <span aria-hidden="true">🗑️</span>
              <span class="sr-only">Удалить</span>
            </button>
          </div>
        </li>
      `;
    },
    renderChecklistFolder(folder, folderTasks) {
      const folderId = typeof folder.id === "string" ? folder.id : `folder-${Date.now()}`;
      const isEditing = this.state.checklistFolderEditingId === folderId;
      const draftTitle =
        isEditing && typeof this.state.checklistFolderEditingDraft?.title === "string"
          ? this.state.checklistFolderEditingDraft.title
          : folder.title || "";
      const collapseState = this.state.checklistFoldersCollapse[folderId];
      const isCollapsed = collapseState !== false;
      const baseClasses = ["checklist-folder"];
      if (isCollapsed) {
        baseClasses.push("checklist-folder--collapsed");
      }
      const safeFolderId = this.escapeHtml(folderId);
      const color = folder.color || (Array.isArray(CHECKLIST_FOLDER_COLORS) ? CHECKLIST_FOLDER_COLORS[0] : "#F5D0D4");
      const completedCount = folderTasks.filter((task) => task.done).length;
      if (isEditing) {
        return `
          <li class="${baseClasses.join(" ")}" data-folder-id="${safeFolderId}" style="--folder-color: ${this.escapeHtml(color)};">
            <form class="checklist-folder__edit" data-folder-id="${safeFolderId}" data-prevent-expand>
              <label for="checklist-folder-edit-${safeFolderId}" class="sr-only">Название папки</label>
              <input id="checklist-folder-edit-${safeFolderId}" type="text" name="title" value="${this.escapeHtml(draftTitle)}" required>
              <div class="checklist-folder__edit-actions">
                <button type="submit">Сохранить</button>
                <button type="button" class="secondary" data-action="cancel-folder-edit">Отменить</button>
              </div>
            </form>
          </li>
        `;
      }
      const folderTasksMarkup = folderTasks.length
        ? folderTasks.map((task) => this.renderChecklistTask(task, { nested: true })).join("")
        : '<li class="checklist-folder__empty" data-folder-empty>Перетащите задачи сюда</li>';
      return `
        <li class="${baseClasses.join(" ")}" data-folder-id="${safeFolderId}" style="--folder-color: ${this.escapeHtml(color)};">
          <div class="checklist-folder__header" data-folder-drop-target="${safeFolderId}">
            <button type="button" class="checklist-folder__toggle" data-action="toggle-folder" data-folder-id="${safeFolderId}" aria-expanded="${!isCollapsed}">
              <span class="checklist-folder__arrow" aria-hidden="true">▸</span>
              <span class="sr-only">${isCollapsed ? "Развернуть папку" : "Свернуть папку"}</span>
            </button>
            <div class="checklist-folder__meta">
              <span class="checklist-folder__icon" aria-hidden="true">📁</span>
              <span class="checklist-folder__title">${this.escapeHtml(folder.title || "")}</span>
              <span class="checklist-folder__counter" aria-label="В папке ${folderTasks.length} задач">${completedCount}/${folderTasks.length}</span>
            </div>
            <div class="checklist-folder__actions" role="group" aria-label="Действия с папкой">
              <button type="button" class="checklist-folder__action" data-action="edit-folder" data-folder-id="${safeFolderId}" aria-label="Переименовать папку">
                <span aria-hidden="true">✏️</span>
                <span class="sr-only">Редактировать</span>
              </button>
              <button type="button" class="checklist-folder__action checklist-folder__action--danger" data-action="delete-folder" data-folder-id="${safeFolderId}" aria-label="Удалить папку">
                <span aria-hidden="true">🗑️</span>
                <span class="sr-only">Удалить</span>
              </button>
            </div>
          </div>
          <div class="checklist-folder__body"${isCollapsed ? " hidden" : ""}>
            <ul class="checklist-folder__tasks" data-folder-drop-target="${safeFolderId}">
              ${folderTasksMarkup}
            </ul>
          </div>
        </li>
      `;
    },

    renderCountdown(profile) {
      if (!profile.year || !profile.month) {
        return "";
      }
      const targetDate = new Date(profile.year, profile.month - 1, 1);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (Number.isNaN(days) || days < 0) {
        return "";
      }
      return `<p class="banner"><strong>До свадьбы осталось ${days} ${this.pluralizeDays(days)}.</strong></p>`;
    },

  };

  window.AppViews = AppViews;
})();
