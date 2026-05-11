/* --- /box3/extract_main.js --- */

window.executerExtractionBox3 = async function() {
    const MAX_TENTATIVES_RATTRAPAGE = 2;

    /* Nettoyage du stockage local avant de commencer */
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
                    console.warn(`✅ Module [${nomModule}] réussi.`);
                }
            } catch (erreur) {
                console.error(`❌ Erreur pendant [${nomModule}] :`, erreur);
                modulesEnEchec.push({ etape, nomModule, fonctionExecution, fonctionValidation });
            }
        }

        const Verif = window.ExtractVerification || {};

        /* =================================================================== */
        /* EXÉCUTION DES MODULES BOX 3                                         */
        /* =================================================================== */
        await executerModuleNormal(1, "Accueil", window.extraireAccueilBox3, Verif.validerAccueil);
        await executerModuleNormal(2, "Réseaux Wi-Fi", window.extraireWifiBox3, Verif.validerWifi);
        await executerModuleNormal(3, "Réseau Local (DHCP & DNS)", window.extraireDhcpDnsBox3, Verif.validerDhcpDns); 
        await executerModuleNormal(4, "Table de Routage", window.extraireRoutageBox3, Verif.validerRoutage);
        await executerModuleNormal(5, "NAT/PAT", window.extraireNatpatBox3, Verif.validerNatpat);
        await executerModuleNormal(4, "DynDNS", window.extraireDyndnsBox3, Verif.validerDyndns);
        await executerModuleNormal(7, "DMZ", window.extraireDmzBox3, Verif.validerDmz);
        await executerModuleNormal(8, "Pare-feu", window.extraireParefeuBox3, Verif.validerParefeu);   


        /* =================================================================== */
        /* PHASE DE RATTRAPAGE                                                 */
        /* =================================================================== */
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
                        if (typeof mod.fonctionValidation === "function" && mod.fonctionValidation()) {
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

        /* =================================================================== */
        /* TÉLÉCHARGEMENT FINAL                                                */
        /* =================================================================== */
        if (typeof window.extraireFin === "function") {
            console.warn("Génération du fichier de configuration final...");
            await window.extraireFin();
        }

        window.ExtractUI.succes(echecsDefinitifs);

    } catch (erreur) {
        console.error("❌ Erreur :", erreur);
        if (window.ExtractUI) window.ExtractUI.erreur(erreur.message);
    }
};

/* ========================================================================= */
/* AUTO-LOADER BOX 3 : CHARGE LES COMMUNS PUIS LES MODULES BOX 3             */
/* ========================================================================= */
(async function() {
    let baseUrlBox3 = "";
    let scripts = document.getElementsByTagName("script");
    for (let s of scripts) {
        if (s.src && s.src.includes("extract_main.js")) {
            baseUrlBox3 = s.src.substring(0, s.src.lastIndexOf('/'));
            break;
        }
    }
    if (!baseUrlBox3) baseUrlBox3 = "http://127.0.0.1:5500/extraction/box3";
    
    /* Déduire l'URL du dossier parent /extraction/ */
    let extractionUrl = baseUrlBox3.substring(0, baseUrlBox3.lastIndexOf('/'));
    let rootUrl = extractionUrl.substring(0, extractionUrl.indexOf('/extraction'));
    if (!rootUrl) rootUrl = "http://127.0.0.1:5500";

    const chargerScript = async (url) => {
        return new Promise((resolve) => {
            let script = document.createElement('script');
            script.src = url + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = () => { console.warn("Fichier non trouvé:", url); resolve(); }; 
            document.head.appendChild(script);
        });
    };

    /* 1. CHARGER LES FICHIERS COMMUNS DEPUIS LE DOSSIER PARENT */
    await chargerScript(extractionUrl + "/extract_ui.js");
    await chargerScript(extractionUrl + "/extract_utils.js");
    await chargerScript(extractionUrl + "/extract_fin.js"); // Ajout du module final
    await chargerScript(rootUrl + "/outil/verification.js");

    /* 2. CHARGER CELLE DE BOX 3 */
    await chargerScript(baseUrlBox3 + "/extract_verification.js"); 

    /* 3. CHARGER LES MODULES LOCAUX BOX 3 */
    const modulesBox3 = [
        "extract_accueil.js",
        "extract_wifi.js",
        "extract_dhcp_dns.js",
        "extract_routage.js",
        "extract_natpat.js",
        "extract_dyndns.js",
        "extract_dmz.js",
        "extract_parefeu.js"
    ];

    for (let mod of modulesBox3) {
        await chargerScript(baseUrlBox3 + "/" + mod);
    }

    /* 4. Lancement */
    if (typeof window.executerExtractionBox3 === "function") {
        window.executerExtractionBox3();
    }
})();