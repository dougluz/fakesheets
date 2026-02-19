# AGENTS.md — Fakesheets

## Project Overview

Fakesheets is a browser-based tool that generates fake spreadsheets (CSV/XLSX) using Faker.js, with all processing done client-side via Web Workers. The app uses Next.js App Router with client-side generation — the server only delivers the shell, all data generation and file building happens in the browser.

**Target:** Generate up to 1,000,000 rows with good performance and a responsive UI.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Data generation:** `@faker-js/faker` (tree-shakeable)
- **XLSX export:** `ExcelJS` (works inside Web Workers, supports streaming)
- **CSV export:** Manual string concatenation (no library needed)
- **Styling:** Tailwind CSS
- **Icons:** Material Icons
- **Analytics:** Vercel Analytics
- **Deployment:** Vercel

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Thread (UI)                          │
│                                                              │
│  GeneratorForm: columns, rows (1-1M), format, locale        │
│  PreviewTable: shows first 5 rows                           │
│  ProgressBar: visual feedback during generation             │
│  Performance Warning: XLSX > 500k rows                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         │                                           │
         ▼                                           ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   Preview Generation    │           │    Full Generation      │
│   (Single Worker)       │           │    (WorkerPool)         │
│                         │           │                         │
│  generator.worker.ts    │           │  ┌─────────────────┐    │
│  - Generates 5 rows     │           │  │ chunkWorker #1  │    │
│  - Returns headers +    │           │  │ chunkWorker #2  │    │
│    rows for preview     │           │  │ ...             │    │
└─────────────────────────┘           │  │ chunkWorker #N  │    │
                                      │  └────────┬────────┘    │
                                      │           │             │
                                      │           ▼             │
                                      │  streamingBuilder.ts    │
                                      │  - Builds CSV/XLSX      │
                                      │  - Returns Blob         │
                                      └─────────────────────────┘
```

### Multi-Worker Parallel Generation

The `WorkerPool` class orchestrates multiple Web Workers for parallel data generation:

1. **Worker Allocation**: Creates up to 8 workers (or hardware concurrency limit), with minimum 10,000 rows per worker
2. **Chunk Distribution**: Divides rows evenly across workers
3. **Progress Aggregation**: Collects progress from all workers and reports total progress
4. **Result Assembly**: Combines chunks in order and builds the final file

### Key Files Structure

```
app/
├── layout.tsx              # Root layout with fonts
├── page.tsx                # Main page - handles generation logic
└── globals.css             # Tailwind imports + custom styles

components/
├── GeneratorForm.tsx       # Column picker, row count, format selector
├── PreviewTable.tsx        # Shows first 5 rows preview
└── ProgressBar.tsx         # Visual feedback during generation

workers/
├── generator.worker.ts     # Single worker for preview (5 rows)
└── chunkWorker.ts          # Parallel worker for full generation

lib/
├── columns.ts              # Available column definitions
├── formats.ts              # CSV and XLSX builder for preview worker
├── streamingBuilder.ts     # Streaming CSV/XLSX builder for WorkerPool
├── workerPool.ts           # Multi-worker orchestration
├── types.ts                # Shared types
└── urlState.ts             # URL state management (seed, columns, rows, format)

