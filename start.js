// Inicializador do Render: adiciona o registro de login antes de carregar o servidor real.
const express = require("express");

const postOriginal = express.application.post;
express.application.post = function (path, ...handlers) {
    if (path === "/api/login" && handlers.length) {
        const ultimo = handlers[handlers.length - 1];
        handlers[handlers.length - 1] = function (req, res, next) {
            const jsonOriginal = res.json.bind(res);
            res.json = function (dados) {
                if (dados?.sucesso === true && req.body?.usuario) {
                    const tipo = dados.tipo === "admin" ? "ADM" : "USER";
                    console.log(`[LOGIN] Usuário: ${req.body.usuario} | Tipo: ${tipo}`);
                }
                return jsonOriginal(dados);
            };
            return ultimo(req, res, next);
        };
    }
    return postOriginal.call(this, path, ...handlers);
};

require("./server-sugestoes.js");
