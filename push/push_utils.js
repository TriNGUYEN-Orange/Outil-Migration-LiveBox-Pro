/* --- /push/push_utils.js --- */

/* 🚨 FIX ULTIME : On attache explicitement TOUTES les variables et fonctions à l'objet 'window' */

window.CLE_STORAGE = "livebox_migration_config";
window.configLivebox = null; 

try {
    window.configLivebox = JSON.parse(localStorage.getItem(window.CLE_STORAGE));
} catch(e) {
    console.warn("⚠️ Erreur de lecture du JSON de configuration.");
}

window.attendrePause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

window.attendreElement = (selecteur, tempsMax = 15000) => {
    return new Promise((resolve) => {
        let element = document.querySelector(selecteur);
        if (element) return resolve(element); 

        let timeoutId;
        const intervalle = setInterval(() => {
            element = document.querySelector(selecteur);
            if (element) {
                clearInterval(intervalle);
                clearTimeout(timeoutId);
                resolve(element);
            }
        }, 200); 

        timeoutId = setTimeout(() => {
            clearInterval(intervalle);
            console.warn("⚠️ Délai dépassé pour l'élément : " + selecteur);
            resolve(null); 
        }, tempsMax);
    });
};

/* ========================================================================= */
/* ⚡ FONCTIONS GLOBALES GÉNÉRIQUES (RÉUTILISABLES PAR TOUS LES SCRIPTS) ⚡ */
/* ========================================================================= */

window.attendreElementDansDoc = (docContext, selecteur, tempsMax = 10000) => {
    return new Promise((resolve) => {
        if (!docContext) return resolve(null);
        let element = docContext.querySelector(selecteur);
        if (element) return resolve(element);
        
        let timeoutId;
        const intervalle = setInterval(() => {
            try {
                element = docContext.querySelector(selecteur);
                if (element) {
                    clearInterval(intervalle);
                    clearTimeout(timeoutId);
                    resolve(element);
                }
            } catch(e) {}
        }, 300); 
        
        timeoutId = setTimeout(() => {
            clearInterval(intervalle);
            resolve(null);
        }, tempsMax);
    });
};

window.attendreFinSauvegarde = async (docContext = document, timeout = 15000) => {
    await new Promise((resolve) => {
        let intervalle = setInterval(() => {
            try {
                let loading = docContext.querySelector(".loading_screen");
                if (!loading || window.getComputedStyle(loading).display === "none") {
                    clearInterval(intervalle);
                    resolve();
                }
            } catch(e) {}
        }, 200);
        setTimeout(() => { clearInterval(intervalle); resolve(); }, timeout);
    });
    await window.attendrePause(300); 
};

window.attendreDisparitionPopup = async (docContext = document, timeout = 3000) => {
    await new Promise((resolve) => {
        let intervalle = setInterval(() => {
            try {
                let popups = docContext.querySelectorAll("#encryption_popup, .sah_dialog, .popup_screen, #user_popup");
                let isAnyVisible = false;

                for (let popup of popups) {
                    let rect = popup.getBoundingClientRect();
                    let style = window.getComputedStyle(popup);
                    
                    if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.opacity !== '0') {
                        if (rect.top > -1000 && rect.left > -1000) {
                            isAnyVisible = true;
                            break; 
                        }
                    }
                }

                if (!isAnyVisible) {
                    clearInterval(intervalle);
                    resolve();
                }
            } catch(e) {}
        }, 50); 
        
        setTimeout(() => { clearInterval(intervalle); resolve(); }, timeout);
    });
};

window.cliquerPur = (element) => {
    if (element) element.click(); 
};

window.trouverValeurJSON = (obj, cleCible) => {
    if (typeof obj !== 'object' || obj === null) return undefined;
    let cible = cleCible.toLowerCase().trim();
    for (let k in obj) {
        if (k.toLowerCase().trim() === cible) return obj[k];
        if (typeof obj[k] === 'object') {
            let res = window.trouverValeurJSON(obj[k], cleCible);
            if (res !== undefined) return res;
        }
    }
    return undefined;
};

window.ecrireTexteDansDoc = (docContext, selecteur, valeur) => {
    if (valeur === undefined || valeur === null || !docContext) return false;
    let champ = docContext.querySelector(selecteur);
    if (champ) {
        champ.focus();
        champ.value = valeur;
        champ.dispatchEvent(new Event('input', { bubbles: true }));
        champ.dispatchEvent(new Event('change', { bubbles: true }));
        champ.blur();
        return true;
    }
    return false;
};

/* ========================================================================= */

window.ecrireTexte = function(selecteur, valeur) {
    return window.ecrireTexteDansDoc(document, selecteur, valeur);
};

window.cliquerBouton = function(selecteur) {
    let bouton = typeof selecteur === 'string' ? document.querySelector(selecteur) : selecteur;
    if (bouton) {
        bouton.focus();
        try { bouton.click(); } catch(e) {}
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
            bouton.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        });
        return true;
    }
    return false;
};

window.retournerAccueil = async function() {
    console.log("🔄 Tentative de retour à l'accueil...");
    let maxTentatives = 5;
    let tentative = 0;

    while (tentative < maxTentatives) {
        let btnFermer = document.querySelector("#app_close");
        let fenetreCible = window;
        
        let iframe = document.querySelector("#iframeapp");
        if (!btnFermer && iframe) {
            try {
                let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                btnFermer = docIframe.querySelector("#app_close");
                fenetreCible = iframe.contentWindow; 
            } catch(e) {}
        }
        
        if (!btnFermer || window.getComputedStyle(btnFermer).display === "none") {
            console.log("✅ Accueil atteint.");
            return true;
        }

        console.log("👉 Clic ciblé sur le bouton Retour...");
        try { btnFermer.click(); } catch(e) {}
        
        ['mousedown', 'mouseup', 'click'].forEach(type => {
            btnFermer.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: fenetreCible }));
        });
        
        await window.attendrePause(2500); 
        tentative++;
    }
    console.warn("⚠️ Impossible de retourner à l'accueil.");
    return false;
};

