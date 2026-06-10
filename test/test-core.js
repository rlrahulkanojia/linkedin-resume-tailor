// Test suite for lib/resume-core.js — runs in plain Node, no deps.
// Usage:  node test/test-core.js

const assert = require("assert");
const path = require("path");
const Core = require(path.resolve(__dirname, "..", "lib", "resume-core.js"));

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (e) {
    failed++;
    failures.push({ name, err: e });
    console.log("  ✗ " + name + " — " + e.message);
  }
}
function group(name, fn) { console.log("\n" + name); fn(); }

// ----- stripCodeFence ------------------------------------------------------
group("stripCodeFence", () => {
  test("strips ```markdown … ``` wrapper", () => {
    const input = "```markdown\n# Hi\nbody\n```";
    assert.strictEqual(Core.stripCodeFence(input), "# Hi\nbody");
  });
  test("strips ```md … ``` wrapper", () => {
    assert.strictEqual(Core.stripCodeFence("```md\nx\n```"), "x");
  });
  test("strips bare ``` … ``` wrapper", () => {
    assert.strictEqual(Core.stripCodeFence("```\nx\n```"), "x");
  });
  test("leaves plain markdown untouched", () => {
    assert.strictEqual(Core.stripCodeFence("# Hello\nworld"), "# Hello\nworld");
  });
  test("trims surrounding whitespace", () => {
    assert.strictEqual(Core.stripCodeFence("\n  # x  \n"), "# x");
  });
  test("returns '' for non-string", () => {
    assert.strictEqual(Core.stripCodeFence(null), "");
    assert.strictEqual(Core.stripCodeFence(undefined), "");
  });
  test("does NOT strip when fence is mid-document", () => {
    const md = "intro\n```js\nlet x;\n```\nmore";
    assert.strictEqual(Core.stripCodeFence(md), md);
  });
  test("strips ```latex … ``` wrapper", () => {
    const input = "```latex\n\\documentclass{article}\n\\begin{document}\nHi\n\\end{document}\n```";
    assert.strictEqual(Core.stripCodeFence(input), "\\documentclass{article}\n\\begin{document}\nHi\n\\end{document}");
  });
  test("strips ```tex … ``` wrapper", () => {
    assert.strictEqual(Core.stripCodeFence("```tex\n\\section{A}\n```"), "\\section{A}");
  });
});

// ----- effectiveDescription ------------------------------------------------
group("effectiveDescription", () => {
  test("returns job description when no paste", () => {
    const j = { description: "x".repeat(300) };
    assert.strictEqual(Core.effectiveDescription(j, "", 40).length, 300);
  });
  test("paste wins when long enough", () => {
    const j = { description: "from job" };
    const p = "p".repeat(50);
    assert.strictEqual(Core.effectiveDescription(j, p, 40), p);
  });
  test("paste ignored when below min length", () => {
    const j = { description: "from job" };
    assert.strictEqual(Core.effectiveDescription(j, "short", 40), "from job");
  });
  test("works with no job at all", () => {
    const p = "p".repeat(50);
    assert.strictEqual(Core.effectiveDescription(null, p, 40), p);
  });
  test("returns '' with no job and no usable paste", () => {
    assert.strictEqual(Core.effectiveDescription(null, "", 40), "");
  });
  test("trims pasted JD whitespace", () => {
    const p = "  " + "a".repeat(50) + "  ";
    assert.strictEqual(Core.effectiveDescription(null, p, 40), "a".repeat(50));
  });
});

// ----- filename helpers ----------------------------------------------------
group("safeFilenamePart / buildFilename", () => {
  test("strips unsafe chars", () => {
    assert.strictEqual(Core.safeFilenamePart("Acme / Corp™"), "Acme_Corp_");
  });
  test("falls back to 'resume' when empty", () => {
    assert.strictEqual(Core.safeFilenamePart(""), "resume");
    assert.strictEqual(Core.safeFilenamePart(null), "resume");
  });
  test("trims to 60 chars", () => {
    const x = "a".repeat(80);
    assert.strictEqual(Core.safeFilenamePart(x).length, 60);
  });
  test("buildFilename composes the right shape", () => {
    assert.strictEqual(
      Core.buildFilename("OpenAI", "Senior Engineer", "pdf"),
      "resume_OpenAI_Senior_Engineer.pdf"
    );
  });
  test("buildFilename handles missing pieces", () => {
    assert.strictEqual(Core.buildFilename("", "", "md"), "resume_resume_resume.md");
  });
});

