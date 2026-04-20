/* --- /push/box6/push_main.js --- */

(async function() {
    if (window._migrationEnCours) {
        console.warn("⚠️ Une migration est déjà en cours. Veuillez patienter !");
        return;
    }
    window._migrationEnCours = true;

    /* =========================================
       ⚙️ CONFIGURATION DU COMPORTEMENT
       ========================================= */
    const BASE_URL = 'http://127.0.0.1:5500';
    const TOTAL_ETAPES = 8;
    
    /* 🚨 Mettre à 'false' pour masquer l'écran noir et regarder l'outil travailler ! */
    const AFFICHER_ECRAN_NOIR = false; 
    /* ========================================= */

    const OVERLAY_CSS_PUSH = `
    #livebox-migration-overlay { pointer-events: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
    .lm-box { pointer-events: auto; background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid transparent; }
    .lm-box h2 { color: #ff7900; margin-top: 0; font-size: 24px; font-weight: bold; }
    .lm-progress-bg { background: #f0f0f0; height: 22px; border-radius: 15px; margin: 25px 0; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
    .lm-progress-bar { background: linear-gradient(90deg, #ff7900, #ff9e40); height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    .lm-step-text { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #555; }
    .lm-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff7900; border-radius: 50%; width: 50px; height: 50px; animation: lm-spin 1s linear infinite; margin: 0 auto 20px auto; }
    @keyframes lm-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;

    const OVERLAY_HTML_PUSH = `
    <div class="lm-box" id="lm-box">
        <div class="lm-spinner" id="lm-spinner"></div>
        <h2 id="lm-titre">Injection en cours...</h2>
        <div class="lm-step-text" id="lm-step-text">Initialisation du système...</div>
        <div class="lm-progress-bg" id="lm-progress-container"><div class="lm-progress-bar" id="lm-progress-bar"></div></div>
        <p id="lm-warning" style="color:#d9534f; font-weight:bold; font-size:14px; margin-top: 15px;">⚠️ Ne touchez pas à la page, patientez !</p>
    </div>
    `;

    async function chargerModule(chemin) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            let urlComplete = BASE_URL + chemin + '?v=' + Date.now();
            script.src = urlComplete;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Fichier introuvable : ${chemin}`));
            document.head.appendChild(script);
        });
    }

    function injecterOverlay() {
        if (!AFFICHER_ECRAN_NOIR) return;
        window._lmOverlayActive = true;
        if (!document.getElementById("livebox-migration-overlay")) {
            const style = document.createElement('style');
            style.innerHTML = OVERLAY_CSS_PUSH;
            document.head.appendChild(style);
            const overlay = document.createElement('div');
            overlay.id = "livebox-migration-overlay";
            overlay.innerHTML = OVERLAY_HTML_PUSH;
            document.body.appendChild(overlay);
        }
        const render = () => {
            if (!window._lmOverlayActive) return;
            const pct = Math.round((window._lmCurrentStep / window._lmTotalSteps) * 100);
            const barre = document.getElementById("lm-progress-bar");
            const texte = document.getElementById("lm-step-text");
            if(barre) barre.style.width = pct + "%";
            if(texte && window._lmEtat !== "succes" && window._lmEtat !== "erreur") {
                texte.innerHTML = "Étape " + window._lmCurrentStep + "/" + TOTAL_ETAPES + " : <span style='color:#ff7900'>" + window._lmModuleName + "</span>";
            }
        };
        window._lmInterval = setInterval(render, 500); 
    }

    function majOverlay(etape, nomModule) {
        if (!AFFICHER_ECRAN_NOIR) return;
        window._lmCurrentStep = etape;
        window._lmModuleName = nomModule;
        window._lmEtat = "en_cours";
    }
    
    function succesOverlay() {
        window._migrationEnCours = false;
        if (!AFFICHER_ECRAN_NOIR) return;
        window._lmEtat = "succes";
        clearInterval(window._lmInterval);
        const spinner = document.getElementById("lm-spinner");
        const titre = document.getElementById("lm-titre");
        const warning = document.getElementById("lm-warning");
        const box = document.getElementById("lm-box");
        const texte = document.getElementById("lm-step-text");
        if(spinner) spinner.style.display = "none";
        if(titre) { titre.innerHTML = "✅ Injection Terminée !"; titre.style.color = "#4caf50"; }
        if(warning) warning.style.display = "none";
        if(texte) texte.innerHTML = "Tous les modules ont été appliqués avec succès.";
        if(box && !document.getElementById("btn-fermer-overlay")) {
            let btn = document.createElement("button");
            btn.id = "btn-fermer-overlay";
            btn.innerHTML = "Fermer";
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px;";
            btn.onclick = function() { window._lmOverlayActive = false; document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    }

    function erreurOverlay(msg) {
        window._migrationEnCours = false;
        if (!AFFICHER_ECRAN_NOIR) { alert("❌ ERREUR FATALE :\n" + msg); return; }
        window._lmEtat = "erreur";
        clearInterval(window._lmInterval);
        const spinner = document.getElementById("lm-spinner");
        const titre = document.getElementById("lm-titre");
        const warning = document.getElementById("lm-warning");
        const box = document.getElementById("lm-box");
        const texte = document.getElementById("lm-step-text");
        const prog = document.getElementById("lm-progress-container");
        if(spinner) spinner.style.display = "none";
        if(prog) prog.style.display = "none";
        if(titre) { titre.innerHTML = "❌ Erreur Critique"; titre.style.color = "#d9534f"; }
        if(warning) { warning.innerHTML = msg; warning.style.color = "#333"; warning.style.fontSize = "16px"; }
        if(texte) texte.innerHTML = "Arrêt immédiat du processus.";
        if(box && !document.getElementById("btn-fermer-overlay")) {
            let btn = document.createElement("button");
            btn.id = "btn-fermer-overlay";
            btn.innerHTML = "Fermer và Hủy";
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px;";
            btn.onclick = function() { window._lmOverlayActive = false; document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    }

    const preparerEnvironnement = async (nomModule) => {
        if (typeof window.retournerAccueil === "function") await window.retournerAccueil();
        if (typeof window.attendrePause === "function") await window.attendrePause(1500); 
    };

    /* --- EXECUTION --- */
    try {
        injecterOverlay();
        await new Promise(r => setTimeout(r, 1000)); 

        majOverlay(0, "Chargement des utilitaires...");
        await chargerModule('/push/push_utils.js');

        /*
        majOverlay(0.5, "Réveil du système (Mise en cache)");
        await preparerEnvironnement("Wake-Up");
        await chargerModule('/push/box6/push_wakeup.js');
        if (typeof window.executerWakeUp === "function") await window.executerWakeUp();

         
        majOverlay(1, "Réseaux Wi-Fi");
        await preparerEnvironnement("Wi-Fi");
        await chargerModule('/push/box6/push_wifi.js');
        if (typeof window.executerWifi === "function") await window.executerWifi();
        

        majOverlay(2, "Pare-feu");
        await preparerEnvironnement("Pare-feu");
        await chargerModule('/push/box6/push_parefeu.js'); // Load file mới
        if (typeof window.executerParefeu === "function") await window.executerParefeu();
        else throw new Error("Fonction window.executerParefeu introuvable.");

        majOverlay(3, "Accès à distance");
        await preparerEnvironnement("Accès à distance");
        await chargerModule('/push/box6/push_acces_distance.js');
        if (typeof window.executerAccesDistance === "function") await window.executerAccesDistance();
        else throw new Error("Fonction window.executerAccesDistance introuvable.");
        

        majOverlay(4, "Airbox");
        await preparerEnvironnement("Airbox");
        await chargerModule('/push/box6/push_airbox.js');
        if (typeof window.executerAirbox === "function") await window.executerAirbox();
        else throw new Error("Fonction window.executerAirbox introuvable.");
        */

        majOverlay(5, "VPN Nomade");
        await preparerEnvironnement("VPN Nomade");
        await chargerModule('/push/box6/push_vpn_nomade.js');
        if (typeof window.executerVpnNomade === "function") await window.executerVpnNomade();
        else throw new Error("Fonction window.executerVpnNomade introuvable.");

        
        /* 
        else throw new Error("Fonction window.executerWifi introuvable.");
        for(let i = 2; i <= TOTAL_ETAPES; i++) {
            majOverlay(i, "Module " + i + " (en attente)");
            if (typeof window.attendrePause === "function") await window.attendrePause(500);
        }
        */


        succesOverlay();
    } catch (erreurGrave) {
        erreurOverlay(erreurGrave.message);
    }
})();