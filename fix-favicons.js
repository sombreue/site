const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "public");
const faviconTags = '<link rel="icon" href="/favicon.ico?v=20260914" type="image/x-icon">\n    <link rel="shortcut icon" href="/favicon.ico?v=20260914" type="image/x-icon">';

if (fs.existsSync(publicDir)) {
    for (const nome of fs.readdirSync(publicDir)) {
        if (!nome.toLowerCase().endsWith(".html")) continue;
        const arquivo = path.join(publicDir, nome);
        let html = fs.readFileSync(arquivo, "utf8");
        const original = html;

        html = html.replace(/\s*<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/gi, "");
        html = html.replace(/(<head[^>]*>)/i, `$1\n    ${faviconTags}`);

        if (html !== original) {
            fs.writeFileSync(arquivo, html, "utf8");
            console.log(`Favicon corrigido: ${nome}`);
        }
    }
}
