/**
 * AI Module - Модуль для взаимодействия с AI API
 * Поддерживает Groq API (основной) и HuggingFace (fallback)
 */

class AIManager {
    constructor(config = {}) {
        this.apiProvider = config.provider || 'groq'; // 'groq' или 'huggingface'
        this.apiKey = config.apiKey || null;
        this.model = config.model || null;
        this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
        this.timeout = config.timeout || 30000; // 30 секунд

        // История сообщений для контекста
        this.messages = [];
        this.systemPrompt = '';
    }

    /**
     * Получить базовый URL для провайдера
     */
    getDefaultBaseUrl() {
        const urls = {
            'groq': 'https://api.groq.com/openai/v1',
            'huggingface': 'https://api-inference.huggingface.co'
        };
        return urls[this.apiProvider] || urls.groq;
    }

    /**
     * Установить системный промпт (роль клиента)
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        this.messages = [
            { role: 'system', content: prompt }
        ];
    }

    /**
     * Очистить историю сообщений
     */
    clearMessages() {
        this.messages = [
            { role: 'system', content: this.systemPrompt }
        ];
    }

    /**
     * Добавить сообщение пользователя в историю
     */
    addUserMessage(content) {
        this.messages.push({
            role: 'user',
            content: content
        });
    }

    /**
     * Добавить ответ ассистента в историю
     */
    addAssistantMessage(content) {
        this.messages.push({
            role: 'assistant',
            content: content
        });
    }

    /**
     * Получить ответ от AI
     */
    async getResponse(userMessage, options = {}) {
        // Добавляем сообщение пользователя
        this.addUserMessage(userMessage);

        try {
            const response = await this.callAI(this.messages, options);

            // Добавляем ответ ассистента в историю
            this.addAssistantMessage(response);

            return response;
        } catch (error) {
            console.error('Ошибка при получении ответа от AI:', error);
            throw error;
        }
    }

    /**
     * Вызов AI API
     */
    async callAI(messages, options = {}) {
        switch (this.apiProvider) {
            case 'groq':
                return await this.callGroq(messages, options);
            case 'huggingface':
                return await this.callHuggingFace(messages, options);
            default:
                throw new Error(`Неподдерживаемый провайдер: ${this.apiProvider}`);
        }
    }

    /**
     * Вызов Groq API
     */
    async callGroq(messages, options = {}) {
        const model = this.model || 'llama-3.3-70b-versatile'; // Llama 3

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: options.temperature || 0.8,
                max_tokens: options.maxTokens || 500,
                top_p: options.topP || 0.9
            }),
            signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Вызов HuggingFace Inference API
     */
    async callHuggingFace(messages, options = {}) {
        const model = this.model || 'mistralai/Mistral-7B-Instruct-v0.3';

        // Преобразуем сообщения в формат промпта
        const prompt = this.formatMessagesForHF(messages);

        const response = await fetch(`${this.baseUrl}/models/${model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    temperature: options.temperature || 0.8,
                    max_new_tokens: options.maxTokens || 500,
                    top_p: options.topP || 0.9,
                    return_full_text: false
                }
            }),
            signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // HuggingFace возвращает ответ в другом формате
        if (Array.isArray(data)) {
            return data[0].generated_text;
        }
        return data.generated_text || '';
    }

    /**
     * Форматирование сообщений для HuggingFace
     */
    formatMessagesForHF(messages) {
        // Mistral формат: [INST] instruction [/INST]
        let prompt = '';

        for (const msg of messages) {
            if (msg.role === 'system') {
                prompt += `[INST] ${msg.content} [/INST] `;
            } else if (msg.role === 'user') {
                prompt += `[INST] ${msg.content} [/INST] `;
            } else if (msg.role === 'assistant') {
                prompt += `${msg.content} `;
            }
        }

        return prompt;
    }

    /**
     * Оценить качество диалога
     */
    async evaluateDialog(conversation, criteria) {
        const evaluationPrompt = `
Оцени диалог менеджера по продажам с клиентом по шкале от 0 до 100.

Критерии оценки:
${JSON.stringify(criteria, null, 2)}

Диалог:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Верни JSON с оценкой и комментариями:
{
    "score": 0-100,
    "strengths": ["сильная сторона 1", "сильная сторона 2"],
    "improvements": ["на что улучшить 1", "на что улучшить 2"],
    "feedback": "общий комментарий"
}
`;

        try {
            const response = await this.callAI([
                { role: 'system', content: 'Ты эксперт по продажам. Оценивай диалоги честно и конструктивно.' },
                { role: 'user', content: evaluationPrompt }
            ], { temperature: 0.3 });

            // Парсим JSON из ответа
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Fallback если не смогли распарсить
            return {
                score: 70,
                strengths: [],
                improvements: ['Попробуйте снова'],
                feedback: 'Не удалось проанализировать диалог'
            };
        } catch (error) {
            console.error('Ошибка при оценке диалога:', error);
            return {
                score: 0,
                strengths: [],
                improvements: [],
                feedback: 'Ошибка при оценке'
            };
        }
    }

    /**
     * Сменить провайдера API
     */
    switchProvider(provider, apiKey) {
        this.apiProvider = provider;
        this.apiKey = apiKey;
        this.baseUrl = this.getDefaultBaseUrl();
        this.clearMessages();
    }

    /**
     * Проверить доступность API
     */
    async checkAvailability() {
        try {
            // Простой тестовый запрос
            await this.callAI([
                { role: 'system', content: 'Ты полезный ассистент.' },
                { role: 'user', content: 'Привет! Ответь одним словом: Привет!' }
            ], { maxTokens: 10 });

            return true;
        } catch (error) {
            console.error('API недоступен:', error);
            return false;
        }
    }

    /**
     * Создать конфигурацию для разных провайдеров
     */
    static createConfig(provider, apiKey, model) {
        const configs = {
            'groq': {
                provider: 'groq',
                apiKey: apiKey,
                model: model || 'llama-3.3-70b-versatile',
                baseUrl: 'https://api.groq.com/openai/v1'
            },
            'huggingface': {
                provider: 'huggingface',
                apiKey: apiKey,
                model: model || 'mistralai/Mistral-7B-Instruct-v0.3',
                baseUrl: 'https://api-inference.huggingface.co'
            }
        };

        return configs[provider] || configs.groq;
    }
}

// Экспортируем для использования в других модулях
window.AIManager = AIManager;
