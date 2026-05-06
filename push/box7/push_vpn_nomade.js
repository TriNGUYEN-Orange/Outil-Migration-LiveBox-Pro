/* --- /push/box7/push_vpn_nomade.js --- */

window.executerVpnNomade = async function() {
    console.log("⏳ [VPN Nomade] Initialisation du module (Structure unifiée)...");

    let configJSON = localStorage.getItem("livebox_migration_config");
    if (!configJSON) {
        console.error("❌ [VPN Nomade] ERREUR : Fichier JSON introuvable !");
        return;
    }
    let configLivebox = JSON.parse(configJSON);

    if (!configLivebox || !configLivebox.vpn || !configLivebox.vpn.nomade) {
        console.warn("⚠️ [VPN Nomade] IGNORÉ : Aucune configuration 'vpn.nomade' trouvée.");
        return;
    }

    console.log("👉 [VPN Nomade] Données trouvées. Retour à l'accueil...");
    await window.retournerAccueil();
    await window.attendrePause(500); 
    
    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1500); 
        
        let tuileVpn = await window.attendreElement("#internetVPNAnkaa, #internetVPN", 10000);
        
        if (tuileVpn) {
            tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500); 
            
            let widget = tuileVpn.querySelector(".widget") || tuileVpn;
            if (typeof window.cliquerPur === "function") window.cliquerPur(widget);
            else widget.click();
            
            let titre = await window.attendreElement("#internetVPNAnkaaTitle, #internetVPNTitle", 5000);
            if (titre) {
                await window.attendrePause(500); 
                window.cliquerBouton(titre);
            }

            await window.attendreFinSauvegarde();
            await window.attendreDisparitionPopup();
            
            /* =================================================================================== */
            /* GESTION DES COMPTES VPN (STRUCTURE UNIFIÉE BOX 6 & 7)                               */
            /* =================================================================================== */
            let vpnNomade = configLivebox.vpn.nomade;
            let comptes = vpnNomade.comptes || [];
            let maxComptes = Math.min(comptes.length, 4); 

            /* 🛠️ Fonction DRY pour éviter la répétition de code de saisie */
            const remplirChamp = async (selecteur, valeur) => {
                if (valeur) {
                    window.ecrireTexteDansDoc(document, selecteur, valeur);
                    await window.attendrePause(200);
                }
            };
            
            for (let i = 0; i < maxComptes; i++) {
                let compte = comptes[i];
                console.log(`⏳ Vérification du compte (${i + 1}/${maxComptes}) : ${compte["nom de l'utilisateur"]}`);

                /* 🌟 1. UTILISATION DU POP-UP DE SÉCURITÉ (Hérité de la Box 6) 🌟 */
                let nomConforme = await window.PushUI.validerNom(compte["nom de l'utilisateur"], "Utilisateur", "VPN Nomade");
                if (nomConforme === null) { console.log("⏭️ Compte ignoré par l'utilisateur."); continue; }
                
                let mdpConforme = await window.PushUI.validerMotDePasse(compte["mot de passe de l'utilisateur"], nomConforme, "VPN Nomade", "User");
                if (mdpConforme === null) { console.log("⏭️ Compte ignoré par l'utilisateur."); continue; }
                
                /* Mise à jour des valeurs avec celles validées par le Pop-up */
                compte["nom de l'utilisateur"] = nomConforme;
                compte["mot de passe de l'utilisateur"] = mdpConforme;

                /* 🌟 2. NAVIGATION ET AJOUT 🌟 */
                let btnAjout = await window.attendreElement("a[data-translation='internetVPNAnkaa.label.addAnkaa'], a[data-translation='internetVPNAnkaa.label.add']", 5000);
                
                if (btnAjout) {
                    btnAjout.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    /* 🚨 FIX: Un seul clic pour éviter d'ouvrir deux popups ! */
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnAjout);
                    else btnAjout.click();
                    
                    let popup = await window.attendreElement("#user_popup", 3000);
                    if (popup) {
                        await window.attendrePause(800);

                        /* SÉLECTION OBLIGATOIRE DU TYPE L2TP/IPSEC AVEC SIMULATION (Spécifique Box 7) */
                        let selectType = popup.querySelector("select.select, select");
                        if (selectType && selectType.value !== "L2TYPE") {
                            console.log("👉 Changement du Type VPN vers L2TP/IPsec...");
                            
                            selectType.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                            selectType.focus();
                            selectType.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            await window.attendrePause(300);

                            selectType.value = "L2TYPE";
                            Array.from(selectType.options).forEach(opt => { opt.selected = (opt.value === "L2TYPE"); });

                            selectType.dispatchEvent(new Event('input', { bubbles: true }));
                            selectType.dispatchEvent(new Event('change', { bubbles: true }));
                            selectType.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            selectType.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            selectType.blur();

                            await window.attendrePause(1000); 
                        }

                        /* 📝 REMPLISSAGE OPTIMISÉ AVEC LA FONCTION 'remplirChamp' */
                        await remplirChamp("#user_name", compte["nom de l'utilisateur"]);
                        await remplirChamp("#password", compte["mot de passe de l'utilisateur"]);
                        await remplirChamp("#password_confirm", compte["mot de passe de l'utilisateur"]);
                        
                        /* 💾 SAUVEGARDE DU COMPTE */
                        let btnSave = document.querySelector("#changepwd_save");
                        if (btnSave) {
                            /* 🚨 FIX: Un seul clic pour éviter de soumettre le formulaire en double ! */
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                            else btnSave.click();
                            
                            await window.attendreFinSauvegarde();
                            await window.attendreDisparitionPopup();
                        } else {
                            console.warn("⚠️ Bouton 'Enregistrer' introuvable dans le popup !");
                        }
                        
                        /* 🔄 ACTIVATION / DÉSACTIVATION DU COMPTE DANS LE TABLEAU */
                        let lignesTableau = document.querySelectorAll("table tbody tr, .conf-table-ractive-row");
                        let etatVoulu = compte["état de l'utilisateur"] ? compte["état de l'utilisateur"].toLowerCase() : "activé";
                        let veutEtreActive = (etatVoulu === "activé" || etatVoulu === "true" || etatVoulu === "active");
                        
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
                                        /* 🚨 FIX: Clic unique ici aussi */
                                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnToggle);
                                        else btnToggle.click();
                                        
                                        await window.attendreFinSauvegarde(); 
                                    }
                                }
                                break; 
                            }
                        }
                    } else {
                        console.error(`❌ [VPN Nomade] ERREUR : Popup d'ajout introuvable pour ${compte["nom de l'utilisateur"]}`);
                    }
                } else {
                    console.error("❌ [VPN Nomade] ERREUR : Bouton 'Ajouter' introuvable.");
                }
            }
        }
    }
    
    console.log("🔄 [VPN Nomade] Fin du traitement, retour à l'accueil...");
    await window.retournerAccueil();
};