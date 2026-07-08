/* --- /push/box7/push_dmz.js --- */

window.executerDmz = async function () {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const LOG = (...args) => {
        try {
            console.log("[DMZ]", ...args);
        } catch (_) {}
    };

    const N = (s) =>
        String(s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

    const getIframeDoc = (iframe) => {
        try {
            return iframe.contentDocument || iframe.contentWindow.document;
        } catch (_) {
            return null;
        }
    };

    const waitMainEl = async (selector, timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(200);
        }
        return null;
    };

    const waitIframeEl = async (iframe, selectors, timeout = 12000) => {
        const list = Array.isArray(selectors) ? selectors : [selectors];
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const doc = getIframeDoc(iframe);
            if (doc) {
                for (const selector of list) {
                    const el = doc.querySelector(selector);
                    if (el) return el;
                }
            }
            await sleep(200);
        }

        return null;
    };

    const attendreReseauPret = async (iframe, minWait = 5000, timeout = 60000) => {
        const isLoadingVisible = (doc) => {
            const loading = doc.querySelector("body > div.loading_screen, .loading_screen");
            return !!(
                loading &&
                (doc.defaultView || window).getComputedStyle(loading).display !== "none" &&
                loading.offsetParent !== null
            );
        };

        const start = Date.now();
        while (Date.now() - start < timeout) {
            const doc = getIframeDoc(iframe);
            if (doc && doc.readyState === "complete") {
                if (!isLoadingVisible(doc) && Date.now() - start >= minWait) {
                    return true;
                }
            }
            await sleep(250);
        }

        return false;
    };

    const clickLikeUser = (el, viewWindow = window) => {
        if (!el) return false;

        try {
            el.scrollIntoView({ block: "center" });
        } catch (_) {}

        try {
            el.focus();
        } catch (_) {}

        ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((evt) => {
            try {
                el.dispatchEvent(
                    new MouseEvent(evt, {
                        bubbles: true,
                        cancelable: true,
                        view: viewWindow
                    })
                );
            } catch (_) {}
        });

        try {
            el.click();
        } catch (_) {}

        return true;
    };

    // ========= 0) Lecture des données JSON =========
    if (!window.configLivebox || !window.configLivebox.dmz) {
        LOG("skip: no configLivebox.dmz");
        return;
    }

    const dmzCfg = window.configLivebox.dmz;
    const dmzItems = Array.isArray(dmzCfg["équipements"]) ? dmzCfg["équipements"] : [];

    if (!dmzItems.length) {
        LOG("skip: no dmz équipements in json");
        return;
    }

    // ========= 1) Vérifier qu'on est dans le contexte réseau avancé =========
    let iframe = document.querySelector("#iframeapp");

    if (!iframe) {
        LOG("iframe not found, reopen réseau avancé...");

        const btnAvance = await waitMainEl("#sah_footer .icon-advanced", 10000);
        if (!btnAvance) throw new Error("Menu avancé introuvable.");

        if (typeof window.cliquerBouton === "function") {
            window.cliquerBouton("#sah_footer .icon-advanced");
        } else {
            clickLikeUser(btnAvance, window);
        }

        await sleep(700);

        const tile = await waitMainEl("#networkAdvanced", 10000);
        if (!tile) throw new Error("Tuile #networkAdvanced introuvable.");

        if (typeof window.cliquerBouton === "function") {
            window.cliquerBouton("#networkAdvanced .widget");
        } else {
            clickLikeUser(tile.querySelector(".widget") || tile, window);
        }

        iframe = await waitMainEl("#iframeapp", 15000);
        if (!iframe) throw new Error("Iframe #iframeapp introuvable.");
    }

    await attendreReseauPret(iframe, 5000, 60000);

    let doc = getIframeDoc(iframe);
    if (!doc) throw new Error("Document iframe inaccessible.");

    // ========= 2) Cliquer l'onglet DMZ =========
    let tabDmz =
        document.querySelector("#tab_information_dmz") ||
        doc.querySelector("#tab_information_dmz") ||
        document.querySelector("[id*='dmz'], [href*='dmz'], [data-target*='dmz']") ||
        doc.querySelector("[id*='dmz'], [href*='dmz'], [data-target*='dmz']");

    if (!tabDmz) throw new Error("Onglet DMZ introuvable.");

    if (document.contains(tabDmz)) {
        clickLikeUser(tabDmz, window);
    } else {
        clickLikeUser(tabDmz, iframe.contentWindow || window);
    }

    await sleep(3000);
    await attendreReseauPret(iframe, 3000, 30000);

    doc = getIframeDoc(iframe);
    if (!doc) throw new Error("Document iframe inaccessible après clic onglet DMZ.");

    // ========= 3) Récupérer la liste de sélection DMZ =========
    const selectDmz = await waitIframeEl(
        iframe,
        ["#DMZEquip", "select[name='DMZEquip']", "select[id*='DMZ']", "select[name*='DMZ']"],
        12000
    );

    if (!selectDmz) throw new Error("Select DMZ introuvable.");

    const options = Array.from(selectDmz.options || []).map((o) => ({
        value: String(o.value || "").trim(),
        text: String(o.textContent || o.text || "").trim()
    }));

    LOG("options:", options);

    const validOptions = options.filter((o) => {
        const t = N(o.text);
        const v = N(o.value);

        if (!t && !v) return false;
        if (v === "new_dmz_equip") return false;
        if (t.includes("adresse ip")) return false;

        return true;
    });

    // ========= 4) Faire la correspondance JSON -> option =========
    let chosen = null;

    for (const item of dmzItems) {
        const eq = String(item?.["Équipement"] || "").trim();
        if (!eq) continue;

        const eqN = N(eq);

        const opt =
            validOptions.find((o) => N(o.text) === eqN || N(o.value) === eqN) ||
            validOptions.find((o) => N(o.text).includes(eqN) || eqN.includes(N(o.text)));

        if (opt) {
            chosen = opt;
            LOG("matched json device:", eq, "->", opt);
            break;
        }
    }

    if (!chosen) {
        LOG("no matched device found, skip");
        return;
    }

    // ========= 5) Forcer la sélection + événements =========
    selectDmz.value = chosen.value;
    ["input", "change", "blur"].forEach((evt) => {
        try {
            selectDmz.dispatchEvent(new Event(evt, { bubbles: true }));
        } catch (_) {}
    });

    await sleep(500);

    // Complément : forcer selectedIndex si nécessaire
    const idx = Array.from(selectDmz.options).findIndex(
        (o) => String(o.value).trim() === chosen.value
    );

    if (idx >= 0 && selectDmz.selectedIndex !== idx) {
        selectDmz.selectedIndex = idx;
        try {
            selectDmz.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (_) {}
        await sleep(300);
    }

    LOG(
        "selected value now:",
        selectDmz.value,
        "text:",
        selectDmz.options[selectDmz.selectedIndex]?.text
    );

    // ========= 6) Soumettre la configuration =========
    doc = getIframeDoc(iframe);

    let btnSubmit =
        doc.querySelector("#submit") ||
        doc.querySelector("button[type='submit'], input[type='submit']");

    if (!btnSubmit) throw new Error("Bouton submit introuvable en DMZ.");

    clickLikeUser(btnSubmit, iframe.contentWindow || window);
    LOG("clicked submit");

    await sleep(600);

    const confirmBtn = doc.querySelector("#popup_confirm_mod_submit");
    if (confirmBtn) {
        clickLikeUser(confirmBtn, iframe.contentWindow || window);
        LOG("clicked confirm");
        await sleep(400);
    }

    await attendreReseauPret(iframe, 3000, 60000);
    LOG("DMZ done");
};
