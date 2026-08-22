"""Сервис для работы с базой данных Open Food Facts."""

import logging
import httpx
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

OPENFOODFACTS_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search"
OPENFOODFACTS_PRODUCT_URL = "https://world.openfoodfacts.org/api/v0/product"


def format_product_data(product: Dict[str, Any]) -> Dict[str, Any]:
    """Форматирует данные продукта из Open Food Facts с валидацией."""
    nutriments = product.get("nutriments", {})
    return {
        "name": str(product.get("product_name", "Неизвестный продукт"))[:100],
        "brand": str(product.get("brands", "Неизвестный бренд"))[:50] if product.get("brands") else None,
        "barcode": str(product.get("code", "")),
        "calories": nutriments.get("energy-kcal_100g"),
        "proteins": nutriments.get("proteins_100g"),
        "fats": nutriments.get("fat_100g"),
        "carbs": nutriments.get("carbohydrates_100g"),
        "ingredients": str(product.get("ingredients_text", ""))[:1000] if product.get("ingredients_text") else None,
        "additives": product.get("additives_tags", [])[:20] if product.get("additives_tags") else [],
        "nova_group": product.get("nova_group"),
        "nutriscore": product.get("nutriscore_grade"),
    }


async def search_products(query: str, page_size: int = 10) -> List[Dict[str, Any]]:
    """
    Поиск продуктов по названию через Open Food Facts API.
    
    Args:
        query: Поисковый запрос (название продукта)
        page_size: Количество результатов (по умолчанию 10, макс. 20)
    
    Returns:
        Список продуктов с информацией о КБЖУ
    
    Raises:
        ValueError: При некорректном запросе
        httpx.HTTPError: При ошибке запроса к API
    """
    # Валидация запроса
    if not query or not query.strip():
        raise ValueError("Поисковый запрос не может быть пустым")
    
    query = query.strip()
    if len(query) < 2:
        raise ValueError("Поисковый запрос должен содержать минимум 2 символа")
    
    if len(query) > 100:
        raise ValueError("Поисковый запрос слишком длинный")
    
    # Ограничение page_size
    page_size = min(page_size, 20)
    
    params = {
        "search_terms": query,
        "page_size": page_size,
        "json": 1,
    }
    
    headers = {
        "User-Agent": "SyncApp/1.0 (Fitness & Nutrition Tracker)"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            response = await client.get(OPENFOODFACTS_SEARCH_URL, params=params)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "")
            if "application/json" not in content_type:
                logger.warning(f"Open Food Facts вернул не JSON для запроса '{query}'")
                return []
            
            data = response.json()
            products = data.get("products", [])
            return [format_product_data(p) for p in products[:page_size]]
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при поиске '{query}': {e.response.status_code}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Ошибка соединения при поиске '{query}': {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при поиске '{query}': {str(e)}")
        raise


async def get_product(barcode: str) -> Dict[str, Any]:
    """
    Получение продукта по штрих-коду через Open Food Facts API.
    
    Args:
        barcode: Штрих-код продукта
    
    Returns:
        Данные продукта с КБЖУ и составом
    
    Raises:
        ValueError: Если продукт не найден или штрих-код некорректен
        httpx.HTTPError: При ошибке запроса к API
    """
    # Валидация штрих-кода
    if not barcode:
        raise ValueError("Штрих-код не может быть пустым")
    
    barcode = str(barcode).strip()
    if len(barcode) < 8 or len(barcode) > 14:
        raise ValueError("Некорректная длина штрих-кода")
    
    if not barcode.replace("-", "").isdigit():
        raise ValueError("Штрих-код должен содержать только цифры")
    
    url = f"{OPENFOODFACTS_PRODUCT_URL}/{barcode}.json"
    
    headers = {
        "User-Agent": "SyncApp/1.0 (Fitness & Nutrition Tracker)"
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == 0:
                raise ValueError(f"Продукт со штрих-кодом {barcode} не найден")
            
            product = data.get("product", {})
            return format_product_data(product)
    except ValueError:
        raise
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при получении продукта {barcode}: {e.response.status_code}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Ошибка соединения при получении продукта {barcode}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении продукта {barcode}: {str(e)}")
        raise


async def get_product_by_id(product_id: str) -> Dict[str, Any]:
    """
    Получение продукта по ID через Open Food Facts API.
    
    Args:
        product_id: ID продукта на openfoodfacts.org
    
    Returns:
        Данные продукта с КБЖУ и составом
    
    Raises:
        ValueError: Если продукт не найден
        httpx.HTTPError: При ошибке запроса к API
    """
    # Валидация product_id
    if not product_id or not product_id.strip():
        raise ValueError("ID продукта не может быть пустым")
    
    product_id = str(product_id).strip()
    if len(product_id) > 50:
        raise ValueError("ID продукта слишком длинный")
    
    url = f"https://world.openfoodfacts.org/api/v2/product/{product_id}.json"
    
    headers = {
        "User-Agent": "SyncApp/1.0 (Fitness & Nutrition Tracker)"
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == 0:
                raise ValueError(f"Продукт с ID {product_id} не найден")
            
            product = data.get("product", {})
            return format_product_data(product)
    except ValueError:
        raise
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP ошибка при получении продукта {product_id}: {e.response.status_code}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Ошибка соединения при получении продукта {product_id}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении продукта {product_id}: {str(e)}")
        raise
