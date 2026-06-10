// resume-core.js — Pure, framework-free helpers for the LinkedIn Resume Tailor.
// Loaded as a plain script in the side panel; also `require()`-able from Node
// so the test suite can exercise these without a browser.
//
// Exposes: window.ResumeCore = { ... } in the browser,
//          module.exports = { ... } in Node.

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ResumeCore = api;
})(typeof self !== "undefined" ? self : this, function () {

  // -------- Code-fence stripper ---------------------------------------------
  // LLMs sometimes wrap their output in ```markdown … ``` even when told not to.
  function stripCodeFence(s) {
    if (typeof s !== "string") return "";
    const trimmed = s.trim();
    const m = trimmed.match(/^```(?:markdown|md|latex|tex)?\s*\n([\s\S]*?)\n```\s*$/);
    return m ? m[1] : trimmed;
  }

  // -------- Effective JD --------------------------------------------------
  // The user can paste a JD that overrides whatever LinkedIn returned.
  // A pasted JD wins only if it's long enough to be plausible.
  function effectiveDescription(currentJob, pastedJd, minLen) {
    const min = typeof minLen === "number" ? minLen : 40;
    if (pastedJd && pastedJd.trim().length >= min) return pastedJd.trim();
    return currentJob ? (currentJob.description || "") : "";
  }

  // -------- Filename sanitizer ----------------------------------------------
  function safeFilenamePart(s) {
    return (s || "resume").replace(/[^a-z0-9._-]+/gi, "_").slice(0, 60);
  }

  function buildFilename(company, title, ext) {
    return `resume_${safeFilenamePart(company)}_${safeFilenamePart(title)}.${ext}`;
  }

  // -------- Prompt builder --------------------------------------------------
  function buildUserPrompt(base, job) {
    const meta = [];
    if (job.company) meta.push("Company: " + job.company);
    if (job.title) meta.push("Title: " + job.title);
    if (job.location) meta.push("Location: " + job.location);
    if (job.workplace) meta.push("Workplace: " + job.workplace);
    if (job.employmentStatus) meta.push("Employment: " + job.employmentStatus);
    if (job.url) meta.push("URL: " + job.url);
    return `# BASE RESUME (LaTeX — source of truth, do not invent facts)

${base}

---

# JOB DESCRIPTION
${meta.join("\n")}

${job.description || ""}

---

# TASK
Produce a tailored resume in LaTeX, preserving the exact document structure, preamble, and formatting of the base resume. Output the LaTeX document only.`;
  }

  // -------- Markdown → LaTeX -------------------------------------------------
  function escapeLatex(s) {
    // Single-pass tokenizer so that the macro replacements (e.g. \textbackslash{})
    // are not re-processed by later passes.
    const SUBS = {
      "\\": "\\textbackslash{}",
      "&":  "\\&",
      "%":  "\\%",
      "$":  "\\$",
      "#":  "\\#",
      "_":  "\\_",
      "{":  "\\{",
      "}":  "\\}",
      "~":  "\\textasciitilde{}",
      "^":  "\\textasciicircum{}",
      "<":  "\\textless{}",
      ">":  "\\textgreater{}",
    };
    let out = "";
    for (const ch of s) out += (SUBS.hasOwnProperty(ch) ? SUBS[ch] : ch);
    return out;
  }

  function inlineMdToLatex(text) {
    const parts = [];
    let i = 0;
    while (i < text.length) {
      // inline code `...`
      if (text[i] === "`") {
        const end = text.indexOf("`", i + 1);
        if (end > i) {
          parts.push({ type: "code", val: text.slice(i + 1, end) });
          i = end + 1; continue;
        }
      }
      // bold **...** or __...__
      if (text.slice(i, i + 2) === "**" || text.slice(i, i + 2) === "__") {
        const marker = text.slice(i, i + 2);
        const end = text.indexOf(marker, i + 2);
        if (end > i + 2) {
          parts.push({ type: "bold", val: text.slice(i + 2, end) });
          i = end + 2; continue;
        }
      }
      // italic *...* or _..._  (single marker, not part of a **)
      if ((text[i] === "*" || text[i] === "_") &&
          text[i + 1] !== text[i] && (i === 0 || text[i - 1] !== text[i])) {
        const marker = text[i];
        const end = text.indexOf(marker, i + 1);
        if (end > i + 1 && text[end + 1] !== marker) {
          parts.push({ type: "italic", val: text.slice(i + 1, end) });
          i = end + 1; continue;
        }
      }
      // link [text](url)
      const linkMatch = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push({ type: "link", text: linkMatch[1], url: linkMatch[2] });
        i += linkMatch[0].length; continue;
      }
      // plain run
      let j = i;
      while (j < text.length && text[j] !== "`" && text[j] !== "*" && text[j] !== "_" && text[j] !== "[") j++;
      if (j === i) j++;
      parts.push({ type: "text", val: text.slice(i, j) });
      i = j;
    }
    return parts.map(p => {
      if (p.type === "text") return escapeLatex(p.val);
      if (p.type === "code") return "\\texttt{" + escapeLatex(p.val) + "}";
      if (p.type === "bold") return "\\textbf{" + inlineMdToLatex(p.val) + "}";
      if (p.type === "italic") return "\\textit{" + inlineMdToLatex(p.val) + "}";
      if (p.type === "link") return "\\href{" + p.url.replace(/[\\#%&_{}~^]/g, c => "\\" + c) + "}{" + escapeLatex(p.text) + "}";
      return "";
    }).join("");
  }

  function markdownToLatex(md) {
    const lines = (md || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    out.push("\\documentclass[11pt,a4paper]{article}");
    out.push("\\usepackage[margin=0.75in]{geometry}");
    out.push("\\usepackage{enumitem}");
    out.push("\\usepackage{hyperref}");
    out.push("\\usepackage[T1]{fontenc}");
    out.push("\\usepackage[utf8]{inputenc}");
    out.push("\\usepackage{parskip}");
    out.push("\\setlist[itemize]{leftmargin=*,itemsep=2pt,topsep=2pt}");
    out.push("\\pagestyle{empty}");
    out.push("\\begin{document}");
    out.push("");

    let inList = false;
    let firstHeading = true;
    function closeList() {
      if (inList) { out.push("\\end{itemize}"); inList = false; }
    }

    for (let raw of lines) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) { closeList(); out.push(""); continue; }
      const h1 = line.match(/^#\s+(.*)$/);
      const h2 = line.match(/^##\s+(.*)$/);
      const h3 = line.match(/^###\s+(.*)$/);
      const h4 = line.match(/^####\s+(.*)$/);
      if (h1) {
        closeList();
        if (firstHeading) {
          out.push("\\begin{center}{\\LARGE\\textbf{" + inlineMdToLatex(h1[1]) + "}}\\end{center}");
          firstHeading = false;
        } else {
          out.push("\\section*{" + inlineMdToLatex(h1[1]) + "}");
        }
        continue;
      }
      if (h2) {
        closeList();
        out.push("\\section*{" + inlineMdToLatex(h2[1]) + "}");
        out.push("\\vspace{-0.4em}\\hrule\\vspace{0.4em}");
        firstHeading = false;
        continue;
      }
      if (h3) {
        closeList();
        out.push("\\subsection*{" + inlineMdToLatex(h3[1]) + "}");
        firstHeading = false;
        continue;
      }
      if (h4) {
        closeList();
        out.push("\\subsubsection*{" + inlineMdToLatex(h4[1]) + "}");
        continue;
      }
      if (/^(\*\s*){3,}\s*$/.test(line) || /^(-\s*){3,}\s*$/.test(line) || /^(_\s*){3,}\s*$/.test(line)) {
        closeList();
        out.push("\\hrulefill");
        continue;
      }
      const li = line.match(/^[-*+]\s+(.*)$/) || line.match(/^\d+\.\s+(.*)$/);
      if (li) {
        if (!inList) { out.push("\\begin{itemize}"); inList = true; }
        out.push("  \\item " + inlineMdToLatex(li[1]));
        continue;
      }
      closeList();
      out.push(inlineMdToLatex(line));
    }
    closeList();
    out.push("");
    out.push("\\end{document}");
    return out.join("\n");
  }

  // -------- Markdown → structured blocks (for PDF rendering) ----------------
  // Returns a flat array of blocks: { type, text, level?, items? }
  // Inline marks within text are flattened to plain text — the PDF renderer
  // handles bold/italic per-run via parseInlineRuns() below.
  function parseMarkdownBlocks(md) {
    const lines = (md || "").replace(/\r\n?/g, "\n").split("\n");
    const blocks = [];
    let listBuf = null;
    let listOrdered = false;
    let paraBuf = [];

    function flushList() {
      if (listBuf) {
        blocks.push({ type: "list", ordered: listOrdered, items: listBuf });
        listBuf = null;
      }
    }
    function flushPara() {
      if (paraBuf.length) {
        blocks.push({ type: "p", text: paraBuf.join(" ") });
        paraBuf = [];
      }
    }
    function flushAll() { flushList(); flushPara(); }

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) { flushAll(); continue; }

      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushAll();
        blocks.push({ type: "h", level: h[1].length, text: h[2] });
        continue;
      }
      if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
        flushAll();
        blocks.push({ type: "hr" });
        continue;
      }
      const ul = line.match(/^[-*+]\s+(.*)$/);
      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ul || ol) {
        flushPara();
        const ordered = !!ol;
        if (listBuf && listOrdered !== ordered) flushList();
        if (!listBuf) { listBuf = []; listOrdered = ordered; }
        listBuf.push((ul || ol)[1]);
        continue;
      }
      flushList();
      paraBuf.push(line);
    }
    flushAll();
    return blocks;
  }

  // Inline parser → array of { text, bold, italic, code, url? } runs.
  // Used by the PDF renderer to emit per-run font changes.
  function parseInlineRuns(text) {
    const runs = [];
    let i = 0;
    let buf = "";
    const flush = () => { if (buf) { runs.push({ text: buf }); buf = ""; } };
    while (i < text.length) {
      if (text[i] === "`") {
        const end = text.indexOf("`", i + 1);
        if (end > i) { flush(); runs.push({ text: text.slice(i + 1, end), code: true }); i = end + 1; continue; }
      }
      if (text.slice(i, i + 2) === "**" || text.slice(i, i + 2) === "__") {
        const marker = text.slice(i, i + 2);
        const end = text.indexOf(marker, i + 2);
        if (end > i + 2) {
          flush();
          for (const r of parseInlineRuns(text.slice(i + 2, end))) runs.push({ ...r, bold: true });
          i = end + 2; continue;
        }
      }
      if ((text[i] === "*" || text[i] === "_") &&
          text[i + 1] !== text[i] && (i === 0 || text[i - 1] !== text[i])) {
        const marker = text[i];
        const end = text.indexOf(marker, i + 1);
        if (end > i + 1 && text[end + 1] !== marker) {
          flush();
          for (const r of parseInlineRuns(text.slice(i + 1, end))) runs.push({ ...r, italic: true });
          i = end + 1; continue;
        }
      }
      const link = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (link) {
        flush();
        runs.push({ text: link[1], url: link[2] });
        i += link[0].length; continue;
      }
      buf += text[i];
      i++;
    }
    flush();
    return runs;
  }

  return {
    stripCodeFence,
    effectiveDescription,
    safeFilenamePart,
    buildFilename,
    buildUserPrompt,
    escapeLatex,
    inlineMdToLatex,
    markdownToLatex,
    parseMarkdownBlocks,
    parseInlineRuns,
  };
});
