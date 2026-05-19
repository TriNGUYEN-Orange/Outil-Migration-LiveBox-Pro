/* --- /push/push_router.js --- */
(async function () {
  console.warn("=== ROUTEUR PUSH : Détection Livebox 6/7 ===");

  // Évite double exécution
  if (window.__PUSH_ROUTER_RUNNING__) {
    console.warn("Router déjà en cours, arrêt.");
    return;
  }
  window.__PUSH_ROUTER_RUNNING__ = true;

  try {
    // Petite attente pour laisser le DOM se stabiliser
    await new Promise((r) => setTimeout(r, 300));

    // 1) Déterminer l'URL de base dynamiquement depuis ce script
    function getBasePushUrl() {
      if (document.currentScript && document.currentScript.src) {
        // ex: https://host/push/push_router.js
        return document.currentScript.src.substring(
          0,
          document.currentScript.src.lastIndexOf("/")
        );
      }

      // fallback: chercher la balise script correspondante
      const scripts = document.getElementsByTagName("script");
      for (const s of scripts) {
        if (s.src && s.src.includes("/push/push_router.js")) {
          return s.src.substring(0, s.src.lastIndexOf("/"));
        }
      }

      // fallback final
      return window.location.origin + "/push";
    }

    const PUSH_BASE = getBasePushUrl(); // .../push

    // 2) Détection box via classe html
    const htmlClass = (document.documentElement.className || "").toLowerCase();
    const isLb6 = htmlClass.includes("mode-lb6") || htmlClass.includes("lb6");
    const isLb7 = htmlClass.includes("mode-lb7") || htmlClass.includes("lb7");

    let targetScript = "";

    if (isLb7) {
      targetScript = `${PUSH_BASE}/box7/push_main.js?v=${Date.now()}`;
      console.warn("✅ Box 7 détectée");
    } else if (isLb6) {
      targetScript = `${PUSH_BASE}/box6/push_main.js?v=${Date.now()}`;
      console.warn("✅ Box 6 détectée");
    } else {
      console.error("❌ Impossible de détecter LB6/LB7 via <html class>.");
      console.warn("Classes détectées:", htmlClass);
      return;
    }

    // 3) Charger le push_main adapté
    const script = document.createElement("script");
    script.src = targetScript;
    script.onload = () => {
      console.warn("✅ Script chargé:", targetScript);
    };
    script.onerror = () => {
      console.error("❌ Erreur chargement:", targetScript);
    };
    document.head.appendChild(script);

  } catch (e) {
    console.error("❌ Erreur router PUSH:", e);
  } finally {
    window.__PUSH_ROUTER_RUNNING__ = false;
  }
})();
