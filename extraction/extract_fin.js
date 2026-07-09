/* --- /box4/extract_fin.js --- */

window.extraireFin = async function() {
    const { configLivebox } = window;

    /* --- TÉLÉCHARGEMENT FINAL --- */
    console.log("⏳ Génération du fichier JSON...");

    const STATIC_SECRET = "LBP_INTERNAL_STATIC_KEY_2026_ORANGE";
    let payload = null;

    const hasWebCrypto = !!(window.crypto && window.crypto.subtle);
    const hasLBObf = !!(window.LB_OBF && typeof window.LB_OBF.encodeObject === "function");

    if (!hasWebCrypto && !hasLBObf) {
        throw new Error("Aucun moteur disponible (WebCrypto/LB_OBF).");
    }

    if (hasWebCrypto) {
        const encoder = new TextEncoder();

        const bytesToB64 = (bytes) => {
            let bin = "";
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
            }
            return btoa(bin);
        };

        const raw = encoder.encode(STATIC_SECRET);
        const hash = await crypto.subtle.digest("SHA-256", raw);
        const key = await crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt"]);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const plain = encoder.encode(JSON.stringify(configLivebox));
        const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);

        payload = {
            v: 1,
            alg: "AES-GCM",
            iv: bytesToB64(iv),
            ct: bytesToB64(new Uint8Array(cipherBuf))
        };
    } else {
        // fallback non sécurisé: obfuscation locale (pas CryptoJS)
        payload = window.LB_OBF.encodeObject(configLivebox);
    }

    localStorage.setItem("livebox_migration_config", JSON.stringify(payload));

    let texteJson = JSON.stringify(payload, null, 2);
    let objetFichier = new Blob([texteJson], { type: "application/json" });
    let urlFichier = URL.createObjectURL(objetFichier);

    let lien = document.createElement("a");
    lien.href = urlFichier;
    lien.download = "livebox_migration_config.json";
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(urlFichier);
};
