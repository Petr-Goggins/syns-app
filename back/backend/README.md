# Sync App — AI Backend

FastAPI backend with OpenRouter integration and RAG over PDF knowledge base.

## OpenRouter API Key

1. Register at [openrouter.ai](https://openrouter.ai/)
2. Go to **Keys** → create a new API key
3. Copy the key into `backend/.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
```

> Free model `meta-llama/llama-3.3-70b-instruct:free` allows **~50 requests/day**.

## Setup & Run

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then edit .env with your key
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`. Docs: `http://localhost:8000/docs`.

## Knowledge Base (RAG)

Place PDF files in `backend/knowledge_base/`. They are indexed on first startup into `backend/chroma_db/`.

## API

**POST** `/ai/ask`

```json
{
  "message": "Как начать бегать?",
  "user_data": {
    "gender": "female",
    "age": 28,
    "height": 170,
    "weight": 65,
    "goal": "похудение",
    "activity": "низкая",
    "skills": [],
    "cyclePhase": "follicular",
    "religion": "",
    "inventory": []
  }
}
```

Response:

```json
{
  "reply": "..."
}
```
