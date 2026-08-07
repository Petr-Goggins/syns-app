import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/products", tags=["products"])

OPENFOODFACTS_API_URL = "https://world.openfoodfacts.org/api/v2/search"

@router.get("/search")
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