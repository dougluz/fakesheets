# AGENTS.md — Fakesheets

## Project Overview

Fakesheets is a browser-based tool that generates fake spreadsheets (CSV/XLSX) using Faker.js, with all processing done client-side via Web Workers. The app is a simple SSR page — the server only delivers the shell, all data generation and file building happens in the browser.

**Target:** Generate up to 100k rows with good performance and a responsive UI.

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
┌─────────────────────────────────┐
│         Main Thread (UI)        │
│                                 │
│  Form: columns, rows, format   │
│  Progress bar (%)               │
│  Download trigger               │
└──────────┬──────────────────────┘
           │ postMessage(config)
           ▼
┌─────────────────────────────────┐
│        Web Worker               │
│                                 │
│  1. Receive config              │
│  2. Generate rows with Faker    │
│     (in chunks for progress)    │
│  3. Build CSV string or XLSX    │
│  4. Transfer Blob back          │
└─────────────────────────────────┘
```

### Key Files Structure

```
src/
├── app/                    # SSR page shell
│   └── page.tsx
├── components/
│   ├── GeneratorForm.tsx   # Column picker, row count, format selector
│   ├── ProgressBar.tsx     # Visual feedback during generation
│   └── DownloadButton.tsx  # Triggers blob download
├── workers/
│   └── generator.worker.ts # Web Worker: Faker + file assembly
├── lib/
│   ├── columns.ts          # Available column definitions (name, email, etc.)
│   ├── formats.ts          # CSV and XLSX builder logic
│   └── types.ts            # Shared types between main thread and worker
└── styles/
    └── globals.css
```

## Core Behaviors

### Data Generation (Web Worker)

- Generate rows **in chunks** (e.g., 5,000 rows per chunk) to allow progress reporting via `postMessage`.
- After all rows are generated, build the file (CSV string or XLSX workbook) **inside the worker**.
- Transfer the final `Blob` back to the main thread using `postMessage`. Use `Transferable` objects where possible.
- The worker must **never** touch the DOM.

### Performance Targets (100k rows)

- Chunked generation: process in batches of 5,000 rows, posting progress after each chunk.
- Minimize memory pressure: for CSV, build the string incrementally (array of lines, join once at the end). For XLSX, use SheetJS `aoa_to_sheet` with a single 2D array.
- Avoid unnecessary object allocation per row — generate directly into arrays, not intermediate objects when possible.
- Target: 100k rows with ~10 columns should complete in under 10 seconds on a mid-range machine.

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
- Form section: column picker, row count input (default 1,000, max 500,000), format toggle (CSV/XLSX).
- Generate button → disables during generation, shows progress bar.
- Progress bar: percentage + row count (e.g., "45,000 / 100,000 rows").
- Download: auto-trigger browser download when the blob is ready. Filename format: `fakesheets-{timestamp}.{csv|xlsx}`.
- Mobile-friendly layout.

## Constraints

- **No server-side processing.** All data generation and file creation must happen in the browser.
- **No data leaves the client.** This is a privacy-safe tool — emphasize this in the UI.
- **No streaming/chunked download for v1.** Generate the full file, then download. Streaming is a future enhancement.
- **Single Web Worker for v1.** Multi-worker parallelism is a future enhancement.
- **Keep the bundle small.** Only import the Faker modules actually needed (tree-shake). Avoid importing the entire Faker locale if possible.

## Testing Notes

- Test with 1k, 10k, 50k, and 100k rows to verify performance and memory behavior.
- Verify CSV escaping with values that contain commas, quotes, and newlines.
- Verify XLSX opens correctly in Excel, Google Sheets, and LibreOffice.
- Test Web Worker error handling (what happens if Faker throws, if memory runs out).
- Test the progress reporting — it should update smoothly, not freeze.

## Future Enhancements (Out of Scope for v1)

- Streaming generation for datasets > 500k rows.
- Multiple Web Workers for parallel chunk generation.
- Custom Faker locale selection (pt_BR, es, etc.).
- Custom column definitions (user types a Faker method path).
- Drag-and-drop column reordering.
- Preview first N rows before full generation.
- Save/load column presets.
