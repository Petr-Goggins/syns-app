import logging
import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

OPENFOODFACTS_ENDPOINTS = (
    "https://world.openfoodfacts.org/cgi/search.pl",
    "https://ru.openfoodfacts.org/cgi/search.pl",
    "https://world.openfoodfacts.org/api/v2/search",
)

@router.get("/search")
async def search_products(
    query: str = Query(..., min_length=1, max_length=100, description="Поисковый запрос")
):
    """
    Поиск продуктов по названию через Open Food Facts.
    """
    query = query.strip()
    
    headers = {
        "User-Agent": "AscendApp/1.0 (Fitness & Nutrition Tracker)",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            params = {
                "search_terms": query,
                "page_size": 20,  # Ограничиваем количество результатов
                "json": "true",
            }
            response = None
            last_error = None
            for endpoint in OPENFOODFACTS_ENDPOINTS:
                try:
                    candidate = await client.get(endpoint, params=params, headers=headers)
                    candidate.raise_for_status()
                    response = candidate
                    break
                except (httpx.HTTPStatusError, httpx.RequestError) as error:
                    last_error = error
                    logger.warning("Open Food Facts endpoint недоступен: %s", endpoint)
            if response is None:
                raise last_error or httpx.RequestError("Open Food Facts недоступен")

            data = response.json()
            
            products = data.get("products", [])
            formatted = []
            for p in products[:10]:  # Ограничиваем до 10 результатов
                nutriments = p.get("nutriments", {})
                formatted.append({
                    "id": str(p.get("code", p.get("id", ""))),
                    "name": str(p.get("product_name") or p.get("product_name_en") or p.get("name") or "Неизвестный продукт")[:100],
                    "brand": str(p.get("brands", "Неизвестный бренд"))[:50] if p.get("brands") else None,
                    "barcode": str(p.get("code", "")),
                    "image": str(p.get("image_url", "")) if p.get("image_url") else None,
                    "calories": nutriments.get("energy-kcal_100g") or nutriments.get("energy_100g") or 0,
                    "proteins": nutriments.get("proteins_100g") or 0,
                    "fats": nutriments.get("fat_100g") or 0,
                    "carbs": nutriments.get("carbohydrates_100g") or 0,
                })
            logger.info(f"Найдено {len(formatted)} продуктов для запроса '{query}'")
            return formatted
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при поиске '{query}': {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Сервис продуктов временно недоступен")
    except httpx.RequestError as e:
        logger.error(f"Ошибка соединения при поиске '{query}': {str(e)}")
        raise HTTPException(status_code=503, detail="Сервис продуктов недоступен")
    except Exception as e:
        logger.error(f"Неожиданная ошибка при поиске '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.get("/barcode/{barcode}")
async def get_product_by_barcode(barcode: str):
    """
    Получение продукта по штрих-коду.
    SECURITY FIX: Добавлена строгая валидация и санитизация входных данных
    для предотвращения SQL injection и других атак через URL.
    """
    # Строгая валидация штрих-кода (только цифры и дефисы, длина 8-14 символов)
    if not barcode or len(barcode) < 8 or len(barcode) > 14:
        raise HTTPException(status_code=400, detail="Некорректный штрих-код")
    
    # Санитизация: удаляем любые символы кроме цифр и дефисов
    sanitized_barcode = ''.join(c for c in barcode if c.isdigit() or c == '-')
    
    # Дополнительная проверка после санитизации
    if len(sanitized_barcode) < 8 or len(sanitized_barcode) > 14:
        raise HTTPException(status_code=400, detail="Некорректный штрих-код после санитизации")
    
    if not sanitized_barcode.replace("-", "").isdigit():
        raise HTTPException(status_code=400, detail="Штрих-код должен содержать только цифры")
    
    # Защита от path traversal атак
    if '..' in sanitized_barcode or '/' in sanitized_barcode:
        raise HTTPException(status_code=400, detail="Недопустимые символы в штрих-коде")
    
    url = f"https://world.openfoodfacts.org/api/v0/product/{sanitized_barcode}.json"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == 0:
                raise HTTPException(status_code=404, detail="Продукт не найден")
            p = data.get("product", {})
            nutriments = p.get("nutriments", {})
            return {
                "name": str(p.get("product_name", "Неизвестный продукт"))[:100],
                "brand": str(p.get("brands", "Неизвестный бренд"))[:50] if p.get("brands") else None,
                "barcode": barcode,
                "calories": nutriments.get("energy-kcal_100g"),
                "proteins": nutriments.get("proteins_100g"),
                "fats": nutriments.get("fat_100g"),
                "carbs": nutriments.get("carbohydrates_100g"),
            }
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при получении продукта {barcode}: {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Ошибка запроса к Open Food Facts")
    except httpx.RequestError as e:
        logger.error(f"Ошибка соединения при получении продукта {barcode}: {str(e)}")
        raise HTTPException(status_code=503, detail="Сервис недоступен")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении продукта {barcode}: {str(e)}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")
