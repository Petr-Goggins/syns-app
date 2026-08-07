# 🏋️ Sync — твой умный фитнес-компаньон

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-purple?logo=supabase)](https://supabase.com/)

**Sync** — это фитнес-приложение, которое подстраивается под вас: учитывает фазы цикла, религиозные ограничения, ваш инвентарь и даже мотивирует через RPG-механику. ИИ составляет персональные планы тренировок и питания, опираясь на научные данные (ACSM, ВОЗ, Минздрав).

---

## 💡 Что умеет Sync

- 🎯 **Планы тренировок на 4 недели** — нагрузка растёт постепенно, программа адаптируется под ваши цели.
- 🩸 **Подстройка под цикл** — интенсивность и рацион меняются в зависимости от фазы менструального цикла.
- 🕌 **Учёт религиозных предпочтений** — халяль, кошер, посты — всё учтено при составлении меню.
- 🏋️ **Инвентарь — не проблема** — выбирайте, что у вас есть (гантели, турник, коврик), и программа подстроится.
- 🎮 **RPG-прокачка** — уровни, навыки (сила, выносливость, сон, питание), XP за каждое действие и достижения.
- 📊 **Дневники и аналитика** — тренировки, питание, сон — всё в одном месте с графиками и отчётами.
- 🤖 **ИИ-наставник** — задавайте вопросы, просите скорректировать план, получайте советы и мотивацию.
- 🥗 **Поиск продуктов** — через Open Food Facts (3 млн+ продуктов) или ручной ввод с КБЖУ.
- 🍽️ **Готовые рационы** — фильтр по времени приготовления и типу питания.
- 🌙 **Тёмная тема** и адаптивный дизайн для телефонов и планшетов.

---

## 🛠️ Технологии

**Фронтенд**  
React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query, Recharts, Lucide Icons

**Бэкенд**  
FastAPI, SQLAlchemy + PostgreSQL (Supabase), OpenRouter (ИИ), Open Food Facts API, ChromaDB (RAG)

---

## 📂 Структура проекта
sync-app/
├── backend/ # FastAPI-бэкенд
│ ├── ai_service.py # OpenRouter-интеграция
│ ├── main.py # Эндпоинты API
│ ├── rag_service.py # RAG-пайплайн
│ ├── requirements.txt
│ └── knowledge_base/ # Документы для RAG
├── frontend/ # React-фронтенд
│ ├── src/
│ │ ├── pages/ # Все страницы
│ │ ├── components/ # UI-компоненты
│ │ ├── store/ # Zustand-хранилища
│ │ ├── lib/ # Supabase-клиент
│ │ └── hooks/ # Кастомные хуки
│ ├── package.json
│ └── .env # Переменные окружения (не в репозитории)
├── .gitignore
└── README.md

text

---

## 🚀 Запуск проекта

### Что нужно
- Node.js 18+
- Python 3.10+
- npm или yarn
- Бесплатный аккаунт Supabase

### Инструкция

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/Petr-Goggins/syns-app.git
cd syns-app
Бэкенд

bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
Создайте .env в backend:

env
OPENROUTER_API_KEY=ваш_ключ_OpenRouter
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=http://localhost:8000
SITE_TITLE=Sync App
Запуск:

bash
python -m uvicorn main:app --reload --port 8000
Фронтенд

bash
cd frontend
npm install
Создайте .env в frontend:

env
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_публичный_ключ
VITE_API_URL=http://localhost:8000
Запуск:

bash
npm run dev
После этого приложение доступно по http://localhost:5173.

📖 API-документация
Swagger доступен по адресу: http://localhost:8000/docs

Эндпоинт	Описание
POST /ai/ask	Чат с ИИ-наставником
POST /plans/generate	Генерация плана тренировок
POST /meal-plans/generate	Генерация рациона питания
GET /products/search	Поиск продуктов (Open Food Facts)
GET /products/barcode/{barcode}	Продукт по штрих-коду
🤝 Вклад в проект
Хотите помочь? Форкните репозиторий, создайте ветку, сделайте изменения и отправьте Pull Request. Будем рады!

📄 Лицензия
Этот проект использует пользовательскую лицензию.
Подробности в файле LICENSE.
Коммерческое использование только с разрешения автора.

🙏 Вдохновение и благодарности
Идея основана на подходах Cal AI и научных работах ACSM, NSCA и ВОЗ.

Создано с ❤️ 15-летним разработчиком из России.

Скачать Sync — скоро в Google Play и App Store.

Сделано в России. Конфиденциальность — приоритет.
🌐 sync-app.ru (в разработке)