/* --- /push/box7/push_airbox.js --- */

window.executerAirbox = async function() {
    console.log("⏳ Application des paramètres Airbox (Box 7)...");

    /* 1. Lecture de la configuration */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch (e) {
        throw new Error("Configuration JSON invalide (airbox).");
    }

    if (!configurationActuelle || !configurationActuelle.airbox) {
        console.warn("⚠️ Pas de données Airbox trouvées à appliquer.");
        return;
    }

    let configAirbox = configurationActuelle.airbox;

    /* Helpers robustesse (timeouts courts) */
    const attendreIframeRobuste = async (timeoutMs = 5000) => {
        const debut = Date.now();
        const selecteurs = [
            "#iframeapp",
            "iframe#iframeapp",
            "iframe[src*='airbox']",
            "iframe[src*='support']",
            "iframe[src*='network']",
            "iframe"
        ];

        while (Date.now() - debut < timeoutMs) {
            for (const sel of selecteurs) {
                const el = document.querySelector(sel);
                if (el) return el;
            }
            await window.attendrePause(250);
        }
        return null;
    };

    const attendreFinLoadingIframe = async (iframe, timeoutMs = 5000) => {
        return new Promise((resolve, reject) => {
            let done = false;
            const intervalle = setInterval(() => {
                try {
                    const docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    if (docIframe && docIframe.readyState === "complete") {
                        const loading = docIframe.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intervalle);
                                resolve();
                            }
                        }
                    }
                } catch (e) {}
            }, 250);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intervalle);
                    reject(new Error("Timeout: chargement iframe Airbox trop long."));
                }
            }, timeoutMs);
        });
    };

    const sauvegarderRobuste = async (iframe) => {
        const currentDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!currentDoc) throw new Error("Document iframe inaccessible au moment de sauvegarde.");

        const btnSave =
            currentDoc.querySelector("#save")
            || currentDoc.querySelector("#submit")
            || currentDoc.querySelector("#bt_save")
            || currentDoc.querySelector(".btn-save");

        if (!btnSave) throw new Error("Bouton sauvegarde introuvable (#save/#submit/#bt_save/.btn-save).");

        btnSave.removeAttribute("disabled");
        btnSave.classList.remove("disabled");

        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
        else btnSave.click();

        console.log("⏳ Sauvegarde Airbox en cours...");
        await new Promise((resolve, reject) => {
            let done = false;
            const intv = setInterval(() => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (doc) {
                        const loading = doc.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intv);
                                resolve();
                            }
                        }
                    }
                } catch (e) {}
            }, 300);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intv);
                    reject(new Error("Timeout: sauvegarde Airbox non confirmée."));
                }
            }, 5000);
        });

        await window.attendrePause(400);
    };

    const selectionnerAvecSecurite = (doc, selecteur, valeurVoulue, valeurDefaut) => {
        const selectElem = doc.querySelector(selecteur);
        if (!selectElem) return;

        const options = Array.from(selectElem.options || []);
        const cible = valeurVoulue ? String(valeurVoulue).toLowerCase().trim() : "";

        let optionTrouvee = null;
        if (cible) {
            optionTrouvee = options.find(opt =>
                String(opt.value).toLowerCase().trim() === cible ||
                String(opt.text).toLowerCase().trim() === cible
            );
        }

        if (!optionTrouvee && valeurDefaut) {
            const d = String(valeurDefaut).toLowerCase().trim();
            optionTrouvee = options.find(opt =>
                String(opt.value).toLowerCase().trim() === d ||
                String(opt.text).toLowerCase().trim() === d
            );
        }

        if (optionTrouvee) {
            selectElem.value = optionTrouvee.value;
            selectElem.dispatchEvent(new Event("input", { bubbles: true }));
            selectElem.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    /* 2. Navigation vers l'onglet Support */
    let btnSupport = await window.attendreElement("#sah_footer .icon-support", 5000);
    if (!btnSupport) throw new Error("Bouton Support introuvable (#sah_footer .icon-support).");

    let clicSupportOk = window.cliquerBouton("#sah_footer .icon-support");
    if (!clicSupportOk) throw new Error("Impossible de cliquer sur Support (#sah_footer .icon-support).");

    await window.attendrePause(700);

    /* 3. Recherche de la tuile Airbox */
    let tuileAirbox = await window.attendreElement("#airbox", 5000);
    if (!tuileAirbox) throw new Error("Tuile Airbox introuvable (#airbox).");

    tuileAirbox.scrollIntoView({ behavior: "smooth", block: "center" });
    await window.attendrePause(300);

    console.log("👉 Clic sur la tuile Airbox...");
    let widget = tuileAirbox.querySelector(".widget");
    let clicTuileOk = window.cliquerBouton(widget ? widget : tuileAirbox);
    if (!clicTuileOk) throw new Error("Impossible de cliquer sur la tuile Airbox.");

    await window.attendrePause(600);

    /* 4. Attente de l'iframe (timeout court) */
    let iframe = await attendreIframeRobuste(10000);
    if (!iframe) throw new Error("Iframe Airbox introuvable après navigation.");

    console.log("⏳ Attente du chargement iframe...");
    await attendreFinLoadingIframe(iframe, 5000);
    await window.attendrePause(300);

    /* 5. Configuration Airbox (sans gestion activation/désactivation) */
    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
    if (!docIframe) throw new Error("Document iframe Airbox inaccessible.");

    if (configAirbox["mot de passe administrateur"]) {
        window.ecrireTexteDansDoc(docIframe, "#password_value", configAirbox["mot de passe administrateur"]);
    }

    if (configAirbox["code pin"]) {
        window.ecrireTexteDansDoc(docIframe, "#pincode_value", configAirbox["code pin"]);
    }

    let lienAvance = docIframe.querySelector("#advanced_settings_link > span") || docIframe.querySelector("#advanced_settings_link");
    if (lienAvance) {
        if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
        else lienAvance.click();

        await window.attendrePause(500);

        selectionnerAvecSecurite(docIframe, "#networkMode", configAirbox["mode réseau"], "Auto 2G/3G/4G");
        selectionnerAvecSecurite(docIframe, "#interferences", configAirbox["réduction d'interférences"], "Aucune");
        selectionnerAvecSecurite(docIframe, "#rescue_activation", configAirbox["activer l'accès de secours après"], "1min 30");
        selectionnerAvecSecurite(docIframe, "#rescue_deactivation", configAirbox["désactiver l'accès de secours après"], "5min");

        let btnWifiReprise = docIframe.querySelector("#wifi_settings_retrieve");
        if (btnWifiReprise && configAirbox["reprise des paramètres WiFi"] !== undefined) {
            let etatVoulu = String(configAirbox["reprise des paramètres WiFi"]).toLowerCase();
            let veutActif = (etatVoulu === "activé" || etatVoulu === "active" || etatVoulu === "true" || etatVoulu === "1" || etatVoulu === "on");

            let estActuelActive =
                btnWifiReprise.getAttribute("aria-pressed") === "true" ||
                btnWifiReprise.checked ||
                (btnWifiReprise.innerText && btnWifiReprise.innerText.toUpperCase().includes("ON"));

            if (estActuelActive !== veutActif) {
                if (typeof window.cliquerPur === "function") window.cliquerPur(btnWifiReprise);
                else btnWifiReprise.click();
            }
        }

        if (configAirbox["nom de l'APN"]) {
            window.ecrireTexteDansDoc(docIframe, "#apn_name_value", configAirbox["nom de l'APN"]);
        }
        if (configAirbox["identifiant APN"]) {
            window.ecrireTexteDansDoc(docIframe, "#apn_id_value", configAirbox["identifiant APN"]);
        }
        if (configAirbox["mot de passe APN"]) {
            window.ecrireTexteDansDoc(docIframe, "#apn_password_value", configAirbox["mot de passe APN"]);
        }
    }

    /* 6. Sauvegarde */
    await sauvegarderRobuste(iframe);

    console.log("🔄 Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(600);
    }
};