// ----- buildUserPrompt -----------------------------------------------------
group("buildUserPrompt", () => {
  test("includes all metadata that's provided", () => {
    const out = Core.buildUserPrompt("BASE", {
      company: "Acme", title: "SWE", location: "Remote",
      workplace: "Remote", employmentStatus: "Full-time",
      url: "https://x", description: "JD body"
    });
    assert.ok(out.includes("Company: Acme"));
    assert.ok(out.includes("Title: SWE"));
    assert.ok(out.includes("Location: Remote"));
    assert.ok(out.includes("Workplace: Remote"));
    assert.ok(out.includes("Employment: Full-time"));
    assert.ok(out.includes("URL: https://x"));
    assert.ok(out.includes("JD body"));
    assert.ok(out.startsWith("# BASE RESUME"));
    assert.ok(out.includes("# JOB DESCRIPTION"));
    assert.ok(out.trimEnd().endsWith("Output the LaTeX document only."));
  });
  test("omits empty metadata", () => {
    const out = Core.buildUserPrompt("BASE", { description: "JD" });
    assert.ok(!out.includes("Company:"));
    assert.ok(!out.includes("Title:"));
  });
  test("works when description missing", () => {
    const out = Core.buildUserPrompt("BASE", { title: "x" });
    assert.ok(out.includes("Title: x"));
    assert.ok(out.includes("# BASE RESUME"));
  });
});

// ----- escapeLatex ---------------------------------------------------------
group("escapeLatex", () => {
  test("escapes LaTeX special characters", () => {
    const out = Core.escapeLatex("100% & cheap $5_low #1 {ok}");
    assert.ok(out.includes("\\%"));
    assert.ok(out.includes("\\&"));
    assert.ok(out.includes("\\$"));
    assert.ok(out.includes("\\_"));
    assert.ok(out.includes("\\#"));
    assert.ok(out.includes("\\{"));
    assert.ok(out.includes("\\}"));
  });
  test("escapes backslash, tilde, caret, <, >", () => {
    const out = Core.escapeLatex("\\ ~ ^ < >");
    assert.ok(out.includes("\\textbackslash{}"));
    assert.ok(out.includes("\\textasciitilde{}"));
    assert.ok(out.includes("\\textasciicircum{}"));
    assert.ok(out.includes("\\textless{}"));
    assert.ok(out.includes("\\textgreater{}"));
  });
});

// ----- inlineMdToLatex -----------------------------------------------------
group("inlineMdToLatex", () => {
  test("converts bold", () => {
    assert.strictEqual(Core.inlineMdToLatex("**hi**"), "\\textbf{hi}");
  });
  test("converts italic", () => {
    assert.strictEqual(Core.inlineMdToLatex("*hi*"), "\\textit{hi}");
  });
  test("converts inline code", () => {
    assert.strictEqual(Core.inlineMdToLatex("`x`"), "\\texttt{x}");
  });
  test("converts links", () => {
    const out = Core.inlineMdToLatex("[Site](https://e.com)");
    assert.ok(out.includes("\\href{https://e.com}{Site}"));
  });
  test("does not confuse ** with *", () => {
    // bold then plain text, no italic confusion
    const out = Core.inlineMdToLatex("**bold** rest");
    assert.ok(out.includes("\\textbf{bold}"));
    assert.ok(out.includes(" rest"));
    assert.ok(!out.includes("\\textit"));
  });
  test("escapes plain text", () => {
    assert.ok(Core.inlineMdToLatex("a & b").includes("\\&"));
  });
});

