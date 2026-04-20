/* --- /push/box7/push_airbox.js --- */

window.executerAirbox = async function() {
    console.log("⏳ Application des paramètres Airbox...");

    /* 🚨 Lecture directe depuis le localStorage */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch(e) {
        console.error("❌ ERREUR: Le format JSON dans le LocalStorage est invalide.");
        return;
    }

    if (!configurationActuelle || !configurationActuelle.airbox) {
        console.warn("⚠️ Pas de données Airbox trouvées à appliquer. Module ignoré !");
        return;
    }

    let configAirbox = configurationActuelle.airbox;
    
    let btnSupport = await window.attendreElement("#sah_footer .icon-support", 10000);
    
    if (btnSupport) {
        window.cliquerBouton("#sah_footer .icon-support");
        await window.attendrePause(1000); 
        
        let tuileAirbox = await window.attendreElement("#airbox", 10000);
        if (tuileAirbox) {
            tuileAirbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            window.cliquerBouton("#airbox .widget");
            
            let iframe = await window.attendreElement("#iframeapp", 10000);
            if (iframe) {
                
                const selectionnerAvecSecurite = (docIframe, selecteur, valeurVoulue, valeurDefaut) => {
                    let selectElem = docIframe.querySelector(selecteur);
                    if (selectElem) {
                        let options = Array.from(selectElem.options);
                        let cible = valeurVoulue ? valeurVoulue.toLowerCase() : "";
                        let optionTrouvee = options.find(opt => opt.value.toLowerCase() === cible || opt.text.toLowerCase() === cible) || options.find(opt => opt.value.toLowerCase() === valeurDefaut.toLowerCase() || opt.text.toLowerCase() === valeurDefaut.toLowerCase());
                        if (optionTrouvee) {
                            selectElem.value = optionTrouvee.value;
                            selectElem.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                };

                let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                let radioActive = await window.attendreElementDansDoc(docIframe, "#airbox_activation_status_activated", 10000);
                let etatInitial = (radioActive && radioActive.checked) ? "activé" : "désactivé";

                if (etatInitial === "désactivé" && radioActive) {
                    radioActive.click();
                    await window.attendrePause(2000);
                }

                if (configAirbox["mot de passe administrateur"]) window.ecrireTexteDansDoc(docIframe, "#password_value", configAirbox["mot de passe administrateur"]);
                if (configAirbox["code pin"]) window.ecrireTexteDansDoc(docIframe, "#pincode_value", configAirbox["code pin"]);

                let lienAvance = docIframe.querySelector("#advanced_settings_link > span") || docIframe.querySelector("#advanced_settings_link");
                if (lienAvance) {
                    lienAvance.click();
                    await window.attendrePause(1000);

                    selectionnerAvecSecurite(docIframe, "#networkMode", configAirbox["mode réseau"], "Auto 2G/3G/4G");
                    selectionnerAvecSecurite(docIframe, "#interferences", configAirbox["réduction d'interférences"], "Aucune");
                    selectionnerAvecSecurite(docIframe, "#rescue_activation", configAirbox["activer l'accès de secours après"], "1min 30");
                    selectionnerAvecSecurite(docIframe, "#rescue_deactivation", configAirbox["désactiver l'accès de secours après"], "5min");

                    let btnWifiReprise = docIframe.querySelector("#wifi_settings_retrieve");
                    if (btnWifiReprise && configAirbox["reprise des paramètres WiFi"]) {
                        let etatVoulu = configAirbox["reprise des paramètres WiFi"].toLowerCase() === "activé" || configAirbox["reprise des paramètres WiFi"] === "true";
                        let estActuelActive = btnWifiReprise.getAttribute("aria-pressed") === "true" || btnWifiReprise.checked || (btnWifiReprise.innerText && btnWifiReprise.innerText.includes("ON"));
                        if (estActuelActive !== etatVoulu) btnWifiReprise.click();
                    }

                    if (configAirbox["nom de l'APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_name_value", configAirbox["nom de l'APN"]);
                    if (configAirbox["identifiant APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_id_value", configAirbox["identifiant APN"]);
                    if (configAirbox["mot de passe APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_password_value", configAirbox["mot de passe APN"]);
                }

                let btnSave = docIframe.querySelector("#save");
                if (btnSave) {
                    btnSave.click();
                    await window.attendreFinSauvegarde(docIframe);
                    await window.attendreFinSauvegarde(document); 
                }

                if (etatInitial === "désactivé") {
                    let btnDesactiver = await window.attendreElementDansDoc(docIframe, "#airbox_activation_status_deactivated", 5000);
                    if (btnDesactiver) {
                        btnDesactiver.click();
                        await window.attendrePause(1000);
                        let docFinal = iframe.contentDocument || iframe.contentWindow.document;
                        let btnSaveFinal = docFinal ? docFinal.querySelector("#save") : null;
                        if (btnSaveFinal) {
                            btnSaveFinal.click();
                            await window.attendreFinSauvegarde(docFinal);
                            await window.attendreFinSauvegarde(document);
                        }
                    }
                }
                
                let btnHome = document.querySelector("#sah_footer .icon-home");
                if (btnHome) window.cliquerBouton(btnHome);
                else await window.retournerAccueil();
            }
        }
    }
    
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
    }
};