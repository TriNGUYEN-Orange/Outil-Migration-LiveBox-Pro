/* --- /push/box7/push_dyndns.js --- */

window.executerDynDns = async function () {
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

    const selectByExactValue = (selectEl, wantedValue) => {
        if (!selectEl) return null;
        const target = String(wantedValue || "").trim();
        const opt = Array.from(selectEl.options || []).find((o) => String(o.value || "").trim() === target);
        if (!opt) return null;

        selectEl.value = opt.value;
        try { selectEl.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}
        return opt;
    };

    const selectByValueOrTextNormalized = (selectEl, wanted) => {
        if (!selectEl) return null;
        const wantedN = N(wanted);
        const options = Array.from(selectEl.options || []);
        const opt =
            options.find((o) => N(o.value) === wantedN) ||
            options.find((o) => N(o.textContent || o.text || "") === wantedN);
        if (!opt) return null;

        selectEl.value = opt.value;
        try { selectEl.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        try { selectEl.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}
        return opt;
    };

    // Récupération du mot de passe via popup déjà existante
    const demanderMotDePasse = async () => {
        try {
            if (typeof window.demanderMotDePasse === "function") {
                const v = await window.demanderMotDePasse();
                return String(v || "").trim();
            }
        } catch (_) {}

        try {
            if (typeof window.ouvrirPopupMotDePasse === "function") {
                const v = await window.ouvrirPopupMotDePasse();
                return String(v || "").trim();
            }
        } catch (_) {}

        const v = window.prompt("Mot de passe DynDNS :");
        return String(v || "").trim();
    };

    if (!window.configLivebox || !window.configLivebox.dyndns) return;

    const dyndns = window.configLivebox.dyndns || {};
    const nomDNS = String(dyndns["nom DNS"] || "").trim();

    if (!nomDNS) return;

    let externes = dyndns["dynsDNS externes"];
    if (!Array.isArray(externes)) externes = dyndns["DynDNS externes"];
    if (!Array.isArray(externes)) externes = [];

    let ext = externes[0] || {};
    const serviceJson = String(ext["Service"] || "").trim();
    const hostJson = String(ext["Nom d'hôte/de domaine"] || "").trim();
    const mailJson = String(ext["Identifiant"] || "").trim();

    const shouldEnable = !!dyndns["activé"];

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

    // Ouvrir l'onglet DynDNS
    const tabDynMain = document.querySelector("#tab_information_dyndns");
    if (tabDynMain) {
        clickLikeUser(tabDynMain, window);
    } else {
        const tabDynIframe = await waitIframeEl(iframe, "#tab_information_dyndns", 10000);
        if (!tabDynIframe) throw new Error("Onglet #tab_information_dyndns introuvable.");
        clickLikeUser(tabDynIframe, iframe.contentWindow || window);
    }

    await sleep(5000);

    // Champs DynDNS
    const selDomain = await waitIframeEl(iframe, "#domaineName", 10000);
    const lblEnableTrue = await waitIframeEl(iframe, "#dyndnsEnable_true", 10000);
    const chkEnable = await waitIframeEl(iframe, "#dynDnsCheckbox", 10000);
    const selType = await waitIframeEl(iframe, "#type", 10000);
    const inpHost = await waitIframeEl(iframe, "#hostName", 10000);
    const inpMail = await waitIframeEl(iframe, "#mail", 10000);
    const inpPass = await waitIframeEl(iframe, "#password", 10000);
    const btnSaveLine = await waitIframeEl(iframe, "#submit > span:nth-child(1)", 10000);
    const btnSaveState = await waitIframeEl(iframe, "#save", 10000);

    if (!selDomain || !selType || !inpHost || !inpMail || !inpPass || !btnSaveLine) {
        throw new Error("Un ou plusieurs champs DynDNS sont introuvables.");
    }

    const domainOpt = selectByExactValue(selDomain, nomDNS);
    if (!domainOpt) return;

    await sleep(120);

    let serviceOpt = null;
    if (serviceJson) {
        serviceOpt = selectByValueOrTextNormalized(selType, serviceJson);
    }
    if (!serviceOpt) {
        serviceOpt = selectByValueOrTextNormalized(selType, "dyndns");
    }

    await sleep(120);

    setInputValue(inpHost, hostJson);
    await sleep(120);

    setInputValue(inpMail, mailJson);
    await sleep(120);

    const pwd = await demanderMotDePasse();
    setInputValue(inpPass, pwd);
    await sleep(120);

    clickLikeUser(btnSaveLine, iframe.contentWindow || window);
    await sleep(1000);

    if (shouldEnable) {
        if (lblEnableTrue) {
            const isEnabledNow = !!(chkEnable && chkEnable.checked);
            if (!isEnabledNow) {
                clickLikeUser(lblEnableTrue, iframe.contentWindow || window);
                await sleep(250);
            }
        }
        if (btnSaveState) {
            clickLikeUser(btnSaveState, iframe.contentWindow || window);
            await sleep(1000);
        }
    } else {
        if (btnSaveState) {
            clickLikeUser(btnSaveState, iframe.contentWindow || window);
            await sleep(1000);
        }
    }
};
