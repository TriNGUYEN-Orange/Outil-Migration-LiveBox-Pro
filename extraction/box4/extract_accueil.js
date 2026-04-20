/* --- /box4/extract_accueil.js --- */

window.extraireAccueil = async function() {
    const { configLivebox, simulerClic, attendreElement, attendrePause, CLE_STORAGE } = window;

    /* --- BLOC 1 : ACCUEIL --- */
    console.log("⏳ [1/x] Extraction sur la page Accueil...");
    
    simulerClic("#menu_home_hyperlink");

    /* 1. Attente intelligente : On attend d'abord que le label de l'IP apparaisse dans le DOM */
    await attendreElement("#homepage_ipAddress_label", 15000);

    /* 2. Boucle d'attente dynamique pour s'assurer que la donnée est bien téléchargée du serveur */
    console.log("⏳ En attente du chargement des données réseau...");
    let donneesChargees = false;
    let tentatives = 0;
    
    while (!donneesChargees && tentatives < 30) { /* Attendre max 15 secondes (30 * 500ms) */
        let labelIp = document.querySelector("#homepage_ipAddress_label");
        if (labelIp && labelIp.nextElementSibling) {
            let texteIp = labelIp.nextElementSibling.innerText.trim();
            /* Si le texte n'est plus vide ni en chargement (souvent représenté par '-' ou '...') */
            if (texteIp !== "" && texteIp !== "-" && !texteIp.includes("...")) {
                donneesChargees = true;
                break;
            }
        }
        await attendrePause(500);
        tentatives++;
    }

    if(donneesChargees) {
        console.log("✅ Données de la page d'accueil affichées à l'écran !");
    } else {
        console.warn("⚠️ Temps écoulé : Les données tardent à s'afficher, tentative d'extraction forcée.");
    }

    /* 3. Fonction de recherche ultra-robuste par mots-clés (Élimine tous les nth-child) */
    function extraireInfoAccueil(motCleLabel) {
        /* On cherche dans tous les blocs de paramètres de la page d'accueil */
        let toutesLesDivs = document.querySelectorAll(".homeRight .home-block .params div");
        for (let i = 0; i < toutesLesDivs.length; i++) {
            let texte = toutesLesDivs[i].innerText || "";
            if (texte.toLowerCase().includes(motCleLabel.toLowerCase())) {
                /* La valeur se trouve dans la balise div immédiatement après le label */
                let divValeur = toutesLesDivs[i].nextElementSibling;
                if (divValeur && divValeur.innerText.trim() !== "") {
                    return divValeur.innerText.trim();
                }
            }
        }
        return "Introuvable";
    }

    configLivebox.wifi = configLivebox.wifi || {};

    /* Extraction du SSID */
    let nomReseau = extraireInfoAccueil("SSID");
    configLivebox.wifi.ssid = (nomReseau !== "Introuvable") ? nomReseau : extraireInfoAccueil("nom du réseau");
    
    /* 🛡️ CORRECTION : Extraction du mot de passe via son ID unique repéré dans le DOM */
    let labelMdpFinal = document.querySelector("#homepage_wifi_wep_label");
    configLivebox.wifi.mot_de_passe = (labelMdpFinal && labelMdpFinal.nextElementSibling) ? labelMdpFinal.nextElementSibling.innerText.trim() : extraireInfoAccueil("clé d'accès");
    
    /* Pour l'IP, on utilise directement son ID unique repéré dans le DOM */
    let labelIpFinal = document.querySelector("#homepage_ipAddress_label");
    configLivebox.wifi.adresse_ip_internet = (labelIpFinal && labelIpFinal.nextElementSibling) ? labelIpFinal.nextElementSibling.innerText.trim() : "Introuvable";

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};