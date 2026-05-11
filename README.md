# PocketRAG

A fully **offline, privacy-first AI chatbot** that lets you upload any PDF and ask questions about it in plain English — no internet, no cloud APIs, everything runs on your own computer.

> **Zero AI knowledge required.** This guide walks you through every step from installation to your first answer.

---

## What is RAG? (Simple Explanation)

**RAG = Retrieval-Augmented Generation**

Imagine you give a very smart assistant a book to read. Instead of memorizing the whole book, the assistant bookmarks the most relevant pages when you ask a question, then answers using only those pages.

That's exactly what this app does with your PDF:

1. **Reads your PDF** and breaks it into small searchable pieces (called "chunks")
2. **Stores those chunks** in a local database
3. **When you ask a question**, it finds the most relevant chunks
4. **Feeds those chunks** to an AI model to generate a human-readable answer

The AI never guesses — it only answers from your document.

---

## What Tools Are Used (and Why)

| Tool | What it does | Why we use it |
|---|---|---|
| **Ollama** | Runs AI models locally on your computer | So no data ever leaves your machine |
| **Gemma 4 / Phi-3 Mini** | The LLM that reads chunks and writes answers | Small, fast models that run without a GPU |
| **nomic-embed-text** | Converts text into numbers (vectors) for smart search | Best open-source embedding model for retrieval |
| **Weaviate** | Local vector database that stores and searches chunks | Supports Hybrid Search (keyword + semantic) out of the box |
| **Docker** | Runs Weaviate as a container | Easy, no-install way to run Weaviate locally |
| **Next.js** | The web framework for the chat UI | React-based, runs locally in your browser |

---

## How It Works (Under the Hood)

### Step 1 — PDF Upload & Indexing
```
Your PDF
  → Split into ~350 character chunks (with 50 char overlap)
  → Each chunk is labelled with its page number
  → nomic-embed-text converts each chunk into a vector (list of numbers)
  → Text + vector stored together in Weaviate
```

### Step 2 — Asking a Question (Hybrid Search)
```
Your Question
  → Weaviate runs TWO searches simultaneously:
      1. Dense (Semantic) Search — finds chunks with similar meaning
      2. BM25 Keyword Search     — finds chunks with exact word matches
  → Both results are blended 50/50 (alpha = 0.5)
  → Top 5 most relevant chunks are returned
```

> **Why Hybrid Search?** Pure AI search often misses exact names, IDs, and numbers. BM25 catches those. Together, they give the best of both worlds.

### Step 3 — Answer Generation
```
Top 5 Chunks + Your Question
  → Sent to Gemma 4 (or Phi-3 Mini) via Ollama
  → Model is instructed: "Answer ONLY using the context below"
  → Final human-readable answer is shown in the chat
```

---

## Prerequisites — Install These First

### 1. Node.js (v24.15.0 recommended)
Download from: https://nodejs.org/

To verify: open your terminal and run:
```bash
node --version
# Should print: v24.15.0
```

> This project was built and tested on **Node.js v24.15.0**. Any version v18+ should work, but v24.15.0 is recommended to avoid compatibility issues.

### 2. Docker Desktop
Docker lets you run Weaviate without installing it directly.

Download from: https://www.docker.com/products/docker-desktop/

After installing, **open Docker Desktop** and make sure it's running (you'll see the Docker whale icon in your taskbar/menu bar).

### 3. Ollama — Run AI Models Locally

**Ollama is the most important piece.** It lets you run AI models (like Gemma and Phi) entirely on your own computer, for free, with no API keys.

**Download and install from:** https://ollama.com/download

After installing, Ollama runs silently in the background. To verify it's working, open your terminal and run:
```bash
ollama --version
# Should print something like: ollama version 0.x.x
```

---

## Setup (Step by Step)

### Step 1 — Start Weaviate (the database)

Open your terminal and run this Docker command:

```bash
docker run -d \
  -p 8080:8080 \
  -p 50051:50051 \
  cr.weaviate.io/semitechnologies/weaviate:1.27.0
```

**To verify it's running:** open http://localhost:8080/v1/meta in your browser. You should see a JSON response.

> You only need to run this once. Next time, use `docker start <container-id>` or restart from Docker Desktop.

### Step 2 — Download the AI Models via Ollama

Open your terminal and run these commands **one at a time**:

```bash
# This is the embedding model — converts text into searchable vectors
# Size: ~274 MB
ollama pull nomic-embed-text
```

```bash
# This is the main LLM — reads your chunks and writes answers
# Size: ~3.3 GB (takes a few minutes to download)
ollama pull gemma4
```

```bash
# This is a smaller, faster alternative LLM (optional but recommended)
# Size: ~2.2 GB
ollama pull phi3:mini
```

> **These only need to be downloaded once.** After that, they live on your machine permanently.

### Step 3 — Clone and Install the App

```bash
# Install dependencies
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is needed because some LangChain packages have minor version conflicts. This flag tells npm to install anyway.

### Step 4 — Run the App

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. You should see the PDF Assistant chat interface.

---

## Usage

1. **Select a PDF** — Click "Select PDF" in the top bar and choose any PDF file from your computer.
2. **Upload & Index** — Click **Upload**. Wait for the status to change to "PDF Indexed ✅". (This may take 30–60 seconds for large PDFs.)
3. **Choose a Model** — Use the dropdown to switch between **Gemma 4** (more capable) and **Phi-3 Mini** (faster).
4. **Ask Questions** — Type your question and press **Enter** or click the send button.
5. **Clear & Reload** — Click **Clear DB** to remove the current PDF and upload a new one.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Status shows "No PDF uploaded ❌" after refresh even though I uploaded | Make sure the Weaviate Docker container is still running |
| App is slow to respond | The LLM is running on your CPU. Phi-3 Mini is faster if you need quicker responses |
| `ollama pull` fails | Make sure Ollama is installed and running (`ollama serve` in terminal) |
| Docker command fails | Make sure Docker Desktop is open and running |
| `npm install` errors | Try `npm install --legacy-peer-deps` — the flag is required |

---

## Project Structure

```
doc-search-app/
├── app/
│   ├── api/
│   │   ├── ask/route.ts       # POST /api/ask — runs hybrid search + LLM
│   │   ├── delete/route.ts    # POST /api/delete — wipes Weaviate collection
│   │   ├── status/route.ts    # GET /api/status — checks if PDF is indexed
│   │   └── upload/route.ts    # POST /api/upload — ingests PDF into Weaviate
│   ├── page.tsx               # Chat UI
│   └── layout.tsx             # Root layout
├── lib/
│   └── rag.ts                 # Core RAG logic (loadPDF, askQuestion, deletePDFData)
└── uploads/                   # Temporary storage for uploaded PDFs
```
