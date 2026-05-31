(function () {
  const STORAGE_KEY = "wickJpEnabled";
  const browserApi = typeof browser !== "undefined" ? browser : chrome;
  const toggle = document.getElementById("toggle-enabled");

  function setToggleState(enabled) {
    toggle.classList.toggle("on", enabled);
    toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  }

  function readEnabled() {
    return new Promise((resolve) => {
      try {
        browserApi.storage.local.get([STORAGE_KEY], (res) => {
          const value = res && res[STORAGE_KEY];
          resolve(value === undefined ? true : !!value);
        });
      } catch (_) {
        resolve(true);
      }
    });
  }

  function writeEnabled(enabled) {
    try {
      browserApi.storage.local.set({ [STORAGE_KEY]: enabled });
    } catch (_) {}
    try {
      browserApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return;
        browserApi.tabs.sendMessage(tabs[0].id, {
          type: "wick-jp:set-enabled",
          enabled
        });
      });
    } catch (_) {}
  }

  readEnabled().then(setToggleState);

  toggle.addEventListener("click", async () => {
    const next = !toggle.classList.contains("on");
    setToggleState(next);
    writeEnabled(next);
  });
  toggle.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle.click();
    }
  });
})();
