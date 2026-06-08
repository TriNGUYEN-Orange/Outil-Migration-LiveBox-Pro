/* --- /push/box7/push_routage.js --- */

window.trouverIframeApp = async function(timeout = 20000) {
    const selectors = [
        "#iframeapp",
        "iframe#iframeapp",
        "#iframeApp",
        "iframe[id*='iframe'][id*='app']",
        "#content iframe",
        "iframe[src*='network']",
        "iframe[src*='advanced']"
    ];

    const start = Date.now();
    while (Date.now() - start < timeout) {
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                try {
                    const d = el.contentDocument || el.contentWindow?.document;
                    if (d) return el;
                } catch (e) {}
            }
        }
        await window.attendrePause(300);
    }
    return null;
};

window.executerRoutage = async function() {
    try {
        console.log("⏳ Application des paramètres de Routage...");

        let configurationActuelle = window.configLivebox;

        if (!configurationActuelle && typeof window.chargerConfiguration === "function") {
            try {
                configurationActuelle = await window.chargerConfiguration();
                window.configLivebox = configurationActuelle;
            } catch (e) {
                throw new Error("Configuration non décodable (routage).");
            }
        }

        if (!configurationActuelle) {
            throw new Error("Configuration absente (ni window.configLivebox ni chargement).");
        }


        if (!configurationActuelle) {
            throw new Error("Configuration absente (ni localStorage ni window.configLivebox).");
        }

        if (!configurationActuelle.routage) {
            throw new Error("Bloc 'routage' absent dans la configuration.");
        }

        if (!configurationActuelle.routage["table de routage"]) {
            throw new Error("Champ 'table de routage' absent dans le bloc routage.");
        }

        let tableRoutage = configurationActuelle.routage["table de routage"];
        if (!Array.isArray(tableRoutage) || tableRoutage.length === 0) {
            console.warn("⚠️ Table de routage vide, rien à appliquer.");
            return;
        }

        // 1) Footer Avancé
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
        if (!btnAvance) throw new Error("Élément introuvable: #sah_footer .icon-advanced");

        let okClickAvance = window.cliquerBouton("#sah_footer .icon-advanced");
        if (!okClickAvance) throw new Error("Échec clic sur: #sah_footer .icon-advanced");

        await window.attendrePause(1000);

        // 2) Tuile Site Réseau
        let tuileReseauAvance = await window.attendreElement("#networkAdvanced", 10000);
        if (!tuileReseauAvance) throw new Error("Élément introuvable: #networkAdvanced");

        tuileReseauAvance.scrollIntoView({ behavior: "smooth", block: "center" });
        await window.attendrePause(300);

        let clicTuile = window.cliquerBouton("#networkAdvanced .widget");
        if (!clicTuile) throw new Error("Échec clic sur: #networkAdvanced .widget");

        await window.attendrePause(1200);

        // 3) Iframe robuste (multi-selectors + retry re-clic tuile)
        let iframe = null;
        for (let t = 1; t <= 3; t++) {
            iframe = await window.trouverIframeApp(8000);
            if (iframe) break;

            console.warn(`⚠️ Iframe non trouvée (tentative ${t}/3). Re-clic tuile réseau...`);
            window.cliquerBouton("#networkAdvanced .widget");
            await window.attendrePause(1200);
        }
        if (!iframe) {
            throw new Error("Iframe introuvable après 3 tentatives (selectors multiples).");
        }

        // Attente souple loading
        await new Promise((resolve) => {
            let intervalle = setInterval(() => {
                try {
                    let docIframeTmp = iframe.contentDocument || iframe.contentWindow.document;
                    if (docIframeTmp && (docIframeTmp.readyState === "interactive" || docIframeTmp.readyState === "complete")) {
                        let loading = docIframeTmp.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            clearInterval(intervalle);
                            resolve();
                        }
                    }
                } catch (e) {}
            }, 300);

            setTimeout(() => {
                clearInterval(intervalle);
                resolve();
            }, 20000);
        });

        await window.attendrePause(500);

        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
        if (!docIframe) throw new Error("Document iframe inaccessible (contentDocument/contentWindow nul).");

        // 4) Onglet routage
        let ongletRoutage = await window.attendreElementDansDoc(docIframe, "#tab_information_routing", 8000);
        if (!ongletRoutage) throw new Error("Élément introuvable dans iframe: #tab_information_routing");

        if (typeof window.cliquerPur === "function") window.cliquerPur(ongletRoutage);
        else ongletRoutage.click();

        await window.attendrePause(1200);

        // 5) Boucle routes
        for (let i = 0; i < tableRoutage.length; i++) {
            let route = tableRoutage[i];
            console.log(`⏳ Ajout route ${i + 1}/${tableRoutage.length}...`);

            let btnAddRule = await window.attendreElementDansDoc(docIframe, "#addRule", 5000);
            if (!btnAddRule) throw new Error(`Route ${i + 1}: bouton introuvable dans iframe: #addRule`);

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnAddRule);
            else btnAddRule.click();

            await window.attendrePause(800);

            if (route["Réseau de destination"]) {
                window.ecrireTexteDansDoc(docIframe, "#destinationIP", route["Réseau de destination"]);
            }
            if (route["Masque du sous-réseau de destination"]) {
                window.ecrireTexteDansDoc(docIframe, "#subnetDestinationIP", route["Masque du sous-réseau de destination"]);
            }
            if (route["Passerelle"]) {
                window.ecrireTexteDansDoc(docIframe, "#gateway", route["Passerelle"]);
            }
            if (route["Métrique"] !== undefined) {
                window.ecrireTexteDansDoc(docIframe, "#metric", String(route["Métrique"]));
            }

            if (typeof route["Activé"] !== "undefined") {
                let cbActive = docIframe.querySelector("#routingAcitvate_true");
                if (cbActive && cbActive.checked !== route["Activé"]) {
                    cbActive.click();
                    await window.attendrePause(300);
                }
            }

            let btnSubmitRule = docIframe.querySelector("#popup_addRule_submit");
            if (!btnSubmitRule) throw new Error(`Route ${i + 1}: bouton introuvable: #popup_addRule_submit`);

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSubmitRule);
            else btnSubmitRule.click();

            // attente souple post save
            await new Promise((resolve) => {
                let intv = setInterval(() => {
                    try {
                        let loading = docIframe.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            clearInterval(intv);
                            resolve();
                        }
                    } catch (e) {}
                }, 300);

                setTimeout(() => {
                    clearInterval(intv);
                    resolve();
                }, 15000);
            });

            await window.attendrePause(400);
        }

        console.log("✅ Configuration du Routage terminée.");

        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
        }

    } catch (e) {
        throw new Error("Échec module Routage: " + (e?.message || "erreur inconnue"));
    }
};
