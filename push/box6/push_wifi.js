/* --- /push/box6/push_wifi.js --- */

window.executerWifi = async function() {
    console.log("⏳ Application des paramètres Wi-Fi (Box 6)...");

    let configurationActuelle = window.configLivebox;

    if (!configurationActuelle && typeof window.chargerConfiguration === "function") {
        try {
            configurationActuelle = await window.chargerConfiguration();
            window.configLivebox = configurationActuelle;
        } catch (e) {
            throw new Error("Configuration non décodable (Wi-Fi).");
        }
    }

    if (!configurationActuelle) {
        throw new Error("Configuration absente (Wi-Fi).");
    }

    if (!configurationActuelle || !configurationActuelle.wifi) {
        console.warn("⚠️ Pas de données Wi-Fi trouvées à appliquer.");
        return;
    }

    const attendreElementIframeDynamique = async (iframeNode, selecteur, timeout) => {
        return new Promise(resolve => {
            let start = Date.now();
            let interval = setInterval(() => {
                try {
                    let doc = iframeNode.contentDocument || iframeNode.contentWindow.document;
                    if (doc && doc.readyState === "complete") {
                        let el = doc.querySelector(selecteur);
                        if (el) {
                            clearInterval(interval);
                            resolve(el);
                            return;
                        }
                    }
                } catch(e) {}
                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    resolve(null);
                }
            }, 300);
        });
    };

    const attendreFinSauvegarde = async (iframeNode) => {
        console.log("⏳ Attente du traitement par la Livebox (mode bugfix 20s)...");
        await new Promise(r => setTimeout(r, 20000));

        await new Promise((resolve, reject) => {
            let done = false;
            let intv = setInterval(() => {
                try {
                    let doc = iframeNode.contentDocument || iframeNode.contentWindow.document;
                    if (doc && doc.readyState === "complete") {
                        let loading = doc.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intv);
                                resolve();
                            }
                        }
                    }
                } catch(e) {}
            }, 800);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intv);
                    reject(new Error("Timeout: fin de sauvegarde Wi-Fi non confirmée."));
                }
            }, 50000);
        });

        await new Promise(r => setTimeout(r, 1500));
    };

    const ecrireChampRobuste = (doc, selector, value) => {
        const el = doc.querySelector(selector);
        if (!el || value === undefined || value === null) return false;

        el.focus();
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
        el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.blur();
        return true;
    };

    // Save robuste + confirmation popup (#popup_confirm_submit)
    const cliquerSaveRobuste = async (iframeNode, contexte = "Wi-Fi") => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        const SAVE_SEL = "#save, #submit, input#save, input#submit, button#save, button#submit, button[type='submit'], input[type='submit'], .btn-save, .button-save";
        const CONFIRM_SEL = "#popup_confirm_submit";

        const getDoc = () => (iframeNode.contentDocument || iframeNode.contentWindow?.document || null);

        const clickFort = (el) => {
            if (!el) return false;
            try { if (typeof window.cliquerPur === "function") window.cliquerPur(el); } catch(e) {}
            try { el.focus(); } catch(e) {}
            try { el.click(); } catch(e) {}

            const view = iframeNode.contentWindow || window;
            ["pointerdown","mousedown","pointerup","mouseup","click"].forEach(type => {
                try {
                    el.dispatchEvent(new MouseEvent(type, {
                        bubbles: true,
                        cancelable: true,
                        view
                    }));
                } catch(e) {}
            });
            return true;
        };

        for (let tentative = 1; tentative <= 3; tentative++) {
            let doc = getDoc();
            if (!doc) throw new Error(`Document iframe inaccessible (${contexte}).`);

            let btnSave = doc.querySelector(SAVE_SEL);

            if (!btnSave) {
                console.warn(`⚠️ [${contexte}] Save introuvable tentative ${tentative}/3`);
                await sleep(700);
                continue;
            }

            btnSave.scrollIntoView({ behavior: "smooth", block: "center" });
            await sleep(500);

            // Relecture après scroll (DOM peut être rerender)
            doc = getDoc();
            btnSave = doc?.querySelector(SAVE_SEL);
            if (!btnSave) {
                console.warn(`⚠️ [${contexte}] Save disparu après scroll tentative ${tentative}/3`);
                await sleep(700);
                continue;
            }

            try { btnSave.disabled = false; } catch(e) {}
            try { btnSave.removeAttribute("disabled"); } catch(e) {}
            try { btnSave.style.pointerEvents = "auto"; } catch(e) {}

            console.log(`👉 [${contexte}] tentative click save ${tentative}/3`, btnSave);
            clickFort(btnSave);

            // Attendre popup de confirmation puis confirmer
            let btnConfirm = await attendreElementIframeDynamique(iframeNode, CONFIRM_SEL, 8000);
            if (btnConfirm) {
                console.log(`👉 [${contexte}] popup confirmation détecté, clic sur #popup_confirm_submit`);
                clickFort(btnConfirm);
            } else {
                console.warn(`⚠️ [${contexte}] popup confirmation non détecté (timeout).`);
            }

            // Attendre fin de sauvegarde réelle (longue)
            await attendreFinSauvegarde(iframeNode);

            return;
        }

        throw new Error(`Bouton save non cliquable après 3 tentatives (${contexte}).`);
    };

    let succesGlobal = false;
    let derniereErreur = null;

    for (let passe = 1; passe <= 2; passe++) {
        console.log(`\n=========================================`);
        console.log(`▶️ DÉMARRAGE WI-FI - TENTATIVE ${passe}/2`);
        console.log(`=========================================`);

        let succesPasse = false;

        try {
            let btnReseau = await window.attendreElement("#sah_footer .icon-network", 10000);
            if (!btnReseau) throw new Error("Bouton Réseau introuvable dans le footer.");

            let clicReseauOk = window.cliquerBouton("#sah_footer .icon-network");
            if (!clicReseauOk) throw new Error("Impossible de cliquer sur le bouton Réseau.");
            await window.attendrePause(1500);

            let selecteurVraiWidget = ".swiper-slide-active #wifiAdvanced_Fav, .swiper-slide-active .wifiAdvanced.selectable";
            let tuileActive = document.querySelector(selecteurVraiWidget);
            if (!tuileActive) selecteurVraiWidget = "#wifiAdvanced_Fav, .wifiAdvanced.selectable";

            console.log("👉 Clic sur le widget Wi-Fi...");
            let clicWifiOk = window.cliquerBouton(selecteurVraiWidget);
            if (!clicWifiOk) throw new Error("Impossible de cliquer sur le widget Wi-Fi.");
            await window.attendrePause(2500);

            let iframe = await window.attendreElement("#iframeapp", 15000);
            if (!iframe) throw new Error("L'iframe Wi-Fi n'est jamais apparue.");

            console.log("⏳ Attente de l'initialisation de l'iframe...");
            await attendreFinSauvegarde(iframe);

            let btnActivation24 = await attendreElementIframeDynamique(iframe, "#wifi_accesspoint24, #wifi_accesspointboth", 10000);
            if (!btnActivation24) throw new Error("Bouton d'activation Wi-Fi 2.4G introuvable.");

            console.log("✅ Interface Wi-Fi prête !");
            let estActive = btnActivation24.getAttribute("aria-pressed") === "true";
            if (!estActive) {
                if (typeof window.cliquerPur === "function") window.cliquerPur(btnActivation24);
                else btnActivation24.click();
                await window.attendrePause(1500);
            }

            let lien24 = await attendreElementIframeDynamique(iframe, "#wifi_accesspoint24_link, #wifi_accesspointboth", 5000);
            if (!lien24) throw new Error("Lien configuration Wi-Fi 2.4G introuvable.");

            lien24.click();
            let inputSsid24 = await attendreElementIframeDynamique(iframe, "#wifi_private_ssid", 10000);
            if (!inputSsid24) throw new Error("Champ SSID 2.4G introuvable.");

            let docIframe = iframe.contentDocument || iframe.contentWindow.document;
            if (!docIframe) throw new Error("Document iframe Wi-Fi inaccessible.");
            let configWifi = configurationActuelle.wifi;

            if (configWifi.ssid) ecrireChampRobuste(docIframe, "#wifi_private_ssid", configWifi.ssid);

            if (configWifi["mot_de_passe"]) {
                let mdpValide = typeof window.obtenirMotDePasseConforme === "function"
                    ? await window.obtenirMotDePasseConforme(configWifi["mot_de_passe"], "Wi-Fi 2.4 GHz")
                    : configWifi["mot_de_passe"];
                if (mdpValide) ecrireChampRobuste(docIframe, "#wifi_private_securitykey", mdpValide);
            }

            if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["diffusion_ssid"] !== "undefined") {
                let cbDiffusion = docIframe.querySelector("#wifi_private_broadcastssid_id_1");
                if (!cbDiffusion) throw new Error("Champ diffusion SSID 2.4G introuvable.");
                if (cbDiffusion.checked !== configWifi.wifi2_4["diffusion_ssid"]) cbDiffusion.click();
            }

            let selectDiff = docIframe.querySelector("#wifi_private_different_ssid");
            if (selectDiff) {
                selectDiff.value = "0";
                selectDiff.dispatchEvent(new Event("input", { bubbles: true }));
                selectDiff.dispatchEvent(new Event("change", { bubbles: true }));
                await window.attendrePause(500);
            }

            if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["afficher_cle_ecran"] !== "undefined") {
                let cbOled = docIframe.querySelector("#wifi_private_oledSecurityKey_1");
                if (!cbOled) throw new Error("Champ affichage clé écran 2.4G introuvable.");
                if (cbOled.checked !== configWifi.wifi2_4["afficher_cle_ecran"]) cbOled.click();
            }

            let lienAvance = docIframe.querySelector("#advanced_parameters_link");
            if (lienAvance) {
                if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
                else lienAvance.click();
                await window.attendrePause(500);

                if (configWifi.wifi2_4 && configWifi.wifi2_4.mode) {
                    let selectMode = docIframe.querySelector("#wifi_private_mode24");
                    if (!selectMode) throw new Error("Select mode Wi-Fi 2.4G introuvable.");

                    let mBrut = configWifi.wifi2_4.mode.toLowerCase();
                    let valMode = "bgn";

                    if (mBrut.includes("ax")) valMode = "ax";
                    else if (mBrut.includes("b") && mBrut.includes("g") && mBrut.includes("n")) valMode = "bgn";
                    else if (mBrut.includes("g") && mBrut.includes("n")) valMode = "gn";
                    else if (mBrut.includes("b") && mBrut.includes("g")) valMode = "bg";
                    else if (mBrut.includes("n")) valMode = "n";
                    else if (mBrut.includes("g")) valMode = "g";
                    else if (mBrut.includes("b")) valMode = "b";

                    selectMode.value = valMode;
                    selectMode.dispatchEvent(new Event("input", { bubbles: true }));
                    selectMode.dispatchEvent(new Event("change", { bubbles: true }));
                }

                if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["filtrage_mac"] !== "undefined") {
                    let selectMac = docIframe.querySelector("#wifi_private_macfiltering_enable");
                    if (!selectMac) throw new Error("Select filtrage MAC 2.4G introuvable.");
                    selectMac.value = configWifi.wifi2_4["filtrage_mac"] ? "1" : "0";
                    selectMac.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }

            await cliquerSaveRobuste(iframe, "2.4G");

            console.log("⏳ Enregistrement 2.4 GHz...");
            await attendreFinSauvegarde(iframe);
            await window.attendrePause(3000);

            // WIFI 5G SUPPRIMÉ (comme demandé)

            succesPasse = true;

        } catch (erreurDExecution) {
            derniereErreur = erreurDExecution;
            console.warn(`⚠️ Interruption détectée à la passe ${passe} :`, erreurDExecution.message);
        }

        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
            await window.attendrePause(2500);
        }

        if (succesPasse) {
            succesGlobal = true;
            console.log(`✅ Configuration Wi-Fi appliquée de manière sécurisée (validée à la passe ${passe}).`);
            break;
        } else if (passe === 1) {
            console.log("🔄 Lancement automatique de la deuxième passe pour finaliser...");
        } else {
            console.error("❌ Échec de la configuration complète du Wi-Fi après 2 tentatives.");
        }
    }

    if (!succesGlobal) {
        throw new Error(`Wi-Fi KO après 2 passes${derniereErreur ? " : " + derniereErreur.message : ""}`);
    }
};
