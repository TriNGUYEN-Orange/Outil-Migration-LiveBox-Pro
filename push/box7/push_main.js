/* --- /push/box7/push_main.js --- */

(async function() {
    /* Sécurité : Empêcher le lancement en double */
    if (window._migrationEnCours) {
        console.warn("⚠️ Une migration est déjà en cours. Veuillez patienter !");
        return;
    }

    const BASE_URL = 'https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/';

    /* LISTE DYNAMIQUE DES MODULES  */
    const LISTE_MODULES = [
        { actif: false, nomUI: "Réseaux Wi-Fi", nomEnv: "Wi-Fi", fichier: "push_wifi.js", fonction: "executerWifi" },
        { actif: false, nomUI: "Routage", nomEnv: "Routage", fichier: "push_routage.js", fonction: "executerRoutage" },  //ok
        { actif: false, nomUI: "Airbox", nomEnv: "Airbox", fichier: "push_airbox.js", fonction: "executerAirbox" },  //ok
        
        /* Les modules ci-dessous sont désactivés (false) en attendant d'être développés pour la Box 7 */
        { actif: false, nomUI: "Pare-feu", nomEnv: "Pare-feu", fichier: "push_parefeu.js", fonction: "executerParefeu" }, //ok
        { actif: false, nomUI: "Accès à distance", nomEnv: "Accès à distance", fichier: "push_acces_distance.js", fonction: "executerAccesDistance" }, //ok
        { actif: false, nomUI: "VPN Nomade", nomEnv: "VPN Nomade", fichier: "push_vpn_nomade.js", fonction: "executerVpnNomade" },   //ok
        { actif: true, nomUI: "VPN Nomade Avancés", nomEnv: "VPN Nomade Avancés", fichier: "push_vpn_avance.js", fonction: "executerVpnNomadeAvance" }, //ok
        { actif: false, nomUI: "VPN Site à Site", nomEnv: "VPN Site à Site", fichier: "push_vpn_siteasite.js", fonction: "executerVpnSiteASite" }
    ];

    const MODULES_A_EXECUTER = LISTE_MODULES.filter(mod => mod.actif);
    const TOTAL_ETAPES = MODULES_A_EXECUTER.length;

    async function chargerModule(chemin) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.src = BASE_URL + chemin + '?v=' + Date.now();
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
    /*  LE MOTEUR PRINCIPAL DE MIGRATION                                  */
    /* ==================================================================== */
    async function demarrerMigration() {
        window._migrationEnCours = true;
        try {
            await chargerModule('/push/box7/push_ui.js');
            const UI = window.PushUI;

            /*  CHARGEMENT ET VÉRIFICATION GLOBALE (URL, Auth, JSON, Anti-Erreur)  */
            await chargerModule('/outil/verification.js');
            
            if (window.ExtractVerification && typeof window.ExtractVerification.verifierEnvironnement === "function") {
                /* Pont de compatibilité : Relier ExtractUI à PushUI */
                if (!window.ExtractUI) {
                    window.ExtractUI = {
                        afficherAlerte: function(titre, msg1, msg2, btnHtml) {
                            let msgComplet = `${msg1}<br><br>${msg2}<br><div style="margin-top:20px;">${btnHtml}</div>`;
                            if (UI && typeof UI.afficherPopupErreur === "function") {
                                UI.afficherPopupErreur(titre, msgComplet);
                            } else {
                                alert(`${titre}\n\n${msg1}\n${msg2}`);
                            }
                        }
                    };
                }
                
                let environnementOk = await window.ExtractVerification.verifierEnvironnement(true);
                if (!environnementOk) {
                    window._migrationEnCours = false;
                    return; 
                }
            } else {
                console.error("❌ Impossible de charger outil/verification.js");
                window._migrationEnCours = false;
                return;
            }

            /* Lancement de l'interface d'attente */
            UI.injecter();
            await new Promise(r => setTimeout(r, 1000)); 

            if (UI && typeof UI.maj === "function") UI.maj(0, TOTAL_ETAPES, "Chargement des utilitaires...");
    
            await chargerModule('/push/push_utils.js');
            await chargerModule('/push/push_validation.js'); 
            /* ========================================================== */

            /* Boucle dynamique d'exécution des modules */
            for (let i = 0; i < MODULES_A_EXECUTER.length; i++) {
                let moduleCourant = MODULES_A_EXECUTER[i];
                let etapeActuelle = i + 1;

                if (UI && typeof UI.maj === "function") UI.maj(etapeActuelle, TOTAL_ETAPES, moduleCourant.nomUI);
                await preparerEnvironnement(moduleCourant.nomEnv);
                
                await chargerModule(`/push/box7/${moduleCourant.fichier}`);
                
                if (typeof window[moduleCourant.fonction] === "function") {
                    await window[moduleCourant.fonction]();
                } else {
                    throw new Error(`Fonction window.${moduleCourant.fonction} introuvable.`);
                }
            }

            window._migrationEnCours = false;

            /* Affichage du résumé final PDF */
            if (UI && typeof UI.afficherResume === "function") {
                await chargerModule('/push/box7/push_pdf.js');
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

    /* Lancement direct ! */
    demarrerMigration();

})();