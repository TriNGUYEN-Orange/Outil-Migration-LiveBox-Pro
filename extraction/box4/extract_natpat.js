/* --- /box4/extract_natpat.js --- */

window.extraireNatpat = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendreStabiliteDOM, 
        extraireTableau, 
        CLE_STORAGE 
    } = window;


    /* --- BLOC 4 : NAT/PAT --- */
    console.log("⏳ [4/x] Extraction sur la page NAT/PAT...");

    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }
    
    console.log("🔄 Exécution de la technique Aller-Retour (NAT/PAT -> Wi-Fi -> NAT/PAT)...");

    simulerClic("#menu_menuNetwork_natpat_hyperlink");
    await attendreElement("#network_natPat_IPv4Section_mainBlock", 10000);

    simulerClic("#homepage_wifi_configuration_hyperlink");
    await attendreElement("#network_wifi_activation_difference_radioPanel", 10000);

    simulerClic("#menu_menuNetwork_natpat_hyperlink");
    
    /* 🛡️ REFACTOR : Recherche de la table directement dans le bloc IPv4 */
    let selecteurTableauNAT = "#network_natPat_IPv4Section_mainBlock table";

    await attendreElement(selecteurTableauNAT, 15000);
    console.log("⏳ Attente de la stabilité du tableau NAT/PAT...");
    await attendreStabiliteDOM(selecteurTableauNAT, 20000, 1000); 

    configLivebox.natpat = configLivebox.natpat || {};

    configLivebox.natpat["règles IPv4"] = extraireTableau(
        selecteurTableauNAT,
        {
            "Activé": 7,
            "Application/Service": 0,
            "Port interne": 5,
            "Port externe": 4,
            "Protocole": 1,
            "Équipement": 6,
            "IP externe": 2
        }
    );

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.log("✅ NAT/PAT extrait avec succès !");
};