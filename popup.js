const toggle = document.getElementById("toggle");

// Load saved state
chrome.storage.sync.get(["enabled"], (data) => {
  // modeSelect.value = data.mode || "-ai";
  toggle.checked = data.enabled ?? true;
});

// // Save and apply changes
// modeSelect.addEventListener("change", async () => {
//   const mode = modeSelect.value;
//   chrome.storage.sync.set({ mode });
//   await updateRules(mode, toggle.checked);
// });

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  // const { mode } = await chrome.storage.sync.get("mode");
  // await updateRules(mode || "-ai", enabled);
});

// async function updateRules(mode, enabled) {
//   if (!enabled) {
//     await chrome.declarativeNetRequest.updateEnabledRulesets({
//       disableRulesetIds: ["web_mode_rules"]
//     });
//     return;
//   }

//   if (mode === "web") {
//     await chrome.declarativeNetRequest.updateEnabledRulesets({
//       enableRulesetIds: ["web_mode_rules"]
//     });
//   } else {
//     await chrome.declarativeNetRequest.updateEnabledRulesets({
//       disableRulesetIds: ["web_mode_rules"]
//     });
//   }
// }