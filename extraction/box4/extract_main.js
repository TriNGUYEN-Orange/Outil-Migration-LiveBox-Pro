/* --- /box4/extract_main.js --- */

window.executerExtractionBox4 = async function() {
    const MAX_TENTATIVES_RATTRAPAGE = 2; 

    /* Nettoyage du stockage local avant de commencer */
    if (window.CLE_STORAGE) {
        localStorage.removeItem(window.CLE_STORAGE);
    } else {
        localStorage.removeItem("livebox_migration_config");
    }
    
    window.configLivebox = { 
        "wifi": {}, "dhcp_dns": {}, "natpat": {}, "dyndns": {},
        "dmz": {}, "routage": {}, "parefeu": {}, "vpn": {},
        "accès à distance" : {}, "airbox" : {}
    };

    try {
        window.ExtractUI.injecter();
        const TOTAL_ETAPES = 12; 
        let modulesEnEchec = [];

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
        const Verif = window.ExtractVerification || {};

        /* ====================================================================================== */
        /* PHASE 1 : EXÉCUTION DES MODULES BOX 4                                                  */
        /* ====================================================================================== */
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
        /* PHASE 2 : RATTRAPAGE                                                                   */
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
        /* PHASE 3 : TÉLÉCHARGEMENT FINAL                                                         */
        /* ====================================================================================== */
        if (typeof window.extraireFin === "function") {
            await window.extraireFin();
        }
        window.ExtractUI.succes(echecsDefinitifs);

    } catch (erreur) {
        console.error("❌ Erreur :", erreur);
        if (window.ExtractUI) window.ExtractUI.erreur(erreur.message);
    }
};

/* ========================================================================= */
/* AUTO-LOADER : CHARGE LES COMMUNS PUIS LES MODULES LOCAUX BOX 4            */
/* ========================================================================= */
(async function() {
    let baseUrlBox4 = "";
    
    /* Utilisation prioritaire de currentScript pour une precision absolue */
    if (document.currentScript && document.currentScript.src) {
        baseUrlBox4 = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/'));
    } else {
        let scripts = document.getElementsByTagName("script");
        for (let s of scripts) {
            /* Filtre strict sur le dossier box4 pour ignorer les fantomes */
            if (s.src && s.src.includes("box4/extract_main.js")) {
                baseUrlBox4 = s.src.substring(0, s.src.lastIndexOf('/'));
                break;
            }
        }
    }
    
    if (!baseUrlBox4) baseUrlBox4 = "http://127.0.0.1:5500/extraction/box4";
    
    let extractionUrl = baseUrlBox4.substring(0, baseUrlBox4.lastIndexOf('/'));
    
    let rootUrl = baseUrlBox4;
    if (baseUrlBox4.includes("/extraction/box4")) {
        rootUrl = baseUrlBox4.replace("/extraction/box4", "");
    } else if (baseUrlBox4.includes("/box4")) {
        rootUrl = baseUrlBox4.replace("/box4", "");
    } else {
        rootUrl = "http://127.0.0.1:5500";
    }

    const chargerScript = async (url) => {
        return new Promise((resolve) => {
            let script = document.createElement('script');
            script.src = url + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = () => { console.warn("Fichier introuvable :", url); resolve(); }; 
            document.head.appendChild(script);
        });
    };

    await chargerScript(extractionUrl + "/extract_ui.js");
    await chargerScript(extractionUrl + "/extract_utils.js");
    await chargerScript(extractionUrl + "/extract_fin.js");
    await chargerScript(rootUrl + "/outil/verification.js"); 

    if (window.ExtractVerification && typeof window.ExtractVerification.verifierEnvironnement === "function") {
        let environnementOk = await window.ExtractVerification.verifierEnvironnement(false);
        if (!environnementOk) return;
    }

    await chargerScript(baseUrlBox4 + "/extract_verification.js");

    const modulesBox4 = [
        "extract_accueil.js", "extract_wifi.js", "extract_dhcp_dns.js",
        "extract_dyndns.js", "extract_natpat.js", "extract_routage.js",
        "extract_dmz.js", "extract_vpn_siteasite.js", "extract_vpn_nomade.js",
        "extract_pare-feu.js", "extract_acces_distance.js", "extract_airbox.js"
    ];

    for (let mod of modulesBox4) {
        await chargerScript(baseUrlBox4 + "/" + mod);
    }

    if (typeof window.executerExtractionBox4 === "function") {
        window.executerExtractionBox4();
    }
})();