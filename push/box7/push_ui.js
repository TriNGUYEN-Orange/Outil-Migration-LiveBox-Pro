/* --- /push/box7/push_ui.js --- */

window.PushUI = {
    CSS: `
        #livebox-migration-overlay { pointer-events: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.20); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
        .lm-box { pointer-events: auto; background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid transparent; }
        .lm-box h2 { color: #ff7900; margin-top: 0; font-size: 24px; font-weight: bold; }
        .lm-progress-bg { background: #f0f0f0; height: 22px; border-radius: 15px; margin: 25px 0; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
        .lm-progress-bar { background: linear-gradient(90deg, #ff7900, #ff9e40); height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .lm-step-text { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #555; }
        .lm-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff7900; border-radius: 50%; width: 50px; height: 50px; animation: lm-spin 1s linear infinite; margin: 0 auto 20px auto; }
        @keyframes lm-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `,

    HTML: `
        <div class="lm-box" id="lm-box">
            <div class="lm-spinner" id="lm-spinner"></div>
            <h2 id="lm-titre">Injection en cours...</h2>
            <div class="lm-step-text" id="lm-step-text">Initialisation du système...</div>
            <div class="lm-progress-bg" id="lm-progress-container"><div class="lm-progress-bar" id="lm-progress-bar"></div></div>
            <p id="lm-warning" style="color:#d9534f; font-weight:bold; font-size:14px; margin-top: 15px;">⚠️ Ne touchez pas à la page, patientez !</p>
        </div>
    `,

    injecter: function() {
        window._lmOverlayActive = true;
        if (!document.getElementById("livebox-migration-overlay")) {
            const style = document.createElement('style');
            style.innerHTML = this.CSS;
            document.head.appendChild(style);

            const overlay = document.createElement('div');
            overlay.id = "livebox-migration-overlay";
            overlay.innerHTML = this.HTML;
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
                    texte.innerHTML = "Étape " + window._lmCurrentStep + "/" + window._lmTotalSteps + " : <span style='color:#ff7900'>" + window._lmModuleName + "</span>";
                }
            }
        };
        window._lmInterval = setInterval(render, 500); 
    },

    maj: function(etape, total, nomModule) {
        window._lmCurrentStep = etape;
        window._lmTotalSteps = total;
        window._lmModuleName = nomModule;
        window._lmEtat = "en_cours";
    },
    
    succes: function() {
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
    },

    erreur: function(msg) {
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
};