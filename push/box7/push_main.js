/* --- /push/box7/push_main.js --- */

(async function() {
    if (window._migrationEnCours) {
        console.warn("⚠️ Une migration est déjà en cours. Veuillez patienter !");
        return;
    }
    window._migrationEnCours = true;

    const BASE_URL = 'http://127.0.0.1:5500';
    const TOTAL_ETAPES = 8;

    /* --- CSS ET HTML DE L'OVERLAY --- */
    const OVERLAY_CSS_PUSH = `
    #livebox-migration-overlay { pointer-events: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.20); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
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
            
            script.onload = () => {
                console.log(`✅ Module chargé avec succès : ${chemin}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ ÉCHEC DE CHARGEMENT (Erreur 404) : ${urlComplete}`);
                reject(new Error(`Fichier introuvable : <b>${chemin}</b><br><br>Vérifiez que VS Code Live Server est bien ouvert à la racine du dossier.`)); 
            };
            
            document.head.appendChild(script);
        });
    }

    function injecterOverlay() {
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
            if (window._lmModuleName) {
                const pct = Math.round((window._lmCurrentStep / window._lmTotalSteps) * 100);
                const barre = document.getElementById("lm-progress-bar");
                const texte = document.getElementById("lm-step-text");
                
                if(barre) barre.style.width = pct + "%";
                if(texte && window._lmEtat !== "succes" && window._lmEtat !== "erreur") {
                    texte.innerHTML = "Étape " + window._lmCurrentStep + "/" + TOTAL_ETAPES + " : <span style='color:#ff7900'>" + window._lmModuleName + "</span>";
                }
            }
        };
        window._lmInterval = setInterval(render, 500); 
    }

    function majOverlay(etape, nomModule) {
        window._lmCurrentStep = etape;
        window._lmModuleName = nomModule;
        window._lmEtat = "en_cours";
    }
    
    function succesOverlay() {
        window._lmEtat = "succes";
        window._migrationEnCours = false;
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
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px; transition: 0.3s;";
            btn.onclick = function() { window._lmOverlayActive = false; document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    }

    function erreurOverlay(msg) {
        window._lmEtat = "erreur";
        window._migrationEnCours = false;
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
        if(warning) { warning.innerHTML = msg; warning.style.color = "#333"; warning.style.wordWrap = "break-word"; warning.style.fontSize = "16px"; }
        if(texte) texte.innerHTML = "Arrêt immédiat du processus.";
        
        if(box && !document.getElementById("btn-fermer-overlay")) {
            box.style.border = "4px solid #d9534f";
            let btn = document.createElement("button");
            btn.id = "btn-fermer-overlay";
            btn.innerHTML = "Fermer et Annuler";
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px;";
            btn.onclick = function() { window._lmOverlayActive = false; document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    }

    const preparerEnvironnement = async (nomModule) => {
        console.log("🔄 Préparation pour le module : [" + nomModule + "]");
        
        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
        }
        
        if (typeof window.attendrePause === "function") {
            await window.attendrePause(1500); 
        }
        console.log("✅ Prêt pour : " + nomModule);
    };

    /* 6. LUỒNG CHẠY CHÍNH (ORCHESTRATEUR) */
    try {
        console.log("🚀 Démarrage de l'Orchestrateur LB7...");
        injecterOverlay();

        await new Promise(r => setTimeout(r, 1000)); 

        /* 0. CHARGEMENT DES OUTILS */
        majOverlay(0, "Chargement des utilitaires...");
        await chargerModule('/push/push_utils.js');

        /* 1. WI-FI */
        majOverlay(1, "Réseaux Wi-Fi");
        await preparerEnvironnement("Wi-Fi");
        await chargerModule('/push/box7/push_wifi.js');
        if (typeof window.executerWifi === "function") await window.executerWifi();
        else throw new Error("Fonction window.executerWifi introuvable.");

        /* 2. ROUTAGE */
        majOverlay(2, "Table de Routage");
        await preparerEnvironnement("Routage");
        await chargerModule('/push/box7/push_routage.js');
        if (typeof window.executerRoutage === "function") await window.executerRoutage();
        else throw new Error("Fonction window.executerRoutage introuvable.");

        /* 3. AIRBOX */
        majOverlay(3, "Configuration Airbox");
        await preparerEnvironnement("Airbox");
        await chargerModule('/push/box7/push_airbox.js');
        if (typeof window.executerAirbox === "function") await window.executerAirbox();
        else throw new Error("Fonction window.executerAirbox introuvable.");

        /* Các bước chưa làm... */
        for(let i = 4; i <= TOTAL_ETAPES; i++) {
            majOverlay(i, "Module " + i + " (en construction)");
            if (typeof window.attendrePause === "function") await window.attendrePause(800);
        }

        console.log("🎉 Configuration globale terminée avec succès !");
        succesOverlay();

    } catch (erreurGrave) {
        console.error("❌ ARRÊT FATAL :", erreurGrave);
        erreurOverlay(erreurGrave.message);
    }
})();