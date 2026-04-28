/* --- /push/box6/push_wifi.js --- */

window.executerWifi = async function() {
    console.log("⏳ Application des paramètres Wi-Fi (Box 6)...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.wifi) {
        console.warn("⚠️ Pas de données Wi-Fi trouvées à appliquer."); return;
    }

    /* Utilitaire pour contourner la perte de contexte (Stale DOM) lors du rechargement de l'iframe */
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

    /* Utilitaire pour attendre la fin stricte d'une sauvegarde (écran de chargement) */
    const attendreFinSauvegarde = async (iframeNode) => {
        console.log("⏳ Attente du traitement par la Livebox...");
        await new Promise(r => setTimeout(r, 2000)); // Laisse le temps à l'UI de se figer
        await new Promise((resolve) => {
            let intv = setInterval(() => {
                try {
                    let doc = iframeNode.contentDocument || iframeNode.contentWindow.document;
                    if (doc && doc.readyState === "complete") {
                        let loading = doc.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            clearInterval(intv); resolve();
                        }
                    }
                } catch(e) {}
            }, 1000);
            setTimeout(() => { clearInterval(intv); resolve(); }, 40000); // 40s max par sécurité
        });
        await new Promise(r => setTimeout(r, 1000)); // Tampon de sécurité final
    };

    /* ========================================================================= */
    /* BOUCLE DE ROBUSTESSE (2 PASSES) : Corrige les instabilités de la Livebox  */
    /* ========================================================================= */
    for (let passe = 1; passe <= 2; passe++) {
        console.log(`\n=========================================`);
        console.log(`▶️ DÉMARRAGE WI-FI - TENTATIVE ${passe}/2`);
        console.log(`=========================================`);
        
        let succesPasse = false;

        try {
            /* 1. CLIC SUR LE FOOTER (Réseau) */
            let btnReseau = await window.attendreElement("#sah_footer .icon-network", 10000);
            if (!btnReseau) throw new Error("Bouton Réseau introuvable dans le footer.");
            
            window.cliquerBouton("#sah_footer .icon-network");
            await window.attendrePause(1500); 

            /* 2. CIBLAGE STRICT DU VRAI WIDGET (Anti-Clones Swiper) */
            let selecteurVraiWidget = ".swiper-slide-active #wifiAdvanced_Fav, .swiper-slide-active .wifiAdvanced.selectable";
            let tuileActive = document.querySelector(selecteurVraiWidget);
            if (!tuileActive) selecteurVraiWidget = "#wifiAdvanced_Fav, .wifiAdvanced.selectable";
            
            console.log("👉 Clic sur le widget Wi-Fi...");
            window.cliquerBouton(selecteurVraiWidget);
            await window.attendrePause(2500);

            /* 3. GESTION DE L'IFRAME */
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
            if (lien24) {
                lien24.click();
                let inputSsid24 = await attendreElementIframeDynamique(iframe, "#wifi_private_ssid", 10000);
                
                if (inputSsid24) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    let configWifi = configurationActuelle.wifi;
                    
                    /* --- REMPLISSAGE 2.4 GHz --- */
                    if (configWifi.ssid) window.ecrireTexteDansDoc(docIframe, "#wifi_private_ssid", configWifi.ssid);
                    
                    if (configWifi["mot_de_passe"]) {
                        let mdpValide = typeof window.obtenirMotDePasseConforme === "function" ? await window.obtenirMotDePasseConforme(configWifi["mot_de_passe"], "Wi-Fi 2.4 GHz") : configWifi["mot_de_passe"];
                        if (mdpValide) window.ecrireTexteDansDoc(docIframe, "#wifi_private_securitykey", mdpValide);
                    }
                    
                    if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["diffusion_ssid"] !== "undefined") {
                        let cbDiffusion = docIframe.querySelector("#wifi_private_broadcastssid_id_1");
                        if (cbDiffusion && cbDiffusion.checked !== configWifi.wifi2_4["diffusion_ssid"]) cbDiffusion.click(); 
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
                        if (cbOled && cbOled.checked !== configWifi.wifi2_4["afficher_cle_ecran"]) cbOled.click();
                    }
                    
                    let lienAvance = docIframe.querySelector("#advanced_parameters_link");
                    if (lienAvance) {
                        if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
                        else lienAvance.click();
                        await window.attendrePause(500); 
                        
                        /* Paramétrage du Mode Wi-Fi */
                        if (configWifi.wifi2_4 && configWifi.wifi2_4.mode) {
                            let selectMode = docIframe.querySelector("#wifi_private_mode24");
                            if (selectMode) {
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
                        }
                        
                        if (configWifi.wifi2_4 && typeof configWifi.wifi2_4["filtrage_mac"] !== "undefined") {
                            let selectMac = docIframe.querySelector("#wifi_private_macfiltering_enable");
                            if (selectMac) {
                                selectMac.value = configWifi.wifi2_4["filtrage_mac"] ? "1" : "0";
                                selectMac.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                        }
                    }
                    
                    /* SAUVEGARDE 2.4 GHz */
                    let btnSave = docIframe.querySelector("#save");
                    if (btnSave) {
                        btnSave.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await window.attendrePause(500); 
                        
                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                        else btnSave.click();
                        
                        let btnConfirm = await attendreElementIframeDynamique(iframe, "#popup_confirm_submit", 3000);
                        if (btnConfirm) {
                            await window.attendrePause(500);
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnConfirm);
                            else btnConfirm.click();
                            
                            console.log("⏳ Enregistrement 2.4 GHz...");
                            await attendreFinSauvegarde(iframe); 
                        }
                    }
                }
            }

            /* --- CONFIGURATION 5 GHz --- */
            console.log("⏳ Transition vers la configuration 5 GHz...");
            await window.attendrePause(2000); // Laisse l'UI respirer
            
            let configWifiGbl = configurationActuelle.wifi;
            if (configWifiGbl && configWifiGbl.wifi5) {
                let etatBrut5 = configWifiGbl.wifi5["état"] !== undefined ? configWifiGbl.wifi5["état"] : configWifiGbl.wifi5["etat"];

                if (etatBrut5 !== undefined) {
                    let btnWifi5 = await attendreElementIframeDynamique(iframe, "button#wifi_accesspoint5", 15000);
                    if (!btnWifi5) throw new Error("Bouton Wi-Fi 5G perdu (Le DOM a été réinitialisé trop lourdement).");

                    let etatStr = String(etatBrut5).toLowerCase();
                    let etatVouluWifi5 = (etatStr === "activé" || etatStr === "true" || etatStr === "active" || etatStr === "1" || etatStr === "on");
                    let estActiveActuellement = btnWifi5.getAttribute("aria-pressed") === "true";
                    
                    if (estActiveActuellement !== etatVouluWifi5) {
                        console.log(`👉 Basculement de l'état du Wi-Fi 5 : ${estActiveActuellement ? "ON" : "OFF"} ➔ ${etatVouluWifi5 ? "ON" : "OFF"}`);
                        btnWifi5.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                
                if (inputSsid5) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    let configWifi = configurationActuelle.wifi;
                    
                    if (configWifi.wifi5.ssid) window.ecrireTexteDansDoc(docIframe, "#wifi_private_ssid", configWifi.wifi5.ssid);
                    
                    if (typeof configWifi.wifi5["diffusion_ssid"] !== "undefined") {
                        let cbDiffusion5 = docIframe.querySelector("#wifi_private_broadcastssid_id_1");
                        if (cbDiffusion5 && cbDiffusion5.checked !== configWifi.wifi5["diffusion_ssid"]) cbDiffusion5.click(); 
                    }
                    
                    if (configWifi.wifi5["mdp"]) {
                        let mdpValide5 = typeof window.obtenirMotDePasseConforme === "function" ? await window.obtenirMotDePasseConforme(configWifi.wifi5["mdp"], "Wi-Fi 5 GHz") : configWifi.wifi5["mdp"];
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
                            if (selectMac5) {
                                selectMac5.value = configWifi.wifi5["filtrage_mac"] ? "1" : "0";
                                selectMac5.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                        }
                    }
                    
                    /* SAUVEGARDE 5 GHz */
                    let btnSave5 = docIframe.querySelector("#save");
                    if (btnSave5) {
                        btnSave5.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await window.attendrePause(500);
                        
                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave5);
                        else btnSave5.click();
                        
                        let btnConfirm5 = await attendreElementIframeDynamique(iframe, "#popup_confirm_submit", 3000);
                        if (btnConfirm5) {
                            await window.attendrePause(500);
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnConfirm5);
                            else btnConfirm5.click();
                            
                            console.log("⏳ Enregistrement 5 GHz...");
                            await attendreFinSauvegarde(iframe);
                        }
                    }
                }
            }
            
            /* Si le code arrive jusqu'ici sans générer d'erreur (throw), la passe est un succès total ! */
            succesPasse = true; 

        } catch (erreurDExecution) {
            console.warn(`⚠️ Interruption détectée à la passe ${passe} :`, erreurDExecution.message);
        }

        /* Retour à l'accueil pour réinitialiser proprement le DOM de la Livebox entre les passes */
        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
            await window.attendrePause(2500);
        }

        /* Décision en fin de passe */
        if (succesPasse) {
            console.log(`✅ Configuration Wi-Fi appliquée de manière sécurisée (validée à la passe ${passe}).`);
            break; // On sort de la boucle, pas besoin de faire la passe 2 !
        } else if (passe === 1) {
            console.log("🔄 Lancement automatique de la deuxième passe pour finaliser...");
        } else {
            console.error("❌ Échec de la configuration complète du Wi-Fi après 2 tentatives.");
        }
    }
};