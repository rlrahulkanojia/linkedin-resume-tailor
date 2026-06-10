// sidepanel.js — UI controller for the LinkedIn Resume Tailor.
// Pure helpers live in lib/resume-core.js (ResumeCore) so they can be
// unit-tested under Node. This file is the DOM/Chrome-API glue.

const Core = window.ResumeCore;
if (!Core) {
  console.error("[resume-tailor] ResumeCore failed to load");
}

const DEFAULT_INSTRUCTIONS = `# Resume tailoring instructions

You take a candidate's **base resume** (LaTeX) and a **job description**, and
produce a tailored resume in LaTeX.

## Output rules
- Output **only** the complete LaTeX document. No preamble text, no commentary, no code fences.
- **Preserve the exact document structure**: keep the same \\documentclass, all \\usepackage
  declarations, color definitions, font settings, column types, titlesec formatting,
  hypersetup, and every other preamble element verbatim.
- **Preserve the exact LaTeX formatting**: keep tabularx layouts, minipage wrappers,
  itemize environments with their options, hfill alignments, color commands,
  textbf/textit nesting, and all spacing commands (\\\\[Xpt], \\hfill, \\vspace, etc.).
- Preserve every truthful fact from the base resume. Never invent employers, dates,
  titles, degrees, or numbers.
- Reorder, rephrase, and reweight \\item bullets so the most relevant experience for
  this job appears first.
- Use crisp, active-voice bullets: verb + scope + outcome.
- Mirror terminology from the job description when it genuinely matches the
  candidate's experience. Do not stuff keywords.

## Structure
Maintain the same \\section{} order as the base resume. Do not add or remove sections
unless doing so clearly strengthens the application.

## Length
The resume **must** fit on exactly one page when compiled. Trim, condense, or remove
lower-priority bullets to stay within one page. Never spill onto a second page.`;

const SAMPLE_BASE = `\\documentclass[a4paper,10pt]{article}

\\usepackage[scale=0.92, top=0.5in, bottom=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{titlesec}
\\usepackage[unicode, draft=false]{hyperref}
\\usepackage{parskip}

\\newcolumntype{C}{>{\\centering\\arraybackslash}X}
\\titleformat{\\section}{\\Large\\scshape\\raggedright}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{1pt}{1pt}{1pt}

\\hypersetup{colorlinks=true, urlcolor=blue}
\\pagestyle{empty}

\\begin{document}

\\begin{tabularx}{\\linewidth}{@{} C @{}}
\\Huge{Jane Doe} \\\\
\\\\
jane@example.com $|$ +1-555-123-4567 \\\\
\\href{https://github.com/janedoe}{github.com/janedoe} $|$
\\href{https://linkedin.com/in/janedoe}{linkedin.com/in/janedoe}
\\end{tabularx}

\\section{Skills}
\\textbf{Languages:} Python, Go, TypeScript, SQL \\\\[3pt]
\\textbf{Infrastructure:} AWS (ECS, Lambda, RDS, S3), Terraform, Docker, Kubernetes \\\\[3pt]
\\textbf{Data:} Postgres, Redis, Kafka, ClickHouse

\\section{Work Experience}
\\begin{tabularx}{\\linewidth}{ @{}l r@{} }
\\textbf{Acme Corp} \\hfill Aug 2022 - Present \\\\[4pt]
\\textbf{\\textit{Senior Software Engineer}} \\\\[5pt]
\\begin{minipage}[t]{\\linewidth}
    \\begin{itemize}[nosep,after=\\strut, leftmargin=2em, itemsep=1pt]
        \\item Migrated monolithic billing service to event-driven architecture; cut p99 latency \\textbf{62\\%}.
        \\item Designed a feature-flag platform used by \\textbf{40+} engineers.
        \\item Mentored 3 junior engineers through onboarding and code review.
    \\end{itemize}
\\end{minipage}
\\end{tabularx}

\\begin{tabularx}{\\linewidth}{ @{}l r@{} }
\\textbf{Globex Inc} \\hfill Jan 2019 - Jul 2022 \\\\[4pt]
\\textbf{\\textit{Software Engineer}} \\\\[5pt]
\\begin{minipage}[t]{\\linewidth}
    \\begin{itemize}[nosep,after=\\strut, leftmargin=2em, itemsep=1pt]
        \\item Built ingestion pipeline processing \\textbf{2B events/day} on Kafka + ClickHouse.
        \\item Reduced AWS spend \\textbf{28\\%} by right-sizing ECS tasks.
    \\end{itemize}
\\end{minipage}
\\end{tabularx}

\\section{Education}
\\begin{tabularx}{\\linewidth}{ @{}l r@{} }
\\textbf{University of Somewhere} \\hfill Aug 2015 - May 2019 \\\\
\\textit{B.S. Computer Science} \\hfill \\textbf{GPA: 3.8/4.0}
\\end{tabularx}

\\end{document}
`;

