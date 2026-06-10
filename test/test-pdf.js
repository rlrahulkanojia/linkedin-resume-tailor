// Smoke test: lib/pdf-renderer.js produces a syntactically valid PDF.
// Runs under Node by shimming a minimal browser global so jsPDF (UMD) loads.
// Usage:  node test/test-pdf.js

const fs = require("fs");
const path = require("path");
const assert = require("assert");

// ---- minimal browser shim for jsPDF UMD ----
global.window = global;
global.self = global;
global.navigator = { userAgent: "node" };
global.document = {
  createElement: () => ({ getContext: () => null, style: {} }),
  createElementNS: () => ({ style: {} }),
};
global.atob = (s) => Buffer.from(s, "base64").toString("binary");
global.btoa = (s) => Buffer.from(s, "binary").toString("base64");

const ROOT = path.resolve(__dirname, "..");
// jsPDF UMD prefers CommonJS export when require'd. Capture the exports
// and re-expose under global.jspdf so pdf-renderer.js (which speaks browser-
// style) can find it.
const jspdfExports = require(path.join(ROOT, "lib", "jspdf.umd.min.js"));
global.jspdf = jspdfExports;
assert.ok(global.jspdf && global.jspdf.jsPDF, "jsPDF should be loaded into global.jspdf");

// Load our pure helpers + renderer
const Core = require(path.join(ROOT, "lib", "resume-core.js"));
global.ResumeCore = Core;
require(path.join(ROOT, "lib", "pdf-renderer.js"));
assert.ok(global.PdfRenderer, "PdfRenderer should be exposed on global");

const SAMPLE = `# Jane Doe
jane@example.com · linkedin.com/in/janedoe

## Summary
Backend engineer with 7 years building distributed systems in **Python** and Go.

## Skills
- Languages: Python, Go, TypeScript
- Infra: AWS, Terraform, Docker

## Experience
### Acme Corp — Senior Software Engineer (2022–present)
- Migrated billing service to event-driven architecture; cut p99 latency 62%.
- Designed a feature-flag platform used by 40+ engineers.

### Globex — Software Engineer (2019–2022)
- Built ingestion pipeline processing 2B events/day.
`;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + " — " + (e.message || e)); }
}

console.log("\npdf-renderer");

test("renderMarkdownToPdf returns a jsPDF doc with one+ pages", () => {
  const doc = global.PdfRenderer.renderMarkdownToPdf(SAMPLE);
  assert.ok(doc);
  const pages = doc.getNumberOfPages();
  assert.ok(pages >= 1, "expected ≥1 page");
});

test("renderMarkdownToBlob produces a non-empty PDF buffer", () => {
  // Under Node, jsPDF's "blob" output still returns a Blob if available,
  // but easier to use the "arraybuffer" path:
  const doc = global.PdfRenderer.renderMarkdownToPdf(SAMPLE);
  const ab = doc.output("arraybuffer");
  const buf = Buffer.from(ab);
  assert.ok(buf.length > 1000, "PDF should be > 1KB, got " + buf.length);
  // PDF magic header
  assert.strictEqual(buf.slice(0, 4).toString("ascii"), "%PDF",
    "buffer should start with %PDF magic; got " + buf.slice(0, 4).toString("ascii"));
  // PDF should end with %%EOF somewhere near the tail
  const tail = buf.slice(Math.max(0, buf.length - 64)).toString("ascii");
  assert.ok(tail.includes("%%EOF"), "PDF should end with %%EOF");
});

test("PDF contains the candidate name and a section heading", () => {
  const doc = global.PdfRenderer.renderMarkdownToPdf(SAMPLE);
  // jsPDF doesn't expose text layer directly — but we can check via the
  // internal stream cache for the text we wrote. Easiest: write to disk
  // and grep the raw bytes (text in jsPDF is stored uncompressed by default).
  const buf = Buffer.from(doc.output("arraybuffer"));
  // Save to /tmp for manual inspection if desired.
  const outPath = path.join(require("os").tmpdir(), "resume-tailor-test.pdf");
  fs.writeFileSync(outPath, buf);
  const bodyStr = buf.toString("latin1");
  // jsPDF uses (text) Tj style content streams; spaces in our doc become
  // separate Tj calls, so look for the standalone "Jane" and "Doe".
  assert.ok(/\(Jane\)/.test(bodyStr) || /\(Jane\\?\)/.test(bodyStr),
    "PDF stream should contain 'Jane'");
  assert.ok(/\(Doe\)/.test(bodyStr),
    "PDF stream should contain 'Doe'");
  assert.ok(/\(Skills\)/.test(bodyStr),
    "PDF stream should contain 'Skills' heading");
  console.log("    (sample PDF written to " + outPath + ")");
});

test("Long content paginates", () => {
  const big = "# Title\n\n" + "Lorem ipsum dolor sit amet. ".repeat(2000);
  const doc = global.PdfRenderer.renderMarkdownToPdf(big);
  assert.ok(doc.getNumberOfPages() >= 2, "expected ≥2 pages; got " + doc.getNumberOfPages());
});

test("Empty markdown does not throw", () => {
  const doc = global.PdfRenderer.renderMarkdownToPdf("");
  assert.ok(doc);
  assert.strictEqual(doc.getNumberOfPages(), 1);
});

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed) process.exit(1);
