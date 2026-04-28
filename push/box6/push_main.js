/* --- /push/box6/push_main.js --- */

(async function() {
    /* Sécurité : Empêcher le lancement en double */
    if (window._migrationEnCours) {
        console.warn("⚠️ Une migration est déjà en cours. Veuillez patienter !");
        return;
    }

    /* =========================================
       ⚙️ CONFIGURATION DU COMPORTEMENT
       ========================================= */
    const BASE_URL = 'https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/';

    /* 🌟 LISTE DYNAMIQUE DES MODULES 🌟 */
    const LISTE_MODULES = [
        { actif: false, nomUI: "Réveil du système", nomEnv: "Wake-Up", fichier: "push_wakeup.js", fonction: "executerWakeUp" },
        { actif: true, nomUI: "Réseaux Wi-Fi", nomEnv: "Wi-Fi", fichier: "push_wifi.js", fonction: "executerWifi" },
        { actif: true, nomUI: "Pare-feu", nomEnv: "Pare-feu", fichier: "push_parefeu.js", fonction: "executerParefeu" },
        { actif: true,  nomUI: "Accès à distance", nomEnv: "Accès à distance", fichier: "push_acces_distance.js", fonction: "executerAccesDistance" },
        { actif: true, nomUI: "Airbox", nomEnv: "Airbox", fichier: "push_airbox.js", fonction: "executerAirbox" },
        { actif: true, nomUI: "VPN Nomade", nomEnv: "VPN Nomade", fichier: "push_vpn_nomade.js", fonction: "executerVpnNomade" },
        { actif: true, nomUI: "VPN Nomade Avancés", nomEnv: "VPN Nomade Avancés", fichier: "push_vpn_nomade_avance.js", fonction: "executerVpnNomadeAvance" },
        { actif: true, nomUI: "VPN Site à Site", nomEnv: "VPN Site à Site", fichier: "push_vpn_siteasite.js", fonction: "executerVpnSiteASite" },
        { actif: true, nomUI: "Routage", nomEnv: "Routage", fichier: "push_routage.js", fonction: "executerRoutage" }
    ];

    const MODULES_A_EXECUTER = LISTE_MODULES.filter(mod => mod.actif);
    const TOTAL_ETAPES = MODULES_A_EXECUTER.length;

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

    const preparerEnvironnement = async (nomModule) => {
        if (nomModule === "VPN Nomade Avancés" || nomModule === "VPN Site à Site") {
            if (typeof window.attendrePause === "function") await window.attendrePause(1000);
            return;
        }
        if (typeof window.retournerAccueil === "function") await window.retournerAccueil();
        if (typeof window.attendrePause === "function") await window.attendrePause(1500); 
    };

    /* ==================================================================== */
    /* 🚀 LE MOTEUR PRINCIPAL DE MIGRATION (Isolé pour être appelé à la volée) */
    /* ==================================================================== */
    async function demarrerMigration() {
        window._migrationEnCours = true;
        try {
            await chargerModule('/push/box6/push_ui.js');
            const UI = window.PushUI;

            UI.injecter();
            await new Promise(r => setTimeout(r, 1000)); 

            if (UI && typeof UI.maj === "function") UI.maj(0, TOTAL_ETAPES, "Chargement des utilitaires...");
            await chargerModule('/push/push_utils.js');

            for (let i = 0; i < MODULES_A_EXECUTER.length; i++) {
                let moduleCourant = MODULES_A_EXECUTER[i];
                let etapeActuelle = i + 1;

                if (UI && typeof UI.maj === "function") UI.maj(etapeActuelle, TOTAL_ETAPES, moduleCourant.nomUI);
                await preparerEnvironnement(moduleCourant.nomEnv);
                await chargerModule(`/push/box6/${moduleCourant.fichier}`);
                
                if (typeof window[moduleCourant.fonction] === "function") {
                    await window[moduleCourant.fonction]();
                } else {
                    throw new Error(`Fonction window.${moduleCourant.fonction} introuvable.`);
                }
            }

            window._migrationEnCours = false;

            if (UI && typeof UI.afficherResume === "function") {
                await chargerModule('/push/box6/push_pdf.js');
                await UI.afficherResume(); 
            }

            if (UI && typeof UI.succes === "function") {
                UI.succes();
            } else {
                console.log("✅ Migration terminée.");
            }

        } catch (erreurGrave) {
            window._migrationEnCours = false;
            if (window.PushUI && typeof window.PushUI.erreur === "function") {
                window.PushUI.erreur(erreurGrave.message);
            } else {
                alert("❌ ERREUR FATALE :\n" + erreurGrave.message);
            }
        }
    }

    /* ==================================================================== */
    /* 🌟 VÉRIFICATION DE LA CONFIGURATION ET SYSTÈME D'UPLOAD JSON 🌟      */
    /* ==================================================================== */
    let configStr = localStorage.getItem("livebox_migration_config");
    if (!configStr || configStr.trim() === "" || configStr === "{}") {
        
        /* Création du Pop-up autonome avec bouton d'Upload */
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(3px); font-family: 'Segoe UI', sans-serif;";
        
        const boite = document.createElement("div");
        boite.style.cssText = "background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); max-width:450px; width:90%; text-align:center; border-top: 5px solid #ff7900;";
        
        boite.innerHTML = `
            <h3 style="color:#ff7900; margin-top:0; font-size:22px;">⚠️ Aucune donnée</h3>
            <p style="font-size:15px; color:#555; margin-bottom: 25px;">
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
        
        overlay.appendChild(boite);
        document.body.appendChild(overlay);

        /* ---------------------------------------------------------
           Logique d'importation du fichier JSON
           --------------------------------------------------------- */
        document.getElementById("upload-json-config").addEventListener("change", function(event) {
            const fichier = event.target.files[0];
            if (!fichier) return;
            
            const lecteur = new FileReader();
            lecteur.onload = function(e) {
                try {
                    const contenu = e.target.result;
                    JSON.parse(contenu); /* Test pour s'assurer que c'est bien du JSON valide */
                    
                    /* Écriture dans le Local Storage */
                    localStorage.setItem("livebox_migration_config", contenu);
                    console.log("✅ Fichier JSON importé avec succès !");
                    
                    /* Fermeture du pop-up et lancement automatique du moteur */
                    document.body.removeChild(overlay);
                    demarrerMigration();
                    
                } catch (err) {
                    alert("❌ Erreur : Le fichier sélectionné n'est pas un JSON valide.");
                }
            };
            lecteur.readAsText(fichier);
        });

        /* Logique du bouton Annuler */
        document.getElementById("btn-fermer-err-init").onclick = () => {
            document.body.removeChild(overlay);
        };

        return; /* On stoppe l'exécution ici et on attend l'action de l'utilisateur */
    }

    /* Si les données existent déjà dans le Local Storage, on démarre direct ! */
    demarrerMigration();

})();