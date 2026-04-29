/* --- /box4/extract_main.js --- */

window.executerExtractionBox4 = async function() {
    const MAX_TENTATIVES_RATTRAPAGE = 2; 

    if (window.CLE_STORAGE) {
        localStorage.removeItem(window.CLE_STORAGE);
    } else {
        localStorage.removeItem("livebox_migration_config");
    }
    
    window.configLivebox = { 
        "wifi": {}, "dhcp_dns": {}, "natpat": {}, "dyndns": {},
        "dmz": {}, "routage": {}, "parefeu": {}, "vpn": {}
    };

    try {
        window.ExtractUI.injecter();
        const TOTAL_ETAPES = 12; 
        let modulesEnEchec = [];

        /* ====================================================================================== */
        /* PHASE 1 : EXÉCUTION NORMALE                                                            */
        /* ====================================================================================== */
        async function executerModuleNormal(etape, nomModule, fonctionExecution, fonctionValidation) {
            window.ExtractUI.majNormal(etape, TOTAL_ETAPES, nomModule);
            try {
                if (typeof fonctionExecution === "function") await fonctionExecution(false);

                let estValide = true;
                if (typeof fonctionValidation === "function") estValide = fonctionValidation();

                if (!estValide) {
                    console.warn(`⚠️ Données vides pour [${nomModule}].`);
                    modulesEnEchec.push({ etape, nomModule, fonctionExecution, fonctionValidation });
                } else {
                    console.log(`✅ Module [${nomModule}] réussi.`);
                }
            } catch (erreur) {
                console.error(`❌ Erreur pendant [${nomModule}] :`, erreur);
                modulesEnEchec.push({ etape, nomModule, fonctionExecution, fonctionValidation });
            }
        }

        /* Utilisation du système de vérification externalisé */
        const Verif = window.ExtractVerification;

        await executerModuleNormal(1, "Accueil", window.extraireAccueil, Verif.validerAccueil);
        await executerModuleNormal(2, "Réseaux Wi-Fi", window.extraireWifi, Verif.validerWifi);
        await executerModuleNormal(3, "Réseau Local (DHCP & DNS)", window.extraireDhcpDns, Verif.validerDhcpDns);
        await executerModuleNormal(4, "DynDNS", window.extraireDyndns, Verif.validerDyndns);
        await executerModuleNormal(5, "NAT / PAT", window.extraireNatpat, Verif.validerNatpat);
        await executerModuleNormal(6, "Table de Routage", window.extraireRoutage, Verif.validerRoutage);
        await executerModuleNormal(7, "Équipements DMZ", window.extraireDmz, Verif.validerDmz);
        await executerModuleNormal(8, "VPN Site à Site", window.extraireVpnSite, Verif.validerVpnSite);
        await executerModuleNormal(9, "VPN Nomade", window.extraireVpnNomade, Verif.validerVpnNomade);
        await executerModuleNormal(10, "Règles Pare-feu", window.extraireParefeu, Verif.validerParefeu);
        await executerModuleNormal(11, "Accès à distance", window.extraireAccesDistance, Verif.validerAccesDistance);
        await executerModuleNormal(12, "Air Box (Secours)", window.extraireAirbox, Verif.validerAirbox);

        /* ====================================================================================== */
        /* PHASE 2 : TENTATIVES DE RATTRAPAGE                                                     */
        /* ====================================================================================== */
        let echecsDefinitifs = [];

        if (modulesEnEchec.length > 0) {
            for (let mod of modulesEnEchec) {
                let succesRattrapage = false;

                for (let tentative = 1; tentative <= MAX_TENTATIVES_RATTRAPAGE; tentative++) {
                    window.ExtractUI.majTentative(mod.nomModule, tentative, MAX_TENTATIVES_RATTRAPAGE);

                    if (typeof window.simulerClic === "function" && typeof window.attendrePause === "function") {
                        window.simulerClic("#menu_home_hyperlink"); 
                        await window.attendrePause(1500);
                    }

                    try {
                        await mod.fonctionExecution(true);
                        if (mod.fonctionValidation()) {
                            succesRattrapage = true;
                            break; 
                        }
                    } catch(e) {
                        console.error(`❌ Échec tentative ${tentative} :`, e);
                    }
                }

                if (!succesRattrapage) echecsDefinitifs.push(mod.nomModule);
            }
        }

        /* ====================================================================================== */
        /* PHASE 3 : TÉLÉCHARGEMENT ET RÉSULTATS                                                  */
        /* ====================================================================================== */
        if (typeof window.extraireFin === "function") await window.extraireFin();
        window.ExtractUI.succes(echecsDefinitifs);

    } catch (erreur) {
        console.error("❌ Erreur :", erreur);
        window.ExtractUI.erreur(erreur.message);
    }
};

/* ========================================================================= */
/* AUTO-LOADER : CHARGE UI/VERIF -> VÉRIFIE ENVIRONNEMENT -> CHARGE LE RESTE */
/* ========================================================================= */
(async function() {
    let baseUrl = "";
    let scripts = document.getElementsByTagName("script");
    for (let s of scripts) {
        if (s.src && s.src.includes("extract_main.js")) {
            baseUrl = s.src.substring(0, s.src.lastIndexOf('/'));
            break;
        }
    }
    if (!baseUrl) baseUrl = "http://127.0.0.1:5500/extraction/box4";
    
    /* Déduire l'URL racine pour charger le dossier /outil/ */
    let rootUrl = baseUrl.substring(0, baseUrl.indexOf('/extraction'));
    if (!rootUrl) rootUrl = "http://127.0.0.1:5500";

    const chargerScript = async (url) => {
        return new Promise((resolve) => {
            let script = document.createElement('script');
            script.src = url + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = resolve; 
            document.head.appendChild(script);
        });
    };

    /* 1. Charger UNIQUEMENT l'UI et les fichiers de Vérification en premier */
    await chargerScript(baseUrl + "/extract_ui.js");
    await chargerScript(rootUrl + "/outil/verification.js"); /* Le vérificateur global (URL, Auth) */
    await chargerScript(baseUrl + "/extract_verification.js"); /* Les validateurs de données spécifiques Box 4 */

    /* 2. Vérification de l'environnement (URL & Auth) déléguée au module externe */
    if (window.ExtractVerification && typeof window.ExtractVerification.verifierEnvironnement === "function") {
        /* On passe "false" car on est en mode EXTRACTION (pas besoin du JSON) */
        let environnementOk = await window.ExtractVerification.verifierEnvironnement(false);
        if (!environnementOk) return; /* Arrêt immédiat si erreur */
    } else {
        console.error("❌ Fichier outil/verification.js introuvable !");
        return;
    }

    /* 3. Charger le reste des modules si tout est OK */
    const modules = [
        "extract_utils.js",
        "extract_accueil.js",
        "extract_wifi.js",
        "extract_dhcp_dns.js",
        "extract_dyndns.js",
        "extract_natpat.js",
        "extract_routage.js",
        "extract_dmz.js",
        "extract_vpn_siteasite.js",
        "extract_vpn_nomade.js",
        "extract_pare-feu.js",
        "extract_acces_distance.js",
        "extract_airbox.js",
        "extract_fin.js"
    ];

    for (let mod of modules) {
        await chargerScript(baseUrl + "/" + mod);
    }

    /* 4. Lancement de la logique principale */
    if (typeof window.executerExtractionBox4 === "function") {
        window.executerExtractionBox4();
    }
})();