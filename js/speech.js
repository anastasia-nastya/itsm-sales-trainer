/**
 * Speech Module - Модуль для работы с Web Speech API
 * Обеспечивает распознавание речи и синтез речи
 */

class SpeechManager {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isRecording = false;
        this.onResult = null;
        this.onError = null;
        this.onSpeakingStart = null;
        this.onSpeakingEnd = null;

        this.initRecognition();
        this.initVoices();
    }

    /**
     * Инициализация распознавания речи
     */
    initRecognition() {
        // Проверка поддержки Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Web Speech API не поддерживается в этом браузере');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ru-RU';
        this.recognition.continuous = false; // Останавливаем после каждой фразы
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        // Обработчики событий
        this.recognition.onstart = () => {
            this.isRecording = true;
            if (this.onSpeakingStart) this.onSpeakingStart();
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            if (this.onSpeakingEnd) this.onSpeakingEnd();
        };

        this.recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript;

            if (this.onResult && lastResult.isFinal) {
                this.onResult(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Ошибка распознавания речи:', event.error);

            if (this.onError) {
                this.onError(this.getErrorMessage(event.error));
            }
        };
    }

    /**
     * Получение русского голоса для синтеза
     */
    initVoices() {
        // Загружаем голоса асинхронно
        if (this.synthesis) {
            this.synthesis.getVoices();
        }
    }

    /**
     * Получить русский голос
     */
    getRussianVoice() {
        if (!this.synthesis) return null;

        const voices = this.synthesis.getVoices();

        // Приоритет: русский голос
        const russianVoice = voices.find(voice =>
            voice.lang.startsWith('ru') && voice.localService
        ) || voices.find(voice =>
            voice.lang.startsWith('ru')
        );

        // Fallback на любой доступный голос
        return russianVoice || voices[0] || null;
    }

    /**
     * Начать распознавание речи
     */
    startListening() {
        if (!this.recognition) {
            throw new Error('Web Speech API не поддерживается');
        }

        if (this.isRecording) {
            this.stopListening();
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Ошибка при запуске распознавания:', error);
            throw error;
        }
    }

    /**
     * Остановить распознавание речи
     */
    stopListening() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
    }

    /**
     * Произнести текст
     */
    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech Synthesis API не поддерживается'));
                return;
            }

            // Отменяем текущую речь
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Устанавливаем русский голос
            const voice = this.getRussianVoice();
            if (voice) {
                utterance.voice = voice;
            }

            // Устанавливаем язык
            utterance.lang = options.lang || 'ru-RU';

            // Настраиваем параметры
            utterance.rate = options.rate || 1.0;      // Скорость (0.1 - 10)
            utterance.pitch = options.pitch || 1.0;     // Высота (0 - 2)
            utterance.volume = options.volume || 1.0;   // Громкость (0 - 1)

            // Обработчики
            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(event.error);

            // Начинаем синтез
            this.synthesis.speak(utterance);
        });
    }

    /**
     * Остановить синтез речи
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }

    /**
     * Проверка поддержки Speech API
     */
    isSupported() {
        const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        const hasSynthesis = !!window.speechSynthesis;
        return { recognition: hasRecognition, synthesis: hasSynthesis };
    }

    /**
     * Получить человекочитаемое сообщение об ошибке
     */
    getErrorMessage(error) {
        const messages = {
            'no-speech': 'Речь не обнаружена. Попробуйте снова.',
            'audio-capture': 'Микрофон недоступен. Проверьте разрешения.',
            'not-allowed': 'Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.',
            'network': 'Ошибка сети. Проверьте подключение к интернету.',
            'aborted': 'Распознавание прервано.',
            'busy': 'Система распознавания занята.'
        };

        return messages[error] || `Неизвестная ошибка: ${error}`;
    }

    /**
     * Запрос разрешения на использование микрофона
     */
    async requestPermission() {
        try {
            // Запрашиваем доступ к микрофону
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Закрываем поток сразу после получения разрешения
            stream.getTracks().forEach(track => track.stop());

            return true;
        } catch (error) {
            console.error('Ошибка при запросе разрешения:', error);
            return false;
        }
    }
}

// Экспортируем для использования в других модулях
window.SpeechManager = SpeechManager;
