# 📐 Отчёт о реконструкции кода репозитория «Sync»

Дата анализа: 30.09.2026
Ветка: `qwen-code-cebf2050-b2ff-497b-89b6-f2286c0b7a11` (commit `ed117ef`, history grafts — одна коммитная точка)

---

## 1. Что представляет собой проект

**Sync (Ascend)** — фитнес-приложение с ИИ-наставником: персональные планы тренировок на 4 недели, рационы с учётом КБЖУ, адаптация под менструальный цикл, религиозные ограничения (халяль/кошер), инвентарь, RPG-прокачка (XP, уровни, достижения), дневники тренировок/сна/питания.

**Стек:**
| Слой | Технологии |
|---|---|
| Фронтенд | React 18 + TypeScript, Vite, Tailwind CSS, Zustand (17 сторов), React Router, Recharts, Lucide, react-hot-toast |
| Данные/Auth | Supabase (PostgreSQL, 11 миграций, edge function `product-search`) |
| Бэкенд | FastAPI + httpx, интеграция с OpenRouter (LLM `llama-3.3-70b-instruct:free`) |
| RAG | ChromaDB + SentenceTransformer (`paraphrase-multilingual-MiniLM-L12-v2`) + PyMuPDF |
| Продукты | Open Food Facts API (+ сервисы ВкусВилл, Пятёрочка на фронте) |

---

## 2. Реконструированная архитектура

```
Запрос пользователя (ChatPage / PlanPage / NutritionPage)
        │
        ▼
Zustand-стор ──► REST (FastAPI /ai/ask, /plans/generate, /meal-plans/generate, /api/products/*)
        │                    │
        │                    ├── ai_service.py  → OpenRouter (системный промт с профилем)
        │                    ├── meal_planner.py → расчёт КБЖУ (Mifflin-St Jeor + активности)
        │                    ├── food_service.py / routers/products.py → Open Food Facts
        │                    └── rag_service.py → ChromaDB (индексация PDF knowledge_base/)
        ▼
Supabase (персистентность: профили, планы, логи, продукты, отчёты)
```

### Ключевые модули бэкенда (`back/backend/`)
| Файл | Строк | Назначение |
|---|---|---|
| `main.py` | 305 | FastAPI-приложение: lifespan-индексация RAG, CORS, Pydantic-валидация, эндпоинты `/health`, `/ai/ask`, `/plans/generate`, `/meal-plans/generate`, deprecated-заглушки `/products/*` (410) |
| `meal_planner.py` | 314 | Класс `MealPlanner`: приём пищи валидация (MAX_* константы), суточная норма калорий, распределение БЖУ |
| `food_service.py` | 198 | OFF v2 search / v0 barcode / by-id + `format_product_data()` |
| `rag_service.py` | 124 | PDF → чанки (500 симв.) → ChromaDB; `search_knowledge()` top-3 |
| `routers/products.py` | ~135 | Роутер `/products/search`, `/products/barcode/{barcode}` со строгой санитизацией штрих-кода |
| `ai_service.py` | 85 | `ask_ai()`: валидация входа, таймаут 60с, маппинг HTTP-ошибок (401/429/5xx) на понятные сообщения |

### Фронтенд (полная версия — `syns-app-main/syns-app-master/`, ~100 файлов)
- **17 Zustand-сторов**: auth, profile, plan, nutrition, coach, chat, sleepLog, workoutLog, water, theme, settings, stats, progress, tracking, restTimer, quote, longPath
- **16 страниц**: Dashboard, Workout, WorkoutLog, Nutrition, Plan, Progress, Profile, Coach, Chat, Reports, Cycle, SleepLog, Achievements, Settings, LongPath, ExerciseTechnique
- **19 компонентов**, **7 сервисов** (генерация тренировок, рационы, reflection, referral, userContext, productService, vkusvill/pyaterochka), **11 SQL-миграций** Supabase

---

## 3. Выявленные проблемы (результат реконструкции)

### 🔴 Критические
1. **CORS-конфигурация не работает** (`back/backend/main.py:44-61`): код вычисляет `safe_origins` из `ALLOWED_ORIGINS` и фильтрует опасные значения, но в `add_middleware` передаётся `allow_origins=["*"]` вместе с `allow_credentials=True` — «SECURITY FIX» фактически нейтрализован. Запросы с credentials с wildcard-ориджином браузером блокируются, а реальная защита отсутствует.
2. **Репозиторий не самодостаточен**: вложенная полная копия `syns-app-main/syns-app-master/` импортирует `@/lib/supabase` (33 файла), но файл `src/lib/supabase.ts` **отсутствует** — сборка фронтенда невозможна из текущего дерева.
3. **Дублирование расходящихся копий**: корневые `back/` и `src/` — более старая версия тех же файлов, что внутри `syns-app-main/` (nested-версии новее: фоновая индексация RAG через `asyncio.to_thread`, fallback по 3 эндпоинтам OFF, роутинг `useParams/useNavigate` в ExerciseTechniquePage, хелперы `getExerciseById/getExerciseByName`).

