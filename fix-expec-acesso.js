const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

// A EXPEC deve exigir login, mas não deve expulsar o usuário da página
// só porque a feira está marcada como inativa. O status da feira é uma
// configuração da página, não uma barreira de autenticação.
const inicio = 'app.get("/expec.html", async (req, res, next) => {';
const marcadorFim = '// Favicon padrão do site.';
const posInicio = text.indexOf(inicio);
const posFim = text.indexOf(marcadorFim, posInicio);

if (posInicio !== -1 && posFim !== -1) {
    const novaRota = `app.get("/expec.html", (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect("/login.html");
    }

    res.sendFile(
        path.join(__dirname, "public", "expec.html")
    );
});

`;

    text = text.slice(0, posInicio) + novaRota + text.slice(posFim);
    fs.writeFileSync(path, text, "utf8");
    console.log("Acesso à EXPEC corrigido: somente o login é obrigatório.");
} else {
    console.log("Rota /expec.html já está em formato compatível ou não foi encontrada.");
}
