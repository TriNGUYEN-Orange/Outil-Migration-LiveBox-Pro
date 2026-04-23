/* --- /push/box6/push_vpn_nomade_avance.js --- */

window.executerVpnNomadeAvance = async function() {
    console.log("⏳ Application des paramètres avancés VPN Nomade...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; }
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.vpn || !configurationActuelle.vpn.nomade) {
        console.warn("⚠️ Pas de données VPN Nomade trouvées à appliquer."); return;
    }

    let vpnNomade = configurationActuelle.vpn.nomade;
    let comptes = vpnNomade.comptes || [];
    let paramsAvances = vpnNomade["parametres avancés"] || {};
    let clePartagee = (comptes.length > 0) ? comptes[0]["clé partagée nomade"] : vpnNomade["clé partagée nomade"];

    if (Object.keys(paramsAvances).length === 0 && !clePartagee) {
        console.log("ℹ️ Aucun paramètre avancé ou clé partagée à configurer pour VPN Nomade.");
        return;
    }

    /* =================================================================================== */
    /* 🛡️ BOUCLIER ANTI-SCROLL (Empêche l'utilisateur de fermer les popups accidentellement) */
    /* =================================================================================== */
    const bloquerScroll = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener('wheel', bloquerScroll, { passive: false });
    window.addEventListener('touchmove', bloquerScroll, { passive: false });
    window.addEventListener('DOMMouseScroll', bloquerScroll, { passive: false });
    
    let oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; 
    
    const libererScroll = () => {
        window.removeEventListener('wheel', bloquerScroll);
        window.removeEventListener('touchmove', bloquerScroll);
        window.removeEventListener('DOMMouseScroll', bloquerScroll);
        document.body.style.overflow = oldOverflow;
    };

    try {
        /* Laisse le DOM se stabiliser après la création des utilisateurs */
        await window.attendrePause(1500); 

        /* =================================================================================== */
        /* 👁️ OUVERTURE INTELLIGENTE DU PANNEAU "PARAMÈTRES AVANCÉS"                           */
        /* =================================================================================== */
        const isPanneauAvanceOuvert = () => {
            let champCle = document.querySelector("#content_template_container > div.ipsec_groupe > div.row.text-field-row > div.col-xs-5.text-field-input > input")
                        || document.querySelector(".ipsec_groupe input.text-field");
            return champCle && champCle.offsetParent !== null; // true si visible
        };

        const trouverLienAvance = () => {
            let btn = document.querySelector("a[data-translation='internetVPNAnkaa.showSettings']");
            if (btn && btn.offsetParent !== null) return btn;
            for (let el of document.querySelectorAll("a, button, div, span")) {
                let txt = (el.innerText || "").toLowerCase().trim();
                if ((txt === "paramètres avancés" || txt === "avancé" || txt === "avancés") && el.offsetParent !== null)
                    return el;
            }
            return null;
        };

        if (!isPanneauAvanceOuvert()) {
            console.log("⚙️ Le panneau est fermé, recherche du bouton 'Paramètres avancés'...");
            let lienAvance = trouverLienAvance();

            if (!lienAvance) {
                console.log("🔄 Panneau VPN complètement fermé, tentative de réouverture...");
                let tuileVpn = document.querySelector(".swiper-slide-active #internetVPNAnkaa, .swiper-slide-active .internetVPNAnkaa")
                            || document.querySelector("#internetVPNAnkaa");
                if (tuileVpn) {
                    (tuileVpn.querySelector(".widget") || tuileVpn).click();
                    await window.attendrePause(2000);
                    lienAvance = trouverLienAvance();
                }
            }

            if (!lienAvance) {
                console.error("❌ CRITIQUE : Impossible de trouver 'Paramètres avancés'. Abandon.");
                return;
            }

            console.log("✅ Bouton 'Paramètres avancés' trouvé, clic pour ouvrir...");
            lienAvance.scrollIntoView({ behavior: 'instant', block: 'center' });
            await window.attendrePause(500);
            lienAvance.click();
            await window.attendrePause(2500);

            // Double vérification si ça a buggé et cliqué dans le vide
            if (!isPanneauAvanceOuvert()) {
                console.warn("⚠️ Le panneau ne s'est pas ouvert. Deuxième tentative...");
                lienAvance = trouverLienAvance();
                if (lienAvance) {
                    lienAvance.click();
                    await window.attendrePause(2500);
                }
            }
        } else {
            console.log("✅ Panneau 'Paramètres avancés' DÉJÀ OUVERT ! On passe directement à la saisie.");
        }

        /* =================================================================================== */
        /* FONCTIONS D'AIDE                                                                    */
        /* =================================================================================== */

        const mapValeurBox6 = (valeurBrute, type) => {
            if (!valeurBrute) return null;
            let v = String(valeurBrute).toLowerCase().replace(/[\s\-_]/g, '');
            if (type === "auth") {
                if (v.includes("sha1"))   return "HMAC-SHA1-96";
                if (v.includes("sha256") || v.includes("sha2256")) return "HMAC-SHA2-256-128";
                if (v.includes("sha384") || v.includes("sha2384")) return "HMAC-SHA2-384-192";
                if (v.includes("sha512") || v.includes("sha2512")) return "HMAC-SHA2-512-256";
                return "HMAC-SHA1-96";
            }
            if (type === "dh") {
                if ((v === "2" || v.includes("1024")) && !v.includes("2048")) return "MODP-1024";
                if (v === "5"  || v.includes("1536")) return "MODP-1536";
                if (v === "14" || v.includes("2048")) return "MODP-2048";
                if (v === "15" || v.includes("3072")) return "MODP-3072";
                if (v === "16" || v.includes("4096")) return "MODP-4096";
                return null;
            }
            if (type === "enc") {
                if (v.includes("aes128ccm8"))  return "AES-128-CCM-8";
                if (v.includes("aes128ccm12")) return "AES-128-CCM-12";
                if (v.includes("aes128ccm16")) return "AES-128-CCM-16";
                if (v.includes("aes128gcm8"))  return "AES-128-GCM-8";
                if (v.includes("aes128gcm12")) return "AES-128-GCM-12";
                if (v.includes("aes128gcm16") || (v.includes("aes128") && v.includes("gcm"))) return "AES-128-GCM-16";
                if (v.includes("aes256ccm8"))  return "AES-256-CCM-8";
                if (v.includes("aes256ccm12")) return "AES-256-CCM-12";
                if (v.includes("aes256ccm16")) return "AES-256-CCM-16";
                if (v.includes("aes256gcm8"))  return "AES-256-GCM-8";
                if (v.includes("aes256gcm12")) return "AES-256-GCM-12";
                if (v.includes("aes256gcm16") || (v.includes("aes256") && v.includes("gcm"))) return "AES-256-GCM-16";
                if (v.includes("aes128cbc") || v === "aes128") return "AES-128-CBC";
                if (v.includes("aes256cbc") || v === "aes256") return "AES-256-CBC";
                if (v.includes("128")) return "AES-128-CBC";
                if (v.includes("256")) return "AES-256-CBC";
                return null;
            }
            return null;
        };

        const trouverLienPopup = (motCles, index) => {
            let liens = [];
            for (let motCle of motCles) {
                let spans = document.querySelectorAll(`[data-translation*="${motCle}"]`);
                for (let sp of spans) {
                    if (sp.offsetParent === null) continue;
                    let wrapper = sp.closest(".info_group_container, .bodytxt");
                    if (!wrapper) continue;
                    let lien = wrapper.querySelector("a.vpn-algo-list, a.group_info");
                    if (lien && lien.offsetParent !== null && !liens.includes(lien)) liens.push(lien);
                }
            }
            if (liens.length <= index) {
                for (let lien of document.querySelectorAll("a.vpn-algo-list, a.group_info")) {
                    if (lien.offsetParent === null) continue;
                    let parent = lien.closest(".info_group_container, .bodytxt");
                    if (!parent) continue;
                    let labelEl = parent.querySelector("[data-translation], span.vpn-label, .col-xs-3");
                    let labelTxt = (labelEl?.innerText || "").toLowerCase();
                    for (let motCle of motCles) {
                        if (labelTxt.includes(motCle.toLowerCase()) && !liens.includes(lien)) {
                            liens.push(lien); break;
                        }
                    }
                }
            }
            return liens[index] || null;
        };

        const choisirDansPopup = async (fnTrouverLien, valeurVoulue, typeParam) => {
            if (!valeurVoulue) return false;

            let lienClic = fnTrouverLien();
            if (!lienClic) {
                console.warn(`⚠️ Lien introuvable avant scroll pour [${typeParam}]`);
                return false;
            }

            lienClic.scrollIntoView({ behavior: 'instant', block: 'nearest' });
            await window.attendrePause(150);

            lienClic = fnTrouverLien();
            if (!lienClic) {
                console.warn(`⚠️ Lien disparu après scroll pour [${typeParam}]`);
                return false;
            }

            lienClic.click();

            let popup = await window.attendreElement("#encryption_popup", 5000);
            if (!popup) {
                console.warn(`⚠️ Popup non ouverte pour [${typeParam}]`);
                return false;
            }
            await window.attendrePause(400);

            let select = popup.querySelector("select.select, div.sah_dialog_body select, select");
            if (!select) {
                console.warn("⚠️ Select introuvable dans la popup");
                return false;
            }

            let options   = Array.from(select.options);
            let valMappee = mapValeurBox6(valeurVoulue, typeParam);
            let optTrouvee = valMappee ? options.find(o => o.value === valMappee) : null;

            if (!optTrouvee) {
                let cible = valeurVoulue.toLowerCase().replace(/[^a-z0-9]/gi, '');
                optTrouvee = options.find(o => {
                    let txt = (o.text  || "").toLowerCase().replace(/[^a-z0-9]/gi, '');
                    let val = (o.value || "").toLowerCase().replace(/[^a-z0-9]/gi, '');
                    return txt === cible || val === cible || txt.includes(cible) || val.includes(cible);
                });
            }

            let trouve = false;
            if (optTrouvee) {
                console.log(`✅ [${typeParam}] → ${optTrouvee.value}`);
                select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                select.focus();
                select.value = optTrouvee.value;
                options.forEach(o => o.selected = (o.value === optTrouvee.value));
                select.dispatchEvent(new Event('input',  { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
                select.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                select.blur();
                trouve = true;
                await window.attendrePause(400);
            } else {
                console.warn(`⚠️ Option introuvable pour [${typeParam}] : ${valeurVoulue}`);
            }

            let btnSave = popup.querySelector("#chooseEncryption_save");
            if (btnSave) {
                btnSave.click();
                await new Promise(resolve => {
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
            return trouve;
        };

        const remplirSession = async (index, valeur) => {
            if (!valeur) return false;

            const collecterInputsSession = () => {
                let resultats = [];
                let rows = document.querySelectorAll(".row.text-field-row, .text-field-row");
                for (let row of rows) {
                    let inp = row.querySelector("input[type='number'], input[type='text'].text-field");
                    if (!inp || inp.offsetParent === null) continue;

                    let labelEl   = row.querySelector("[data-translation], .text-field-label, .col-xs-3, span");
                    let labelTrans = (labelEl?.getAttribute("data-translation") || "").toLowerCase();
                    let labelTxt   = (labelEl?.innerText || labelEl?.textContent || "").toLowerCase();

                    if (labelTrans.includes("lifetime") || labelTrans.includes("session") ||
                        labelTxt.includes("session")    || labelTxt.includes("durée")) {
                        if (!resultats.includes(inp)) resultats.push(inp);
                    }
                }
                return resultats;
            };

            let sessionInputs = collecterInputsSession();
            let champ = sessionInputs[index];

            if (!champ) {
                console.warn(`⚠️ Input session[${index}] introuvable`);
                return false;
            }

            champ.scrollIntoView({ behavior: 'instant', block: 'nearest' });
            await window.attendrePause(150);

            sessionInputs = collecterInputsSession();
            champ = sessionInputs[index];
            if (!champ) {
                console.warn(`⚠️ Input session[${index}] disparu après scroll`);
                return false;
            }

            champ.focus();

            champ.select?.();
            champ.value = "";
            champ.dispatchEvent(new Event('input', { bubbles: true }));
            await window.attendrePause(100);

            champ.value = String(valeur);
            champ.dispatchEvent(new Event('input',  { bubbles: true }));
            champ.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: '0', keyCode: 48 }));
            champ.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: '0', keyCode: 48 }));
            champ.dispatchEvent(new Event('change', { bubbles: true }));
            champ.blur();
            await window.attendrePause(400);

            if (champ.value !== String(valeur)) {
                console.warn(`⚠️ Valeur session non acceptée (${champ.value} ≠ ${valeur}), fallback natif...`);
                let nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                if (nativeSetter) {
                    nativeSetter.call(champ, String(valeur));
                    champ.dispatchEvent(new Event('input',  { bubbles: true }));
                    champ.dispatchEvent(new Event('change', { bubbles: true }));
                    champ.blur();
                    await window.attendrePause(300);
                }
            }

            console.log(`✅ Session[${index}] = ${champ.value}`);
            return true;
        };

        /* =================================================================================== */
        /* APPLICATION DES PARAMÈTRES                                                          */
        /* =================================================================================== */
        let ike1   = paramsAvances["IKE (phase 1)"] || {};
        let ike2   = paramsAvances["IKE (phase 2)"] || {};
        let modifs = false;

        if (clePartagee) {
            console.log("👉 Saisie de la clé partagée...");
            let inputCle = document.querySelector("#content_template_container > div.ipsec_groupe > div.row.text-field-row > div.col-xs-5.text-field-input > input")
                        || document.querySelector(".ipsec_groupe input.text-field");
            if (inputCle) {
                inputCle.scrollIntoView({ behavior: 'instant', block: 'nearest' });
                inputCle.focus();
                inputCle.value = "";
                inputCle.dispatchEvent(new Event('input', { bubbles: true }));
                inputCle.value = clePartagee;
                inputCle.dispatchEvent(new Event('input',  { bubbles: true }));
                inputCle.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
                inputCle.dispatchEvent(new Event('change', { bubbles: true }));
                inputCle.blur();
                await window.attendrePause(500);
                modifs = true;
            }
        }

        console.log("👉 Configuration IKE Phase 1...");
        let auth1 = ike1["authentification"];
        if (auth1) {
            if (await choisirDansPopup(() => trouverLienPopup(["ankaa.auth", "authentif"], 0), auth1, "auth")) modifs = true;
            await window.attendrePause(300);
        }

        let chiff1 = ike1["chiffrement"] || "AES-128-CBC";
        if (await choisirDansPopup(() => trouverLienPopup(["encrypt", "chiffr"], 0), chiff1, "enc")) modifs = true;
        await window.attendrePause(300);

        let dh1 = ike1["groupe Diffie Hellman"] || ike1["groupe diffie hellman"];
        if (dh1) {
            if (await choisirDansPopup(() => trouverLienPopup(["diffie", "groupedh"], 0), dh1, "dh")) modifs = true;
            await window.attendrePause(300);
        }

        let session1 = ike1["durée de session (en sec)"] || ike1["durée de session"];
        if (session1 && await remplirSession(0, session1)) modifs = true;

        console.log("👉 Configuration IKE Phase 2...");
        let auth2 = ike2["authentification"];
        if (auth2) {
            if (await choisirDansPopup(() => trouverLienPopup(["ankaa.auth", "authentif"], 1), auth2, "auth")) modifs = true;
            await window.attendrePause(300);
        }

        let chiff2 = ike2["chiffrement"];
        if (chiff2) {
            if (await choisirDansPopup(() => trouverLienPopup(["encrypt", "chiffr"], 1), chiff2, "enc")) modifs = true;
            await window.attendrePause(300);
        }

        let dh2 = ike2["groupe PFS"] || ike2["groupe pfs"];
        if (dh2) {
            if (await choisirDansPopup(
                () => trouverLienPopup(["pfs"], 0) || trouverLienPopup(["diffie", "groupedh"], 1),
                dh2, "dh"
            )) modifs = true;
            await window.attendrePause(300);
        }

        let session2 = ike2["durée de session (en sec)"] || ike2["durée de session"];
        if (session2 && await remplirSession(1, session2)) modifs = true;

        if (modifs) {
            let btnSaveGlobal = Array.from(
                document.querySelectorAll("input[data-translation='common.save'], input[value='Enregistrer']")
            ).reverse().find(b => b.offsetParent !== null && b.id !== "chooseEncryption_save" && b.id !== "changepwd_save");

            if (btnSaveGlobal) {
                console.log("💾 Sauvegarde finale des paramètres avancés...");
                btnSaveGlobal.click();
                await window.attendrePause(1000);
                await new Promise(resolve => {
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

        console.log("🔄 Configuration avancée terminée. Passage direct au VPN Site à Site...");

    } finally {
        libererScroll();
    }
};