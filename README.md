# LinkedIn Resume Tailor

A Chrome MV3 extension that detects an open LinkedIn job, reads the job
description, and tailors your base resume to it with your own LLM.

- **Detects any LinkedIn job** — inline, "promoted/external", company-website-apply.
- **Reads the full JD** via LinkedIn's own voyager API (the same one the LinkedIn
  UI uses), with a DOM-based fallback for unauthenticated views.
- **BYO LLM** — OpenAI-compatible Chat Completions endpoint. Defaults to Blackbox.
- **Editable resume** — markdown editor with three live previews:
  - **Rendered** (HTML, looks like a polished resume)
  - **LaTeX** (compilable `.tex` source with proper preamble)
  - **Split** (markdown + rendered side by side)
- **Editable instructions** — rewrite how the model tailors. Persisted locally.
- **Editable base resume** — single source of truth, persisted locally.
- **Exports** — `.md`, `.tex`, **true PDF download** (no print dialog), and a Print fallback.

Nothing leaves your machine except the request to the LLM you configured.
Your API key lives in `chrome.storage.local`. No analytics, no backend.

---

## Install

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on.
3. Click **Load unpacked** and pick this folder.
4. Pin the toolbar icon. Open the **Settings** tab in the side panel and paste
   your LLM API key (Blackbox is preselected).

---

## How it works

```
LinkedIn tab
  └── content.js
        ├── PRIMARY  voyager API   GET /voyager/api/jobs/jobPostings/<id>
        │   └── returns title, company, location, workplace, full description
        ├── FALLBACK 1   "About the job" h2 anchor + parent container
        └── FALLBACK 2   heuristic largest plausible text block
       publishes JOB_DETECTED → background SW

background.js
  caches latest job per tab, forwards to side panel

sidepanel.html / sidepanel.js
  shows the job, lets you Generate
  ↓
  POST <endpoint>/v1/chat/completions   (your key, your model)
  ↓
  resume markdown lands in the editor
  ↓
  live preview as HTML and as LaTeX
```

The voyager call uses the same `JSESSIONID`/`csrf-token` your browser already
has for linkedin.com. The extension's host permissions are scoped to
`*://*.linkedin.com/*` only.

---

## Compile the LaTeX to PDF

The LaTeX tab shows a complete, compilable document. Click **`.tex`** to
download it, then:

```
./scripts/compile-tex.sh ~/Downloads/resume_OpenAI_Senior_Engineer.tex
```

`scripts/compile-tex.sh` uses whichever of `pdflatex` or `xelatex` is on your
PATH and opens the resulting PDF.

Install LaTeX once:

| OS                | Command                                                           |
|-------------------|-------------------------------------------------------------------|
| Debian / Ubuntu   | `sudo apt install texlive-latex-recommended texlive-fonts-recommended` |
| macOS             | `brew install --cask basictex && sudo tlmgr update --self`        |
| Windows           | https://miktex.org/download                                       |

For a no-install PDF, the side panel's **PDF** button generates a real,
searchable PDF directly (via jsPDF) — no print dialog needed. The PDF
preserves headings, bullets, bold/italic, and links. The separate
**Print** button is a fallback that opens the browser's print dialog
on the rendered HTML if you want browser-style typography instead.

---

## Settings

| Field      | Default                                                      |
|------------|--------------------------------------------------------------|
| Preset     | Blackbox                                                     |
| Endpoint   | `https://api.blackbox.ai/v1/chat/completions`                |
| Model      | `blackboxai/anthropic/claude-sonnet-4.6`                     |
| API key    | (yours; stored in `chrome.storage.local` on this device)     |

Other presets: OpenAI, OpenRouter, and Custom (any OpenAI-compatible endpoint).
The **Test connection** button sends a one-token round-trip to confirm the
endpoint + key + model work before you waste tokens on a real generation.

---

## Verified scenarios

End-to-end smoke runs (see `/tmp/e2e_v2.py`) across the following LinkedIn
job types, JD extracted via voyager + tailored resume generated via Blackbox:

| Company    | Job ID       | JD chars | Resume chars |
|------------|--------------|----------|--------------|
| Microsoft  | 4341295049   | 3015     | (gen ok)     |
| OpenAI     | 4417181025   | 5504     | 1371         |
| Apple      | 4421796594   | 4036     | 1567         |
| Flipkart   | 4422836395   | 1777     | 1437         |
| Google     | 4417180880   | 3779     | 1696         |
| Airbnb     | 4387403645   | 5624     | (extract ok) |
| Uber       | 4381653520   | 2514     | (extract ok) |

Both "Easy Apply" and "Apply on company website" listings work — voyager
returns the JD even when LinkedIn's DOM hides it for the external-apply UI.

---

## Files

```
manifest.json            MV3 manifest, linkedin-only host permissions
background.js            Service worker, per-tab job cache, message router
content.js               Voyager-first JD extractor with DOM fallbacks
sidepanel.html           UI (tabs: Job, Resume, Base, Instructions, Settings)
sidepanel.css            Dark + light themes, print styles
sidepanel.js             UI controller, LLM call wiring
lib/resume-core.js       Pure helpers (testable in Node): markdown→LaTeX, prompt
                         builder, code-fence stripper, filename sanitizer, etc.
lib/pdf-renderer.js      Markdown → real PDF via jsPDF text APIs
lib/jspdf.umd.min.js     Vendored jsPDF (v2.5.1)
lib/marked.min.js        Vendored markdown→HTML renderer
scripts/compile-tex.sh   Convenience .tex → .pdf runner
test/test-core.js        Unit tests for the pure helpers (44 cases)
test/test-pdf.js         Smoke test that renders a real PDF & inspects bytes
test/run.js              Runs all test files
```

## Tests

```
npm test           # runs all suites
npm run test:core  # pure helpers only — instant, no deps
npm run test:pdf   # exercises the PDF pipeline end-to-end under Node
```

49 tests cover code-fence stripping, JD selection (auto vs pasted), filename
sanitization, prompt construction, LaTeX escaping/conversion, markdown
parsing (blocks + inline runs), and PDF generation (magic bytes, page count,
text content, pagination, empty input).

---

## Troubleshooting

| Symptom                                          | Fix                                                                             |
|--------------------------------------------------|---------------------------------------------------------------------------------|
| "Waiting for a LinkedIn job"                     | The active tab isn't a `/jobs/view/<id>/` page. Open a job and click **↻**.    |
| "External job — paste the JD"                    | Rare. Voyager returned nothing; paste the JD into the override box.            |
| "✗ HTTP 401" on generate                         | Settings tab: API key is wrong or expired. Use **Test connection** to verify.  |
| Resume too long / too short                      | Instructions tab: edit the length rule and click Save.                         |
| Bullet placement is off in LaTeX                 | The markdown→LaTeX converter handles `-`, `*`, `+`, and ordered lists; check that the LLM used standard markdown. |

For debugging, open the LinkedIn tab's console and run `await __rtDebug()` to
see what the content script extracted.
