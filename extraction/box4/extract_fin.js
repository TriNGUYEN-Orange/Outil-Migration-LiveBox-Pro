/* --- /box4/extract_fin.js --- */

window.extraireFin = async function() {
    const { configLivebox } = window;
    
    
    /* --- TÉLÉCHARGEMENT FINAL --- */
    console.log("⏳ Génération du fichier JSON...");
    let texteJson = JSON.stringify(configLivebox, null, 2);
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