/* --- /push/box6/push_main.js --- */

(async function() {
    if (window._migrationEnCours) {
        console.warn("⚠️ Une migration est déjà en cours. Veuillez patienter !");
        return;
    }
    window._migrationEnCours = true;

    /* =========================================
       ⚙️ CONFIGURATION DU COMPORTEMENT
       ========================================= */
    const BASE_URL = 'https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/test';

    /* 🌟 LISTE DYNAMIQUE DES MODULES 🌟
       Changez "actif: true" pour activer un module, ou "false" pour l'ignorer. */
    const LISTE_MODULES = [
        { actif: false, nomUI: "Réveil du système", nomEnv: "Wake-Up", fichier: "push_wakeup.js", fonction: "executerWakeUp" },
        { actif: false, nomUI: "Réseaux Wi-Fi", nomEnv: "Wi-Fi", fichier: "push_wifi.js", fonction: "executerWifi" },
        { actif: false, nomUI: "Pare-feu", nomEnv: "Pare-feu", fichier: "push_parefeu.js", fonction: "executerParefeu" },
        { actif: true,  nomUI: "Accès à distance", nomEnv: "Accès à distance", fichier: "push_acces_distance.js", fonction: "executerAccesDistance" },
        { actif: false, nomUI: "Airbox", nomEnv: "Airbox", fichier: "push_airbox.js", fonction: "executerAirbox" },
        { actif: true, nomUI: "VPN Nomade", nomEnv: "VPN Nomade", fichier: "push_vpn_nomade.js", fonction: "executerVpnNomade" },
        { actif: false, nomUI: "VPN Nomade Avancés", nomEnv: "VPN Nomade Avancés", fichier: "push_vpn_nomade_avance.js", fonction: "executerVpnNomadeAvance" },
        { actif: true, nomUI: "VPN Site à Site", nomEnv: "VPN Site à Site", fichier: "push_vpn_siteasite.js", fonction: "executerVpnSiteASite" },
        { actif: false, nomUI: "Routage", nomEnv: "Routage", fichier: "push_routage.js", fonction: "executerRoutage" }
    ];

    /* Calcul automatique du nombre total d'étapes */
    const MODULES_A_EXECUTER = LISTE_MODULES.filter(mod => mod.actif);
    const TOTAL_ETAPES = MODULES_A_EXECUTER.length;
    /* ========================================= */

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
            console.log(`👉 Module [${nomModule}] : On reste sur la page actuelle.`);
            if (typeof window.attendrePause === "function") await window.attendrePause(1000);
            return;
        }
        
        if (typeof window.retournerAccueil === "function") await window.retournerAccueil();
        if (typeof window.attendrePause === "function") await window.attendrePause(1500); 
    };

    /* --- EXECUTION PRINCIPALE --- */
    try {
        /* 1. Charger d'abord l'UI */
        await chargerModule('/push/box6/push_ui.js');
        const UI = window.PushUI;

        UI.injecter();
        await new Promise(r => setTimeout(r, 1000)); 

        /* 2. Charger les utilitaires */
        UI.maj(0, TOTAL_ETAPES, "Chargement des utilitaires...");
        await chargerModule('/push/push_utils.js');

        /* 3. Exécution Dynamique (BOUCLE DRY) */
        for (let i = 0; i < MODULES_A_EXECUTER.length; i++) {
            let moduleCourant = MODULES_A_EXECUTER[i];
            let etapeActuelle = i + 1; /* L'étape commence à 1 */

            UI.maj(etapeActuelle, TOTAL_ETAPES, moduleCourant.nomUI);
            await preparerEnvironnement(moduleCourant.nomEnv);
            await chargerModule(`/push/box6/${moduleCourant.fichier}`);
            
            /* Appel dynamique de la fonction via l'objet window */
            if (typeof window[moduleCourant.fonction] === "function") {
                await window[moduleCourant.fonction]();
            } else {
                throw new Error(`Fonction window.${moduleCourant.fonction} introuvable.`);
            }
        }

        /* Fin du processus interne */
        window._migrationEnCours = false;

        /* ==================================================================== */
        /* 🌟 RÉSUMÉ GLOBAL ET GÉNÉRATION PDF 🌟                                */
        /* ==================================================================== */
        if (UI && typeof UI.afficherResume === "function") {
            console.log("📊 Affichage du résumé global des modifications...");
            await chargerModule('/push/box6/push_pdf.js');
            await UI.afficherResume(); // Le script va attendre ici
        }

        /* Message de succès final dans l'interface noire */
        UI.succes();

    } catch (erreurGrave) {
        window._migrationEnCours = false;
        if (window.PushUI) {
            window.PushUI.erreur(erreurGrave.message);
        } else {
            alert("❌ ERREUR FATALE :\n" + erreurGrave.message);
        }
    }
})();