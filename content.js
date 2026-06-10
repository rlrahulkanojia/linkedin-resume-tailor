// content.js — LinkedIn Resume Tailor (v0.7+)
// Production-grade job extractor.
//
// PRIMARY PATH: LinkedIn's voyager job-postings API.
//   Endpoint: /voyager/api/jobs/jobPostings/<jobId>?decorationId=...WebFullJobPosting-65
//   Headers : csrf-token (from JSESSIONID cookie), x-restli-protocol-version 2.0.0,
//             accept application/vnd.linkedin.normalized+json+2.1
//   This works for both inline AND "external/Promoted" jobs that intentionally
//   omit the JD from the DOM.
//
// FALLBACK PATHS (when voyager fails — e.g. logged-out preview, regional API issue):
//   2) "About the job" h2 anchor + parent container
//   3) Largest plausible visible text block (heuristic)
//
// Exposes window.__rtDebug() for diagnostics.

(function () {
  const TAG = "[resume-tailor]";
  const log  = (...a) => { try { console.log(TAG, ...a); } catch {} };
  const warn = (...a) => { try { console.warn(TAG, ...a); } catch {} };
  function DEBUG() { try { return localStorage.getItem("rt_debug") === "1"; } catch { return false; } }

  let lastJobKey = null;
  let attemptCount = 0;
  let voyagerCache = new Map(); // jobId -> last good voyager result

  // ---- Helpers --------------------------------------------------------------
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    return true;
  }
  function text(el) {
    if (!el) return "";
    return (el.innerText || el.textContent || "").trim();
  }
  function extractJobIdFromUrl() {
    const m1 = location.pathname.match(/\/jobs\/view\/(\d+)/);
    if (m1) return m1[1];
    const sp = new URLSearchParams(location.search);
    if (sp.get("currentJobId")) return sp.get("currentJobId");
    // /jobs/collections/recommended/?currentJobId=...
    const sp2 = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (sp2.get("currentJobId")) return sp2.get("currentJobId");
    return null;
  }

  function csrfToken() {
    const m = document.cookie.match(/JSESSIONID="?(ajax:\d+)"?/);
    return m ? m[1] : null;
  }

  // workplaceType URN → human label
  const WORKPLACE = {
    "urn:li:fs_workplaceType:1": "On-site",
    "urn:li:fs_workplaceType:2": "Remote",
    "urn:li:fs_workplaceType:3": "Hybrid"
  };

  // ---- Voyager API (primary) -----------------------------------------------
  async function fetchViaVoyager(jobId) {
    if (voyagerCache.has(jobId)) return voyagerCache.get(jobId);
    const csrf = csrfToken();
    if (!csrf) return null;
    const decorationIds = [
      "com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-65",
      "com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-69",
      "com.linkedin.voyager.deco.jobs.web.shared.WebFullJobPosting-1"
    ];
    for (const did of decorationIds) {
      try {
        const url = `/voyager/api/jobs/jobPostings/${jobId}?decorationId=${did}`;
        const resp = await fetch(url, {
          credentials: "include",
          headers: {
            "csrf-token": csrf,
            "x-restli-protocol-version": "2.0.0",
            "accept": "application/vnd.linkedin.normalized+json+2.1"
          }
        });
        if (resp.status !== 200) continue;
        const j = await resp.json();
        const dd = j.data || j;
        const desc = (dd && dd.description)
          ? ((typeof dd.description === "string") ? dd.description : (dd.description.text || ""))
          : "";
        if (!desc || desc.length < 40) continue;

        const included = j.included || [];
        const co = included.find(x => x && (x.universalName ||
          ((x["$type"] || "").toLowerCase().includes("company")))) || {};

        // workplaceTypesResolutionResults | workplaceTypes | workplaceType
        let workplace = "";
        const wpRaw = dd.workplaceTypesResolutionResults || dd.workplaceTypes;
        if (Array.isArray(wpRaw)) {
          workplace = wpRaw.map(x => (x && (x.localizedName || WORKPLACE[x] || x)) || "").filter(Boolean).join(", ");
        } else if (wpRaw && typeof wpRaw === "object") {
          workplace = Object.values(wpRaw)
            .map(x => (x && (x.localizedName || x["*localizedName"] || WORKPLACE[x])) || (typeof x === "string" ? WORKPLACE[x] : ""))
            .filter(Boolean).join(", ");
        } else if (typeof wpRaw === "string") {
          workplace = WORKPLACE[wpRaw] || wpRaw;
        }

        const employmentStatus = dd.formattedEmploymentStatus || dd.employmentStatus || "";

        const result = {
          source: "voyager:" + did.split(".").pop(),
          jobId,
          title: dd.title || "",
          company: co.name || co.universalName || "",
          location: dd.formattedLocation || "",
          workplace,
          employmentStatus,
          description: desc,
          applyUrl: (dd.applyMethod && (dd.applyMethod.companyApplyUrl || dd.applyMethod.easyApplyUrl)) || null,
          listedAtMs: dd.listedAt || dd.originalListedAt || null
        };
        // Cap cache at 20 entries
        if (voyagerCache.size >= 20) {
          const oldest = voyagerCache.keys().next().value;
          voyagerCache.delete(oldest);
        }
        voyagerCache.set(jobId, result);
        return result;
      } catch (e) {
        if (DEBUG()) warn("voyager fetch failed for", did, e);
      }
    }
    return null;
  }

  // ---- Title + company from document.title (fallback) -----------------------
  function parseDocumentTitle() {
    let t = (document.title || "").trim();
    if (!t) return { title: "", company: "" };
    t = t.replace(/^\(\d+\)\s*/, "");
    t = t.replace(/\s*\|\s*LinkedIn\s*$/i, "");
    const parts = t.split(/\s*\|\s*/);
    if (parts.length >= 2) {
      return { title: parts[0].trim(), company: parts.slice(1).join(" | ").trim() };
    }
    return { title: t, company: "" };
  }

  // ---- "About the job" anchor (DOM fallback) --------------------------------
  function findAboutJobH2() {
    const candidates = document.querySelectorAll("h1, h2, h3");
    for (const h of candidates) {
      const t = (h.innerText || h.textContent || "").trim();
      if (/^about the job$/i.test(t)) return h;
      if (/^(job description|description|over deze functie|sobre el (puesto|empleo)|à propos du poste)$/i.test(t)) return h;
    }
    return null;
  }
  function descriptionContainerFromAnchor(h) {
    if (!h) return null;
    let p = h.parentElement;
    let hops = 0;
    while (p && hops < 8) {
      const len = text(p).length;
      if (len > 250 && len < 25000) return p;
      p = p.parentElement;
      hops++;
    }
    return null;
  }
  function cleanDescription(raw) {
    if (!raw) return "";
    let s = raw.trim();
    s = s.replace(/^(about the job|job description|description|over deze functie|sobre el (?:puesto|empleo)|à propos du poste)\s*\n+/i, "");
    return s.trim();
  }

  function findDescriptionDom() {
    const h = findAboutJobH2();
    const container = descriptionContainerFromAnchor(h);
    if (container) return { el: container, source: "dom:about-job-h2" };

    const known = [
      "#job-details",
      ".jobs-description__content .jobs-box__html-content",
      ".jobs-description-content__text",
      ".jobs-description__content",
      "article.jobs-description__container",
      ".description__text"
    ];
    for (const sel of known) {
      const el = document.querySelector(sel);
      if (el && visible(el) && text(el).length > 100) return { el, source: "dom:legacy-class:" + sel };
    }

    let best = null, bestLen = 0;
    const blocks = document.querySelectorAll("div, section, article");
    for (const el of blocks) {
      if (!visible(el)) continue;
      const t = text(el);
      if (t.length < 300 || t.length > 20000) continue;
      if (/^(0 notifications|Skip to|Home\b)/i.test(t.slice(0, 50))) continue;
      if (/^(Select language|العربية)/i.test(t.slice(0, 50))) continue;
      if (t.length > bestLen) { best = el; bestLen = t.length; }
    }
    if (best) return { el: best, source: "dom:heuristic-largest-block" };
    return null;
  }

  // ---- Main extractor (returns Promise) -------------------------------------
  async function extractJob() {
    if (!/\/jobs(\/|$)/.test(location.pathname)) return null;
    const jobId = extractJobIdFromUrl();
    if (!jobId) return null;

    // 1) Try voyager API first
    let result = null;
    try {
      const vy = await fetchViaVoyager(jobId);
      if (vy && vy.description && vy.description.length >= 80) {
        result = {
          jobId: vy.jobId,
          url: location.href,
          title: vy.title,
          company: vy.company,
          location: vy.location,
          workplace: vy.workplace,
          employmentStatus: vy.employmentStatus,
          description: vy.description,
          applyUrl: vy.applyUrl,
          listedAtMs: vy.listedAtMs,
          source: vy.source,
          externalJob: false,
          partial: false,
          reason: null,
          detectedAt: new Date().toISOString()
        };
      }
    } catch (e) { if (DEBUG()) warn("voyager primary failed:", e); }

    if (result) return result;

    // 2) DOM fallback
    const { title, company } = parseDocumentTitle();
    const descInfo = findDescriptionDom();
    const description = cleanDescription(text(descInfo && descInfo.el));

    // External job signal (when DOM has nothing useful)
    const bodyText = (document.body && document.body.innerText) || "";
    let externalJob = false, applyOnSite = null;
    if (/Apply on company website/i.test(bodyText) || /Responses managed off LinkedIn/i.test(bodyText)) {
      externalJob = true;
      const a = document.querySelector('a[aria-label*="Apply on company"]') ||
                document.querySelector('a[href*="/safety/go/"]');
      if (a) applyOnSite = a.href;
    }

    if (!title && description.length < 80) return null;
    const ready = !!title && description.length >= 80;
    return {
      jobId,
      url: location.href,
      title,
      company,
      location: "",
      workplace: "",
      employmentStatus: "",
      description,
      applyUrl: applyOnSite,
      source: descInfo ? descInfo.source : "dom:none",
      externalJob,
      partial: !ready,
      reason: ready ? null : (!title ? "title-missing" : "description-missing-or-short"),
      detectedAt: new Date().toISOString()
    };
  }

  async function publish() {
    try {
      const job = await extractJob();
      if (job) {
        const key = job.jobId + "|" + job.description.length + "|" + (job.partial ? "p" : "f") + "|" + (job.source || "");
        if (key !== lastJobKey) {
          lastJobKey = key;
          chrome.runtime.sendMessage({ type: "JOB_DETECTED", payload: job }).catch(() => {});
          log((job.partial ? "partial:" : "detected:"),
              job.title || "(no title)", "@", job.company || "(no company)",
              "descLen=" + job.description.length, "src=" + job.source);
        }
      } else if (lastJobKey !== null) {
        lastJobKey = null;
        chrome.runtime.sendMessage({ type: "JOB_CLEARED" }).catch(() => {});
      }
    } catch (e) { warn("publish failed:", e); }
  }

  // ---- Schedulers ----------------------------------------------------------
  function burstPublish() {
    attemptCount = 0;
    const interval = setInterval(() => {
      publish();
      attemptCount++;
      const haveFull = lastJobKey && !/\|p\|/.test(lastJobKey);
      if (haveFull || attemptCount > 20) clearInterval(interval);
    }, 400);
  }
  burstPublish();

  const mo = new MutationObserver(() => {
    clearTimeout(mo._t);
    mo._t = setTimeout(publish, 500);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      lastJobKey = null;
      // jobId changed → clear cache for stale entries (keep current to allow back-nav)
      const currentId = extractJobIdFromUrl();
      if (currentId) {
        for (const k of voyagerCache.keys()) if (k !== currentId) voyagerCache.delete(k);
      }
      burstPublish();
    }
  }, 700);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "RESCAN") {
      lastJobKey = null;
      voyagerCache.clear();
      burstPublish();
      sendResponse && sendResponse({ ok: true });
    }
  });

  // Console debug hook
  window.__rtDebug = async function () {
    const job = await extractJob();
    const report = job ? {
      url: job.url,
      jobId: job.jobId,
      title: job.title || "(none)",
      company: job.company || "(none)",
      location: job.location || "(none)",
      workplace: job.workplace || "(none)",
      source: job.source,
      externalJob: !!job.externalJob,
      applyUrl: job.applyUrl || null,
      descriptionLen: (job.description || "").length,
      descriptionHead: (job.description || "").slice(0, 240)
    } : { error: "extractJob() returned null" };
    console.log(TAG, "DEBUG REPORT");
    console.log(JSON.stringify(report, null, 2));
    return report;
  };

  log("content script loaded on", location.href);
})();
