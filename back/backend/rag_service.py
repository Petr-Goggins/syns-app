"""RAG service: PDF indexing and semantic search via ChromaDB."""

from __future__ import annotations

import logging
from pathlib import Path

import chromadb
import fitz  # PyMuPDF
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
CHROMA_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "knowledge_base"
CHUNK_SIZE = 500
TOP_K = 3

_embedding_fn: embedding_functions.SentenceTransformerEmbeddingFunction | None = None
_collection: chromadb.Collection | None = None


def _get_embedding_fn() -> embedding_functions.SentenceTransformerEmbeddingFunction:
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
    return _embedding_fn


def _get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=_get_embedding_fn(),
        )
    return _collection


def _extract_text_from_pdf(pdf_path: Path) -> str:
    text_parts: list[str] = []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            page_text = page.get_text()
            if page_text.strip():
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE) -> list[str]:
    text = text.strip()
    if not text:
        return []
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def _load_pdf_chunks() -> list[tuple[str, str]]:
    """Return list of (chunk_id, chunk_text) from all PDFs in knowledge_base/."""
    if not KNOWLEDGE_BASE_DIR.exists():
        KNOWLEDGE_BASE_DIR.mkdir(parents=True, exist_ok=True)
        return []

    pdf_files = sorted(KNOWLEDGE_BASE_DIR.glob("*.pdf"))
    if not pdf_files:
        logger.info("No PDF files found in knowledge_base/")
        return []

    chunks: list[tuple[str, str]] = []
    for pdf_path in pdf_files:
        try:
            text = _extract_text_from_pdf(pdf_path)
            pdf_chunks = _split_into_chunks(text)
            for idx, chunk in enumerate(pdf_chunks):
                chunk_id = f"{pdf_path.stem}_{idx}"
                chunks.append((chunk_id, chunk))
            logger.info("Loaded %d chunks from %s", len(pdf_chunks), pdf_path.name)
        except Exception:
            logger.exception("Failed to process PDF: %s", pdf_path.name)

    return chunks


def index_knowledge_base() -> None:
    """Load PDFs from knowledge_base/ and store embeddings in ChromaDB."""
    collection = _get_collection()
    chunks = _load_pdf_chunks()

    if not chunks:
        logger.info("Knowledge base is empty — skipping indexing")
        return

    existing = collection.count()
    if existing > 0:
        logger.info("Knowledge base already indexed (%d chunks)", existing)
        return

    ids = [chunk_id for chunk_id, _ in chunks]
    documents = [chunk_text for _, chunk_text in chunks]

    collection.add(ids=ids, documents=documents)
    logger.info("Indexed %d chunks into ChromaDB", len(chunks))


def search_knowledge(query: str) -> list[str]:
    """Return top-3 relevant text chunks for the given query."""
    if not query.strip():
        return []

    collection = _get_collection()
    if collection.count() == 0:
        return []

    results = collection.query(query_texts=[query], n_results=TOP_K)
    documents = results.get("documents", [[]])
    if not documents or not documents[0]:
        return []

    return [doc for doc in documents[0] if doc]
