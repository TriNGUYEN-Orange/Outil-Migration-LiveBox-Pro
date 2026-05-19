/* --- /push/box7/push_routage.js --- */

window.executerRoutage = async function() {
    console.log("⏳ Application des paramètres de Routage...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;

    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch(e) {
        throw new Error("Configuration JSON invalide (routage).");
    }

    if (!configurationActuelle || !configurationActuelle.routage || !configurationActuelle.routage["table de routage"]) {
        console.warn("⚠️ Pas de données de Routage trouvées à appliquer.");
        return;
    }

    let tableRoutage = configurationActuelle.routage["table de routage"];
    if (!Array.isArray(tableRoutage) || tableRoutage.length === 0) return;

    /* =================================================================================== */
    /* 🛡️ BOUCLIER ANTI-SCROLL (Protection pendant la saisie)                              */
    /* =================================================================================== */
    const bloquerScroll = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener('wheel', bloquerScroll, { passive: false });
    window.addEventListener('touchmove', bloquerScroll, { passive: false });
    window.addEventListener('DOMMouseScroll', bloquerScroll, { passive: false });
    let oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const libererScroll = () => {
        window.removeEventListener('wheel', bloquerScroll);
        window.removeEventListener('touchmove', bloquerScroll);
        window.removeEventListener('DOMMouseScroll', bloquerScroll);
        document.body.style.overflow = oldOverflow;
    };

    /* Helpers robustesse */
    const attendreIframeRobuste = async (timeoutMs = 35000) => {
        const debut = Date.now();
        const selecteurs = [
            "#iframeapp",
            "iframe#iframeapp",
            "iframe[src*='network']",
            "iframe[src*='routing']",
            "iframe"
        ];

        while (Date.now() - debut < timeoutMs) {
            for (const sel of selecteurs) {
                const el = document.querySelector(sel);
                if (el) return el;
            }
            await window.attendrePause(500);
        }
        return null;
    };

    const attendreFinLoadingIframe = async (iframe, timeoutMs = 40000) => {
        return new Promise((resolve, reject) => {
            let done = false;
            let intervalle = setInterval(() => {
                try {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    if (docIframe && docIframe.readyState === "complete") {
                        let loading = docIframe.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intervalle);
                                resolve();
                            }
                        }
                    }
                } catch(e) {}
            }, 400);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intervalle);
                    reject(new Error("Timeout: chargement iframe Routage trop long."));
                }
            }, timeoutMs);
        });
    };

    try {
        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
            await window.attendrePause(1200);
        }

        /* 1. Navigation vers le menu avancé */
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 12000);
        if (!btnAvance) throw new Error("Bouton Avancé introuvable (#sah_footer .icon-advanced).");

        let clicAvanceOk = window.cliquerBouton("#sah_footer .icon-advanced");
        if (!clicAvanceOk) throw new Error("Impossible de cliquer sur Avancé (#sah_footer .icon-advanced).");

        await window.attendrePause(1400);

        /* 2. Navigation vers la tuile Réseau Avancé */
        let tuileReseauAvance = await window.attendreElement("#networkAdvanced", 12000);
        if (!tuileReseauAvance) throw new Error("Tuile Réseau Avancé introuvable (#networkAdvanced).");

        tuileReseauAvance.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await window.attendrePause(400);

        let clicTuileOk = window.cliquerBouton("#networkAdvanced .widget");
        if (!clicTuileOk) throw new Error("Impossible de cliquer sur la tuile Réseau Avancé.");

        // Laisser la transition UI se faire
        await window.attendrePause(1400);

        /* 3. Entrée dans l'Iframe (robuste) */
        let iframe = await attendreIframeRobuste(35000);
        if (!iframe) throw new Error("Iframe réseau introuvable (navigation Routage).");

        console.log("⏳ Attente de l'écran de chargement de l'iframe...");
        await attendreFinLoadingIframe(iframe, 40000);

        await window.attendrePause(600);

        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
        if (!docIframe) throw new Error("Document iframe Routage inaccessible.");

        /* 4. Onglet Routage */
        let ongletRoutage = await window.attendreElementDansDoc(docIframe, "#tab_information_routing", 8000);
        if (!ongletRoutage) throw new Error("Onglet Routage introuvable (#tab_information_routing).");

        if (typeof window.cliquerPur === "function") window.cliquerPur(ongletRoutage);
        else ongletRoutage.click();
        await window.attendrePause(1500);

        /* =================================================================================== */
        /* FONCTIONS DE VALIDATION IP ET SAISIE IFRAME                                         */
        /* =================================================================================== */

        const regleIP = (v) => v && /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);

        const validerIP = async (ipActuelle, nomChamp) => {
            let val = ipActuelle;
            let titre = `⚠️ ${nomChamp} Invalide`;
            while (!regleIP(val)) {
                val = await window.PushUI.afficherPopupValidation(
                    titre,
                    "Format attendu : IPv4 (ex: 192.168.1.x ou 255.255.255.x)",
                    val,
                    regleIP
                );
                if (val === null) return null;
            }
            return val;
        };

        const remplirChampIframe = async (doc, selecteur, valeur) => {
            let champ = doc.querySelector(selecteur);
            if (!champ) throw new Error(`Champ introuvable (${selecteur}).`);

            champ.scrollIntoView({ behavior: 'instant', block: 'center' });
            champ.focus();
            champ.value = "";
            champ.dispatchEvent(new Event('input', { bubbles: true }));
            champ.value = valeur;
            champ.dispatchEvent(new Event('input', { bubbles: true }));
            champ.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: '0' }));
            champ.dispatchEvent(new Event('change', { bubbles: true }));
            champ.blur();
            await window.attendrePause(300);
        };

        const attendreFinActionDoc = async (doc, timeoutMs = 20000) => {
            return new Promise((resolve, reject) => {
                let done = false;
                let intv = setInterval(() => {
                    try {
                        let loading = doc.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intv);
                                resolve();
                            }
                        }
                    } catch(e) {}
                }, 350);

                setTimeout(() => {
                    if (!done) {
                        clearInterval(intv);
                        reject(new Error("Timeout: action route non confirmée."));
                    }
                }, timeoutMs);
            });
        };

        /* =================================================================================== */
        /* BOUCLE D'APPLICATION DES ROUTES                                                     */
        /* =================================================================================== */
        for (let i = 0; i < tableRoutage.length; i++) {
            let route = tableRoutage[i];
            console.log(`⏳ Configuration de la route : ${route["Réseau de destination"]}`);

            let reseauConf = await validerIP(route["Réseau de destination"], "Réseau Destination");
            if (reseauConf === null) { console.log("⏭️ Route ignorée."); continue; }

            let masqueConf = await validerIP(route["Masque du sous-réseau de destination"], "Masque Sous-Réseau");
            if (masqueConf === null) { console.log("⏭️ Route ignorée."); continue; }

            let gwConf = await validerIP(route["Passerelle"], "Passerelle (Gateway)");
            if (gwConf === null) { console.log("⏭️ Route ignorée."); continue; }

            let btnAddRule = await window.attendreElementDansDoc(docIframe, "#addRule", 8000);
            if (!btnAddRule) throw new Error("Bouton ajout route introuvable (#addRule).");

            btnAddRule.scrollIntoView({ behavior: 'instant', block: 'center' });
            if (typeof window.cliquerPur === "function") window.cliquerPur(btnAddRule);
            else btnAddRule.click();
            await window.attendrePause(1000);

            await remplirChampIframe(docIframe, "#destinationIP", reseauConf);
            await remplirChampIframe(docIframe, "#subnetDestinationIP", masqueConf);
            await remplirChampIframe(docIframe, "#gateway", gwConf);

            if (route["Métrique"] !== undefined) {
                await remplirChampIframe(docIframe, "#metric", route["Métrique"].toString());
            }

            let veutEtreActif = !(route["Activé"] === false || String(route["Activé"]).toLowerCase() === "false");
            let cbActive = docIframe.querySelector("#routingAcitvate_true, input[type='radio'][value='true'], input[type='checkbox']");
            if (cbActive && cbActive.checked !== veutEtreActif) {
                cbActive.click();
                await window.attendrePause(300);
            }

            let btnSubmitRule = docIframe.querySelector("#popup_addRule_submit");
            if (!btnSubmitRule) throw new Error("Bouton validation route introuvable (#popup_addRule_submit).");

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSubmitRule);
            else btnSubmitRule.click();

            await attendreFinActionDoc(docIframe, 20000);
            await window.attendrePause(500);
        }

        console.log("✅ Configuration du Routage terminée !");

    } finally {
        libererScroll();
    }

    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000);
    }
};
