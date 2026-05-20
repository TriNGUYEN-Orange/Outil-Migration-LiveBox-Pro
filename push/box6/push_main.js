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

    const LISTE_MODULES = [
        { actif: false, nomUI: "Réveil du système", nomEnv: "Wake-Up", fichier: "push_wakeup.js", fonction: "executerWakeUp" },
        { actif: true, nomUI: "Pare-feu", nomEnv: "Pare-feu", fichier: "push_parefeu.js", fonction: "executerParefeu" },
        { actif: true, nomUI: "Accès à distance", nomEnv: "Accès à distance", fichier: "push_acces_distance.js", fonction: "executerAccesDistance" },
        { actif: true, nomUI: "Airbox", nomEnv: "Airbox", fichier: "push_airbox.js", fonction: "executerAirbox" },
        { actif: true, nomUI: "VPN Nomade", nomEnv: "VPN Nomade", fichier: "push_vpn_nomade.js", fonction: "executerVpnNomade" },
        { actif: true, nomUI: "VPN Nomade Avancés", nomEnv: "VPN Nomade Avancés", fichier: "push_vpn_nomade_avance.js", fonction: "executerVpnNomadeAvance" },
        { actif: true, nomUI: "VPN Site à Site", nomEnv: "VPN Site à Site", fichier: "push_vpn_siteasite.js", fonction: "executerVpnSiteASite" },
        { actif: true, nomUI: "Routage", nomEnv: "Routage", fichier: "push_routage.js", fonction: "executerRoutage" },
        { actif: true, nomUI: "Réseaux Wi-Fi", nomEnv: "Wi-Fi", fichier: "push_wifi.js", fonction: "executerWifi" }
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

    const normaliserRaisonErreur = (err) => {
        const msg = (err && err.message) ? err.message : String(err || "Erreur inconnue");
        const low = msg.toLowerCase();

        if (low.includes("fichier introuvable")) return "Fichier module introuvable (IHM en évolution / chemin invalide)";
        if (low.includes("introuvable") && low.includes("fonction")) return "Fonction du module introuvable (signature/nom changé)";
        if (low.includes("timeout")) return "Timeout : élément IHM non trouvé à temps";
        if (low.includes("failed to fetch")) return "Ressource inaccessible (réseau/URL)";
        if (low.includes("cannot read") || low.includes("undefined") || low.includes("null")) return "Élément IHM absent ou structure DOM modifiée";
        return msg;
    };

    /* ==================================================================== */
    /* 🚀 LE MOTEUR PRINCIPAL DE MIGRATION                                  */
    /* ==================================================================== */
    async function demarrerMigration() {
        window._migrationEnCours = true;
        try {
            await chargerModule('/push/box6/push_ui.js');
            const UI = window.PushUI;

            // Reset journal technique à chaque run
            if (UI && typeof UI.resetJournalTechnique === "function") {
                UI.resetJournalTechnique();
            }

            await chargerModule('/outil/verification.js');
            
            if (window.ExtractVerification && typeof window.ExtractVerification.verifierEnvironnement === "function") {
                /* On passe "true" car on est en mode PUSH (besoin du JSON) */
                let environnementOk = await window.ExtractVerification.verifierEnvironnement(true);
                if (!environnementOk) {
                    window._migrationEnCours = false;
                    return; /* Arrêt : soit URL/Auth KO, soit annulation de l'upload JSON */
                }
            } else {
                console.error("❌ Impossible de charger outil/verification.js");
                window._migrationEnCours = false;
                return;
            }

            /* Lancement de l'interface d'attente (Écran Noir) */
            UI.injecter();
            await new Promise(r => setTimeout(r, 1000)); 

            if (UI && typeof UI.maj === "function") UI.maj(0, TOTAL_ETAPES, "Chargement des utilitaires...");
            await chargerModule('/push/push_utils.js');

            await chargerModule('/push/push_validation.js');

            for (let i = 0; i < MODULES_A_EXECUTER.length; i++) {
                let moduleCourant = MODULES_A_EXECUTER[i];
                let etapeActuelle = i + 1;
                const debutModule = Date.now();

                if (UI && typeof UI.maj === "function") UI.maj(etapeActuelle, TOTAL_ETAPES, moduleCourant.nomUI);

                try {
                    await preparerEnvironnement(moduleCourant.nomEnv);
                    await chargerModule(`/push/box6/${moduleCourant.fichier}`);
                    
                    if (typeof window[moduleCourant.fonction] === "function") {
                        await window[moduleCourant.fonction]();

                        // Succès module (journal technique)
                        if (UI && typeof UI.enregistrerTechnique === "function") {
                            UI.enregistrerTechnique({
                                module: moduleCourant.nomUI,
                                statut: "OK",
                                raison: "Exécution terminée",
                                dureeMs: Date.now() - debutModule
                            });
                        }
                    } else {
                        throw new Error(`Fonction window.${moduleCourant.fonction} introuvable.`);
                    }
                } catch (erreurModule) {
                    // Échec module : on log et continue vers module suivant
                    const raisonLisible = normaliserRaisonErreur(erreurModule);

                    console.error(`❌ Module "${moduleCourant.nomUI}" en échec :`, erreurModule);

                    if (UI && typeof UI.enregistrerTechnique === "function") {
                        UI.enregistrerTechnique({
                            module: moduleCourant.nomUI,
                            statut: "KO",
                            raison: raisonLisible,
                            erreurBrute: (erreurModule && erreurModule.message) ? erreurModule.message : String(erreurModule),
                            dureeMs: Date.now() - debutModule
                        });
                    }

                    // Continue sans stopper tout le cycle
                    continue;
                }
            }

            window._migrationEnCours = false;

            if (UI && typeof UI.afficherResume === "function") {
                await chargerModule('/push/box6/push_pdf.js');
                await UI.afficherResume(); 
            }

            // Affiche le bilan technique (nouveau)
            if (UI && typeof UI.afficherBilanTechnique === "function") {
                await UI.afficherBilanTechnique();
            }

            if (UI && typeof UI.succes === "function") {
                UI.succes();
            } else {
                console.log("✅ Migration terminée.");
            }

        } catch (erreurGrave) {
            window._migrationEnCours = false;
            /* Pop-up d'erreur critique (Géré par push_ui.js s'il est bien chargé) */
            if (window.PushUI && typeof window.PushUI.erreur === "function") {
                window.PushUI.erreur(erreurGrave.message);
            } else {
                alert("❌ ERREUR FATALE :\n" + erreurGrave.message);
            }
        }
    }

    /* On lance tout ! */
    demarrerMigration();

})();
