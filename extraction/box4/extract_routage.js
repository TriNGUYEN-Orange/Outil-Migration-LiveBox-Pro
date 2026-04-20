/* --- /box4/extract_routage.js --- */

window.extraireRoutage = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendreStabiliteDOM, 
        extraireTableau, 
        CLE_STORAGE 
    } = window;

    /* --- BLOC 6 : ROUTAGE --- */
    console.log("⏳ [6/x] Extraction sur la page Routage...");

    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }

    simulerClic("#menu_menuNetwork_routing_hyperlink");
    
    let conteneurRoutage = "#gwtActivityPanel form";
    
    /* 🛡️ REFACTOR ANTI-LAG : On cible spécifiquement la VRAIE table de données repérée dans votre capture d'écran */
    let selecteurVraieTable = conteneurRoutage + " table[class*='widgetTable']";
    
    /* 1. On attend l'apparition physique de la vraie table (15s max pour la 3G) */
    let tablePrete = await attendreElement(selecteurVraieTable, 15000);

    /* 2. Logique Aller-Retour si GWT bloque ou si la table ne charge pas du tout */
    if (!tablePrete) {
        console.log("🔄 Table de routage introuvable ou réseau très lent. Exécution de la technique Aller-Retour...");
        simulerClic("#menu_menuNetwork_wifi_hyperlink"); 
        await attendreElement("#network_wifi_activation_difference_radioPanel", 15000);
        
        simulerClic("#menu_menuNetwork_routing_hyperlink");
        /* On redonne 20 secondes au réseau lent pour afficher la widgetTable */
        await attendreElement(selecteurVraieTable, 20000);
    }

    console.log("⏳ Attente intelligente du remplissage des données de Routage...");
    /* 3. La table est là, on attend maintenant que GWT ait fini d'y injecter les lignes d'IP.
       J'ai monté la durée de calme à 600ms pour être robuste face aux latences 3G extrêmes. */
    await attendreStabiliteDOM(conteneurRoutage, 20000, 600);

    configLivebox.routage = configLivebox.routage || {};

    /* 4. Extraction "Aspirateur" : On scanne TOUS les "tr" du formulaire. */
    let toutesLesRoutes = extraireTableau(
        conteneurRoutage,
        {
            "Réseau de destination": 0,
            "Masque du sous-réseau de destination": 1,
            "Passerelle": 2,
            "Interface": 3,
            "Métrique": 4,
            "Activé": 5
        }
    );

    /* 5. Nettoyage des fausses lignes ou en-têtes */
    configLivebox.routage["table de routage"] = toutesLesRoutes.filter(route => {
        let texteReseau = (route["Réseau de destination"] || "").toLowerCase();
        return texteReseau !== "réseau de destination" && texteReseau !== "aucun équipement" && texteReseau !== "";
    });

    console.log("✅ Routage extrait avec succès (" + configLivebox.routage["table de routage"].length + " route(s) trouvée(s)) !");
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};