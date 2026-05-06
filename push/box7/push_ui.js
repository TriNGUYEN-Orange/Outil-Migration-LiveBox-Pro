/* --- /push/box7/push_ui.js --- */

window.PushUI = {

    ACTIVER_POPUP: false, 
    journalModifications: [],

    CSS: `
        #livebox-migration-overlay { pointer-events: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.20); z-index: 9999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; backdrop-filter: blur(3px); }
        .lm-box { pointer-events: auto; background: #fff; color: #333; padding: 40px; border-radius: 12px; width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid transparent; }
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

    /* ================================================================================= */
    /* 1. MOTEUR D'INTERFACE (Loading, Succès, Erreur)                                   */
    /* ================================================================================= */
    injecter: function() {
        window._lmOverlayActive = true;
        if (!this.ACTIVER_POPUP) { console.log("🟢 [PushUI] Mode silencieux activé. Interface masquée."); return; }
        if (!document.getElementById("livebox-migration-overlay")) {
            const style = document.createElement('style'); style.innerHTML = this.CSS; document.head.appendChild(style);
            const overlay = document.createElement('div'); overlay.id = "livebox-migration-overlay"; overlay.innerHTML = this.HTML; document.body.appendChild(overlay);
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
        window._lmCurrentStep = etape; window._lmTotalSteps = total; window._lmModuleName = nomModule; window._lmEtat = "en_cours";
        if (!this.ACTIVER_POPUP) console.log(`⏳ [Progression] Étape ${etape}/${total} : ${nomModule}`);
    },
    
    succes: function() {
        window._lmEtat = "succes"; window._migrationEnCours = false; clearInterval(window._lmInterval);
        if (!this.ACTIVER_POPUP) { console.log("✅ [PushUI] Injection Terminée avec succès !"); return; }
        const spinner = document.getElementById("lm-spinner"); const titre = document.getElementById("lm-titre"); const warning = document.getElementById("lm-warning"); const box = document.getElementById("lm-box"); const texte = document.getElementById("lm-step-text");
        if(spinner) spinner.style.display = "none";
        if(titre) { titre.innerHTML = "✅ Injection Terminée !"; titre.style.color = "#4caf50"; }
        if(warning) warning.style.display = "none";
        if(texte) texte.innerHTML = "Tous les modules ont été appliqués avec succès.";
        if(box && !document.getElementById("btn-fermer-overlay")) {
            let btn = document.createElement("button"); btn.id = "btn-fermer-overlay"; btn.innerHTML = "Fermer"; btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px; transition: 0.3s;";
            btn.onclick = function() { window._lmOverlayActive = false; document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    },

    erreur: function(msg) {
        window._lmEtat = "erreur"; window._migrationEnCours = false; clearInterval(window._lmInterval);
        if (!this.ACTIVER_POPUP) { console.error("❌ [PushUI] Erreur Critique :", msg); alert("❌ ERREUR FATALE :\n" + msg); return; }
        const spinner = document.getElementById("lm-spinner"); const titre = document.getElementById("lm-titre"); const warning = document.getElementById("lm-warning"); const box = document.getElementById("lm-box"); const texte = document.getElementById("lm-step-text"); const prog = document.getElementById("lm-progress-container");
        if(spinner) spinner.style.display = "none"; if(prog) prog.style.display = "none";
        if(titre) { titre.innerHTML = "❌ Erreur Critique"; titre.style.color = "#d9534f"; }
        if(warning) { warning.innerHTML = msg; warning.style.color = "#333"; warning.style.wordWrap = "break-word"; warning.style.fontSize = "16px"; }
        if(texte) texte.innerHTML = "Arrêt immédiat du processus.";
        if(box && !document.getElementById("btn-fermer-overlay")) {
            box.style.border = "4px solid #d9534f";
            let btn = document.createElement("button"); btn.id = "btn-fermer-overlay"; btn.innerHTML = "Fermer et Annuler"; btn.style.cssText = "margin-top:20px; padding:12px 25px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 16px;";
            btn.onclick = function() { window._lmOverlayActive = false; document.getElementById("livebox-migration-overlay").remove(); };
            box.appendChild(btn);
        }
    },

    /* ================================================================================= */
    /* 2. CẦU NỐI (PROXY) TỚI LỚP PUSH_VALIDATION                                        */
    /* Đảm bảo tương thích 100% với code cũ của Box 6 và Box 7 không cần sửa file        */
    /* ================================================================================= */
    validerNom: function(nomActuel, typeNom, nomModule) {
        if (window.PushValidation) return window.PushValidation.validerNom(nomActuel, typeNom, nomModule);
        console.error("❌ [PushUI] Lớp PushValidation chưa được nạp!"); return nomActuel;
    },

    validerMotDePasse: function(mdpActuel, nomAssocie, nomModule, typeAssocie) {
        if (window.PushValidation) return window.PushValidation.validerMotDePasse(mdpActuel, nomAssocie, nomModule, typeAssocie);
        console.error("❌ [PushUI] Lớp PushValidation chưa được nạp!"); return mdpActuel;
    },

    afficherPopupValidation: function(titre, message, valeurInitiale, fonctionValidation) {
        if (window.PushValidation) return window.PushValidation.afficherPopupValidation(titre, message, valeurInitiale, fonctionValidation);
        return valeurInitiale;
    },

    /* ================================================================================= */
    /* 3. MOTEUR DE GÉNÉRATION DU PDF ET RÉSUMÉ FINAL                                    */
    /* ================================================================================= */
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
            
            const h3 = document.createElement("h3"); h3.innerText = "📋 Bilan de la Migration"; h3.style.cssText = "color:#2e7d32; margin:0 0 10px 0; font-size:22px; text-align:center; font-weight:bold;";
            const msg = document.createElement("p"); msg.innerText = "Les paramètres suivants ont été mis à jour suite à vos saisies :"; msg.style.cssText = "font-size:14px; color:#666; text-align:center; margin-bottom:20px;";
            
            const conteneurTable = document.createElement("div");
            conteneurTable.style.cssText = "max-height:380px; overflow-y:auto; border: 1px solid #eee; border-radius:8px; background:#fff;";
            let htmlTable = '<table class="lm-table-res"><thead><tr><th style="width: 130px;">Module</th><th style="width: 200px;">Élément modifié</th><th>Ancien</th><th>Nouveau</th></tr></thead><tbody>';
            this.journalModifications.forEach(mod => {
                htmlTable += `<tr><td><span class="lm-badge-mod">${mod.module}</span></td><td style="font-size:13px; line-height:1.3;"><span style="font-weight:bold;">${mod.element}</span></td><td><span class="lm-val-old">${mod.ancien}</span></td><td><span class="lm-val-new">${mod.nouveau}</span></td></tr>`;
            });
            htmlTable += '</tbody></table>';
            conteneurTable.innerHTML = htmlTable;
            
            const btnDiv = document.createElement("div"); btnDiv.style.cssText = "display:flex; justify-content:center; align-items:center; margin-top:25px; gap:15px;";
            
            const btnPdf = document.createElement("button"); btnPdf.id = "btn-telecharger-pdf"; btnPdf.innerText = "📄 Télécharger le Rapport";
            btnPdf.style.cssText = "padding:12px 25px; border:none; border-radius:6px; cursor:pointer; background:#2196F3; color:white; font-weight:bold; font-size:15px; box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3); transition: transform 0.2s;";
            btnPdf.onmouseover = () => btnPdf.style.transform = "scale(1.03)"; btnPdf.onmouseout = () => btnPdf.style.transform = "scale(1)";
            btnPdf.onclick = () => { 
                if(window.PushPDF && typeof window.PushPDF.telecharger === "function") {
                    window.PushPDF.telecharger(this.journalModifications, localStorage.getItem("livebox_migration_config")); 
                } else { alert("Module PDF introuvable."); }
            };
            
            const btnOk = document.createElement("button"); btnOk.innerText = "Confirmer et Fermer";
            btnOk.style.cssText = "padding:12px 25px; border:none; border-radius:6px; cursor:pointer; background:#4caf50; color:white; font-weight:bold; font-size:15px; box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3); transition: transform 0.2s;";
            btnOk.onmouseover = () => btnOk.style.transform = "scale(1.03)"; btnOk.onmouseout = () => btnOk.style.transform = "scale(1)";
            btnOk.onclick = () => { document.body.removeChild(overlay); this.journalModifications = []; resolve(); };
            
            btnDiv.append(btnPdf, btnOk); boite.append(h3, msg, conteneurTable, btnDiv); overlay.appendChild(boite); 
            const styleExtra = document.createElement('style'); styleExtra.innerHTML = this.CSS; document.head.appendChild(styleExtra);
            document.body.appendChild(overlay);
        });
    }
};