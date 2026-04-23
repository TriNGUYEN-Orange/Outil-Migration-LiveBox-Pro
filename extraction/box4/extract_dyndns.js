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
    /* Attente SPÉCIFIQUE pour le menu déroulant "nom DNS"                       */
    /* ========================================================================= */
    console.log("⏳ Attente du chargement de la liste des noms DNS...");
    
    let selecteurSelectDNS = "select[title*='nom de host spécifique']";
    await attendreElement(selecteurSelectDNS, 10000);
    
    let selectDNS = document.querySelector(selecteurSelectDNS);
    if (selectDNS) {
        let tentatives = 0;
        while (selectDNS.options.length <= 1 && tentatives < 16) {
            await attendrePause(500);
            tentatives++;
        }
        console.log("✅ Liste DNS chargée avec " + selectDNS.options.length + " option(s).");
    }

    await attendreStabiliteDOM(blocFormulaire, 15000, 1000);

    /* ========================================================================= */
    /* EXTRACTION DES DONNÉES                                                    */
    /* ========================================================================= */
    configLivebox.dyndns = configLivebox.dyndns || {};

    configLivebox.dyndns["activé"] = lireEtat(blocFormulaire + " > div:nth-child(1)");
    
    configLivebox.dyndns["nom DNS"] = lireValeurInput(selecteurSelectDNS);
    
    if (!configLivebox.dyndns["nom DNS"] || configLivebox.dyndns["nom DNS"] === "Introuvable") {
         configLivebox.dyndns["nom DNS"] = lireValeurInput(blocFormulaire + " > div:nth-child(2) select");
    }
    
    let elemNomHote = document.querySelector(blocFormulaire + " > div:nth-child(3) div[class*='formItemInput']");
    configLivebox.dyndns["nom de hôte complet"] = elemNomHote ? (elemNomHote.innerText || elemNomHote.textContent).trim() : "";

    /* ========================================================================= */
    /* 🌟 NOUVEAU : EXTRACTION DU TABLEAU AVEC RÉCUPÉRATION DU 'TITLE'           */
    /* ========================================================================= */
    let selecteurTableauDynDNS = "#network_dyndns_mainBlock div[class*='pageSectionBorder'] table.widgetTable, #gwtActivityPanel form table.widgetTable";
    let tableauDynDNS = document.querySelector(selecteurTableauDynDNS);
    let dynDnsExtraits = [];

    if (tableauDynDNS) {
        let lignesTableau = tableauDynDNS.querySelectorAll("tbody > tr");
        
        for (let ligne of lignesTableau) {
            let cellules = ligne.querySelectorAll("td");
            /* Vérifier que c'est bien une ligne de données (au moins 6 colonnes) */
            if (cellules.length >= 6) {
                let serviceText = cellules[0].innerText.trim();
                
                /* Ignorer les lignes d'en-tête ou vides */
                if (!serviceText || serviceText.toLowerCase() === "service") continue; 

                /* 1. Récupération intelligente du nom de domaine via l'attribut 'title' */
                let divNom = cellules[1].querySelector("div[title]");
                let nomComplet = divNom ? divNom.getAttribute("title").trim() : cellules[1].innerText.trim();

                let identifiant = cellules[2].innerText.trim();
                let motDePasse = cellules[3].innerText.trim(); // Restera "******" à cause du serveur

                /* 2. Lecture de l'état du Toggle (Activer) */
                let htmlActiver = cellules[5].innerHTML.toLowerCase();
                let actif = htmlActiver.includes("switch_on") || htmlActiver.includes("checked");

                dynDnsExtraits.push({
                    "Service": serviceText,
                    "Nom d'hôte/de domaine": nomComplet,
                    "Identifiant": identifiant,
                    "Mot de passe": motDePasse,
                    "Activer": actif
                });
            }
        }
    }

    configLivebox.dyndns["DynDNS externes"] = dynDnsExtraits;
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.log("✅ Données DynDNS extraites :", dynDnsExtraits);

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