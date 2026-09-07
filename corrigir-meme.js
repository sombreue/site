const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

const correcoes = [
    ["AS \"postLink\"", "AS \\\"postLink\\\""],
    ["AS \"title\"", "AS \\\"title\\\""],
    ["AS \"author\"", "AS \\\"author\\\""]
];

for (const [errado, correto] of correcoes) {
    text = text.split(errado).join(correto);
}

fs.writeFileSync(path, text, "utf8");
console.log("Aspas da API de memes corrigidas no server.js.");
