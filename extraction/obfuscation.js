/* --- /extraction/obfuscation.js --- */
(function () {
    if (window.LB_OBF) return;

    window.LB_OBF = {
        SECRET: "LBP_INTERNAL_STATIC_KEY_2026_ORANGE",

        _xor: function (str, key) {
            let out = "";
            for (let i = 0; i < str.length; i++) {
                out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return out;
        },

        encodeObject: function (obj) {
            const json = JSON.stringify(obj);
            const x = this._xor(json, this.SECRET);
            const b64 = btoa(unescape(encodeURIComponent(x)));
            return {
                v: 1,
                alg: "OBF_XOR_B64",
                ct: b64
            };
        },

        decodePayload: function (payload) {
            if (!payload || payload.alg !== "OBF_XOR_B64" || !payload.ct) {
                throw new Error("Payload obfuscation invalide");
            }
            const x = decodeURIComponent(escape(atob(payload.ct)));
            const json = this._xor(x, this.SECRET);
            return JSON.parse(json);
        }
    };
})();
