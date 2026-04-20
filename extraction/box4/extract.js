const CODE_BRUT_EXTRACTION = `
(async function() {
    /* --- INITIALISATION ET STOCKAGE LOCAL --- */
    const CLE_STORAGE = "livebox_migration_config";
    
    /* Charger depuis le localStorage ou créer un nouveau DTO */
    let configLivebox = JSON.parse(localStorage.getItem(CLE_STORAGE)) || { 
        "wifi": {}, 
        "dhcp": {} 
    };

    /* --- FONCTIONS UTILITAIRES --- */
    
    /* Fonction clé : Attente dynamique */
    const attendreElement = (selecteur, tempsMax = 20000) => {
        return new Promise((resolve) => {
            let element = document.querySelector(selecteur);
            if (element) return resolve(element); /* Trouvé immédiatement */

            const intervalle = setInterval(() => {
                element = document.querySelector(selecteur);
                if (element) {
                    clearInterval(intervalle);
                    clearTimeout(securiteTimeout);
                    resolve(element);
                }
            }, 200); /* Vérifie toutes les 200ms */

            const securiteTimeout = setTimeout(() => {
                clearInterval(intervalle);
                console.warn("⚠️ Délai dépassé pour l'élément : " + selecteur);
                resolve(null); /* Continue le script même si non trouvé pour éviter le blocage */
            }, tempsMax);
        });
    };

    function simulerClic(selecteur) {
        let element = document.querySelector(selecteur);
        if(element) {
            ['mousedown', 'mouseup', 'click'].forEach(function(type) {
                element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
            });
            return true;
        }
        return false;
    }

    function lireTexte(selecteur) {
        let element = document.querySelector(selecteur);
        return element ? (element.innerText || element.textContent).trim() : "Introuvable";
    }

    function lireEtat(selecteur) {
        let element = document.querySelector(selecteur);
        if(!element) return "Introuvable";
        if(element.tagName === 'INPUT') return element.checked;
        let boutonOui = element.querySelector("input[type='radio'][value='true'], input[type='radio'][value='1'], input[type='radio'][value='oui'], input[type='radio'][value='on']");
        if(boutonOui) return boutonOui.checked;
        let inputInterne = element.querySelector("input[type='radio'], input[type='checkbox']");
        if(inputInterne) return inputInterne.checked;
        return "Erreur_Structure";
    }

    function lireValeurInput(selecteur) {
        let element = document.querySelector(selecteur);
        if(!element) return "Introuvable";
        if(element.tagName === 'INPUT' || element.tagName === 'SELECT') {
            return element.value.trim();
        }
        return (element.innerText || element.textContent).trim();
    }

    /* V2 : CORRECTION POUR IGNORER LES LIGNES VIDES OU INCOMPLÈTES */
    function extraireTableau(selecteurTableau, configurationColonnes) {
        let resultats = [];
        let lignes = document.querySelectorAll(selecteurTableau + " tr");
        
        /* Commencer à 1 pour ignorer la première ligne (en-tête) */
        for (let i = 1; i < lignes.length; i++) {
            let cellules = lignes[i].querySelectorAll("td");
            let objetLigne = {};
            let estValide = true;

            /* Étape 1: Vérifier que TOUTES les colonnes demandées existent bien dans cette ligne */
            for (let cle in configurationColonnes) {
                let indexColonne = configurationColonnes[cle];
                if (!cellules[indexColonne]) {
                    estValide = false; /* Il manque une colonne (ex: ligne unique "Aucun équipement") */
                    break; 
                }
            }

            /* Étape 2: Si la ligne a bien la bonne structure, on extrait les données */
            if (estValide) {
                for (let cle in configurationColonnes) {
                    let indexColonne = configurationColonnes[cle];
                    objetLigne[cle] = (cellules[indexColonne].innerText || cellules[indexColonne].textContent).trim();
                }
                resultats.push(objetLigne);
            }
        }
        return resultats;
    }

    /* =========================================
       DÉBUT DU PROCESSUS AUTOMATIQUE
       ========================================= */
    try {
        
        /* --- BLOC 1 : ACCUEIL --- */
        console.log("⏳ [1/3] Extraction sur la page Accueil...");
        
        /* S'assurer que la page d'accueil est chargée avant de lire */
        await attendreElement("#gwtActivityPanel > div > div > div.homeRight > div:nth-child(1) > div.home-block.content.small > div:nth-child(1) > div:nth-child(2)", 5000);

        configLivebox.wifi.ssid = lireTexte("#gwtActivityPanel > div > div > div.homeRight > div:nth-child(1) > div.home-block.content.small > div:nth-child(1) > div:nth-child(2)");
        configLivebox.wifi.mot_de_passe = lireTexte("#gwtActivityPanel > div > div > div.homeRight > div:nth-child(1) > div.home-block.content.small > div:nth-child(2) > div:nth-child(2)");
        configLivebox.wifi.adresse_ip_internet = lireTexte("#gwtActivityPanel > div > div > div.homeRight > div:nth-child(4) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2)");

        /* Sauvegarde temporaire */
        localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));

        /* Navigation vers Wi-Fi */
        simulerClic("#homepage_wifi_configuration_hyperlink");


        /* --- BLOC 2 : WI-FI --- */
        console.log("⏳ [2/3] Extraction sur la page Wi-Fi...");
        
        /* Attendre dynamiquement que le panneau Wi-Fi apparaisse */
        await attendreElement("#network_wifi_activation_difference_radioPanel", 10000);
        
        configLivebox.wifi.differencier_reseaux = lireEtat("#network_wifi_activation_difference_radioPanel");

        if(simulerClic("#network_wifi_wifi2\\\\.4_foldable_imageButton")) {
            /* Attendre dynamiquement l'ouverture du sous-menu 2.4GHz */
            await attendreElement("#network_wifi_wifi2\\\\.4_technicalSettings_broadCastSsid_radioPanel", 5000);
            
            configLivebox.wifi.diffusion_ssid_24 = lireEtat("#network_wifi_wifi2\\\\.4_technicalSettings_broadCastSsid_radioPanel");
            configLivebox.wifi.afficher_cle_ecran = lireEtat("#network_wifi_wifi2\\\\.4_securitySettings_wifiKeyDisplayed_radioPanel");
            configLivebox.wifi.filtrage_mac_24 = lireEtat("#network_wifi_wifi2\\\\.4_authorizedEquipement_macFiltering_radioPanel");
            
            /* Utilisation de la nouvelle fonction extraireTableau */
            configLivebox.wifi.equipements_autorises = extraireTableau("#network_wifi_wifi2\\\\.4_authorizedEquipementSection_mainBlock > div:nth-child(6) > div > table", 
                { 
                    "nom_equipement": 0, 
                    "adresse_mac": 2 
                }
            );            
            
            /* Sauvegarde temporaire */
            localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
        } else {
            console.warn("⚠️ Menu 2.4GHz introuvable, passage à l'étape suivante.");
        }

        /* Navigation vers DHCP */
        simulerClic("#menu_menuNetwork_dhcpdns_hyperlink");


        /* --- BLOC 3 : DHCP & DNS --- */
        console.log("⏳ [3/3] Extraction sur la page DHCP/DNS...");
        
        /* Attendre dynamiquement que le panneau DHCP apparaisse */
        await attendreElement("#network_dhcp_configuration_serverState_radioPanel", 10000);

        configLivebox.dhcp["état du serveur DHCP"] = lireEtat("#network_dhcp_configuration_serverState_radioPanel");
        configLivebox.dhcp["adresse IP du LAN"] = lireValeurInput("#network_dhcp_configuration_ipLanAddress_textbox");
        configLivebox.dhcp["masque de sous-réseau du LAN"] = lireValeurInput("#network_dhcp_configuration_subnetMask_textbox");
        configLivebox.dhcp["adresse IP de début"] = lireValeurInput("#network_dhcp_configuration_ipAddress_start_textbox");
        configLivebox.dhcp["adresse IP de fin"] = lireValeurInput("#network_dhcp_configuration_ipAddress_end_textbox");
        configLivebox.dhcp["mode DNS"] = lireValeurInput("#network_dhcp_configuration_modeDNS_combobox");
        
        /* Utilisation de la nouvelle fonction extraireTableau pour les adresses statiques */
        configLivebox.dhcp["Baux DHCP statiques"] = extraireTableau("#network_dhcp_staticAddressesSection_mainBlock > div:nth-child(4) > table",
            { 
                "Équipement": 0, 
                "Adresse IP statique": 1, 
                "Adresse MAC": 2 
            }
        );

        /* Sauvegarde finale en mémoire locale */
        localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));


        /* --- TÉLÉCHARGEMENT FINAL --- */
        console.log("⏳ Génération du fichier JSON...");
        let texteJson = JSON.stringify(configLivebox, null, 2);
        let objetFichier = new Blob([texteJson], { type: "application/json" });
        let urlFichier = URL.createObjectURL(objetFichier);
        
        let lien = document.createElement("a");
        lien.href = urlFichier;
        lien.download = "livebox_migration_config.json";
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
        URL.revokeObjectURL(urlFichier);

        /* Nettoyage du localStorage pour ne pas laisser de traces */
        localStorage.removeItem(CLE_STORAGE);

    } catch (erreur) {
        console.error("❌ Une erreur est survenue durant l'exécution :", erreur);
        alert("❌ Erreur lors de l'extraction : " + erreur.message);
    }
})();
`;