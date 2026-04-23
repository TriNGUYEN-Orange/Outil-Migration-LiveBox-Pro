/* --- /push/box6/push_pdf.js --- */

window.PushPDF = {
    telecharger: async function(journalModifications, configStr) {
        let btn = document.getElementById("btn-telecharger-pdf");
        let texteOriginal = btn ? btn.innerText : "";
        if (btn) btn.innerText = "⏳ Génération en cours...";

        let config = configStr ? JSON.parse(configStr) : { erreur: "Aucune configuration" };
        let contenuHTML = this.genererTemplateHTML(journalModifications, config);

        try {
            /* 1. Tentative de chargement de la librairie externe pour créer un VRAI fichier .pdf */
            if (typeof window.html2pdf === 'undefined') {
                await new Promise((resolve, reject) => {
                    let script = document.createElement('script');
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                    script.onload = resolve;
                    script.onerror = () => reject(new Error("CSP Blocked"));
                    document.head.appendChild(script);
                });
            }

            /* 2. Génération silencieuse et téléchargement direct du PDF */
            let elementConteneur = document.createElement('div');
            elementConteneur.innerHTML = contenuHTML;

            let options = {
                margin:       10,
                filename:     'Rapport_Migration_Livebox.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(options).from(elementConteneur).save();

        } catch (erreur) {
            /* 3. PLAN B : Si le routeur bloque la librairie, on télécharge un fichier .html direct */
            console.warn("⚠️ Librairie PDF bloquée par le routeur. Basculement sur le téléchargement HTML direct.");
            this.telechargerFallbackHTML(contenuHTML);
        } finally {
            if (btn) btn.innerText = texteOriginal;
        }
    },

    genererTemplateHTML: function(journal, config) {
        let dateActuelle = new Date().toLocaleString('fr-FR');
        let html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; background: #fff; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ff7900; padding-bottom: 20px;">
                    <h1 style="color: #ff7900; margin: 0 0 10px 0; font-size: 26px;">Rapport de Configuration Livebox</h1>
                    <p style="color: #666; margin: 0; font-size: 14px;">Généré automatiquement le : <strong>${dateActuelle}</strong></p>
                </div>
        `;

        if (journal.length > 0) {
            html += `
                <h2 style="color: #2e7d32; border-bottom: 2px solid #4caf50; padding-bottom: 5px; margin-top: 20px; font-size: 18px;">1. Bilan des modifications de sécurité</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
                    <thead>
                        <tr>
                            <th style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 10px; text-align: left; width: 20%;">Module</th>
                            <th style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 10px; text-align: left; width: 30%;">Élément modifié</th>
                            <th style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 10px; text-align: left; width: 25%;">Ancien</th>
                            <th style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 10px; text-align: left; width: 25%;">Nouveau</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            journal.forEach(mod => {
                html += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 10px;"><span style="background: #fff3e6; padding: 3px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #ff7900; border: 1px solid #ffe0b2;">${mod.module}</span></td>
                        <td style="border: 1px solid #ddd; padding: 10px;"><strong>${mod.element}</strong></td>
                        <td style="border: 1px solid #ddd; padding: 10px;"><span style="color: #999; text-decoration: line-through; font-style: italic;">${mod.ancien}</span></td>
                        <td style="border: 1px solid #ddd; padding: 10px;"><span style="color: #2e7d32; font-weight: bold;">${mod.nouveau}</span></td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
        } else {
            html += `<h2 style="color: #2e7d32; font-size: 18px;">1. Bilan des modifications</h2><p>Aucune modification manuelle.</p>`;
        }

        html += `
                <h2 style="color: #2e7d32; border-bottom: 2px solid #4caf50; padding-bottom: 5px; margin-top: 30px; font-size: 18px;">2. Données Brutes Injectées</h2>
                <pre style="background: #f4f4f4; border: 1px solid #ddd; padding: 15px; border-radius: 6px; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; color: #d63384;">${JSON.stringify(config, null, 4)}</pre>
            </div>
        `;
        return html;
    },

    telechargerFallbackHTML: function(contenuHTML) {
        let contenuComplet = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Livebox</title></head><body>${contenuHTML}</body></html>`;
        let blob = new Blob([contenuComplet], { type: "text/html" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "Rapport_Migration_Livebox.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};