// -------- Storage helpers --------
const store = {
  get: (keys) => new Promise((r) => chrome.storage.local.get(keys, r)),
  set: (obj) => new Promise((r) => chrome.storage.local.set(obj, r))
};

// -------- Tab switching --------
document.querySelectorAll(".tabs button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document.getElementById("tab-" + b.dataset.tab).classList.add("active");
  });
});

// -------- View toggle (edit / render / latex / split) --------
const resumePane = document.getElementById("resume-pane");
document.querySelectorAll(".view-toggle button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".view-toggle button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    resumePane.classList.remove("view-edit", "view-render", "view-latex", "view-split");
    resumePane.classList.add("view-" + b.dataset.view);
    renderResume();
  });
});
resumePane.classList.add("view-edit");

// -------- Job pane --------
const statusEl = document.getElementById("status");
const jobCard = document.getElementById("job-card");
const jobTitleEl = document.getElementById("job-title");
const jobCompanyEl = document.getElementById("job-company");
const jobMetaEl = document.getElementById("job-meta");
const jobSourceEl = document.getElementById("job-source");
const jobDescEl = document.getElementById("job-desc");
const jdLenEl = document.getElementById("jd-len");
const externalWarnEl = document.getElementById("external-warn");
const externalLinkEl = document.getElementById("external-link");
const jdPasteWrap = document.getElementById("jd-paste-wrap");
const jdPasteEl = document.getElementById("jd-paste");
const btnUsePasted = document.getElementById("btn-use-pasted");
const btnClearPasted = document.getElementById("btn-clear-pasted");
const pasteStatus = document.getElementById("paste-status");
const btnGenerate = document.getElementById("btn-generate");
const btnRescan = document.getElementById("btn-rescan");
const genStatus = document.getElementById("gen-status");

let currentJob = null;
let pastedJd = "";

function effectiveDescription() {
  return Core.effectiveDescription(currentJob, pastedJd, 40);
}

function formatMeta(job) {
  const bits = [];
  if (job.location) bits.push(job.location);
  if (job.workplace) bits.push(job.workplace);
  if (job.employmentStatus) bits.push(job.employmentStatus);
  return bits.length ? " · " + bits.join(" · ") : "";
}

function renderState() {
  const job = currentJob;
  const desc = effectiveDescription();

  if (!job && !pastedJd) {
    statusEl.textContent = "Waiting for a LinkedIn job… or paste a JD below.";
    statusEl.className = "status muted";
    jobCard.classList.add("hidden");
    btnGenerate.disabled = true;
    return;
  }

  if (job) {
    jobCard.classList.remove("hidden");
    jobTitleEl.textContent = job.title || "(no title yet)";
    jobCompanyEl.textContent = job.company || "";
    jobMetaEl.textContent = formatMeta(job);
    jobSourceEl.textContent = job.source ? ("source: " + job.source) : "";

    jobDescEl.textContent = (job.description || "") || "(no description extracted)";
    jdLenEl.textContent = String((job.description || "").length);

    if (job.externalJob && (job.description || "").length < 200) {
      externalWarnEl.classList.remove("hidden");
      if (job.applyUrl) {
        externalLinkEl.href = job.applyUrl;
        externalLinkEl.style.display = "";
      } else {
        externalLinkEl.style.display = "none";
      }
      jdPasteWrap.setAttribute("open", "");
    } else {
      externalWarnEl.classList.add("hidden");
    }
  } else {
    jobCard.classList.add("hidden");
  }

  if (desc.length >= 200) {
    const src = pastedJd ? "pasted JD" : "Job detected";
    statusEl.textContent = `✓ ${src} (${desc.length} chars). Ready to Generate.`;
    statusEl.className = "status ok";
    btnGenerate.disabled = false;
  } else if (job && job.externalJob) {
    statusEl.textContent = "⚠ External job — paste the JD below to enable Generate.";
    statusEl.className = "status muted";
    btnGenerate.disabled = true;
  } else if (job && job.partial) {
    const reason = job.reason === "title-missing"
      ? "Couldn't find the job title yet."
      : "Found the title but the description hasn't loaded.";
    statusEl.textContent = "⏳ Partial — " + reason + " Try ↻ Rescan, or paste the JD below.";
    statusEl.className = "status muted";
    btnGenerate.disabled = true;
  } else if (!job && pastedJd) {
    statusEl.textContent = `⚠ Pasted JD too short (${pastedJd.length} chars). Need ≥ 200 to Generate.`;
    statusEl.className = "status muted";
    btnGenerate.disabled = true;
  } else {
    statusEl.textContent = `⚠ Description too short (${desc.length} chars). Paste manually below.`;
    statusEl.className = "status muted";
    btnGenerate.disabled = true;
  }
}

