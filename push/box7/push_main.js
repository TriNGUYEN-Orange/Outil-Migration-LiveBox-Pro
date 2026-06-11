/* --- /push/box7/push_main.js --- */

(async function() {
    if (window._migrationEnCours) {
        console.warn("⚠️ Une migration est déjà en cours. Veuillez patienter !");
        return;
    }

    const detectBaseUrl = () => {
        try {
            if (document.currentScript && document.currentScript.src) {
                const src = document.currentScript.src;
                const idx = src.indexOf("/push/box7/push_main.js");
                if (idx > -1) return src.substring(0, idx);
            }

            const scripts = document.getElementsByTagName("script");
            for (let s of scripts) {
                if (s.src && s.src.includes("/push/box7/push_main.js")) {
                    const idx = s.src.indexOf("/push/box7/push_main.js");
                    if (idx > -1) return s.src.substring(0, idx);
                }
            }
        } catch (e) {}

        return window.location.origin;
    };

    // const BASE_URL = detectBaseUrl();
    //const BASE_URL = "http://127.0.0.1:5500/";
    const BASE_URL = "https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/";


    const LISTE_MODULES = [
        { actif: false, nomUI: "Réveil du système", nomEnv: "Wake-Up", fichier: "push_wakeup.js", fonction: "executerWakeUp" },
        { actif: true,  nomUI: "Pare-feu", nomEnv: "Pare-feu", fichier: "push_parefeu.js", fonction: "executerParefeu" },
        { actif: true, nomUI: "Accès à distance", nomEnv: "Accès à distance", fichier: "push_acces_distance.js", fonction: "executerAccesDistance" },
        { actif: true, nomUI: "Airbox", nomEnv: "Airbox", fichier: "push_airbox.js", fonction: "executerAirbox" },
        { actif: true, nomUI: "VPN Nomade", nomEnv: "VPN Nomade", fichier: "push_vpn_nomade.js", fonction: "executerVpnNomade" },
        { actif: true, nomUI: "VPN Nomade Avancés", nomEnv: "VPN Nomade Avancés", fichier: "push_vpn_avance.js", fonction: "executerVpnNomadeAvance" },
        { actif: true, nomUI: "VPN Site à Site", nomEnv: "VPN Site à Site", fichier: "push_vpn_siteasite.js", fonction: "executerVpnSiteASite" },
        { actif: true, nomUI: "Routage", nomEnv: "Routage", fichier: "push_routage.js", fonction: "executerRoutage" },
        { actif: true, nomUI: "Réseaux Wi-Fi", nomEnv: "Wi-Fi", fichier: "push_wifi.js", fonction: "executerWifi" }
    ];

    const MODULES_A_EXECUTER = LISTE_MODULES.filter(mod => mod.actif);
    const TOTAL_ETAPES = MODULES_A_EXECUTER.length;

    const nettoyerJsonLocal = () => {
        try {
            localStorage.removeItem("livebox_migration_config");
            sessionStorage.removeItem("livebox_migration_config");
            window.configLivebox = null;
            console.log("🧹 JSON local supprimé (livebox_migration_config).");
        } catch (e) {
            console.warn("⚠️ Impossible de supprimer le JSON local :", e);
        }
    };

    async function chargerModule(chemin) {
        return new Promise((resolve, reject) => {
            const cleanBase = BASE_URL.replace(/\/+$/, "");
            const cleanPath = chemin.replace(/^\/+/, "");
            const script = document.createElement("script");
            script.src = `${cleanBase}/${cleanPath}?v=${Date.now()}`;
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

    async function demarrerMigration() {
        window._migrationEnCours = true;

        try {
            await chargerModule("/push/box7/push_ui.js");
            const UI = window.PushUI;

            if (UI && typeof UI.resetJournalTechnique === "function") {
                UI.resetJournalTechnique();
            }

            await chargerModule("/outil/verification.js");

            if (window.ExtractVerification && typeof window.ExtractVerification.verifierEnvironnement === "function") {
                const environnementOk = await window.ExtractVerification.verifierEnvironnement(true);
                if (!environnementOk) {
                    window._migrationEnCours = false;
                    return;
                }
            } else {
                console.error("❌ Impossible de charger outil/verification.js");
                window._migrationEnCours = false;
                return;
            }

            if (UI && typeof UI.injecter === "function") UI.injecter();
            await new Promise(r => setTimeout(r, 1000));

            if (UI && typeof UI.maj === "function") UI.maj(0, TOTAL_ETAPES, "Chargement des utilitaires...");

            await chargerModule("/push/push_utils.js");
            await chargerModule("/push/push_validation.js");

            if (typeof window.chargerConfiguration === "function") {
                window.configLivebox = await window.chargerConfiguration();
            } else {
                throw new Error("chargerConfiguration introuvable.");
            }

            if (!window.configLivebox || typeof window.configLivebox !== "object") {
                throw new Error("Configuration vide / non déchiffrable.");
            }

            console.log("✅ Configuration chargée dans window.configLivebox");
            try {
                const raw = localStorage.getItem("livebox_migration_config");
                if (raw) {
                    const p = JSON.parse(raw);
                    console.log("ℹ️ Payload alg détecté:", p.alg || "plain");
                }
            } catch(e) {}

            for (let i = 0; i < MODULES_A_EXECUTER.length; i++) {
                const moduleCourant = MODULES_A_EXECUTER[i];
                const etapeActuelle = i + 1;
                const debutModule = Date.now();

                if (UI && typeof UI.maj === "function") UI.maj(etapeActuelle, TOTAL_ETAPES, moduleCourant.nomUI);

                try {
                    await preparerEnvironnement(moduleCourant.nomEnv);
                    await chargerModule(`/push/box7/${moduleCourant.fichier}`);

                    if (typeof window[moduleCourant.fonction] === "function") {
                        await window[moduleCourant.fonction]();

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

                    continue;
                }
            }

            window._migrationEnCours = false;

            if (UI && typeof UI.afficherResume === "function") {
                await chargerModule("/push/box7/push_pdf.js");
                await UI.afficherResume();
            }

            if (UI && typeof UI.afficherBilanTechnique === "function") {
                await UI.afficherBilanTechnique();
            }

            if (UI && typeof UI.succes === "function") {
                UI.succes();
                nettoyerJsonLocal();
            } else {
                console.log("✅ Migration terminée.");
                nettoyerJsonLocal();
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

    demarrerMigration();
})();
