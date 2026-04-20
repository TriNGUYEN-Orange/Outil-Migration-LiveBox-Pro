const CODE_PUSH_VPN = `
    /* --- ÉTAPE : CONFIGURATION DU VPN NOMADE --- */
    console.log("⏳ Application des paramètres VPN...");

    if (configLivebox && configLivebox.vpn && configLivebox.vpn.nomade) {
        
        await retournerAccueil();
        await attendrePause(500); 
        
        let btnAvance = await attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            cliquerBouton("#sah_footer .icon-advanced");
            
            console.log("⏳ Chargement des modules avancés...");
            await attendrePause(1500); 
            
            let tuileVpn = await attendreElement("#internetVPNAnkaa", 10000);
            if (tuileVpn) {
                tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await attendrePause(500); 
                
                cliquerBouton("#internetVPNAnkaa .widget");
                
                let titre = await attendreElement("#internetVPNAnkaaTitle", 5000);
                if (titre) {
                    await attendrePause(500); 
                    cliquerBouton(titre);
                }

                const trouverTousLesConteneursParLabel = (texteCible, dataTrans) => {
                    let labels = document.querySelectorAll(".vpn-label");
                    let resultats = [];
                    for (let lbl of labels) {
                        let txt = (lbl.innerText || "").toLowerCase();
                        let tr = (lbl.getAttribute("data-translation") || "").toLowerCase();
                        
                        if (txt.includes(texteCible.toLowerCase().trim()) || (dataTrans && tr.includes(dataTrans.toLowerCase()))) {
                            if (lbl.parentElement && !resultats.includes(lbl.parentElement)) {
                                resultats.push(lbl.parentElement);
                            }
                        }
                    }
                    return resultats;
                };

                /* --- FONCTION CLASSIQUE POUR DH --- */
                const selectionnerDansListeExact = async (btnList, valeurVoulue) => {
                    if (!valeurVoulue || !btnList) return false;
                    btnList.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    btnList.click(); 
                    
                    let selectElement = await attendreElement("#encryption_popup select, .sah_dialog select", 3000);
                    let trouve = false;
                    
                    if (selectElement) {
                        let options = selectElement.querySelectorAll("option");
                        let cible = String(valeurVoulue).toLowerCase().trim();
                        for (let opt of options) {
                            if (opt.innerText && opt.innerText.trim().toLowerCase() === cible) {
                                for (let o of options) o.selected = false;
                                opt.selected = true;
                                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                                trouve = true;
                                break;
                            }
                        }
                    }
                    
                    /* 🚨 FIX POPUP : S'assurer de cliquer uniquement sur le bouton de SAUVEGARDE visible (et non Annuler) */
                    let popup = document.querySelector("#encryption_popup, .sah_dialog");
                    if (popup) {
                        let btns = popup.querySelectorAll("#chooseEncryption_save, input[data-translation='common.save'], button[data-translation='common.save'], input[value='Enregistrer'], button[value='Enregistrer']");
                        let btnSaveList = Array.from(btns).find(b => b.offsetParent !== null);
                        if (btnSaveList) { 
                            btnSaveList.click(); 
                            await attendreDisparitionPopup(); 
                            await attendrePause(300); /* ⚡ Attendre la stabilisation du DOM après fermeture */
                        }
                    }
                    return trouve;
                };

                /* --- FONCTION NETTOYÉE POUR AUTH ET CHIFFREMENT --- */
                const selectionnerDansListeNettoye = async (btnList, valeurVoulue) => {
                    if (!valeurVoulue || !btnList) return false;
                    btnList.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    btnList.click(); 
                    
                    let selectElement = await attendreElement("#encryption_popup select, .sah_dialog select", 3000);
                    let trouve = false;
                    
                    if (selectElement) {
                        let options = selectElement.querySelectorAll("option");
                        let cibleBase = String(valeurVoulue).toLowerCase().trim();
                        let cleanCible = cibleBase.replace(/[^a-z0-9]/gi, '');
                        
                        const mapTraduction = {
                            "aes128": "aes128cbc", "aes192": "aes192cbc", "aes256": "aes256cbc",
                            "3des": "3descbc", "des": "descbc", "blowfish": "blowfishcbc",
                            "sha1": "sha1", "sha256": "sha2256", "sha384": "sha2384", "sha512": "sha2512"
                        };
                        if (mapTraduction[cleanCible]) cleanCible = mapTraduction[cleanCible];

                        for (let opt of options) {
                            let cleanOptText = (opt.innerText || "").replace(/[^a-z0-9]/gi, '').toLowerCase();
                            if (cleanOptText === cleanCible || cleanOptText.includes(cleanCible)) {
                                for (let o of options) o.selected = false;
                                opt.selected = true;
                                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                                trouve = true;
                                break;
                            }
                        }

                        if (!trouve) {
                            let valeurSecours = cibleBase.includes("sha") || cibleBase.includes("md5") ? "sha1" : "aes128cbc";
                            for (let opt of options) {
                                let cleanOptText = (opt.innerText || "").replace(/[^a-z0-9]/gi, '').toLowerCase();
                                if (cleanOptText === valeurSecours) {
                                    for (let o of options) o.selected = false;
                                    opt.selected = true;
                                    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                                    trouve = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    /* 🚨 FIX POPUP : Clic sécurisé sur Enregistrer */
                    let popup = document.querySelector("#encryption_popup, .sah_dialog");
                    if (popup) {
                        let btns = popup.querySelectorAll("#chooseEncryption_save, input[data-translation='common.save'], button[data-translation='common.save'], input[value='Enregistrer'], button[value='Enregistrer']");
                        let btnSaveList = Array.from(btns).find(b => b.offsetParent !== null);
                        if (btnSaveList) { 
                            btnSaveList.click(); 
                            await attendreDisparitionPopup(); 
                            await attendrePause(300); /* ⚡ Attendre la stabilisation du DOM */
                        }
                    }
                    return trouve;
                };

                await attendreFinSauvegarde();
                await attendreDisparitionPopup();
                
                /* =================================================================================== */
                /* GESTION DES COMPTES                                                                 */
                /* =================================================================================== */
                let vpnNomade = configLivebox.vpn.nomade;
                let comptes = vpnNomade.comptes || [];
                let maxComptes = Math.min(comptes.length, 4); 
                
                for (let i = 0; i < maxComptes; i++) {
                    let compte = comptes[i];
                    
                    let btnAjout = await attendreElement("a[data-translation='internetVPNAnkaa.label.addAnkaa']", 5000);
                    if (btnAjout) {
                        btnAjout.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        btnAjout.click();
                        
                        let popup = await attendreElement("#user_popup", 3000);
                        if (popup) {
                            if (compte["nom de l'utilisateur"]) ecrireTexteDansDoc(document, "#user_name", compte["nom de l'utilisateur"]);
                            if (compte["mot de passe de l'utilisateur"]) {
                                ecrireTexteDansDoc(document, "#password", compte["mot de passe de l'utilisateur"]);
                                ecrireTexteDansDoc(document, "#password_confirm", compte["mot de passe de l'utilisateur"]);
                            }
                            
                            let btnSave = document.querySelector("#changepwd_save");
                            if (btnSave) {
                                btnSave.click();
                                await attendreFinSauvegarde();
                                await attendreDisparitionPopup();
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
                                            await attendreFinSauvegarde(); 
                                        }
                                    }
                                    break; 
                                }
                            }
                        }
                    }
                }
                
                /* =================================================================================== */
                /* PARAMÈTRES AVANCÉS SÉCURISÉS                                                        */
                /* =================================================================================== */
                
                await attendrePause(1000); 
                
                let lienAvance = await attendreElement("a[data-translation='internetVPNAnkaa.showSettingsAnkaa']", 3000);
                
                if (lienAvance) {
                    lienAvance.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await attendrePause(300);
                    lienAvance.click(); 
                    
                    let champCle = null;
                    await new Promise((resolve) => {
                        let intv = setInterval(() => {
                            let groupe = document.querySelector(".ipsec_groupe .buttonGroup");
                            if (groupe) {
                                let conteneurParent = groupe.closest(".ipsec_groupe");
                                if (conteneurParent) {
                                    let inp = conteneurParent.querySelector("input.text-field");
                                    if (inp && inp.offsetParent !== null) {
                                        champCle = inp;
                                        clearInterval(intv); resolve(); return;
                                    }
                                }
                            }
                            
                            let fallback = document.querySelector(".ipsec_groupe input.text-field");
                            if (fallback && fallback.offsetParent !== null) {
                                champCle = fallback;
                                clearInterval(intv); resolve(); return;
                            }
                        }, 200);
                        setTimeout(() => { clearInterval(intv); resolve(); }, 4000);
                    });

                    let paramsAvances = vpnNomade["parametres avancés"] || {};
                    let ike1 = paramsAvances["IKE (phase 1)"] || {};
                    let ike2 = paramsAvances["IKE (phase 2)"] || {};
                    let modifs = false;

                    if (champCle) {
                        await attendrePause(500);
                        let clePartagee = null;
                        if (comptes && comptes.length > 0) {
                            clePartagee = comptes[0]["clé partagée nomade"] || comptes[0]["clé partagée"] || comptes[0]["clé"];
                        }
                        if (!clePartagee) {
                            clePartagee = vpnNomade["clé partagée nomade"] || vpnNomade["clé partagée"] || trouverValeurJSON(vpnNomade, "clé partagée") || trouverValeurJSON(vpnNomade, "clé");
                        }
                        
                        if (clePartagee) {
                            champCle.focus(); 
                            champCle.value = clePartagee;
                            champCle.dispatchEvent(new Event('input', { bubbles: true }));
                            champCle.dispatchEvent(new Event('change', { bubbles: true }));
                            champCle.blur();
                            
                            /* 🚨 FIX: Ne JAMAIS cliquer à côté du champ clé (risque de générer une clé aléatoire). */
                            document.body.click(); 
                            
                            modifs = true;
                        }
                    }
                    
                    /* 🚨 GETTERS "JUST-IN-TIME" : Toujours récupérer les éléments réels pour éviter les "Stale Elements" */
                    const getAuth = (idx) => { let l = trouverTousLesConteneursParLabel("authentification", "authentication"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };
                    const getDH = (idx) => { let l = trouverTousLesConteneursParLabel("diffie", "dhgroup"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };
                    const getPFS = (idx) => { let l = trouverTousLesConteneursParLabel("pfs", "pfs"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };
                    const getEnc = (idx) => { let l = trouverTousLesConteneursParLabel("chiffrement", "encryption"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };

                    /* 🚨 FIX: Isolation absolue des champs "Durée de session" (Exclut formellement le mot de passe) */
                    const getSession = (idx) => {
                        let res = [];
                        let allLabels = document.querySelectorAll(".vpn-label, .text-field-label, span[data-translation]");
                        for (let lbl of allLabels) {
                            let txt = (lbl.innerText || "").toLowerCase();
                            let tr = (lbl.getAttribute("data-translation") || "").toLowerCase();
                            if (txt.includes("session") || txt.includes("durée") || tr.includes("lifetime") || tr.includes("session")) {
                                let row = lbl.closest('.text-field-row, .row, .info_group_container');
                                if (row) {
                                    /* EXCLUSION DU CHAMP MOT DE PASSE (S'il contient le bouton Générer, c'est la clé !) */
                                    if (row.querySelector(".buttonGroup")) continue;
                                    
                                    let inp = row.querySelector("input[type='text'], input[type='number']");
                                    if (inp && inp.offsetParent !== null && !res.includes(inp)) {
                                        res.push(inp);
                                    }
                                }
                            }
                        }
                        return res[idx] || null;
                    };
                    
                    /* -- APPLICATION IKE 1 -- */
                    let auth1 = ike1["authentification"] || trouverValeurJSON(vpnNomade, "authentification");
                    if (auth1) {
                        let btn = getAuth(0);
                        if (btn && await selectionnerDansListeNettoye(btn, auth1)) modifs = true;
                    }

                    let dh1 = ike1["groupe diffie hellman"] || trouverValeurJSON(vpnNomade, "groupe diffie hellman");
                    if (dh1) {
                        let btn = getDH(0);
                        if (btn && await selectionnerDansListeExact(btn, dh1)) modifs = true;
                    }

                    let session1 = ike1["durée de session (en sec)"] || trouverValeurJSON(vpnNomade, "durée de session");
                    if (session1) {
                        let champ = getSession(0);
                        if (champ) {
                            champ.focus(); champ.value = session1;
                            champ.dispatchEvent(new Event('input', { bubbles: true })); 
                            champ.dispatchEvent(new Event('change', { bubbles: true }));
                            champ.blur();
                            modifs = true;
                        }
                    }
                    
                    let chiffrement1 = ike1["chiffrement"] || trouverValeurJSON(vpnNomade, "chiffrement");
                    if (chiffrement1) {
                        let btn = getEnc(0);
                        if (btn && await selectionnerDansListeNettoye(btn, chiffrement1)) modifs = true;
                    }

                    /* -- APPLICATION IKE 2 -- */
                    let auth2 = ike2["authentification"];
                    if (auth2) {
                        let btn = getAuth(1);
                        if (btn && await selectionnerDansListeNettoye(btn, auth2)) modifs = true;
                    }

                    let pfsGroup = ike2["groupe PFS"] || ike2["groupe pfs"];
                    if (pfsGroup) {
                        let btn = getPFS(0);
                        if (btn && await selectionnerDansListeExact(btn, pfsGroup)) modifs = true;
                    }

                    let session2 = ike2["durée de session (en sec)"];
                    if (session2) {
                        let champ = getSession(1);
                        if (champ) {
                            champ.focus(); champ.value = session2;
                            champ.dispatchEvent(new Event('input', { bubbles: true })); 
                            champ.dispatchEvent(new Event('change', { bubbles: true }));
                            champ.blur();
                            modifs = true;
                        }
                    }
                    
                    let chiffrement2 = ike2["chiffrement"];
                    if (chiffrement2) {
                        let btn = getEnc(1);
                        if (btn && await selectionnerDansListeNettoye(btn, chiffrement2)) modifs = true;
                    }

                    /* Enregistrement si modifications effectuées */
                    if (modifs) {
                        let tousLesBoutonsSave = document.querySelectorAll("input[data-translation='common.save'], input[value='Enregistrer']");
                        /* 🚨 FIX: S'assurer de cliquer sur un bouton de sauvegarde VISIBLE sur la page principale */
                        let btnSaveAvance = Array.from(tousLesBoutonsSave).reverse().find(btn => btn.offsetParent !== null);
                        
                        if (btnSaveAvance) {
                            btnSaveAvance.click();
                            await attendreFinSauvegarde();
                            await attendreDisparitionPopup();
                        }
                    }
                }
            }
        }
        
        console.log("🔄 Configuration terminée, retour à l'accueil...");
        await retournerAccueil();
    }
`;