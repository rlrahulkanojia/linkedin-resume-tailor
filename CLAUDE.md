# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Chrome MV3 extension that detects LinkedIn job postings, extracts the full job description, and uses a user-configured LLM (BYO key, OpenAI-compatible endpoint) to tailor a base resume to the job. Everything runs locally except the LLM API call.

## Commands

```bash
npm test           # all suites (49 tests)
npm run test:core  # pure helpers only — instant, no deps
npm run test:pdf   # PDF pipeline smoke test (needs jsPDF shim)
```

Tests are plain Node + `assert` — no framework. Each test file is self-contained and exits 1 on failure.

To compile a downloaded `.tex` file to PDF:
```bash
./scripts/compile-tex.sh ~/Downloads/resume_Company_Title.tex
```

To load the extension: `chrome://extensions` → Developer mode → Load unpacked → select this folder.

## Architecture

### Message flow

```
content.js (LinkedIn tab)
  → extracts JD via voyager API (primary) or DOM fallback
  → sends JOB_DETECTED to background.js

background.js (service worker)
  → caches latest job per tab
  → forwards JOB_UPDATE to side panel

sidepanel.js (UI controller)
  → shows job, handles Generate button
  → calls LLM endpoint (OpenAI-compatible chat/completions)
  → renders result as markdown, HTML, LaTeX, and PDF
```

### Key separation: pure logic vs. browser glue

**`lib/resume-core.js`** — All testable pure functions. Uses UMD pattern: `window.ResumeCore` in browser, `module.exports` in Node. Contains:
- `stripCodeFence` — removes LLM code fence wrappers
- `effectiveDescription` — resolves pasted vs. auto-detected JD
- `buildUserPrompt` — assembles the LLM prompt from base resume + job metadata
- `markdownToLatex` / `escapeLatex` / `inlineMdToLatex` — full markdown-to-LaTeX converter
- `parseMarkdownBlocks` / `parseInlineRuns` — markdown parser used by PDF renderer
- `buildFilename` / `safeFilenamePart` — filename sanitization

**`lib/pdf-renderer.js`** — Markdown-to-PDF via jsPDF text APIs. Depends on `ResumeCore` for parsing and `jspdf.umd.min.js` (vendored). Browser-only globals, but test-pdf.js shims them for Node.

**`sidepanel.js`** — DOM/Chrome-API glue. Not tested directly; delegates all logic to `ResumeCore`.

### JD extraction strategy (content.js)

Three-tier fallback:
1. **Voyager API** — LinkedIn's internal REST API (`/voyager/api/jobs/jobPostings/<id>`), tries multiple `decorationId` versions. Uses the browser's existing `JSESSIONID` cookie for auth.
2. **DOM: "About the job" h2** — walks up from heading to find description container.
3. **DOM: heuristic** — largest visible text block matching size/content heuristics.

### Storage

All user data in `chrome.storage.local`: base resume, instructions, tailored resume, LLM settings (endpoint, model, API key). Nothing leaves the machine except the LLM request.

### Vendored libraries

`lib/jspdf.umd.min.js` (jsPDF v2.5.1) and `lib/marked.min.js` are vendored — no npm install, no build step.

## Testing patterns

- Tests import `lib/resume-core.js` directly via `require()` (UMD pattern enables this).
- PDF tests shim browser globals (`window`, `document`, `navigator`, `atob/btoa`) so jsPDF UMD loads in Node.
- Test runner (`test/run.js`) discovers `test/test-*.js` files and runs them as child processes.
- No test framework — each file uses `assert` and manages its own pass/fail counting.

## Style conventions

- Plain JavaScript (no TypeScript, no bundler, no transpilation).
- IIFE wrapping for content script and pdf-renderer (no module leakage).
- UMD pattern for resume-core (dual browser/Node).
- `const`/`let`, template literals, async/await, arrow functions throughout.
- Console logging uses `[resume-tailor]` tag prefix.
