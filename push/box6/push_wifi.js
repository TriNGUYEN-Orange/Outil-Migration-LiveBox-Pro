/* --- /push/box6/push_wifi.js --- */

window.executerWifi = async function() {
    console.log("⏳ Application des paramètres Wi-Fi (Box 6)...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch (e) {
        throw new Error("Configuration JSON invalide (Wi-Fi).");
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
            }, 500);
        });
    };

    const attendreFinSauvegarde = async (iframeNode) => {
        console.log("⏳ Attente du traitement par la Livebox...");
        await new Promise(r => setTimeout(r, 2000));
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
            }, 1000);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intv);
                    reject(new Error("Timeout: fin de sauvegarde Wi-Fi non confirmée."));
                }
            }, 40000);
        });
        await new Promise(r => setTimeout(r, 1000));
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

            if (configWifi.ssid) window.ecrireTexteDansDoc(docIframe, "#wifi_private_ssid", configWifi.ssid);

            if (configWifi["mot_de_passe"]) {
                let mdpValide = typeof window.obtenirMotDePasseConforme === "function"
                    ? await window.obtenirMotDePasseConforme(configWifi["mot_de_passe"], "Wi-Fi 2.4 GHz")
                    : configWifi["mot_de_passe"];
                if (mdpValide) window.ecrireTexteDansDoc(docIframe, "#wifi_private_securitykey", mdpValide);
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

            let btnSave = docIframe.querySelector("#save");
            if (!btnSave) throw new Error("Bouton save 2.4G introuvable (#save).");

            btnSave.scrollIntoView({ behavior: "smooth", block: "center" });
            await window.attendrePause(500);

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
            else btnSave.click();

            let btnConfirm = await attendreElementIframeDynamique(iframe, "#popup_confirm_submit", 3000);
            if (btnConfirm) {
                await window.attendrePause(500);
                if (typeof window.cliquerPur === "function") window.cliquerPur(btnConfirm);
                else btnConfirm.click();
            }

            console.log("⏳ Enregistrement 2.4 GHz...");
            await attendreFinSauvegarde(iframe);

            console.log("⏳ Transition vers la configuration 5 GHz...");
            await window.attendrePause(2000);

            let configWifiGbl = configurationActuelle.wifi;
            if (configWifiGbl && configWifiGbl.wifi5) {
                let etatBrut5 = configWifiGbl.wifi5["état"] !== undefined ? configWifiGbl.wifi5["état"] : configWifiGbl.wifi5["etat"];

                if (etatBrut5 !== undefined) {
                    let btnWifi5 = await attendreElementIframeDynamique(iframe, "button#wifi_accesspoint5", 15000);
                    if (!btnWifi5) throw new Error("Bouton Wi-Fi 5G perdu (DOM réinitialisé).");

                    let etatStr = String(etatBrut5).toLowerCase();
                    let etatVouluWifi5 = (etatStr === "activé" || etatStr === "true" || etatStr === "active" || etatStr === "1" || etatStr === "on");
                    let estActiveActuellement = btnWifi5.getAttribute("aria-pressed") === "true";

                    if (estActiveActuellement !== etatVouluWifi5) {
                        console.log(`👉 Basculement de l'état du Wi-Fi 5 : ${estActiveActuellement ? "ON" : "OFF"} ➔ ${etatVouluWifi5 ? "ON" : "OFF"}`);
                        btnWifi5.scrollIntoView({ behavior: "smooth", block: "center" });
                        await window.attendrePause(500);

                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnWifi5);
                        else btnWifi5.click();

                        await attendreFinSauvegarde(iframe);
                        console.log("✅ État du Wi-Fi 5 mis à jour !");
                    }
                }

                let lien5 = await attendreElementIframeDynamique(iframe, "#wifi_accesspoint5_link_txt, #wifi_accesspoint5_link", 10000);
                if (!lien5) throw new Error("Lien de configuration Wi-Fi 5G introuvable.");

                lien5.click();
                let inputSsid5 = await attendreElementIframeDynamique(iframe, "#wifi_private_ssid", 10000);
                if (!inputSsid5) throw new Error("Champ SSID 5G introuvable.");

                docIframe = iframe.contentDocument || iframe.contentWindow.document;
                if (!docIframe) throw new Error("Document iframe inaccessible pendant config 5G.");
                let configWifi = configurationActuelle.wifi;

                if (configWifi.wifi5.ssid) window.ecrireTexteDansDoc(docIframe, "#wifi_private_ssid", configWifi.wifi5.ssid);

                if (typeof configWifi.wifi5["diffusion_ssid"] !== "undefined") {
                    let cbDiffusion5 = docIframe.querySelector("#wifi_private_broadcastssid_id_1");
                    if (!cbDiffusion5) throw new Error("Champ diffusion SSID 5G introuvable.");
                    if (cbDiffusion5.checked !== configWifi.wifi5["diffusion_ssid"]) cbDiffusion5.click();
                }

                if (configWifi.wifi5["mdp"]) {
                    let mdpValide5 = typeof window.obtenirMotDePasseConforme === "function"
                        ? await window.obtenirMotDePasseConforme(configWifi.wifi5["mdp"], "Wi-Fi 5 GHz")
                        : configWifi.wifi5["mdp"];
                    if (mdpValide5) window.ecrireTexteDansDoc(docIframe, "#wifi_private_securitykey", mdpValide5);
                }

                let cbOled5 = docIframe.querySelector("#wifi_private_oledSecurityKey_1");
                if (cbOled5 && !cbOled5.checked) cbOled5.click();

                let selectDiff5 = docIframe.querySelector("#wifi_private_different_ssid");
                if (selectDiff5 && typeof configWifi["differencier_reseaux"] !== "undefined") {
                    selectDiff5.value = "0";
                    selectDiff5.dispatchEvent(new Event("change", { bubbles: true }));
                }

                let lienAvance5 = docIframe.querySelector("#advanced_parameters_link");
                if (lienAvance5) {
                    if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance5);
                    else lienAvance5.click();
                    await window.attendrePause(500);

                    if (typeof configWifi.wifi5["filtrage_mac"] !== "undefined") {
                        let selectMac5 = docIframe.querySelector("#wifi_private_macfiltering_enable");
                        if (!selectMac5) throw new Error("Select filtrage MAC 5G introuvable.");
                        selectMac5.value = configWifi.wifi5["filtrage_mac"] ? "1" : "0";
                        selectMac5.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }

                let btnSave5 = docIframe.querySelector("#save");
                if (!btnSave5) throw new Error("Bouton save 5G introuvable (#save).");

                btnSave5.scrollIntoView({ behavior: "smooth", block: "center" });
                await window.attendrePause(500);

                if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave5);
                else btnSave5.click();

                let btnConfirm5 = await attendreElementIframeDynamique(iframe, "#popup_confirm_submit", 3000);
                if (btnConfirm5) {
                    await window.attendrePause(500);
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnConfirm5);
                    else btnConfirm5.click();
                }

                console.log("⏳ Enregistrement 5 GHz...");
                await attendreFinSauvegarde(iframe);
            }

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