/* --- POPUPS ET SÉCURITÉ --- */
window.afficherPopupMotDePasse = function(message, suggestion) {
    return new Promise((resolve) => {
        let overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;";
        let boite = document.createElement("div");
        boite.style.cssText = "background:#fff;padding:25px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.3);max-width:400px;width:90%;font-family:Arial, sans-serif;pointer-events:auto;";
        let titre = document.createElement("h3");
        titre.innerText = "Sécurité requise";
        titre.style.color = "#ff7900";
        titre.style.marginTop = "0";
        let txtMessage = document.createElement("p");
        txtMessage.innerText = message;
        txtMessage.style.fontSize = "14px";
        let champ = document.createElement("input");
        champ.type = "text";
        champ.value = suggestion;
        champ.style.cssText = "width:100%;box-sizing:border-box;padding:10px;margin-top:15px;border:1px solid #ccc;border-radius:4px;font-size:16px;";
        let divBoutons = document.createElement("div");
        divBoutons.style.cssText = "display:flex;justify-content:flex-end;gap:10px;margin-top:25px;";
        let btnAnnuler = document.createElement("button");
        btnAnnuler.innerText = "Annuler";
        btnAnnuler.style.cssText = "padding:8px 15px;border:none;border-radius:4px;cursor:pointer;background:#ddd;";
        btnAnnuler.onclick = () => { document.body.removeChild(overlay); resolve(null); };
        let btnValider = document.createElement("button");
        btnValider.innerText = "Valider";
        btnValider.style.cssText = "padding:8px 15px;border:none;border-radius:4px;cursor:pointer;background:#ff7900;color:white;font-weight:bold;";
        btnValider.onclick = () => { document.body.removeChild(overlay); resolve(champ.value); };

        divBoutons.append(btnAnnuler, btnValider);
        boite.append(titre, txtMessage, champ, divBoutons);
        overlay.appendChild(boite);
        document.body.appendChild(overlay);
    });
};

window.estMotDePasseValide = function(mdp) {
    if (!mdp) return false;
    let regexSecurite = /^(?=.*[a-zA-Z])(?=.*[0-9\W]).{8,}$/;
    return regexSecurite.test(mdp);
};

window.obtenirMotDePasseConforme = async function(mdpActuel, nomDuService) {
    let mdpTest = mdpActuel;
    while (!window.estMotDePasseValide(mdpTest)) {
        let suggestion = mdpActuel ? mdpActuel + "123!" : "LiveboxPro123!";
        let message = "Le mot de passe pour [" + nomDuService + "] n'est pas conforme.\n\nMot de passe actuel : '" + mdpActuel + "'\nExigences : 8 caractères minimum (lettres ET chiffres/spéciaux).\n\nVeuillez modifier :";
        mdpTest = await window.afficherPopupMotDePasse(message, suggestion);
        if (mdpTest === null) return null; 
    }
    return mdpTest;
};

window.chargerConfiguration = async function() {
    let dataLocale = localStorage.getItem(window.CLE_STORAGE);
    if (dataLocale) {
        try {
            let parsed = JSON.parse(dataLocale);
            if (parsed) return parsed;
        } catch(e) {}
    }
    return new Promise((resolve) => {
        let overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;align-items:center;justify-content:center;";
        let boite = document.createElement("div");
        boite.style.cssText = "background:#fff;padding:30px;border-radius:10px;width:550px;max-width:90%;font-family:Arial, sans-serif;pointer-events:auto;";
        let titre = document.createElement("h2");
        titre.innerText = "📦 Importation de la configuration";
        titre.style.color = "#ff7900";
        titre.style.marginTop = "0";
        let desc = document.createElement("p");
        desc.innerText = "L'adresse IP de cette nouvelle Livebox est différente de l'ancienne.\nVeuillez coller le code JSON ci-dessous :";
        let zoneTexte = document.createElement("textarea");
        zoneTexte.style.cssText = "width:100%;height:180px;margin-top:15px;padding:15px;font-family:monospace;border:2px solid #ccc;border-radius:5px;resize:none;";
        let btnDiv = document.createElement("div");
        btnDiv.style.cssText = "display:flex;justify-content:flex-end;margin-top:20px;gap:15px;";
        let btnAnnuler = document.createElement("button");
        btnAnnuler.innerText = "Annuler";
        btnAnnuler.style.cssText = "padding:10px 20px;background:#eee;border:none;border-radius:5px;cursor:pointer;";
        btnAnnuler.onclick = () => { document.body.removeChild(overlay); resolve(null); };
        let btnValider = document.createElement("button");
        btnValider.innerText = "Lancer l'injection 🚀";
        btnValider.style.cssText = "padding:10px 20px;background:#ff7900;color:white;border:none;border-radius:5px;font-weight:bold;cursor:pointer;";
        btnValider.onclick = () => {
            try {
                let jsonParse = JSON.parse(zoneTexte.value);
                localStorage.setItem(window.CLE_STORAGE, JSON.stringify(jsonParse)); 
                document.body.removeChild(overlay);
                resolve(jsonParse);
            } catch (e) {
                alert("❌ Erreur : Code JSON invalide.");
            }
        };
        btnDiv.append(btnAnnuler, btnValider);
        boite.append(titre, desc, zoneTexte, btnDiv);
        overlay.appendChild(boite);
        document.body.appendChild(overlay);
    });
};