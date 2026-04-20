/* --- /box4/extract_airbox.js --- */

window.extraireAirbox = async function() {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendrePause, 
        lireEtat, 
        CLE_STORAGE 
    } = window;

   
    /* --- BLOC 12 : Air Box (Secours) --- */
    console.log("⏳ [12/x] Extraction sur la page Air Box...");

    /* 🛠️ Fonction de lecture ultra-sécurisée adaptée pour Select et Input */
    const lireSecuriseAirbox = (selecteur) => {
        let el = document.querySelector(selecteur);
        if (!el) return "";
        
        /* Récupération du texte réel pour les listes déroulantes */
        if (el.tagName === 'SELECT') {
            return el.selectedIndex >= 0 ? el.options[el.selectedIndex].text.trim() : "";
        }
        
        let val = (el.tagName === 'INPUT') ? el.value : (el.innerText || el.textContent);
        return val ? String(val).trim() : "";
    };

    configLivebox.airbox = {};

    /* 1. Navigation vers "Mes services" */
    simulerClic("#menu_myServices_hyperlink");
    await attendrePause(1500);

    /* 2. Navigation vers "Airbox" (Security Box) */
    simulerClic("#menu_myServices_securitybox_hyperlink");
    
    /* On attend l'apparition du bloc principal Airbox */
    let airboxCharge = await attendreElement("#myServices_securityBox_serviceActivation_mainBlock", 10000);
    
    if (airboxCharge) {
        await attendrePause(2000); /* Laisser le temps au GWT de peupler les champs */
        
        /* Astuce : Remplacement des classes dynamiques (GIB5...) par class*='formLayout' pour éviter la casse */
        let selecteurEtatActivation = "#myServices_securityBox_serviceActivation_mainBlock > div[class*='formLayout'] > div > div:nth-child(3) > div";
        
        /* 3. Enregistrer l'état "activé" */
        let radioEnable = document.querySelector("#myServices_securityBox_serviceActivation_enable_radioButton");
        if (radioEnable) {
            configLivebox.airbox["état"] = radioEnable.checked ? "activé" : "désactivé";
        } else {
            let texteEtat = lireSecuriseAirbox(selecteurEtatActivation).toLowerCase();
            configLivebox.airbox["état"] = (texteEtat.includes("activé") || texteEtat.includes("oui")) ? "activé" : "désactivé";
        }

        /* 4. Cliquer sur le bouton radio 'Activer' s'il n'est pas coché pour FORCER l'affichage des paramètres */
        if (radioEnable && !radioEnable.checked) {
            console.log("👉 Forçage de l'ouverture du formulaire Airbox...");
            radioEnable.click();
            simulerClic("#myServices_securityBox_serviceActivation_enable_radioButton");
            await attendrePause(1500); /* Attendre que le panneau se déplie */
        }

        /* 5 à 11. Copie des champs principaux et listes déroulantes */
        configLivebox.airbox["mot de passe administrateur"] = lireSecuriseAirbox("#myServices_securitybox_airbox_configuration_settings_password_textbox");
        configLivebox.airbox["code pin"] = lireSecuriseAirbox("#myServices_securitybox_airbox_configuration_settings_pin_textbox");
        configLivebox.airbox["identifiant de carte SIM"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_simCard_textbox");
        configLivebox.airbox["mode réseau"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_networkMode_combobox");
        configLivebox.airbox["réduction d'interférences"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_reducer_combobox");
        configLivebox.airbox["activer l'accès de secours après"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_enable_timeAfter_combobox");
        configLivebox.airbox["désactiver l'accès de secours après"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_disable_timeAfter_combobox");

        /* 12. Enregistrer l'état "reprise des paramètres WiFi" */
        let selecteurWifiRestore = "#myServices_securitybox_advancedSettings_wifi_restore_radioPanel > div[class*='formItemInput']";
        let etatWifi = lireEtat(selecteurWifiRestore);
        configLivebox.airbox["reprise des paramètres WiFi"] = (etatWifi === true) ? "activé" : (etatWifi === false ? "désactivé" : "inconnu");

        /* 13 à 15. Copie des paramètres APN */
        configLivebox.airbox["nom de l'APN"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_apn_name_textbox");
        configLivebox.airbox["identifiant APN"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_apn_username_textbox");
        configLivebox.airbox["mot de passe APN"] = lireSecuriseAirbox("#myServices_securitybox_advancedSettings_apn_password_passwordTextbox");

        console.log("✅ Données Air Box extraites avec succès !");

    } else {
        console.warn("⚠️ Page Air Box introuvable ou non chargée.");
        configLivebox.airbox["statut"] = "Non disponible";
    }

    console.log("⏳ Astuce : Déclenchement forcé de la pop-up de sortie...");
    
    /* On clique virtuellement sur Pare-feu pour faire réagir la box */
    simulerClic("#menu_home_hyperlink"); 
    
    /* On surveille l'apparition du bouton OUI pendant 3 secondes */
    let popUpOui = await attendreElement("#confirm_button", 3000);
    if (popUpOui) {
        console.log("⚠️ Pop-up de sortie détectée ! Clic sur OUI...");
        popUpOui.click();
        simulerClic("#confirm_button");
        await attendrePause(2000); /* Pause vitale pour laisser la page Pare-feu charger */
    }

    /* Sauvegarde globale */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};