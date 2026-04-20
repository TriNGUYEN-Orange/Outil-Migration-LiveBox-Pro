const CODE_PUSH_VPN_SITE = `
    /* --- ÉTAPE : CONFIGURATION DU VPN SITE À SITE --- */
    console.log("⏳ Application des paramètres VPN Site à Site...");

    if (configLivebox && configLivebox.vpn) {
        let vpnSiteASite = configLivebox.vpn["vpn site à site"] || configLivebox.vpn["vpn site a site"];
        
        if (vpnSiteASite && Array.isArray(vpnSiteASite) && vpnSiteASite.length > 0) {
            let btnAvance = await attendreElement("#sah_footer .icon-advanced", 10000);
            
            if (btnAvance) {
                cliquerBouton("#sah_footer .icon-advanced");
                await attendrePause(800); 
                
                let tuileVpn = await attendreElement("#internetVPNAnkaa", 10000);
                if (tuileVpn) {
                    tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    cliquerBouton("#internetVPNAnkaa .widget");
                    
                    /* 🚨 Z-INDEX FIX : 2147483647 */
                    const afficherPopupValidation = (titre, message, valeurInitiale) => {
                        return new Promise((resolve) => {
                            let overlay = document.createElement("div");
                            overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;";
                            let boite = document.createElement("div");
                            boite.style.cssText = "background:#fff;padding:25px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.3);max-width:400px;width:90%;font-family:Arial, sans-serif;pointer-events:auto;";
                            
                            let h3 = document.createElement("h3"); 
                            h3.innerText = titre; 
                            h3.style.color = "#ff7900";
                            h3.style.marginTop = "0";
                            
                            let msg = document.createElement("p"); 
                            msg.innerText = message;
                            msg.style.fontSize = "14px";
                            
                            let input = document.createElement("input"); 
                            input.type = "text"; 
                            input.value = valeurInitiale || "";
                            input.style.cssText = "width:100%;box-sizing:border-box;padding:10px;margin-top:15px;border:1px solid #ccc;border-radius:4px;font-size:16px;";
                            
                            let btnDiv = document.createElement("div"); 
                            btnDiv.style.cssText = "display:flex;justify-content:flex-end;gap:10px;margin-top:25px;";
                            
                            let btnAnnuler = document.createElement("button"); 
                            btnAnnuler.innerText = "Annuler";
                            btnAnnuler.style.cssText = "padding:8px 15px;border:none;border-radius:4px;cursor:pointer;background:#ddd;";
                            btnAnnuler.onclick = () => { document.body.removeChild(overlay); resolve(null); };
                            
                            let btnValider = document.createElement("button"); 
                            btnValider.innerText = "Valider";
                            btnValider.style.cssText = "padding:8px 15px;border:none;border-radius:4px;cursor:pointer;background:#ff7900;color:white;font-weight:bold;";
                            btnValider.onclick = () => { document.body.removeChild(overlay); resolve(input.value); };
                            
                            btnDiv.append(btnAnnuler, btnValider); 
                            boite.append(h3, msg, input, btnDiv);
                            overlay.appendChild(boite); 
                            document.body.appendChild(overlay);
                        });
                    };

                    const validerNomVPN = async (nomActuel) => {
                        let val = nomActuel;
                        while (!val || !/^[a-zA-Z0-9]{3,20}$/.test(val)) {
                            val = await afficherPopupValidation("Nom Invalide", "Règles : 3-20 caractères, alphanumérique (sans espace ni spéciaux).", val);
                            if (val === null) return null;
                        }
                        return val;
                    };

                    const validerClePartagee = async (cleActuelle) => {
                        let val = cleActuelle;
                        while (!val || val.length < 8 || !/[A-Z]/.test(val) || !/[a-z]/.test(val) || !/[0-9]/.test(val) || !/^[A-Za-z0-9 !'#$%&()*+,\\-./:;<=>?@\\[\\]^_\`{|}~]+$/.test(val)) {
                            val = await afficherPopupValidation("Clé non sécurisée", "Règles : Au moins 8 caractères (1 maj, 1 min, 1 chiffre).", val);
                            if (val === null) return null; 
                        }
                        return val;
                    };

                    await attendreFinSauvegarde();
                    await attendreDisparitionPopup();
                    
                    let tabSite2Site = await attendreElement("#tab_vpnSite2site", 5000);
                    if (tabSite2Site) {
                        cliquerPur(tabSite2Site);
                        await attendreFinSauvegarde();
                        
                        /* BOUCLE SUR LES SITES */
                        for (let i = 0; i < vpnSiteASite.length; i++) {
                            let site = vpnSiteASite[i];
                            
                            let nomVPNConforme = await validerNomVPN(site["nom VPN"]);
                            if (nomVPNConforme === null) continue; 
                            
                            let cleConforme = await validerClePartagee(site["clé partagée"]);
                            if (cleConforme === null) continue;
                            
                            let btnAjoutSite = await attendreElement("#content_template_container > div:nth-child(4) > div > a", 3000);
                            if (btnAjoutSite) {
                                btnAjoutSite.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                cliquerPur(btnAjoutSite);
                                
                                let popupSite = await attendreElement("#site_popup", 3000);
                                if (popupSite) {
                                    ecrireTexteDansDoc(document, "#site_name", nomVPNConforme);
                                    if (site["adresse IP du site distant"]) ecrireTexteDansDoc(document, "#ip", site["adresse IP du site distant"]);
                                    if (site["réseau distant"] && site["réseau distant"]["ip"]) ecrireTexteDansDoc(document, "#distant_ip", site["réseau distant"]["ip"] + "/24");
                                    
                                    let champCle = document.querySelector("#site_popup > div.sah_dialog_body > div.ipsec_groupe_site.input-wrapper.middle > div.row.text-field-row > div.col-xs-5.text-field-input > input");
                                    if (champCle) {
                                        champCle.focus(); champCle.value = cleConforme;
                                        champCle.dispatchEvent(new Event('input', { bubbles: true })); champCle.blur();
                                    }
                                    
                                    if (site["équipement distant"]) {
                                        let equipVal = String(site["équipement distant"]).toLowerCase();
                                        let cibleEquip = (equipVal.includes("3") || equipVal.includes("4")) ? "LiveBoxPro v3/v4" : (equipVal.includes("5") || equipVal.includes("6") || equipVal.includes("7") ? "Livebox 5 et supérieur" : "Autre");
                                        
                                        let selectEquip = document.querySelector("#distantEquipSelect > div > select");
                                        if (selectEquip) {
                                            for (let opt of selectEquip.options) {
                                                if (opt.innerText.toLowerCase().includes(cibleEquip.toLowerCase())) {
                                                    opt.selected = true;
                                                    selectEquip.dispatchEvent(new Event('change', { bubbles: true }));
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    
                                    let btnSiteSave = document.querySelector("#site_save");
                                    if (btnSiteSave) {
                                        cliquerPur(btnSiteSave);
                                        await attendreFinSauvegarde();
                                        await attendreDisparitionPopup();
                                    }
                                    
                                    if (site["activé"] === false || String(site["activé"]).toLowerCase() === "false") {
                                        await attendrePause(300); 
                                        let lignesTableau = document.querySelectorAll("#content_template_container > div:nth-child(5) > table > tbody > tr");
                                        let toggleTrouve = false;
                                        for (let ligne of lignesTableau) {
                                            if (ligne.innerText.includes(nomVPNConforme)) {
                                                let btnToggle = ligne.querySelector("td:nth-child(1) > div > div > div");
                                                if (btnToggle) { cliquerPur(btnToggle); await attendreFinSauvegarde(); toggleTrouve = true; break; }
                                            }
                                        }
                                        if (!toggleTrouve) {
                                            let btnToggleFallback = document.querySelector("#content_template_container > div:nth-child(5) > table > tbody > tr:nth-child(1) > td:nth-child(1) > div > div > div");
                                            if (btnToggleFallback) { cliquerPur(btnToggleFallback); await attendreFinSauvegarde(); }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    await retournerAccueil();
                }
            }
        }
    }
`;