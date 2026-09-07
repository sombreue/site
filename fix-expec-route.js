const fs = require("fs");

const path = "server.js";
const text = fs.readFileSync(path, "utf8");

const old = 'app.get("/expec.html", exigirLogin, async (req, res) => {';
const replacement = `app.get("/expec.html", async (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect("/login.html");
    }
    next();
}, exigirLogin, async (req, res) => {`;

if (text.includes(old)) {
    fs.writeFileSync(path, text.replace(old, replacement), "utf8");
    console.log("Rota da EXPEC ajustada: usuários sem sessão serão enviados ao login.");
} else {
    console.log("Rota da EXPEC já está ajustada ou não foi encontrada.");
}