function showJob(job) {
  if (!currentJob || (job && job.jobId !== currentJob.jobId)) {
    pastedJd = "";
    if (jdPasteEl) jdPasteEl.value = "";
    if (pasteStatus) pasteStatus.textContent = "";
  }
  currentJob = job;
  renderState();
}

if (btnUsePasted) {
  btnUsePasted.addEventListener("click", () => {
    pastedJd = jdPasteEl.value || "";
    if (pastedJd.trim().length < 40) {
      pasteStatus.textContent = "Need at least 40 characters.";
      return;
    }
    pasteStatus.textContent = "Using pasted JD (" + pastedJd.length + " chars).";
    renderState();
  });
}

if (btnClearPasted) {
  btnClearPasted.addEventListener("click", () => {
    pastedJd = "";
    jdPasteEl.value = "";
    pasteStatus.textContent = "Cleared. Using auto-detected JD.";
    renderState();
  });
}

btnRescan.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "GET_CURRENT_JOB" }, (res) => {
    showJob(res?.payload || null);
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "JOB_UPDATE") showJob(msg.payload);
});

chrome.runtime.sendMessage({ type: "GET_CURRENT_JOB" }, (res) => {
  showJob(res?.payload || null);
});

// -------- Generate tailored resume --------
const btnCancel = document.getElementById("btn-cancel");
let activeAbort = null;

btnGenerate.addEventListener("click", async () => {
  const desc = effectiveDescription();
  if (desc.length < 200) {
    genStatus.textContent = "✗ Need at least 200 chars of JD.";
    genStatus.style.color = "var(--bad)";
    return;
  }
  const { baseResume = "", instructions, cfgEndpoint, cfgModel, cfgKey } = await store.get([
    "baseResume", "instructions", "cfgEndpoint", "cfgModel", "cfgKey"
  ]);
  if (!baseResume.trim()) {
    genStatus.textContent = "✗ No base resume set. Open the Base tab and add yours.";
    genStatus.style.color = "var(--bad)";
    return;
  }
  if (!cfgKey || !cfgEndpoint || !cfgModel) {
    genStatus.textContent = "✗ Settings missing (endpoint / model / API key).";
    genStatus.style.color = "var(--bad)";
    return;
  }

  btnGenerate.disabled = true;
  btnCancel.classList.remove("hidden");
  genStatus.style.color = "var(--muted)";
  genStatus.textContent = "Generating…";

  // Prepare editor for streaming tokens
  document.querySelector('.tabs button[data-tab="resume"]').click();
  const latexBtn = document.querySelector('.view-toggle button[data-view="latex"]');
  if (latexBtn) latexBtn.click();
  emptyMsg.classList.add("hidden");
  resumePane.classList.remove("hidden");
  editor.value = "";
  renderResume();

  const sys = (instructions || DEFAULT_INSTRUCTIONS).trim();
  const jobForPrompt = Object.assign({}, currentJob || {}, { description: desc });
  const userMsg = Core.buildUserPrompt(baseResume, jobForPrompt);

  try {
    const result = await callLLM({
      endpoint: cfgEndpoint, model: cfgModel, key: cfgKey,
      system: sys, user: userMsg,
      onToken: (chunk) => {
        editor.value += chunk;
        renderResume();
      }
    });
    // Final result: apply stripCodeFence to the accumulated text
    const final = Core.stripCodeFence(result);
    loadResumeIntoEditor(final);
    const j = currentJob || {};
    const jobMeta = {
      jobId: j.jobId || "manual",
      title: j.title || "Pasted JD",
      company: j.company || "",
      at: Date.now()
    };
    await store.set({ resumeMd: final, resumeJobMeta: jobMeta });
    await addToHistory(final, jobMeta);
    genStatus.textContent = "✓ Generated.";
    genStatus.style.color = "var(--good)";
  } catch (e) {
    if (e.name === "AbortError") {
      genStatus.textContent = "Generation cancelled.";
      genStatus.style.color = "var(--muted)";
    } else {
      console.error(e);
      genStatus.textContent = "✗ " + (e.message || "Generation failed");
      genStatus.style.color = "var(--bad)";
    }
  } finally {
    btnGenerate.disabled = false;
    btnCancel.classList.add("hidden");
    activeAbort = null;
  }
});