hooks/
└── useUrlState.ts          # React hook for URL state with SSR-safe hydration
```

### URL State Management

The app persists all generation settings in the URL, enabling shareable links:

- **URL Parameters:**
  - `seed` — Random seed for reproducible data generation
  - `cols` — Comma-separated list of selected columns
  - `rows` — Number of rows (1-1,000,000)
  - `format` — Export format (`csv` or `xlsx`)
  - `locale` — Faker locale for data language (`en` or `pt_BR`)

- **Auto-Detect Locale:** When no locale is specified in the URL, the app auto-detects from the user's browser language. Portuguese browsers default to `pt_BR`, others default to `en`.

- **SSR-Safe Hydration:** The `useUrlState` hook avoids hydration mismatches by:
  1. Rendering with static defaults on both server and client
  2. Parsing URL params in a `useEffect` after hydration
  3. Updating the URL via `replaceState` when state changes

- **Shareable Links:** Users can copy the current URL to share their configuration. The "Copy Link" button uses the Clipboard API.

## Core Behaviors

### Preview Generation

- Clicking "Preview" generates 5 sample rows using a single Web Worker
- Shows a table with the selected columns and sample data
- Uses `generator.worker.ts` with `preview: true` flag

### Full Generation (WorkerPool)

1. **Worker Spawning**: Creates N workers based on row count and hardware concurrency
2. **Chunk Processing**: Each worker generates its assigned rows (5,000 rows per progress update)
3. **Progress Reporting**: Each worker posts progress; WorkerPool aggregates and reports totals
4. **File Building**: After all chunks complete, `streamingBuilder.ts` assembles the final file:
   - **CSV**: Concatenates chunks with BOM and header line
   - **XLSX**: Uses ExcelJS to write all rows to a workbook
5. **Download**: Creates blob URL and triggers browser download

### Performance Targets

| Row Count  | Target Time | Notes                                    |
|------------|-------------|------------------------------------------|
| 1,000      | < 1s        | Near-instant                            |
| 100,000    | < 5s        | Smooth progress bar                     |
| 500,000    | < 15s       | May show memory pressure                |
| 1,000,000  | < 30s       | XLSX shows warning, CSV recommended     |

### Performance Warning

When selecting XLSX format with > 500,000 rows, a warning is displayed:
- XLSX files require building the entire workbook in memory
- Large datasets may cause browser memory issues
- CSV format is recommended for datasets > 500k rows

### Available Column Types

Each column maps to a Faker method:

| Column       | Faker Method                  | Icon        |
|-------------|-------------------------------|-------------|
| First Name  | `faker.person.firstName()`    | person      |
| Last Name   | `faker.person.lastName()`     | person      |
| Full Name   | `faker.person.fullName()`     | badge       |
| Email       | `faker.internet.email()`      | email       |
| Phone       | `faker.phone.number()`        | phone       |
| Company     | `faker.company.name()`        | business    |
| Job Title   | `faker.person.jobTitle()`     | work        |
| Address     | `faker.location.streetAddress()` | home    |
| City        | `faker.location.city()`       | location_city |
| Country     | `faker.location.country()`    | public      |
| Website     | `faker.internet.url()`        | link        |
| Avatar URL  | `faker.image.avatar()`        | account_circle |

### Export Formats

- **CSV:** UTF-8 encoded with BOM, comma-separated, with header row. Values containing commas, quotes, or newlines are properly escaped.
- **XLSX:** Single sheet named "Data", built with ExcelJS. Header row is bold.

### UI Requirements

- Single page, no routing needed
- Form section: column picker, row count input (default 1,000, max 1,000,000), format toggle (CSV/XLSX), language selector (English/Português)
- Preview button → shows first 5 rows in a table
- Generate button → disables during generation, shows progress bar
- Progress bar: percentage + row count (e.g., "45,000 / 100,000 rows")
- Performance warning: shown when XLSX + > 500k rows
- Download: auto-trigger browser download when blob is ready. Filename format: `fakesheets-{timestamp}.{csv|xlsx}`
- Mobile-friendly responsive layout

## Constraints

- **No server-side processing.** All data generation and file creation happens in the browser.
- **No data leaves the client.** This is a privacy-safe tool — emphasized in the UI.
- **Keep the bundle small.** Only import the Faker modules actually needed (tree-shake).
- **Web Workers never touch the DOM.** All DOM manipulation is in the main thread.

## Testing Notes

- Test with 1k, 10k, 100k, 500k, and 1M rows to verify performance and memory behavior
- Verify CSV escaping with values containing commas, quotes, and newlines
- Verify XLSX opens correctly in Excel, Google Sheets, and LibreOffice
- Test Web Worker error handling (Faker throws, memory runs out)
- Test progress reporting — should update smoothly across all workers
- Test preview functionality with different column combinations
- Verify performance warning appears for XLSX > 500k rows only

## Future Enhancements (Out of Scope for v1)

- Additional Faker locales (es, de, fr, etc.)
- Custom column definitions (user types a Faker method path)
- Drag-and-drop column reordering
- Save/load column presets
- True streaming download (generate and stream to disk incrementally)
- Column value constraints (e.g., email domain, phone format)
