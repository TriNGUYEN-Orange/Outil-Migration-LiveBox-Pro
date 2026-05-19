/* --- /extraction/box3/extract_wifi.js --- */

window.extraireWifiBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, extraireTableau, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[2/x] Extraction sur la page WiFi (Box 3)...");
    console.warn("=================================================");

    /* Conservation de la logique de rattrapage originale */
    if (estRattrapage) {
        simulerClic("#menu_home_hyperlink");
        await attendrePause(1500);
        await attendreFinChargementGWT();
    }

    /* ========================================================================= */
    /* 1. NAVIGATION (ALLER-RETOUR) : HOME -> WIFI -> ROUTAGE -> WIFI            */
    /* ========================================================================= */
    
    console.warn("Etape 1 : Passage par Accueil...");
    simulerClic("#menu_home_hyperlink");
    await attendrePause(1000);
    await attendreFinChargementGWT();

    console.warn("Etape 2 : Passage par WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000); 
    await attendreFinChargementGWT();

    console.warn("Etape 3 : Passage par Routage...");
    window.location.hash = "#RoutingPlace:";
    await attendrePause(1000); 
    await attendreFinChargementGWT();

    console.warn("Etape 4 : Retour sur WiFi pour extraction...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000); 
    await attendreFinChargementGWT();

    /* ========================================================================= */
    /* 2. ATTENTE DU FORMULAIRE ET INITIALISATION                                */
    /* ========================================================================= */
    let formWifi = await attendreElement("#gwtActivityPanel form", 5000);
    if (!formWifi) {
        console.error("Echec: Formulaire WiFi introuvable.");
        return;
    }

    configLivebox.wifi = configLivebox.wifi || {};
    configLivebox.wifi.wifi2_4 = configLivebox.wifi.wifi2_4 || {
        wps: {},
        equipements_autorises: []
    };
    
    if (!configLivebox.wifi.adresse_ip_internet) {
        configLivebox.wifi.adresse_ip_internet = "Introuvable";
    }

    /* ========================================================================= */
    /* 3. EXTRACTION ROBUSTE PAR ATTRIBUTS                                       */
    /* ========================================================================= */
    console.warn("Extraction des donnees WiFi en cours...");

    let inputSSID = document.querySelector("input[title*='nom de la Livebox']");
    configLivebox.wifi.ssid = inputSSID ? inputSSID.value.trim() : "Introuvable";

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

    let selectMode = document.querySelector("select[title*='mode WiFi']");
    configLivebox.wifi.wifi2_4.mode = selectMode && selectMode.selectedIndex >= 0 ? selectMode.options[selectMode.selectedIndex].text : "Introuvable";

    let radioDiffOn = document.querySelector("input[name='broadCastSsid'][value='on']");
    configLivebox.wifi.wifi2_4.diffusion_ssid = radioDiffOn ? radioDiffOn.checked : "Introuvable";

    let radioEcranOn = document.querySelector("input[name='wifiKeyDisplayedRadio'][value='on']");
    configLivebox.wifi.wifi2_4.afficher_cle_ecran = radioEcranOn ? radioEcranOn.checked : "Introuvable";

    configLivebox.wifi.wifi2_4.wps = {};

    let radioWpsStateOn = document.querySelector("input[name='wpsStateRadio'][value='on']");
    configLivebox.wifi.wifi2_4.wps["état WPS"] = radioWpsStateOn ? radioWpsStateOn.checked : false;

    let radioWpsAssocOn = document.querySelector("input[name='wpsAssociationRadio'][value='on']");
    configLivebox.wifi.wifi2_4.wps["association WPS par écran"] = radioWpsAssocOn ? radioWpsAssocOn.checked : false;

    let selectWpsMode = document.querySelector("select[title*=\"sélectionner le mode d'appairage\"]");
    configLivebox.wifi.wifi2_4.wps["mode"] = selectWpsMode && selectWpsMode.selectedIndex >= 0 ? selectWpsMode.options[selectWpsMode.selectedIndex].text : "Introuvable";

    let radioMacFilterOn = document.querySelector("input[name='macFilteringGroup'][value='on']");
    configLivebox.wifi.wifi2_4.filtrage_mac = radioMacFilterOn ? radioMacFilterOn.checked : false;

    let configurationColonnes = {
        "nom_equipement": 0,
        "adresse_mac": 1
    };
    
    let donneesTableau = extraireTableau("#gwtActivityPanel table.widgetTable", configurationColonnes);
    configLivebox.wifi.wifi2_4.equipements_autorises = donneesTableau.filter(eq => eq.nom_equipement !== "" && eq.adresse_mac !== "");

    console.warn("Donnees extraites avec succes.");

    /* ========================================================================= */
    /* 4. SAUVEGARDE ET FIN SILENCIEUSE                                          */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    
    await attendrePause(500);
    console.warn("Fin du module WiFi. Le module suivant prendra le relai de la navigation.");
};