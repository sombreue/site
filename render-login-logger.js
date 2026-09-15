const fs = require("fs");
const path = require("path");

// Restaura no processo do Render os logs de login sem expor a senha.
const caminhoServer = path.join(__dirname, "server.js");
const marcador = '            res.json({ sucesso: true, tipo: usuarioBanco.tipo });';
const logLogin = '            console.log(`[LOGIN] Usuário: ${usuarioBanco.usuario} | Tipo: ${usuarioBanco.tipo === "admin" ? "ADM" : "USER"}`);\n' + marcador;

try {
    let codigo = fs.readFileSync(caminhoServer, "utf8");

    if (!codigo.includes('[LOGIN] Usuário:')) {
        if (!codigo.includes(marcador)) {
            throw new Error("Trecho de sucesso do login não encontrado em server.js.");
        }
        codigo = codigo.replace(marcador, logLogin);
        fs.writeFileSync(caminhoServer, codigo, "utf8");
    }
} catch (erro) {
    console.error("Erro ao restaurar logs de login:", erro);
}

require("./server-sugestoes.js");
