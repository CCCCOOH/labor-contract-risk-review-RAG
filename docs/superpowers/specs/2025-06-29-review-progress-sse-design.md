# Review Progress Visualization with SSE

## Problem

Contract review (`POST /api/review/[id]`) calls 8 LLM dimensions sequentially (~5-15s each), blocks the HTTP response until all complete. Users stare at a spinner with zero progress feedback for up to 2 minutes.

## Design

### 1. SSE Endpoint

`POST /api/review/[id]` returns `Content-Type: text/event-stream` with 3 event types:

- **`progress`** — after each dimension completes: `{dimensionKey, dimensionName, current, total, findings: RiskFinding[]}`
- **`complete`** — final report: `{report: ReviewReport}`
- **`error`** — fatal error: `{error: string}`

Cached reports (already reviewed) return immediately via `complete` event with no progress stream.

### 2. Backend: Async Generator

New function `reviewEachDimension()` in `src/lib/review/pipeline.ts`:
- Async generator yielding `{dimension, current, total, findings}` after each dimension
- Existing `reviewDimension()` unchanged
- `runFullReview()` preserved for backward compat

### 3. Frontend: Report Page

`src/app/report/[id]/page.tsx`:
- Read SSE with `fetch().body.getReader()` + `TextDecoder`
- State: `{current, total, currentDimension, partialFindings[]}`
- Show `ReviewProgress` component while streaming
- Show `RiskReport` (unchanged) on `complete`

### 4. New Component: ReviewProgress

Progress bar + dimension checklist with status icons:
- ✅ done, 🔄 active, ⏳ pending
- Each completed dimension shows finding count inline

### 5. Files Changed

| File | Change |
|------|--------|
| `src/lib/review/pipeline.ts` | Add `reviewEachDimension()` async generator |
| `src/app/api/review/[id]/route.ts` | POST → SSE ReadableStream |
| `src/app/report/[id]/page.tsx` | SSE consumer + progress state |
| `src/components/ReviewProgress.tsx` | **NEW** progress bar component |

### 6. Error Handling

- Per-dimension errors yield `progress` with `error` field, move to next dim
- Fatal errors (auth, network) → `error` SSE event → frontend shows error message
- Network disconnection → frontend fetch catch, prompt retry
