import logging
import httpx
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/cgi/search.pl"

@router.get("/search")
async def search_products(query: str):
    """
    Поиск продуктов по названию через Open Food Facts.
    """
    params = {
        "search_terms": query,
        "page_size": 10,
        "json": "true",
    }

    headers = {
        "User-Agent": "SyncApp/1.0 (Fitness & Nutrition Tracker)"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            response = await client.get(OPENFOODFACTS_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            products = data.get("products", [])
            formatted = []
            for p in products:
                nutriments = p.get("nutriments", {})
                formatted.append({
                    "id": p.get("code", p.get("id", "")),
                    "name": p.get("product_name", "Неизвестный продукт"),
                    "brand": p.get("brands", "Неизвестный бренд"),
                    "barcode": p.get("code", ""),
                    "image": p.get("image_url", ""),
                    "calories": nutriments.get("energy-kcal_100g"),
                    "proteins": nutriments.get("proteins_100g"),
                    "fats": nutriments.get("fat_100g"),
                    "carbs": nutriments.get("carbohydrates_100g"),
                })
            logger.info(f"Найдено {len(formatted)} продуктов для запроса '{query}'")
            return formatted
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при поиске '{query}': {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail="Ошибка запроса к Open Food Facts")
    except httpx.RequestError as e:
        logger.error(f"Ошибка соединения при поиске '{query}': {str(e)}")
        raise HTTPException(status_code=503, detail="Сервис временно недоступен")
    except Exception as e:
        logger.error(f"Неожиданная ошибка при поиске '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/barcode/{barcode}")
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