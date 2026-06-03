/**
 * ITSM365 Информация для менеджеров
 * Материалы о продукте, экосистеме и преимуществах
 */

const ITSM365_INFO = {
    // Экосистема продуктов
    ecosystem: {
        title: "Экосистема ITSM 365",
        products: [
            {
                name: "SUPPORT",
                description: "Service Desk и управление ИТ-услугами. Автоматизация обработки заявок, инцидентов, запросов на изменение.",
                icon: "🎫"
            },
            {
                name: "OUTSOURCE",
                description: "Управление SLA и выездными инженерами. Планирование работ, учет расходов, отчёты для заказчиков.",
                icon: "🚗"
            },
            {
                name: "PROJECTS",
                description: "Управление ИТ-проектами. Планирование, трекинг ресурсов, контроль сроков и бюджета.",
                icon: "📊"
            },
            {
                name: "HR",
                description: "HR-автоматизация и подбор персонала. Вакансии, кандидаты, онбординг, оценка сотрудников.",
                icon: "👥"
            }
        ]
    },

    // Ключевые преимущества
    advantages: {
        saas: {
            title: "SaaS модель",
            description: "Быстрый старт без капитальных затрат. Автоматические обновления. Доступ из браузера.",
            points: [
                "Нет затрат на серверы и лицензии",
                "Автоматические обновления включены",
                "Масштабируйте по мере роста",
                "Доступ 24/7 из любого места"
            ]
        },
        lowcode: {
            title: "Low-code платформа",
            description: "Настраивайте без разработчиков. Визуальный конструктор процессов.",
            points: [
                "Настраивайте процессы без программистов",
                "Визуальный конструктор workflows",
                "Гибкая настройка под ваши процессы",
                "Быстрая адаптация к изменениям"
            ]
        },
        integration: {
            title: "Бесшовная интеграция",
            description: "4 продукта в единой экосистеме. Интеграция с существующими системами.",
            points: [
                "Единая база данных для всех продуктов",
                "Интеграция с Active Directory, LDAP",
                "API для интеграции с любыми системами",
                "SSO и единая аутентификация"
            ]
        },
        implementation: {
            title: "Быстрое внедрение",
            description: "2-8 недель от старта до полного запуска.",
            points: [
                "Минимальные требования к инфраструктуре",
                "Обучение команды включено",
                "Пошаговый план внедрения",
                "Поддержка на всех этапах"
            ]
        }
    },

    // Ценности для разных ролей
    valueByRole: {
        cio: {
            title: "Для CIO/IT Directors",
            values: [
                "Прозрачность по всем ИТ-процессам",
                "Автоматические отчёты для правления",
                "Control над SLA и качеством услуг",
                "Снижение нагрузки на 1-2-й линии поддержки"
            ]
        },
        hr: {
            title: "Для HR Directors",
            values: [
                "Автоматизация подбора и онбординга",
                "Единая база кандидатов и сотрудников",
                "Трекинг KPI и оценок персонала",
                "Интеграция с_JOB порталы"
            ]
        },
        coo: {
            title: "Для COO/Operations",
            values: [
                "Оптимизация бизнес-процессов",
                "Control над сроками и бюджетами проектов",
                "Прозрачная загрузка ресурсов",
                "Автоматические уведомления и эскалации"
            ]
        },
        procurement: {
            title: "Для Procurement",
            values: [
                "Прозрачное расходование средств",
                "Control над contractor performance",
                "Автоматические SLA reports",
                "Гибкая модель подписки"
            ]
        }
    },

    // Ответы на типовые вопросы
    faq: [
        {
            question: "Сколько времени займёт внедрение?",
            answer: "Для базовой настройки — 2 недели. Для полного внедрения с интеграциями — 4-8 недель. Мы используем поэтапный подход, поэтому вы начинаете получать ценность с первых недель."
        },
        {
            question: "Как это работает с нашей текущей инфраструктурой?",
            answer: "ITSM365 — облачное SaaS-решение. Интегрируемся через API с вашими системами: Active Directory, мониторинг, helpdesk-системы. Также поддерживаем LDAP и SSO."
        },
        {
            question: "Дорого по сравнению с конкурентами?",
            answer: "SaaS-модель означает нет upfront costs — платите за подписку. Средний ROI наших клиентов — 6 месяцев за счёт сокращения ручного труда и улучшения SLA. Могу подготовить exact calculation для вашего случая."
        },
        {
            question: "У нас уже есть [Jira/ServiceNow/другая система]",
            answer: "Многие наши клиенты приходят из других систем. Ключевые преимущества: простота интерфейса, faster time-to-value, low-code настройка без программистов. Могу показать demo конкретного кейса миграции."
        },
        {
            question: "Нам требуется On-Premise решение",
            answer: "Понимаю ваши требования. Для большинства случаев облачное решение безопаснее и проще. Однако для Enterprise клиентов мы можем обсудить private deployment или hybrid модель."
        },
        {
            question: "Как обеспечить data security?",
            answer: "Мы соответствуем ISO 27001. Data хранится на защищённых серверах в РФ. Regular security audits, backup, disaster recovery. Также можем подписать NDA с detailed security provisions."
        }
    ],

    // ROI Calculator данные
    roi: {
        title: "ROI Калькулятор",
        description: "Типовая экономия от внедрения ITSM365",
        savings: [
            {
                category: "Сокращение ручного труда",
                calculation: "-40% времени на обработку заявок",
                example: "5 сотрудников × 2 часа/день × 250 дней × ₽500/час = ₽1,250,000/год"
            },
            {
                category: "Улучшение SLA",
                calculation: "-30% time to resolution",
                example: "Снижение простоев для бизнеса → экономия ₽2-5M/год"
            },
            {
                category: "Снижение ошибок",
                calculation: "-60% human errors",
                example: "Меньше переделок и escalations → экономия ₽500K-1M/год"
            },
            {
                category: "Улучшенная отчётность",
                calculation: "Автоматические отчёты вместо Excel",
                example: "Экономия 20 часов/месяц менеджеров"
            }
        ],
        summary: "Типовой ROI — 6-12 месяцев при инвестиции ₽500K-2M"
    },

    // Цены и модели (для ориентира)
    pricing: {
        saas: {
            title: "SaaS Подписка",
            description: "Ежемесячная оплата за пользователя или пакет",
            advantages: [
                "Нет upfront инвестиций",
                "Включены обновления и поддержка",
                "Масштабируйте по мере роста",
                "Can cancel anytime"
            ]
        },
        enterprise: {
            title: "Enterprise",
            description: "Для крупных компаний — кастомные условия",
            advantages: [
                "Фиксированная цена на 1-3 года",
                "Dedicated support manager",
                "Custom integrations",
                "SLA guarantees"
            ]
        }
    },

    // Скрипты продаж
    scripts: {
        firstMeeting: {
            structure: [
                "1. Открытие и rapport (2-3 мин)",
                "2. Discovery - выявление болей (10-15 мин)",
                "3. Краткая презентация решения (10-15 мин)",
                "4. Demo ключевых функций (15-20 мин)",
                "5. Обработка возражений (5-10 мин)",
                "6. Закрытие на следующий шаг (2-3 мин)"
            ],
            discovery: {
                title: "Discovery Questions",
                questions: [
                    "Как сейчас организована работа service desk?",
                    "Какие основные проблемы с обработкой заявок?",
                    "Как вы отслеживаете SLA?",
                    "Какие системы используете сейчас?",
                    "Кто принимает решение по таким системам?",
                    "Какой бюджет/ timeline для решения?"
                ]
            },
            objectionHandling: {
                title: "Работа с возражениями",
                framework: "Acknowledge - Don't argue - Pivot - Close",
                examples: [
                    {
                        objection: "Дорого",
                        response: "Понимаю ваши concernы по бюджету. Могу показать exact ROI calculation для вашего случая. Типично окупается за 6 месяцев за счёт [concrete benefit]. Давайте посчитаем вместе?"
                    },
                    {
                        objection: "У нас есть Jira",
                        response: "Jira - great для development. ITSM365 специализируется на service desk и business processes. Ключевые преимущества: [1-2 points]. Show you concrete case?"
                    },
                    {
                        objection: "Надо подумать/согласовать",
                        response: "Понимаю, это важное решение. Какие конкретно вопросы нужно обсудить? Могу подготовить [materials/proposal] для вашего руководства. Когда мы можем reconvene?"
                    }
                ]
            }
        },
        closing: {
            nextMeeting: {
                title: "Закрытие на следующую встречу",
                script: "Great discussing today. Next steps: I'll prepare [proposal/demo] for your team. Let's reconvene on [date/time] with [stakeholders] to discuss. Does that work?"
            },
            pilot: {
                title: "Закрытие на пилот",
                script: "Based on our discussion, I recommend a pilot on [department/use case]. Takes 2-4 weeks, gives you concrete results. After pilot - we discuss scale. What do you think?"
            },
            proposal: {
                title: "Закрытие на КП",
                script: "Great, I'll send you a proposal with [pricing/timeline/scope]. Expect it by [date]. Any other questions before we reconvene?"
            }
        }
    }
};

// Экспортируем для использования в приложении
window.ITSM365_INFO = ITSM365_INFO;
