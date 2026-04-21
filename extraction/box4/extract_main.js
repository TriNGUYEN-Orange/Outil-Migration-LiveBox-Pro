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
        /* PHASE 1 : EXÉCUTION NORMALE EN SÉQUENCE  */
        /* ====================================================================================== */
        async function executerModuleNormal(etape, nomModule, fonctionExecution, fonctionValidation) {
            window.ExtractUI.majNormal(etape, TOTAL_ETAPES, nomModule);
            try {
                if (typeof fonctionExecution === "function") await fonctionExecution(false);

                let estValide = true;
                if (typeof fonctionValidation === "function") estValide = fonctionValidation();

                if (!estValide) {
                    console.warn(`⚠️ Données vides pour [${nomModule}]. Mise en file d'attente pour tentative.`);
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
            let hasList = Array.isArray(dyn["DynDNS externes"]) && dyn["DynDNS externes"].length > 0;
            let hasName = dyn["nom DNS"] && dyn["nom DNS"] !== "Introuvable" && dyn["nom DNS"] !== "";
            return hasList || hasName;
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
        /* PHASE 2 : TENTATIVES DE RATTRAPAGE  */
        /* ====================================================================================== */
        let echecsDefinitifs = [];

        if (modulesEnEchec.length > 0) {
            console.log("🔄 Début de la phase de tentative pour les modules vides...");
            
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
                        let estValide = mod.fonctionValidation();
                        
                        if (estValide) {
                            console.log(`✅ Tentative ${tentative} réussie pour [${mod.nomModule}] !`);
                            succesRattrapage = true;
                            break; 
                        } else {
                            console.warn(`⚠️ Toujours vide après tentative ${tentative} : [${mod.nomModule}].`);
                        }
                    } catch(e) {
                        console.error(`❌ Échec de la tentative ${tentative} pour [${mod.nomModule}].`, e);
                    }
                }

                if (!succesRattrapage) echecsDefinitifs.push(mod.nomModule);
            }
        }

        /* ====================================================================================== */
        /* PHASE 3 : TÉLÉCHARGEMENT ET AFFICHAGE DES RÉSULTATS          */
        /* ====================================================================================== */
        console.log("💾 Génération du fichier JSON...");
        if (typeof window.extraireFin === "function") await window.extraireFin();

        console.log("🎉 Affichage du popup final...");
        window.ExtractUI.succes(echecsDefinitifs);

    } catch (erreur) {
        console.error("❌ Une erreur est survenue durant l'exécution :", erreur);
        window.ExtractUI.erreur(erreur.message);
    }
};

/* ========================================================================= */
/* AUTO-LOADER : VÉRIFICATIONS (URL & CONNEXION) + CHARGEMENT DES MODULES    */
/* ========================================================================= */
(async function() {
    function afficherAlerte(titre, ligne1, ligne2, actionHtml) {
        let overlayAlerte = document.createElement("div");
        overlayAlerte.id = "livebox-alerte-overlay";
        overlayAlerte.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999999; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; backdrop-filter: blur(5px);";
        
        let boxAlerte = document.createElement("div");
        boxAlerte.style.cssText = "background: #fff; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.6); border-top: 5px solid #d9534f;";
        
        boxAlerte.innerHTML = `
            <h2 style="color: #d9534f; margin-top: 0; font-size: 24px; display: flex; justify-content: center; align-items: center; gap: 10px;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                ${titre}
            </h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 20px; line-height: 1.5;">${ligne1}</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 30px; line-height: 1.5;">${ligne2}</p>
            ${actionHtml}
            <br>
            <button id="btn-fermer-alerte" style="background: transparent; border: none; color: #888; text-decoration: underline; cursor: pointer; font-size: 14px;">Fermer ce message</button>
        `;
        
        overlayAlerte.appendChild(boxAlerte);
        document.body.appendChild(overlayAlerte);
        
        let fermerPopup = () => overlayAlerte.remove();
        document.getElementById("btn-fermer-alerte").onclick = fermerPopup;
        let btnAction = document.getElementById("btn-fermer-alerte-action");
        if(btnAction) btnAction.onclick = fermerPopup;
    }

    let urlActuelle = window.location.hostname;
    if (!urlActuelle.includes("192.168.") && !urlActuelle.includes("livebox")) {
        afficherAlerte(
            "Action Requise",
            "Ce script doit être exécuté <b>uniquement</b> sur la page d'administration de votre Livebox.",
            "Cliquez sur le bouton ci-dessous pour ouvrir l'interface de la Livebox dans un nouvel onglet, connectez-vous, puis reliquez sur le favori (bookmarklet).",
            `<a href="http://192.168.1.1" target="_blank" style="display: inline-block; background: #ff7900; color: white; padding: 14px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-bottom: 20px; width: 100%; box-sizing: border-box; transition: background 0.3s; box-shadow: 0 4px 6px rgba(255, 121, 0, 0.3);">🌐 Ouvrir l'interface Livebox</a>`
        );
        return; 
    }

    let isLoggedOut = false;
    let btnLogin = document.querySelector("#authentification_save_button");
    if (btnLogin && btnLogin.offsetParent !== null) {
        isLoggedOut = true;
    }

    if (isLoggedOut) {
        afficherAlerte(
            "Connexion Requise",
            "Vous êtes bien sur l'interface de la Livebox, mais <b>vous n'êtes pas connecté</b>.",
            "Veuillez vous identifier avec votre mot de passe administrateur. Une fois connecté, <b>cliquez à nouveau sur le favori (bookmarklet)</b> pour lancer l'extraction.",
            `<button id="btn-fermer-alerte-action" style="display: inline-block; background: #4caf50; color: white; padding: 14px 20px; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-bottom: 20px; width: 100%; cursor: pointer; box-sizing: border-box; box-shadow: 0 4px 6px rgba(76, 175, 80, 0.3);">🔒 OK, je vais me connecter</button>`
        );
        return; 
    }

    console.log("🚀 Initialisation du système d'extraction Box 4...");
    
    let baseUrl = "";
    let scripts = document.getElementsByTagName("script");
    for (let s of scripts) {
        if (s.src && s.src.includes("extract_main.js")) {
            baseUrl = s.src.substring(0, s.src.lastIndexOf('/'));
            break;
        }
    }
    if (!baseUrl) baseUrl = "http://127.0.0.1:5500/extraction/box4";

    /* 🌟 NOUVEAU: Ajout de extract_ui.js dans la liste des modules */
    const modules = [
        "extract_utils.js",
        "extract_ui.js",
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
            script.onload = () => { resolve(); };
            script.onerror = () => { console.warn("⚠️ Ignore module manquant : " + mod); resolve(); };
            document.head.appendChild(script);
        });
    }

    if (typeof window.executerExtractionBox4 === "function") {
        console.log("✅ Tous les modules chargés. Lancement !");
        window.executerExtractionBox4();
    }
})();