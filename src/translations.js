(function () {
  const byDomain = (typeof self !== "undefined" && self.__WICK_JP_DICT_BY_DOMAIN__) || null;
  const templates = (typeof self !== "undefined" && self.__WICK_JP_TEMPLATES__) || [];
  if (!byDomain) {
    console.warn("[wick-jp] dictionary bundle not loaded; translations disabled");
    return;
  }

  const hostname = location.hostname.toLowerCase();
  const dict = byDomain[hostname] || byDomain[hostname.replace(/^www\./, "")] || null;
  if (!dict) {
    console.warn(`[wick-jp] no dictionary for ${hostname}`);
    return;
  }

  const normalize = (s) => s.replace(/\s+/g, " ").trim();
  const exactMap = new Map(Object.entries(dict.entries));
  const lowerMap = new Map();
  for (const [k, v] of exactMap) {
    const lk = k.toLowerCase();
    if (!lowerMap.has(lk)) lowerMap.set(lk, v);
  }
  const multilineMap = new Map(dict.multiline.map((m) => [m.key, m.ja]));
  const multilineLowerMap = new Map();
  for (const [k, v] of multilineMap) {
    const lk = k.toLowerCase();
    if (!multilineLowerMap.has(lk)) multilineLowerMap.set(lk, v);
  }
  const compiledTemplates = templates.map((t) => ({
    pattern: new RegExp(t.pattern, "i"),
    replace: t.replace
  }));

  function applyTemplate(text) {
    for (const t of compiledTemplates) {
      const match = text.match(t.pattern);
      if (match) {
        return t.replace.replace(/\{(\d+)\}/g, (_, n) => match[Number(n)] ?? "");
      }
    }
    return null;
  }

  function translate(text) {
    if (text == null) return text;
    const leading = text.match(/^\s*/)[0];
    const trailing = text.match(/\s*$/)[0];
    const trimmed = text.slice(leading.length, text.length - trailing.length);
    if (!trimmed) return text;
    const key = normalize(trimmed);

    const exact = exactMap.get(key);
    if (exact !== undefined) return leading + exact + trailing;

    const multi = multilineMap.get(key);
    if (multi !== undefined) return leading + multi + trailing;

    const lowerKey = key.toLowerCase();
    const exactCi = lowerMap.get(lowerKey);
    if (exactCi !== undefined) return leading + exactCi + trailing;
    const multiCi = multilineLowerMap.get(lowerKey);
    if (multiCi !== undefined) return leading + multiCi + trailing;

    const fromTemplate = applyTemplate(key);
    if (fromTemplate !== null) return leading + fromTemplate + trailing;

    return text;
  }

  function translateTitle(title) {
    if (!title) return title;
    const titles = dict.titles || { exact: {}, suffix: {} };
    if (titles.exact && titles.exact[title]) return titles.exact[title];
    const dashIdx = title.lastIndexOf(" - ");
    if (dashIdx >= 0) {
      const head = title.slice(0, dashIdx);
      const tail = title.slice(dashIdx + 3);
      const tailJa =
        (titles.suffix && titles.suffix[tail]) ||
        (titles.exact && titles.exact[tail]) ||
        exactMap.get(normalize(tail));
      if (tailJa) {
        const headJa = (titles.exact && titles.exact[head]) || head;
        return headJa + " - " + tailJa;
      }
    }
    return translate(title);
  }

  self.WickJpTranslations = { translate, translateTitle };
})();
