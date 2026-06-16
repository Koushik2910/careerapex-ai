import uuid
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
import pypdf
import docx

from models.schemas import UploadResponse
from rag.chroma_client import get_or_create_collection

router = APIRouter(prefix="/upload", tags=["upload"])

# Load embeddings once at module level
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ".", " "],
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])


def extract_text(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")


@router.post("/resume", response_model=UploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    session_id: str = Form(default=None),
):
    if session_id is None:
        session_id = str(uuid.uuid4())

    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from resume.")

    chunks = text_splitter.split_text(text)

    collection = get_or_create_collection(f"resume_{session_id}")

    # Clear old docs for this session if re-uploading
    try:
        collection.delete(where={"session_id": session_id})
    except Exception:
        pass

    chunk_embeddings = embeddings.embed_documents(chunks)

    collection.add(
        ids=[f"resume_{session_id}_{i}" for i in range(len(chunks))],
        embeddings=chunk_embeddings,
        documents=chunks,
        metadatas=[{"session_id": session_id, "source": "resume", "chunk_index": i} for i in range(len(chunks))],
    )

    return UploadResponse(
        session_id=session_id,
        file_type="resume",
        filename=file.filename,
        chunks=len(chunks),
        message=f"Resume uploaded and indexed. Session: {session_id}",
    )


@router.post("/jd", response_model=UploadResponse)
async def upload_jd(
    file: UploadFile = File(...),
    session_id: str = Form(...),
):
    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from JD.")

    chunks = text_splitter.split_text(text)

    collection = get_or_create_collection(f"jd_{session_id}")

    try:
        collection.delete(where={"session_id": session_id})
    except Exception:
        pass

    chunk_embeddings = embeddings.embed_documents(chunks)

    collection.add(
        ids=[f"jd_{session_id}_{i}" for i in range(len(chunks))],
        embeddings=chunk_embeddings,
        documents=chunks,
        metadatas=[{"session_id": session_id, "source": "jd", "chunk_index": i} for i in range(len(chunks))],
    )

    return UploadResponse(
        session_id=session_id,
        file_type="jd",
        filename=file.filename,
        chunks=len(chunks),
        message=f"JD uploaded and indexed. Session: {session_id}",
    )


@router.get("/session/{session_id}")
def get_session_info(session_id: str):
    client_module = __import__("rag.chroma_client", fromlist=["get_chroma_client"])
    client = client_module.get_chroma_client()

    collections = [c.name for c in client.list_collections()]

    has_resume = f"resume_{session_id}" in collections
    has_jd = f"jd_{session_id}" in collections

    return {
        "session_id": session_id,
        "has_resume": has_resume,
        "has_jd": has_jd,
    }


# ADD THIS ENDPOINT to your existing backend/routers/upload.py
# Place it after the existing /upload/jd endpoint

from pydantic import BaseModel

class CopyResumeRequest(BaseModel):
    source_session_id: str
    target_session_id: str

@router.post("/copy-resume")
def copy_resume_chunks(req: CopyResumeRequest):
    """
    Copy resume chunks from one session to another.
    Used when user selects a previously uploaded resume to compare against a new JD.
    The existing ChromaDB embeddings are copied to the new session_id collection.
    """
    try:
        from rag.chroma_client import get_or_create_collection

        source_collection = get_or_create_collection(f"resume_{req.source_session_id}")
        source_data = source_collection.get(include=["embeddings", "documents", "metadatas"])

        if not source_data["ids"]:
            raise HTTPException(status_code=404, detail=f"No resume found for session: {req.source_session_id}")

        target_collection = get_or_create_collection(f"resume_{req.target_session_id}")

        # Copy all chunks with new IDs
        new_ids = [f"{req.target_session_id}_chunk_{i}" for i in range(len(source_data["ids"]))]

        target_collection.upsert(
            ids=new_ids,
            embeddings=source_data["embeddings"],
            documents=source_data["documents"],
            metadatas=[{**m, "session_id": req.target_session_id} for m in source_data["metadatas"]],
        )

        return {
            "status": "copied",
            "source_session_id": req.source_session_id,
            "target_session_id": req.target_session_id,
            "chunks_copied": len(new_ids),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copy failed: {str(e)}")
