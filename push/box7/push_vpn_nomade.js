/* --- /push/box7/push_vpn_nomade.js --- */

window.executerVpnNomade = async function() {
    /* 🚨 INITIALISATION DES DONNÉES GLOBALES POUR REMPLACER LE CONST 🚨 */
    let configJSON = localStorage.getItem("livebox_migration_config");
    if (!configJSON) return;
    let configLivebox = JSON.parse(configJSON);

    /* --- ÉTAPE : CONFIGURATION DU VPN NOMADE --- */
    console.log("⏳ Application des paramètres VPN...");

    if (configLivebox && configLivebox.vpn && configLivebox.vpn.nomade) {
        
        await window.retournerAccueil();
        await window.attendrePause(500); 
        
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            window.cliquerBouton("#sah_footer .icon-advanced");
            
            console.log("⏳ Chargement des modules avancés...");
            await window.attendrePause(1500); 
            
            let tuileVpn = await window.attendreElement("#internetVPNAnkaa", 10000);
            if (tuileVpn) {
                tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await window.attendrePause(500); 
                
                window.cliquerBouton("#internetVPNAnkaa .widget");
                
                let titre = await window.attendreElement("#internetVPNAnkaaTitle", 5000);
                if (titre) {
                    await window.attendrePause(500); 
                    window.cliquerBouton(titre);
                }

                await window.attendreFinSauvegarde();
                await window.attendreDisparitionPopup();
                
                /* =================================================================================== */
                /* GESTION DES COMPTES                                                                 */
                /* =================================================================================== */
                let vpnNomade = configLivebox.vpn.nomade;
                let comptes = vpnNomade.comptes || [];
                let maxComptes = Math.min(comptes.length, 4); 
                
                for (let i = 0; i < maxComptes; i++) {
                    let compte = comptes[i];
                    
                    let btnAjout = await window.attendreElement("a[data-translation='internetVPNAnkaa.label.addAnkaa']", 5000);
                    if (btnAjout) {
                        btnAjout.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        btnAjout.click();
                        
                        let popup = await window.attendreElement("#user_popup", 3000);
                        if (popup) {
                            if (compte["nom de l'utilisateur"]) window.ecrireTexteDansDoc(document, "#user_name", compte["nom de l'utilisateur"]);
                            if (compte["mot de passe de l'utilisateur"]) {
                                window.ecrireTexteDansDoc(document, "#password", compte["mot de passe de l'utilisateur"]);
                                window.ecrireTexteDansDoc(document, "#password_confirm", compte["mot de passe de l'utilisateur"]);
                            }
                            
                            let btnSave = document.querySelector("#changepwd_save");
                            if (btnSave) {
                                btnSave.click();
                                await window.attendreFinSauvegarde();
                                await window.attendreDisparitionPopup();
                            }
                            
                            let lignesTableau = document.querySelectorAll("table tbody tr, .conf-table-ractive-row");
                            let etatVoulu = compte["état de l'utilisateur"] ? compte["état de l'utilisateur"].toLowerCase() : "activé";
                            let veutEtreActive = (etatVoulu === "activé" || etatVoulu === "true");
                            
                            for (let ligne of lignesTableau) {
                                let txtLigne = (ligne.innerText || "").toLowerCase();
                                let nomCompte = (compte["nom de l'utilisateur"] || "").toLowerCase();
                                
                                if (nomCompte && txtLigne.includes(nomCompte)) {
                                    let btnToggle = ligne.querySelector("td:nth-child(1) div, .conf-table-ractive-checkbox-image, input[type='checkbox']");
                                    if (btnToggle) {
                                        let htmlLigne = (ligne.innerHTML || "").toLowerCase();
                                        let estActuellementActive = htmlLigne.includes("checked");
                                        let inpCheck = ligne.querySelector("input[type='checkbox']");
                                        if (inpCheck) estActuellementActive = inpCheck.checked;
                                        
                                        if (estActuellementActive !== veutEtreActive) {
                                            btnToggle.click();
                                            await window.attendreFinSauvegarde(); 
                                        }
                                    }
                                    break; 
                                }
                            }
                        }
                    }
                }
            }
        }
        
        console.log("🔄 Configuration terminée, retour à l'accueil...");
        await window.retournerAccueil();
    }
};