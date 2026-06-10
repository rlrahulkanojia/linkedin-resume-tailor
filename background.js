// Background service worker — wires the toolbar action to the side panel
// and forwards job-detection messages from content scripts to the side panel.

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn("[resume-tailor] setPanelBehavior failed:", err));
});

// Cache the latest job payload per tab so the side panel can ask for current state on open.
const latestJobByTab = new Map();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;

  // From content script: a job is currently open in the LinkedIn tab.
  if (msg.type === "JOB_DETECTED" && sender.tab?.id != null) {
    // Cap cache at 50 entries
    if (latestJobByTab.size >= 50 && !latestJobByTab.has(sender.tab.id)) {
      const oldest = latestJobByTab.keys().next().value;
      latestJobByTab.delete(oldest);
    }
    latestJobByTab.set(sender.tab.id, { ...msg.payload, tabId: sender.tab.id, at: Date.now() });
    // Broadcast to side panel (which is a runtime page, no tab id needed).
    chrome.runtime.sendMessage({ type: "JOB_UPDATE", payload: latestJobByTab.get(sender.tab.id) }).catch(() => {});
    return;
  }

  if (msg.type === "JOB_CLEARED" && sender.tab?.id != null) {
    latestJobByTab.delete(sender.tab.id);
    chrome.runtime.sendMessage({ type: "JOB_UPDATE", payload: null }).catch(() => {});
    return;
  }

  // From side panel: give me the current job for the active tab.
  if (msg.type === "GET_CURRENT_JOB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) return sendResponse({ payload: null });
      // Ask the content script to re-scan (it might have nothing cached yet).
      chrome.tabs.sendMessage(tab.id, { type: "RESCAN" }, () => {
        // Ignore errors (content script may not be loaded on non-LinkedIn tabs).
        void chrome.runtime.lastError;
      });
      sendResponse({ payload: latestJobByTab.get(tab.id) || null });
    });
    return true; // async
  }
});

// Clean up cache when tabs close
chrome.tabs.onRemoved.addListener((tabId) => latestJobByTab.delete(tabId));
