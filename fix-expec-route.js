const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

const old = 'app.get("/expec.html", exigirLogin, async (req, res) => {';
const replacement = `app.get("/expec.html", async (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect("/login.html");
    }
    next();
}, exigirLogin, async (req, res) => {`;

if (text.includes(old)) {
    text = text.replace(old, replacement);
    console.log("Rota da EXPEC ajustada: usuários sem sessão serão enviados ao login.");
} else {
    console.log("Rota da EXPEC já está ajustada ou não foi encontrada.");
}

const marcadorSugestoes = "// =========================\n// SUGESTÕES DOS COLEGAS\n// =========================";

if (!text.includes(marcadorSugestoes)) {
    const rotasSugestoes = `

${marcadorSugestoes}

app.post("/api/sugestoes", exigirLogin, async (req, res) => {
    try {
        const nome = String(req.body.nome || "").trim();
        const sugestao = String(req.body.sugestao || "").trim();

        if (!nome || !sugestao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha seu nome e a sugestão."
            });
        }

        if (nome.length > 80 || sugestao.length > 1000) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "A sugestão ou o nome ultrapassou o limite permitido."
            });
        }

        await pool.query(
            "CREATE TABLE IF NOT EXISTS sugestoes (" +
            "id SERIAL PRIMARY KEY, " +
            "nome TEXT NOT NULL, " +
            "sugestao TEXT NOT NULL, " +
            "data TIMESTAMPTZ NOT NULL DEFAULT NOW()" +
            ")"
        );

        await pool.query(
            "INSERT INTO sugestoes (nome, sugestao) VALUES ($1, $2)",
            [nome, sugestao]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: "Sugestão enviada com sucesso!"
        });
    } catch (erro) {
        console.error("Erro ao salvar sugestão:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});

app.get("/api/sugestoes", exigirAdmin, async (req, res) => {
    try {
        await pool.query(
            "CREATE TABLE IF NOT EXISTS sugestoes (" +
            "id SERIAL PRIMARY KEY, " +
            "nome TEXT NOT NULL, " +
            "sugestao TEXT NOT NULL, " +
            "data TIMESTAMPTZ NOT NULL DEFAULT NOW()" +
            ")"
        );

        const resultado = await pool.query(
            "SELECT id, nome, sugestao, data " +
            "FROM sugestoes ORDER BY data DESC, id DESC"
        );

        res.json({
            sucesso: true,
            sugestoes: resultado.rows
        });
    } catch (erro) {
        console.error("Erro ao carregar sugestões:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});

app.delete("/api/sugestoes/:id", exigirAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "ID inválido."
            });
        }

        const resultado = await pool.query(
            "DELETE FROM sugestoes WHERE id = $1",
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sugestão não encontrada."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Sugestão excluída."
        });
    } catch (erro) {
        console.error("Erro ao excluir sugestão:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});
`;

    const marcadorServidor = "// =========================\n// INICIAR SERVIDOR\n// =========================";

    if (!text.includes(marcadorServidor)) {
        throw new Error("Não foi encontrado o ponto seguro para inserir as rotas de sugestões.");
    }

    text = text.replace(marcadorServidor, rotasSugestoes + "\n\n" + marcadorServidor);
    console.log("Rotas da API de sugestões adicionadas ao server.js.");
} else {
    console.log("Rotas da API de sugestões já estão presentes no server.js.");
}

const marcadorMeme = "// =========================\n// MEME AUTOMÁTICO\n// =========================";

if (!text.includes(marcadorMeme)) {
    const rotasMeme = `

${marcadorMeme}

app.get("/api/meme-do-dia", async (req, res) => {
    try {
        await pool.query(
            "CREATE TABLE IF NOT EXISTS meme_do_dia (" +
            "data DATE PRIMARY KEY, " +
            "post_link TEXT NOT NULL, " +
            "subreddit TEXT NOT NULL, " +
            "titulo TEXT NOT NULL, " +
            "url TEXT NOT NULL, " +
            "autor TEXT, " +
            "ups INTEGER DEFAULT 0" +
            ")"
        );

        const dataHoje = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Fortaleza",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const existente = await pool.query(
            "SELECT data, post_link AS \"postLink\", subreddit, titulo AS title, url, autor AS author, ups " +
            "FROM meme_do_dia WHERE data = $1",
            [dataHoje]
        );

        if (existente.rows.length > 0) {
            return res.json({ sucesso: true, meme: existente.rows[0] });
        }

        let respostaApi;
        let dadosApi;
        let tentativas = 0;

        while (tentativas < 3) {
            tentativas++;
            respostaApi = await fetch("https://meme-api.com/gimme/MemesBrasil/10", {
                headers: { "User-Agent": "agenda-de-casa/1.0" }
            });

            if (!respostaApi.ok) {
                throw new Error("Meme API respondeu com HTTP " + respostaApi.status);
            }

            dadosApi = await respostaApi.json();
            const memes = Array.isArray(dadosApi.memes) ? dadosApi.memes : [];
            const seguros = memes.filter(meme =>
                meme &&
                meme.url &&
                /^https?:\\/\\//i.test(String(meme.url)) &&
                meme.nsfw !== true &&
                meme.spoiler !== true
            );

            if (seguros.length > 0) {
                const meme = seguros[Math.floor(Math.random() * seguros.length)];

                await pool.query(
                    "INSERT INTO meme_do_dia (data, post_link, subreddit, titulo, url, autor, ups) " +
                    "VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (data) DO NOTHING",
                    [
                        dataHoje,
                        String(meme.postLink || "https://www.reddit.com/r/MemesBrasil/"),
                        String(meme.subreddit || "MemesBrasil"),
                        String(meme.title || "Meme"),
                        String(meme.url),
                        String(meme.author || ""),
                        Number.isFinite(Number(meme.ups)) ? Number(meme.ups) : 0
                    ]
                );

                const salvo = await pool.query(
                    "SELECT data, post_link AS \"postLink\", subreddit, titulo AS title, url, autor AS author, ups " +
                    "FROM meme_do_dia WHERE data = $1",
                    [dataHoje]
                );

                return res.json({ sucesso: true, meme: salvo.rows[0] });
            }
        }

        throw new Error("A Meme API não retornou uma mídia segura disponível.");
    } catch (erro) {
        console.error("Erro ao carregar meme do dia:", erro);

        try {
            const fallback = await pool.query(
                "SELECT data, post_link AS \"postLink\", subreddit, titulo AS title, url, autor AS author, ups " +
                "FROM meme_do_dia ORDER BY data DESC LIMIT 1"
            );

            if (fallback.rows.length > 0) {
                return res.json({ sucesso: true, meme: fallback.rows[0], fallback: true });
            }
        } catch (erroFallback) {
            console.error("Erro ao buscar fallback do meme:", erroFallback);
        }

        res.status(503).json({
            sucesso: false,
            mensagem: "Meme indisponível no momento."
        });
    }
});
`;

    const marcadorServidorMeme = "// =========================\n// INICIAR SERVIDOR\n// =========================";

    if (!text.includes(marcadorServidorMeme)) {
        throw new Error("Não foi encontrado o ponto seguro para inserir a API do meme.");
    }

    text = text.replace(marcadorServidorMeme, rotasMeme + "\n\n" + marcadorServidorMeme);
    console.log("API do meme automático adicionada ao server.js.");
} else {
    console.log("API do meme automático já está presente no server.js.");
}

fs.writeFileSync(path, text, "utf8");
