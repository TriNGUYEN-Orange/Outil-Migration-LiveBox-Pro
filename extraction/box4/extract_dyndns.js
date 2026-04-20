/* --- /box4/extract_dyndns.js --- */

window.extraireDyndns = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement,
        attendrePause,
        attendreStabiliteDOM, 
        lireEtat, 
        lireValeurInput, 
        extraireTableau, 
        CLE_STORAGE 
    } = window;

    console.log("⏳ [4/x] Extraction sur la page DynDNS...");

    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }
    
    /* Navigation vers la page DynDNS */
    simulerClic("#menu_menuNetwork_dyndns_hyperlink");

    /* Utilisation d'un sélecteur robuste */
    let blocFormulaire = "#network_dyndns_mainBlock div[class*='formLayout']";
    await attendreElement(blocFormulaire, 15000);
    
    /* ========================================================================= */
    /* 🌟 NOUVEAU : Attente SPÉCIFIQUE pour le menu déroulant "nom DNS"          */
    /* ========================================================================= */
    console.log("⏳ Attente du chargement de la liste des noms DNS...");
    
    /* On cible le select grâce à son title repéré dans votre capture d'écran */
    let selecteurSelectDNS = "select[title*='nom de host spécifique']";
    
    /* On attend d'abord que le select lui-même apparaisse physiquement */
    await attendreElement(selecteurSelectDNS, 10000);
    
    /* Ensuite, on attend intelligemment qu'il se remplisse avec des options (depuis le serveur) */
    let selectDNS = document.querySelector(selecteurSelectDNS);
    if (selectDNS) {
        let tentatives = 0;
        /* Tant qu'il n'y a que "choisir..." (1 option) ou 0 option, on patiente (max 8 secondes) */
        while (selectDNS.options.length <= 1 && tentatives < 16) {
            await attendrePause(500);
            tentatives++;
        }
        console.log("✅ Liste DNS chargée avec " + selectDNS.options.length + " option(s).");
    }

    /* On s'assure que le reste du DOM est bien stable avant de lire */
    await attendreStabiliteDOM(blocFormulaire, 15000, 1000);

    /* ========================================================================= */
    /* EXTRACTION DES DONNÉES                                                    */
    /* ========================================================================= */
    configLivebox.dyndns = configLivebox.dyndns || {};

    configLivebox.dyndns["activé"] = lireEtat(blocFormulaire + " > div:nth-child(1)");
    
    /* Lecture sécurisée en utilisant le selecteur ciblé */
    configLivebox.dyndns["nom DNS"] = lireValeurInput(selecteurSelectDNS);
    
    /* Si la méthode ciblée échoue (ex: màj Livebox), on essaie l'ancienne méthode de secours */
    if (!configLivebox.dyndns["nom DNS"] || configLivebox.dyndns["nom DNS"] === "Introuvable") {
         configLivebox.dyndns["nom DNS"] = lireValeurInput(blocFormulaire + " > div:nth-child(2) select");
    }
    
    let elemNomHote = document.querySelector(blocFormulaire + " > div:nth-child(3) div[class*='formItemInput']");
    configLivebox.dyndns["nom de hôte complet"] = elemNomHote ? (elemNomHote.innerText || elemNomHote.textContent).trim() : "";

    let selecteurTableauDynDNS = "#network_dyndns_mainBlock table";

    configLivebox.dyndns["DynDNS externes"] = extraireTableau(
        selecteurTableauDynDNS,
        {
            "Service": 0,
            "Nom d'hôte/de domaine": 1,
            "Mot de passe": 3,
            "Mise à jour": 4,
            "Activer": 5
        }
    );

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));

    /* ========================================================================= */
    /* GESTION DE LA POP-UP                                                      */
    /* ========================================================================= */
    console.log("⏳ Déclenchement forcé de la pop-up de sortie...");
    simulerClic("#menu_menuNetwork_natpat_hyperlink");
    
    let btnConfirm = await attendreElement("#confirm_button", 4000);
    if (btnConfirm) {
        console.log("⚠️ Pop-up de sortie détectée ! Clic sur OUI...");
        btnConfirm.click();
        simulerClic("#confirm_button");
        
        let intervalNettoyage = setInterval(() => {
            let overlayBox = document.querySelector(".popinGlass, .glassPanel");
            if(!overlayBox) clearInterval(intervalNettoyage);
        }, 200);
        await attendrePause(1000); 
    }

    let elementsBloquants = document.querySelectorAll("div[class*='popinPanel'], div[class*='glassPanel'], div[class*='popinGlass']");
    if (elementsBloquants.length > 0) {
        elementsBloquants.forEach(element => {
            element.style.pointerEvents = "none";
            element.style.display = "none";
            element.remove();
        });
    }
};