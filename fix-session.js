const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

const antigo = `        res.json({
            sucesso: true,
            tipo: usuarioBanco.tipo
        });`;

const novo = `        // Aguarda a persistência da sessão antes de responder.
        // Isso evita que o navegador seja redirecionado para / antes
        // de o cookie/sessão do login estar disponível.
        req.session.save((erroSessao) => {
            if (erroSessao) {
                console.error("Erro ao salvar sessão de login:", erroSessao);
                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Não foi possível manter a sessão de login."
                });
            }

            res.json({
                sucesso: true,
                tipo: usuarioBanco.tipo
            });
        });`;

if (text.includes(novo)) {
    console.log("Correção da sessão de login já está presente.");
    process.exit(0);
}

if (!text.includes(antigo)) {
    console.error("Não foi encontrado o trecho do login para corrigir.");
    process.exit(0);
}

text = text.replace(antigo, novo);
fs.writeFileSync(path, text, "utf8");
console.log("Sessão de login corrigida.");
