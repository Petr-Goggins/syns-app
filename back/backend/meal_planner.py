"""Модуль для планирования приёмов пищи."""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)


class MealPlanner:
    """Класс для управления приёмами пищи и ежедневным рационом.
    
    Внимание: Этот класс не предназначен для хранения состояния между запросами.
    Для каждого пользователя должен создаваться отдельный экземпляр.
    """
    
    MEAL_TYPES = {
        "breakfast": "Завтрак",
        "lunch": "Обед",
        "dinner": "Ужин",
        "snack_morning": "Утренний перекус",
        "snack_afternoon": "Полдник",
        "snack_evening": "Вечерний перекус",
    }
    
    # Константы для валидации
    MAX_FOOD_NAME_LENGTH = 200
    MAX_BRAND_LENGTH = 100
    MAX_INGREDIENTS_LENGTH = 2000
    MAX_WEIGHT_GRAMS = 10000
    MAX_CALORIES_PER_100G = 5000
    MAX_MACRO_PER_100G = 500
    
    def __init__(self, user_id: Optional[str] = None):
        """
        Инициализация планировщика.
        
        Args:
            user_id: ID пользователя (для разделения данных)
        """
        self.user_id = user_id
        self.meals: List[Dict[str, Any]] = []
        self._meal_counter = 0
    
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
            food_name: Название продукта (макс. 200 символов)
            calories: Калории на 100г (0-5000)
            proteins: Белки на 100г (0-500)
            fats: Жиры на 100г (0-500)
            carbs: Углеводы на 100г (0-500)
            weight_grams: Вес порции в граммах (0-10000)
            meal_type: Тип приёма пищи (breakfast, lunch, dinner, snack_*)
            brand: Бренд продукта (опционально, макс. 100 символов)
            barcode: Штрих-код (опционально)
            ingredients: Состав (опционально, макс. 2000 символов)
        
        Returns:
            Данные добавленного приёма пищи
        
        Raises:
            ValueError: При некорректных входных данных
        """
        # Валидация входных данных
        if not food_name or not food_name.strip():
            raise ValueError("Название продукта не может быть пустым")
        
        food_name = str(food_name).strip()[:self.MAX_FOOD_NAME_LENGTH]
        
        if meal_type not in self.MEAL_TYPES:
            raise ValueError(f"Некорректный тип приёма пищи: {meal_type}")
        
        # Валидация числовых значений
        try:
            calories = float(calories)
            proteins = float(proteins)
            fats = float(fats)
            carbs = float(carbs)
            weight_grams = float(weight_grams)
        except (TypeError, ValueError):
            raise ValueError("КБЖУ и вес должны быть числовыми значениями")
        
        if not (0 <= calories <= self.MAX_CALORIES_PER_100G):
            raise ValueError(f"Калорийность должна быть в диапазоне 0-{self.MAX_CALORIES_PER_100G}")
        
        if not (0 <= proteins <= self.MAX_MACRO_PER_100G):
            raise ValueError(f"Белки должны быть в диапазоне 0-{self.MAX_MACRO_PER_100G}")
        
        if not (0 <= fats <= self.MAX_MACRO_PER_100G):
            raise ValueError(f"Жиры должны быть в диапазоне 0-{self.MAX_MACRO_PER_100G}")
        
        if not (0 <= carbs <= self.MAX_MACRO_PER_100G):
            raise ValueError(f"Углеводы должны быть в диапазоне 0-{self.MAX_MACRO_PER_100G}")
        
        if not (0 < weight_grams <= self.MAX_WEIGHT_GRAMS):
            raise ValueError(f"Вес должен быть в диапазоне 0-{self.MAX_WEIGHT_GRAMS}г")
        
        # Валидация опциональных полей
        if brand:
            brand = str(brand).strip()[:self.MAX_BRAND_LENGTH]
        
        if barcode:
            barcode = str(barcode).strip()
            if len(barcode) > 50:
                raise ValueError("Штрих-код слишком длинный")
        
        if ingredients:
            ingredients = str(ingredients).strip()[:self.MAX_INGREDIENTS_LENGTH]
        
        # Рассчитываем КБЖУ для указанной порции
        portion_factor = weight_grams / 100.0
        
        self._meal_counter += 1
        meal_entry = {
            "id": self._meal_counter,
            "user_id": self.user_id,
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
        logger.info(f"Добавлен приём пищи: {food_name} ({weight_grams}г) для пользователя {self.user_id}")
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
# ВНИМАНИЕ: В продакшене используйте отдельные экземпляры для каждого пользователя!
planner = MealPlanner()


def add_meal(
    food_name: str,
    calories: float,
    proteins: float,
    fats: float,
    carbs: float,
    weight_grams: float = 100,
    meal_type: str = "snack",
    user_id: Optional[str] = None,
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
        user_id: ID пользователя (рекомендуется указывать)
        **kwargs: Дополнительные параметры (brand, barcode, ingredients)
    
    Returns:
        Данные добавленного приёма пищи
    
    Raises:
        ValueError: При некорректных входных данных
    """
    # Создаём временный планировщик для этого вызова
    temp_planner = MealPlanner(user_id=user_id)
    return temp_planner.add_meal(
        food_name=food_name,
        calories=calories,
        proteins=proteins,
        fats=fats,
        carbs=carbs,
        weight_grams=weight_grams,
        meal_type=meal_type,
        **kwargs,
    )


def get_daily_summary(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Получение сводки по питанию за день.
    
    Args:
        user_id: ID пользователя (не используется в демо-режиме)
    
    Returns:
        Словарь с общей информацией о КБЖУ и разбивкой по приёмам пищи
    
    Note:
        В демо-режиме возвращает данные глобального планировщика.
        В продакшене используйте отдельный экземпляр MealPlanner для каждого пользователя.
    """
    return planner.get_daily_summary()
