const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

// Corrige a persistência da sessão no login.
const antigo = `        res.json({
            sucesso: true,
            tipo: usuarioBanco.tipo
        });`;

const novo = `        // Aguarda a persistência da sessão antes de responder.
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

if (!text.includes(novo) && text.includes(antigo)) {
    text = text.replace(antigo, novo);
}

// Mantém compatibilidade com páginas antigas da EXPEC que ainda consultam
// /api/sessao. O endpoint usa exatamente a mesma sessão do /api/usuario.
const marker = "// =========================\n// TAREFAS\n// =========================";
const sessaoMarker = "// Compatibilidade de sessão para páginas antigas";

if (!text.includes(sessaoMarker)) {
    if (!text.includes(marker)) {
        throw new Error("Não foi encontrado o ponto seguro para inserir /api/sessao.");
    }

    const rotaSessao = `

// Compatibilidade de sessão para páginas antigas
app.get("/api/sessao", (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!req.session || !req.session.usuario) {
        return res.json({
            logado: false,
            tipo: null,
            usuario: null
        });
    }

    res.json({
        logado: true,
        tipo: req.session.usuario.tipo,
        usuario: req.session.usuario
    });
});
`;

    text = text.replace(marker, rotaSessao + "\n" + marker);
}

fs.writeFileSync(path, text, "utf8");
console.log("Correções de sessão aplicadas.");
