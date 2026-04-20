/* --- /box4/extract_utils.js --- */

/* --- INITIALISATION ET STOCKAGE LOCAL --- */
window.CLE_STORAGE = "livebox_migration_config";

/* Charger depuis le localStorage ou créer un nouveau DTO */
window.configLivebox = JSON.parse(localStorage.getItem(window.CLE_STORAGE)) || { 
    "wifi": {}, 
    "dhcp_dns": {},
    "natpat": {},
    "dyndns": {},
    "dmz": {},
    "routage": {},
    "parefeu": {},
    "vpn": {}, 
    "accès à distance" : {},
    "airbox" : {}
};

/* --- FONCTIONS UTILITAIRES --- */
window.attendrePause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

window.attendreElement = (selecteur, tempsMax = 20000) => {
    return new Promise((resolve) => {
        let element = document.querySelector(selecteur);
        if (element) return resolve(element); 

        const intervalle = setInterval(() => {
            element = document.querySelector(selecteur);
            if (element) {
                clearInterval(intervalle);
                clearTimeout(securiteTimeout);
                resolve(element);
            }
        }, 200); 

        const securiteTimeout = setTimeout(() => {
            clearInterval(intervalle);
            console.warn("⚠️ Délai dépassé pour l'élément : " + selecteur);
            resolve(null); 
        }, tempsMax);
    });
};

window.attendreStabiliteDOM = (selecteur, tempsMax = 20000, dureeCalme = 400) => {
    return new Promise((resolve) => {
        let dernierContenu = null;
        let tempsStable = 0;
        const intervalleCheck = 100;

        const interval = setInterval(() => {
            const element = document.querySelector(selecteur);
            if (element) {
                const contenuActuel = element.innerHTML; 
                
                if (contenuActuel !== dernierContenu) {
                    dernierContenu = contenuActuel;
                    tempsStable = 0; 
                } else {
                    tempsStable += intervalleCheck;
                    if (tempsStable >= dureeCalme) {
                        clearInterval(interval);
                        clearTimeout(timeoutSecurite);
                        resolve(element); 
                    }
                }
            } else {
                tempsStable = 0; 
                dernierContenu = null;
            }
        }, intervalleCheck);

        const timeoutSecurite = setTimeout(() => {
            clearInterval(interval);
            console.warn("⚠️ Stabilité non atteinte à temps pour : " + selecteur);
            resolve(document.querySelector(selecteur)); 
        }, tempsMax);
    });
};

window.simulerClic = function(selecteur) {
    let element = document.querySelector(selecteur);
    if(element) {
        ['mousedown', 'mouseup', 'click'].forEach(function(type) {
            element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        });
        return true;
    }
    return false;
};

window.lireTexte = function(selecteur) {
    let element = document.querySelector(selecteur);
    return element ? (element.innerText || element.textContent).trim() : "Introuvable";
};

window.lireEtat = function(selecteur) {
    let element = document.querySelector(selecteur);
    if(!element) return "Introuvable";
    if(element.tagName === 'INPUT') return element.checked;
    let boutonOui = element.querySelector("input[type='radio'][value='true'], input[type='radio'][value='1'], input[type='radio'][value='oui'], input[type='radio'][value='on']");
    if(boutonOui) return boutonOui.checked;
    let inputInterne = element.querySelector("input[type='radio'], input[type='checkbox']");
    if(inputInterne) return inputInterne.checked;
    return "Erreur_Structure";
};

window.lireValeurInput = function(selecteur) {
    let element = document.querySelector(selecteur);
    if(!element) return "Introuvable";
    if(element.tagName === 'INPUT' || element.tagName === 'SELECT') {
        return element.value.trim();
    }
    return (element.innerText || element.textContent).trim();
};

window.extraireTableau = function(selecteurTableau, configurationColonnes) {
    let resultats = [];
    let lignes = document.querySelectorAll(selecteurTableau + " tr");
    
    for (let i = 1; i < lignes.length; i++) {
        let cellules = lignes[i].querySelectorAll("td");
        let objetLigne = {};
        let estValide = true;

        for (let cle in configurationColonnes) {
            let indexColonne = configurationColonnes[cle];
            if (!cellules[indexColonne]) {
                estValide = false; 
                break; 
            }
        }

        if (estValide) {
            for (let cle in configurationColonnes) {
                let indexColonne = configurationColonnes[cle];
                let cellule = cellules[indexColonne];
                
                let elementInteractif = cellule.querySelector("select, input:not([type='hidden']), textarea");
                
                if (elementInteractif) {
                    if (elementInteractif.tagName === 'INPUT' && (elementInteractif.type === 'checkbox' || elementInteractif.type === 'radio')) {
                        objetLigne[cle] = elementInteractif.checked;
                    } else {
                        objetLigne[cle] = elementInteractif.value.trim();
                    }
                } else {
                    objetLigne[cle] = (cellule.innerText || cellule.textContent).trim();
                }
            }
            resultats.push(objetLigne);
        }
    }
    return resultats;
};