/* --- /push/box7/push_natpat.js --- */

window.executerNatPat = async function () {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    const waitIframeEl = async (iframe, selector, timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const doc = getIframeDoc(iframe);
            const el = doc ? doc.querySelector(selector) : null;
            if (el) return el;
            await sleep(200);
        }
        return null;
    };

    const clickLikeUser = (el, viewWindow = window) => {
        if (!el) return false;

        try { el.scrollIntoView({ block: "center" }); } catch (_) {}
        try { el.focus(); } catch (_) {}

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

        try { el.click(); } catch (_) {}
        return true;
    };

    const setInputValue = (el, value) => {
        if (!el) return;
        el.value = String(value ?? "");
        try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
        try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        try { el.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}
    };

    const selectByTextOrValue = (selectEl, wanted) => {
        if (!selectEl) return null;
        const wantedN = N(wanted);

        const options = Array.from(selectEl.options || []);
        const opt =
            options.find((o) => N(o.value) === wantedN || N(o.textContent || o.text || "") === wantedN) ||
            options.find((o) => N(o.textContent || o.text || "").includes(wantedN) || wantedN.includes(N(o.textContent || o.text || "")));

        if (!opt) return null;

        selectEl.value = opt.value;
        try { selectEl.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}

        return opt;
    };

    // ✅ Comparaison exacte entre "Équipement" du JSON et option.value de #equip
    const selectEquipByExactValue = (selectEl, equipValueFromJson) => {
        if (!selectEl) return null;
        const target = String(equipValueFromJson || "").trim();
        const options = Array.from(selectEl.options || []);

        const exact = options.find((o) => String(o.value || "").trim() === target);
        if (!exact) return null;

        selectEl.value = exact.value;
        try { selectEl.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}

        return exact;
    };

    if (!window.configLivebox || !window.configLivebox.natpat) return;

    const natpat = window.configLivebox.natpat;
    const rules = Array.isArray(natpat["règles IPv4"]) ? natpat["règles IPv4"] : [];
    if (!rules.length) return;

    let iframe = document.querySelector("#iframeapp");
    if (!iframe) {
        const btnAvance = await waitMainEl("#sah_footer .icon-advanced", 10000);
        if (!btnAvance) throw new Error("Menu avancé introuvable.");

        if (typeof window.cliquerBouton === "function") window.cliquerBouton("#sah_footer .icon-advanced");
        else clickLikeUser(btnAvance, window);

        await sleep(700);

        const tile = await waitMainEl("#networkAdvanced", 10000);
        if (!tile) throw new Error("Tuile #networkAdvanced introuvable.");

        if (typeof window.cliquerBouton === "function") window.cliquerBouton("#networkAdvanced .widget");
        else clickLikeUser(tile.querySelector(".widget") || tile, window);

        iframe = await waitMainEl("#iframeapp", 15000);
        if (!iframe) throw new Error("Iframe #iframeapp introuvable.");
    }

    const tabNatPatMain = document.querySelector("#tab_information_natpat");
    if (tabNatPatMain) {
        clickLikeUser(tabNatPatMain, window);
    } else {
        const tabNatPatIframe = await waitIframeEl(iframe, "#tab_information_natpat", 10000);
        if (!tabNatPatIframe) throw new Error("Onglet #tab_information_natpat introuvable.");
        clickLikeUser(tabNatPatIframe, iframe.contentWindow || window);
    }

    // ✅ Augmenter le délai de stabilisation à 10 secondes
    await sleep(10000);

    const selService = await waitIframeEl(iframe, "#natFTP", 10000);
    const inpServiceAlt = await waitIframeEl(iframe, "#natFTP_alt", 10000);
    const inpPortInt = await waitIframeEl(iframe, "#natPortInt", 10000);
    const inpPortExt = await waitIframeEl(iframe, "#natPortExt", 10000);
    const selProto = await waitIframeEl(iframe, "#protocole", 10000);
    const selEquip = await waitIframeEl(iframe, "#equip", 10000);
    const btnCreate = await waitIframeEl(iframe, "#submit > span:nth-child(1)", 10000);

    if (!selService || !inpServiceAlt || !inpPortInt || !inpPortExt || !selProto || !selEquip || !btnCreate) {
        throw new Error("Un ou plusieurs sélecteurs NAT/PAT sont introuvables.");
    }

    for (const rule of rules) {
        const appService = String(rule["Application/Service"] || "").trim();
        const portInt = String(rule["Port interne"] || "").trim();
        const portExt = String(rule["Port externe"] || "").trim();
        const protoJson = String(rule["Protocole"] || "").trim();
        const equipJson = String(rule["Équipement"] || "").trim();

        if (!appService || !equipJson) continue;
        if (N(portInt) === N("Tous") || N(portExt) === N("Tous")) continue;

        // ✅ Comparaison exacte entre Équipement JSON et option.value de #equip
        const equipOpt = selectEquipByExactValue(selEquip, equipJson);
        if (!equipOpt) continue; // si pas de correspondance, on ignore la règle pour éviter une mauvaise sélection
        await sleep(120);

        const serviceOpt = selectByTextOrValue(selService, appService);
        await sleep(120);

        if (serviceOpt) {
            if (protoJson) {
                if (N(protoJson) === N("Tous")) selectByTextOrValue(selProto, "TCP/UDP");
                else selectByTextOrValue(selProto, protoJson);
            }

            clickLikeUser(btnCreate, iframe.contentWindow || window);
            await sleep(800);
            continue;
        }

        const optNouveau =
            Array.from(selService.options || []).find((o) => N(o.value) === N("^new^")) ||
            Array.from(selService.options || []).find((o) => N(o.textContent || o.text || "").includes(N("nouveau")));

        if (!optNouveau) continue;

        selService.value = optNouveau.value;
        try { selService.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        await sleep(200);

        setInputValue(inpServiceAlt, appService);
        await sleep(120);

        setInputValue(inpPortInt, portInt);
        await sleep(120);

        setInputValue(inpPortExt, portExt);
        await sleep(120);

        if (N(protoJson) === N("Tous")) {
            selectByTextOrValue(selProto, "TCP/UDP");
        } else {
            selectByTextOrValue(selProto, protoJson);
        }
        await sleep(120);

        clickLikeUser(btnCreate, iframe.contentWindow || window);
        await sleep(800);
    }
};
