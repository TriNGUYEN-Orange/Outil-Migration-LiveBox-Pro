/* --- /box4/extract_wifi.js --- */

window.extraireWifi = async function() {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendrePause, 
        lireEtat, 
        extraireTableau, 
        CLE_STORAGE 
    } = window;


    /* --- BLOC 2 : WI-FI --- */
    console.log("⏳ [2/x] Extraction sur la page Wi-Fi...");

    /* Initialiser la structure JSON pour séparer 2.4GHz et 5GHz */
    if (!configLivebox.wifi) {
        configLivebox.wifi = {};
    }
    configLivebox.wifi.wifi2_4 = {};
    configLivebox.wifi.wifi5 = {};

    simulerClic("#homepage_wifi_configuration_hyperlink");
    
    /* Attendre et lire l'état de la différenciation des réseaux */
    await attendreElement("#network_wifi_activation_difference_radioPanel", 10000);
    configLivebox.wifi.differencier_reseaux = lireEtat("#network_wifi_activation_difference_radioPanel");

    /* ========================================= */
    /* EXTRACTION WI-FI 2.4 GHz                  */
    /* ========================================= */
    if (simulerClic("#network_wifi_wifi2\\.4_foldable_imageButton")) {
        await attendreElement("#network_wifi_wifi2\\.4_technicalSettings_broadCastSsid_radioPanel", 5000);
        
        /* Extraire l'état du mode 2.4GHz */
        let champMode24 = document.querySelector("#network_wifi_wifi2\\.4_technicalSettings_mode_combobox");
        configLivebox.wifi.wifi2_4.mode = champMode24 ? (champMode24.tagName === 'SELECT' ? champMode24.options[champMode24.selectedIndex].text : (champMode24.innerText || champMode24.value)).trim() : "Introuvable";

        /* Extraire les autres paramètres 2.4GHz */
        configLivebox.wifi.wifi2_4.diffusion_ssid = lireEtat("#network_wifi_wifi2\\.4_technicalSettings_broadCastSsid_radioPanel");
        configLivebox.wifi.wifi2_4.afficher_cle_ecran = lireEtat("#network_wifi_wifi2\\.4_securitySettings_wifiKeyDisplayed_radioPanel");
        configLivebox.wifi.wifi2_4.filtrage_mac = lireEtat("#network_wifi_wifi2\\.4_authorizedEquipement_macFiltering_radioPanel");
        
        /* --- EXTRACTION WPS 2.4 GHz --- */
        configLivebox.wifi.wifi2_4.wps = {};
        configLivebox.wifi.wifi2_4.wps["état WPS"] = lireEtat("#network_wifi_wifi2\\.4_WPSAssociation_wpsState_radioPanel");
        configLivebox.wifi.wifi2_4.wps["association WPS par écran"] = lireEtat("#network_wifi_wifi2\\.4_WPSAssociation_wpsAssociation_radioPanel");
        
        /* CORRECTION : Récupérer le texte affiché (Display Text) au lieu de la valeur (Value) */
        let wpsMode24 = document.querySelector("#network_wifi_wifi2\\.4_WPSAssociation_mode_combobox");
        configLivebox.wifi.wifi2_4.wps.mode = wpsMode24 ? (wpsMode24.tagName === 'SELECT' ? wpsMode24.options[wpsMode24.selectedIndex].text : (wpsMode24.innerText || wpsMode24.value)).trim() : "Introuvable";

        /* Extraction de la table MAC 2.4GHz */
        let selecteurTableauMac24 = "#network_wifi_wifi2\\.4_authorizedEquipementSection_mainBlock table";
        await attendreElement(selecteurTableauMac24, 5000);
        
        configLivebox.wifi.wifi2_4.equipements_autorises = extraireTableau(
            selecteurTableauMac24, 
            { "nom_equipement": 0, "adresse_mac": 2 }
        );            
    } else {
        console.warn("⚠️ Menu 2.4GHz introuvable.");
    }

    /* ========================================= */
    /* 3 BIS : EXTRACTION WI-FI 5 GHz            */
    /* ========================================= */
    
    /* Enregistrer explicitement l'état "activé" du Wi-Fi 5GHz */
    if (configLivebox.wifi.differencier_reseaux === false) {
        console.log("🔄 Le Wi-Fi 5GHz n'est pas différencié. activé = false");
        configLivebox.wifi.wifi5["activé"] = false;
        
        console.log("🔧 Séparation des réseaux activée temporairement pour lire le 5GHz...");
        simulerClic("#network_wifi_activation_difference_enable_radioButton");
        await attendrePause(2000); /* Attendre que le menu 5GHz apparaisse */
    } else {
        console.log("✅ Le Wi-Fi 5GHz est différencié. activé = true");
        configLivebox.wifi.wifi5["activé"] = true;
    }

    /* 0. Cliquer sur le menu déroulant 5GHz */
    if (simulerClic("#network_wifi_wifi5_foldable_imageButton")) {
        await attendreElement("#network_wifi_wifi5_technicalSettings_broadCastSsid_radioPanel", 5000);
        
        /* 1. Enregistrer SSID 5 */
        let champSsid = document.querySelector("#network_wifi_wifi5_technicalSettings_ssid_textbox");
        configLivebox.wifi.wifi5.ssid = champSsid ? champSsid.value : "Introuvable";

        /* 2. Enregistrer l'état mode (Texte affiché) */
        let champMode5 = document.querySelector("#network_wifi_wifi5_technicalSettings_mode");
        configLivebox.wifi.wifi5.mode = champMode5 ? (champMode5.tagName === 'SELECT' ? champMode5.options[champMode5.selectedIndex].text : (champMode5.innerText || champMode5.value)).trim() : "Introuvable";
        
        /* 3. Enregistrer l'état diffusion SSID 5 */
        configLivebox.wifi.wifi5.diffusion_ssid = lireEtat("#network_wifi_wifi5_technicalSettings_broadCastSsid_radioPanel");
        
        /* 4. Enregistrer mdp5 */
        let champMdp = document.querySelector("#network_wifi_wifi5_securitySettings_WPAKeyClear_textbox");
        configLivebox.wifi.wifi5.mdp = champMdp ? champMdp.value : "Introuvable";

        /* 5. Enregistrer l'état filtrage d'adresses MAC */
        configLivebox.wifi.wifi5.filtrage_mac = lireEtat("#network_wifi_wifi5_authorizedEquipement_macFiltering_radioPanel");
        
        /* --- EXTRACTION WPS 5 GHz --- */
        configLivebox.wifi.wifi5.wps = {};
        configLivebox.wifi.wifi5.wps["état WPS"] = lireEtat("#network_wifi_wifi5_WPSAssociation_wpsState_radioPanel");
        configLivebox.wifi.wifi5.wps["association WPS par écran"] = lireEtat("#network_wifi_wifi5_WPSAssociation_wpsAssociation_radioPanel");
        
        /* CORRECTION : Récupérer le texte affiché (Display Text) au lieu de la valeur (Value) */
        let wpsMode5 = document.querySelector("#network_wifi_wifi5_WPSAssociation_mode_combobox");
        configLivebox.wifi.wifi5.wps.mode = wpsMode5 ? (wpsMode5.tagName === 'SELECT' ? wpsMode5.options[wpsMode5.selectedIndex].text : (wpsMode5.innerText || wpsMode5.value)).trim() : "Introuvable";

        /* 6. Extraire les équipements autorisés depuis le tableau spécifique */
        let selecteurTableauMac5 = "#network_wifi_wifi5_authorizedEquipementSection_mainBlock > div:nth-child(6) > div > table";
        await attendreElement(selecteurTableauMac5, 5000);
        
        /* La fonction extraireTableau ignore automatiquement l'en-tête (tr index 0) */
        configLivebox.wifi.wifi5.equipements_autorises = extraireTableau(
            selecteurTableauMac5, 
            { "nom_equipement": 0, "adresse_mac": 2 }
        );            
    } else {
        console.warn("⚠️ Menu 5GHz introuvable ou impossible à ouvrir.");
    }

    /* Sauvegarde finale dans le navigateur */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));

    /* Passage à la page suivante (DHCP/DNS) */
    simulerClic("#menu_menuNetwork_dhcpdns_hyperlink");
};