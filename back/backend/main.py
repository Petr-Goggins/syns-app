"""FastAPI backend for Sync App AI integration."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

from ai_service import ask_ai
from rag_service import index_knowledge_base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — indexing knowledge base...")
    try:
        index_knowledge_base()
    except Exception:
        logger.exception("Knowledge base indexing failed on startup")
    yield
    logger.info("Shutting down")


app = FastAPI(title="Sync App AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://fdzztjhfmilvusvchcge.supabase.co",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ МОДЕЛИ ============

class AskRequest(BaseModel):
    message: str = Field(..., min_length=1)
    user_data: dict = Field(default_factory=dict)


class AskResponse(BaseModel):
    reply: str


class GeneratePlanRequest(BaseModel):
    user_data: dict


class GenerateMealPlanRequest(BaseModel):
    user_data: dict
    budget: int | None = None
    favorite_foods: str | None = None


# ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

def format_user_data(user_data: dict) -> str:
    """Форматирует данные пользователя для вставки в промт."""
    lines = []
    lines.append(f"- Пол: {user_data.get('gender', 'не указан')}")
    lines.append(f"- Возраст: {user_data.get('age', 'не указан')}")
    lines.append(f"- Рост: {user_data.get('height', 'не указан')} см")
    lines.append(f"- Вес: {user_data.get('weight', 'не указан')} кг")
    lines.append(f"- Цель: {user_data.get('goal', 'не указана')}")
    lines.append(f"- Уровень активности: {user_data.get('activity', 'не указан')}")
    lines.append(f"- Навыки: Сила={user_data.get('strength', 0)}, Выносливость={user_data.get('endurance', 0)}, Сон={user_data.get('sleep', 0)}, Питание={user_data.get('nutrition', 0)}")
    lines.append(f"- Фаза цикла: {user_data.get('cycle_phase', 'не указана')}")
    lines.append(f"- Религиозные ограничения: {user_data.get('religion', 'нет')}")
    lines.append(f"- Инвентарь: {user_data.get('equipment', 'нет')}")
    return "\n".join(lines)


# ============ ЭНДПОИНТЫ ============

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ai/ask", response_model=AskResponse)
async def ai_ask(body: AskRequest) -> AskResponse:
    """
    Основной чат с ИИ.
    """
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    # Формируем системный промт для чата
    profile = format_user_data(body.user_data)
    system_prompt = f"""
Ты — персональный фитнес-наставник и диетолог в приложении Sync. Твоя задача — давать **конкретные, персонализированные советы** по питанию и тренировкам, строго следуя научным рекомендациям.

### 1. Данные пользователя:
{profile}

### 2. Источники (в порядке приоритета):
- Рекомендации ВОЗ по питанию и физической активности
- Руководство ACSM по спортивной нутрициологии (2025-2026)
- Методические рекомендации Минздрава РФ (ФИЦ питания и биотехнологии)
- Гарвардская тарелка питания (Harvard Healthy Eating Plate)

### 3. Базовые принципы:
- Белки: 1.6–2.2 г на 1 кг веса (для активных)
- Жиры: 20–35% от калорийности (минимум 0.7 г/кг)
- Углеводы: остальная часть калорийности (от 40%)
- Клетчатка: минимум 25–30 г в день
- Вода: 30–40 мл на 1 кг веса

### 4. Адаптация под цели:
- **Похудение**: дефицит 15–20% от нормы, акцент на белок и клетчатку.
- **Набор массы**: профицит 10–15%, акцент на углеводы и белок.
- **Поддержание**: ровно по норме.

### 5. Учёт религиозных ограничений:
- **Халяль**: исключить свинину, алкоголь, желатин из свинины.
- **Кошер**: исключить смешение мяса и молока, свинину, морепродукты без чешуи.

### 6. Формат ответа:
- Отвечай **коротко и по делу** (2–4 абзаца).
- **Никаких общих фраз** («важно помнить», «стоит отметить», «возможно»).
- Если просят рацион: выдай план на день с весами и КБЖУ.
- Если просят тренировку: выдай список упражнений с подходами и повторениями.
- Если не знаешь — честно скажи и предложи обратиться к врачу.
- Всегда добавляй дисклеймер: «Перед началом проконсультируйтесь с врачом».

