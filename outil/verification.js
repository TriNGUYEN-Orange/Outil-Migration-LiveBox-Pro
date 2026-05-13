/* --- /outil/verification.js --- */

window.ExtractVerification = {

    /* Fonction utilitaire pour créer des pop-ups HTML universels */
    afficherPopup: function(titre, messageHtml) {
        if (document.getElementById("lm-verif-overlay")) return; // Évite les doublons
        const overlay = document.createElement("div");
        overlay.id = "lm-verif-overlay";
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(3px); font-family: 'Segoe UI', sans-serif;";
        
        const boite = document.createElement("div");
        boite.style.cssText = "background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); max-width:450px; width:90%; text-align:center; border-top: 5px solid #ff7900;";
        
        boite.innerHTML = `
            <h3 style="color:#ff7900; margin-top:0; font-size:22px;">${titre}</h3>
            <div style="font-size:15px; color:#555; line-height:1.5;">${messageHtml}</div>
        `;
        
        overlay.appendChild(boite);
        document.body.appendChild(overlay);
    },

    verifierEnvironnement: async function(estModePush = false) {
        return new Promise((resolve) => {
            /* 1. Vérification d'URL */
            let urlActuelle = window.location.hostname;
            if (!urlActuelle.includes("192.168.") && !urlActuelle.includes("livebox")) {
                let btnHtml = `<a href="http://192.168.1.1" target="_blank" onclick="document.getElementById('lm-verif-overlay').remove();" style="display:inline-block; background:#ff7900; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; width:100%; box-sizing:border-box; margin-top:20px;">🌐 Ouvrir la Livebox</a>`;
                this.afficherPopup("⚠️ Action Requise", `Allez sur l'interface Livebox (192.168.1.1).<br>Connectez-vous, puis relancez le favori.${btnHtml}`);
                return resolve(false); /* Arrêt */
            }

            /* ========================================================================= */
            /* 2. ANTI-ERREUR HUMAINE (Croisement d'outils et de Livebox)                */
            /* ========================================================================= */
            
            /* Détection de la box actuelle via le DOM */
            let estSurBox6 = document.documentElement.className.includes("sah-mode-lb6") || document.getElementById("sah-mhs-mode-lb6") !== null;
            let estSurBox4 = document.getElementById("header_logoOrange_image") !== null;

            let btnFermer = `<button onclick="document.getElementById('lm-verif-overlay').remove();" style="background:#f44336; color:white; padding:10px 20px; border:none; border-radius:6px; font-weight:bold; font-size:15px; width:100%; cursor:pointer; box-sizing:border-box; margin-top:20px;">Fermer</button>`;

            /* Cas A : Outil d'Extraction lancé sur la nouvelle Box 6 */
            if (!estModePush && estSurBox6) {
                this.afficherPopup(
                    "❌ Oups !", 
                    `Outil d'<b>Extraction</b> lancé sur une <b>Nouvelle Box</b>.<br><br>Veuillez utiliser le bon favori.${btnFermer}`
                );
                return resolve(false); /* Arrêt immédiat */
            }

            /* Cas B : Outil d'Application lancé sur l'ancienne Box 4 */
            if (estModePush && estSurBox4) {
                this.afficherPopup(
                    "❌ Oups !", 
                    `Outil d'<b>Application</b> lancé sur une <b>Ancienne Box</b>.<br><br>Veuillez utiliser le bon favori.${btnFermer}`
                );
                return resolve(false); /* Arrêt immédiat */
            }

            /* ========================================================================= */
            /* 3. VÉRIFICATION DE CONNEXION (Compatible Box 3, 4, 6 et 7)                */
            /* ========================================================================= */
            
            /* Boutons standards (Box 4+) */
            let btnLogin = document.querySelector("#authentification_save_button, #login_save");
            /* Widget d'authentification GWT (Box 3 ancienne) - Sélecteur robuste ignorant le hash dynamique */
            let loginBox3 = document.querySelector("div[class*='AuthenticationWidgetCss-authenticationWidget']");

            let nonConnecte = false;
            
            /* Si l'un des éléments de login est présent ET visible à l'écran */
            if (btnLogin && btnLogin.offsetParent !== null) nonConnecte = true;
            if (loginBox3 && loginBox3.offsetParent !== null) nonConnecte = true;

            if (nonConnecte) {
                let btnHtml = `<button onclick="document.getElementById('lm-verif-overlay').remove();" style="background:#4caf50; color:white; padding:12px 20px; border:none; border-radius:8px; font-weight:bold; font-size:15px; width:100%; cursor:pointer; box-sizing:border-box; margin-top:20px;">🔒 Me connecter</button>`;
                this.afficherPopup("⚠️ Connexion Requise", `Vous devez être connecté à la Livebox.<br>Identifiez-vous, puis relancez le favori.${btnHtml}`);
                return resolve(false); /* Arrêt */
            }

            /* 4. Vérification du fichier JSON (Seulement pour l'étape PUSH) */
            if (estModePush) {
                let configStr = localStorage.getItem("livebox_migration_config");
                if (!configStr || configStr.trim() === "" || configStr === "{}") {
                    
                    let htmlUpload = `
                        <p style="margin-bottom: 25px;">
                            Lancez d'abord l'<b>Extraction</b> sur l'ancienne box, ou importez votre <b>fichier JSON</b> ici :
                        </p>
                        <div style="display:flex; flex-direction:column; gap:10px; width: 100%;">
                            <label for="upload-json-config" style="background:#2196F3; color:#fff; padding:12px; border-radius:6px; cursor:pointer; font-weight:bold;">
                                📂 Importer le fichier JSON
                            </label>
                            <input type="file" id="upload-json-config" accept=".json" style="display:none;" />
                            <button id="btn-fermer-err-init" style="padding:10px; border:none; border-radius:6px; cursor:pointer; background:#eee; color:#555; font-weight:bold;">Annuler</button>
                        </div>
                    `;
                    
                    this.afficherPopup("⚠️ Aucune donnée", htmlUpload);

                    /* Logique d'importation du fichier JSON */
                    document.getElementById("upload-json-config").addEventListener("change", function(event) {
                        const fichier = event.target.files[0];
                        if (!fichier) return;
                        
                        const lecteur = new FileReader();
                        lecteur.onload = function(e) {
                            try {
                                const contenu = e.target.result;
                                JSON.parse(contenu); /* Test JSON valide */
                                localStorage.setItem("livebox_migration_config", contenu);
                                console.log("✅ Fichier JSON importé avec succès !");
                                document.getElementById("lm-verif-overlay").remove();
                                resolve(true); /* Résolu ! Le script peut continuer */
                            } catch (err) {
                                alert("❌ Erreur : Le fichier sélectionné n'est pas un JSON valide.");
                            }
                        };
                        lecteur.readAsText(fichier);
                    });

                    document.getElementById("btn-fermer-err-init").onclick = () => {
                        document.getElementById("lm-verif-overlay").remove();
                        resolve(false); /* Annulé, on arrête tout */
                    };
                    
                    return; /* On met le script en pause ici jusqu'à ce que l'utilisateur agisse */
                }
            }

            /* 5. Si on arrive ici, tout est OK */
            resolve(true);
        });
    }
};