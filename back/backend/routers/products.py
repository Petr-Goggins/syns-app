import logging
import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/cgi/search.pl"

@router.get("/search")
async def search_products(
    query: str = Query(..., min_length=2, max_length=100, description="Поисковый запрос")
):
    """
    Поиск продуктов по названию через Open Food Facts.
    """
    query = query.strip()
    
    headers = {
        "User-Agent": "SyncApp/1.0 (Fitness & Nutrition Tracker)"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            params = {
                "search_terms": query,
                "page_size": 20,  # Ограничиваем количество результатов
                "json": "true",
            }
            response = await client.get(OPENFOODFACTS_API_URL, params=params)
            response.raise_for_status()
            
            # Проверяем, что ответ это JSON, а не HTML
            content_type = response.headers.get("content-type", "")
            if "application/json" not in content_type:
                logger.warning(f"Open Food Facts вернул не JSON для запроса '{query}'")
                return []
            
            data = response.json()
            
            products = data.get("products", [])
            formatted = []
            for p in products[:10]:  # Ограничиваем до 10 результатов
                nutriments = p.get("nutriments", {})
                formatted.append({
                    "id": str(p.get("code", p.get("id", ""))),
                    "name": str(p.get("product_name", "Неизвестный продукт"))[:100],
                    "brand": str(p.get("brands", "Неизвестный бренд"))[:50] if p.get("brands") else None,
                    "barcode": str(p.get("code", "")),
                    "image": str(p.get("image_url", "")) if p.get("image_url") else None,
                    "calories": nutriments.get("energy-kcal_100g"),
                    "proteins": nutriments.get("proteins_100g"),
                    "fats": nutriments.get("fat_100g"),
                    "carbs": nutriments.get("carbohydrates_100g"),
                })
            logger.info(f"Найдено {len(formatted)} продуктов для запроса '{query}'")
            return formatted
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при поиске '{query}': {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Ошибка сервиса продуктов")
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
    """
    # Валидация штрих-кода (только цифры и дефисы, длина 8-14 символов)
    if not barcode or len(barcode) < 8 or len(barcode) > 14:
        raise HTTPException(status_code=400, detail="Некорректный штрих-код")
    
    if not barcode.replace("-", "").isdigit():
        raise HTTPException(status_code=400, detail="Штрих-код должен содержать только цифры")
    
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    
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
