"""Модуль для планирования приёмов пищи."""

from typing import List, Dict, Any, Optional
from datetime import datetime, date


class MealPlanner:
    """Класс для управления приёмами пищи и ежедневным рационом."""
    
    MEAL_TYPES = {
        "breakfast": "Завтрак",
        "lunch": "Обед",
        "dinner": "Ужин",
        "snack_morning": "Утренний перекус",
        "snack_afternoon": "Полдник",
        "snack_evening": "Вечерний перекус",
    }
    
    def __init__(self):
        self.meals: List[Dict[str, Any]] = []
    
    def add_meal(
        self,
        food_name: str,
        calories: float,
        proteins: float,
        fats: float,
        carbs: float,
        weight_grams: float = 100,
        meal_type: str = "snack",
        brand: Optional[str] = None,
        barcode: Optional[str] = None,
        ingredients: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Добавляет продукт в приём пищи.
        
        Args:
            food_name: Название продукта
            calories: Калории на 100г
            proteins: Белки на 100г
            fats: Жиры на 100г
            carbs: Углеводы на 100г
            weight_grams: Вес порции в граммах
            meal_type: Тип приёма пищи (breakfast, lunch, dinner, snack_*)
            brand: Бренд продукта (опционально)
            barcode: Штрих-код (опционально)
            ingredients: Состав (опционально)
        
        Returns:
            Данные добавленного приёма пищи
        """
        # Рассчитываем КБЖУ для указанной порции
        portion_factor = weight_grams / 100.0
        
        meal_entry = {
            "id": len(self.meals) + 1,
            "food_name": food_name,
            "brand": brand,
            "barcode": barcode,
            "ingredients": ingredients,
            "meal_type": meal_type,
            "meal_type_label": self.MEAL_TYPES.get(meal_type, "Перекус"),
            "weight_grams": weight_grams,
            "calories_per_100g": calories,
            "proteins_per_100g": proteins,
            "fats_per_100g": fats,
            "carbs_per_100g": carbs,
            "calories": round(calories * portion_factor, 1),
            "proteins": round(proteins * portion_factor, 2),
            "fats": round(fats * portion_factor, 2),
            "carbs": round(carbs * portion_factor, 2),
            "timestamp": datetime.now().isoformat(),
        }
        
        self.meals.append(meal_entry)
        return meal_entry
    
    def get_meals_by_type(self, meal_type: str) -> List[Dict[str, Any]]:
        """Возвращает все приёмы пищи указанного типа."""
        return [m for m in self.meals if m["meal_type"] == meal_type]
    
    def get_daily_summary(self, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Возвращает сводку по питанию за день.
        
        Args:
            target_date: Дата (по умолчанию сегодня)
        
        Returns:
            Словарь с общей информацией о КБЖУ за день и разбивкой по типам приёмов пищи
        """
        # В реальном приложении здесь была бы фильтрация по дате
        # Сейчас возвращаем сумму всех добавленных приёмов пищи
        
        total_calories = sum(m["calories"] for m in self.meals)
        total_proteins = sum(m["proteins"] for m in self.meals)
        total_fats = sum(m["fats"] for m in self.meals)
        total_carbs = sum(m["carbs"] for m in self.meals)
        
        # Группировка по типам приёмов пищи
        meals_by_type: Dict[str, List[Dict[str, Any]]] = {}
        for meal in self.meals:
            meal_type = meal["meal_type"]
            if meal_type not in meals_by_type:
                meals_by_type[meal_type] = []
            meals_by_type[meal_type].append(meal)
        
        # Подсчёт КБЖУ по каждому типу приёма пищи
        summary_by_type = {}
        for meal_type, meals in meals_by_type.items():
            summary_by_type[meal_type] = {
                "label": self.MEAL_TYPES.get(meal_type, "Перекус"),
                "count": len(meals),
                "calories": round(sum(m["calories"] for m in meals), 1),
                "proteins": round(sum(m["proteins"] for m in meals), 2),
                "fats": round(sum(m["fats"] for m in meals), 2),
                "carbs": round(sum(m["carbs"] for m in meals), 2),
                "meals": meals,
            }
        
        return {
            "date": (target_date or date.today()).isoformat(),
            "total": {
                "calories": round(total_calories, 1),
                "proteins": round(total_proteins, 2),
                "fats": round(total_fats, 2),
                "carbs": round(total_carbs, 2),
            },
            "by_meal_type": summary_by_type,
            "total_meals": len(self.meals),
        }
    
    def clear_meals(self):
        """Очищает список всех приёмов пищи."""
        self.meals.clear()
    
    def remove_meal(self, meal_id: int) -> bool:
        """
        Удаляет приём пищи по ID.
        
        Args:
            meal_id: ID приёма пищи
        
        Returns:
            True если удалено, False если не найдено
        """
        for i, meal in enumerate(self.meals):
            if meal["id"] == meal_id:
                self.meals.pop(i)
                return True
        return False


# Глобальный экземпляр планировщика (для демонстрации)
planner = MealPlanner()


def add_meal(
    food_name: str,
    calories: float,
    proteins: float,
    fats: float,
    carbs: float,
    weight_grams: float = 100,
    meal_type: str = "snack",
    **kwargs,
) -> Dict[str, Any]:
    """
    Удобная функция для добавления приёма пищи.
    
    Args:
        food_name: Название продукта
        calories: Калории на 100г
        proteins: Белки на 100г
        fats: Жиры на 100г
        carbs: Углеводы на 100г
        weight_grams: Вес порции в граммах
        meal_type: Тип приёма пищи
        **kwargs: Дополнительные параметры (brand, barcode, ingredients)
    
    Returns:
        Данные добавленного приёма пищи
    """
    return planner.add_meal(
        food_name=food_name,
        calories=calories,
        proteins=proteins,
        fats=fats,
        carbs=carbs,
        weight_grams=weight_grams,
        meal_type=meal_type,
        **kwargs,
    )


def get_daily_summary() -> Dict[str, Any]:
    """
    Получение сводки по питанию за день.
    
    Returns:
        Словарь с общей информацией о КБЖУ и разбивкой по приёмам пищи
    """
    return planner.get_daily_summary()
