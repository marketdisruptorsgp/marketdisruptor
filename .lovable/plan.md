

## Ad-Hoc Intelligence Explorer

### What we're building

A new "Ask Intelligence" section in the Workspace page — a conversational interface where users type natural language questions about their data and get AI-generated answers with inline charts/tables. Think of it as a mini analyst that sits on top of all their saved analyses, geo data, regulatory data, patents, trends, and market news.

### How it works

**1. New edge function: `workspace-query`**
- Receives the user's natural language question + their user_id
- Queries the database server-side to gather context: saved_analyses (scores, categories, products, analysis_data), patent_filings, trend_signals, market_news, platform_intel
- Builds a system prompt that includes a structured summary of the user's data (project names, scores, categories, geo/regulatory data from analysis_data blobs, patent counts, trend signals)
- Sends to Gemini 2.5 Flash via Lovable AI gateway with tool calling to extract structured responses
- Returns: `{ answer: string, chartData?: { type: "bar"|"line"|"table", labels: string[], values: number[], title: string }[] }`
- Streams the answer text; chart data comes as a structured tool call response

**2. New component: `WorkspaceExplorer.tsx`**
- Chat-style input at the top of a card section in the Workspace
- Shows the AI's streamed text response with markdown rendering
- If the response includes chartData, renders inline Recharts visualizations (bar/line) or a simple table
- Quick-prompt chips: "Compare my top 3 projects", "What regulatory risks should I watch?", "Which category has the highest scores?", "Show my analysis trend over time"
- Conversation is ephemeral (session only, no persistence needed)

**3. Integration into WorkspacePage**
- Add a new section card between the metrics strip and "My Top Choices" (or as a collapsible section at the top)
- Only visible when user has at least 1 analysis

### Architecture

```text
User types question
       │
       ▼
WorkspaceExplorer (frontend)
       │  POST /workspace-query
       ▼
workspace-query edge function
       │  1. Query saved_analyses, patents, trends, news for this user
       │  2. Build context summary (truncated to fit context window)
       │  3. Call Lovable AI (Gemini 2.5 Flash) with tool calling
       │     - Tool: render_chart({ type, labels, values, title })
       │     - Tool: render_table({ headers, rows })
       │  4. Stream text response + return tool call results
       ▼
Frontend renders answer + charts/tables inline
```

### Data the AI can access (per user)

| Source | What gets summarized |
|--------|---------------------|
| saved_analyses | Project names, scores, categories, geo data, regulatory data, product details |
| patent_filings | Patent categories, assignees, filing dates |
| trend_signals | Search trend keywords, momentum |
| market_news | Recent headlines, categories |
| platform_intel | Platform-wide stats |

### Files to create/change

- **Create** `supabase/functions/workspace-query/index.ts` — edge function with data gathering + AI streaming
- **Create** `src/components/workspace/WorkspaceExplorer.tsx` — chat UI with inline chart rendering
- **Edit** `src/pages/WorkspacePage.tsx` — add WorkspaceExplorer section
- **Edit** `supabase/config.toml` — register new function

### Key design decisions

- **Streaming**: Text answer streams token-by-token (same SSE pattern as help-assistant). Chart data returned as structured tool call at end of stream.
- **No persistence**: Conversations reset on page reload. This is ad-hoc exploration, not a saved artifact.
- **Data truncation**: Edge function summarizes/truncates data to stay within context limits (e.g., top 20 analyses, last 30 patents, last 10 news items).
- **Security**: Function queries only data belonging to the authenticated user (RLS + user_id filter).

