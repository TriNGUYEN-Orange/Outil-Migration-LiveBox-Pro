/* --- /box4/extract_dmz.js --- */

window.extraireDmz = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendrePause,
        extraireTableau, 
        CLE_STORAGE 
    } = window;

    /* --- BLOC 7 : DMZ --- */
    console.log("⏳ [7/x] Extraction sur la page DMZ...");
    
    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }

    simulerClic("#menu_menuNetwork_dmz_hyperlink");

    let selecteurTableauDMZ = "#network_dmz_addressTable_panel table";
    await attendreElement(selecteurTableauDMZ, 10000);

    configLivebox.dmz = configLivebox.dmz || {};

    let equipementsBruts = extraireTableau(
        selecteurTableauDMZ,
        {
            "Équipement": 0,
            "Adresse IP statique": 1
        }
    );

    let equipementsNettoyes = equipementsBruts.filter(eq => {
        let nom = (eq["Équipement"] || "").trim().toLowerCase();
        return nom !== "" && nom !== "<équipement>" && !nom.includes("aucun");
    });

    if (equipementsNettoyes.length > 0) {
        configLivebox.dmz["équipements"] = equipementsNettoyes;
    } else {
        delete configLivebox.dmz["équipements"];
        console.log("ℹ️ Aucun équipement DMZ détecté. Section laissée vide.");
    }

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};