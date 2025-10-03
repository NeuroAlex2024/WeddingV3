const ATMOSPHERE_OPTIONS = [
  "Классическая",
  "Романтичная",
  "Уютная",
  "Роскошная",
  "Современная",
  "Бохо",
  "Рустик",
  "Минималистичная"
];

const STYLE_OPTIONS = [
  "Минимализм",
  "Классика",
  "Рустик",
  "Бохо",
  "Современный",
  "Ретро",
  "Гламур",
  "Винтаж"
];

const CITIES_TOP10 = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Сочи",
  "Калининград",
  "Нижний Новгород",
  "Екатеринбург",
  "Краснодар",
  "Ростов-на-Дону",
  "Самара"
];

const BUDGET_RANGES = [
  "До 200 тыс ₽",
  "200–400 тыс ₽",
  "400–700 тыс ₽",
  "700 тыс – 1 млн ₽",
  "1–2 млн ₽",
  "От 2 млн ₽"
];

const DASHBOARD_NAV_ITEMS = [
  { id: "venues", title: "Место проведения" },
  { id: "vendors", title: "Подрядчики" },
  { id: "tools", title: "Инструменты" },
  { id: "checklist", title: "Чек лист" },
  { id: "budget", title: "Бюджет" },
  { id: "blog", title: "Блог" }
];

const DASHBOARD_TOOL_ITEMS = [
  { id: "tools-test", title: "Тест", description: "Спланируйте идеальную свадьбу" },
  { id: "tools-budget", title: "Бюджет", description: "Следите за расходами" },
  { id: "tools-guests", title: "Список гостей", description: "Отправляйте приглашения" },
  { id: "tools-website", title: "Сайт-приглашение", description: "Поделитесь деталями" },
  { id: "tools-booked", title: "Забронировано", description: "Контролируйте статусы" },
  { id: "tools-favorites", title: "Избранное", description: "Сохраняйте лучшие идеи" }
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

const CHECKLIST_FOLDER_COLORS = [
  "#F5D0D4",
  "#F9E5C0",
  "#D8F0E3",
  "#DDE6FA",
  "#F3DFFD",
  "#FFE4F0"
];

const DEFAULT_BUDGET_ENTRIES = [
  { id: "budget-venue", title: "Площадка", amount: 250000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 90000 },
  { id: "budget-photo", title: "Фото и видео", amount: 120000 }
];

const MARKETPLACE_IMAGES = [
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?q=80&w=2969&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1525772764200-be829a350797?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1485700281629-290c5a704409?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

const MARKETPLACE_CONTACT_PHONE = "+7 (999) 867 17 49";

const CONTRACTOR_MARKETPLACE = [
  {
    id: "contractor-fallback-aurora",
    name: "Студия «Аврора»",
    description: "Фотографируем целый день, бережно обрабатываем снимки и собираем мини-историю за неделю.",
    services: [
      { id: "service-photo-day", title: "Фотосъёмка полного дня" },
      { id: "service-photo-morning", title: "Съёмка утра невесты" },
      { id: "service-photo-love-story", title: "Love Story до свадьбы" }
    ],
    priceFrom: 25000,
    city: "Москва",
    coverImageUrl: MARKETPLACE_IMAGES[0],
    phone: MARKETPLACE_CONTACT_PHONE
  },
  {
    id: "contractor-fallback-melody",
    name: "Дуэт «Мелодия»",
    description: "Живая музыка на выездной регистрации и атмосферный лаунж на банкет.",
    services: [
      { id: "service-band-ceremony", title: "Выездная регистрация" },
      { id: "service-band-lounge", title: "Лаунж-сет" },
      { id: "service-band-dance", title: "Танцевальная программа" }
    ],
    priceFrom: 18000,
    city: "Санкт-Петербург",
    coverImageUrl: MARKETPLACE_IMAGES[1],
    phone: MARKETPLACE_CONTACT_PHONE
  },
  {
    id: "contractor-fallback-bouquet",
    name: "Flower Bureau",
    description: "Воздушные декорации, букеты и фотозона в едином стиле.",
    services: [
      { id: "service-florist-bouquet", title: "Букет и бутоньерки" },
      { id: "service-florist-ceremony", title: "Оформление церемонии" },
      { id: "service-florist-photo", title: "Фотозона и welcome" }
    ],
    priceFrom: 32000,
    city: "Казань",
    coverImageUrl: MARKETPLACE_IMAGES[2],
    phone: MARKETPLACE_CONTACT_PHONE
  }
];


