const DEFAULT_CHECKLIST_ITEMS = [
  {
    id: "task-1",
    title: "Выбрать дату и площадку",
    done: false,
    order: 1,
    type: "task",
    folderId: null
  },
  {
    id: "task-2",
    title: "Согласовать бюджет с партнёром",
    done: false,
    order: 2,
    type: "task",
    folderId: null
  },
  {
    id: "task-3",
    title: "Составить список гостей",
    done: false,
    order: 3,
    type: "task",
    folderId: null
  }
];

const DEFAULT_CHECKLIST_FOLDERS = [];

const DEFAULT_BUDGET_ENTRIES = [
  { id: "budget-venue", title: "Площадка", amount: 250000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 90000 },
  { id: "budget-photo", title: "Фото и видео", amount: 120000 }
];

const DEFAULT_WEDDING_TIMELINE = [
  {
    id: "timeline-vision",
    title: "Определить формат праздника",
    description: "Выберите стиль, примерный бюджет и составьте первый список гостей.",
    dueLabel: "За 12 месяцев",
    order: 10,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-venue",
    title: "Забронировать площадку и ключевых подрядчиков",
    description: "Подтвердите дату, выберите ведущего, фотографа и кейтеринг.",
    dueLabel: "За 9 месяцев",
    order: 20,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-style",
    title: "Продумать концепцию и декор",
    description: "Согласуйте с декоратором концепт, цвета и тайминг.",
    dueLabel: "За 6 месяцев",
    order: 30,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-invitations",
    title: "Отправить приглашения гостям",
    description: "Подготовьте сайт или рассылку, уточните контактные данные гостей.",
    dueLabel: "За 4 месяца",
    order: 40,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-details",
    title: "Утвердить программу и смету",
    description: "Согласуйте расписание дня, меню и финальный бюджет.",
    dueLabel: "За 2 месяца",
    order: 50,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-week",
    title: "Контрольный чек-лист перед праздником",
    description: "Проверьте готовность подрядчиков, план рассадки и пакет невесты.",
    dueLabel: "За 1 неделю",
    order: 60,
    done: false,
    status: "upcoming"
  }
];

const DEFAULT_CONTRACTOR_TIMELINE = [
  {
    id: "timeline-profile",
    title: "Заполнить профиль и контакты",
    description: "Добавьте описание услуг, фото и актуальные контакты.",
    dueLabel: "День 1",
    order: 10,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-portfolio",
    title: "Добавить портфолио и отзывы",
    description: "Загрузите лучшие проекты и расскажите о кейсах.",
    dueLabel: "День 3",
    order: 20,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-offers",
    title: "Настроить пакеты услуг",
    description: "Опишите тарифы, что входит в стоимость и дополнительные опции.",
    dueLabel: "Неделя 1",
    order: 30,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-responses",
    title: "Настроить шаблоны ответов",
    description: "Подготовьте быстрые ответы на заявки, чтобы реагировать без задержек.",
    dueLabel: "Неделя 2",
    order: 40,
    done: false,
    status: "upcoming"
  },
  {
    id: "timeline-analytics",
    title: "Анализировать статистику",
    description: "Следите за откликами клиентов и обновляйте предложения.",
    dueLabel: "Каждый месяц",
    order: 50,
    done: false,
    status: "upcoming"
  }
];

module.exports = {
  DEFAULT_CHECKLIST_ITEMS,
  DEFAULT_CHECKLIST_FOLDERS,
  DEFAULT_BUDGET_ENTRIES,
  DEFAULT_WEDDING_TIMELINE,
  DEFAULT_CONTRACTOR_TIMELINE
};
