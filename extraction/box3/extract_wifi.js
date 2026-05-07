/* --- /box3/extract_wifi.js --- */

window.extraireWifiBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, extraireTableau, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[2/x] Extraction sur la page WiFi (Box 3)...");
    console.warn("=================================================");

    if (estRattrapage) {
        simulerClic("#menu_home_hyperlink");
        await attendrePause(1500);
        await attendreFinChargementGWT();
    }

    /* ========================================================================= */
    /* 1. NAVIGATION DIRECTE PAR HASH                                            */
    /* ========================================================================= */
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000); 
    
    /* Attendre que la page charge completement */
    await attendreFinChargementGWT();

    let formWifi = await attendreElement("#gwtActivityPanel form", 5000);
    if (!formWifi) {
        console.error("Echec: Formulaire WiFi introuvable.");
        return;
    }

    /* Initialisation de la structure unifiee */
    configLivebox.wifi = configLivebox.wifi || {};
    configLivebox.wifi.wifi2_4 = configLivebox.wifi.wifi2_4 || {
        wps: {},
        equipements_autorises: []
    };
    
    /* Ne pas ecraser l'IP si elle a deja ete recuperee a l'accueil */
    if (!configLivebox.wifi.adresse_ip_internet) {
        configLivebox.wifi.adresse_ip_internet = "Introuvable";
    }

    /* ========================================================================= */
    /* 2. EXTRACTION ROBUSTE PAR ATTRIBUTS (TITLE & NAME)                        */
    /* ========================================================================= */
    console.warn("Extraction des donnees WiFi en cours...");

    // --- SSID (Racine) ---
    let inputSSID = document.querySelector("input[title*='nom de la Livebox']");
    configLivebox.wifi.ssid = inputSSID ? inputSSID.value.trim() : "Introuvable";

    // --- MOT DE PASSE (Racine) ---
    let radioLireMdpOn = document.querySelector("input[name='wifiKeyReadableGroup'][value='on']");
    if (radioLireMdpOn && !radioLireMdpOn.checked) {
        console.warn("Rendre la cle WiFi lisible...");
        simulerClic("input[name='wifiKeyReadableGroup'][value='on']");
        radioLireMdpOn.click();
        await attendrePause(1000);
        await attendreFinChargementGWT(); 
    }

    let inputMdp = document.querySelector("input[title*=\"clé d'accès WiFi\"][type='text']") || document.querySelector("input[title*=\"clé d'accès WiFi\"]");
    configLivebox.wifi.mot_de_passe = inputMdp ? inputMdp.value.trim() : "Introuvable";

    // --- MODE WIFI (wifi2_4) ---
    let selectMode = document.querySelector("select[title*='mode WiFi']");
    configLivebox.wifi.wifi2_4.mode = selectMode && selectMode.selectedIndex >= 0 ? selectMode.options[selectMode.selectedIndex].text : "Introuvable";

    // --- DIFFUSION SSID (wifi2_4) ---
    let radioDiffOn = document.querySelector("input[name='broadCastSsid'][value='on']");
    configLivebox.wifi.wifi2_4.diffusion_ssid = radioDiffOn ? radioDiffOn.checked : "Introuvable";

    // --- AFFICHER CLE SUR ECRAN (wifi2_4) ---
    let radioEcranOn = document.querySelector("input[name='wifiKeyDisplayedRadio'][value='on']");
    configLivebox.wifi.wifi2_4.afficher_cle_ecran = radioEcranOn ? radioEcranOn.checked : "Introuvable";

    // --- WPS (wifi2_4) ---
    configLivebox.wifi.wifi2_4.wps = {};

    let radioWpsStateOn = document.querySelector("input[name='wpsStateRadio'][value='on']");
    configLivebox.wifi.wifi2_4.wps["état WPS"] = radioWpsStateOn ? radioWpsStateOn.checked : false;

    let radioWpsAssocOn = document.querySelector("input[name='wpsAssociationRadio'][value='on']");
    configLivebox.wifi.wifi2_4.wps["association WPS par écran"] = radioWpsAssocOn ? radioWpsAssocOn.checked : false;

    let selectWpsMode = document.querySelector("select[title*=\"sélectionner le mode d'appairage\"]");
    configLivebox.wifi.wifi2_4.wps["mode"] = selectWpsMode && selectWpsMode.selectedIndex >= 0 ? selectWpsMode.options[selectWpsMode.selectedIndex].text : "Introuvable";

    // --- FILTRAGE MAC (wifi2_4) ---
    /* Utilisation du nom de groupe exact recupere dans le DOM */
    let radioMacFilterOn = document.querySelector("input[name='macFilteringGroup'][value='on']");
    configLivebox.wifi.wifi2_4.filtrage_mac = radioMacFilterOn ? radioMacFilterOn.checked : false;

    // --- EQUIPEMENTS AUTORISES ---
    /* Configuration des colonnes pour la fonction utilitaire (0 = Nom, 1 = Adresse MAC) */
    let configurationColonnes = {
        "nom_equipement": 0,
        "adresse_mac": 2
    };
    
    /* Utilisation de la fonction globale pour extraire le tableau */
    let donneesTableau = extraireTableau("#gwtActivityPanel table.widgetTable", configurationColonnes);
    
    /* Filtrer les lignes vides pour garantir l'integrite du JSON */
    configLivebox.wifi.wifi2_4.equipements_autorises = donneesTableau.filter(eq => eq.nom_equipement !== "" && eq.adresse_mac !== "");

    console.warn("Donnees extraites avec succes :", JSON.stringify(configLivebox.wifi));

    /* ========================================================================= */
    /* 3. SAUVEGARDE ET FIN                                                      */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    
    // Nettoyage de l'URL pour ne pas gener la navigation suivante
    window.location.hash = "";
    await attendrePause(500);
};