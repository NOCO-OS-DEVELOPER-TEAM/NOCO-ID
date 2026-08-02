(function () {
  const STORAGE_KEY = "noco-pages-lan-hosts";
  const probeList = document.getElementById("probe-list");
  const btnCloud = document.getElementById("btn-open-cloud");
  const btnHub = document.getElementById("btn-open-hub");
  const btnRediscover = document.getElementById("btn-rediscover");
  const btnSaveHost = document.getElementById("btn-save-host");
  const lanInput = document.getElementById("lan-host");
  const hint = document.getElementById("hint");

  function loadHosts() {
    const fromQuery = new URLSearchParams(location.search).get("host") || "";
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (_) {
      stored = [];
    }
    const hosts = ["127.0.0.1", ...stored, ...fromQuery.split(",")].map((h) => h.trim()).filter(Boolean);
    return [...new Set(hosts)];
  }

  function saveHost(host) {
    const value = String(host || "").trim();
    if (!value) return;
    const hosts = loadHosts().filter((h) => h !== value);
    hosts.push(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hosts.slice(-8)));
  }

  async function ping(url, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs || 1800);
    try {
      const res = await fetch(url, { signal: ctrl.signal, mode: "cors", cache: "no-store" });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, error: e && e.name === "AbortError" ? "timeout" : "offline" };
    } finally {
      clearTimeout(t);
    }
  }

  function setButton(el, href, enabled) {
    if (!el) return;
    if (enabled && href) {
      el.href = href;
      el.classList.remove("is-disabled");
      el.setAttribute("aria-disabled", "false");
    } else {
      el.href = "#";
      el.classList.add("is-disabled");
      el.setAttribute("aria-disabled", "true");
    }
  }

  function renderProbes(rows) {
    if (!probeList) return;
    probeList.innerHTML = rows
      .map(
        (r) =>
          `<li><strong><span class="dot ${r.online ? "on" : ""}"></span>${r.name}</strong><span>${r.detail}</span></li>`
      )
      .join("");
  }

  async function discover() {
    const hosts = loadHosts();
    const rows = [];
    let idBase = null;
    let companionBase = null;

    renderProbes([{ name: "Scanne…", online: false, detail: hosts.join(", ") }]);

    for (const host of hosts) {
      const idUrl = `http://${host}:3000/api/v1/services`;
      const idPing = await ping(idUrl);
      if (idPing.ok && !idBase) {
        idBase = `http://${host}:3000`;
        rows.push({ name: "NOCO ID", online: true, detail: idBase });
      }

      const compUrl = `http://${host}:4747/api/v1/ping`;
      const compPing = await ping(compUrl);
      if (compPing.ok && !companionBase) {
        companionBase = `http://${host}:4747/api/v1`;
        rows.push({ name: "Companion", online: true, detail: companionBase });
      }
    }

    if (!idBase) rows.unshift({ name: "NOCO ID", online: false, detail: "nicht gefunden (:3000)" });
    if (!companionBase) rows.push({ name: "Companion", online: false, detail: "nicht gefunden (:4747)" });

    renderProbes(rows);
    setButton(btnCloud, idBase ? `${idBase}/login` : null, Boolean(idBase));
    setButton(btnHub, idBase ? `${idBase}/dashboard` : null, Boolean(idBase));

    if (hint) {
      if (idBase) {
        hint.textContent = "Cloud gefunden. Melde dich mit E-Mail + Passwort an, um Hub, Limits und Geräte zu sehen.";
      } else {
        hint.textContent =
          "Starte lokal: NOCO-ID (npm run dev auf :3000) und NOCO AI (Companion :4747). Optional LAN-IP speichern.";
      }
    }
  }

  btnRediscover?.addEventListener("click", () => void discover());
  btnSaveHost?.addEventListener("click", () => {
    saveHost(lanInput?.value);
    if (lanInput) lanInput.value = "";
    void discover();
  });

  void discover();
})();
