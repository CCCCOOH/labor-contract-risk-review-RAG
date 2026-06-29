# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build + type check
npm run start            # Start production server
```

## Architecture

This is a **Next.js 14 App Router** application for AI-powered review of Chinese labor contracts. Users upload contracts (PDF/DOCX/DOC), the system parses them into clauses, runs an 8-dimension RAG-based legal risk review, generates a risk report, and supports interactive follow-up chat.

### Core Pipeline

```
Upload → parseDocument() → splitClauses() → Contract (JSON file)
Review → runFullReview() → for each of 8 dimensions:
           embedOne(dim) → search top-5 laws → generateChat(contract + laws + dim.prompt)
         → parseFindings(LLM JSON output) → Report (JSON file)
Chat   → queryRAG(question + contract snippet) → embedOne → search → generateChat
```

### Key Modules

**`src/lib/rag/`** — Self-contained RAG engine (no LangChain)
- `embed.ts`: Calls OpenAI-compatible `/embeddings` endpoint
- `generate.ts`: Calls OpenAI-compatible `/chat/completions` endpoint
- `index.ts`: Orchestrates chunking (500-char), batch embedding (size 20), knowledge base build, and RAG query

**`src/lib/db/lancedb.ts`** — Flat-file vector store (misleading name, NOT actual LanceDB)
- Stores vectors in `data/vectors.json` with in-memory caching
- `cosineSimilarity()` for brute-force nearest-neighbor search
- `addVectors()` deduplicates by MD5-hash ID

**`src/lib/review/`** — Review engine
- `dimensions.ts`: 8 static review dimensions with Chinese legal expert system prompts
- `pipeline.ts`: Sequentially reviews each dimension (1 LLM call per dimension), parses JSON findings

**`src/lib/parser/`** — Document parsing
- `pdf.ts`: `pdf-parse` for PDF
- `word.ts`: `mammoth` for DOCX
- `doc.ts`: `word-extractor` for legacy DOC (CJS default export)
- `index.ts`: Dispatches by file type `"pdf" | "docx" | "doc"`

**`src/lib/splitter.ts`** — Regex-based clause splitting on patterns like `第X条`, `（一）`

**`src/lib/store.ts`** — JSON file persistence under `data/contracts/<id>.json` and `data/reports/<id>.json`

**`src/lib/config.ts`** — Reads `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL` from `process.env`

### API Routes (App Router Route Handlers)

| Route | Purpose |
|---|---|
| `POST /api/upload` | Accept multipart file, parse, split clauses, save contract |
| `POST /api/review/[id]` | Run full review pipeline (caches result) |
| `GET /api/review/[id]` | Return saved report + contract |
| `POST /api/chat/[id]` | RAG chat with contract context + follow-up questions |
| `POST /api/kb/build` | Build knowledge base from `data/knowledge/*.md` |
| `GET /api/kb` | Check if knowledge base is built and chunk count |
| `GET /api/config` | Return masked LLM config |
| `POST /api/config` | Echo test current model |

### Frontend Pages

- `/` — Upload page with drag-and-drop zone
- `/report/[id]` — Risk report with severity stats, finding cards, link to chat
- `/chat/[id]` — Interactive chat (supports `?q=` for pre-seeded question from report)
- `/admin` — Knowledge base management (build/rebuild, status display)

### Environment

Configure via `.env.local`:

```
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1   # Any OpenAI-compatible API
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### Important Implementation Details

- **`word-extractor` is CJS**: Must use `import WordExtractor from "word-extractor"` (default import), not named import. Type declaration is in `src/lib/parser/word-extractor.d.ts` using `export = WordExtractor`.
- **Server-only packages**: `pdf-parse`, `mammoth` are listed in `next.config.js` → `serverComponentsExternalPackages` to prevent Edge runtime bundling.
- **Sequential reviews**: `runFullReview()` iterates dimensions one at a time (8 sequential LLM calls). Not parallelized to avoid API rate limits.
- **Vector search is brute-force**: Cosine similarity against every record in `data/vectors.json`. Fine for <10K chunks.
- **No database**: Contracts, reports, and vectors all use flat JSON files under `data/`.
- **No streaming**: Both embedding and chat calls await the full response.
- **Chat is ephemeral**: Chat history lives in client-side React state only, not persisted.
