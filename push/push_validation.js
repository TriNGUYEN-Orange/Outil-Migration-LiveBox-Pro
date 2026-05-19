/* --- /push/push_validation.js --- */

window.PushValidation = {
    
    /* 1. MOTEUR D'AFFICHAGE DU POP-UP DE VALIDATION */
    afficherPopupValidation: function(titre, message, valeurInitiale, fonctionValidation) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div"); 
            overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(3px);";
            
            const boite = document.createElement("div"); 
            boite.style.cssText = "background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); max-width:450px; width:90%; font-family:'Segoe UI', sans-serif; pointer-events:auto; text-align:center; border-top: 5px solid #ff7900;";
            
            const h3 = document.createElement("h3"); 
            h3.innerText = titre; 
            h3.style.cssText = "color:#d9534f; margin-top:0; font-size:20px;";
            
            const msg = document.createElement("p"); 
            msg.innerText = message; 
            msg.style.cssText = "font-size:14px; color:#555;";
            
            const inputWrapper = document.createElement("div"); 
            inputWrapper.style.cssText = "position:relative; margin-top:15px;";
            
            const input = document.createElement("input"); 
            input.type = "text"; 
            input.value = valeurInitiale || ""; 
            input.style.cssText = "width:100%; box-sizing:border-box; padding:12px 40px 12px 12px; border:2px solid #ddd; border-radius:6px; font-size:16px; outline:none;";
            
            const iconeOk = document.createElement("span"); 
            iconeOk.innerText = "✔️"; 
            iconeOk.style.cssText = "position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:18px; display:none;";
            
            inputWrapper.append(input, iconeOk);
            
            const verifierSaisie = () => { 
                if (fonctionValidation(input.value)) { 
                    input.style.borderColor = "#4caf50"; 
                    iconeOk.style.display = "block"; 
                } else { 
                    input.style.borderColor = "#ff7900"; 
                    iconeOk.style.display = "none"; 
                } 
            };
            
            input.oninput = verifierSaisie; 
            if (valeurInitiale) verifierSaisie();
            
            const btnDiv = document.createElement("div"); 
            btnDiv.style.cssText = "display:flex; justify-content:center; gap:15px; margin-top:25px;";
            
            const btnAnnuler = document.createElement("button"); 
            btnAnnuler.innerText = "Ignorer"; 
            btnAnnuler.style.cssText = "padding:10px 20px; border:none; border-radius:6px; cursor:pointer; background:#eee; color:#555; font-weight:bold;";
            btnAnnuler.onclick = () => { document.body.removeChild(overlay); resolve(null); };
            
            const btnValider = document.createElement("button"); 
            btnValider.innerText = "Valider"; 
            btnValider.style.cssText = "padding:10px 30px; border:none; border-radius:6px; cursor:pointer; background:#ff7900; color:white; font-weight:bold;";
            btnValider.onclick = () => { document.body.removeChild(overlay); resolve(input.value); };
            
            btnDiv.append(btnAnnuler, btnValider); 
            boite.append(h3, msg, inputWrapper, btnDiv); 
            overlay.appendChild(boite); 
            document.body.appendChild(overlay);
        });
    },

    /* 2. VALIDATION DES NOMS UTILISATEURS */
    validerNom: async function(nomActuel, typeNom = "Nom", nomModule = "Système") {
        let val = nomActuel;
        const titre = nomActuel ? `✏️ ${typeNom} Invalide ( ${nomActuel} )` : `✏️ ${typeNom} Invalide`;
        const regleNom = (v) => v && /^[a-zA-Z0-9]{3,20}$/.test(v);
        
        let aEteModifie = false;
        while (!regleNom(val)) {
            val = await this.afficherPopupValidation(titre, "Requis : 3 à 20 lettres/chiffres (sans espaces).", val, regleNom);
            if (val === null) return null;
            aEteModifie = true;
        }
        
        /* Enregistrement automatique dans PushUI si modifié */
        if (aEteModifie && val !== nomActuel && window.PushUI && typeof window.PushUI.enregistrerModification === "function") {
            let labelElement = `Nom d'utilisateur (${typeNom})`;
            if (nomModule === "VPN Nomade") labelElement = "Login";
            else if (nomModule === "VPN Site à site") labelElement = "Nom du tunnel";
            else if (nomModule === "Accès à distance") labelElement = "Identifiant distant";
            
            window.PushUI.enregistrerModification(nomModule, labelElement, nomActuel, val);
        }
        return val;
    },

    /* 3. VALIDATION DES MOTS DE PASSE */
    validerMotDePasse: async function(mdpActuel, nomAssocie, nomModule = "Système", typeAssocie = "User") {
        let val = mdpActuel;
        const titre = nomAssocie ? `🔒 Faible (${typeAssocie} : ${nomAssocie})` : "🔒 Faible";
        const regleMdp = (v) => v && v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /^[\x20-\x7E]+$/.test(v);
        
        let aEteModifie = false;
        while (!regleMdp(val)) {
            val = await this.afficherPopupValidation(titre, "Requis : 8+ caractères, 1 maj, 1 min, 1 chiffre.", val, regleMdp);
            if (val === null) return null;
            aEteModifie = true;
        }
        
        if (aEteModifie && val !== mdpActuel && window.PushUI && typeof window.PushUI.enregistrerModification === "function") {
            let prefixeAssocie = "Cible";
            if (nomModule === "VPN Nomade") prefixeAssocie = "Login";
            else if (nomModule === "VPN Site à site") prefixeAssocie = "Tunnel";
            else if (nomModule === "Accès à distance") prefixeAssocie = "Identifiant";
            let labelElement = `Mot de passe [${prefixeAssocie} : ${nomAssocie}]`;
            
            window.PushUI.enregistrerModification(nomModule, labelElement, mdpActuel, val);
        }
        return val;
    },

    /* 4. VALIDATION DES ADRESSES IPv4 (Utile pour le routage) */
    validerIP: async function(ipActuelle, nomChamp = "Adresse IP", nomModule = "Système") {
        let val = ipActuelle;
        const titre = `🌐 ${nomChamp} Invalide`;
        const regleIP = (v) => v && /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
        
        let aEteModifie = false;
        while (!regleIP(val)) {
            val = await this.afficherPopupValidation(titre, "Format attendu : IPv4 (ex: 192.168.1.1)", val, regleIP);
            if (val === null) return null;
            aEteModifie = true;
        }
        
        if (aEteModifie && val !== ipActuelle && window.PushUI && typeof window.PushUI.enregistrerModification === "function") {
            window.PushUI.enregistrerModification(nomModule, nomChamp, ipActuelle, val);
        }
        return val;
    }
};