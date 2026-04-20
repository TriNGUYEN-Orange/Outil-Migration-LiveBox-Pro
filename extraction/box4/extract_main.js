/* --- /box4/extract_main.js --- */

window.OVERLAY_CSS = `
#livebox-migration-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.40); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
.lm-box { background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.lm-box h2 { color: #ff7900; margin-top: 0; font-size: 24px; font-weight: bold; }
.lm-progress-bg { background: #f0f0f0; height: 22px; border-radius: 15px; margin: 25px 0; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
.lm-progress-bar { background: linear-gradient(90deg, #ff7900, #ff9e40); height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.lm-step-text { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #555; }
.lm-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff7900; border-radius: 50%; width: 50px; height: 50px; animation: lm-spin 1s linear infinite; margin: 0 auto 20px auto; }
@keyframes lm-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

window.OVERLAY_HTML = `
<div class="lm-box">
    <div class="lm-spinner" id="lm-spinner"></div>
    <h2 id="lm-titre">Extraction en cours...</h2>
    <div class="lm-step-text" id="lm-step-text">Initialisation du système...</div>
    <div class="lm-progress-bg"><div class="lm-progress-bar" id="lm-progress-bar"></div></div>
    <p id="lm-warning" style="color:#d9534f; font-weight:bold; font-size:14px; margin-top: 15px;">⚠️ Ne touchez pas à la page, patientez !</p>
