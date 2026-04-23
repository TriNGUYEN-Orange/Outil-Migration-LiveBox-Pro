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
    const BASE_URL = 'http://127.0.0.1:5500';
    const TOTAL_ETAPES = 8; /* Ajusté selon vos modules actifs */
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

    /* --- EXECUTION --- */
    try {
        /* 1. Charger d'abord l'UI */
        await chargerModule('/push/box6/push_ui.js');
        const UI = window.PushUI;

        UI.injecter();
        await new Promise(r => setTimeout(r, 1000)); 

        /* 2. Charger les utilitaires */
        UI.maj(0, TOTAL_ETAPES, "Chargement des utilitaires...");
        await chargerModule('/push/push_utils.js');

        /*
        UI.maj(1, TOTAL_ETAPES, "Réveil du système");
        await preparerEnvironnement("Wake-Up");
        await chargerModule('/push/box6/push_wakeup.js');
        if (typeof window.executerWakeUp === "function") await window.executerWakeUp();

        UI.maj(2, TOTAL_ETAPES, "Réseaux Wi-Fi");
        await preparerEnvironnement("Wi-Fi");
        await chargerModule('/push/box6/push_wifi.js');
        if (typeof window.executerWifi === "function") await window.executerWifi();

        UI.maj(3, TOTAL_ETAPES, "Pare-feu");
        await preparerEnvironnement("Pare-feu");
        await chargerModule('/push/box6/push_parefeu.js');
        if (typeof window.executerParefeu === "function") await window.executerParefeu();
        else throw new Error("Fonction window.executerParefeu introuvable.");
        */

        UI.maj(4, TOTAL_ETAPES, "Accès à distance");
        await preparerEnvironnement("Accès à distance");
        await chargerModule('/push/box6/push_acces_distance.js');
        if (typeof window.executerAccesDistance === "function") await window.executerAccesDistance();
        else throw new Error("Fonction window.executerAccesDistance introuvable.");
        
            /*
        UI.maj(5, TOTAL_ETAPES, "Airbox");
        await preparerEnvironnement("Airbox");
        await chargerModule('/push/box6/push_airbox.js');
        if (typeof window.executerAirbox === "function") await window.executerAirbox();
        else throw new Error("Fonction window.executerAirbox introuvable.");
        

        
        UI.maj(6, TOTAL_ETAPES, "VPN Nomade");
        await preparerEnvironnement("VPN Nomade");
        await chargerModule('/push/box6/push_vpn_nomade.js');
        if (typeof window.executerVpnNomade === "function") await window.executerVpnNomade();
        else throw new Error("Fonction window.executerVpnNomade introuvable.");

        UI.maj(6, TOTAL_ETAPES, "VPN Nomade Avancés");
        await preparerEnvironnement("VPN Nomade Avancés");
        await chargerModule('/push/box6/push_vpn_nomade_avance.js');
        if (typeof window.executerVpnNomadeAvance === "function") await window.executerVpnNomadeAvance();
        else throw new Error("Fonction window.executerVpnNomadeAvance introuvable.");
        

        UI.maj(7, TOTAL_ETAPES, "VPN Site à Site");
        await preparerEnvironnement("VPN Site à Site");
        await chargerModule('/push/box6/push_vpn_siteasite.js');
        if (typeof window.executerVpnSiteASite === "function") await window.executerVpnSiteASite();
        else throw new Error("Fonction window.executerVpnSiteASite introuvable.");
        

        UI.maj(8, TOTAL_ETAPES, "Routage");
        await preparerEnvironnement("Routage");
        await chargerModule('/push/box6/push_routage.js');
        if (typeof window.executerRoutage === "function") await window.executerRoutage();
        else throw new Error("Fonction window.executerRoutage introuvable.");
        */

        /* Fin du processus */
        window._migrationEnCours = false;
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