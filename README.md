# Fakesheets

A browser-based tool that generates fake spreadsheets (CSV/XLSX) with up to 1,000,000 rows — all processing happens entirely on the client side using Web Workers.

**[Try it live →](https://fakesheets.vercel.app)**

---

## Features

- Generate up to **1,000,000 rows** of realistic fake data
- Export to **CSV** or **XLSX** format
- **12 column types** powered by [Faker.js](https://fakerjs.dev/)
- **Parallel generation** via multiple Web Workers
- **Reproducible data** with seed-based generation
- **Shareable links** — your entire configuration is encoded in the URL
- **Language support** — English and Brazilian Portuguese (auto-detected)
- **Live preview** — see 5 sample rows before generating
- **No server, no uploads** — all data stays in your browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Data generation | `@faker-js/faker` |
| XLSX export | `ExcelJS` |
| Styling | Tailwind CSS 4 |
| Icons | Material Icons |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

---

## How It Works

### High-Level Architecture

The app shell is delivered by Next.js, but all data generation and file building happens entirely in the browser. The main thread handles the UI while Web Workers handle the heavy computation.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Main Thread (UI)                                │ │
│  │                                                                         │ │
│  │   GeneratorForm   (columns, rows, format, locale, seed)                │ │
│  │   PreviewTable    shows first 5 rows                                   │ │
│  │   ProgressBar     visual feedback during generation                    │ │
│  └──────────────────────────────┬──────────────────────────────────────────┘ │
│                                 │                                            │
│                  ┌──────────────┴─────────────┐                             │
│                  │                             │                             │
│                  ▼                             ▼                             │
│     ┌────────────────────────┐   ┌──────────────────────────────────────┐   │
│     │   Preview Generation   │   │         Full Generation              │   │
│     │   (1 worker)           │   │         (WorkerPool)                 │   │
│     │                        │   │                                      │   │
│     │  generator.worker.ts   │   │  ┌──────────────────────────────┐   │   │
│     │  - generates 5 rows    │   │  │  chunkWorker #0  (rows 0–N)  │   │   │
│     │  - returns raw data    │   │  │  chunkWorker #1  (rows N–2N) │   │   │
│     │    (no file building)  │   │  │  ...up to 8 workers          │   │   │
│     └────────────────────────┘   │  │  chunkWorker #K  (rows K–M)  │   │   │
│                                  │  └──────────────┬───────────────┘   │   │
│                                  │                 │                    │   │
│                                  │                 ▼                    │   │
│                                  │  streamingBuilder.ts                 │   │
│                                  │  - assembles chunks in order         │   │
│                                  │  - returns final Blob                │   │
│                                  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Worker Flow — Full Generation

When the user clicks **Generate**, the `WorkerPool` class orchestrates multiple Web Workers to generate data in parallel:

```
page.tsx                workerPool.ts              chunkWorker.ts (#0..N)
    │                        │                              │
    │── new WorkerPool() ───►│                              │
    │── pool.generate() ────►│                              │
    │                        │── spawn worker #0 ──────────►│
    │                        │── spawn worker #1 ──────────►│
    │                        │── spawn worker #2 ──────────►│
    │                        │   (all spawned in parallel)  │
    │                        │                              │
    │                        │                   [workers generate rows]
    │                        │                              │
    │                        │◄── chunk-progress (every 5k rows)
    │◄── onProgress() ───────│◄── chunk-progress ───────────│
    │   (aggregated total)   │◄── chunk-progress ───────────│
    │                        │                              │
    │                        │◄── chunk-complete (data) ────│
    │                        │◄── chunk-complete (data) ────│
    │                        │◄── chunk-complete (data) ────│
    │                        │                              │
    │                        │── assemble chunks in order
    │                        │── build CSV / XLSX blob
    │                        │                              │
    │◄── { blob, filename } ─│
    │── trigger download ────►
```

#### Worker Allocation

The number of workers scales with row count and available CPU cores:

```
effectiveWorkers = min(
  hardwareConcurrency,    // capped at 8
  ceil(rowCount / 10000)  // minimum 10,000 rows per worker
)

rowsPerWorker = ceil(rowCount / effectiveWorkers)
```

Example distributions on an 8-core machine:

| Row Count | Workers | Rows per Worker |
|---|---|---|
| 1,000 | 1 | 1,000 |
| 10,000 | 1 | 10,000 |
| 50,000 | 5 | 10,000 |
| 100,000 | 8 | 12,500 |
| 500,000 | 8 | 62,500 |
| 1,000,000 | 8 | 125,000 |

Each worker receives a **unique seed** (`baseSeed + workerId`) so data doesn't repeat across workers while remaining fully reproducible.

---

### Worker Flow — Preview

Preview uses a single, lighter worker that returns raw data without building a file:

```
page.tsx                     generator.worker.ts
    │                                 │
    │── new Worker() ───────────────►│
    │── postMessage(config) ────────►│
    │                                │── initialize faker with seed
    │                                │── generate 5 rows
    │                                │── build headers array
    │                                │
    │◄── { type: "preview",          │
    │       headers, rows } ─────────│
    │                                │
    │── render PreviewTable
```

---

### File Assembly

After all workers complete, `streamingBuilder.ts` assembles the chunks in order:

```
CSV:
┌───────────────────────────────────────────┐
│  UTF-8 BOM (\uFEFF)                       │
│  header line  (firstName,email,phone\n)   │
│  chunk[0]     (worker 0 rows as CSV text) │
│  chunk[1]     (worker 1 rows as CSV text) │
│  chunk[2]     ...                         │
└───────────────────────────────────────────┘

XLSX:
┌───────────────────────────────────────────┐
│  ExcelJS Workbook                         │
│  └─ Sheet: "Data"                         │
│      ├─ Row 1: Headers (bold)             │
│      ├─ Rows from chunk[0]                │
│      ├─ Rows from chunk[1]                │
│      └─ Rows from chunk[2]...             │
└───────────────────────────────────────────┘
```

Workers generating CSV each produce pre-escaped text. Only worker 0 includes the header row. For XLSX, workers return raw `string[][]` arrays which ExcelJS writes into a single workbook.

---

### URL State Management

All configuration is stored in the URL, making every session shareable and reproducible:

```
https://fakesheets.app/?seed=1234567&cols=firstName,email,phone&rows=10000&format=csv&locale=en
                              │              │                     │         │          │
                              │              │                     │         │          └─ en | pt_BR
                              │              │                     │         └─ csv | xlsx
                              │              │                     └─ 1 to 1,000,000
                              │              └─ comma-separated column keys
                              └─ integer seed for reproducible data
```

The `useUrlState` hook manages SSR-safe hydration:

1. Server renders with static defaults (avoids hydration mismatch)
2. After mount, a `useEffect` parses URL params and updates state
3. On each state change, `history.replaceState` updates the URL silently (no navigation)
4. The **Copy Link** button copies the current URL to clipboard

---

### Available Columns

| Key | Label | Faker Method |
|---|---|---|
| `firstName` | First Name | `faker.person.firstName()` |
| `lastName` | Last Name | `faker.person.lastName()` |
| `fullName` | Full Name | `faker.person.fullName()` |
| `email` | Email | `faker.internet.email()` |
| `phone` | Phone | `faker.phone.number()` |
| `company` | Company | `faker.company.name()` |
| `jobTitle` | Job Title | `faker.person.jobTitle()` |
| `address` | Address | `faker.location.streetAddress()` |
| `city` | City | `faker.location.city()` |
| `country` | Country | `faker.location.country()` |
| `website` | Website | `faker.internet.url()` |
| `avatarUrl` | Avatar URL | `faker.image.avatar()` |

---

### Performance Targets

| Row Count | Format | Target |
|---|---|---|
| 1,000 | CSV / XLSX | < 1s |
| 100,000 | CSV / XLSX | < 5s |
| 500,000 | CSV | < 15s |
| 500,000 | XLSX | < 30s (memory-intensive) |
| 1,000,000 | CSV | < 30s |
| 1,000,000 | XLSX | Not recommended |

> For datasets over 500,000 rows, XLSX requires building the entire workbook in browser memory. The app shows a warning and recommends CSV for large exports.

---

## Project Structure

```
fakesheets/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Main page — generation orchestration
│   └── globals.css             # Tailwind + custom CSS variables
├── components/
│   ├── GeneratorForm.tsx       # Column picker, row count, format, locale
│   ├── PreviewTable.tsx        # 5-row preview display
│   └── ProgressBar.tsx         # Progress bar + cancel button
├── workers/
│   ├── generator.worker.ts     # Single worker for preview (5 rows)
│   └── chunkWorker.ts          # Parallel worker for full generation
├── lib/
│   ├── types.ts                # Shared TypeScript types
│   ├── columns.ts              # Column definitions (key, label, icon)
│   ├── formats.ts              # CSV/XLSX builder used by preview worker
│   ├── streamingBuilder.ts     # Chunk assembler for WorkerPool output
│   ├── workerPool.ts           # Multi-worker orchestration
│   └── urlState.ts             # URL param parsing and updating
└── hooks/
    └── useUrlState.ts          # React hook wrapping urlState.ts
```

---

## Running Locally

**Prerequisites:** Node.js 18+ and npm

```bash
# Clone the repository
git clone https://github.com/dougluz/fakesheets.git
cd fakesheets

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Commands

```bash
npm run build   # Production build
npm start       # Run production server (after build)
npm run lint    # Run ESLint
```

---

## Privacy

All data generation happens entirely in your browser. No data is ever sent to any server — not your column configurations, not the generated rows, nothing. The server only delivers the static app shell.

---

## License

MIT
