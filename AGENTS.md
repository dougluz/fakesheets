# AGENTS.md — Fakesheets

## Project Overview

Fakesheets is a browser-based tool that generates fake spreadsheets (CSV/XLSX) using Faker.js, with all processing done client-side via Web Workers. The app is a simple SSR page — the server only delivers the shell, all data generation and file building happens in the browser.

**Target:** Generate up to 1M rows with good performance and a responsive UI.

## Tech Stack

- **Framework:** React (Vite + SSR or Next.js — lightweight, fast builds)
- **Language:** TypeScript
- **Data generation:** `@faker-js/faker` (tree-shakeable)
- **XLSX export:** `SheetJS` (xlsx library, works inside Web Workers)
- **CSV export:** Manual string concatenation (no library needed)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel or Cloudflare Pages (static-friendly)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Thread (UI)                         │
│                                                              │
│  Form: columns, rows, format                                │
│  Progress bar (%)                                            │
│  Download trigger                                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Worker Pool Manager                     │    │
│  │  • Spawns N workers (navigator.hardwareConcurrency) │    │
│  │  • Distributes chunks in round-robin                 │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │              Assembly Manager                        │    │
│  │  • Receives chunk results out-of-order               │    │
│  │  • Reorders for sequential output                    │    │
│  │  • Progressive assembly (CSV) or buffer (XLSX)       │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │              File Builder                            │    │
│  │  • CSV: Append chunk, release memory                 │    │
│  │  • XLSX: Collect all chunks, single build            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Worker Pool                               │
│                                                              │
│  Worker 0    Worker 1    Worker 2    Worker N               │
│  [chunk 0]   [chunk 1]   [chunk 2]   ...                     │
│  [chunk N]   [chunk N+1] [chunk N+2]                         │
│     │           │           │                                │
│     └───────────┴───────────┴──► postMessage(chunk data)    │
└─────────────────────────────────────────────────────────────┘
```

### Key Files Structure

```
app/
└── page.tsx                # Main page with worker pool management
components/
├── GeneratorForm.tsx       # Column picker, row count, format selector
├── PreviewTable.tsx        # Preview of first 5 rows
├── ProgressBar.tsx         # Visual feedback during generation
└── XLSXWarning.tsx         # Warning for large XLSX files
lib/
├── columns.ts              # Available column definitions (name, email, etc.)
├── formats.ts              # CSV and XLSX builder logic
├── types.ts                # Shared types between main thread and worker
├── workerCode.ts           # Inline Web Worker code (blob URL)
├── workerPool.ts           # Worker pool manager
└── assemblyManager.ts      # Progressive file assembly
```

## Core Behaviors

### Data Generation (Web Worker Pool)

- Workers generate rows **in chunks** (10,000 rows per chunk) and return results to main thread.
- Worker pool size is based on `navigator.hardwareConcurrency`, capped at 8 workers.
- Chunks are distributed to workers via round-robin for load balancing.
- File building (CSV/XLSX) happens in the main thread via AssemblyManager, not in workers.
- The worker must **never** touch the DOM.

### Performance Targets (1M rows)

- Chunked generation: process in batches of 10,000 rows per chunk, distributed across worker pool.
- Minimize memory pressure: for CSV, build the string incrementally. For XLSX, collect all rows then build once.
- Avoid unnecessary object allocation per row — generate directly into arrays, not intermediate objects when possible.
- Target: 1M rows with ~10 columns should complete in under 30 seconds on a mid-range machine.
- Memory: CSV ~100MB, XLSX ~150MB at 1M rows.

### Available Column Types

Each column maps to a Faker method. Start with these:

| Column       | Faker Method                  |
|-------------|-------------------------------|
| First Name  | `faker.person.firstName()`    |
| Last Name   | `faker.person.lastName()`     |
| Full Name   | `faker.person.fullName()`     |
| Email       | `faker.internet.email()`      |
| Phone       | `faker.phone.number()`        |
| Company     | `faker.company.name()`        |
| Job Title   | `faker.person.jobTitle()`     |
| Address     | `faker.location.streetAddress()` |
| City        | `faker.location.city()`       |
| Country     | `faker.location.country()`    |
| Website     | `faker.internet.url()`        |
| Avatar URL  | `faker.image.avatar()`        |

The user selects which columns to include via checkboxes or a multi-select. Column order in the UI = column order in the export.

### Export Formats

- **CSV:** UTF-8 encoded, comma-separated, with header row. Values containing commas or quotes must be properly escaped.
- **XLSX:** Single sheet named "Data", header row bold if possible via SheetJS styling.

### UI Requirements

- Single page, no routing needed.
- Form section: column picker, row count input (default 1,000, max 1,000,000), format toggle (CSV/XLSX).
- XLSX warning: Display warning when XLSX is selected and row count exceeds 500,000 (memory consideration).
- Generate button → disables during generation, shows progress bar.
- Progress bar: percentage + row count (e.g., "45,000 / 100,000 rows").
- Download: auto-trigger browser download when the blob is ready. Filename format: `fakesheets-{timestamp}.{csv|xlsx}`.
- Mobile-friendly layout.

## Constraints

- **No server-side processing.** All data generation and file creation must happen in the browser.
- **No data leaves the client.** This is a privacy-safe tool — emphasize this in the UI.
- **No streaming/chunked download for v1.** Generate the full file, then download. Streaming is a future enhancement.
- **Keep the bundle small.** Only import the Faker modules actually needed (tree-shake). Avoid importing the entire Faker locale if possible.

## Testing Notes

- Test with 1k, 10k, 50k, 100k, and 1M rows to verify performance and memory behavior.
- Verify CSV escaping with values that contain commas, quotes, and newlines.
- Verify XLSX opens correctly in Excel, Google Sheets, and LibreOffice.
- Test Web Worker error handling (what happens if Faker throws, if memory runs out).
- Test the progress reporting — it should update smoothly, not freeze.
- Test worker pool behavior with different `navigator.hardwareConcurrency` values.

## Future Enhancements (Out of Scope for v1)

- Streaming generation for datasets > 500k rows.
- Cancel button - Allow users to cancel mid-generation, terminating all workers.
- Seed reproducibility - Optional seed input for reproducible datasets.
- URL state persistence - Save seed + selected options in URL for shareable configurations.
- Custom Faker locale selection (pt_BR, es, etc.).
- Custom column definitions (user types a Faker method path).
- Drag-and-drop column reordering.
- Preview first N rows before full generation.
- Save/load column presets.
