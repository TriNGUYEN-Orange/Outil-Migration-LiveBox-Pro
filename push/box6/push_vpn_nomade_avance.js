/* --- /push/box6/push_vpn_nomade_avance.js --- */

window.executerVpnNomadeAvance = async function() {
    console.log("⏳ Application des paramètres avancés VPN Nomade...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch (e) {
        throw new Error("Configuration JSON invalide (VPN Nomade avancé).");
    }

    if (!configurationActuelle || !configurationActuelle.vpn || !configurationActuelle.vpn.nomade) {
        console.warn("⚠️ Pas de données VPN Nomade trouvées à appliquer.");
        return;
    }

    let vpnNomade = configurationActuelle.vpn.nomade;
    let comptes = vpnNomade.comptes || [];
    let paramsAvances = vpnNomade["parametres avancés"] || {};
    let clePartagee = (comptes.length > 0)
        ? comptes[0]["clé partagée nomade"]
        : vpnNomade["clé partagée nomade"];

    if (Object.keys(paramsAvances).length === 0 && !clePartagee) {
        console.log("ℹ️ Aucun paramètre avancé ou clé partagée à configurer pour VPN Nomade.");
        return;
    }

    /* Anti-scroll */
    const bloquerScroll = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener("wheel", bloquerScroll, { passive: false });
    window.addEventListener("touchmove", bloquerScroll, { passive: false });
    window.addEventListener("DOMMouseScroll", bloquerScroll, { passive: false });

    let oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const libererScroll = () => {
        window.removeEventListener("wheel", bloquerScroll);
        window.removeEventListener("touchmove", bloquerScroll);
        window.removeEventListener("DOMMouseScroll", bloquerScroll);
        document.body.style.overflow = oldOverflow;
    };

    try {
        await window.attendrePause(1500);

        const isPanneauAvanceOuvert = () => {
            let champCle =
                document.querySelector("#content_template_container > div.ipsec_groupe > div.row.text-field-row > div.col-xs-5.text-field-input > input") ||
                document.querySelector(".ipsec_groupe input.text-field");
            return !!(champCle && champCle.offsetParent !== null);
        };

        const trouverLienAvance = () => {
            let btn = document.querySelector("a[data-translation='internetVPNAnkaa.showSettings']");
            if (btn && btn.offsetParent !== null) return btn;

            for (let el of document.querySelectorAll("a, button, div, span")) {
                let txt = (el.innerText || "").toLowerCase().trim();
                if ((txt === "paramètres avancés" || txt === "avancé" || txt === "avancés") && el.offsetParent !== null) {
                    return el;
                }
            }
            return null;
        };

        if (!isPanneauAvanceOuvert()) {
            console.log("⚙️ Le panneau est fermé, recherche du bouton 'Paramètres avancés'...");
            let lienAvance = trouverLienAvance();

            if (!lienAvance) {
                console.log("🔄 Panneau VPN complètement fermé, tentative de réouverture...");
                let tuileVpn =
                    document.querySelector(".swiper-slide-active #internetVPNAnkaa, .swiper-slide-active .internetVPNAnkaa") ||
                    document.querySelector("#internetVPNAnkaa");

                if (tuileVpn) {
                    let cible = tuileVpn.querySelector(".widget") || tuileVpn;
                    if (typeof window.cliquerPur === "function") window.cliquerPur(cible);
                    else cible.click();

                    await window.attendrePause(2000);
                    lienAvance = trouverLienAvance();
                }
            }

            if (!lienAvance) {
                throw new Error("Impossible de trouver 'Paramètres avancés' (VPN Nomade).");
            }

            console.log("✅ Bouton 'Paramètres avancés' trouvé, clic pour ouvrir...");
            lienAvance.scrollIntoView({ behavior: "instant", block: "center" });
            await window.attendrePause(500);

            if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
            else lienAvance.click();

            await window.attendrePause(2500);

            if (!isPanneauAvanceOuvert()) {
                console.warn("⚠️ Le panneau ne s'est pas ouvert. Deuxième tentative...");
                lienAvance = trouverLienAvance();
                if (lienAvance) {
                    if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
                    else lienAvance.click();
                    await window.attendrePause(2500);
                }
            }

            if (!isPanneauAvanceOuvert()) {
                throw new Error("Le panneau 'Paramètres avancés' ne s'ouvre pas.");
            }
        } else {
            console.log("✅ Panneau 'Paramètres avancés' déjà ouvert.");
        }

        const mapValeurBox6 = (valeurBrute, type) => {
            if (!valeurBrute) return null;
            let v = String(valeurBrute).toLowerCase().replace(/[\s\-_]/g, "");
            let n = String(valeurBrute).toLowerCase().replace(/[^a-z0-9]/g, "");

            if (type === "auth") {
                if (v.includes("sha1")) return "HMAC-SHA1-96";
                if (v.includes("sha256") || v.includes("sha2256")) return "HMAC-SHA2-256-128";
                if (v.includes("sha384") || v.includes("sha2384")) return "HMAC-SHA2-384-192";
                if (v.includes("sha512") || v.includes("sha2512")) return "HMAC-SHA2-512-256";
                return "HMAC-SHA1-96";
            }

            if (type === "dh") {
                if ((v === "2" || v.includes("1024")) && !v.includes("2048")) return "MODP-1024";
                if (v === "5" || v.includes("1536")) return "MODP-1536";
                if (v === "14" || v.includes("2048")) return "MODP-2048";
                if (v === "15" || v.includes("3072")) return "MODP-3072";
                if (v === "16" || v.includes("4096")) return "MODP-4096";
                return null;
            }

            if (type === "enc") {
                if (n === "aes128" || n === "aes" || n === "aescbc128" || n === "aes128cbc") return "AES-128-CBC";
                if (n === "aes256" || n === "aescbc256" || n === "aes256cbc") return "AES-256-CBC";

                if (n.includes("aes128gcm16") || (n.includes("aes128") && n.includes("gcm"))) return "AES-128-GCM-16";
                if (n.includes("aes128gcm12")) return "AES-128-GCM-12";
                if (n.includes("aes128gcm8")) return "AES-128-GCM-8";

                if (n.includes("aes256gcm16") || (n.includes("aes256") && n.includes("gcm"))) return "AES-256-GCM-16";
                if (n.includes("aes256gcm12")) return "AES-256-GCM-12";
                if (n.includes("aes256gcm8")) return "AES-256-GCM-8";

                if (n.includes("aes128ccm16")) return "AES-128-CCM-16";
                if (n.includes("aes128ccm12")) return "AES-128-CCM-12";
                if (n.includes("aes128ccm8")) return "AES-128-CCM-8";

                if (n.includes("aes256ccm16")) return "AES-256-CCM-16";
                if (n.includes("aes256ccm12")) return "AES-256-CCM-12";
                if (n.includes("aes256ccm8")) return "AES-256-CCM-8";

                if (n.includes("128")) return "AES-128-CBC";
                if (n.includes("256")) return "AES-256-CBC";
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
                            liens.push(lien);
                            break;
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
                throw new Error(`Lien introuvable pour [${typeParam}]`);
            }

            lienClic.scrollIntoView({ behavior: "instant", block: "nearest" });
            await window.attendrePause(150);

            lienClic = fnTrouverLien();
            if (!lienClic) {
                throw new Error(`Lien disparu après scroll pour [${typeParam}]`);
            }

            if (typeof window.cliquerPur === "function") window.cliquerPur(lienClic);
            else lienClic.click();

            let popup = await window.attendreElement("#encryption_popup", 7000);
            if (!popup) {
                throw new Error(`Popup non ouverte pour [${typeParam}] (#encryption_popup)`);
            }
            await window.attendrePause(400);

            let select = popup.querySelector("select.select, div.sah_dialog_body select, select");
            if (!select) {
                throw new Error(`Select introuvable dans popup pour [${typeParam}]`);
            }

            let options = Array.from(select.options || []);
            let valMappee = mapValeurBox6(valeurVoulue, typeParam);
            let optTrouvee = valMappee ? options.find(o => o.value === valMappee) : null;

            if (!optTrouvee) {
                let cible = String(valeurVoulue).toLowerCase().replace(/[^a-z0-9]/g, "");
                optTrouvee = options.find(o => {
                    let txt = (o.text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                    let val = (o.value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                    return txt === cible || val === cible || txt.includes(cible) || val.includes(cible);
                });
            }

            if (!optTrouvee && typeParam === "enc") {
                const raw = String(valeurVoulue).toLowerCase().replace(/[^a-z0-9]/g, "");
                if (raw.includes("128")) {
                    optTrouvee = options.find(o => /128/.test(((o.value || "") + " " + (o.text || "")).toLowerCase()));
                } else if (raw.includes("256")) {
                    optTrouvee = options.find(o => /256/.test(((o.value || "") + " " + (o.text || "")).toLowerCase()));
                }
            }

            if (!optTrouvee) {
                throw new Error(`Option introuvable pour [${typeParam}] : ${valeurVoulue}`);
            }

            console.log(`✅ [${typeParam}] → ${optTrouvee.value}`);

            select.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            select.focus();
            select.value = optTrouvee.value;
            options.forEach(o => o.selected = (o.value === optTrouvee.value));
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
            select.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            select.blur();
            await window.attendrePause(400);

            let btnSave = popup.querySelector("#chooseEncryption_save");
            if (!btnSave) {
                throw new Error(`Bouton save popup introuvable pour [${typeParam}] (#chooseEncryption_save)`);
            }

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
            else btnSave.click();

            await new Promise((resolve) => {
                let intv = setInterval(() => {
                    let p = document.querySelector("#encryption_popup");
                    if (!p || p.offsetParent === null || window.getComputedStyle(p).display === "none") {
                        clearInterval(intv);
                        resolve();
                    }
                }, 200);
                setTimeout(() => {
                    clearInterval(intv);
                    resolve();
                }, 7000);
            });

            await window.attendrePause(500);
            return true;
        };

        const remplirSession = async (index, valeur) => {
            if (!valeur) return false;

            const collecterInputsSession = () => {
                let resultats = [];
                let rows = document.querySelectorAll(".row.text-field-row, .text-field-row");
                for (let row of rows) {
                    let inp = row.querySelector("input[type='number'], input[type='text'].text-field");
                    if (!inp || inp.offsetParent === null) continue;

                    let labelEl = row.querySelector("[data-translation], .text-field-label, .col-xs-3, span");
                    let labelTrans = (labelEl?.getAttribute("data-translation") || "").toLowerCase();
                    let labelTxt = (labelEl?.innerText || labelEl?.textContent || "").toLowerCase();

                    if (
                        labelTrans.includes("lifetime") || labelTrans.includes("session") ||
                        labelTxt.includes("session") || labelTxt.includes("durée")
                    ) {
                        if (!resultats.includes(inp)) resultats.push(inp);
                    }
                }
                return resultats;
            };

            let sessionInputs = collecterInputsSession();
            let champ = sessionInputs[index];

            if (!champ) throw new Error(`Input session[${index}] introuvable`);

            champ.scrollIntoView({ behavior: "instant", block: "nearest" });
            await window.attendrePause(150);

            sessionInputs = collecterInputsSession();
            champ = sessionInputs[index];
            if (!champ) throw new Error(`Input session[${index}] disparu après scroll`);

            champ.focus();
            champ.select?.();
            champ.value = "";
            champ.dispatchEvent(new Event("input", { bubbles: true }));
            await window.attendrePause(100);

            champ.value = String(valeur);
            champ.dispatchEvent(new Event("input", { bubbles: true }));
            champ.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "0", keyCode: 48 }));
            champ.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "0", keyCode: 48 }));
            champ.dispatchEvent(new Event("change", { bubbles: true }));
            champ.blur();
            await window.attendrePause(400);

            if (String(champ.value) !== String(valeur)) {
                let nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                if (nativeSetter) {
                    nativeSetter.call(champ, String(valeur));
                    champ.dispatchEvent(new Event("input", { bubbles: true }));
                    champ.dispatchEvent(new Event("change", { bubbles: true }));
                    champ.blur();
                    await window.attendrePause(300);
                }
            }

            if (String(champ.value) !== String(valeur)) {
                throw new Error(`Valeur session non acceptée pour session[${index}]`);
            }

            console.log(`✅ Session[${index}] = ${champ.value}`);
            return true;
        };

        let ike1 = paramsAvances["IKE (phase 1)"] || {};
        let ike2 = paramsAvances["IKE (phase 2)"] || {};
        let modifs = false;

        if (clePartagee) {
            console.log("👉 Saisie de la clé partagée...");
            let inputCle =
                document.querySelector("#content_template_container > div.ipsec_groupe > div.row.text-field-row > div.col-xs-5.text-field-input > input") ||
                document.querySelector(".ipsec_groupe input.text-field");

            if (!inputCle) throw new Error("Champ clé partagée introuvable.");

            inputCle.scrollIntoView({ behavior: "instant", block: "nearest" });
            inputCle.focus();
            inputCle.value = "";
            inputCle.dispatchEvent(new Event("input", { bubbles: true }));
            inputCle.value = clePartagee;
            inputCle.dispatchEvent(new Event("input", { bubbles: true }));
            inputCle.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
            inputCle.dispatchEvent(new Event("change", { bubbles: true }));
            inputCle.blur();
            await window.attendrePause(500);
            modifs = true;
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
                dh2,
                "dh"
            )) modifs = true;
            await window.attendrePause(300);
        }

        let session2 = ike2["durée de session (en sec)"] || ike2["durée de session"];
        if (session2 && await remplirSession(1, session2)) modifs = true;

        if (modifs) {
            let btnSaveGlobal = Array.from(
                document.querySelectorAll("input[data-translation='common.save'], input[value='Enregistrer']")
            )
            .reverse()
            .find(b => b.offsetParent !== null && b.id !== "chooseEncryption_save" && b.id !== "changepwd_save");

            if (!btnSaveGlobal) {
                throw new Error("Bouton sauvegarde global introuvable (VPN Nomade avancé).");
            }

            console.log("💾 Sauvegarde finale des paramètres avancés...");
            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSaveGlobal);
            else btnSaveGlobal.click();

            await window.attendrePause(1000);
            await new Promise((resolve, reject) => {
                let done = false;
                let intv = setInterval(() => {
                    let loading = document.querySelector("body > div.loading_screen");
                    if (!loading || window.getComputedStyle(loading).display === "none") {
                        if (!done) {
                            done = true;
                            clearInterval(intv);
                            resolve();
                        }
                    }
                }, 500);

                setTimeout(() => {
                    if (!done) {
                        clearInterval(intv);
                        reject(new Error("Timeout: sauvegarde VPN Nomade avancé non confirmée."));
                    }
                }, 20000);
            });
        }

        console.log("✅ Configuration avancée VPN Nomade terminée.");

    } finally {
        libererScroll();
    }
};
