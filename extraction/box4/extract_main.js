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

        await executerModuleNormal(1, "Accueil", window.extraireAccueil, () => {
            let w = window.configLivebox.wifi; return w && w.ssid && w.ssid !== "Introuvable" && w.ssid !== "";
        });

        await executerModuleNormal(2, "Réseaux Wi-Fi", window.extraireWifi, () => {
            let w2 = window.configLivebox.wifi && window.configLivebox.wifi.wifi2_4; return w2 && w2.mode && w2.mode !== "Introuvable" && w2.mode !== "";
        });

        await executerModuleNormal(3, "Réseau Local (DHCP & DNS)", window.extraireDhcpDns, () => {
            let d = window.configLivebox.dhcp_dns; return d && d["adresse IP du LAN"] && d["adresse IP du LAN"] !== "Introuvable" && d["adresse IP du LAN"] !== "";
        });

        await executerModuleNormal(4, "DynDNS", window.extraireDyndns, () => {
            let dyn = window.configLivebox.dyndns; if (!dyn) return false;
            return (Array.isArray(dyn["DynDNS externes"]) && dyn["DynDNS externes"].length > 0) || (dyn["nom DNS"] && dyn["nom DNS"] !== "Introuvable" && dyn["nom DNS"] !== "");
        });

        await executerModuleNormal(5, "NAT / PAT", window.extraireNatpat, () => {
            let n = window.configLivebox.natpat; return n && Array.isArray(n["règles IPv4"]) && n["règles IPv4"].length > 0;
        });

        await executerModuleNormal(6, "Table de Routage", window.extraireRoutage, () => {
            let r = window.configLivebox.routage; return r && Array.isArray(r["table de routage"]) && r["table de routage"].length > 0;
        });

        await executerModuleNormal(7, "Équipements DMZ", window.extraireDmz, () => {
            let d = window.configLivebox.dmz; return d && Array.isArray(d["équipements"]) && d["équipements"].length > 0;
        });

        await executerModuleNormal(8, "VPN Site à Site", window.extraireVpnSite, () => {
            let v = window.configLivebox.vpn; return v && Array.isArray(v["vpn site à site"]) && v["vpn site à site"].length > 0;
        });

        await executerModuleNormal(9, "VPN Nomade", window.extraireVpnNomade, () => {
            let v = window.configLivebox.vpn; return v && v.nomade && Array.isArray(v.nomade.comptes) && v.nomade.comptes.length > 0;
        });

        await executerModuleNormal(10, "Règles Pare-feu", window.extraireParefeu, () => {
            let p = window.configLivebox.parefeu; return p && p["niveau de protection"] && p["niveau de protection"] !== "Inconnu";
        });

        await executerModuleNormal(11, "Accès à distance", window.extraireAccesDistance, () => {
            let a = window.configLivebox["accès à distance"]; return a && a["port"] && a["port"] !== "Introuvable" && a["port"] !== "";
        });

        await executerModuleNormal(12, "Air Box (Secours)", window.extraireAirbox, () => {
            let a = window.configLivebox.airbox; return a && a["état"] && a["état"] !== "Non disponible" && a["état"] !== "Inconnu" && a["état"] !== "Erreur_Structure";
        });

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
/* AUTO-LOADER : CHARGE UI -> VÉRIFIE URL/AUTH -> CHARGE LE RESTE            */
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

    /* 1. Charger UNIQUEMENT l'UI en premier pour pouvoir afficher les alertes */
    await new Promise((resolve) => {
        let script = document.createElement('script');
        script.src = baseUrl + "/extract_ui.js?v=" + Date.now();
        script.onload = resolve;
        script.onerror = resolve; 
        document.head.appendChild(script);
    });

    /* 2. Vérification d'URL */
    let urlActuelle = window.location.hostname;
    if (!urlActuelle.includes("192.168.") && !urlActuelle.includes("livebox")) {
        window.ExtractUI.afficherAlerte(
            "Action Requise",
            "Allez sur l'interface Livebox (192.168.1.1).",
            "Connectez-vous, puis relancez le favori.",
            `<a href="http://192.168.1.1" target="_blank" style="display:inline-block; background:#ff7900; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; width:100%; box-sizing:border-box;">🌐 Ouvrir la Livebox</a>`
        );
        return; 
    }

    /* 3. Vérification de Connexion */
    let btnLogin = document.querySelector("#authentification_save_button");
    if (btnLogin && btnLogin.offsetParent !== null) {
        window.ExtractUI.afficherAlerte(
            "Connexion Requise",
            "Vous devez être connecté à la Livebox.",
            "Identifiez-vous, puis relancez le favori.",
            `<button id="btn-fermer-alerte-action" style="background:#4caf50; color:white; padding:12px 20px; border:none; border-radius:8px; font-weight:bold; font-size:15px; width:100%; cursor:pointer; box-sizing:border-box;">🔒 Me connecter</button>`
        );
        return; 
    }

    /* 4. Charger le reste des modules si tout est OK */
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
        await new Promise((resolve) => {
            let script = document.createElement('script');
            script.src = baseUrl + "/" + mod + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = resolve;
            document.head.appendChild(script);
        });
    }

    if (typeof window.executerExtractionBox4 === "function") {
        window.executerExtractionBox4();
    }
})();