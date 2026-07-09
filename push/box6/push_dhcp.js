/* --- /push/box7/push_dhcp.js --- */

window.executerDhcpDns = async function () {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // =========================
    // Helpers
    // =========================
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

    const attendreReseauPret = async (iframe, minWait = 15000, timeout = 90000) => {
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
                const visible = isLoadingVisible(doc);
                if (!visible && Date.now() - start >= minWait) return true;
            }
            await sleep(300);
        }
        return false;
    };

    const cliquerConfirmMod = async (iframe, timeout = 15000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const doc = getIframeDoc(iframe);
            if (!doc) { await sleep(200); continue; }

            const popup = doc.querySelector("#popup_confirm_mod");
            const btn = doc.querySelector("#popup_confirm_mod_submit");

            if (popup && btn) {
                const visible = (doc.defaultView || window).getComputedStyle(popup).display !== "none";
                if (!visible) { await sleep(200); continue; }

                try { btn.disabled = false; btn.removeAttribute("disabled"); } catch (_) {}
                try { btn.scrollIntoView({ block: "center" }); } catch (_) {}
                try { btn.focus(); } catch (_) {}

                const v = iframe.contentWindow || window;
                ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((evt) => {
                    try {
                        btn.dispatchEvent(new MouseEvent(evt, {
                            bubbles: true,
                            cancelable: true,
                            view: v
                        }));
                    } catch (_) {}
                });
                try { btn.click(); } catch (_) {}

                await sleep(350);

                const popupAfter = doc.querySelector("#popup_confirm_mod");
                const stillVisible = !!(
                    popupAfter &&
                    (doc.defaultView || window).getComputedStyle(popupAfter).display !== "none"
                );
                if (!stillVisible) return true;
            }

            await sleep(250);
        }
        return false;
    };

    const setIfDiffText = (doc, selector, newValue) => {
        const el = doc.querySelector(selector);
        if (!el || typeof newValue === "undefined" || newValue === null || newValue === "") return false;

        const oldV = String(el.value || "").trim();
        const newV = String(newValue).trim();
        if (oldV === newV) return false;

        if (typeof window.ecrireTexteDansDoc === "function") {
            window.ecrireTexteDansDoc(doc, selector, newV);
        } else {
            el.value = newV;
            try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
            try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
        }
        return true;
    };

    // =========================
    // Start
    // =========================
    if (!window.configLivebox || !window.configLivebox.dhcp_dns) return;

    const configDhcp = window.configLivebox.dhcp_dns;
    let hasChanges = false;

    // =========================
    // Navigation UI
    // =========================
    const btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    if (!btnAvance) return;

    window.cliquerBouton("#sah_footer .icon-advanced");
    await sleep(900);

    const tuileDhcp = await window.attendreElement("#networkAdvanced", 10000);
    if (!tuileDhcp) return;

    try { tuileDhcp.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
    await sleep(300);

    const okClickTuile = window.cliquerBouton("#networkAdvanced .widget");
    if (!okClickTuile) return;

    const iframe = await window.attendreElement("#iframeapp", 15000);
    if (!iframe) return;

    await attendreReseauPret(iframe, 15000, 90000);

    let docIframe = getIframeDoc(iframe);
    if (!docIframe) return;

    // =========================
    // DHCP params
    // =========================
    if (typeof configDhcp["état du serveur DHCP"] !== "undefined") {
        const cbDhcp = docIframe.querySelector("#dhcpServ_true");
        if (cbDhcp && cbDhcp.checked !== configDhcp["état du serveur DHCP"]) {
            cbDhcp.click();
            hasChanges = true;
            await sleep(400);
        }
    }

    if (setIfDiffText(docIframe, "#dhcpIP", configDhcp["adresse IP du LAN"])) hasChanges = true;
    if (setIfDiffText(docIframe, "#dhcpMask", configDhcp["masque de sous-réseau du LAN"])) hasChanges = true;
    if (setIfDiffText(docIframe, "#ipBegin", configDhcp["adresse IP de début"])) hasChanges = true;
    if (setIfDiffText(docIframe, "#ipEnd", configDhcp["adresse IP de fin"])) hasChanges = true;

    if (configDhcp["mode DNS"]) {
        const selectDns = docIframe.querySelector("#dnsMode");
        if (selectDns) {
            const modeVoulu = N(configDhcp["mode DNS"]);
            const opt = Array.from(selectDns.options || []).find(
                (o) => N(o.value) === modeVoulu || N(o.text) === modeVoulu
            );
            if (opt && String(selectDns.value) !== String(opt.value)) {
                selectDns.value = opt.value;
                try { selectDns.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
                hasChanges = true;
            }
        }
    }

    // =========================
    // Baux DHCP statiques
    // JSON ∩ Dynamiques => Add to Statiques
    // =========================
    const bauxStatiques = Array.isArray(configDhcp["Baux DHCP statiques"]) ? configDhcp["Baux DHCP statiques"] : [];

    const getDynamicRows = (doc) =>
        Array.from(doc.querySelectorAll("#dchp_ip_list_dynamic_table tbody tr"));

    const getDynamicNames = (doc) =>
        getDynamicRows(doc).map((r) => {
            const idName = (r.getAttribute("id") || "").trim();
            if (idName) return idName;
            const td = r.querySelector("td");
            return td ? td.textContent.trim() : "";
        }).filter(Boolean);

    const getStaticNames = (doc) =>
        Array.from(doc.querySelectorAll("#dhcp_ip_list_static_table tbody tr"))
            .map((r) => {
                const idName = (r.getAttribute("id") || "").trim();
                if (idName) return idName;
                const td = r.querySelector("td");
                return td ? td.textContent.trim() : "";
            })
            .filter(Boolean);

    const isEmptyDynamicMsg = (name) => /aucun équipement à afficher/i.test(String(name || ""));

    const waitDynamicDataReady = async (iframe, timeout = 25000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const doc = getIframeDoc(iframe);
            if (!doc) { await sleep(300); continue; }

            const dynNames = getDynamicNames(doc);
            const realDyn = dynNames.filter((n) => !isEmptyDynamicMsg(n));

            const tools = doc.querySelector("#tools");
            const toolOpts = Array.from(tools?.options || [])
                .map((o) => (o.textContent || o.text || "").trim())
                .filter(Boolean)
                .filter((t) => N(t) !== N("Équipement"));

            if (realDyn.length > 0 || toolOpts.length > 0) {
                return { ready: true, dynNames: realDyn, toolOpts };
            }
            await sleep(500);
        }
        return { ready: false, dynNames: [], toolOpts: [] };
    };

    const dynState = await waitDynamicDataReady(iframe, 25000);

    if (dynState.ready && bauxStatiques.length > 0) {
        for (const item of bauxStatiques) {
            docIframe = getIframeDoc(iframe);
            if (!docIframe) continue;

            const eq = String(item?.["Équipement"] || "").trim();
            if (!eq) continue;

            const dynNamesNow = getDynamicNames(docIframe).filter((n) => !isEmptyDynamicMsg(n));
            const inDyn = dynNamesNow.some((n) => N(n) === N(eq));

            const staticBefore = getStaticNames(docIframe);
            const inStatic = staticBefore.some((n) => N(n) === N(eq));

            if (!inDyn || inStatic) continue;

            // méthode robuste: #tools + #add
            const selectTools = docIframe.querySelector("#tools");
            const btnAdd = docIframe.querySelector("#add");

            if (!selectTools || !btnAdd) continue;

            const options = Array.from(selectTools.options || []);
            let opt = options.find((o) => N(o.textContent || o.text || o.value) === N(eq));
            if (!opt) opt = options.find((o) => N(o.textContent || o.text || o.value).includes(N(eq)));
            if (!opt) opt = options.find((o) => N(eq).includes(N(o.textContent || o.text || o.value)));

            if (!opt) continue;

            selectTools.value = opt.value;
            ["input", "change", "blur"].forEach((evt) => {
                try { selectTools.dispatchEvent(new Event(evt, { bubbles: true })); } catch (_) {}
            });
            await sleep(500);

            try { btnAdd.scrollIntoView({ block: "center" }); } catch (_) {}
            try { btnAdd.focus(); } catch (_) {}

            const v = iframe.contentWindow || window;
            ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((evt) => {
                try {
                    btnAdd.dispatchEvent(new MouseEvent(evt, {
                        bubbles: true,
                        cancelable: true,
                        view: v
                    }));
                } catch (_) {}
            });
            try { btnAdd.click(); } catch (_) {}

            // verify ajout
            let added = false;
            const t1 = Date.now();
            while (Date.now() - t1 < 9000) {
                await sleep(400);
                docIframe = getIframeDoc(iframe);
                if (!docIframe) continue;

                const staticAfter = getStaticNames(docIframe);
                if (staticAfter.some((n) => N(n) === N(eq))) {
                    added = true;
                    break;
                }
            }

            if (added) hasChanges = true;
        }
    }

    // =========================
    // Save only if changed
    // =========================
    if (!hasChanges) {
        return; 
    }

    docIframe = getIframeDoc(iframe);
    const btnSubmit = docIframe ? docIframe.querySelector("#submit") : null;
    if (!btnSubmit) {
        return; 
    }

    try { btnSubmit.click(); } catch (_) {}

    await cliquerConfirmMod(iframe, 15000);

    await attendreReseauPret(iframe, 12000, 90000);

};
