/* --- /box4/extract_ui.js --- */

window.ExtractUI = {
    AFFICHER_UI: true,

    CSS: `
        #livebox-migration-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.40); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
        .lm-box { background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .lm-box h2 { color: #ff7900; margin-top: 0; font-size: 24px; font-weight: bold; }
        .lm-progress-bg { background: #f0f0f0; height: 22px; border-radius: 15px; margin: 25px 0; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
        .lm-progress-bar { background: linear-gradient(90deg, #ff7900, #ff9e40); height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .lm-step-text { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #555; }
        .lm-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff7900; border-radius: 50%; width: 50px; height: 50px; animation: lm-spin 1s linear infinite; margin: 0 auto 20px auto; }
        @keyframes lm-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `,

    HTML: `
        <div class="lm-box">
            <div class="lm-spinner" id="lm-spinner"></div>
            <h2 id="lm-titre">Extraction en cours...</h2>
            <div class="lm-step-text" id="lm-step-text">Initialisation du système...</div>
            <div class="lm-progress-bg"><div class="lm-progress-bar" id="lm-progress-bar"></div></div>
            <p id="lm-warning" style="color:#d9534f; font-weight:bold; font-size:14px; margin-top: 15px;">⚠️ Ne touchez pas à la page, patientez !</p>
        </div>
    `,

    injecter: function() {
        if (!this.AFFICHER_UI) return;
        if(document.getElementById("livebox-migration-overlay")) return;
        
        const style = document.createElement('style');
        style.innerHTML = this.CSS;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = "livebox-migration-overlay";
        overlay.innerHTML = this.HTML;
        document.body.appendChild(overlay);
    },

    majNormal: function(etape, total, nomModule) {
        if (!this.AFFICHER_UI) return;
        const pct = Math.round((etape / total) * 100);
        const barre = document.getElementById("lm-progress-bar");
        const bgBarre = document.querySelector(".lm-progress-bg");
        const texte = document.getElementById("lm-step-text");
        
        if(bgBarre) bgBarre.style.display = "block";
        if(barre) barre.style.width = pct + "%";
        if(texte) texte.innerHTML = "Étape " + etape + "/" + total + " : <br><span style='color:#ff7900'>" + nomModule + "</span>";
    },

    majTentative: function(nomModule, tentativeActuelle, maxTentatives) {
        if (!this.AFFICHER_UI) return;
        const bgBarre = document.querySelector(".lm-progress-bg");
        const texte = document.getElementById("lm-step-text");
        
        if(bgBarre) bgBarre.style.display = "none";
        if(texte) {
            texte.innerHTML = "<span style='color:#f39c12; font-size:15px;'>⏳ Tentative de rattrapage (" + tentativeActuelle + "/" + maxTentatives + ")...</span><br><span style='color:#ff7900; font-size:18px; display:inline-block; margin-top:5px;'>" + nomModule + "</span>";
        }
    },

    succes: function(erreursDefinitives = []) {
        if (!this.AFFICHER_UI) return;
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
                erreursDefinitives.forEach(err => { listeErreursHtml += `<li>${err}</li>`; });
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
    },

    erreur: function(msg) {
        if (!this.AFFICHER_UI) { alert("❌ Erreur : " + msg); return; }
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
};