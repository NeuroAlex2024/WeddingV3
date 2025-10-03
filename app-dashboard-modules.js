(function () {
  const AppDashboardModules = {
    renderTimeline({ app, profile, role, backgroundInertAttributes = "" } = {}) {
      const context = app || window.App || window.AppCore;
      if (!context || typeof context.getTimelineItems !== "function") {
        return { markup: "" };
      }
      const activeRole = role || (profile && profile.role) || context.state?.currentRole;
      const items = context.getTimelineItems(profile, activeRole) || [];
      const escapeHtml = typeof context.escapeHtml === "function" ? context.escapeHtml.bind(context) : (value) => String(value ?? "");
      const completedCount = items.filter((item) => item && item.done).length;
      const totalCount = items.length;
      const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
      const firstPendingIndex = items.findIndex((item) => !item?.done);
      const timelineItemsMarkup = items.length
        ? items
            .map((item, index) => {
              if (!item || typeof item !== "object") {
                return "";
              }
              const safeId = typeof item.id === "string" && item.id.trim().length ? item.id.trim() : `timeline-${index}`;
              const labelId = `timeline-${safeId}-title`;
              const title = escapeHtml(item.title || "Этап подготовки");
              const description = typeof item.description === "string" && item.description.trim().length
                ? `<p class="timeline-item__description">${escapeHtml(item.description)}</p>`
                : "";
              const dueLabel = typeof item.dueLabel === "string" && item.dueLabel.trim().length
                ? `<span class="timeline-item__due">${escapeHtml(item.dueLabel)}</span>`
                : "";
              const isDone = Boolean(item.done);
              const isCurrent = !isDone && (firstPendingIndex === index || firstPendingIndex === -1);
              const statusClass = isDone
                ? "timeline-item--done"
                : isCurrent
                ? "timeline-item--current"
                : "timeline-item--upcoming";
              return `
                <li class="timeline-item ${statusClass}" data-timeline-id="${escapeHtml(safeId)}">
                  <label class="timeline-item__label">
                    <input type="checkbox" data-action="toggle-timeline" data-timeline-id="${escapeHtml(safeId)}" ${isDone ? "checked" : ""} aria-describedby="${escapeHtml(labelId)}">
                    <span class="timeline-item__content">
                      ${dueLabel}
                      <span class="timeline-item__title" id="${escapeHtml(labelId)}">${title}</span>
                      ${description}
                    </span>
                  </label>
                </li>
              `;
            })
            .join("")
        : '<li class="timeline-empty">Добавьте этапы, чтобы видеть прогресс подготовки.</li>';
      const progressText = `${completedCount} / ${totalCount}`;
      const sectionMarkup = `
        <section class="dashboard-module timeline" data-area="timeline" aria-labelledby="timeline-title"${backgroundInertAttributes}>
          <div class="module-header">
            <h2 id="timeline-title">Таймлайн подготовки</h2>
            <div class="timeline-progress" role="group" aria-label="Прогресс подготовки">
              <span class="timeline-progress__counter" data-timeline-progress-count>${escapeHtml(progressText)}</span>
              <div class="timeline-progress__bar" aria-hidden="true">
                <div class="timeline-progress__fill" data-timeline-progress-fill style="width: ${progressPercent}%"></div>
              </div>
            </div>
          </div>
          <ol class="timeline-list">
            ${timelineItemsMarkup}
          </ol>
        </section>
      `;
      return { markup: sectionMarkup };
    },
    renderChecklist({ app, profile, backgroundInertAttributes = "" } = {}) {
      const context = app || window.App || window.AppCore;
      if (!context || typeof context.getChecklistCollections !== "function") {
        return { overlay: "", markup: "" };
      }
      const isChecklistExpanded = Boolean(context.state?.isChecklistExpanded);
      const overlayMarkup = isChecklistExpanded
        ? '<button type="button" class="checklist-overlay" data-action="collapse-checklist" aria-label="Свернуть чек лист"></button>'
        : "";
      const containerClasses = ["dashboard-module", "checklist", isChecklistExpanded ? "checklist--expanded" : ""]
        .filter(Boolean)
        .join(" ");
      const expandLabel = isChecklistExpanded ? "Свернуть чек лист" : "Развернуть чек лист";
      const expandIcon = isChecklistExpanded ? "✕" : "⤢";
      const collections = context.getChecklistCollections(profile);
      context.syncChecklistFolderCollapse(collections.folders);
      const checklistItems = typeof context.renderChecklistItems === "function"
        ? context.renderChecklistItems(collections.tasks, collections.folders)
        : "";
      const markup = `
        <section class="${containerClasses}" data-area="checklist" aria-labelledby="checklist-title" data-expanded="${isChecklistExpanded}">
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
      `;
      return { overlay: overlayMarkup, markup };
    },
    renderBudget({ app, profile, backgroundInertAttributes = "" } = {}) {
      const context = app || window.App || window.AppCore;
      const colors = context?.BUDGET_COLORS || [];
      const entries = Array.isArray(profile?.budgetEntries) ? profile.budgetEntries : [];
      const escapeHtml = typeof context.escapeHtml === "function" ? context.escapeHtml.bind(context) : (value) => String(value ?? "");
      const formatCurrency = typeof context.formatCurrency === "function"
        ? context.formatCurrency.bind(context)
        : (value) => `${Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0} ₽`;
      const decoratedEntries = entries.map((entry, index) => {
        const amountValue = Number(entry?.amount);
        const amount = Number.isFinite(amountValue) ? Math.max(0, Math.round(amountValue)) : 0;
        const color = colors[index % (colors.length || 1)] || "#E07A8B";
        return {
          ...(entry || {}),
          color,
          amount
        };
      });
      const totalBudget = decoratedEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const previousTotal = Number(context?.state?.lastBudgetTotal || 0);
      const positiveEntries = decoratedEntries.filter((entry) => Number(entry.amount) > 0);
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
      const editingId = context?.state?.budgetEditingId || null;
      const editingDraft = context?.state?.budgetEditingDraft || {};
      const visualMarkup = decoratedEntries.length
        ? decoratedEntries
            .map((entry, index) => {
              const safeId = typeof entry.id === "string" && entry.id.trim().length ? entry.id.trim() : `budget-${index}`;
              const amount = Number(entry.amount || 0);
              if (editingId && safeId === editingId) {
                const draftTitle = typeof editingDraft.title === "string" ? editingDraft.title : entry.title || "";
                const draftAmount = typeof editingDraft.amount === "string" ? editingDraft.amount : String(amount);
                return `
                  <div class="budget-visual__item budget-visual__item--editing" data-entry-id="${escapeHtml(safeId)}">
                    <form class="budget-visual__edit" data-entry-id="${escapeHtml(safeId)}">
                      <div class="budget-visual__edit-fields">
                        <span class="budget-visual__dot" style="--dot-color: ${entry.color}" aria-hidden="true"></span>
                        <div class="budget-visual__field">
                          <label for="budget-edit-title-${escapeHtml(safeId)}" class="sr-only">Название статьи</label>
                          <input id="budget-edit-title-${escapeHtml(safeId)}" type="text" name="title" value="${escapeHtml(draftTitle)}" required>
                        </div>
                        <div class="budget-visual__field">
                          <label for="budget-edit-amount-${escapeHtml(safeId)}" class="sr-only">Сумма</label>
                          <input id="budget-edit-amount-${escapeHtml(safeId)}" type="number" name="amount" value="${escapeHtml(draftAmount)}" min="0" step="1000" required>
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
                <div class="budget-visual__item" data-entry-id="${escapeHtml(safeId)}">
                  <div class="budget-visual__info">
                    <span class="budget-visual__dot" style="--dot-color: ${entry.color}" aria-hidden="true"></span>
                    <span class="budget-visual__title">${escapeHtml(entry.title || "")}</span>
                    <span class="budget-visual__amount" id="budget-amount-${escapeHtml(safeId)}" data-amount="${amount}">${formatCurrency(amount)}</span>
                    <div class="budget-visual__actions">
                      <button type="button" class="budget-visual__action" data-action="edit" data-entry-id="${escapeHtml(safeId)}" aria-label="Редактировать статью">
                        <span aria-hidden="true">✏️</span>
                        <span class="sr-only">Изменить</span>
                      </button>
                      <button type="button" class="budget-visual__action budget-visual__action--danger" data-action="delete" data-entry-id="${escapeHtml(safeId)}" aria-label="Удалить статью">
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
      const markup = `
        <section class="dashboard-module budget" data-area="budget" aria-labelledby="budget-title"${backgroundInertAttributes}>
          <div class="module-header">
            <h2 id="budget-title">Бюджет</h2>
          </div>
          <div class="budget-summary">
            <div class="budget-summary__chart" role="img" aria-label="Итоговый бюджет: ${escapeHtml(formatCurrency(totalBudget))}" style="--budget-chart-bg: ${chartBackground};">
              <div class="budget-summary__total">
                <span class="budget-summary__value" id="budget-total" data-previous="${previousTotal}">${formatCurrency(totalBudget)}</span>
              </div>
            </div>
          </div>
          <div class="budget-visual">
            ${visualMarkup}
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
      `;
      return { markup, totalBudget, previousTotal };
    }
  };

  window.AppDashboardModules = AppDashboardModules;
})();