btnCancel.addEventListener("click", () => {
  if (activeAbort) activeAbort.abort();
});

async function callLLM({ endpoint, model, key, system, user, onToken }) {
  const controller = new AbortController();
  activeAbort = controller;
  const timeout = setTimeout(() => controller.abort(), 120000);

  const body = {
    model,
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.4
  };
  const headers = { "Content-Type": "application/json", "Authorization": "Bearer " + key };
  if (/openrouter\.ai/.test(endpoint)) {
    headers["HTTP-Referer"] = "https://linkedin-resume-tailor.local";
    headers["X-Title"] = "LinkedIn Resume Tailor";
  }

  const res = await fetch(endpoint, {
    method: "POST", headers, body: JSON.stringify(body), signal: controller.signal
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} — ${t.slice(0, 200)}`);
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();

  // Non-streaming fallback: if server doesn't stream, read as JSON
  if (!ct.includes("text/event-stream") && !ct.includes("text/plain")) {
    clearTimeout(timeout);
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");
    return content;
  }

  // SSE streaming
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep incomplete last line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      if (trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) {
          accumulated += delta;
          if (onToken) onToken(delta);
        }
      } catch (parseErr) {
        // Skip malformed SSE lines
      }
    }
  }

  clearTimeout(timeout);
  if (!accumulated) throw new Error("Empty response from model");
  return accumulated;
}

// -------- Resume editor + renderer --------
const editor = document.getElementById("resume-editor");
const rendered = document.getElementById("resume-rendered");
const latexPre = document.getElementById("resume-latex");
const emptyMsg = document.getElementById("resume-empty");

function loadResumeIntoEditor(md) {
  emptyMsg.classList.add("hidden");
  resumePane.classList.remove("hidden");
  editor.value = md;
  renderResume();
}

function highlightLatex(tex) {
  // Escape HTML first
  let s = tex.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Comments: % to end of line (but not \%)
  s = s.replace(/(^|[^\\])(%.*$)/gm, '$1<span class="tex-comment">$2</span>');
  // Environment names inside \begin{...} and \end{...}
  s = s.replace(/(\\(?:begin|end))\{([^}]*)\}/g,
    '<span class="tex-cmd">$1</span><span class="tex-brace">{</span><span class="tex-env">$2</span><span class="tex-brace">}</span>');
  // Commands: \word (not already inside a span)
  s = s.replace(/(\\[a-zA-Z@]+)/g, '<span class="tex-cmd">$1</span>');
  // Braces (remaining ones not already wrapped)
  s = s.replace(/([{}])/g, '<span class="tex-brace">$1</span>');
  return s;
}

let pdfRenderTimer;
let lastPdfUrl = null;

function renderResume() {
  const tex = editor.value || "";
  // LaTeX tab: syntax-highlighted LaTeX source
  latexPre.innerHTML = highlightLatex(tex);
  // Rendered tab: compile LaTeX to PDF and show inline (debounced)
  clearTimeout(pdfRenderTimer);
  if (!tex.trim()) {
    rendered.innerHTML = '<p class="muted" style="text-align:center;padding:24px;">No content to render.</p>';
    return;
  }
  pdfRenderTimer = setTimeout(() => compilePdfPreview(tex), 1500);
}

async function compilePdfPreview(tex) {
  // Show loading state
  rendered.innerHTML = '<p class="muted" style="text-align:center;padding:24px;">Compiling LaTeX…</p>';
  try {
    const blob = await compileLatexToPdf(tex);
    if (lastPdfUrl) URL.revokeObjectURL(lastPdfUrl);
    lastPdfUrl = URL.createObjectURL(blob);
    rendered.innerHTML = `<iframe src="${lastPdfUrl}" style="width:100%;height:100%;min-height:500px;border:none;border-radius:6px;"></iframe>`;
  } catch (e) {
    rendered.innerHTML = '<p style="color:var(--bad);text-align:center;padding:24px;">Compilation failed: '
      + (e.message || "unknown error").replace(/</g, "&lt;").slice(0, 200) + '</p>';
  }
}

let saveTimer;
editor.addEventListener("input", () => {
  renderResume();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set({ resumeMd: editor.value }), 300);
});

document.getElementById("btn-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(editor.value || "");
  flashBtn("btn-copy", "✓");
});

document.getElementById("btn-download-tex").addEventListener("click", () => {
  downloadAs(editor.value || "", "tex", "application/x-tex;charset=utf-8");
});

document.getElementById("btn-download-pdf").addEventListener("click", async () => {
  if (!editor.value.trim()) {
    flashBtn("btn-download-pdf", "no content");
    return;
  }
  flashBtn("btn-download-pdf", "Compiling…");
  try {
    const pdfBlob = await compileLatexToPdf(editor.value);
    const meta = currentJob || {};
    const fname = Core.buildFilename(meta.company, meta.title, "pdf");
    triggerDownload(pdfBlob, fname);
    flashBtn("btn-download-pdf", "✓ PDF");
  } catch (e) {
    console.error("LaTeX compilation failed:", e);
    flashBtn("btn-download-pdf", "✗ Failed");
    alert("LaTeX compilation failed: " + (e.message || "unknown error"));
  }
});

async function compileLatexToPdf(latex) {
  const body = {
    compiler: "xelatex",
    resources: [
      { main: true, content: latex }
    ]
  };
  const res = await fetch("https://latex.ytotech.com/builds/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Compilation error (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/pdf")) {
    const text = await res.text().catch(() => "");
    throw new Error("Compiler returned non-PDF response: " + text.slice(0, 200));
  }
  return await res.blob();
}

function triggerDownload(blob, fname) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadAs(content, ext, mime) {
  const meta = currentJob || {};
  const fname = Core.buildFilename(meta.company, meta.title, ext);
  const blob = new Blob([content], { type: mime });
  triggerDownload(blob, fname);
}

function flashBtn(id, text) {
  const b = document.getElementById(id);
  const orig = b.textContent;
  b.textContent = text;
  setTimeout(() => (b.textContent = orig), 1200);
}

// -------- Base resume editor --------
const baseEditor = document.getElementById("base-editor");
const baseStatus = document.getElementById("base-status");

document.getElementById("btn-save-base").addEventListener("click", async () => {
  await store.set({ baseResume: baseEditor.value });
  baseStatus.textContent = "✓ Saved";
  baseStatus.style.color = "var(--good)";
  setTimeout(() => (baseStatus.textContent = ""), 1800);
});

document.getElementById("btn-load-sample-base").addEventListener("click", () => {
  baseEditor.value = SAMPLE_BASE;
});

// -------- Instructions editor --------
const instructionsEditor = document.getElementById("instructions-editor");
const instructionsStatus = document.getElementById("instructions-status");

document.getElementById("btn-save-instructions").addEventListener("click", async () => {
  await store.set({ instructions: instructionsEditor.value });
  instructionsStatus.textContent = "✓ Saved";
  instructionsStatus.style.color = "var(--good)";
  setTimeout(() => (instructionsStatus.textContent = ""), 1800);
});

document.getElementById("btn-reset-instructions").addEventListener("click", () => {
  instructionsEditor.value = DEFAULT_INSTRUCTIONS;
});

// -------- Settings --------
const cfgPreset = document.getElementById("cfg-preset");
const cfgEndpoint = document.getElementById("cfg-endpoint");
const cfgModel = document.getElementById("cfg-model");
const cfgKey = document.getElementById("cfg-key");
const cfgStatus = document.getElementById("cfg-status");

const PRESETS = {
  blackbox:  { endpoint: "https://api.blackbox.ai/v1/chat/completions",   model: "blackboxai/anthropic/claude-sonnet-4.6" },
  openai:    { endpoint: "https://api.openai.com/v1/chat/completions",    model: "gpt-4o-mini" },
  openrouter:{ endpoint: "https://openrouter.ai/api/v1/chat/completions", model: "openai/gpt-4o-mini" },
  custom:    { endpoint: "",                                              model: "" }
};

cfgPreset.addEventListener("change", () => {
  const p = PRESETS[cfgPreset.value];
  if (p.endpoint) cfgEndpoint.value = p.endpoint;
  if (p.model) cfgModel.value = p.model;
});

document.getElementById("btn-save-cfg").addEventListener("click", async () => {
  const keyVal = cfgKey.value.trim();
  await store.set({
    cfgPreset: cfgPreset.value,
    cfgEndpoint: cfgEndpoint.value.trim(),
    cfgModel: cfgModel.value.trim(),
    cfgKey: keyVal
  });
  if (keyVal && keyVal.length < 8) {
    cfgStatus.textContent = "⚠ Saved, but API key looks too short.";
    cfgStatus.style.color = "var(--warn)";
  } else if (!keyVal) {
    cfgStatus.textContent = "⚠ Saved, but API key is empty.";
    cfgStatus.style.color = "var(--warn)";
  } else {
    cfgStatus.textContent = "✓ Saved";
    cfgStatus.style.color = "var(--good)";
  }
  setTimeout(() => (cfgStatus.textContent = ""), 2500);
});

document.getElementById("btn-test-cfg").addEventListener("click", async () => {
  cfgStatus.style.color = "var(--muted)";
  cfgStatus.textContent = "Testing…";
  try {
    const out = await callLLM({
      endpoint: cfgEndpoint.value.trim(),
      model: cfgModel.value.trim(),
      key: cfgKey.value.trim(),
      system: "You are a connection test.",
      user: "Reply with exactly: pong"
    });
    cfgStatus.style.color = "var(--good)";
    cfgStatus.textContent = "✓ " + out.slice(0, 40);
  } catch (e) {
    cfgStatus.style.color = "var(--bad)";
    cfgStatus.textContent = "✗ " + (e.message || "failed").slice(0, 120);
  }
});

// -------- Generation history --------
const HISTORY_MAX = 10;
const historySelect = document.getElementById("resume-history");

async function addToHistory(latex, jobMeta) {
  const { resumeHistory = [] } = await store.get(["resumeHistory"]);
  resumeHistory.unshift({ latex, jobMeta });
  if (resumeHistory.length > HISTORY_MAX) resumeHistory.length = HISTORY_MAX;
  await store.set({ resumeHistory });
  renderHistoryDropdown(resumeHistory);
}

function renderHistoryDropdown(history) {
  historySelect.innerHTML = '<option value="">History ▾</option>';
  (history || []).forEach((entry, i) => {
    const m = entry.jobMeta || {};
    const date = m.at ? new Date(m.at).toLocaleDateString() : "";
    const label = [m.company, m.title, date].filter(Boolean).join(" · ") || ("Entry " + (i + 1));
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = label.length > 50 ? label.slice(0, 47) + "…" : label;
    historySelect.appendChild(opt);
  });
}

historySelect.addEventListener("change", async () => {
  const idx = parseInt(historySelect.value, 10);
  if (isNaN(idx)) return;
  const { resumeHistory = [] } = await store.get(["resumeHistory"]);
  const entry = resumeHistory[idx];
  if (entry && entry.latex) {
    loadResumeIntoEditor(entry.latex);
    await store.set({ resumeMd: entry.latex, resumeJobMeta: entry.jobMeta || {} });
  }
  historySelect.value = "";
});

// -------- Bootstrap from storage --------
(async function init() {
  const s = await store.get([
    "baseResume", "instructions", "resumeMd", "resumeHistory",
    "cfgPreset", "cfgEndpoint", "cfgModel", "cfgKey"
  ]);

  baseEditor.value = s.baseResume || "";
  instructionsEditor.value = s.instructions || DEFAULT_INSTRUCTIONS;

  if (s.resumeMd) {
    loadResumeIntoEditor(s.resumeMd);
  }

  renderHistoryDropdown(s.resumeHistory || []);

  cfgPreset.value = s.cfgPreset || "blackbox";
  const p = PRESETS[cfgPreset.value];
  cfgEndpoint.value = s.cfgEndpoint || p.endpoint;
  cfgModel.value = s.cfgModel || p.model;
  cfgKey.value = s.cfgKey || "";
})();
