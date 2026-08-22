import logging
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
SITE_URL = os.getenv("SITE_URL", "http://localhost:8000")
SITE_TITLE = os.getenv("SITE_TITLE", "Sync App")
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

async def ask_ai(user_message: str, system_prompt: str) -> str:
    """
    Отправляет запрос в OpenRouter с заданным системным промтом.
    Валидирует входные данные и обрабатывает ошибки API.
    """
    # Валидация входных данных
    if not user_message or not user_message.strip():
        raise ValueError("Пустое сообщение")
    
    if len(user_message) > 5000:
        raise ValueError("Сообщение слишком длинное (максимум 5000 символов)")
    
    if not system_prompt or len(system_prompt) > 10000:
        raise ValueError("Некорректный системный промт")
    
    if not OPENROUTER_API_KEY:
        raise ValueError("API ключ не настроен")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": SITE_URL,
                    "X-OpenRouter-Title": SITE_TITLE,
                    "Content-Type": "application/json",
                },
                json={
                    "model": DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message.strip()},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800,
                },
            )
            response.raise_for_status()
            data = response.json()
            
            # Валидация ответа от API
            if not data.get("choices") or not data["choices"][0].get("message"):
                raise RuntimeError("Некорректный ответ от AI сервиса")
                
            content = data["choices"][0]["message"].get("content", "")
            if not content:
                raise RuntimeError("Пустой ответ от AI сервиса")
                
            return content
        except httpx.TimeoutException:
            logger.error("Таймаут запроса к AI сервису")
            raise RuntimeError("Сервер ИИ не отвечает. Попробуйте позже.")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP ошибка при запросе к AI: {e.response.status_code}")
            raise RuntimeError(f"Ошибка AI сервиса: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Неожиданная ошибка при запросе к AI: {e}")
            raise RuntimeError(f"Ошибка при обращении к ИИ: {str(e)}")