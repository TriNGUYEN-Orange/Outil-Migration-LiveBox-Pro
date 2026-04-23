/* --- /box4/extract_ui.js --- */

window.ExtractUI = {
    AFFICHER_UI: true,

    CSS: `
        #livebox-migration-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.50); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
        .lm-box { background: #fff; color: #333; padding: 35px; border-radius: 12px; width: 420px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .lm-box h2 { color: #ff7900; margin-top: 0; font-size: 22px; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 10px; }
        .lm-progress-bg { background: #f0f0f0; height: 18px; border-radius: 10px; margin: 20px 0; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
        .lm-progress-bar { background: linear-gradient(90deg, #ff7900, #ff9e40); height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .lm-step-text { font-size: 15px; font-weight: bold; margin-bottom: 10px; color: #555; }
        .lm-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff7900; border-radius: 50%; width: 45px; height: 45px; animation: lm-spin 1s linear infinite; margin: 0 auto 15px auto; }
        @keyframes lm-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `,

    HTML: `
        <div class="lm-box">
            <div class="lm-spinner" id="lm-spinner"></div>
            <h2 id="lm-titre">Extraction en cours...</h2>
            <div class="lm-step-text" id="lm-step-text">Initialisation...</div>
            <div class="lm-progress-bg"><div class="lm-progress-bar" id="lm-progress-bar"></div></div>
            <p id="lm-warning" style="color:#d9534f; font-weight:bold; font-size:14px; margin-top: 10px;">⚠️ Patientez, ne touchez à rien.</p>
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
        document.querySelector(".lm-progress-bg").style.display = "block";
        document.getElementById("lm-progress-bar").style.width = pct + "%";
        document.getElementById("lm-step-text").innerHTML = "Étape " + etape + "/" + total + " : <br><span style='color:#ff7900'>" + nomModule + "</span>";
    },

    majTentative: function(nomModule, tentativeActuelle, maxTentatives) {
        if (!this.AFFICHER_UI) return;
        document.querySelector(".lm-progress-bg").style.display = "none";
        document.getElementById("lm-step-text").innerHTML = "<span style='color:#f39c12; font-size:14px;'>⏳ Rattrapage (" + tentativeActuelle + "/" + maxTentatives + ")...</span><br><span style='color:#ff7900; font-size:16px;'>" + nomModule + "</span>";
    },

    succes: function(erreursDefinitives = []) {
        if (!this.AFFICHER_UI) return;
        document.getElementById("lm-spinner").style.display = "none";
        document.getElementById("lm-warning").style.display = "none";
        document.querySelector(".lm-progress-bg").style.display = "none";
        document.getElementById("lm-step-text").style.display = "none";
        
        const box = document.querySelector(".lm-box");
        const titre = document.getElementById("lm-titre");

        if (erreursDefinitives.length === 0) {
            titre.innerHTML = "✅ Extraction Terminée !"; 
            titre.style.color = "#4caf50";
        } else {
            titre.innerHTML = "⚠️ Terminé (Incomplet)"; 
            titre.style.color = "#f39c12";
            
            let listeErreursHtml = "<div style='text-align: left; background: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 13px; border: 1px solid #ffeeba;'>";
            listeErreursHtml += "<b>Données introuvables :</b><ul style='margin: 8px 0 0 0; padding-left: 20px;'>";
            erreursDefinitives.forEach(err => { listeErreursHtml += `<li>${err}</li>`; });
            listeErreursHtml += "</ul></div>";
            
            let containerErreurs = document.createElement("div");
            containerErreurs.innerHTML = listeErreursHtml;
            box.appendChild(containerErreurs);
        }

        let btn = document.createElement("button");
        btn.innerHTML = "Fermer";
        btn.style.cssText = "margin-top:10px; padding:10px 20px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 15px; width: 100%;";
        btn.onclick = function() { document.getElementById("livebox-migration-overlay").remove(); };
        box.appendChild(btn);
    },

    erreur: function(msg) {
        if (!this.AFFICHER_UI) { alert("❌ Erreur : " + msg); return; }
        document.getElementById("lm-spinner").style.display = "none";
        document.getElementById("lm-titre").innerHTML = "❌ Erreur Critique"; 
        document.getElementById("lm-titre").style.color = "#d9534f";
        
        let warning = document.getElementById("lm-warning");
        warning.innerHTML = msg; 
        warning.style.color = "#333"; 
        warning.style.wordWrap = "break-word";
        
        let box = document.querySelector(".lm-box");
        box.style.border = "4px solid #d9534f";
        
        let btn = document.createElement("button");
        btn.innerHTML = "Fermer et Annuler";
        btn.style.cssText = "margin-top:15px; padding:10px 20px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 15px; width: 100%;";
        btn.onclick = function() { document.getElementById("livebox-migration-overlay").remove(); };
        box.appendChild(btn);
    },

    /* NOUVEAU: Popup géré entièrement par extract_ui.js avec textes raccourcis */
    afficherAlerte: function(titre, ligne1, ligne2, actionHtml) {
        let overlayAlerte = document.createElement("div");
        overlayAlerte.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); z-index: 9999999; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; backdrop-filter: blur(5px);";
        
        let boxAlerte = document.createElement("div");
        boxAlerte.style.cssText = "background: #fff; padding: 35px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.6); border-top: 5px solid #d9534f;";
        
        boxAlerte.innerHTML = `
            <h2 style="color: #d9534f; margin-top: 0; font-size: 22px; display: flex; justify-content: center; align-items: center; gap: 8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                ${titre}
            </h2>
            <p style="color: #333; font-size: 15px; margin-bottom: 10px;">${ligne1}</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 25px;">${ligne2}</p>
            ${actionHtml}
            <br>
            <button id="btn-fermer-alerte" style="background: transparent; border: none; color: #888; text-decoration: underline; cursor: pointer; font-size: 13px; margin-top: 10px;">Annuler</button>
        `;
        
        overlayAlerte.appendChild(boxAlerte);
        document.body.appendChild(overlayAlerte);
        
        let fermerPopup = () => overlayAlerte.remove();
        document.getElementById("btn-fermer-alerte").onclick = fermerPopup;
        let btnAction = document.getElementById("btn-fermer-alerte-action");
        if(btnAction) btnAction.onclick = fermerPopup;
    }
};