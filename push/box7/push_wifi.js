/* --- /push/box7/push_wifi.js --- */

window.trouverIframeApp = window.trouverIframeApp || async function(timeout = 20000) {
    const selectors = [
        "#iframeapp",
        "iframe#iframeapp",
        "#iframeApp",
        "iframe[id*='iframe'][id*='app']",
        "#content iframe",
        "iframe[src*='wifi']",
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

window.executerWifi = async function() {
    try {
        console.log("⏳ Application des paramètres Wi-Fi (Livebox 7)...");

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
            throw new Error("Configuration introuvable: ni localStorage ni window.configLivebox.");
        }

        if (!configurationActuelle.wifi) {
            throw new Error("Section Wi-Fi absente dans la configuration.");
        }

        let selecteurFooter = document.querySelector("#sah_footer .icon-wifi")
            ? "#sah_footer .icon-wifi"
            : "#sah_footer .icon-network";

        console.log("👉 Recherche du bouton footer: " + selecteurFooter);

        let btnReseau = await window.attendreElement(selecteurFooter, 10000);
        if (!btnReseau) throw new Error("Bouton réseau introuvable (" + selecteurFooter + ").");

        window.cliquerBouton(selecteurFooter);
        await window.attendrePause(900);

        let conteneurWifi = await window.attendreElement("#wifiAdvanced", 10000);
        if (!conteneurWifi) throw new Error("Bloc Wi-Fi introuvable dans le dashboard (#wifiAdvanced).");

        conteneurWifi.scrollIntoView({ behavior: "smooth", block: "center" });
        await window.attendrePause(350);

        // Ouvre le widget Wi-Fi
        console.log("👉 [Livebox 7] Clic sur le widget...");
        window.cliquerBouton("#wifiAdvanced .widget");
        await window.attendrePause(300);
        let titreWifi = document.querySelector("#wifiAdvancedTitle");
        if (titreWifi) window.cliquerBouton(titreWifi);

        // Iframe robuste + retry
        console.log("🔍 Recherche robuste de l'iframe Wi-Fi...");
        let iframe = null;
        for (let t = 1; t <= 3; t++) {
            iframe = await window.trouverIframeApp(8000);
            if (iframe) break;

            console.warn(`⚠️ Iframe Wi-Fi non trouvée (tentative ${t}/3). Re-clic widget...`);
            window.cliquerBouton("#wifiAdvanced .widget");
            await window.attendrePause(1200);
            if (titreWifi) window.cliquerBouton(titreWifi);
            await window.attendrePause(500);
        }
        if (!iframe) throw new Error("Iframe Wi-Fi introuvable après 3 tentatives.");

        // Attente chargement iframe (souple)
        await new Promise((resolve) => {
            let done = false;
            const stop = () => { if (!done) { done = true; clearInterval(iv); resolve(); } };

            const iv = setInterval(() => {
                try {
                    const d = iframe.contentDocument || iframe.contentWindow.document;
                    if (d && (d.readyState === "interactive" || d.readyState === "complete")) {
                        const loading = d.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            stop();
                        }
                    }
                } catch (e) {}
            }, 300);

            setTimeout(stop, 20000);
        });

        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
        if (!docIframe) throw new Error("Document iframe Wi-Fi inaccessible.");

        // Attente composants Wi-Fi
        let btnActivation24 = null;
        let tentatives = 0;
        while (tentatives < 20) {
            await window.attendrePause(400);
            try {
                docIframe = iframe.contentDocument || iframe.contentWindow.document;
                if (docIframe) {
                    btnActivation24 = docIframe.querySelector("#wifi_accesspoint24, #wifi_accesspointboth");
                    if (btnActivation24) break;
                }
            } catch (e) {}
            tentatives++;
        }

        if (!btnActivation24) {
            throw new Error("Composants Wi-Fi 2.4 GHz introuvables dans l'iframe (#wifi_accesspoint24 / #wifi_accesspointboth).");
        }

        console.log("✅ Page Wi-Fi chargée !");
        let estActive = btnActivation24.getAttribute("aria-pressed") === "true";

        if (!estActive) {
            console.log("🔄 Allumage du Wi-Fi 2.4 GHz...");
            btnActivation24.click();
            await window.attendrePause(800);
        }

        // --------- 2.4 GHz ---------
        let lien24 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint24_link, #wifi_accesspointboth", 6000);
        if (!lien24) {
            throw new Error("Lien configuration 2.4 GHz introuvable (#wifi_accesspoint24_link / #wifi_accesspointboth).");
        }

        console.log("👉 Entrée dans la configuration 2.4 GHz...");
        lien24.click();

        let inputSsid24 = await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 6000);
        if (!inputSsid24) {
            throw new Error("Champ SSID 2.4 GHz introuvable (#wifi_private_ssid).");
        }

        docIframe = iframe.contentDocument || iframe.contentWindow.document;
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
            if (cbDiffusion && cbDiffusion.checked !== configWifi.wifi2_4["diffusion_ssid"]) cbDiffusion.click();
        }

        let selectDiff = docIframe.querySelector("#wifi_private_different_ssid");
        if (selectDiff) {
            selectDiff.value = "0";
            selectDiff.dispatchEvent(new Event("change", { bubbles: true }));
            await window.attendrePause(300);
        }

        if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["afficher_cle_ecran"] !== "undefined") {
            let cbOled = docIframe.querySelector("#wifi_private_oledSecurityKey_1");
            if (cbOled && cbOled.checked !== configWifi.wifi2_4["afficher_cle_ecran"]) cbOled.click();
        }

        let lienAvance = docIframe.querySelector("#advanced_parameters_link");
        if (lienAvance) {
            lienAvance.click();
            await window.attendrePause(350);

            if (configWifi.wifi2_4 && configWifi.wifi2_4.mode) {
                let selectMode = docIframe.querySelector("#wifi_private_mode24");
                if (selectMode) {
                    let modeVoulu = configWifi.wifi2_4.mode.toLowerCase().replace(/[^a-z0-9]/gi, "");
                    let options = Array.from(selectMode.options);
                    let optionTrouvee = options.find(opt => {
                        let val = opt.value.toLowerCase().replace(/[^a-z0-9]/gi, "");
                        let txt = opt.text.toLowerCase().replace(/[^a-z0-9]/gi, "");
                        return val === modeVoulu || txt.includes(modeVoulu);
                    });
                    if (optionTrouvee) {
                        selectMode.value = optionTrouvee.value;
                        selectMode.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }
            }

            if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["filtrage_mac"] !== "undefined") {
                let selectMac = docIframe.querySelector("#wifi_private_macfiltering_enable");
                if (selectMac) {
                    selectMac.value = configWifi.wifi2_4["filtrage_mac"] ? "1" : "0";
                    selectMac.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
        }

        let btnSave = docIframe.querySelector("#save");
        if (btnSave) {
            console.log("💾 Sauvegarde 2.4 GHz...");
            btnSave.click();
            let btnConfirm = await window.attendreElementDansDoc(docIframe, "#popup_confirm_submit", 4000);
            if (btnConfirm) {
                btnConfirm.click();
                await window.attendreFinSauvegarde(docIframe);
            }
        }

        // --------- 5 GHz (optionnel non bloquant) ---------
        console.log("⏳ Recherche du lien 5 GHz...");
        await window.attendrePause(1000);

        docIframe = iframe.contentDocument || iframe.contentWindow.document;
        let lien5 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint5_link_txt, #wifi_accesspoint5_link", 6000);

        if (lien5) {
            lien5.click();
            let inputSsid5 = await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 6000);

            if (inputSsid5) {
                docIframe = iframe.contentDocument || iframe.contentWindow.document;
                configWifi = configurationActuelle.wifi;

                if (configWifi.wifi5 && configWifi.wifi5.ssid) {
                    window.ecrireTexteDansDoc(docIframe, "#wifi_private_ssid", configWifi.wifi5.ssid);
                }

                if (configWifi.wifi5 && typeof configWifi.wifi5["diffusion_ssid"] !== "undefined") {
                    let cbDiffusion5 = docIframe.querySelector("#wifi_private_broadcastssid_id_1");
                    if (cbDiffusion5 && cbDiffusion5.checked !== configWifi.wifi5["diffusion_ssid"]) cbDiffusion5.click();
                }

                if (configWifi.wifi5 && configWifi.wifi5["mdp"]) {
                    let mdpValide5 = typeof window.obtenirMotDePasseConforme === "function"
                        ? await window.obtenirMotDePasseConforme(configWifi.wifi5["mdp"], "Wi-Fi 5 GHz")
                        : configWifi.wifi5["mdp"];
                    if (mdpValide5) window.ecrireTexteDansDoc(docIframe, "#wifi_private_securitykey", mdpValide5);
                }

                let cbOled5 = docIframe.querySelector("#wifi_private_oledSecurityKey_1");
                if (cbOled5 && !cbOled5.checked) cbOled5.click();

                let selectDiff5 = docIframe.querySelector("#wifi_private_different_ssid");
                if (selectDiff5 && typeof configWifi["differencier_reseaux"] !== "undefined") {
                    selectDiff5.value = configWifi["differencier_reseaux"] ? "0" : "1";
                    selectDiff5.dispatchEvent(new Event("change", { bubbles: true }));
                }

                if (configWifi.wifi5 && typeof configWifi.wifi5["filtrage_mac"] !== "undefined") {
                    let selectMac5 = docIframe.querySelector("#wifi_private_macfiltering_enable");
                    if (selectMac5) {
                        selectMac5.value = configWifi.wifi5["filtrage_mac"] ? "1" : "0";
                        selectMac5.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }

                let btnSave5 = docIframe.querySelector("#save");
                if (btnSave5) {
                    btnSave5.click();
                    let btnConfirm5 = await window.attendreElementDansDoc(docIframe, "#popup_confirm_submit", 4000);
                    if (btnConfirm5) {
                        btnConfirm5.click();
                        await window.attendreFinSauvegarde(docIframe);
                    }
                }
            } else {
                console.warn("⚠️ Champ SSID 5 GHz introuvable (#wifi_private_ssid). Étape 5 GHz ignorée.");
            }
        } else {
            console.warn("⚠️ Lien configuration 5 GHz introuvable (#wifi_accesspoint5_link_txt / #wifi_accesspoint5_link). Étape 5 GHz ignorée.");
        }

        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
        }

    } catch (e) {
        throw new Error("Échec module Wi-Fi: " + (e?.message || "Erreur inconnue"));
    }
};
