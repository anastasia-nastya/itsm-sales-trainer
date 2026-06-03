#!/bin/bash
# ITSM365 Sales Trainer - Запуск локального сервера

echo "🚀 Запуск ITSM365 Sales Trainer..."
echo ""
echo "Сервер будет доступен по адресу:"
echo "👉 http://localhost:8000"
echo ""
echo "Нажмите Ctrl+C чтобы остановить сервер"
echo ""

# Проверяем занят ли порт
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Порт 8000 уже занят. Перезапускаю..."
    kill $(lsof -t -i:8000) 2>/dev/null
    sleep 1
fi

# Запускаем сервер
python3 -m http.server 8000
