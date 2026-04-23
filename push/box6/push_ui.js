/* --- /push/box6/push_ui.js --- */

window.PushUI = {
    AFFICHER_ECRAN_NOIR: false, 

    CSS: `
        #livebox-migration-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.29); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
        .lm-box { background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid transparent; }
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
        if (!this.AFFICHER_ECRAN_NOIR) return;
        if(document.getElementById("livebox-migration-overlay")) return;
        
        const style = document.createElement('style');
        style.innerHTML = this.CSS;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = "livebox-migration-overlay";
        overlay.innerHTML = this.HTML;
        document.body.appendChild(overlay);
    },

    maj: function(etape, total, nomModule) {
        if (!this.AFFICHER_ECRAN_NOIR) return;
        const pct = Math.round((etape / total) * 100);
        const barre = document.getElementById("lm-progress-bar");
        const texte = document.getElementById("lm-step-text");
        
        if(barre) barre.style.width = pct + "%";
        if(texte) {
            texte.innerHTML = "Étape " + etape + "/" + total + " : <br><span style='color:#ff7900'>" + nomModule + "</span>";
        }
    },

    succes: function() {
        if (!this.AFFICHER_ECRAN_NOIR) return;
        const spinner = document.getElementById("lm-spinner");
        const titre = document.getElementById("lm-titre");
        const warning = document.getElementById("lm-warning");
        const box = document.getElementById("lm-box");
        const texte = document.getElementById("lm-step-text");

        if(spinner) spinner.style.display = "none";
        if(warning) warning.style.display = "none";
        if(titre) { titre.innerHTML = "✅ Injection Terminée !"; titre.style.color = "#4caf50"; }
        if(texte) texte.innerHTML = "Tous les modules ont été appliqués avec succès.";
        
        if(box && !document.getElementById("btn-fermer-overlay")) {
            let btn = document.createElement("button");
            btn.id = "btn-fermer-overlay";
            btn.innerHTML = "Fermer";
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px; width: 100%;";
            btn.onclick = function() { document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    },

    erreur: function(msg) {
        if (!this.AFFICHER_ECRAN_NOIR) { alert("❌ ERREUR FATALE :\n" + msg); return; }
        const spinner = document.getElementById("lm-spinner");
        const titre = document.getElementById("lm-titre");
        const warning = document.getElementById("lm-warning");
        const box = document.getElementById("lm-box");
        const texte = document.getElementById("lm-step-text");
        const prog = document.getElementById("lm-progress-container");

        if(spinner) spinner.style.display = "none";
        if(prog) prog.style.display = "none";
        if(titre) { titre.innerHTML = "❌ Erreur Critique"; titre.style.color = "#d9534f"; }
        if(texte) texte.innerHTML = "Arrêt immédiat du processus.";
        if(warning) { warning.innerHTML = msg; warning.style.color = "#333"; warning.style.fontSize = "16px"; }
        
        if(box && !document.getElementById("btn-fermer-overlay")) {
            let btn = document.createElement("button");
            btn.id = "btn-fermer-overlay";
            btn.innerHTML = "Fermer et Annuler";
            btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px; width: 100%;";
            btn.onclick = function() { document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    },

    /* =================================================================================== */
    /* POPUP DE VALIDATION INTÉGRÉE AVEC VÉRIFICATION EN TEMPS RÉEL                        */
    /* =================================================================================== */
    afficherPopupValidation: function(titre, message, valeurInitiale, fonctionValidation) {
        return new Promise((resolve) => {
            let overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(3px);";
            
            let boite = document.createElement("div");
            boite.style.cssText = "background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); max-width:450px; width:90%; font-family:'Segoe UI', sans-serif; pointer-events:auto; text-align:center; border-top: 5px solid #ff7900;";
            
            let h3 = document.createElement("h3"); 
            h3.innerText = titre; 
            h3.style.cssText = "color:#d9534f; margin-top:0; font-size:20px;";
            
            let msg = document.createElement("p"); 
            msg.innerText = message;
            msg.style.cssText = "font-size:15px; color:#555; line-height:1.5;";
            
            /* Wrapper pour l'input et l'icône OK */
            let inputWrapper = document.createElement("div");
            inputWrapper.style.cssText = "position:relative; margin-top:15px;";
            
            let input = document.createElement("input"); 
            input.type = "text"; 
            input.value = valeurInitiale || "";
            /* Ajout d'un padding-right pour ne pas que le texte chevauche l'icône */
            input.style.cssText = "width:100%; box-sizing:border-box; padding:12px 40px 12px 12px; border:2px solid #ddd; border-radius:6px; font-size:16px; outline:none; transition: border-color 0.3s;";
            
            let iconeOk = document.createElement("span");
            iconeOk.innerText = "✅";
            iconeOk.style.cssText = "position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:18px; display:none; pointer-events:none;";
            
            inputWrapper.append(input, iconeOk);

            /* Fonction de vérification en temps réel */
            const verifierSaisie = () => {
                if (!fonctionValidation) {
                    input.style.borderColor = "#ff7900";
                    return;
                }
                
                if (fonctionValidation(input.value)) {
                    input.style.borderColor = "#4caf50"; /* Vert succès */
                    iconeOk.style.display = "block"; /* Afficher la coche */
                } else {
                    input.style.borderColor = "#ff7900"; /* Orange focus */
                    iconeOk.style.display = "none"; /* Cacher la coche */
                }
            };

            input.onfocus = verifierSaisie;
            input.oninput = verifierSaisie; /* Se déclenche à chaque frappe */
            
            input.onblur = () => {
                if (!fonctionValidation || !fonctionValidation(input.value)) {
                    input.style.borderColor = "#ddd"; /* Remettre gris si invalide et on sort */
                }
            };
            
            /* Lancer une vérification initiale au cas où la valeur de base est déjà bonne */
            if (valeurInitiale) verifierSaisie();
            
            let btnDiv = document.createElement("div"); 
            btnDiv.style.cssText = "display:flex; justify-content:center; gap:15px; margin-top:25px;";
            
            let btnAnnuler = document.createElement("button"); 
            btnAnnuler.innerText = "Ignorer";
            btnAnnuler.style.cssText = "padding:10px 20px; border:none; border-radius:6px; cursor:pointer; background:#eee; color:#555; font-weight:bold;";
            btnAnnuler.onclick = () => { document.body.removeChild(overlay); resolve(null); };
            
            let btnValider = document.createElement("button"); 
            btnValider.innerText = "Valider";
            btnValider.style.cssText = "padding:10px 30px; border:none; border-radius:6px; cursor:pointer; background:#ff7900; color:white; font-weight:bold;";
            btnValider.onclick = () => { document.body.removeChild(overlay); resolve(input.value); };
            
            btnDiv.append(btnAnnuler, btnValider); 
            boite.append(h3, msg, inputWrapper, btnDiv);
            overlay.appendChild(boite); 
            document.body.appendChild(overlay);
        });
    },

    /* --- Méthodes de validation globales --- */
    validerNom: async function(nomActuel, typeNom = "Nom") {
        let val = nomActuel;
        let titre = nomActuel ? `⚠️ ${typeNom} Invalide ( ${nomActuel} )` : `⚠️ ${typeNom} Invalide`;
        
        const regleNom = (v) => v && /^[a-zA-Z0-9]{3,20}$/.test(v);
        
        while (!regleNom(val)) {
            val = await this.afficherPopupValidation(titre, "Requis : 3 à 20 lettres/chiffres (sans espaces).", val, regleNom);
            if (val === null) return null;
        }
        return val;
    },

    validerMotDePasse: async function(mdpActuel, nomAssocie, typeAssocie = "User") {
        let val = mdpActuel;
        let titre = nomAssocie ? `⚠️ Clé Faible (${typeAssocie} : ${nomAssocie})` : "⚠️ Clé Faible";
        
        const regleMdp = (v) => v && v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /^[\x20-\x7E]+$/.test(v);
        
        while (!regleMdp(val)) {
            val = await this.afficherPopupValidation(titre, "Requis : 8+ caractères, 1 maj, 1 min, 1 chiffre.", val, regleMdp);
            if (val === null) return null; 
        }
        return val;
    }
};