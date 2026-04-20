/* --- /push/box7/push_wifi.js --- */

/* 🚨 FIX: On attache explicitement la fonction à l'objet global 'window' */
window.executerWifi = async function() {
    console.log("⏳ Application des paramètres Wi-Fi (Livebox 7)...");

    /* 🚨 FIX ULTIME : Lecture directe et sécurisée depuis le localStorage avec la bonne clé ! */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    
    try {
        /* Si on trouve le string, on le parse. Sinon, on tente de récupérer la variable globale en secours */
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch(e) {
        console.error("❌ ERREUR: Le format JSON dans le LocalStorage est invalide.");
        return;
    }

    if (!configurationActuelle) {
        console.error("❌ ERREUR FATALE: Les données 'livebox_migration_config' sont introuvables dans le LocalStorage ! Avez-vous exécuté l'extraction ?");
        return;
    }

    if (!configurationActuelle.wifi) {
        console.error("❌ ERREUR: Le JSON ne contient pas la section 'wifi'. Module ignoré !");
        return;
    }

    /* --- DÉBUT DE LA LOGIQUE --- */
    let selecteurFooter = document.querySelector("#sah_footer .icon-wifi") ? "#sah_footer .icon-wifi" : "#sah_footer .icon-network";
    console.log("👉 Recherche du bouton footer: " + selecteurFooter);
    
    let btnReseau = await window.attendreElement(selecteurFooter, 10000);
    
    if (btnReseau) {
        window.cliquerBouton(selecteurFooter);
        await window.attendrePause(800); 
        
        let conteneurWifi = await window.attendreElement("#wifiAdvanced", 10000);
        
        if (conteneurWifi) {
            conteneurWifi.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(300);
            
            console.log("👉 [Livebox 7] Clic sur le widget...");
            window.cliquerBouton("#wifiAdvanced .widget");
            await window.attendrePause(200);
            let titreWifi = document.querySelector("#wifiAdvancedTitle");
            if (titreWifi) window.cliquerBouton(titreWifi);
            
            console.log("🔍 Recherche de l'Iframe...");
            let iframe = await window.attendreElement("#iframeapp", 10000);
            
            if (iframe) {
                console.log("✅ Iframe trouvée ! Attente du chargement de la page interne...");
                
                let docIframe = null;
                let btnActivation24 = null;
                let tentatives = 0;
                
                while (tentatives < 20) { 
                    await window.attendrePause(500);
                    try {
                        docIframe = iframe.contentDocument || iframe.contentWindow.document;
                        if (docIframe) {
                            btnActivation24 = docIframe.querySelector("#wifi_accesspoint24, #wifi_accesspointboth");
                            if (btnActivation24) break; 
                        }
                    } catch(e) {}
                    tentatives++;
                }

                if (btnActivation24) {
                    console.log("✅ Page Wi-Fi chargée !");
                    
                    let estActive = btnActivation24.getAttribute("aria-pressed") === "true";
                    
                    if (!estActive) {
                        console.log("🔄 Allumage du Wi-Fi 2.4 GHz...");
                        btnActivation24.click();
                        await window.attendrePause(800);
                    }
                    
                    let lien24 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint24_link, #wifi_accesspointboth", 5000);
                    if (lien24) {
                        console.log("👉 Entrée dans la configuration 2.4 GHz...");
                        lien24.click();
                        
                        let inputSsid24 = await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 5000);
                        if (inputSsid24) {
                            docIframe = iframe.contentDocument || iframe.contentWindow.document;
                            let configWifi = configurationActuelle.wifi;
                            
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
                                await window.attendrePause(300); 
                                
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
                                let btnConfirm = await window.attendreElementDansDoc(docIframe, "#popup_confirm_submit", 3000);
                                if (btnConfirm) {
                                    btnConfirm.click();
                                    await window.attendreFinSauvegarde(docIframe); 
                                }
                            }
                        }
                        
                        /* --- 5 GHz --- */
                        console.log("⏳ Recherche du lien 5 GHz...");
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
                                    let btnConfirm5 = await window.attendreElementDansDoc(docIframe, "#popup_confirm_submit", 3000);
                                    if (btnConfirm5) {
                                        btnConfirm5.click();
                                        await window.attendreFinSauvegarde(docIframe);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.error("❌ ERREUR : La page interne Wi-Fi n'a pas pu être lue !");
                }
            }
        }
    } else {
        console.error("❌ ERREUR: Le bouton Footer réseau n'a pas été trouvé. Délais dépassé !");
    }
    
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
    }
};