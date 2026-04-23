/* --- /push/box6/push_airbox.js --- */

window.executerAirbox = async function() {
    console.log("⏳ Application des paramètres Airbox (Box 6)...");

    /* 1. Lecture de la configuration */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.airbox) {
        console.warn("⚠️ Pas de données Airbox trouvées à appliquer."); return;
    }

    let configAirbox = configurationActuelle.airbox;

    /* 2. Navigation vers l'onglet Support */
    let btnSupport = await window.attendreElement("#sah_footer .icon-support", 10000);
    
    if (btnSupport) {
        window.cliquerBouton("#sah_footer .icon-support");
        await window.attendrePause(1500); 
        
        /* 3. Recherche de la tuile Airbox */
        let tuileAirbox = await window.attendreElement("#airbox", 10000);
        if (tuileAirbox) {
            tuileAirbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500);
            
            console.log("👉 Clic sur la tuile Airbox...");
            let widget = tuileAirbox.querySelector(".widget");
            window.cliquerBouton(widget ? widget : tuileAirbox);
            
            /* 4. Attente de l'iframe avec anti-freeze */
            let iframe = await window.attendreElement("#iframeapp", 15000);
            if (iframe) {
                console.log("⏳ Attente du chargement complet de l'iframe...");
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
                    }, 500);
                    setTimeout(() => { clearInterval(intervalle); resolve(); }, 15000);
                });
                await window.attendrePause(500); 

                /* --- DÉBUT CONFIGURATION AIRBOX --- */
                let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                
                const selectionnerAvecSecurite = (doc, selecteur, valeurVoulue, valeurDefaut) => {
                    let selectElem = doc.querySelector(selecteur);
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
                // Si aucune clé d'état n'existe dans le JSON, on suppose qu'il faut l'activer par défaut
                if(!etatTrouveDansJson) veutEtreActifJson = true;

                /* Vérifier l'état actuel de la box */
                let radioActive = await window.attendreElementDansDoc(docIframe, "#airbox_activation_status_activated", 10000);
                let estActuellementActif = (radioActive && radioActive.checked);

                /* Si désactivé, on l'active temporairement pour faire apparaître les champs */
                if (!estActuellementActif && radioActive) {
                    console.log("👉 Activation temporaire pour afficher les paramètres...");
                    if (typeof window.cliquerPur === "function") window.cliquerPur(radioActive);
                    else radioActive.click();
                    await window.attendrePause(2000);
                }

                /* Remplissage des champs de base */
                if (configAirbox["mot de passe administrateur"]) window.ecrireTexteDansDoc(docIframe, "#password_value", configAirbox["mot de passe administrateur"]);
                if (configAirbox["code pin"]) window.ecrireTexteDansDoc(docIframe, "#pincode_value", configAirbox["code pin"]);

                /* Paramètres Avancés */
                let lienAvance = docIframe.querySelector("#advanced_settings_link > span") || docIframe.querySelector("#advanced_settings_link");
                if (lienAvance) {
                    if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
                    else lienAvance.click();
                    await window.attendrePause(1000);

                    selectionnerAvecSecurite(docIframe, "#networkMode", configAirbox["mode réseau"], "Auto 2G/3G/4G");
                    selectionnerAvecSecurite(docIframe, "#interferences", configAirbox["réduction d'interférences"], "Aucune");
                    selectionnerAvecSecurite(docIframe, "#rescue_activation", configAirbox["activer l'accès de secours après"], "1min 30");
                    selectionnerAvecSecurite(docIframe, "#rescue_deactivation", configAirbox["désactiver l'accès de secours après"], "5min");

                    let btnWifiReprise = docIframe.querySelector("#wifi_settings_retrieve");
                    if (btnWifiReprise && configAirbox["reprise des paramètres WiFi"]) {
                        let etatVoulu = configAirbox["reprise des paramètres WiFi"].toLowerCase() === "activé" || configAirbox["reprise des paramètres WiFi"] === "true";
                        let estActuelActive = btnWifiReprise.getAttribute("aria-pressed") === "true" || btnWifiReprise.checked || (btnWifiReprise.innerText && btnWifiReprise.innerText.includes("ON"));
                        if (estActuelActive !== etatVoulu) {
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnWifiReprise);
                            else btnWifiReprise.click();
                        }
                    }

                    if (configAirbox["nom de l'APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_name_value", configAirbox["nom de l'APN"]);
                    if (configAirbox["identifiant APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_id_value", configAirbox["identifiant APN"]);
                    if (configAirbox["mot de passe APN"]) window.ecrireTexteDansDoc(docIframe, "#apn_password_value", configAirbox["mot de passe APN"]);
                }

                /* Fonction locale de sauvegarde robuste */
                const sauvegarderRobuste = async () => {
                    let currentDoc = iframe.contentDocument || iframe.contentWindow.document;
                    let btnSave = currentDoc.querySelector("#save");
                    if (btnSave) {
                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                        else btnSave.click();
                        
                        console.log("⏳ Sauvegarde Airbox en cours...");
                        await new Promise((resolve) => {
                            let intv = setInterval(() => {
                                try {
                                    let doc = iframe.contentDocument || iframe.contentWindow.document;
                                    if (doc) {
                                        let loading = doc.querySelector("body > div.loading_screen");
                                        if (!loading || window.getComputedStyle(loading).display === "none") {
                                            clearInterval(intv); resolve();
                                        }
                                    }
                                } catch(e) {}
                            }, 1000);
                            setTimeout(() => { clearInterval(intv); resolve(); }, 30000);
                        });
                        await window.attendrePause(1000);
                    }
                };

                /* Sauvegarde des données insérées */
                await sauvegarderRobuste();

                /* 🌟 RESTAURATION DE L'ÉTAT SELON LE JSON */
                docIframe = iframe.contentDocument || iframe.contentWindow.document; // Rafraîchir le DOM
                let radioActiveFinal = docIframe.querySelector("#airbox_activation_status_activated");
                let radioDesactiveFinal = docIframe.querySelector("#airbox_activation_status_deactivated");
                let etatCourantFinal = (radioActiveFinal && radioActiveFinal.checked);

                if (veutEtreActifJson !== etatCourantFinal) {
                    console.log(`👉 Application de l'état final depuis le JSON (${veutEtreActifJson ? 'Activé' : 'Désactivé'})...`);
                    let btnCible = veutEtreActifJson ? radioActiveFinal : radioDesactiveFinal;
                    if (btnCible) {
                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnCible);
                        else btnCible.click();
                        await window.attendrePause(1000);
                        
                        /* Nouvelle sauvegarde pour valider l'état final */
                        await sauvegarderRobuste();
                    }
                } else {
                    console.log(`✅ L'état final correspond déjà au JSON (${veutEtreActifJson ? 'Activé' : 'Désactivé'}).`);
                }

            } else {
                console.warn("⚠️ L'iframe de l'Airbox n'a pas chargé.");
            }
        } else {
            console.warn("⚠️ La tuile #airbox est introuvable.");
        }
    }
    
    console.log("🔄 Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000); 
    }
};