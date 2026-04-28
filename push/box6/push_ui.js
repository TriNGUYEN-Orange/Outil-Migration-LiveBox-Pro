/* --- /push/box6/push_ui.js --- */

window.PushUI = {
    AFFICHER_ECRAN_NOIR: true, 
    journalModifications: [], 

    CSS: `
        #livebox-migration-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.29); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
        .lm-box { background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 500px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid transparent; }
        .lm-box h2 { color: #ff7900; margin-top: 0; font-size: 24px; font-weight: bold; }
        .lm-progress-bg { background: #f0f0f0; height: 22px; border-radius: 15px; margin: 25px 0; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }
        .lm-progress-bar { background: linear-gradient(90deg, #ff7900, #ff9e40); height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .lm-step-text { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #555; }
        .lm-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ff7900; border-radius: 50%; width: 50px; height: 50px; animation: lm-spin 1s linear infinite; margin: 0 auto 20px auto; }
        .lm-table-res { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; color: #444; }
        .lm-table-res th { background: #f2f2f2; color: #666; padding: 10px; border: 1px solid #ddd; text-align: left; }
        .lm-table-res td { padding: 10px; border: 1px solid #ddd; text-align: left; vertical-align: top; }
        .lm-badge-mod { background: #fff3e6; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #ff7900; border: 1px solid #ffe0b2; text-transform: uppercase; }
        .lm-val-old { color: #999; text-decoration: line-through; display: block; font-style: italic; }
        .lm-val-new { color: #2e7d32; font-weight: bold; display: block; margin-top: 2px; }
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
        const style = document.createElement('style'); style.innerHTML = this.CSS; document.head.appendChild(style);
        const overlay = document.createElement('div'); overlay.id = "livebox-migration-overlay"; overlay.innerHTML = this.HTML;
        document.body.appendChild(overlay);
    },

    maj: function(etape, total, nomModule) {
        if (!this.AFFICHER_ECRAN_NOIR) return;
        const pct = Math.round((etape / total) * 100);
        const barre = document.getElementById("lm-progress-bar");
        const texte = document.getElementById("lm-step-text");
        if(barre) barre.style.width = pct + "%";
        if(texte) texte.innerHTML = `Étape ${etape}/${total} : <br><span style="color:#ff7900">${nomModule}</span>`;
    },

    enregistrerModification: function(nomModule, element, ancienneValeur, nouvelleValeur) {
        this.journalModifications.push({ module: nomModule, element: element, ancien: ancienneValeur || "(vide)", nouveau: nouvelleValeur });
    },

    afficherResume: function() {
        return new Promise((resolve) => {
            if (this.journalModifications.length === 0) { resolve(); return; }

            const overlay = document.createElement("div");
            overlay.id = "lm-resume-overlay";
            overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(4px);";
            
            const boite = document.createElement("div");
            boite.style.cssText = "background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); width:680px; max-width:95%; font-family:'Segoe UI', sans-serif; pointer-events:auto; border-top: 6px solid #4caf50;";
            
            const h3 = document.createElement("h3"); 
            h3.innerText = "📋 Bilan de la Migration"; 
            h3.style.cssText = "color:#2e7d32; margin:0 0 10px 0; font-size:22px; text-align:center; font-weight:bold;";
            
            const msg = document.createElement("p"); 
            msg.innerText = "Les paramètres suivants ont été mis à jour suite à vos saisies :";
            msg.style.cssText = "font-size:14px; color:#666; text-align:center; margin-bottom:20px;";

            const conteneurTable = document.createElement("div");
            conteneurTable.style.cssText = "max-height:380px; overflow-y:auto; border: 1px solid #eee; border-radius:8px; background:#fff;";

            let htmlTable = `
                <table class="lm-table-res">
                    <thead><tr><th style="width: 130px;">Module</th><th style="width: 200px;">Élément modifié</th><th>Ancien</th><th>Nouveau</th></tr></thead>
                    <tbody>
            `;

            this.journalModifications.forEach(mod => {
                htmlTable += `<tr><td><span class="lm-badge-mod">${mod.module}</span></td><td style="font-size:13px; line-height:1.3;"><span style="font-weight:bold;">${mod.element}</span></td><td><span class="lm-val-old">${mod.ancien}</span></td><td><span class="lm-val-new">${mod.nouveau}</span></td></tr>`;
            });

            htmlTable += `</tbody></table>`;
            conteneurTable.innerHTML = htmlTable;

            const btnDiv = document.createElement("div"); 
            btnDiv.style.cssText = "display:flex; justify-content:center; align-items:center; margin-top:25px; gap:15px;";
            
            /* 🌟 APPEL AU MODULE EXTERNE PUSH_PDF.JS 🌟 */
            const btnPdf = document.createElement("button"); 
            btnPdf.id = "btn-telecharger-pdf";
            btnPdf.innerText = "📄 Télécharger le Rapport";
            btnPdf.style.cssText = "padding:12px 25px; border:none; border-radius:6px; cursor:pointer; background:#2196F3; color:white; font-weight:bold; font-size:15px; box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3); transition: transform 0.2s;";
            btnPdf.onmouseover = () => btnPdf.style.transform = "scale(1.03)";
            btnPdf.onmouseout = () => btnPdf.style.transform = "scale(1)";
            btnPdf.onclick = () => { 
                if(window.PushPDF && typeof window.PushPDF.telecharger === "function") {
                    window.PushPDF.telecharger(this.journalModifications, localStorage.getItem("livebox_migration_config")); 
                } else {
                    alert("Module PDF introuvable.");
                }
            };

            const btnOk = document.createElement("button"); 
            btnOk.innerText = "Confirmer et Fermer";
            btnOk.style.cssText = "padding:12px 25px; border:none; border-radius:6px; cursor:pointer; background:#4caf50; color:white; font-weight:bold; font-size:15px; box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3); transition: transform 0.2s;";
            btnOk.onmouseover = () => btnOk.style.transform = "scale(1.03)";
            btnOk.onmouseout = () => btnOk.style.transform = "scale(1)";
            btnOk.onclick = () => { document.body.removeChild(overlay); this.journalModifications = []; resolve(); };
            
            btnDiv.append(btnPdf, btnOk); boite.append(h3, msg, conteneurTable, btnDiv); overlay.appendChild(boite); 
            const styleExtra = document.createElement('style'); styleExtra.innerHTML = this.CSS; document.head.appendChild(styleExtra);
            document.body.appendChild(overlay);
        });
    },

    validerNom: async function(nomActuel, typeNom = "Nom", nomModule = "Système") {
        let val = nomActuel;
        const titre = nomActuel ? `⚠️ ${typeNom} Invalide ( ${nomActuel} )` : `⚠️ ${typeNom} Invalide`;
        const regleNom = (v) => v && /^[a-zA-Z0-9]{3,20}$/.test(v);
        
        let aEteModifie = false;
        while (!regleNom(val)) {
            val = await this.afficherPopupValidation(titre, "Requis : 3 à 20 lettres/chiffres (sans espaces).", val, regleNom);
            if (val === null) return null;
            aEteModifie = true;
        }

        if (aEteModifie && val !== nomActuel) {
            let labelElement = `Nom d'utilisateur (${typeNom})`; 
            if (nomModule === "VPN Nomade") labelElement = "Login";
            else if (nomModule === "VPN Site à site") labelElement = "Nom du tunnel";
            else if (nomModule === "Accès à distance") labelElement = "Identifiant distant";
            this.enregistrerModification(nomModule, labelElement, nomActuel, val);
        }
        return val;
    },

    validerMotDePasse: async function(mdpActuel, nomAssocie, nomModule = "Système", typeAssocie = "User") {
        let val = mdpActuel;
        const titre = nomAssocie ? `⚠️ Clé Faible (${typeAssocie} : ${nomAssocie})` : "⚠️ Clé Faible";
        const regleMdp = (v) => v && v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /^[\x20-\x7E]+$/.test(v);
        
        let aEteModifie = false;
        while (!regleMdp(val)) {
            val = await this.afficherPopupValidation(titre, "Requis : 8+ caractères, 1 maj, 1 min, 1 chiffre.", val, regleMdp);
            if (val === null) return null; 
            aEteModifie = true;
        }

        if (aEteModifie && val !== mdpActuel) {
            let prefixeAssocie = "Cible";
            if (nomModule === "VPN Nomade") prefixeAssocie = "Login";
            else if (nomModule === "VPN Site à site") prefixeAssocie = "Tunnel";
            else if (nomModule === "Accès à distance") prefixeAssocie = "Identifiant";

            let sousTitreHTML = `<br><span style="font-size:11px; color:#888; font-weight:normal; display:inline-block; margin-top:3px;">↳ ${prefixeAssocie} : <i>${nomAssocie}</i></span>`;
            let labelElement = `Mot de passe` + sousTitreHTML;
            this.enregistrerModification(nomModule, labelElement, mdpActuel, val);
        }
        return val;
    },

    afficherPopupValidation: function(titre, message, valeurInitiale, fonctionValidation) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div"); overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(3px);";
            const boite = document.createElement("div"); boite.style.cssText = "background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); max-width:450px; width:90%; font-family:'Segoe UI', sans-serif; pointer-events:auto; text-align:center; border-top: 5px solid #ff7900;";
            const h3 = document.createElement("h3"); h3.innerText = titre; h3.style.cssText = "color:#d9534f; margin-top:0; font-size:20px;";
            const msg = document.createElement("p"); msg.innerText = message; msg.style.cssText = "font-size:14px; color:#555;";
            const inputWrapper = document.createElement("div"); inputWrapper.style.cssText = "position:relative; margin-top:15px;";
            const input = document.createElement("input"); input.type = "text"; input.value = valeurInitiale || ""; input.style.cssText = "width:100%; box-sizing:border-box; padding:12px 40px 12px 12px; border:2px solid #ddd; border-radius:6px; font-size:16px; outline:none;";
            const iconeOk = document.createElement("span"); iconeOk.innerText = "✅"; iconeOk.style.cssText = "position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:18px; display:none;";
            inputWrapper.append(input, iconeOk);
            const verifierSaisie = () => { if (fonctionValidation(input.value)) { input.style.borderColor = "#4caf50"; iconeOk.style.display = "block"; } else { input.style.borderColor = "#ff7900"; iconeOk.style.display = "none"; } };
            input.oninput = verifierSaisie; if (valeurInitiale) verifierSaisie();
            const btnDiv = document.createElement("div"); btnDiv.style.cssText = "display:flex; justify-content:center; gap:15px; margin-top:25px;";
            const btnAnnuler = document.createElement("button"); btnAnnuler.innerText = "Ignorer"; btnAnnuler.style.cssText = "padding:10px 20px; border:none; border-radius:6px; cursor:pointer; background:#eee; color:#555; font-weight:bold;";
            btnAnnuler.onclick = () => { document.body.removeChild(overlay); resolve(null); };
            const btnValider = document.createElement("button"); btnValider.innerText = "Valider"; btnValider.style.cssText = "padding:10px 30px; border:none; border-radius:6px; cursor:pointer; background:#ff7900; color:white; font-weight:bold;";
            btnValider.onclick = () => { document.body.removeChild(overlay); resolve(input.value); };
            btnDiv.append(btnAnnuler, btnValider); boite.append(h3, msg, inputWrapper, btnDiv); overlay.appendChild(boite); document.body.appendChild(overlay);
        });
    }
};