</div>
`;

window.executerExtractionBox4 = async function() {
    const AFFICHER_UI = true;
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

    function injecterOverlay() {
        if (!AFFICHER_UI) return;
        if(document.getElementById("livebox-migration-overlay")) return;
        
        const style = document.createElement('style');
        style.innerHTML = window.OVERLAY_CSS;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = "livebox-migration-overlay";
        overlay.innerHTML = window.OVERLAY_HTML;
        document.body.appendChild(overlay);
    }

    function majOverlay(etape, total, nomModule) {
        if (!AFFICHER_UI) return;
        const pct = Math.round((etape / total) * 100);
        const barre = document.getElementById("lm-progress-bar");
        const bgBarre = document.querySelector(".lm-progress-bg");
        const texte = document.getElementById("lm-step-text");
        
        if(bgBarre) bgBarre.style.display = "block";
        if(barre) barre.style.width = pct + "%";
        if(texte) texte.innerHTML = "Étape " + etape + "/" + total + " : <br><span style='color:#ff7900'>" + nomModule + "</span>";
    }

    function majOverlayTentative(nomModule, tentativeActuelle, maxTentatives) {
        if (!AFFICHER_UI) return;
        const bgBarre = document.querySelector(".lm-progress-bg");
        const texte = document.getElementById("lm-step-text");
        
        if(bgBarre) bgBarre.style.display = "none";
        if(texte) {
            texte.innerHTML = "<span style='color:#f39c12; font-size:15px;'>⏳ Tentative de rattrapage (" + tentativeActuelle + "/" + maxTentatives + ")...</span><br><span style='color:#ff7900; font-size:18px; display:inline-block; margin-top:5px;'>" + nomModule + "</span>";
        }
    }
    
    function succesOverlay(erreursDefinitives = []) {
        if (!AFFICHER_UI) return;
        const spinner = document.getElementById("lm-spinner");
        const titre = document.getElementById("lm-titre");
        const warning = document.getElementById("lm-warning");
        const bgBarre = document.querySelector(".lm-progress-bg");
        const texte = document.getElementById("lm-step-text");
        const box = document.querySelector(".lm-box");

        if(spinner) spinner.style.display = "none";
        if(warning) warning.style.display = "none";
        if(bgBarre) bgBarre.style.display = "none";
        if(texte) texte.style.display = "none";
        
        if(box) {
            if (erreursDefinitives.length === 0) {
                if(titre) { titre.innerHTML = "✅ Extraction Terminée !"; titre.style.color = "#4caf50"; }
            } else {
                if(titre) { titre.innerHTML = "⚠️ Extraction Terminée (Partielle)"; titre.style.color = "#f39c12"; }
                
                let listeErreursHtml = "<div style='text-align: left; background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px; border: 1px solid #ffeeba;'>";
                listeErreursHtml += "<b>Informations introuvables (ou vides) :</b><ul style='margin: 10px 0 0 0; padding-left: 20px;'>";
                erreursDefinitives.forEach(err => {
                    listeErreursHtml += `<li>${err}</li>`;
                });
                listeErreursHtml += "</ul></div>";
                
                let containerErreurs = document.createElement("div");
                containerErreurs.innerHTML = listeErreursHtml;
                box.appendChild(containerErreurs);
            }

            let btn = document.createElement("button");
            btn.innerHTML = "Fermer";
            btn.style.cssText = "margin-top:15px; padding:12px 25px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px; transition: 0.3s; width: 100%; box-sizing: border-box;";
            btn.onclick = function() { document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    }

    function erreurOverlay(msg) {
        if (!AFFICHER_UI) { alert("❌ Erreur : " + msg); return; }
        const spinner = document.getElementById("lm-spinner");
        const titre = document.getElementById("lm-titre");
        const warning = document.getElementById("lm-warning");
        const box = document.querySelector(".lm-box");

        if(spinner) spinner.style.display = "none";
        if(titre) { titre.innerHTML = "❌ Erreur Critique"; titre.style.color = "#d9534f"; }
        if(warning) { warning.innerHTML = msg; warning.style.color = "#333"; warning.style.wordWrap = "break-word"; }
        
        if(box) {
            box.style.border = "4px solid #d9534f";
            let btn = document.createElement("button");
            btn.innerHTML = "Fermer et Annuler";
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px;";
            btn.onclick = function() { document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    }

    try {
        injecterOverlay();
        const TOTAL_ETAPES = 12; 
        
        let modulesEnEchec = [];

        /* ====================================================================================== */
        /* PHASE 1 : EXÉCUTION NORMALE EN SÉQUENCE  */
        /* ====================================================================================== */
        async function executerModuleNormal(etape, nomModule, fonctionExecution, fonctionValidation) {
            majOverlay(etape, TOTAL_ETAPES, nomModule);
            try {
                /* 🌟 CẬP NHẬT: Truyền false (không phải tentative) */
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
                    majOverlayTentative(mod.nomModule, tentative, MAX_TENTATIVES_RATTRAPAGE);

                    if (typeof window.simulerClic === "function" && typeof window.attendrePause === "function") {
                        console.log(`👉 Retour à l'accueil avant de réessayer [${mod.nomModule}]...`);
                        window.simulerClic("#menu_home_hyperlink");
                        await window.attendrePause(1500);
                    }

                    try {
                        /* 🌟 CẬP NHẬT: Truyền true báo hiệu đang ở chế độ tentative */
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

                if (!succesRattrapage) {
                    echecsDefinitifs.push(mod.nomModule);
                }
            }
        }

        /* ====================================================================================== */
        /* PHASE 3 : TÉLÉCHARGEMENT ET AFFICHAGE DES RÉSULTATS          */
        /* ====================================================================================== */
        
        console.log("💾 Génération du fichier JSON...");
        if (typeof window.extraireFin === "function") await window.extraireFin();

        console.log("🎉 Affichage du popup final...");
        succesOverlay(echecsDefinitifs);

    } catch (erreur) {
        console.error("❌ Une erreur est survenue durant l'exécution :", erreur);
        erreurOverlay(erreur.message);
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
        console.warn("⚠️ Exécution hors de la Livebox bloquée.");
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
        console.warn("⚠️ Utilisateur non connecté détecté. Le script est bloqué en attente de connexion.");
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

    console.log("⏳ Chargement des modules depuis : " + baseUrl);

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