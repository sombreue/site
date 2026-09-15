// Inicializador do Render: registra logins de forma independente da rota /api/login.
const express = require("express");

// O middleware roda para toda requisição e registra somente logins bem-sucedidos.
// Ele não registra senha nem outros dados sensíveis.
const useOriginal = express.application.use;
express.application.use = function (...args) {
    const middleware = function (req, res, next) {
        if (req.method === "POST" && req.path === "/api/login") {
            const usuarioInformado = req.body?.usuario;
            const finalizar = () => {
                if (res.statusCode >= 200 && res.statusCode < 300 && usuarioInformado) {
                    const usuarioSessao = req.session?.usuario;
                    const tipo = usuarioSessao?.tipo === "admin" ? "ADM" : "USER";
                    const nome = usuarioSessao?.usuario || usuarioInformado;
                    console.log(`[LOGIN] Usuário: ${nome} | Tipo: ${tipo}`);
                }
            };
            res.once("finish", finalizar);
        }
        next();
    };
    return useOriginal.call(this, middleware, ...args);
};

require("./server-sugestoes.js");
