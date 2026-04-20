/* --- /box4/extract_vpn_siteasite.js --- */

window.extraireVpnSite = async function() {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendrePause, 
        lireEtat, 
        CLE_STORAGE 
    } = window;


    /* --- BLOC 10 : VPN (Site à Site) --- */
    console.log("⏳ [10/x] Extraction sur la page VPN...");

    const lireSecurise = (selecteur) => {
        try {
            let el = document.querySelector(selecteur);
            if (!el) return "";
            let val = (el.tagName === 'INPUT' || el.tagName === 'SELECT') ? el.value : (el.innerText || el.textContent);
            return val ? String(val).trim() : "";
        } catch(e) {
            return "";
        }
    };

    simulerClic("#menu_menuNetwork_vpn_hyperlink");
    await attendrePause(3000); 

    configLivebox.vpn = configLivebox.vpn || {};
    configLivebox.vpn["vpn site à site"] = []; 

    let selecteurBoutonEdition = "img[title='éditer/modifier cette connexion site à site']";
    await attendreElement(selecteurBoutonEdition, 15000);
    
    let nbConnexions = document.querySelectorAll(selecteurBoutonEdition).length;

    if (nbConnexions > 0) {
        console.log("⚠️ " + nbConnexions + " connexion(s) VPN trouvée(s). Début de la boucle...");

        for (let i = 0; i < nbConnexions; i++) {
            await attendreElement(selecteurBoutonEdition, 15000);
            await attendrePause(1000);

            let boutons = document.querySelectorAll(selecteurBoutonEdition);
            let boutonActuel = boutons[i];

            if (boutonActuel) {
                ['mousedown', 'mouseup', 'click'].forEach(evt => {
                    boutonActuel.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
                });
                
                let blocFormulaireVpn = "#gwtActivityPanel form div[class*='formLayout']";
                await attendreElement(blocFormulaireVpn, 15000);
                await attendrePause(1500); 
                
                let formVisible = document.querySelector(blocFormulaireVpn);

                if (formVisible) {
                    let vpnConfig = {}; 
                    try {
                        vpnConfig["activé"] = lireEtat(blocFormulaireVpn + " > div:nth-child(1)");
                        
                        /* 🛡️ REFACTOR : Remplacement des guillemets imbriqués par des *= pour éviter tout crash de syntaxe */
                        let valNom = lireSecurise("input[title*='nom de la connexion VPN']");
                        vpnConfig["nom VPN"] = valNom ? valNom : lireSecurise(blocFormulaireVpn + " > div:nth-child(2) input");

                        let valIpDistante = lireSecurise("input[title*='IP de la machine VPN distante']");
                        vpnConfig["adresse IP du site distant"] = valIpDistante ? valIpDistante : lireSecurise(blocFormulaireVpn + " > div:nth-child(3) input");

                        let valEquipement = lireSecurise("select[title*='équipement distant']");
                        vpnConfig["équipement distant"] = valEquipement ? valEquipement : lireSecurise(blocFormulaireVpn + " > div:nth-child(4) select");

                        vpnConfig["clé partagée"] = lireSecurise(blocFormulaireVpn + " > div:nth-child(5) input");

                        let ipLocal = lireSecurise("input[title*='IP de votre réseau local']");
                        let masqueLocal = lireSecurise("input[title*='masque du réseau'][title*='local']");
                        vpnConfig["réseau local"] = { "ip": ipLocal, "masque": masqueLocal };

                        let ipDistant = lireSecurise("input[title*='IP'][title*='réseau distant']");
                        let masqueDistant = lireSecurise("input[title*='masque'][title*='réseau distant']");
                        vpnConfig["réseau distant"] = { "ip": ipDistant, "masque": masqueDistant };

                        let radioModeCoche = document.querySelector("input[name='tunnelMode']:checked");
                        if (radioModeCoche) {
                            let labelAssocie = document.querySelector('label[for="' + radioModeCoche.id + '"]');
                            vpnConfig["mode de configuration du tunnel"] = labelAssocie ? (labelAssocie.innerText || labelAssocie.textContent).trim() : radioModeCoche.value;
                        } else {
                            vpnConfig["mode de configuration du tunnel"] = "Inconnu";
                        }

                        configLivebox.vpn["vpn site à site"].push(vpnConfig);
                        console.log("✅ Connexion " + (i + 1) + " extraite avec succès !");

                    } catch(erreurExtraction) {
                        console.error("❌ Erreur sur la connexion " + (i + 1) + " :", erreurExtraction);
                        vpnConfig["statut"] = "Erreur de lecture";
                        configLivebox.vpn["vpn site à site"].push(vpnConfig);
                    }
                }

                let btnRetour = document.querySelector("#back_form_button");
                if (btnRetour) {
                    ['mousedown', 'mouseup', 'click'].forEach(evt => {
                        btnRetour.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
                    });
                    await attendreElement(selecteurBoutonEdition, 15000);
                    await attendrePause(2000);
                }
            }
        }
    } else {
        console.warn("ℹ️ Aucun VPN configuré ou liste vide.");
        configLivebox.vpn["statut"] = "Aucun VPN configuré";
    }

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};