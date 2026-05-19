/* --- /push/box7/push_vpn_avance.js --- */

window.executerVpnNomadeAvance = async function() {
    console.log("⏳ [VPN Avancé] Initialisation du module...");

    let configJSON = localStorage.getItem("livebox_migration_config");
    if (!configJSON) return;
    let configLivebox = JSON.parse(configJSON);

    if (!configLivebox || !configLivebox.vpn || !configLivebox.vpn.nomade) {
        console.warn("⚠️ [VPN Avancé] IGNORÉ : Aucune configuration trouvée.");
        return;
    }

    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1500); 
        
        let tuileVpn = await window.attendreElement("#internetVPNAnkaa, #internetVPN", 10000);
        if (tuileVpn) {
            tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500); 
            
            let widget = tuileVpn.querySelector(".widget") || tuileVpn;
            window.cliquerPur(widget);
            widget.click();
            
            let titre = await window.attendreElement("#internetVPNAnkaaTitle, #internetVPNTitle", 5000);
            if (titre) {
                await window.attendrePause(500); 
                window.cliquerBouton(titre);
            }

            /* =================================================================================== */
            /* FONCTIONS OUTILS                                                                    */
            /* =================================================================================== */
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

            const selectionnerDansListeExact = async (btnList, valeurVoulue) => {
                if (!valeurVoulue || !btnList) return false;
                btnList.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.cliquerPur(btnList);
                btnList.click(); 
                
                let selectElement = await window.attendreElement("#encryption_popup select, .sah_dialog select", 3000);
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
                
                let popup = document.querySelector("#encryption_popup, .sah_dialog");
                if (popup) {
                    let btns = popup.querySelectorAll("#chooseEncryption_save, input[data-translation='common.save'], button[data-translation='common.save'], input[value='Enregistrer'], button[value='Enregistrer']");
                    let btnSaveList = Array.from(btns).find(b => b.offsetParent !== null);
                    if (btnSaveList) { 
                        window.cliquerPur(btnSaveList);
                        btnSaveList.click(); 
                        await window.attendreDisparitionPopup(); 
                        await window.attendrePause(300); 
                    }
                }
                return trouve;
            };

            const selectionnerDansListeNettoye = async (btnList, valeurVoulue) => {
                if (!valeurVoulue || !btnList) return false;
                btnList.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.cliquerPur(btnList);
                btnList.click(); 
                
                let selectElement = await window.attendreElement("#encryption_popup select, .sah_dialog select", 3000);
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
                
                let popup = document.querySelector("#encryption_popup, .sah_dialog");
                if (popup) {
                    let btns = popup.querySelectorAll("#chooseEncryption_save, input[data-translation='common.save'], button[data-translation='common.save'], input[value='Enregistrer'], button[value='Enregistrer']");
                    let btnSaveList = Array.from(btns).find(b => b.offsetParent !== null);
                    if (btnSaveList) { 
                        window.cliquerPur(btnSaveList);
                        btnSaveList.click(); 
                        await window.attendreDisparitionPopup(); 
                        await window.attendrePause(300); 
                    }
                }
                return trouve;
            };

            let vpnNomade = configLivebox.vpn.nomade;
            let comptes = vpnNomade.comptes || [];

            await window.attendrePause(1000); 
            
            /* 🚨 FIX BOX 7 : Vérifier si le panneau est déjà ouvert (hideSettings) ou s'il faut l'ouvrir (showSettings) */
            let panneauOuvert = document.querySelector("a[data-translation='internetVPNAnkaa.hideSettingsAnkaa'], a[data-translation='internetVPNAnkaa.hideSettings']");
            
            if (!panneauOuvert) {
                let lienAvance = await window.attendreElement("a[data-translation='internetVPNAnkaa.showSettingsAnkaa'], a[data-translation='internetVPNAnkaa.showSettings']", 3000);
                
                if (lienAvance) {
                    lienAvance.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await window.attendrePause(300);
                    window.cliquerPur(lienAvance);
                    lienAvance.click(); 
                    await window.attendrePause(1000);
                } else {
                    console.error("❌ [VPN Avancé] ERREUR : Bouton 'Paramètres avancés' VPN introuvable.");
                    return;
                }
            } else {
                console.log("👉 Panneau des paramètres avancés déjà ouvert.");
            }
            
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
                await window.attendrePause(500);
                let clePartagee = null;
                if (comptes && comptes.length > 0) {
                    clePartagee = comptes[0]["clé partagée nomade"] || comptes[0]["clé partagée"] || comptes[0]["clé"];
                }
                if (!clePartagee) {
                    clePartagee = vpnNomade["clé partagée nomade"] || vpnNomade["clé partagée"] || window.trouverValeurJSON(vpnNomade, "clé partagée") || window.trouverValeurJSON(vpnNomade, "clé");
                }
                
                if (clePartagee) {
                    champCle.focus(); 
                    champCle.value = clePartagee;
                    champCle.dispatchEvent(new Event('input', { bubbles: true }));
                    champCle.dispatchEvent(new Event('change', { bubbles: true }));
                    champCle.blur();
                    document.body.click(); 
                    modifs = true;
                }
            }
            
            const getAuth = (idx) => { let l = trouverTousLesConteneursParLabel("authentification", "authentication"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };
            const getDH = (idx) => { let l = trouverTousLesConteneursParLabel("diffie", "dhgroup"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };
            const getPFS = (idx) => { let l = trouverTousLesConteneursParLabel("pfs", "pfs"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };
            const getEnc = (idx) => { let l = trouverTousLesConteneursParLabel("chiffrement", "encryption"); return l[idx] ? l[idx].querySelector("a.vpn-algo-list") : null; };

            const getSession = (idx) => {
                let res = [];
                let allLabels = document.querySelectorAll(".vpn-label, .text-field-label, span[data-translation]");
                for (let lbl of allLabels) {
                    let txt = (lbl.innerText || "").toLowerCase();
                    let tr = (lbl.getAttribute("data-translation") || "").toLowerCase();
                    if (txt.includes("session") || txt.includes("durée") || tr.includes("lifetime") || tr.includes("session")) {
                        let row = lbl.closest('.text-field-row, .row, .info_group_container');
                        if (row) {
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
            
            let auth1 = ike1["authentification"] || window.trouverValeurJSON(vpnNomade, "authentification");
            if (auth1) {
                let btn = getAuth(0);
                if (btn && await selectionnerDansListeNettoye(btn, auth1)) modifs = true;
            }

            let dh1 = ike1["groupe diffie hellman"] || window.trouverValeurJSON(vpnNomade, "groupe diffie hellman");
            if (dh1) {
                let btn = getDH(0);
                if (btn && await selectionnerDansListeExact(btn, dh1)) modifs = true;
            }

            let session1 = ike1["durée de session (en sec)"] || window.trouverValeurJSON(vpnNomade, "durée de session");
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
            
            let chiffrement1 = ike1["chiffrement"] || window.trouverValeurJSON(vpnNomade, "chiffrement");
            if (chiffrement1) {
                let btn = getEnc(0);
                if (btn && await selectionnerDansListeNettoye(btn, chiffrement1)) modifs = true;
            }

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

            if (modifs) {
                let tousLesBoutonsSave = document.querySelectorAll("input[data-translation='common.save'], input[value='Enregistrer']");
                let btnSaveAvance = Array.from(tousLesBoutonsSave).reverse().find(btn => btn.offsetParent !== null);
                
                if (btnSaveAvance) {
                    window.cliquerPur(btnSaveAvance);
                    btnSaveAvance.click();
                    await window.attendreFinSauvegarde();
                    await window.attendreDisparitionPopup();
                }
            }
            
        } else {
            console.error("❌ [VPN Avancé] ERREUR : La tuile VPN est introuvable sur la page d'accueil.");
        }
    }
    
    console.log("🔄 [VPN Avancé] Fin du traitement, retour à l'accueil...");
    await window.retournerAccueil();
};