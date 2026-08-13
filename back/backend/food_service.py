"""Сервис для работы с базой данных Open Food Facts."""

import httpx
from typing import Optional, Dict, Any, List

OPENFOODFACTS_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search"
OPENFOODFACTS_PRODUCT_URL = "https://world.openfoodfacts.org/api/v0/product"


def format_product_data(product: Dict[str, Any]) -> Dict[str, Any]:
    """Форматирует данные продукта из Open Food Facts."""
    nutriments = product.get("nutriments", {})
    return {
        "name": product.get("product_name", "Неизвестный продукт"),
        "brand": product.get("brands", "Неизвестный бренд"),
        "barcode": product.get("code", ""),
        "calories": nutriments.get("energy-kcal_100g"),
        "proteins": nutriments.get("proteins_100g"),
        "fats": nutriments.get("fat_100g"),
        "carbs": nutriments.get("carbohydrates_100g"),
        "ingredients": product.get("ingredients_text", ""),
        "additives": product.get("additives_tags", []),
        "nova_group": product.get("nova_group"),
        "nutriscore": product.get("nutriscore_grade"),
    }


async def search_products(query: str, page_size: int = 10) -> List[Dict[str, Any]]:
    """
    Поиск продуктов по названию через Open Food Facts API.
    
    Args:
        query: Поисковый запрос (название продукта)
        page_size: Количество результатов (по умолчанию 10)
    
    Returns:
        Список продуктов с информацией о КБЖУ
    """
    params = {
        "search_terms": query,
        "page_size": page_size,
        "json": 1,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(OPENFOODFACTS_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        products = data.get("products", [])
        return [format_product_data(p) for p in products]


async def get_product(barcode: str) -> Dict[str, Any]:
    """
    Получение продукта по штрих-коду через Open Food Facts API.
    
    Args:
        barcode: Штрих-код продукта
    
    Returns:
        Данные продукта с КБЖУ и составом
    
    Raises:
        ValueError: Если продукт не найден
        httpx.HTTPError: При ошибке запроса к API
    """
    url = f"{OPENFOODFACTS_PRODUCT_URL}/{barcode}.json"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == 0:
            raise ValueError(f"Продукт со штрих-кодом {barcode} не найден")
        
        product = data.get("product", {})
        return format_product_data(product)


async def get_product_by_id(product_id: str) -> Dict[str, Any]:
    """
    Получение продукта по ID через Open Food Facts API.
    
    Args:
        product_id: ID продукта на openfoodfacts.org
    
    Returns:
        Данные продукта с КБЖУ и составом
    """
    url = f"https://world.openfoodfacts.org/api/v2/product/{product_id}.json"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == 0:
            raise ValueError(f"Продукт с ID {product_id} не найден")
        
        product = data.get("product", {})
        return format_product_data(product)