### 🟠 Высокие
4. **RAG реализован, но не подключён**: `search_knowledge()` не вызывается ни из одного эндпоинта — системные промты содержат только статические правила, база знаний (PDF) не используется. Кроме того, `knowledge_base/` пуста (только `.gitkeep`).
5. **Отсутствует `routers/__init__.py`** — импорт `from routers import products` работает только благодаря implicit namespace packages (хрупко).
6. **Нет rate limiting** на `/ai/ask` (расходование бесплатного лимита OpenRouter), нет тестов, нет CI, нет Dockerfile.
7. **Нецелевые артефакты в VCS**: `backend.log` в корне (uvicorn `Address already in use`), мусорный корневой `package.json` c единственной зависимостью `react-body-selector` и `node_modules` без lock-согласования с фронтендом.

### 🟡 Средние
8. `GeneratePlanRequest.user_data: dict = Field(..., max_keys=20)` — `max_keys` неприменим к `dict` в Pydantic v2 (игнорируется); то же для `GenerateMealPlanRequest`.
9. В `AskRequest.validate_message` проверка `<script`/`javascript:` — иллюзия защиты: ответ LLM всё равно markdown-текст, экранирование должно быть на стороне рендера.
10. Ручная нарезка текста чанками по 500 символов (`_split_into_chunks`) рвёт предложения — качество retrieval низкое; повторная индексация при изменении PDF не поддерживается (`count() > 0 → skip`).
11. Несогласованное именование продукта в коде: «Ascend App» (main.py, User-Agent) vs «Sync» (README, SITE_TITLE, food_service UA).
12. Дублирование логики поиска продуктов: `food_service.py` и `routers/products.py` независимо обращаются к OFF (разные URL: `cgi/search.pl` vs `api/v2/search`).
13. Жёстко зашитый длинный системный промт в теле хэндлера (`/ai/ask`) — выносится в отдельный модуль промптов.

---

## 4. План реконструкции (рекомендации)

### Этап 1 —Унификация структуры (убрать дубли)
- Признать единым источником кода содержимое `syns-app-main/syns-app-master/` (оно новее).
- Поднять его в canonical layout: `frontend/` + `backend/`, удалить устаревшие копии `back/` и `src/` из корня, удалить `backend.log`, `node_modules` из VCS, добавить в `.gitignore`.
- Восстановить отсутствующий `frontend/src/lib/supabase.ts` (клиент из env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Этап 2 — Исправления бэкенда
```python
# main.py — починить CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=safe_origins,      # ← вместо ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- Добавить `routers/__init__.py`; унифицировать поиск продуктов через `food_service` (роутер — тонкая обёртка).
- Интегрировать RAG: в `/ai/ask` перед вызовом `ask_ai` делать `search_knowledge(message)` и инжектировать найденные фрагменты в системный промт; чанкинг — по предложениям (\n\n/. ) с overlap.
- Rate-limit (`slowapi`) на LLM-эндпоинты; промпты — в `prompts/` модуль; пагинацию планов — в JSON-формат с Pydantic-схемой вместо «читаемого текста» (фронт уже парсит структурированные планы).
- Исправить `max_keys` → кастомный `field_validator('user_data')` c проверкой `len(v) <= 20`.

### Этап 3 — Надёжность
- pytest: валидация штрих-кодов, форматирование продуктов (мок httpx), MealPlanner (расчёт КБЖУ), идемпотентность индексации.
- Dockerfile + docker-compose (backend + frontend), GitHub Actions CI (lint + test + build).
- Единое имя продукта («Sync») во всех константах и User-Agent.

### Этап 4 — Долг фронтенда
- Из 17 сторов выделить слой данных в React Query (серверное состояние), Zustand оставить для UI (theme, restTimer, dynamicIsland).
- Страницы >500 строк разбить на компоненты; типизировать ответы бэкенда общими пакетами типов (или openapi-typescript из схемы FastAPI).

---

## 5. Метрики текущего состояния

| Показатель | Значение |
|---|---|
| Файлов всего (без node_modules/.git) | ~130 |
| Python-код (актуальный бэкенд) | 1 284 строки, синтаксис ✅ (`py_compile` OK) |
| TSX-страниц (полная копия) | 6 892 строки |
| Zustand-сторов / миграций БД | 17 / 11 |
| Тестов / CI / Docker | 0 / 0 / 0 |
| Дублирующихся копий приложения | 2 (расходятся по 5 файлам) |
