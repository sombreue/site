const path = require("path");

module.exports = function registrarFilaSaidas(app, pool, exigirLogin, exigirAdmin) {
    let inicializacao;

    function garantirTabelas() {
        if (!inicializacao) {
            inicializacao = (async () => {
                await pool.query(\`
                    CREATE TABLE IF NOT EXISTS professores_fila (
                        usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
                        autorizado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
                        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                \`);
                await pool.query(\`
                    CREATE TABLE IF NOT EXISTS filas_saidas (
                        id BIGSERIAL PRIMARY KEY,
                        professor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                        turma VARCHAR(80) NOT NULL,
                        ativa BOOLEAN NOT NULL DEFAULT TRUE,
                        criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        encerrada_em TIMESTAMPTZ
                    )
                \`);
                await pool.query(\`
                    CREATE UNIQUE INDEX IF NOT EXISTS filas_saidas_uma_ativa_por_turma
                    ON filas_saidas (professor_id, LOWER(turma)) WHERE ativa = TRUE
                \`);
                await pool.query(\`
                    CREATE TABLE IF NOT EXISTS fila_saidas_pedidos (
                        id BIGSERIAL PRIMARY KEY,
                        fila_id BIGINT NOT NULL REFERENCES filas_saidas(id) ON DELETE CASCADE,
                        aluno VARCHAR(100) NOT NULL,
                        motivo VARCHAR(20) NOT NULL CHECK (motivo IN ('banheiro', 'agua')),
                        estado VARCHAR(20) NOT NULL DEFAULT 'aguardando'
                            CHECK (estado IN ('aguardando', 'fora', 'voltou', 'cancelado')),
                        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        saiu_em TIMESTAMPTZ,
                        voltou_em TIMESTAMPTZ
                    )
                \`);
                await pool.query(\`
                    CREATE INDEX IF NOT EXISTS fila_saidas_pedidos_ordem
                    ON fila_saidas_pedidos (fila_id, criado_em, id)
                \`);
            })().catch(erro => {
                inicializacao = null;
                throw erro;
            });
        }
        return inicializacao;
    }

    const middlewareTabelas = (req, res, next) =>
        garantirTabelas().then(() => next()).catch(erro => {
            console.error("Erro ao preparar tabelas da fila de saídas:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Não foi possível preparar a fila agora." });
        });

    async function professorAutorizado(usuarioId) {
        const r = await pool.query(
            "SELECT tipo FROM usuarios WHERE id = $1",
            [usuarioId]
        );
        if (!r.rows.length) return false;
        if (r.rows[0].tipo === "admin") return true;
        const p = await pool.query("SELECT 1 FROM professores_fila WHERE usuario_id = $1", [usuarioId]);
        return p.rowCount > 0;
    }

    function exigirProfessor(req, res, next) {
        middlewareTabelas(req, res, async () => {
            try {
                if (!(await professorAutorizado(req.session.usuario.id))) {
                    return res.status(403).json({
                        sucesso: false,
                        mensagem: "A fila está disponível apenas para professores autorizados. Peça ao administrador para liberar sua conta."
                    });
                }
                next();
            } catch (erro) {
                console.error("Erro ao verificar permissão da fila:", erro);
                res.status(500).json({ sucesso: false, mensagem: "Não foi possível verificar sua permissão." });
            }
        });
    }

    app.get("/fila-saidas.html", exigirLogin, middlewareTabelas, async (req, res) => {
        try {
            if (!(await professorAutorizado(req.session.usuario.id))) {
                return res.status(403).send("Acesso restrito: sua conta ainda não foi autorizada para usar a fila de saídas.");
            }
            res.set({
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            });
            res.sendFile(path.join(__dirname, "public", "fila-saidas.html"));
        } catch (erro) {
            console.error("Erro ao abrir fila de saídas:", erro);
            res.status(500).send("Não foi possível abrir a fila agora.");
        }
    });

    app.get("/api/fila/status", exigirLogin, middlewareTabelas, async (req, res) => {
        try {
            const autorizado = await professorAutorizado(req.session.usuario.id);
            res.set("Cache-Control", "no-store");
            res.json({ sucesso: true, autorizado, admin: req.session.usuario.tipo === "admin" });
        } catch (erro) {
            console.error("Erro ao consultar acesso à fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao consultar acesso." });
        }
    });

    app.get("/api/fila/admin/professores", exigirAdmin, middlewareTabelas, async (req, res) => {
        try {
            const r = await pool.query(\`
                SELECT u.id, u.usuario,
                       (p.usuario_id IS NOT NULL OR u.tipo = 'admin') AS autorizado,
                       p.criado_em AS "autorizadoEm"
                FROM usuarios u
                LEFT JOIN professores_fila p ON p.usuario_id = u.id
                ORDER BY u.usuario ASC
            \`);
            res.json({ sucesso: true, usuarios: r.rows });
        } catch (erro) {
            console.error("Erro ao listar permissões da fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao listar professores." });
        }
    });

    app.put("/api/fila/admin/professores/:id", exigirAdmin, middlewareTabelas, async (req, res) => {
        try {
            const id = Number(req.params.id);
            const autorizado = req.body?.autorizado;
            if (!Number.isSafeInteger(id) || id <= 0 || typeof autorizado !== "boolean") {
                return res.status(400).json({ sucesso: false, mensagem: "Dados de autorização inválidos." });
            }
            const usuario = await pool.query("SELECT id, tipo FROM usuarios WHERE id = $1", [id]);
            if (!usuario.rowCount) return res.status(404).json({ sucesso: false, mensagem: "Conta não encontrada." });
            if (usuario.rows[0].tipo === "admin") {
                return res.status(400).json({ sucesso: false, mensagem: "Contas administrativas já têm acesso e não precisam dessa autorização." });
            }
            if (autorizado) {
                await pool.query(
                    "INSERT INTO professores_fila (usuario_id, autorizado_por) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET autorizado_por = EXCLUDED.autorizado_por",
                    [id, req.session.usuario.id]
                );
            } else {
                await pool.query("DELETE FROM professores_fila WHERE usuario_id = $1", [id]);
            }
            res.json({ sucesso: true });
        } catch (erro) {
            console.error("Erro ao alterar autorização da fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao alterar autorização." });
        }
    });

    app.get("/api/fila", exigirLogin, exigirProfessor, async (req, res) => {
        try {
            const turma = String(req.query.turma || "").trim();
            if (!turma || turma.length > 80) {
                return res.status(400).json({ sucesso: false, mensagem: "Informe uma turma válida." });
            }
            const fila = await pool.query(
                \`SELECT id, professor_id AS "professorId", turma, ativa,
                        criada_em AS "criadaEm", encerrada_em AS "encerradaEm"
                 FROM filas_saidas
                 WHERE professor_id = $1 AND LOWER(turma) = LOWER($2) AND ativa = TRUE
                 ORDER BY id DESC LIMIT 1\`,
                [req.session.usuario.id, turma]
            );
            if (!fila.rowCount) return res.json({ sucesso: true, fila: null, pedidos: [] });
            const pedidos = await pool.query(
                \`SELECT id, aluno, motivo, estado, criado_em AS "criadoEm",
                        saiu_em AS "saiuEm", voltou_em AS "voltouEm"
                 FROM fila_saidas_pedidos
                 WHERE fila_id = $1 AND estado <> 'cancelado'
                 ORDER BY criado_em ASC, id ASC\`,
                [fila.rows[0].id]
            );
            res.set("Cache-Control", "no-store");
            res.json({ sucesso: true, fila: fila.rows[0], pedidos: pedidos.rows });
        } catch (erro) {
            console.error("Erro ao buscar fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao carregar a fila." });
        }
    });

    app.post("/api/fila/iniciar", exigirLogin, exigirProfessor, async (req, res) => {
        const turma = typeof req.body?.turma === "string" ? req.body.turma.trim() : "";
        if (!turma || turma.length > 80) {
            return res.status(400).json({ sucesso: false, mensagem: "Digite o nome da turma (até 80 caracteres)." });
        }
        try {
            const r = await pool.query(
                \`INSERT INTO filas_saidas (professor_id, turma)
                 VALUES ($1, $2)
                 ON CONFLICT (professor_id, LOWER(turma)) WHERE ativa = TRUE
                 DO UPDATE SET turma = EXCLUDED.turma
                 RETURNING id, professor_id AS "professorId", turma, ativa,
                           criada_em AS "criadaEm"\`,
                [req.session.usuario.id, turma]
            );
            res.status(201).json({ sucesso: true, fila: r.rows[0] });
        } catch (erro) {
            console.error("Erro ao iniciar fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao iniciar a fila." });
        }
    });

    app.post("/api/fila/:filaId/pedidos", exigirLogin, exigirProfessor, async (req, res) => {
        const filaId = Number(req.params.filaId);
        const aluno = typeof req.body?.aluno === "string" ? req.body.aluno.trim() : "";
        const motivo = req.body?.motivo;
        if (!Number.isSafeInteger(filaId) || filaId <= 0 || !aluno || aluno.length > 100 ||
            !["banheiro", "agua"].includes(motivo)) {
            return res.status(400).json({ sucesso: false, mensagem: "Confira o nome do aluno e o tipo de saída." });
        }
        try {
            const fila = await pool.query(
                "SELECT id FROM filas_saidas WHERE id = $1 AND professor_id = $2 AND ativa = TRUE",
                [filaId, req.session.usuario.id]
            );
            if (!fila.rowCount) return res.status(404).json({ sucesso: false, mensagem: "Fila ativa não encontrada." });
            const r = await pool.query(
                \`INSERT INTO fila_saidas_pedidos (fila_id, aluno, motivo)
                 VALUES ($1, $2, $3)
                 RETURNING id, aluno, motivo, estado, criado_em AS "criadoEm", saiu_em AS "saiuEm", voltou_em AS "voltouEm"\`,
                [filaId, aluno, motivo]
            );
            res.status(201).json({ sucesso: true, pedido: r.rows[0] });
        } catch (erro) {
            console.error("Erro ao adicionar aluno à fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao adicionar aluno." });
        }
    });

    app.patch("/api/fila/:filaId/pedidos/:pedidoId", exigirLogin, exigirProfessor, async (req, res) => {
        const filaId = Number(req.params.filaId);
        const pedidoId = Number(req.params.pedidoId);
        const estado = req.body?.estado;
        if (!Number.isSafeInteger(filaId) || !Number.isSafeInteger(pedidoId) ||
            !["fora", "voltou", "cancelado"].includes(estado)) {
            return res.status(400).json({ sucesso: false, mensagem: "Ação inválida." });
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const dono = await client.query(
                "SELECT id FROM filas_saidas WHERE id = $1 AND professor_id = $2 AND ativa = TRUE FOR UPDATE",
                [filaId, req.session.usuario.id]
            );
            if (!dono.rowCount) {
                await client.query("ROLLBACK");
                return res.status(404).json({ sucesso: false, mensagem: "Fila ativa não encontrada." });
            }
            const pedido = await client.query(
                "SELECT id, estado FROM fila_saidas_pedidos WHERE id = $1 AND fila_id = $2 FOR UPDATE",
                [pedidoId, filaId]
            );
            if (!pedido.rowCount || pedido.rows[0].estado === "cancelado") {
                await client.query("ROLLBACK");
                return res.status(404).json({ sucesso: false, mensagem: "Pedido não encontrado." });
            }
            if (estado === "fora") {
                const alguemFora = await client.query(
                    "SELECT id FROM fila_saidas_pedidos WHERE fila_id = $1 AND estado = 'fora' AND id <> $2 LIMIT 1",
                    [filaId, pedidoId]
                );
                if (alguemFora.rowCount) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ sucesso: false, mensagem: "Já existe um aluno fora. Registre o retorno antes de liberar o próximo." });
                }
                if (pedido.rows[0].estado !== "aguardando") {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ sucesso: false, mensagem: "Esse aluno não está aguardando na fila." });
                }
                const primeiro = await client.query(
                    "SELECT id FROM fila_saidas_pedidos WHERE fila_id = $1 AND estado = 'aguardando' ORDER BY criado_em ASC, id ASC LIMIT 1",
                    [filaId]
                );
                if (!primeiro.rowCount || Number(primeiro.rows[0].id) !== pedidoId) {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ sucesso: false, mensagem: "A ordem da fila deve ser respeitada: libere primeiro o próximo aluno." });
                }
                await client.query(
                    "UPDATE fila_saidas_pedidos SET estado = 'fora', saiu_em = NOW() WHERE id = $1",
                    [pedidoId]
                );
            } else if (estado === "voltou") {
                if (pedido.rows[0].estado !== "fora") {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ sucesso: false, mensagem: "Só é possível registrar o retorno de um aluno que está fora." });
                }
                await client.query(
                    "UPDATE fila_saidas_pedidos SET estado = 'voltou', voltou_em = NOW() WHERE id = $1",
                    [pedidoId]
                );
            } else {
                if (pedido.rows[0].estado === "fora") {
                    await client.query("ROLLBACK");
                    return res.status(409).json({ sucesso: false, mensagem: "Registre o retorno antes de cancelar o pedido." });
                }
                await client.query("UPDATE fila_saidas_pedidos SET estado = 'cancelado' WHERE id = $1", [pedidoId]);
            }
            await client.query("COMMIT");
            res.json({ sucesso: true });
        } catch (erro) {
            await client.query("ROLLBACK").catch(() => {});
            console.error("Erro ao atualizar pedido da fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar o pedido." });
        } finally {
            client.release();
        }
    });

    app.post("/api/fila/:filaId/encerrar", exigirLogin, exigirProfessor, async (req, res) => {
        const filaId = Number(req.params.filaId);
        if (!Number.isSafeInteger(filaId) || filaId <= 0) {
            return res.status(400).json({ sucesso: false, mensagem: "Fila inválida." });
        }
        try {
            const r = await pool.query(
                \`UPDATE filas_saidas SET ativa = FALSE, encerrada_em = NOW()
                 WHERE id = $1 AND professor_id = $2 AND ativa = TRUE
                 RETURNING id\`,
                [filaId, req.session.usuario.id]
            );
            if (!r.rowCount) return res.status(404).json({ sucesso: false, mensagem: "Fila ativa não encontrada." });
            res.json({ sucesso: true });
        } catch (erro) {
            console.error("Erro ao encerrar fila:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao encerrar a fila." });
        }
    });
};
