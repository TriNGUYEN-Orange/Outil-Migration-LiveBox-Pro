/* --- /push/box6/push_wifi.js --- */

window.executerWifi = async function() {
    console.log("⏳ Application des paramètres Wi-Fi (Box 6) - Fix Sauvegarde (cliquerPur)...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.wifi) {
        console.warn("⚠️ Pas de données Wi-Fi trouvées à appliquer."); return;
    }

    /* 1. CLIC SUR LE FOOTER (Réseau) */
    let btnReseau = await window.attendreElement("#sah_footer .icon-network", 10000);
    if (btnReseau) {
        window.cliquerBouton("#sah_footer .icon-network");
        await window.attendrePause(1500); 

        /* 2. CIBLAGE STRICT DU VRAI WIDGET (Anti-Clones Swiper) */
        let selecteurVraiWidget = 
            ".swiper-slide-active #wifiAdvanced_Fav, " +
            ".swiper-slide-active .wifiAdvanced.selectable";

        let tuileActive = document.querySelector(selecteurVraiWidget);
        if (!tuileActive) {
            selecteurVraiWidget = "#wifiAdvanced_Fav, .wifiAdvanced.selectable";
        }
        
        console.log("👉 Clic sur le widget : " + selecteurVraiWidget);
        window.cliquerBouton(selecteurVraiWidget);
        await window.attendrePause(2500);

        /* 3. GESTION DE L'IFRAME */
        let iframe = await window.attendreElement("#iframeapp", 15000);
        if (iframe) {
            console.log("⏳ Attente de chargement de l'iframe...");
            await new Promise((resolve) => {
                let intervalle = setInterval(() => {
                    try {
                        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                        if (docIframe && docIframe.readyState === "complete") {
                            let loading = docIframe.querySelector("body > div.loading_screen");
                            if (!loading || window.getComputedStyle(loading).display === "none") {
                                clearInterval(intervalle); resolve();
                            }
                        }
                    } catch(e) {}
                }, 300);
                setTimeout(() => { clearInterval(intervalle); resolve(); }, 15000);
            });
            await window.attendrePause(500); 

            let docIframe = iframe.contentDocument || iframe.contentWindow.document;
            let btnActivation24 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint24, #wifi_accesspointboth", 5000);

            if (btnActivation24) {
                console.log("✅ Page Wi-Fi chargée !");
                
                let estActive = btnActivation24.getAttribute("aria-pressed") === "true";
                if (!estActive) {
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnActivation24);
                    else btnActivation24.click();
                    await window.attendrePause(1000);
                }
                
                let lien24 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint24_link, #wifi_accesspointboth", 5000);
                if (lien24) {
                    lien24.click();
                    
                    let inputSsid24 = await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 5000);
                    if (inputSsid24) {
                        docIframe = iframe.contentDocument || iframe.contentWindow.document;
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
                        
                        /* ✅ FIX: Utilisation de cliquerPur() pour forcer la sauvegarde 2.4G */
                        let btnSave = docIframe.querySelector("#save");
                        if (btnSave) {
                            btnSave.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            await window.attendrePause(500); // Laisse l'UI s'activer
                            
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                            else btnSave.click();
                            
                            let btnConfirm = await window.attendreElementDansDoc(docIframe, "#popup_confirm_submit", 3000);
                            if (btnConfirm) {
                                await window.attendrePause(500);
                                if (typeof window.cliquerPur === "function") window.cliquerPur(btnConfirm);
                                else btnConfirm.click();
                                
                                console.log("⏳ Sauvegarde 2.4 GHz en cours... Attente (60s max)...");
                                await new Promise((resolve) => {
                                    let intv = setInterval(() => {
                                        try {
                                            let currentDoc = iframe.contentDocument || iframe.contentWindow.document;
                                            if (currentDoc) {
                                                let loading = currentDoc.querySelector("body > div.loading_screen");
                                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                                    clearInterval(intv); resolve();
                                                }
                                            }
                                        } catch(e) {}
                                    }, 1000);
                                    setTimeout(() => { clearInterval(intv); resolve(); }, 60000);
                                });
                                await window.attendrePause(2000); 
                            }
                        }
                    } // Fin Remplissage 2.4GHz
                    
                    /* --- Configuration 5 GHz --- */
                    await window.attendrePause(1000);
                    docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    let lien5 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint5_link_txt, #wifi_accesspoint5_link", 5000);
                    
                    if (lien5) {
                        lien5.click();
                        let inputSsid5 = await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 5000);
                        
                        if (inputSsid5) {
                            docIframe = iframe.contentDocument || iframe.contentWindow.document;
                            let configWifi = configurationActuelle.wifi;
                            
                            if (configWifi.wifi5 && configWifi.wifi5.ssid) window.ecrireTexteDansDoc(docIframe, "#wifi_private_ssid", configWifi.wifi5.ssid);
                            
                            if (configWifi.wifi5 && typeof configWifi.wifi5["diffusion_ssid"] !== "undefined") {
                                let cbDiffusion5 = docIframe.querySelector("#wifi_private_broadcastssid_id_1");
                                if (cbDiffusion5 && cbDiffusion5.checked !== configWifi.wifi5["diffusion_ssid"]) cbDiffusion5.click(); 
                            }
                            
                            if (configWifi.wifi5 && configWifi.wifi5["mdp"]) {
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
                                
                                if (configWifi.wifi5 && typeof configWifi.wifi5["filtrage_mac"] !== "undefined") {
                                    let selectMac5 = docIframe.querySelector("#wifi_private_macfiltering_enable");
                                    if (selectMac5) {
                                        selectMac5.value = configWifi.wifi5["filtrage_mac"] ? "1" : "0";
                                        selectMac5.dispatchEvent(new Event("change", { bubbles: true }));
                                    }
                                }
                            }
                            
                            /* ✅ FIX: Utilisation de cliquerPur() pour forcer la sauvegarde 5G */
                            let btnSave5 = docIframe.querySelector("#save");
                            if (btnSave5) {
                                btnSave5.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                await window.attendrePause(500);
                                
                                if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave5);
                                else btnSave5.click();
                                
                                let btnConfirm5 = await window.attendreElementDansDoc(docIframe, "#popup_confirm_submit", 3000);
                                if (btnConfirm5) {
                                    await window.attendrePause(500);
                                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnConfirm5);
                                    else btnConfirm5.click();
                                    
                                    console.log("⏳ Sauvegarde 5 GHz en cours...");
                                    await new Promise((resolve) => {
                                        let intv = setInterval(() => {
                                            try {
                                                let currentDoc = iframe.contentDocument || iframe.contentWindow.document;
                                                if (currentDoc) {
                                                    let loading = currentDoc.querySelector("body > div.loading_screen");
                                                    if (!loading || window.getComputedStyle(loading).display === "none") {
                                                        clearInterval(intv); resolve();
                                                    }
                                                }
                                            } catch(e) {}
                                        }, 1000);
                                        setTimeout(() => { clearInterval(intv); resolve(); }, 60000);
                                    });
                                    await window.attendrePause(2000);
                                }
                            }
                        } // Fin if (inputSsid5)
                    } // Fin if (lien5)
                } // Fin if (lien24)
            } else {
                console.error("❌ ERREUR : La page interne Wi-Fi n'a pas pu être lue ! (Bouton d'activation introuvable)");
            }
        } else {
            console.error("❌ ERREUR : L'iframe n'est jamais apparue !");
        }
    } else {
        console.error("❌ ERREUR: Le bouton Footer réseau n'a pas été trouvé.");
    }
    
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
    }
};