// ----- markdownToLatex -----------------------------------------------------
group("markdownToLatex", () => {
  const md = `# Jane Doe
jane@x.com

## Experience
### Acme — Engineer
- Built **stuff** that scaled to 100% uptime.
- Reduced cost by 30%.

## Skills
- Python, Go
`;
  const tex = Core.markdownToLatex(md);
  test("emits a compilable document skeleton", () => {
    assert.ok(tex.startsWith("\\documentclass"));
    assert.ok(tex.includes("\\begin{document}"));
    assert.ok(tex.trimEnd().endsWith("\\end{document}"));
  });
  test("first H1 becomes centered LARGE title (not section*)", () => {
    assert.ok(tex.includes("\\begin{center}{\\LARGE\\textbf{Jane Doe}}"));
  });
  test("H2 becomes section*", () => {
    assert.ok(tex.includes("\\section*{Experience}"));
    assert.ok(tex.includes("\\section*{Skills}"));
  });
  test("H3 becomes subsection*", () => {
    // "—" is a unicode em-dash; escapeLatex doesn't touch it.
    assert.ok(tex.includes("\\subsection*{Acme"));
  });
  test("bullets are wrapped in itemize and closed", () => {
    assert.ok(tex.includes("\\begin{itemize}"));
    assert.ok(tex.includes("\\end{itemize}"));
    assert.ok(tex.includes("\\item Built \\textbf{stuff}"));
  });
  test("uses proper inputenc package (not the inputx hack)", () => {
    assert.ok(tex.includes("\\usepackage[utf8]{inputenc}"));
    assert.ok(!tex.includes("inputx"));
  });
  test("escapes % inside list items", () => {
    assert.ok(tex.includes("100\\%"));
    assert.ok(tex.includes("30\\%"));
  });
});

// ----- parseMarkdownBlocks -------------------------------------------------
group("parseMarkdownBlocks", () => {
  test("groups bullets into a list block", () => {
    const b = Core.parseMarkdownBlocks("- one\n- two\n- three");
    assert.strictEqual(b.length, 1);
    assert.strictEqual(b[0].type, "list");
    assert.deepStrictEqual(b[0].items, ["one", "two", "three"]);
    assert.strictEqual(b[0].ordered, false);
  });
  test("detects headings by level", () => {
    const b = Core.parseMarkdownBlocks("# Big\n## Med\n### Small");
    assert.deepStrictEqual(b.map(x => [x.type, x.level, x.text]),
      [["h", 1, "Big"], ["h", 2, "Med"], ["h", 3, "Small"]]);
  });
  test("paragraphs merge consecutive lines, split on blank line", () => {
    const b = Core.parseMarkdownBlocks("line one\nline two\n\nnext para");
    assert.strictEqual(b.length, 2);
    assert.strictEqual(b[0].type, "p");
    assert.ok(b[0].text.includes("line one"));
    assert.ok(b[0].text.includes("line two"));
  });
  test("ordered list separates from unordered list", () => {
    const b = Core.parseMarkdownBlocks("- a\n1. one\n2. two");
    assert.strictEqual(b.length, 2);
    assert.strictEqual(b[0].ordered, false);
    assert.strictEqual(b[1].ordered, true);
  });
});

// ----- parseInlineRuns -----------------------------------------------------
group("parseInlineRuns", () => {
  test("plain text → one run", () => {
    const r = Core.parseInlineRuns("hello world");
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].text, "hello world");
  });
  test("bold marks the inner run as bold", () => {
    const r = Core.parseInlineRuns("a **B** c");
    const bold = r.find(x => x.bold);
    assert.ok(bold);
    assert.strictEqual(bold.text, "B");
  });
  test("italic marks the inner run as italic", () => {
    const r = Core.parseInlineRuns("a *I* c");
    const ital = r.find(x => x.italic);
    assert.ok(ital);
    assert.strictEqual(ital.text, "I");
  });
  test("link runs carry url", () => {
    const r = Core.parseInlineRuns("see [here](https://e.com)");
    const link = r.find(x => x.url);
    assert.ok(link);
    assert.strictEqual(link.url, "https://e.com");
    assert.strictEqual(link.text, "here");
  });
});

// ----- summary -------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed.`);
if (failed) {
  for (const f of failures) {
    console.log("\nFAIL: " + f.name);
    console.log(f.err.stack || f.err);
  }
  process.exit(1);
}
