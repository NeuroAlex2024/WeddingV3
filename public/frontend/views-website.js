(function () {
  function attachWebsiteView(App) {
    Object.assign(App, {
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
      }
    });
  }

  window.AppViews = window.AppViews || {};
  window.AppViews.attachWebsite = attachWebsiteView;
})();
