/**
 * ITSM365 Sales Trainer - Главный контроллер приложения
 */

class App {
    constructor() {
        this.speech = null;
        this.ai = null;
        this.currentScenario = null;
        this.conversation = [];
        this.isScenarioStarted = false;
        this.scenarios = [];

        // Загружаем сценарии
        this.scenarios = this.loadScenarios();

        // Инициализируем приложение
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        // Инициализируем модуль речи
        this.speech = new SpeechManager();

        // Инициализируем AI (пока без ключа - пользователь введёт позже)
        this.ai = new AIManager({
            provider: 'groq',
            apiKey: localStorage.getItem('itsm365_api_key') || null
        });

        // Привязываем обработчики событий
        this.bindEvents();

        // Загружаем статистику
        this.loadStats();

        // Проверяем поддержку Speech API
        this.checkSpeechSupport();

        // Рендерим список сценариев
        this.renderScenarios();
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });

        // FAQ toggle
        if (typeof window.toggleFaq === 'undefined') {
            window.toggleFaq = function(element) {
                const faqItem = element.closest('.faq-item');
                faqItem.classList.toggle('active');
            };
        }

        // Фильтры сценариев
        document.getElementById('category-filter').addEventListener('change', () => {
            this.renderScenarios();
        });

        document.getElementById('difficulty-filter').addEventListener('change', () => {
            this.renderScenarios();
        });

        // Кнопка "Назад"
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showView('scenarios');
        });

        // Кнопка "Начать сценарий"
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startScenario();
        });

        // Кнопка "Завершить"
        document.getElementById('end-btn').addEventListener('click', () => {
            this.endScenario();
        });

        // Голосовой ввод
        document.getElementById('voice-btn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        // Отправка сообщения
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Отправка по Enter
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Кнопки на экране результатов
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.retryScenario();
        });

        document.getElementById('new-scenario-btn').addEventListener('click', () => {
            this.showView('scenarios');
        });

        // Обработчики Speech API
        if (this.speech) {
            this.speech.onResult = (text) => {
                this.handleVoiceResult(text);
            };

            this.speech.onError = (error) => {
                this.showError(error);
            };

            this.speech.onSpeakingStart = () => {
                this.showRecordingIndicator(true);
            };

            this.speech.onSpeakingEnd = () => {
                this.showRecordingIndicator(false);
            };
        }
    }

    /**
     * Проверка поддержки Speech API
     */
    checkSpeechSupport() {
        const support = this.speech?.isSupported();

        if (!support?.recognition) {
            this.showNotification(
                'Голосовой ввод недоступен в вашем браузере. Используйте Chrome для полной функциональности.',
                'warning'
            );
        }
    }

    /**
     * Показать уведомление
     */
    showNotification(message, type = 'info') {
        // Создаём элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Добавляем на страницу
        document.body.appendChild(notification);

        // Удаляем через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Показать индикатор записи
     */
    showRecordingIndicator(show) {
        const indicator = document.getElementById('recording-indicator');
        const voiceBtn = document.getElementById('voice-btn');

        if (show) {
            indicator.style.display = 'flex';
            voiceBtn.classList.add('recording');
        } else {
            indicator.style.display = 'none';
            voiceBtn.classList.remove('recording');
        }
    }

    /**
     * Переключить голосовой ввод
     */
    async toggleVoiceInput() {
        if (!this.speech) {
            this.showError('Голосовой ввод недоступен');
            return;
        }

        const voiceBtn = document.getElementById('voice-btn');

        if (this.speech.isRecording) {
            this.speech.stopListening();
        } else {
            try {
                // Запрашиваем разрешение на микрофон
                const hasPermission = await this.speech.requestPermission();

                if (!hasPermission) {
                    this.showError('Доступ к микрофону запрещён');
                    return;
                }

                this.speech.startListening();
            } catch (error) {
                this.showError('Не удалось запустить распознавание речи');
            }
        }
    }

    /**
     * Обработка результата распознавания речи
     */
    handleVoiceResult(text) {
        const chatInput = document.getElementById('chat-input');
        chatInput.value = text;

        // Автоматически отправляем
        this.sendMessage();
    }

    /**
     * Загрузить сценарии из JSON файлов
     */
    loadScenarios() {
        // Встроенные сценарии (в реальном приложении загрузка из файлов)
        const scenarios = [
            // ========================================
            // Демонстрации (15 сценариев)
            // ========================================
            this.getBankingScenario(),
            this.getTelecomScenario(),
            this.getRetailScenario(),
            this.getHorecaScenario(),
            this.getIntegratorScenario(),
            this.getIndustrialScenario(),
            this.getGovScenario(),

            // Сценарии с сайта salestrainer-itsm.netlify.app
            this.getFirstMeetingScenario(),
            this.getCoffeeShopScenario(),
            this.getAgroScenario(),
            this.getOutsourceScenario(),
            this.getHRAutomationScenario(),
            this.getITManagerMidScenario(),
            this.getEnterpriseHoldingScenario(),
            this.getRealEstateScenario(),

            // ========================================
            // Возражения (6 сценариев)
            // ========================================
            this.getPriceObjectionScenario(),
            this.getCompetitorObjectionScenario(),
            this.getTimelineObjectionScenario(),
            this.getNotNeededObjectionScenario(),
            this.getJiraObjectionScenario(),

            // С сайта - возражения
            this.getSatisfiedCustomerScenario(),
            this.getOnPremiseScenario(),

            // ========================================
            // Закрытие (5 сценариев)
            // ========================================
            this.getCommercialClosingScenario(),
            this.getNextMeetingClosingScenario(),
            this.getTrialClosingScenario(),

            // С сайта - закрытие
            this.getContractNegotiationScenario(),
            this.getCTONegotiationScenario()
        ];

        return scenarios;
    }

    /**
     * Рендер списка сценариев
     */
    renderScenarios() {
        const list = document.getElementById('scenarios-list');
        const categoryFilter = document.getElementById('category-filter').value;
        const difficultyFilter = document.getElementById('difficulty-filter').value;

        // Фильтруем сценарии
        let filtered = this.scenarios;

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(s => s.category === categoryFilter);
        }

        if (difficultyFilter !== 'all') {
            filtered = filtered.filter(s => s.difficulty === difficultyFilter);
        }

        // Очищаем список
        list.innerHTML = '';

        // Рендерим карточки
        filtered.forEach(scenario => {
            const card = this.createScenarioCard(scenario);
            list.appendChild(card);
        });
    }

    /**
     * Создать карточку сценария
     */
    createScenarioCard(scenario) {
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.onclick = () => this.selectScenario(scenario);

        const icon = this.getScenarioIcon(scenario.category);

        card.innerHTML = `
            <div class="scenario-card-header">
                <div class="scenario-card-title">${scenario.title}</div>
                <div class="scenario-card-icon">${icon}</div>
            </div>
            <div class="scenario-card-description">${scenario.description}</div>
            <div class="scenario-card-meta">
                <span class="badge ${scenario.category}">${this.getCategoryLabel(scenario.category)}</span>
                <span class="badge ${scenario.difficulty}">${this.getDifficultyLabel(scenario.difficulty)}</span>
            </div>
        `;

        return card;
    }

    /**
     * Получить иконку для категории
     */
    getScenarioIcon(category) {
        const icons = {
            'demo': '🎯',
            'objections': '🛡️',
            'closing': '💰'
        };
        return icons[category] || '📋';
    }

    /**
     * Получить метку категории
     */
    getCategoryLabel(category) {
        const labels = {
            'demo': 'Демонстрация',
            'objections': 'Возражения',
            'closing': 'Закрытие'
        };
        return labels[category] || category;
    }

    /**
     * Получить метку сложности
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            'beginner': 'Начальный',
            'intermediate': 'Средний',
            'advanced': 'Продвинутый'
        };
        return labels[difficulty] || difficulty;
    }

    /**
     * Выбрать сценарий
     */
    selectScenario(scenario) {
        this.currentScenario = scenario;
        this.showScenarioView();
    }

    /**
     * Показать вид сценария
     */
    showScenarioView() {
        const scenario = this.currentScenario;

        // Заполняем информацию о сценарии
        document.getElementById('scenario-title').textContent = scenario.title;
        document.getElementById('scenario-category').textContent = this.getCategoryLabel(scenario.category);
        document.getElementById('scenario-category').className = `badge ${scenario.category}`;
        document.getElementById('scenario-difficulty').textContent = this.getDifficultyLabel(scenario.difficulty);
        document.getElementById('scenario-difficulty').className = `badge ${scenario.difficulty}`;
        document.getElementById('scenario-duration').textContent = `⏱ ${scenario.duration || '15'} мин`;

        // Заполняем информацию о клиенте
        document.getElementById('client-name').textContent = scenario.client_profile.name;
        document.getElementById('client-role').textContent = scenario.client_profile.role;
        document.getElementById('client-company').textContent = `${scenario.client_profile.company} • ${scenario.client_profile.industry}`;

        // Заполняем боли клиента
        const painsList = document.getElementById('client-pains');
        painsList.innerHTML = '';
        scenario.client_profile.pain_points.forEach(pain => {
            const li = document.createElement('li');
            li.textContent = pain;
            painsList.appendChild(li);
        });

        // Заполняем цели
        const objectivesList = document.getElementById('scenario-objectives');
        objectivesList.innerHTML = '';
        scenario.objectives.forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj;
            objectivesList.appendChild(li);
        });

        // Сбрасываем чат
        this.resetChat();

        // Показываем вид
        this.showView('simulation');
    }

    /**
     * Сброс чата
     */
    resetChat() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = `
            <div class="message system">
                <div class="message-content">
                    <p>Нажмите "Начать" чтобы запустить сценарий</p>
                </div>
            </div>
        `;

        document.getElementById('start-btn').style.display = 'inline-block';
        document.getElementById('end-btn').style.display = 'none';
    }

    /**
     * Начать сценарий
     */
    async startScenario() {
        if (!this.ai.apiKey) {
            // Запрашиваем API ключ
            const apiKey = prompt('Введите ваш Groq API ключ (получить бесплатно на https://groq.com):');

            if (!apiKey) {
                this.showError('API ключ необходим для работы тренажёра');
                return;
            }

            // Сохраняем ключ
            localStorage.setItem('itsm365_api_key', apiKey);
            this.ai.apiKey = apiKey;

            // Проверяем доступность
            const isAvailable = await this.ai.checkAvailability();

            if (!isAvailable) {
                this.showError('Не удалось подключиться к API. Проверьте ключ.');
                return;
            }
        }

        this.isScenarioStarted = true;
        this.conversation = [];

        // Устанавливаем системный промпт
        this.ai.setSystemPrompt(this.currentScenario.system_prompt);
        this.ai.clearMessages();

        // Скрываем кнопку "Начать", показываем "Завершить"
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('end-btn').style.display = 'inline-block';

        // Очищаем системное сообщение
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        // Приветствие клиента
        await this.getClientGreeting();
    }

    /**
     * Получить приветствие клиента
     */
    async getClientGreeting() {
        const greeting = this.currentScenario.client_profile.greeting ||
            'Добрый день! Расскажите о вашей системе.';

        this.addMessage('assistant', greeting);

        // Произносим приветствие
        if (this.speech) {
            try {
                await this.speech.speak(greeting);
            } catch (error) {
                console.error('Ошибка при синтезе речи:', error);
            }
        }

        // Добавляем в историю
        this.conversation.push({ role: 'assistant', content: greeting });
    }

    /**
     * Отправить сообщение
     */
    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        if (!message || !this.isScenarioStarted) return;

        // Добавляем сообщение пользователя
        this.addMessage('user', message);
        this.conversation.push({ role: 'user', content: message });

        // Очищаем поле ввода
        chatInput.value = '';

        // Отключаем кнопки
        this.setInputEnabled(false);

        try {
            // Получаем ответ от AI
            const response = await this.ai.getResponse(message);

            // Добавляем ответ ассистента
            this.addMessage('assistant', response);
            this.conversation.push({ role: 'assistant', content: response });

            // Произносим ответ
            if (this.speech) {
                await this.speech.speak(response);
            }
        } catch (error) {
            this.showError('Ошибка при получении ответа: ' + error.message);
        } finally {
            // Включаем кнопки
            this.setInputEnabled(true);
        }
    }

    /**
     * Добавить сообщение в чат
     */
    addMessage(role, content) {
        const chatMessages = document.getElementById('chat-messages');

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const speaker = document.createElement('div');
        speaker.className = 'message-speaker';
        speaker.textContent = role === 'user' ? 'Вы' : this.currentScenario.client_profile.name;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const paragraph = document.createElement('p');
        paragraph.textContent = content;

        messageContent.appendChild(paragraph);
        messageDiv.appendChild(speaker);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);

        // Прокручиваем вниз
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Включить/выключить ввод
     */
    setInputEnabled(enabled) {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const voiceBtn = document.getElementById('voice-btn');

        chatInput.disabled = !enabled;
        sendBtn.disabled = !enabled;
        voiceBtn.disabled = !enabled;
    }

    /**
     * Завершить сценарий
     */
    async endScenario() {
        this.isScenarioStarted = false;

        // Останавливаем речь
        if (this.speech) {
            this.speech.stopSpeaking();
        }

        // Оцениваем диалог
        const evaluation = await this.ai.evaluateDialog(
            this.conversation,
            this.currentScenario.success_criteria
        );

        // Сохраняем результат
        this.saveResult(evaluation.score);

        // Показываем результаты
        this.showResults(evaluation);
    }

    /**
     * Показать результаты
     */
    showResults(evaluation) {
        // Заполняем результаты
        document.getElementById('final-score').textContent = `${evaluation.score}%`;

        // Заполняем выполненные цели
        const achievedList = document.getElementById('achieved-objectives');
        achievedList.innerHTML = '';

        if (evaluation.strengths && evaluation.strengths.length > 0) {
            evaluation.strengths.forEach(strength => {
                const li = document.createElement('li');
                li.textContent = strength;
                achievedList.appendChild(li);
            });
        } else {
            achievedList.innerHTML = '<li>Анализ выполненных целей недоступен</li>';
        }

        // Заполняем рекомендации
        const feedbackText = document.getElementById('feedback-text');
        feedbackText.innerHTML = `
            <p>${evaluation.feedback || 'Продолжайте практиковаться!'}</p>
            ${evaluation.improvements && evaluation.improvements.length > 0 ? `
                <p><strong>На что обратить внимание:</strong></p>
                <ul>
                    ${evaluation.improvements.map(imp => `<li>${imp}</li>`).join('')}
                </ul>
            ` : ''}
        `;

        // Показываем вид результатов
        this.showView('results');
    }

    /**
     * Повторить сценарий
     */
    retryScenario() {
        this.showScenarioView();
    }

    /**
     * Показать вид
     */
    showView(viewName) {
        // Скрываем все виды
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Показываем нужный вид
        const view = document.getElementById(`${viewName}-view`);
        if (view) {
            view.classList.add('active');
        }

        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Если статистика - обновляем
        if (viewName === 'stats') {
            this.renderStats();
        }
    }

    /**
     * Сохранить результат
     */
    saveResult(score) {
        const history = JSON.parse(localStorage.getItem('itsm365_history') || '[]');

        history.push({
            scenario: this.currentScenario.id,
            title: this.currentScenario.title,
            score: score,
            date: new Date().toISOString()
        });

        localStorage.setItem('itsm365_history', JSON.stringify(history));
    }

    /**
     * Загрузить статистику
     */
    loadStats() {
        const history = JSON.parse(localStorage.getItem('itsm365_history') || '[]');
        return history;
    }

    /**
     * Рендер статистики
     */
    renderStats() {
        const history = this.loadStats();

        // Общая статистика
        const total = history.length;
        const avgScore = total > 0
            ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / total)
            : 0;
        const bestScore = total > 0
            ? Math.max(...history.map(h => h.score))
            : 0;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-avg').textContent = `${avgScore}%`;
        document.getElementById('stat-best').textContent = `${bestScore}%`;

        // История
        const historyList = document.getElementById('history-list');

        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-state">Пока нет завершённых тренировок</p>';
        } else {
            historyList.innerHTML = '';

            // Последние записи первыми
            [...history].reverse().forEach(entry => {
                const date = new Date(entry.date);
                const dateStr = date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-item-info">
                        <div class="history-item-title">${entry.title}</div>
                        <div class="history-item-date">${dateStr}</div>
                    </div>
                    <div class="history-item-score">${entry.score}%</div>
                `;

                historyList.appendChild(item);
            });
        }
    }

    // ============================================
    // СЦЕНАРИИ
    // ============================================

    /**
     * Сценарий: Банк (продвинутый)
     */
    getBankingScenario() {
        return {
            id: 'demo-banking-advanced',
            category: 'demo',
            difficulty: 'advanced',
            duration: 15,
            title: 'Демо ITSM365 для CIO банка',
            description: 'Провести демонстрацию для Ивана, CIO крупного банка. Ключевые боли: SLA не выполняются, инциденты теряются, нужны отчёты для правления.',
            client_profile: {
                name: 'Иван',
                role: 'CIO (Chief Information Officer)',
                company: 'Комерческий банк "Солид"',
                industry: 'Финансы',
                company_size: '2000+ сотрудников',
                pain_points: [
                    'SLA не выполняются, недовольство бизнес-подразделений',
                    'Инциденты теряются, нет прозрачности',
                    'Нет отчётов для правления по качеству сервиса',
                    'Change Management - ручные процессы'
                ],
                personality: 'expert-skeptic',
                greeting: 'Добрый день. У нас 15 минут. Что предлагаем посмотреть?'
            },
            objectives: [
                'Выявить ключевые боли клиента',
                'Показать Dashboard с метриками SLA',
                'Демонстрировать автоматизацию Change Management',
                'Обработать возражение по цене',
                'Закрыть на POC (Proof of Concept)'
            ],
            system_prompt: `Ты Иван, CIO крупного банка "Солид". У тебя 2000+ сотрудников в компании.

Твой характер:
- Эксперт, скептически относишься к новым системам
- Ценишь время, не любишь долгих презентаций
- Знаешь конкурентов (ServiceNow, Naumen)
- Боли: SLA не выполняются, инциденты теряются, нужны отчёты для правления

Возражения которые ты используешь:
- "У вас дорого"
- "ServiceNow известнее на рынке"
- "Сколько времени на внедрение?"
- "Нам надо подумать/согласовать"

Твоя цель - понять действительно ли ITSM365 решит твои проблемы. Отвечай коротко, по делу. Макс 2-3 предложения.`,
            success_criteria: {
                identifies_pain: 'Выявил ли менеджер боли клиента?',
                demonstrates_value: 'Показал ли ценность для банка?',
                handles_objection: 'Обработал ли возражение по цене?',
                next_step_defined: 'Закрыл ли на POC?'
            }
        };
    }

    /**
     * Сценарий: Телеком
     */
    getTelecomScenario() {
        return {
            id: 'demo-telecom-intermediate',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 12,
            title: 'Демо для телеком-оператора',
            description: 'Демонстрация для Марии, IT Director телеком-оператора. Основной фокус на автоматизацию обработки инцидентов и отчётность.',
            client_profile: {
                name: 'Мария',
                role: 'IT Director',
                company: 'Телеком "Связь-Плюс"',
                industry: 'Телеком',
                company_size: '500-1000 сотрудников',
                pain_points: [
                    'Больше 100 инцидентов в день, обрабатывают вручную',
                    'Нет распределенной нагрузки на агентов',
                    'Заказчики жалуются на сроки ответа',
                    'Нет аналитики по проблемным зонам'
                ],
                personality: 'pragmatic',
                greeting: 'Здравствуйте! Расскажите, как ваша система поможет нам сократить время обработки заявок?'
            },
            objectives: [
                'Показать автоматическую маршрутизацию инцидентов',
                'Демонстрировать самообслуживание для заказчиков',
                'Показать отчёты и аналитику',
                'Закрыть на следующую встречу с командой'
            ],
            system_prompt: `Ты Мария, IT Director телеком-оператора "Связь-Плюс". У вас 500-1000 сотрудников.

Твой характер:
- Прагматичный, ориентирована на результат
- Заботишься о заказчиках и их удовлетворённости
- Сомневаешься в новых системах - "сложно внедрять"

Твоя главная боль - 100+ инцидентов в день, всё вручную. Заказчики недовольны сроками.

Возражения:
- "Сложно ли внедрить?"
- "Сколько это стоит?"
- "У нас уже есть Jira, зачем новая система?"

Отвечай профессионально, задавай вопросы по существу. 2-3 предложения.`,
            success_criteria: {
                shows_automation: 'Показал ли автоматизацию?',
                addresses_main_pain: 'Отвечает ли на главную боль?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Возражение - Цена
     */
    getPriceObjectionScenario() {
        return {
            id: 'objection-price',
            category: 'objections',
            difficulty: 'intermediate',
            duration: 8,
            title: 'Возражение: "У вас дорого"',
            description: 'Работа с возражением по цене. Клиент - IT Manager торговой сети сравнивает с 1C.',
            client_profile: {
                name: 'Дмитрий',
                role: 'IT Manager',
                company: 'Торговая сеть "Продукты"',
                industry: 'Ритейл',
                company_size: '1000+ сотрудников',
                pain_points: [
                    'Не справляются с количеством заявок от магазинов',
                    'Нет единой базы знаний',
                    'Магазины жалуются на сроки'
                ],
                personality: 'price-sensitive',
                greeting: 'Посмотрели демо, всё неплохо. Но у вас цены выше чем у 1C. Почему нам платить больше?'
            },
            objectives: [
                'Не спорить напрямую о цене',
                'Перевести в ценность (value)',
                'Показать ROI',
                'Закрыть на КП или следующую встречу'
            ],
            system_prompt: `Ты Дмитрий, IT Manager торговой сети. 1000+ сотрудников.

Ты только что посмотрел демо ITSM365. Тебе понравилось, НО ты замечаешь что цена выше чем у 1C.

Твоя позиция:
- "1C дешевле"
- "Зачем нам платить больше за похожий функционал?"
- "Бюджет ограничен"

Будь упорён на цене, но готов слушать. Не говори "нет" сразу - дай менеджеру шанс аргументировать. Отвечай коротко.`,
            success_criteria: {
                no_price_argument: 'Не спорил ли о цене напрямую?',
                value_shown: 'Показал ли ценность?',
                roi_mentioned: 'Упомянул ли ROI?',
                next_step: 'Закрыл ли на следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Возражение - Конкуренты
     */
    getCompetitorObjectionScenario() {
        return {
            id: 'objection-competitor',
            category: 'objections',
            difficulty: 'advanced',
            duration: 10,
            title: 'Возражение: "Выбираем между вами и Naumen"',
            description: 'Работа с конкурентным возражением. Клиент сравнивает ITSM365 с Naumen.',
            client_profile: {
                name: 'Алексей',
                role: 'Директор ИТ',
                company: 'Телеком оператор "НетАй"',
                industry: 'Телеком',
                company_size: '1500+ сотрудников',
                pain_points: [
                    'Нужна единая платформа для ИТ и бизнеса',
                    'Сложные процессы Change Management',
                    'Требуется кастомизация под телеком'
                ],
                personality: 'analytical',
                greeting: 'Мы находимся в финальном выборе. Сравниваем вас с Naumen. Они на рынке дольше, больше кейсов. Почему выбрать вас?'
            },
            objectives: [
                'Не критиковать конкурента',
                'Показать дифференциаторы ITSM365',
                'Привести релевантные кейсы',
                'Попросить о финальном сравнении'
            ],
            system_prompt: `Ты Алексей, Директор ИТ телеком-оператора "НетАй". 1500+ сотрудников.

Вы в финальном выборе между ITSM365 и Naumen.

Твоя позиция:
- Naumen на рынке дольше, "проверенный"
- "У них больше кейсов в телекоме"
- "Не хочется рисковать с новой системой"

Требовательный, аналитический. Хочешь услышать конкретные аргументы "за" ITSM365. Не готов принять решение сразу - нужно обсудить с командой. Отвечай вдумчиво.`,
            success_criteria: {
                no_competitor_bashing: 'Не критиковал ли конкурента?',
                differentiators_shown: 'Показал ли дифференциаторы?',
                cases_mentioned: 'Привёл ли кейсы?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Закрытие на КП
     */
    getCommercialClosingScenario() {
        return {
            id: 'closing-commercial',
            category: 'closing',
            difficulty: 'intermediate',
            duration: 8,
            title: 'Закрытие: Коммерческое предложение',
            description: 'Переход к КП после успешной демонстрации. Клиент заинтересован, нужно согласование бюджета.',
            client_profile: {
                name: 'Елена',
                role: 'Руководитель службы поддержки',
                company: 'Страховая компания "Гарант"',
                industry: 'Финансы',
                company_size: '800+ сотрудников',
                pain_points: [
                    'Команда перегружена',
                    'Заказчики недовольны сроками',
                    'Нужна автоматизация'
                ],
                personality: 'interested-but-cautious',
                greeting: 'Спасибо за демо, всё понятно. Система интересная, но мне нужно согласовать бюджет с финансовым директором. Что делать дальше?'
            },
            objectives: [
                'Подтвердить интерес',
                'Согласовать состав КП',
                'Установить дедлайн решения',
                'Получить согласие на отправку КП'
            ],
            system_prompt: `Ты Елена, Руководитель службы поддержки страховой компании "Гарант". 800+ сотрудников.

Тебе понравилось демо, ты видишь ценность. НО:

- Нужна aprobация бюджета
- Финансовый директор спрашивает "зачем нам ещё одна система?"
- Нужно подготовить обоснование для правления

Твоя позиция - "интересно, но нужно согласовать". Ты не говоришь "нет", но и не даёшь окончательного "да". Попроси материалы для обоснования. Отвечай дружелюбно, но осторожно.`,
            success_criteria: {
                interest_confirmed: 'Подтвердил ли интерес?',
                proposal_scope: 'Согласовал ли состав КП?',
                deadline_set: 'Установил ли дедлайн?',
                action_defined: 'Есть ли чёткий следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Ритейл
     */
    getRetailScenario() {
        return {
            id: 'demo-retail-beginner',
            category: 'demo',
            difficulty: 'beginner',
            duration: 12,
            title: 'Демо для ритейл сети',
            description: 'Демонстрация для Ольги, Helpdesk Manager сети магазинов "Свой". Фокус на самообслуживание и мобильное приложение.',
            client_profile: {
                name: 'Ольга',
                role: 'Helpdesk Manager',
                company: 'Сеть магазинов "Свой"',
                industry: 'Ритейл/E-commerce',
                company_size: '500+ сотрудников, 50+ магазинов',
                pain_points: [
                    'Магазины звонят по мелким вопросам, перегрузка',
                    'Нет базы знаний для сотрудников',
                    'Заявки теряются, нет прозрачности',
                    'Нужна мобильная связь с магазинами'
                ],
                personality: 'friendly-but-busy',
                greeting: 'Здравствуйте! У нас 50 магазинов по всей стране. Каждый день звонят с одними и теми же вопросами. Поможет ли ваша система разгрузить нашу линию?'
            },
            objectives: [
                'Показать портал самообслуживания',
                'Демонстрировать мобильное приложение',
                'Показать базу знаний',
                'Закрыть на следующую встречу'
            ],
            system_prompt: `Ты Ольга, Helpdesk Manager сети магазинов "Свой". 50+ магазинов, 500+ сотрудников.

Твой характер:
- Дружелюбная, но очень занятая
- Практичная - интересуется как это упростит работу
- Заботишься о сотрудниках магазинов

Твоя главная боль - магазины звонят постоянно с простыми вопросами, перегруз линии.

Возражения:
- "Сложно ли для наших сотрудников?"
- "Сколько времени на внедрение?"
- "У нас нет отдельного бюджета на это"

Отвечай дружелюбно, задавай практические вопросы. 2-3 предложения.`,
            success_criteria: {
                self_service_shown: 'Показал ли портал самообслуживания?',
                mobile_mentioned: 'Упомянул ли мобильное приложение?',
                main_pain_addressed: 'Отвечает ли на главную боль?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: HoReCa
     */
    getHorecaScenario() {
        return {
            id: 'demo-horeca-intermediate',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 12,
            title: 'Демо для ресторанного бизнеса',
            description: 'Демонстрация для Сергея, IT Manager сети ресторанов. Специфика - работа 24/7, сезонность, много фронт-офиса.',
            client_profile: {
                name: 'Сергей',
                role: 'IT Manager',
                company: 'Ресторанная группа "Вкус"',
                industry: 'HoReCa (рестораны/кафе)',
                company_size: '1000+ сотрудников, 20 ресторанов',
                pain_points: [
                    'Работаем 24/7, нужна круглосуточная поддержка',
                    'Много персонала на сменах, высокая текучесть',
                    'Фронт-офис не понимает ИТ术语',
                    'Сезонность - лето перегрузка'
                ],
                personality: 'pragmatic',
                greeting: 'Добрый день! У нас рестораны работают с 10 до 23, плюсdelivery. Служба поддержки должна быть в том же режиме. Как ваша справляется с нагрузкой 24/7?'
            },
            objectives: [
                'Показать Escalation и приоритизацию',
                'Демонстрировать SLA для 24/7',
                'Показать простоту интерфейса для фронт-офиса',
                'Обработать возражение по цене',
                'Закрыть на пилотный проект'
            ],
            system_prompt: `Ты Сергей, IT Manager ресторанной группы "Вкус". 20 ресторанов, 1000+ сотрудников.

Твой характер:
- Прагматичный, ценишь простоту
- Заботишься о непрерывности бизнеса
- Сомневаешься в сложных системах

Твоя специфика - 24/7 работа, высокая текучесть персонала, фронт-офис (официанты, повара) не разбираются в ИТ.

Возражения:
- "Сложно ли для наших сотрудников без ИТ-бэкграунда?"
- "Что в нерабочее время? Кто будет отвечать?"
- "У нас ограниченный бюджет"

Отвечай по делу, интересуйся практикой. 2-3 предложения.`,
            success_criteria: {
                sla_24_7_shown: 'Показал ли SLA 24/7?',
                simplicity_addressed: 'Отвечает ли на вопрос сложности?',
                escalation_mentioned: 'Упомянул ли эскалацию?',
                pilot_agreed: 'Закрыл ли на пилот?'
            }
        };
    }

    /**
     * Сценарий: Интеграторы/ИТ-компании
     */
    getIntegratorScenario() {
        return {
            id: 'demo-integrator-advanced',
            category: 'demo',
            difficulty: 'advanced',
            duration: 15,
            title: 'Демо для ИТ-интегратора',
            description: 'Продажа ИТ-интегратору который будет внедрять ITSM365 у своих клиентов. B2B2C модель.',
            client_profile: {
                name: 'Андрей',
                role: 'Руководитель направления внедрений',
                company: 'ИТ-интегратор "ТехноПро"',
                industry: 'ИТ-услуги/Интеграция',
                company_size: '200+ сотрудников, 50+ внедрений в год',
                pain_points: [
                    'Сложно продавать клиентам "внедрение ИТSM" - не хватает продукта',
                    'Каждый проект с нуля, нет стандарта',
                    'Клиенты спрашивают про "сервисный дес"',
                    'Нужна система которую можно предложить как готовое решение'
                ],
                personality: 'business-oriented',
                greeting: 'Приветствую! Мы системный интегратор. Внедряем разный софт - ERP, CRM, и т.д. Интересно, как ITSM365 может стать частью нашего портфеля для клиентов?'
            },
            objectives: [
                'Понять бизнес-модель интегратора',
                'Показать возможности white-label/партнёрства',
                'Демонстрировать скорость внедрения',
                'Обсудить маржинальность для интегратора',
                'Закрыть на партнёрское соглашение'
            ],
            system_prompt: `Ты Андрей, Руководитель направления внедрений в ИТ-интеграторе "ТехноПро". 200+ сотрудников.

Твой характер:
- Ориентирован на бизнес, считаешь деньги
- Эксперт во внедрениях, знаешь рынок
- Дипломатичный, но требовательный

Твоя бизнес-модель - вы берёте проекты у клиентов и внедряете ПО. Интересно как ITSM365 может быть:

- Продуктом который вы предлагаете клиентам
- Инструментом для ваших консультантов
- Источником регулярного дохода (recurring revenue)

Возражения:
- "Какие условия партнёрства?"
- "Какая маржа для нас?"
- "Будет ли white-label?"
- "Обучите ли нашу команду?"

Отвечай как бизнес-партнёр. Давай но цени своё время. 2-3 предложения.`,
            success_criteria: {
                partnership_model_shown: 'Показал ли модель партнёрства?',
                margins_discussed: 'Обсудил ли маржинальность?',
                white_label_mentioned: 'Упомянул ли white-label?',
                partnership_agreed: 'Закрыл ли на партнёрство?'
            }
        };
    }

    /**
     * Сценарий: Промышленность
     */
    getIndustrialScenario() {
        return {
            id: 'demo-industrial-intermediate',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 12,
            title: 'Демо для производственного предприятия',
            description: 'Демонстрация для Владимира, IT Director завода. Специфика - критичные производственные системы, сложная структура.',
            client_profile: {
                name: 'Владимир',
                role: 'IT Director',
                company: 'Машиностроительный завод "Прогресс"',
                industry: 'Промышленность/Логистика',
                company_size: '2000+ сотрудников',
                pain_points: [
                    'Простой линии стоит миллионы, нужна быстрая реакция',
                    'Сложная оргструктура - цеха, склады, офисы',
                    'Нет связи между производством и ИТ',
                    'Change Management для критичных систем'
                ],
                personality: 'conservative-cautious',
                greeting: 'Добрый день. У нас производственное предприятие. Простой одного цеха - это миллион рублей в час. Как ваша система обеспечит быстрое реагирование на инциденты?'
            },
            objectives: [
                'Показать приоритизацию инцидентов',
                'Демонстрировать Escalation для критичных систем',
                'Показать интеграцию с мониторингом',
                'Обработать возражение "много изменит"',
                'Закрыть на техническую встречу'
            ],
            system_prompt: `Ты Владимир, IT Director машиностроительного завода "Прогресс". 2000+ сотрудников.

Твой характер:
- Консервативный, не любишь резких изменений
- Ответственный - простой производства критичен
- Эксперт, детально разбираешься в системах

Твоя специфика:
- Простой линии = миллионы потерь
- Сложная структура: производство, склады, логистика, офисы
- Нужен чёткий Change Management для критичных систем

Возражения:
- "Слишком много изменит для наших процессов"
- "А если система упадёт?"
- "Сколько времени на внедрение критичных функций?"
- "Нам дорог каждый день простоя"

Отвечай с осторожностью, задавай детальные вопросы. 2-3 предложения.`,
            success_criteria: {
                critical_incidents_shown: 'Показал ли работу с критичными инцидентами?',
                escalation_demonstrated: 'Демострировал ли эскалацию?',
                risk_addressed: 'Отвечает ли на риск изменений?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Госsector/Образование
     */
    getGovScenario() {
        return {
            id: 'demo-gov-beginner',
            category: 'demo',
            difficulty: 'beginner',
            duration: 10,
            title: 'Демо для университета',
            description: 'Демонстрация для Татьяны, начальник ИТ отдела университета. Особенности - бюджет, сроки, гранты.',
            client_profile: {
                name: 'Татьяна',
                role: 'Начальник ИТ отдела',
                company: 'Государственный технический университет',
                industry: 'Образование/Gossector',
                company_size: '1000+ сотрудников, 15000 студентов',
                pain_points: [
                    'Студенты и преподаватели не знают куда обращаться',
                    'Заявки теряются в переписке',
                    'Нужно отчитываться по грантам - нет статистики',
                    'Бюджет ограничен, difficile обосновать'
                ],
                personality: 'formal-patient',
                greeting: 'Добрый день. У нас университет - 15000 студентов, тысячи преподавателей. Все обращаются к нам по-разному: в чатах, по почте, лично. Нужно упорядочить этот процесс.'
            },
            objectives: [
                'Показать simplicity интерфейса',
                'Демонстрировать отчёты для отчётности',
                'Показать работу с большим объёмом заявок',
                'Обосновать ROI для бюджета'
            ],
            system_prompt: `Ты Татьяна, Начальник ИТ отдела государственного технического университета. 1000+ сотрудников, 15000 студентов.

Твой характер:
- Формальная, официальная
- Терпеливая, привыкла к бюрократии
- Заботишься о студентах и преподавателях

Твоя специфика:
- Госучреждение - бюрократия, бюджеты, тендеры
- Пользователи: студенты (молодые), преподаватели (разного возраста), сотрудники
- Нужна отчётность для грантов и проверок

Возражения:
- "Сколько стоит?"
- "Как закупать через тендер?"
- "Сложно ли для наших пользователей?"
- "Нужно согласовать с руководством"

Отвечай официально, но вежливо. Интересуйся практическими аспектами. 2-3 предложения.`,
            success_criteria: {
                simplicity_shown: 'Показал ли простоту интерфейса?',
                reports_mentioned: 'Упомянул ли отчёты?',
                volume_addressed: 'Отвечает ли на объём заявок?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Возражение - Сроки внедрения
     */
    getTimelineObjectionScenario() {
        return {
            id: 'objection-timeline',
            category: 'objections',
            difficulty: 'intermediate',
            duration: 8,
            title: 'Возражение: "Долго внедрять"',
            description: 'Работа с возражением по срокам. Клиент боится долгого внедрения и простоя бизнеса.',
            client_profile: {
                name: 'Максим',
                role: 'IT Director',
                company: 'Логистическая компания "Транзит"',
                industry: 'Логистика',
                company_size: '800+ сотрудников',
                pain_points: [
                    'Нужно оперативно реагировать на заявки',
                    'Текущая система не справляется',
                    'Операционные процессы не терпят простоя'
                ],
                personality: 'impatient-pragmatic',
                greeting: 'Система нравится, НО вы говорили про 3-6 месяцев внедрение. Мы не можем столько ждать. Нужен quick win - результаты в течение месяца. Что скажете?'
            },
            objectives: [
                'Признать опасения клиента',
                'Предложить phased approach (поэтапно)',
                'Показать quick wins (быстрые результаты)',
                'Закрыть на пилот или демо-доступ'
            ],
            system_prompt: `Ты Максим, IT Director логистической компании "Транзит". 800+ сотрудников.

Тебе понравилась система, НО тебя пугают сроки внедрения 3-6 месяцев.

Твоя позиция:
- "Мы в.operационном бизнесе, не можем ждать"
- "Нужны результаты в течение месяца"
- "Quick win или не интересует"

Будь упорён на сроках. Готов слушать но требуешь конкретики. Отвечай коротко, по делу.`,
            success_criteria: {
                concern_acknowledged: 'Признал ли опасение?',
                phased_proposed: 'Предложил ли поэтапный подход?',
                quick_wins_shown: 'Показал ли быстрые результаты?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Возражение - "Нам не нужно"
     */
    getNotNeededObjectionScenario() {
        return {
            id: 'objection-not-needed',
            category: 'objections',
            difficulty: 'beginner',
            duration: 8,
            title: 'Возражение: "Нам не нужно, работаем в Excel"',
            description: 'Работа с возражением "у нас всё работает". Клиент не видит ценности.',
            client_profile: {
                name: 'Ирина',
                role: 'Office Manager',
                company: 'Небольшая дизайнерская студия',
                industry: 'Дизайн/Креатив',
                company_size: '30 сотрудников',
                pain_points: [
                    'Заявки теряются в почте и мессенджерах',
                    'Никто не знает статусы заявок',
                    'Зависимость от одного сотрудника'
                ],
                personality: 'skeptical-informal',
                greeting: 'Добрый день! Выглядит интересная система, НО честно - у нас 30 человек, у нас все в Excel и WhatsApp. Нам хватает. Зачем усложнять?'
            },
            objectives: [
                'Не спорить с "нам хватает"',
                'Выяснить скрытые боли',
                'Показать ценность (value vs complexity)',
                'Предложить триал или демо-доступ'
            ],
            system_prompt: `Ты Ирина, Office Manager небольшой дизайнерской студии. 30 сотрудников.

Твоя позиция:
- "У нас всё работает в Excel и WhatsApp"
- "Нам не нужны сложные системы"
- "У нас нет бюджета на это"

Ниже поверху, но может признаёшь проблемы если спросить правильно. Дружелюбная но скептическая. Отвечай коротко.`,
            success_criteria: {
                no_argument: 'Не спорил ли напрямую?',
                pains_explored: 'Выяснил ли скрытые боли?',
                value_shown: 'Показал ли ценность?',
                next_step: 'Предложил ли триал?'
            }
        };
    }

    /**
     * Сценарий: Возражение - Jira/Atlassian
     */
    getJiraObjectionScenario() {
        return {
            id: 'objection-jira',
            category: 'objections',
            difficulty: 'advanced',
            duration: 10,
            title: 'Возражение: "У нас есть Jira"',
            description: 'Работа с возражением о существующей системе (Jira). Клиент использует Atlassian.',
            client_profile: {
                name: 'Дмитрий',
                role: 'Head of IT Operations',
                company: 'Финтех стартап',
                industry: 'Финтех/Стартап',
                company_size: '200+ сотрудников',
                pain_points: [
                    'Jira не заточена под service desk',
                    'Разработчики счастливы, service desk - нет',
                    'Нет SLA и eskalation как в ITSM',
                    'Business не понимает Jira интерфейс'
                ],
                personality: 'technical-product-owner',
                greeting: 'Послушайте, мы уже заплатили за Jira Software + Jira Service Management. Зачем нам ещё одна система? Чем ITSM365 лучше Jira?'
            },
            objectives: [
                'Не критиковать Jira',
                'Показать ITSM-специфичные функции',
                'Демонстрировать simplicity для non-IT',
                'Предложить интеграцию или co-existence'
            ],
            system_prompt: `Ты Дмитрий, Head of IT Operations в финтех стартапе. 200+ сотрудников.

У вас уже есть Jira Software + Jira Service Management. Ты product-minded, технический.

Твоя позиция:
- "Мы уже платим за Atlassian"
- "Зачем ещё один инструмент?"
- "ITSM365 vs Jira - чем лучше?"

Требовательный к аргументам. Знаешь Jira. Хочешь услышать concrete differentiation. Не готов покупать "ещё одну систему" без good reason. Отвечай экспертно.`,
            success_criteria: {
                no_jira_bashing: 'Не критиковал ли Jira?',
                itsm_differentiation: 'Показал ли ITSM отличия?',
                simplicity_argument: 'Аргументировал ли simplicity?',
                coexistence_proposed: 'Предложил ли co-existence?'
            }
        };
    }

    /**
     * Сценарий: Закрытие - Следующая встреча
     */
    getNextMeetingClosingScenario() {
        return {
            id: 'closing-next-meeting',
            category: 'closing',
            difficulty: 'beginner',
            duration: 6,
            title: 'Закрытие: Следующая встреча',
            description: 'Закрытие первого звонка на следующую встречу с командой. Стандартная ситуация.',
            client_profile: {
                name: 'Анна',
                role: 'IT Manager',
                company: 'Строительная компания "СтройМастер"',
                industry: 'Строительство',
                company_size: '300+ сотрудников',
                pain_points: [
                    'Нет единой системы',
                    'Заявки обрабатывают ad-hoc',
                    'Нужна прозрачность'
                ],
                personality: 'professional-open',
                greeting: 'Спасибо за презентацию, система интересная. Мне нужно обсудить с командой - с ИТ ребятами и с бизнесом. Когда можно созвониться снова?'
            },
            objectives: [
                'Подтвердить интерес',
                'Установить дату/время следующей встречи',
                'Уточнить кто будет на встрече',
                'Отправить календарный приглашение'
            ],
            system_prompt: `Ты Анна, IT Manager строительной компании "СтройМастер". 300+ сотрудников.

Тебе понравилась презентация, ты видишь ценность. Хочешь обсудить с командой.

Твоя позиция:
- "Интересно, нужна команда на следующей встрече"
- "Когда можем созвониться?"
- "Скиньте материалы для команды"

Дружелюбная, профессиональная. Готова назначить следующую встречу. Отвечай открыто.`,
            success_criteria: {
                interest_confirmed: 'Подтвердил ли интерес?',
                date_set: 'Установил ли дату следующей встречи?',
                attendees_confirmed: 'Уточнил ли участников?',
                action_defined: 'Есть ли чёткий следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Закрытие - Триал/POC
     */
    getTrialClosingScenario() {
        return {
            id: 'closing-trial',
            category: 'closing',
            difficulty: 'intermediate',
            duration: 10,
            title: 'Закрытие: Триал / POC',
            description: 'Закрытие на пилотный проект или trial. Клиент хочет попробовать перед покупкой.',
            client_profile: {
                name: 'Павел',
                role: 'CIO',
                company: 'Фармацевтическая компания "МедПром"',
                industry: 'Фарма',
                company_size: '1500+ сотрудников',
                pain_points: [
                    'Множественные системы, нет единой платформы',
                    'Нужно доказать эффективность новой системе',
                    'Бюджет на следующий год'
                ],
                personality: 'cautious-decision-maker',
                greeting: 'Система выглядит хорошо. Но прежде чем идти к CFO с запросом бюджета, мне нужно доказать что это работает. Можем сделать пилот на одном отделе? Сколько это займёт времени?'
            },
            objectives: [
                'Подтвердить готовность к пилоту',
                'Согласовать scope пилота',
                'Установить timeline и success criteria',
                'Определить following steps после пилота'
            ],
            system_prompt: `Ты Павел, CIO фармацевтической компании "МедПром". 1500+ сотрудников.

Ты cautious decision-maker. Перед большим коммитментом хочешь доказательство.

Твоя позиция:
- "Хочу попробовать на малом масштабе"
- "Как организовать пилот?"
- "Сколько времени на пилот?"
- "Что будет success criteria?"
- "После пилота - какие условия?"

Дипломатичный, но требует конкретики. Не скажешь "да" без clear plan. Отвечай вдумчиво.`,
            success_criteria: {
                trial_confirmed: 'Согласовал ли пилот?',
                scope_defined: 'Определил ли scope?',
                timeline_set: 'Установил ли timeline?',
                post_trial_discussed: 'Обсудил ли post-pilot?'
            }
        };
    }

    // ============================================
    // СЦЕНАРИИ С САЙТА SALESTRAINER-ITSM.NETLIFY.APP
    // ============================================

    /**
     * Сценарий: Первая встреча с CIO (ТехноПром)
     */
    getFirstMeetingScenario() {
        return {
            id: 'first-meeting-cioprom',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 15,
            title: 'Первая встреча с CIO (ТехноПром)',
            description: 'Проведение первой встречи с CIO крупной компании. Выявление болей, презентация ITSM365.',
            client_profile: {
                name: 'Александр Петров',
                role: 'CIO',
                company: 'ТехноПром',
                industry: 'Промышленность',
                company_size: '1000+ сотрудников',
                pain_points: [
                    'Нет прозрачности по SLA',
                    'Инциденты теряются',
                    'Ручные процессы',
                    'Нужна автоматизация'
                ],
                personality: 'professional-skeptical',
                greeting: 'Добрый день. Ваша компания прислала материалы про ITSM365. Звучит интересно. А как это работает с нашей текущей инфраструктурой?'
            },
            objectives: [
                'Выявить ключевые боли',
                'Кратко презентовать решение',
                'Обработать вопрос про интеграцию',
                'Закрыть на демо/следующую встречу'
            ],
            system_prompt: `Ты Александр Петров, CIO компании ТехноПром. 1000+ сотрудников.

Твой характер:
- Профессиональный, немного скептический
- Ценишь время, не любишь долгих презентаций
- Задаёшь конкретные вопросы по существу

Твои вопросы/боли:
- "Как это работает с нашей текущей инфраструктурой?"
- "Сколько времени займёт внедрение?"
- "Дорого по сравнению с конкурентами?"

Отвечай профессионально, но с лёгким скепсисом. 2-3 предложения.`,
            success_criteria: {
                pains_identified: 'Выявил ли боли?',
                solution_presented: 'Презентовал ли решение?',
                integration_answered: 'Отвечал ли на интеграцию?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Сеть кофеен
     */
    getCoffeeShopScenario() {
        return {
            id: 'coffee-shop-chain',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 20,
            title: 'Сеть кофеен (300+ точек)',
            description: 'Встреча с IT Director сети кофеен по всей России. Поддержка касс, wi-fi, кофемашин.',
            client_profile: {
                name: 'Елена Волкова',
                role: 'IT Director',
                company: 'КофейнаяРост (сеть кофеен)',
                industry: 'HoReca',
                company_size: '300+ точек по всей России',
                pain_points: [
                    'Поддержка касс по всем точкам',
                    'Wi-fi на каждой точке',
                    'Кофемашины - техобслуживание',
                    'Рекламные вывески'
                ],
                personality: 'pragmatic-busy',
                greeting: 'Здравствуйте! У нас 300+ точек по всей России. Основная проблема - поддерживать всё это работает. Кассы, wi-fi, кофемашины, вывески... Как ваша система может помочь?'
            },
            objectives: [
                'Понять специфику клиента',
                'Показать как ITSM365 для distributed locations',
                'Демонстрировать мобильное приложение',
                'Закрыть на пилот на нескольких точках'
            ],
            system_prompt: `Ты Елена Волкова, IT Director сети кофеен "КофейнаяРост". 300+ точек.

Твой характер:
- Прагматичная, очень занятая
- Заботишься о distributed operations
- Интересуешься практическими решениями

Твоя специфика:
- 300+ точек по всей России
- Поддержка касс, wi-fi, кофемашин, вывесок
- Нужна координация distributed teams

Отвечай прагматично. Интересуйся как это работает для distributed locations. 2-3 предложения.`,
            success_criteria: {
                specificity_shown: 'Показал ли понимание специфики?',
                mobile_mentioned: 'Упомянул ли мобильное приложение?',
                pilot_agreed: 'Согласовал ли пилот?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Агропромышленный комплекс
     */
    getAgroScenario() {
        return {
            id: 'agro-industrial',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 18,
            title: 'Автоматизация для агропрома',
            description: 'Встреча с IT Manager агрокомпании по поставкам запчастей в Сибирь.',
            client_profile: {
                name: 'Игорь Семенов',
                role: 'IT Manager',
                company: 'СибАгроПром',
                industry: 'Сельское хозяйство',
                company_size: '500+ сотрудников',
                pain_points: [
                    'Поставка запчастей для сельхозтехники',
                    'Сезонность - летом перегрузка',
                    'Удалённые объекты в поле',
                    'Связь headquarters с филиалами'
                ],
                personality: 'practical-direct',
                greeting: 'Добрый день! Мы поставляем запчасти для сельхозтехники в Сибирь. Проблема - летом всё на полях, связи нет, заявки теряются. Как нам помочь?'
            },
            objectives: [
                'Понять специфику агробизнеса',
                'Показать offline-first решения',
                'Демонстрировать мобильную связь',
                'Закрыть на демо'
            ],
            system_prompt: `Ты Игорь Семенов, IT Manager агрокомпании "СибАгроПром". 500+ сотрудников.

Твой характер:
- Практичный, прямой
- Ориентирован на решение проблем
- Ценишь offline capability

Твоя специфика:
- Поставка запчастей для сельхозтехники
- Сезонность - летом перегрузка
- Удалённые объекты, плохая связь
- Нужно работать offline

Отвечай прямо. Интересуйся offline-first. 2-3 предложения.`,
            success_criteria: {
                agro_understanding: 'Показал ли понимание агро?',
                offline_mentioned: 'Упомянул ли offline?',
                mobile_shown: 'Показал ли мобильные решения?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: IT-аутсорсинг
     */
    getOutsourceScenario() {
        return {
            id: 'it-outsource',
            category: 'demo',
            difficulty: 'advanced',
            duration: 20,
            title: 'ITSM365.Outsource для аутсорсинга',
            description: 'Презентация для IT-аутсорсинга. Автоматизация работы выездных инженеров и поддержка клиентов.',
            client_profile: {
                name: 'Михаил Громов',
                role: 'CTO',
                company: 'ТехноСервис',
                industry: 'IT-аутсорсинг',
                company_size: '50+ инженеров',
                pain_points: [
                    'Автоматизация выездных инженеров',
                    'SLA reporting для клиентов',
                    'Учёт рабочего времени',
                    'Биллинг по consumed resources'
                ],
                personality: 'business-technical',
                greeting: 'Добрый день! Мы - IT-аутсорсинг, 50+ инженеров. Нужно автоматизировать: выезды, SLA отчёты для клиентов, биллинг. Что можете предложить?'
            },
            objectives: [
                'Понять бизнес-модель аутсорсинга',
                'Показать ITSM365.Outsource',
                'Демонстрировать SLA отчёты',
                'Обсудить биллинг',
                'Закрыть на пилот'
            ],
            system_prompt: `Ты Михаил Громов, CTO IT-аутсорсинговой компании "ТехноСервис". 50+ инженеров.

Твой характер:
- И бизнес, и технический
- Эксперт в аутсорсинге
- Требовательный к деталям

Твоя бизнес-модель:
- Выездные инженеры к клиентам
- SLA reporting для клиентов
- Учёт времени для биллинга
- Нужна прозрачность для клиентов

Отвечай экспертно. Задавай детальные вопросы. 2-3 предложения.`,
            success_criteria: {
                business_understanding: 'Понял ли бизнес-модель?',
                outsource_shown: 'Показал ли Outsource продукт?',
                sla_demonstrated: 'Демострировал ли SLA?',
                billing_discussed: 'Обсудил ли биллинг?'
            }
        };
    }

    /**
     * Сценарий: HR-automation
     */
    getHRAutomationScenario() {
        return {
            id: 'hr-automation',
            category: 'demo',
            difficulty: 'intermediate',
            duration: 15,
            title: 'HR-automation для управляющей компании',
            description: 'Встреча с HR Director по автоматизации подбора персонала.',
            client_profile: {
                name: 'Ольга Соколова',
                role: 'HR Director',
                company: 'ПрофиИнвест',
                industry: 'Управляющая компания',
                company_size: '500+ сотрудников',
                pain_points: [
                    'Автоматизация подбора персонала',
                    'База кандидатов',
                    'Онбординг новых сотрудников',
                    'Оценка и KPI'
                ],
                personality: 'people-oriented',
                greeting: 'Здравствуйте! Я HR Director управляющей компании. Нам нужно автоматизировать подбор, онбординг, оценку сотрудников. У нас есть HR продукт?'
            },
            objectives: [
                'Понять HR потребности',
                'Показать ITSM365.HR',
                'Демонстрировать подбор и онбординг',
                'Закрыть на демо HR модуля'
            ],
            system_prompt: `Ты Ольга Соколова, HR Director управляющей компании "ПрофиИнвест". 500+ сотрудников.

Твой характер:
- People-oriented
- Заботишься о кандидатах и сотрудниках
- Интересуешься automation

Твои потребности:
- Автоматизация подбора персонала
- База кандидатов
- Онбординг новых сотрудников
- Оценка и KPI

Отвечай дружелюбно. Интересуйся как это упростит работу HR. 2-3 предложения.`,
            success_criteria: {
                hr_needs_understood: 'Понял ли HR потребности?',
                hr_shown: 'Показал ли HR продукт?',
                onboarding_mentioned: 'Упомянул ли онбординг?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: IT Manager средний уровень
     */
    getITManagerMidScenario() {
        return {
            id: 'it-manager-mid',
            category: 'demo',
            difficulty: 'beginner',
            duration: 15,
            title: 'Презентация для IT Manager',
            description: 'Работа с IT Manager, который не является LPR, но влияет на решение.',
            client_profile: {
                name: 'Сергей Новиков',
                role: 'IT Manager',
                company: 'СтройСервис',
                industry: 'Строительство',
                company_size: '150 сотрудников',
                pain_points: [
                    'Не LPR но влияет на решение',
                    'Хочет упростить работу команды',
                    'Боится сложных внедрений'
                ],
                personality: 'cautious-influencer',
                greeting: 'Привет! Я не директор, но Boss прислал мне посмотреть вашу систему. Что это вообще такое?'
            },
            objectives: [
                'Объяснить простыми словами',
                'Показать ease of use',
                'Получить его recommendation',
                'Попросить connect с LPR'
            ],
            system_prompt: `Ты Сергей Новиков, IT Manager строительной компании "СтройСервис". 150 сотрудников.

Твой характер:
- Не LPR, но influencer
- Осторожный, боишься сложного
- Хочешь simplify работу

Твоя позиция:
- Boss прислал посмотреть
- Не принимающий решение
- Хочешь понять - это сложно или нет?

Отвечай просто, без jargon. Интересуйся простотой. 2-3 предложения.`,
            success_criteria: {
                simple_explanation: 'Объяснил ли просто?',
                ease_shown: 'Показал ли простоту?',
                recommendation: 'Получил ли рекомендацию?',
                lpr_connect: 'Попросил ли connect с LPR?'
            }
        };
    }

    /**
     * Сценарий: Enterprise холдинг
     */
    getEnterpriseHoldingScenario() {
        return {
            id: 'enterprise-holding',
            category: 'demo',
            difficulty: 'advanced',
            duration: 25,
            title: 'Enterprise-сделка: холдинг',
            description: 'Сложная сделка с управляющей компанией на внедрение ITSM365 во все дочерние предприятия.',
            client_profile: {
                name: 'Владимир Кузнецов',
                role: 'CEO',
                company: 'ИнвестХолдинг',
                industry: 'Холдинг',
                company_size: '5 subsidiaries',
                pain_points: [
                    'Внедрение во все дочерние компании',
                    'Centralised reporting',
                    'Standardisation процессов',
                    'ROI для группы'
                ],
                personality: 'strategic-decision-maker',
                greeting: 'Добрый день. У нас холдинговая компания с 5 subsidiaries. Хотим внедрить единую систему во все. Как это работает на enterprise уровне?'
            },
            objectives: [
                'Понять enterprise потребности',
                'Показать multi-entity capability',
                'Обсудить phased rollout',
                'Предложить pilot в одной company',
                'Закрыть на enterprise proposal'
            ],
            system_prompt: `Ты Владимир Кузнецов, CEO холдинговой компании "ИнвестХолдинг". 5 subsidiaries.

Твой характер:
- Strategic decision maker
- Thinking на group level
- Concerned about ROI и timeline

Твои потребности:
- Внедрение во все subsidiaries
- Centralised reporting
- Standardisation процессов
- ROI для группы

Отвечай strategically. Интересуйся rollout и ROI. 2-3 предложения.`,
            success_criteria: {
                strategy_understood: 'Понял ли стратегию?',
                multi_entity_shown: 'Показал ли multi-entity?',
                rollout_discussed: 'Обсудил ли rollout?',
                pilot_agreed: 'Согласовал ли пилот?'
            }
        };
    }

    /**
     * Сценарий: Малый бизнес - недвижимость
     */
    getRealEstateScenario() {
        return {
            id: 'small-business-realestate',
            category: 'demo',
            difficulty: 'beginner',
            duration: 12,
            title: 'Малый бизнес: агентство недвижимости',
            description: 'Работа с владельцем агентства недвижимости с ограниченным бюджетом.',
            client_profile: {
                name: 'Наталья Морозова',
                role: 'Owner',
                company: 'ДомМечты',
                industry: 'Недвижимость',
                company_size: '15 сотрудников',
                pain_points: [
                    'Ограниченный бюджет',
                    'Нужна базовая автоматизация',
                    'Риелоры работают в поле'
                ],
                personality: 'budget-conscious-practical',
                greeting: 'Здравствуйте! У нас небольшое агентство - 15 человек. Бюджет ограничен. Нужна что-то простое для учёта заявок. Что предлагаете?'
            },
            objectives: [
                'Понять бюджет constraints',
                'Предложить simple solution',
                'Показать value vs cost',
                'Предложить flexible pricing',
                'Закрыть на trial или small subscription'
            ],
            system_prompt: `Ты Наталья Морозова, Owner агентства недвижимости "ДомМечты". 15 сотрудников.

Твой характер:
- Budget conscious
- Практичная
- Хочешь simple solution

Твоя позиция:
- Малый бизнес, limited budget
- Нужна базовая автоматизация
- Риелоры работают в поле

Отвечай прямо. Интересуйся ценой и simplicity. 2-3 предложения.`,
            success_criteria: {
                budget_respected: 'Уважал ли бюджет?',
                simple_offered: 'Предложил ли simple?',
                value_shown: 'Показал ли value?',
                trial_agreed: 'Согласовал ли trial?'
            }
        };
    }

    /**
     * Сценарий: "Мы удовлетворены текущим решением"
     */
    getSatisfiedCustomerScenario() {
        return {
            id: 'objection-satisfied',
            category: 'objections',
            difficulty: 'advanced',
            duration: 15,
            title: 'Возражение: "Удовлетворены текущим"',
            description: 'Работа с клиентом который использует решение конкурента и не видит причин переходить.',
            client_profile: {
                name: 'Анна Белова',
                role: 'CIO',
                company: 'ФинТех',
                industry: 'Финтех',
                company_size: '200+ сотрудников',
                pain_points: [
                    'Использует competitor solution',
                    'Не видит reasons to switch',
                    'Concerned про migration costs'
                ],
                personality: 'loyal-but-open',
                greeting: 'Добрый день! Посмотрели вашу систему, но честно - у нас всё работает с [конкурент]. Миграция - это дорого и сложно. Зачем нам менять?'
            },
            objectives: [
                'Не критиковать текущую систему',
                'Показать differentiation',
                'Обсудить migration complexity',
                'Предложить hybrid approach или pilot',
                'Закрыть на comparison discussion'
            ],
            system_prompt: `Ты Анна Белова, CIO финтех компании "ФинТех". 200+ сотрудников.

Твой характер:
- Loyal к текущему решению
- Open-minded но sceptical
- Concerned про migration costs

Твоя позиция:
- Используем competitor solution
- Всё работает
- Не видим reasons to switch
- Migration = дорого и сложно

Отвечай loyally но открыто. Требуешь concrete differentiation. 2-3 предложения.`,
            success_criteria: {
                no_bashing: 'Не критиковал ли текущую систему?',
                differentiation_shown: 'Показал ли отличия?',
                migration_addressed: 'Отвечал ли на migration?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: "Нам требуется On-Premise"
     */
    getOnPremiseScenario() {
        return {
            id: 'objection-onpremise',
            category: 'objections',
            difficulty: 'advanced',
            duration: 12,
            title: 'Возражение: "Требуется On-Premise"',
            description: 'Работа с клиентом который требует On-Premise, а ITSM365 облачный.',
            client_profile: {
                name: 'Дмитрий Козлов',
                role: 'CISO',
                company: 'ГосТех',
                industry: 'Госsector',
                company_size: '1000+ сотрудников',
                pain_points: [
                    'Требуется On-Premise по policy',
                    'Security compliance',
                    'Data residency requirements'
                ],
                personality: 'compliance-focused',
                greeting: 'Добрый день. Перед вопросом - у вас есть On-Premise версия? У нас policy требует on-premise deployment. Cloud не подходит.'
            },
            objectives: [
                'Признать compliance requirement',
                'Объяснить cloud security benefits',
                'Предложить private cloud option',
                'Обсудить hybrid approach',
                'Закрыть на technical discussion'
            ],
            system_prompt: `Ты Дмитрий Козлов, CISO государственной организации "ГосТех". 1000+ сотрудников.

Твой характер:
- Compliance focused
- Security conscious
- Following policy

Твоя позиция:
- Policy требует On-Premise
- Cloud не подходит
- Need data residency
- Security compliance

Отвечай формально но конструктивно. Интересуйся security/compliance. 2-3 предложения.`,
            success_criteria: {
                compliance_acknowledged: 'Признал ли compliance?',
                cloud_security_shown: 'Показал ли cloud security?',
                alternatives_offered: 'Предложил ли alternatives?',
                next_step: 'Есть ли следующий шаг?'
            }
        };
    }

    /**
     * Сценарий: Финальные переговоры - условия контракта
     */
    getContractNegotiationScenario() {
        return {
            id: 'negotiation-contract',
            category: 'closing',
            difficulty: 'advanced',
            duration: 25,
            title: 'Финальные переговоры: условия контракта',
            description: 'Сложные переговоры с procurement менеджером по условиям контракта.',
            client_profile: {
                name: 'Мария Иванова',
                role: 'Procurement Manager',
                company: 'ТрансЛогистик',
                industry: 'Логистика',
                company_size: '1000+ сотрудников',
                pain_points: [
                    'Negotiating best terms',
                    'Payment terms discussion',
                    'SLA guarantees',
                    'Support levels'
                ],
                personality: 'tough-negotiator',
                greeting: 'Добрый день. Мы близки к сделке, но есть вопросы по контракту. У нас standard terms - payment 60 days, certain SLA guarantees, support levels. Ваша позиция?'
            },
            objectives: [
                'Понять procurement constraints',
                'Обсудить payment terms',
                'Negotiate SLA guarantees',
                'Установить support levels',
                'Закрыть на agreement'
            ],
            system_prompt: `Ты Мария Иванова, Procurement Manager логистического холдинга "ТрансЛогистик". 1000+ сотрудников.

Твой характер:
- Tough negotiator
- Following company policy
- Protecting company interests

Твоя позиция:
- Standard terms: payment 60 days
- Certain SLA guarantees
- Specific support levels
- Wanting best deal

Отвечай tough но constructively. Negotiate по terms. 2-3 предложения.`,
            success_criteria: {
                terms_negotiated: 'Согласовал ли terms?',
                payment_discussed: 'Обсудил ли payment?',
                sla_agreed: 'Согласовал ли SLA?',
                agreement_closed: 'Закрыл ли agreement?'
            }
        };
    }

    /**
     * Сценарий: Переговоры с CTO - технические требования
     */
    getCTONegotiationScenario() {
        return {
            id: 'negotiation-cto',
            category: 'closing',
            difficulty: 'advanced',
            duration: 20,
            title: 'Переговоры с CTO: техтребования',
            description: 'Сложные переговоры с техническим директором по техническим требованиям и интеграциям.',
            client_profile: {
                name: 'Алексей Смирнов',
                role: 'CTO',
                company: 'Банковские Технологии',
                industry: 'Финтех',
                company_size: '300+ сотрудников',
                pain_points: [
                    'Technical requirements discussion',
                    'Integration needs',
                    'Security compliance',
                    'Performance SLA'
                ],
                personality: 'technical-exacting',
                greeting: 'Добрый день. Перед финальным согласованием - несколько technical вопросов. Integration с нашими системами, security compliance, performance SLA. Давайте обсудим.'
            },
            objectives: [
                'Обсудить technical requirements',
                'Уточнить integration needs',
                'Confirm security compliance',
                'Establish performance SLA',
                'Закрыть на technical agreement'
            ],
            system_prompt: `Ты Алексей Смирнов, CTO финтех компании "Банковские Технологии". 300+ сотрудников.

Твой характер:
- Technical, exacting
- Concerned про integration
- Security focused

Твои вопросы:
- Integration requirements
- Security compliance
- Performance SLA
- Data protection

Отвечай technically. Задавай detailed вопросы. 2-3 предложения.`,
            success_criteria: {
                technical_addressed: 'Отвечал ли на technical?',
                integration_confirmed: 'Подтвердил ли integration?',
                security_confirmed: 'Подтвердил ли security?',
                agreement_closed: 'Закрыл ли agreement?'
            }
        };
    }
}

// Инициализируем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
