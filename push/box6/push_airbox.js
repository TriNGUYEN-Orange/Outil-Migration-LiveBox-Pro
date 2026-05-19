/* --- /push/box6/push_airbox.js --- */

window.executerAirbox = async function() {
    console.log("⏳ Application des paramètres Airbox (Box 6)...");

    /* 1. Lecture de la configuration */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch(e) {
        throw new Error("Configuration JSON invalide (airbox).");
    }

    if (!configurationActuelle || !configurationActuelle.airbox) {
        console.warn("⚠️ Pas de données Airbox trouvées à appliquer.");
        return;
    }

    let configAirbox = configurationActuelle.airbox;

    /* Helpers robustesse */
    const attendreIframeRobuste = async (timeoutMs = 30000) => {
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
            await window.attendrePause(500);
        }
        return null;
    };

    const attendreFinLoadingIframe = async (iframe, timeoutMs = 35000) => {
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
                } catch(e) {}
            }, 500);

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

        const btnSave = currentDoc.querySelector("#save");
        if (!btnSave) throw new Error("Bouton sauvegarde introuvable (#save).");

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
                } catch(e) {}
            }, 1000);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intv);
                    reject(new Error("Timeout: sauvegarde Airbox non confirmée."));
                }
            }, 35000);
        });

        await window.attendrePause(1000);
    };

    const selectionnerAvecSecurite = (doc, selecteur, valeurVoulue, valeurDefaut) => {
        let selectElem = doc.querySelector(selecteur);
        if (!selectElem) return;

        let options = Array.from(selectElem.options || []);
        let cible = valeurVoulue ? String(valeurVoulue).toLowerCase() : "";
        let optionTrouvee =
            options.find(opt => String(opt.value).toLowerCase() === cible || String(opt.text).toLowerCase() === cible) ||
            options.find(opt => String(opt.value).toLowerCase() === String(valeurDefaut).toLowerCase() || String(opt.text).toLowerCase() === String(valeurDefaut).toLowerCase());

        if (optionTrouvee) {
            selectElem.value = optionTrouvee.value;
            selectElem.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    /* 2. Navigation vers l'onglet Support */
    let btnSupport = await window.attendreElement("#sah_footer .icon-support", 12000);
    if (!btnSupport) throw new Error("Bouton Support introuvable (#sah_footer .icon-support).");

    let clicSupportOk = window.cliquerBouton("#sah_footer .icon-support");
    if (!clicSupportOk) throw new Error("Impossible de cliquer sur Support (#sah_footer .icon-support).");

    await window.attendrePause(1800);

    /* 3. Recherche de la tuile Airbox */
    let tuileAirbox = await window.attendreElement("#airbox", 12000);
    if (!tuileAirbox) throw new Error("Tuile Airbox introuvable (#airbox).");

    tuileAirbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await window.attendrePause(600);

    console.log("👉 Clic sur la tuile Airbox...");
    let widget = tuileAirbox.querySelector(".widget");
    let clicTuileOk = window.cliquerBouton(widget ? widget : tuileAirbox);
    if (!clicTuileOk) throw new Error("Impossible de cliquer sur la tuile Airbox.");

    /* Laisse la transition UI se faire */
    await window.attendrePause(1200);

    /* 4. Attente de l'iframe avec anti-freeze (robuste) */
    let iframe = await attendreIframeRobuste(30000);
    if (!iframe) throw new Error("Iframe Airbox introuvable après navigation.");

    console.log("⏳ Attente du chargement complet de l'iframe...");
    await attendreFinLoadingIframe(iframe, 35000);
    await window.attendrePause(600);

    /* --- DÉBUT CONFIGURATION AIRBOX --- */
    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
    if (!docIframe) throw new Error("Document iframe Airbox inaccessible.");

    let veutEtreActifJson = false;
    let clesEtat = ["activé", "active", "état", "etat"];
    let etatTrouveDansJson = false;

    for (let cle of clesEtat) {
        if (configAirbox[cle] !== undefined) {
            let v = String(configAirbox[cle]).toLowerCase();
            veutEtreActifJson = (v === "true" || v === "activé" || v === "active" || v === "1" || v === "on");
            etatTrouveDansJson = true;
            break;
        }
    }
    if (!etatTrouveDansJson) veutEtreActifJson = true;

    /* Vérifier l'état actuel de la box */
    let radioActive = await window.attendreElementDansDoc(docIframe, "#airbox_activation_status_activated", 12000);
    if (!radioActive) throw new Error("Option activation Airbox introuvable (#airbox_activation_status_activated).");

    let estActuellementActif = !!radioActive.checked;

    /* Si désactivé, on l'active temporairement pour faire apparaître les champs */
    if (!estActuellementActif) {
        console.log("👉 Activation temporaire pour afficher les paramètres...");
        if (typeof window.cliquerPur === "function") window.cliquerPur(radioActive);
        else radioActive.click();

        await window.attendrePause(2000);

        if (!radioActive.checked) {
            throw new Error("Échec activation temporaire Airbox.");
        }
    }

    /* Remplissage des champs de base */
    if (configAirbox["mot de passe administrateur"]) window.ecrireTexteDansDoc(docIframe, "#password_value", configAirbox["mot de passe administrateur"]);
    if (configAirbox["code pin"]) window.ecrireTexteDansDoc(docIframe, "#pincode_value", configAirbox["code pin"]);

    /* Paramètres Avancés */
    let lienAvance = docIframe.querySelector("#advanced_settings_link > span") || docIframe.querySelector("#advanced_settings_link");
    if (lienAvance) {
        if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
        else lienAvance.click();
        await window.attendrePause(1200);

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
                (btnWifiReprise.innerText && btnWifiReprise.innerText.includes("ON"));

            if (estActuelActive !== veutActif) {
                if (typeof window.cliquerPur === "function") window.cliquerPur(btnWifiReprise);
                else btnWifiReprise.click();
            }
        }

        if (configAirbox["nom de l'APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_name_value", configAirbox["nom de l'APN"]);
        if (configAirbox["identifiant APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_id_value", configAirbox["identifiant APN"]);
        if (configAirbox["mot de passe APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_password_value", configAirbox["mot de passe APN"]);
    }

    /* Sauvegarde des données insérées */
    await sauvegarderRobuste(iframe);

    /* RESTAURATION DE L'ÉTAT SELON LE JSON */
    docIframe = iframe.contentDocument || iframe.contentWindow.document;
    if (!docIframe) throw new Error("Document iframe Airbox inaccessible après sauvegarde.");

    let radioActiveFinal = docIframe.querySelector("#airbox_activation_status_activated");
    let radioDesactiveFinal = docIframe.querySelector("#airbox_activation_status_deactivated");

    if (!radioActiveFinal || !radioDesactiveFinal) {
        throw new Error("Options état final Airbox introuvables.");
    }

    let etatCourantFinal = !!radioActiveFinal.checked;

    if (veutEtreActifJson !== etatCourantFinal) {
        console.log(`👉 Application de l'état final depuis le JSON (${veutEtreActifJson ? 'Activé' : 'Désactivé'})...`);
        let btnCible = veutEtreActifJson ? radioActiveFinal : radioDesactiveFinal;

        if (typeof window.cliquerPur === "function") window.cliquerPur(btnCible);
        else btnCible.click();

        await window.attendrePause(1000);

        // Vérification état
        let recheckActif = !!radioActiveFinal.checked;
        if (recheckActif !== veutEtreActifJson) {
            throw new Error("Échec application de l'état final Airbox.");
        }

        /* Nouvelle sauvegarde pour valider l'état final */
        await sauvegarderRobuste(iframe);
    } else {
        console.log(`✅ L'état final correspond déjà au JSON (${veutEtreActifJson ? 'Activé' : 'Désactivé'}).`);
    }

    console.log("🔄 Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000);
    }
};
