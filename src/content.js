(function () {
  const STORAGE_KEY = "wickJpEnabled";
  const browserApi = typeof browser !== "undefined" ? browser : chrome;
  const tr = self.WickJpTranslations;
  if (!tr) return;

  const MARK = "data-wickjp";
  const TRANSLATED_TEXT = "1";
  const TRANSLATED_ATTR_PREFIX = "data-wickjp-attr-";
  const ATTRS = ["aria-label", "title", "placeholder", "alt", "data-tip", "aria-description", "aria-roledescription", "aria-placeholder", "label"];
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);
  const SKIP_TEXT_TAGS = new Set([...SKIP_TAGS, "TEXTAREA", "INPUT"]);

  let enabled = true;
  let observer = null;
  let lastTitle = "";

  function isInsideSkippedAncestor(node) {
    let parent = node.parentNode;
    while (parent && parent.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TEXT_TAGS.has(parent.tagName)) return true;
      if (parent.isContentEditable) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  function translateTextNode(node) {
    const original = node.nodeValue;
    if (!original) return;
    if (isInsideSkippedAncestor(node)) return;
    const replaced = tr.translate(original);
    if (replaced !== original) {
      node.__wickJpOriginal = original;
      node.nodeValue = replaced;
    }
  }

  function translateAttributes(el) {
    for (const attr of ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      const original = el.getAttribute(attr);
      if (!original) continue;
      if (el.getAttribute(TRANSLATED_ATTR_PREFIX + attr) === original) continue;
      const replaced = tr.translate(original);
      if (replaced !== original) {
        el.setAttribute(attr, replaced);
        el.setAttribute(TRANSLATED_ATTR_PREFIX + attr, replaced);
      }
    }
  }

  function walkAndTranslate(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.has(root.tagName)) return;
      translateAttributes(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
          if (SKIP_TEXT_TAGS.has(node.tagName)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let current = walker.currentNode;
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        translateTextNode(current);
      } else if (current.nodeType === Node.ELEMENT_NODE && current !== root) {
        translateAttributes(current);
      }
      current = walker.nextNode();
    }
  }

  function syncTitle() {
    const current = document.title;
    if (!current || current === lastTitle) return;
    const translated = tr.translateTitle(current);
    if (translated && translated !== current) {
      lastTitle = translated;
      document.title = translated;
    } else {
      lastTitle = current;
    }
  }

  function start() {
    if (observer) return;
    if (document.body) walkAndTranslate(document.body);
    if (document.head) walkAndTranslate(document.head);
    syncTitle();

    observer = new MutationObserver((mutations) => {
      if (!enabled) return;
      for (const m of mutations) {
        if (m.type === "characterData" && m.target) {
          translateTextNode(m.target);
        } else if (m.type === "attributes" && m.target && m.attributeName && ATTRS.includes(m.attributeName)) {
          translateAttributes(m.target);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => walkAndTranslate(n));
        }
      }
      syncTitle();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function applyEnabled(next) {
    enabled = !!next;
    if (enabled) {
      start();
    } else {
      stop();
    }
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

  try {
    browserApi.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === "wick-jp:set-enabled") {
        applyEnabled(!!msg.enabled);
      }
    });
  } catch (_) {}

  function init() {
    readEnabled().then(applyEnabled);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
    init();
  } else {
    init();
  }
})();
