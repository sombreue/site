require("dotenv").config();

// Ponto de entrada do Render. Instrumenta o Express ANTES de server.js ser carregado.
const express = require("express");
const originalExpress = express;

function expressComLog(...args) {
    const app = originalExpress(...args);
    const originalPost = app.post.bind(app);

    app.post = function (path, ...handlers) {
        if (path === "/api/login") {
            console.log("[LOGIN] Rota /api/login registrada.");

            handlers = handlers.map(handler => {
                if (typeof handler !== "function") return handler;

                return function loginInstrumentado(req, res, next) {
                    const usuario = typeof req.body?.usuario === "string" ? req.body.usuario : "";
                    console.log(`[LOGIN] Tentativa | Usuário: ${usuario || "(vazio)"}`);

                    const jsonOriginal = res.json.bind(res);
                    res.json = function (dados) {
                        if (dados?.sucesso === true) {
                            const tipo = dados.tipo === "admin" ? "ADM" : "USER";
                            console.log(`[LOGIN] SUCESSO | Usuário: ${usuario || "(vazio)"} | Tipo: ${tipo}`);
                        } else if (dados?.sucesso === false) {
                            console.log(`[LOGIN] FALHA | Usuário: ${usuario || "(vazio)"} | Motivo: ${dados.mensagem || "não informado"}`);
                        }
                        return jsonOriginal(dados);
                    };

                    return handler(req, res, next);
                };
            });
        }

        return originalPost(path, ...handlers);
    };

    return app;
}

Object.assign(expressComLog, originalExpress);
require.cache[require.resolve("express")].exports = expressComLog;

console.log("[START] Inicializando aplicação...");
require("./server-sugestoes.js");
console.log("[START] Aplicação carregada.");
