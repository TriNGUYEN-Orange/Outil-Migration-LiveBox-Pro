/* --- /push/box6/push_airbox.js --- */

window.executerAirbox = async function () {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
        /* 1. Lecture configuration */
        let configurationActuelle = window.configLivebox;

        if (!configurationActuelle && typeof window.chargerConfiguration === "function") {
            try {
                configurationActuelle = await window.chargerConfiguration();
                window.configLivebox = configurationActuelle;
            } catch (e) {
                throw new Error("Configuration non décodable (airbox).");
            }
        }

        if (!configurationActuelle) {
            throw new Error("Configuration absente (airbox).");
        }

        if (!configurationActuelle.airbox) {
            return;
        }

        const configAirbox = configurationActuelle.airbox;

        /* Helpers robustes */
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
                await (window.attendrePause ? window.attendrePause(500) : sleep(500));
            }
            return null;
        };

        const attendreFinLoadingIframe = async (iframe, timeoutMs = 35000) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                try {
                    const docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    if (docIframe && docIframe.readyState === "complete") {
                        const loading = docIframe.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            return true;
                        }
                    }
                } catch (_) {}
                await (window.attendrePause ? window.attendrePause(500) : sleep(500));
            }
            return false;
        };

        const sauvegarderRobuste = async (iframe) => {
            const currentDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (!currentDoc) throw new Error("Document iframe inaccessible au moment de la sauvegarde.");

            const btnSave = currentDoc.querySelector("#save");
            if (!btnSave) throw new Error("Bouton de sauvegarde introuvable (#save).");

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
            else btnSave.click();

            const ok = await attendreFinLoadingIframe(iframe, 35000);
            if (!ok) throw new Error("Timeout : sauvegarde Airbox non confirmée.");

            await (window.attendrePause ? window.attendrePause(1000) : sleep(1000));
        };

        const selectionnerAvecSecurite = (doc, selecteur, valeurVoulue, valeurDefaut) => {
            const selectElem = doc.querySelector(selecteur);
            if (!selectElem) return false;

            const options = Array.from(selectElem.options || []);
            const cible = valeurVoulue ? String(valeurVoulue).toLowerCase() : "";
            const defaut = String(valeurDefaut || "").toLowerCase();

            const optionTrouvee =
                options.find(opt => String(opt.value).toLowerCase() === cible || String(opt.text).toLowerCase() === cible) ||
                options.find(opt => String(opt.value).toLowerCase() === defaut || String(opt.text).toLowerCase() === defaut);

            if (!optionTrouvee) return false;

            selectElem.value = optionTrouvee.value;
            selectElem.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
        };

        const writeIfExists = (doc, selector, value) => {
            if (value === undefined || value === null || value === "") return;

            const el = doc.querySelector(selector);
            if (!el) return;

            if (typeof window.ecrireTexteDansDoc === "function") {
                window.ecrireTexteDansDoc(doc, selector, value);
            } else {
                el.value = String(value);
                try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (_) {}
                try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
                try { el.dispatchEvent(new Event("blur", { bubbles: true })); } catch (_) {}
            }
        };

        /* 2. Navigation Support */
        let btnSupport = null;
        if (typeof window.attendreElement === "function") {
            btnSupport = await window.attendreElement("#sah_footer .icon-support", 12000);
        } else {
            const start = Date.now();
            while (Date.now() - start < 12000) {
                btnSupport = document.querySelector("#sah_footer .icon-support");
                if (btnSupport) break;
                await sleep(200);
            }
        }

        if (!btnSupport) throw new Error("Bouton Support introuvable (#sah_footer .icon-support).");

        let clicSupportOk = false;
        if (typeof window.cliquerBouton === "function") {
            clicSupportOk = window.cliquerBouton("#sah_footer .icon-support");
        } else {
            btnSupport.click();
            clicSupportOk = true;
        }
        if (!clicSupportOk) throw new Error("Impossible de cliquer sur Support.");

        await (window.attendrePause ? window.attendrePause(1800) : sleep(1800));

        /* 3. Tuile Airbox */
        let tuileAirbox = null;
        if (typeof window.attendreElement === "function") {
            tuileAirbox = await window.attendreElement("#airbox", 12000);
        } else {
            const start = Date.now();
            while (Date.now() - start < 12000) {
                tuileAirbox = document.querySelector("#airbox");
                if (tuileAirbox) break;
                await sleep(200);
            }
        }

        if (!tuileAirbox) throw new Error("Tuile Airbox introuvable (#airbox).");

        tuileAirbox.scrollIntoView({ behavior: "smooth", block: "center" });
        await (window.attendrePause ? window.attendrePause(600) : sleep(600));

        const widget = tuileAirbox.querySelector(".widget");
        let clicTuileOk = false;
        if (typeof window.cliquerBouton === "function") {
            clicTuileOk = window.cliquerBouton(widget ? widget : tuileAirbox);
        } else {
            (widget || tuileAirbox).click();
            clicTuileOk = true;
        }
        if (!clicTuileOk) throw new Error("Impossible de cliquer sur la tuile Airbox.");

        await (window.attendrePause ? window.attendrePause(1200) : sleep(1200));

        /* 4. Iframe */
        let iframe = await attendreIframeRobuste(30000);
        if (!iframe) throw new Error("Iframe Airbox introuvable après navigation.");

        const iframeLoaded = await attendreFinLoadingIframe(iframe, 35000);
        if (!iframeLoaded) throw new Error("Timeout : chargement iframe Airbox trop long.");

        await (window.attendrePause ? window.attendrePause(600) : sleep(600));

        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
        if (!docIframe) throw new Error("Document iframe Airbox inaccessible.");

        /* Skip status (comme demandé) et remplissage */
        writeIfExists(docIframe, "#password_value", configAirbox["mot de passe administrateur"]);
        await sleep(1500);

        writeIfExists(docIframe, "#pincode_value", configAirbox["code pin"]);
        await sleep(1500);

        /* Avancé */
        let lienAvance = docIframe.querySelector("#advanced_settings_link > span") || docIframe.querySelector("#advanced_settings_link");
        if (lienAvance) {
            if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
            else lienAvance.click();

            await (window.attendrePause ? window.attendrePause(1200) : sleep(1200));

            selectionnerAvecSecurite(docIframe, "#networkMode", configAirbox["mode réseau"], "Auto 2G/3G/4G");
            await sleep(1500);

            selectionnerAvecSecurite(docIframe, "#interferences", configAirbox["réduction d'interférences"], "Aucune");
            await sleep(1500);

            selectionnerAvecSecurite(docIframe, "#rescue_activation", configAirbox["activer l'accès de secours après"], "1min 30");
            await sleep(1500);

            selectionnerAvecSecurite(docIframe, "#rescue_deactivation", configAirbox["désactiver l'accès de secours après"], "5min");
            await sleep(1500);

            let btnWifiReprise = docIframe.querySelector("#wifi_settings_retrieve");
            if (btnWifiReprise && configAirbox["reprise des paramètres WiFi"] !== undefined) {
                let etatVoulu = String(configAirbox["reprise des paramètres WiFi"]).toLowerCase();
                let veutActif = (etatVoulu === "activé" || etatVoulu === "active" || etatVoulu === "true" || etatVoulu === "1" || etatVoulu === "on");

                let estActuelActive =
                    btnWifiReprise.getAttribute("aria-pressed") === "true" ||
                    !!btnWifiReprise.checked ||
                    (btnWifiReprise.innerText && btnWifiReprise.innerText.includes("ON"));

                if (estActuelActive !== veutActif) {
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnWifiReprise);
                    else btnWifiReprise.click();
                    await sleep(1500);
                }
            }

            writeIfExists(docIframe, "#apn_name_value", configAirbox["nom de l'APN"]);
            await sleep(1500);

            writeIfExists(docIframe, "#apn_id_value", configAirbox["identifiant APN"]);
            await sleep(1500);

            writeIfExists(docIframe, "#apn_password_value", configAirbox["mot de passe APN"]);
            await sleep(1500);
        }

        /* Sauvegarde unique (sans gestion d’état final) */
        await sauvegarderRobuste(iframe);

        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
            await (window.attendrePause ? window.attendrePause(2000) : sleep(2000));
        }
    } catch (e) {
        throw e;
    }
};
