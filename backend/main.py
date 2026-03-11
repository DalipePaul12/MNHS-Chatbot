from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import os
import httpx
from bs4 import BeautifulSoup
from knowledge_base import get_knowledge_base

load_dotenv()

app = FastAPI(title="MNHS Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file!")

client = Groq(api_key=GROQ_API_KEY)

# All MNHS website pages to scrape
MNHS_URLS = [
    "https://malabonnhs.depedmalaboncity.ph/",
    "https://malabonnhs.depedmalaboncity.ph/history/",
    "https://malabonnhs.depedmalaboncity.ph/school-profile/",
    "https://malabonnhs.depedmalaboncity.ph/programs/",
    "https://malabonnhs.depedmalaboncity.ph/achievements/",
    "https://malabonnhs.depedmalaboncity.ph/contact-us/",
    "https://malabonnhs.depedmalaboncity.ph/citizens-charter/",
    "https://malabonnhs.depedmalaboncity.ph/faculty-and-staff/",
    "https://malabonnhs.depedmalaboncity.ph/faqs/",
    "https://malabonnhs.depedmalaboncity.ph/transparency-board/",
]

# Cache so we don't fetch every single request
_web_cache = {}

async def fetch_page_text(url: str) -> str:
    """Fetch a webpage and return clean text."""
    if url in _web_cache:
        return _web_cache[url]

    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            response = await client_http.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; MNHSChatbot/1.0)"
            })
            soup = BeautifulSoup(response.text, "html.parser")

            # Remove scripts, styles, nav, footer (noise)
            for tag in soup(["script", "style", "nav", "footer",
                              "header", "noscript", "img"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)

            # Clean up excessive blank lines
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            clean_text = "\n".join(lines)

            # Limit to 3000 chars per page to save tokens
            _web_cache[url] = clean_text[:3000]
            return _web_cache[url]

    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return ""

async def get_live_school_info() -> str:
    """Fetch all MNHS pages and combine into one knowledge block."""
    combined = []
    for url in MNHS_URLS:
        text = await fetch_page_text(url)
        if text:
            combined.append(f"--- SOURCE: {url} ---\n{text}\n")
    return "\n".join(combined)

# Static knowledge base as fallback
STATIC_INFO = get_knowledge_base()

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

@app.get("/")
def read_root():
    return {"status": "MNHS Chatbot API is running!"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    print(f"QUESTION: {request.question}")

    # Try to get live info from website
    try:
        live_info = await get_live_school_info()
        print(f"Live web data fetched: {len(live_info)} characters")
    except Exception as e:
        print(f"Web fetch failed, using static knowledge base: {e}")
        live_info = ""

    # Use live info if available, fallback to static
    school_info = live_info if live_info else STATIC_INFO

    system_prompt = f"""You are a friendly and helpful school assistant chatbot for
Malabon National High School (MNHS) in Malabon City, Philippines.

You have access to the latest information directly from the official MNHS website.
Use ONLY the information below to answer questions accurately.
If the question is not related to MNHS, politely say you can only answer
questions about Malabon National High School.
Always be helpful, friendly, and professional.
Format your answers clearly using bullet points when listing items.

=== LIVE INFORMATION FROM OFFICIAL MNHS WEBSITE ===
{school_info}
====================================================

=== ADDITIONAL STATIC KNOWLEDGE BASE ===
{STATIC_INFO}
========================================="""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.question}
            ],
            temperature=0.7,
            max_tokens=1024,
        )

        answer = completion.choices[0].message.content or "Sorry, I could not generate a response. Please try again."
        print(f"ANSWER: {answer[:80]}...")
        return ChatResponse(answer=answer)

    except Exception as e:
        print(f"GROQ ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")