### 7. Корректировка по запросу:
- Если пользователь говорит «убери жим лёжа» или «добавь углеводов» — скорректируй и объясни изменения.
"""

    try:
        reply = await ask_ai(message, system_prompt)
        return AskResponse(reply=reply)
    except ValueError as exc:
        logger.error("Configuration error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
    except RuntimeError as exc:
        logger.warning("AI request failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception:
        logger.exception("Unexpected error in /ai/ask")
        raise HTTPException(
            status_code=500,
            detail="Внутренняя ошибка сервера. Попробуйте позже.",
        )


@app.post("/plans/generate")
async def generate_plan(request: GeneratePlanRequest):
    """
    Генерация персонализированного плана тренировок на 4 недели.
    """
    user_data = request.user_data
    profile = format_user_data(user_data)

    system_prompt = f"""
Ты — эксперт по спортивной подготовке. На основе данных пользователя создай детальный план тренировок на 4 недели.

Данные пользователя:
{profile}

Правила:
- Учитывай цель (похудеть/набрать массу/поддержать).
- Учитывай уровень подготовки и инвентарь.
- Разбей план по дням недели (3–5 тренировок в неделю).
- Включи упражнения на все группы мышц минимум 2 раза в неделю.
- Добавь прогрессию: увеличивай вес или количество повторений каждую неделю.
- Для каждого дня укажи: название упражнения, подходы, повторения, вес (если есть).
- Включи дни отдыха и рекомендации по восстановлению.
- Ответ выдай в виде структурированного текста (не в формате JSON, а читаемый план).
- Всегда добавляй дисклеймер: «Перед началом проконсультируйтесь с врачом».
"""

    try:
        reply = await ask_ai("Составь план тренировок на 4 недели.", system_prompt)
        return {"plan": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/meal-plans/generate")
async def generate_meal_plan(request: GenerateMealPlanRequest):
    """
    Генерация персонализированного рациона питания на день.
    """
    user_data = request.user_data
    budget = request.budget
    favorite_foods = request.favorite_foods

    profile = format_user_data(user_data)
    budget_text = f"Бюджет на неделю: {budget} руб." if budget else ""
    favorite_text = f"Любимые продукты: {favorite_foods}" if favorite_foods else ""

    system_prompt = f"""
Ты — диетолог. Составь сбалансированный рацион питания на день для пользователя.

Данные пользователя:
{profile}

Дополнительно:
{budget_text}
{favorite_text}

Правила:
- Учитывай цель (похудеть/набрать массу/поддержать).
- Учитывай религиозные ограничения (халяль/кошер).
- Используй продукты, доступные в средней полосе России.
- Рацион должен включать: завтрак, обед, ужин, 2 перекуса.
- Для каждого приёма пищи укажи: название блюда, вес порции (г), КБЖУ.
- Суммарное КБЖУ за день должно соответствовать норме пользователя.
- Если указан бюджет, подбери продукты, чтобы уложиться в него.
- Если указаны любимые продукты, включи их в рацион.
- Ответ выдай в виде читаемого меню.
- Всегда добавляй дисклеймер: «Перед началом проконсультируйтесь с врачом».
"""

    try:
        reply = await ask_ai("Составь рацион питания на день.", system_prompt)
        return {"meal_plan": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================================
# ЭНДПОИНТЫ ДЛЯ ПРОДУКТОВ (Open Food Facts)
# ================================================

OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/api/v2/search"

@app.get("/products/search")
async def search_products(query: str):
    """
    Поиск продуктов по названию через Open Food Facts.
    """
    params = {
        "search_terms": query,
        "page_size": 10,
        "json": 1,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(OPENFOODFACTS_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            products = data.get("products", [])
            formatted = []
            for p in products:
                nutriments = p.get("nutriments", {})
                formatted.append({
                    "name": p.get("product_name", "Неизвестный продукт"),
                    "brand": p.get("brands", "Неизвестный бренд"),
                    "barcode": p.get("code", ""),
                    "calories": nutriments.get("energy-kcal_100g"),
                    "proteins": nutriments.get("proteins_100g"),
                    "fats": nutriments.get("fat_100g"),
                    "carbs": nutriments.get("carbohydrates_100g"),
                })
            return formatted
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Ошибка запроса к Open Food Facts")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/products/barcode/{barcode}")
async def get_product_by_barcode(barcode: str):
    """
    Получение продукта по штрих-коду.
    """
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == 0:
                raise HTTPException(status_code=404, detail="Продукт не найден")
            p = data.get("product", {})
            nutriments = p.get("nutriments", {})
            return {
                "name": p.get("product_name", "Неизвестный продукт"),
                "brand": p.get("brands", "Неизвестный бренд"),
                "barcode": barcode,
                "calories": nutriments.get("energy-kcal_100g"),
                "proteins": nutriments.get("proteins_100g"),
                "fats": nutriments.get("fat_100g"),
                "carbs": nutriments.get("carbohydrates_100g"),
            }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Ошибка запроса к Open Food Facts")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))