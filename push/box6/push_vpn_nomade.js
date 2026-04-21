/* --- /push/box6/push_vpn_nomade.js --- */

window.executerVpnNomade = async function() {
    console.log("⏳ Application des paramètres VPN Nomade (Fix UI + Avancés Parfaits)...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.vpn || !configurationActuelle.vpn.nomade) {
        console.warn("⚠️ Pas de données VPN Nomade trouvées à appliquer."); return;
    }

    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(1000); 
    }

    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1500); 
        
        let selecteurVraiWidget = ".swiper-slide-active #internetVPNAnkaa, .swiper-slide-active .internetVPNAnkaa";
        let tuileVpn = document.querySelector(selecteurVraiWidget);
        if (!tuileVpn) tuileVpn = await window.attendreElement("#internetVPNAnkaa", 10000);

        if (tuileVpn) {
            tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500); 
            window.cliquerBouton(tuileVpn.querySelector(".widget") || tuileVpn);
            
            let titre = await window.attendreElement("#internetVPNAnkaaTitle", 5000);
            if (titre) {
                await window.attendrePause(500); 
                window.cliquerBouton(titre);
            }

            await window.attendrePause(1000); 

            let vpnNomade = configurationActuelle.vpn.nomade;
            let comptes = vpnNomade.comptes || [];
            let maxComptes = Math.min(comptes.length, 4); 

            console.log("📝 " + maxComptes + " compte(s) VPN à configurer.");

            /* =================================================================================== */
            /* 1. GESTION DES COMPTES (Création et État)                                           */
            /* =================================================================================== */
            for (let i = 0; i < maxComptes; i++) {
                let compte = comptes[i];
                console.log("⏳ Création du compte (" + (i + 1) + "/" + maxComptes + ") : " + compte["nom de l'utilisateur"]);

                let btnAjout = await window.attendreElement("a[data-translation='internetVPNAnkaa.label.add']", 10000);

                if (btnAjout) {
                    btnAjout.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await window.attendrePause(500);
                    
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnAjout);
                    else btnAjout.click();
                    
                    let popup = await window.attendreElement("#user_popup", 5000);
                    if (popup) {
                        await window.attendrePause(1000); 

                        let typeVpnVoulu = compte["type VPN"];
                        if (typeVpnVoulu) {
                            let selectType = popup.querySelector("select");
                            if (selectType) {
                                let cible = typeVpnVoulu.toLowerCase().trim();
                                let valeurCible = "Wireguard"; 
                                if (cible.includes("l2tp") || cible.includes("ipsec")) valeurCible = "L2TYPE";
                                else if (cible.includes("wireguard") || cible.includes("wg")) valeurCible = "Wireguard";

                                if (selectType.value !== valeurCible) {
                                    selectType.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                    selectType.focus();
                                    selectType.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    await window.attendrePause(300);

                                    selectType.value = valeurCible;
                                    Array.from(selectType.options).forEach(opt => { opt.selected = (opt.value === valeurCible); });

                                    selectType.dispatchEvent(new Event('input', { bubbles: true }));
                                    selectType.dispatchEvent(new Event('change', { bubbles: true }));

                                    selectType.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    selectType.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    selectType.blur();

                                    await window.attendrePause(2000);
                                }
                            }
                        }

                        const remplirEtValider = async (selecteur, valeur) => {
                            let champ = document.querySelector(selecteur);
                            if (champ && champ.offsetParent !== null) {
                                champ.focus();
                                champ.value = valeur;
                                champ.dispatchEvent(new Event('input', { bubbles: true }));
                                champ.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
                                champ.dispatchEvent(new Event('change', { bubbles: true }));
                                champ.blur();
                                await window.attendrePause(300);
                            }
                        };

                        if (compte["nom de l'utilisateur"]) await remplirEtValider("#user_name", compte["nom de l'utilisateur"]);
                        if (compte["mot de passe de l'utilisateur"]) {
                            await remplirEtValider("#password", compte["mot de passe de l'utilisateur"]);
                            let confirmInput = document.querySelector("#password_confirm");
                            if (confirmInput && confirmInput.offsetParent !== null) {
                                await remplirEtValider("#password_confirm", compte["mot de passe de l'utilisateur"]);
                            }
                        }
                        
                        await window.attendrePause(800);
                        
                        let btnSave = popup.querySelector("#changepwd_save");
                        if (btnSave && btnSave.offsetParent !== null) {
                            
                            await new Promise((resolve) => {
                                let checks = 0;
                                let intv = setInterval(() => {
                                    if (btnSave.getAttribute("aria-disabled") !== "true" || checks > 15) {
                                        clearInterval(intv); resolve();
                                    }
                                    checks++;
                                }, 200);
                            });

                            console.log("💾 Clic sur Enregistrer...");
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                            else btnSave.click();
                            
                            await window.attendrePause(1000); 

                            console.log("⏳ Attente de l'apparition du chargement...");
                            await new Promise((resolve) => {
                                let start = Date.now();
                                let intv = setInterval(() => {
                                    let loading = document.querySelector("body > div.loading_screen");
                                    if ((loading && window.getComputedStyle(loading).display !== "none") || (Date.now() - start > 3000)) {
                                        clearInterval(intv); resolve();
                                    }
                                }, 100);
                            });

                            console.log("⏳ Sauvegarde en cours... Ne touchez à rien.");
                            await new Promise((resolve) => {
                                let intv = setInterval(() => {
                                    let loading = document.querySelector("body > div.loading_screen");
                                    if (!loading || window.getComputedStyle(loading).display === "none") {
                                        clearInterval(intv); resolve();
                                    }
                                }, 500);
                                setTimeout(() => { clearInterval(intv); resolve(); }, 30000);
                            });
                            
                            console.log("✅ Compte " + (i + 1) + " enregistré avec succès !");

                            /* ==================================================================== */
                            /* 4. GESTION DE L'ÉTAT DANS LE TABLEAU APRÈS SAUVEGARDE                */
                            /* ==================================================================== */
                            let etatVoulu = compte["état de l'utilisateur"] ? compte["état de l'utilisateur"].toLowerCase() : "activé";
                            let veutEtreActive = (etatVoulu === "activé" || etatVoulu === "true" || etatVoulu === "active");
                            
                            console.log("🔍 Vérification de l'état (Voulu : " + (veutEtreActive ? "ON" : "OFF") + ")...");
                            await window.attendrePause(1000); 

                            let lignesTableau = document.querySelectorAll("tr.conf-table-ractive-row, table tbody tr");
                            let nomCompteRecherche = compte["nom de l'utilisateur"].toLowerCase().trim();
                            let ligneTrouvee = null;

                            for (let ligne of lignesTableau) {
                                if ((ligne.innerText || "").toLowerCase().includes(nomCompteRecherche)) {
                                    ligneTrouvee = ligne;
                                    break;
                                }
                            }

                            if (ligneTrouvee) {
                                let btnToggle = ligneTrouvee.querySelector(".conf-table-ractive-checkbox-image, td:nth-child(1) div");
                                let wrapperToggle = ligneTrouvee.querySelector(".conf-table-ractive-checkbox-container");
                                
                                if (btnToggle) {
                                    let htmlCellule = (wrapperToggle ? wrapperToggle.innerHTML : ligneTrouvee.innerHTML).toLowerCase();
                                    let classeWrapper = wrapperToggle ? wrapperToggle.className.toLowerCase() : "";
                                    
                                    let estActuellementActive = false;
                                    let inpCheck = ligneTrouvee.querySelector("input[type='checkbox']");
                                    
                                    if (inpCheck) {
                                        estActuellementActive = inpCheck.checked;
                                    } else {
                                        estActuellementActive = htmlCellule.includes("checked") || classeWrapper.includes("checked") || htmlCellule.includes("switch_on");
                                    }

                                    if (estActuellementActive !== veutEtreActive) {
                                        console.log("👉 Basculement de l'état pour " + compte["nom de l'utilisateur"] + "...");
                                        btnToggle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        await window.attendrePause(500);

                                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnToggle);
                                        else btnToggle.click();

                                        console.log("⏳ Attente de l'apparition du chargement (changement d'état)...");
                                        await new Promise((resolve) => {
                                            let start = Date.now();
                                            let intv = setInterval(() => {
                                                let loading = document.querySelector("body > div.loading_screen");
                                                if ((loading && window.getComputedStyle(loading).display !== "none") || (Date.now() - start > 3000)) {
                                                    clearInterval(intv); resolve();
                                                }
                                            }, 100);
                                        });

                                        console.log("⏳ Sauvegarde de l'état en cours...");
                                        await new Promise((resolve) => {
                                            let intv = setInterval(() => {
                                                let loading = document.querySelector("body > div.loading_screen");
                                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                                    clearInterval(intv); resolve();
                                                }
                                            }, 500);
                                            setTimeout(() => { clearInterval(intv); resolve(); }, 30000);
                                        });
                                        console.log("✅ État mis à jour !");
                                    } else {
                                        console.log("✅ L'état est déjà correct.");
                                    }
                                }
                            } else {
                                console.warn("⚠️ Impossible de retrouver la ligne du compte dans le tableau.");
                            }

                            console.log("⏳ Stabilisation de l'interface (3s)...");
                            await window.attendrePause(3000); 
                            
                        }
                    }
                } else {
                    console.error("❌ Bouton 'Ajouter' introuvable après 10s d'attente. Fin de la boucle.");
                    break;
                }
            }
            console.log("🎉 Tous les comptes VPN ont été créés !");

            /* =================================================================================== */
            /* 5. PARAMÈTRES AVANCÉS DU L2TP/IPSEC (AVEC FIX CLASSE .vpn-label ET SANS BUG DE CLIC)*/
            /* =================================================================================== */
            console.log("⚙️ Ouverture des paramètres avancés...");

            let lienAvance = await window.attendreElement("a[data-translation='internetVPNAnkaa.showSettings']", 3000);
            if (lienAvance) {
                lienAvance.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await window.attendrePause(500);
                if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
                else lienAvance.click();
                await window.attendrePause(1500); 

                let paramsAvances = vpnNomade["parametres avancés"] || {};
                let ike1 = paramsAvances["IKE (phase 1)"] || {};
                let ike2 = paramsAvances["IKE (phase 2)"] || {};
                let modifs = false;

                /* --- A. CLÉ PARTAGÉE NOMADE --- */
                let clePartagee = (comptes.length > 0) ? comptes[0]["clé partagée nomade"] : null;
                if (!clePartagee) clePartagee = vpnNomade["clé partagée nomade"];

                if (clePartagee) {
                    console.log("👉 Saisie de la clé partagée...");
                    let inputCle = document.querySelector("#content_template_container > div.ipsec_groupe > div.row.text-field-row > div.col-xs-5.text-field-input > input");
                    if (!inputCle) inputCle = document.querySelector(".ipsec_groupe input.text-field");

                    if (inputCle) {
                        inputCle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        inputCle.focus();
                        inputCle.value = clePartagee;
                        inputCle.dispatchEvent(new Event('input', { bubbles: true }));
                        inputCle.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
                        inputCle.dispatchEvent(new Event('change', { bubbles: true }));
                        inputCle.blur();
                        await window.attendrePause(500);
                        modifs = true;
                    }
                }

                /* --- LE TRADUCTEUR (DICTIONNAIRE BOX 6) --- */
                const mapValeurBox6 = (valeurBrute, type) => {
                    if (!valeurBrute) return null;
                    let v = String(valeurBrute).toLowerCase().replace(/[\s\-_]/g, '');
                    
                    if (type === "auth") {
                        if (v.includes("sha1")) return "HMAC-SHA1-96";
                        if (v.includes("sha256") || v.includes("sha2256")) return "HMAC-SHA2-256-128";
                        if (v.includes("sha384") || v.includes("sha2384")) return "HMAC-SHA2-384-192";
                        if (v.includes("sha512") || v.includes("sha2512")) return "HMAC-SHA2-512-256";
                        return "HMAC-SHA1-96"; 
                    }
                    if (type === "dh") {
                        if ((v.includes("2") && !v.includes("224") && !v.includes("256")) || v.includes("1024")) return "MODP-1024";
                        if (v === "5" || v.includes("groupe5") || v.includes("group5") || v.includes("1536")) return "MODP-1536";
                        if (v === "14" || v.includes("groupe14") || v.includes("group14") || v.includes("2048")) return "MODP-2048";
                        if (v === "15" || v.includes("groupe15") || v.includes("group15") || v.includes("3072")) return "MODP-3072";
                        if (v === "16" || v.includes("groupe16") || v.includes("group16") || v.includes("4096")) return "MODP-4096";
                        if (v === "17" || v.includes("groupe17") || v.includes("group17") || v.includes("6144")) return "MODP-6144";
                        if (v === "18" || v.includes("groupe18") || v.includes("group18") || v.includes("8192")) return "MODP-8192";
                        if (v === "19" || v.includes("groupe19") || v.includes("group19") || v.includes("ecp256")) return "ECP-256";
                        if (v === "20" || v.includes("groupe20") || v.includes("group20") || v.includes("ecp384")) return "ECP-384";
                        if (v === "21" || v.includes("groupe21") || v.includes("group21") || v.includes("ecp512")) return "ECP-512";
                        return null; 
                    }
                    if (type === "enc") {
                        if (v === "aes128" || v.includes("aes128cbc")) return "AES-128-CBC";
                        if (v === "aes256" || v.includes("aes256cbc")) return "AES-256-CBC";
                        if (v.includes("aes128gcm")) return "AES-128-GCM-16";
                        if (v.includes("aes256gcm")) return "AES-256-GCM-16";
                        if (v.includes("128")) return "AES-128-CBC";
                        if (v.includes("256")) return "AES-256-CBC";
                        return null;
                    }
                    return null;
                };

                const choisirDansPopup = async (lienClic, valeurVoulue, typeParam) => {
                    if (!lienClic || !valeurVoulue) return false;
                    lienClic.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await window.attendrePause(300);
                    if (typeof window.cliquerPur === "function") window.cliquerPur(lienClic);
                    else lienClic.click();

                    let popup = await window.attendreElement("#encryption_popup", 3000);
                    let trouve = false;
                    if (popup) {
                        await window.attendrePause(500);
                        let select = popup.querySelector("div.sah_dialog_body > div > select") || popup.querySelector("select");
                        if (select) {
                            let options = Array.from(select.options);
                            let valMappee = mapValeurBox6(valeurVoulue, typeParam);
                            
                            let optTrouvee = valMappee ? options.find(o => o.value === valMappee) : null;

                            if (!optTrouvee) {
                                let cible = valeurVoulue.toLowerCase().replace(/[^a-z0-9]/gi, '');
                                optTrouvee = options.find(opt => {
                                    let txt = (opt.text || "").toLowerCase().replace(/[^a-z0-9]/gi, '');
                                    let val = (opt.value || "").toLowerCase().replace(/[^a-z0-9]/gi, '');
                                    return txt === cible || val === cible || txt.includes(cible) || val.includes(cible);
                                });
                            }

                            if (optTrouvee) {
                                console.log(`👉 Option trouvée pour [${typeParam}] : ` + optTrouvee.value);
                                select.value = optTrouvee.value;
                                options.forEach(o => o.selected = (o.value === optTrouvee.value));
                                select.dispatchEvent(new Event('input', { bubbles: true }));
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                trouve = true;
                                await window.attendrePause(300);
                            } else {
                                console.warn(`⚠️ Option introuvable pour : ` + valeurVoulue);
                            }
                        }

                        let btnSave = popup.querySelector("#chooseEncryption_save");
                        if (btnSave) {
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                            else btnSave.click();

                            await new Promise((resolve) => {
                                let intv = setInterval(() => {
                                    let p = document.querySelector("#encryption_popup");
                                    if (!p || p.offsetParent === null || window.getComputedStyle(p).display === "none") {
                                        clearInterval(intv); resolve();
                                    }
                                }, 200);
                                setTimeout(() => { clearInterval(intv); resolve(); }, 5000);
                            });
                            await window.attendrePause(500);
                        }
                    }
                    return trouve;
                };

                /* --- 🌟 RECHERCHE HYBRIDE AMÉLIORÉE --- */
                const trouverLienPopup = (motCle1, motCle2, index) => {
                    let labels = document.querySelectorAll("span.vpn-label");
                    let matchs = [];
                    for (let l of labels) {
                        let txt = (l.innerText || "").toLowerCase();
                        let tr = (l.getAttribute("data-translation") || "").toLowerCase();
                        
                        if (txt.includes(motCle1) || tr.includes(motCle1) || (motCle2 && (txt.includes(motCle2) || tr.includes(motCle2)))) {
                            matchs.push(l);
                        }
                    }
                    if (matchs.length > index) {
                        let wrapper = matchs[index].closest(".info_group_container");
                        if (wrapper) return wrapper.querySelector("a.vpn-algo-list");
                    }
                    return null;
                };

                const remplirSession = async (index, valeur) => {
                    if (!valeur) return false;
                    let res = [];
                    let allLabels = document.querySelectorAll("span.vpn-label"); 
                    for (let lbl of allLabels) {
                        let txt = (lbl.innerText || "").toLowerCase();
                        let tr = (lbl.getAttribute("data-translation") || "").toLowerCase();
                        if (txt.includes("session") || txt.includes("durée") || tr.includes("lifetime") || tr.includes("session")) {
                            let row = lbl.closest('.text-field-row, .row, .info_group_container');
                            if (row && !row.querySelector(".buttonGroup")) {
                                let inp = row.querySelector("input[type='text'], input[type='number']");
                                if (inp && inp.offsetParent !== null && !res.includes(inp)) res.push(inp);
                            }
                        }
                    }
                    let champ = res[index];
                    if (champ) {
                        champ.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await window.attendrePause(300);
                        champ.focus();
                        champ.value = valeur;
                        champ.dispatchEvent(new Event('input', { bubbles: true }));
                        champ.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
                        champ.dispatchEvent(new Event('change', { bubbles: true }));
                        champ.blur();
                        await window.attendrePause(500);
                        return true;
                    }
                    return false;
                };

                /* ================= PHASE 1 ================= */
                console.log("👉 Configuration IKE Phase 1...");
                let auth1 = ike1["authentification"];
                if (auth1 && await choisirDansPopup(trouverLienPopup("auth", "authentication", 0), auth1, "auth")) modifs = true;

                /* 🔥 FORCÉ À AES-128-CBC COMME DEMANDÉ PAR L'UTILISATEUR 🔥 */
                let chiff1 = "AES-128-CBC"; 
                if (await choisirDansPopup(trouverLienPopup("chiffrement", "encryption", 0), chiff1, "enc")) modifs = true;

                let dh1 = ike1["groupe Diffie Hellman"] || ike1["groupe diffie hellman"];
                if (dh1 && await choisirDansPopup(trouverLienPopup("diffie", "groupedh", 0), dh1, "dh")) modifs = true;

                let session1 = ike1["durée de session (en sec)"] || ike1["durée de session"];
                if (session1 && await remplirSession(0, session1)) modifs = true;

                /* ================= PHASE 2 ================= */
                console.log("👉 Configuration IKE Phase 2...");
                let auth2 = ike2["authentification"];
                if (auth2 && await choisirDansPopup(trouverLienPopup("auth", "authentication", 1), auth2, "auth")) modifs = true;

                let chiff2 = ike2["chiffrement"];
                if (chiff2 && await choisirDansPopup(trouverLienPopup("chiffrement", "encryption", 1), chiff2, "enc")) modifs = true;

                /* GROUPE PFS */
                let dh2 = ike2["groupe PFS"] || ike2["groupe pfs"];
                if (dh2) {
                    let lienPFS = trouverLienPopup("pfs", "pfs", 0);
                    if (!lienPFS) lienPFS = trouverLienPopup("diffie", "groupedh", 1); /* Fallback */
                    
                    if (lienPFS && await choisirDansPopup(lienPFS, dh2, "dh")) modifs = true;
                }

                let session2 = ike2["durée de session (en sec)"] || ike2["durée de session"];
                if (session2 && await remplirSession(1, session2)) modifs = true;

                /* --- SAUVEGARDE GLOBALE --- */
                if (modifs) {
                    let btnSaveGlobal = document.querySelectorAll("input[data-translation='common.save'], input[value='Enregistrer']");
                    let saveGlobal = Array.from(btnSaveGlobal).reverse().find(b => b.offsetParent !== null && b.id !== "chooseEncryption_save" && b.id !== "changepwd_save");
                    
                    if (saveGlobal) {
                        console.log("💾 Sauvegarde finale des paramètres avancés...");
                        if (typeof window.cliquerPur === "function") window.cliquerPur(saveGlobal);
                        else saveGlobal.click();
                        
                        await window.attendrePause(1000);
                        await new Promise((resolve) => {
                            let intv = setInterval(() => {
                                let loading = document.querySelector("body > div.loading_screen");
                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                    clearInterval(intv); resolve();
                                }
                            }, 500);
                            setTimeout(() => { clearInterval(intv); resolve(); }, 15000);
                        });
                    }
                }
            }
        }
    }
    
    console.log("🔄 Configuration terminée, retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000); 
    }
};