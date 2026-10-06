require("dotenv").config();

const Database = require("better-sqlite3");
const { Pool } = require("pg");

const path = require("path");


// =========================
// CONFIGURAÇÕES
// =========================

const sqlitePath = path.join(
    __dirname,
    "database",
    "tarefas.db"
);

const sqlite = new Database(sqlitePath);


if (!process.env.DATABASE_URL) {

    console.error(
        "ERRO: DATABASE_URL não encontrada no arquivo .env"
    );

    process.exit(1);

}


const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }

});


// =========================
// MIGRAÇÃO
// =========================

async function migrar() {

    const client =
        await pool.connect();


    try {

        console.log(
            "\n================================"
        );

        console.log(
            "INICIANDO MIGRAÇÃO"
        );

        console.log(
            "================================\n"
        );


        // =========================
        // CRIAR TABELAS
        // =========================

        console.log(
            "Criando tabelas no PostgreSQL..."
        );


        await client.query(`

            CREATE TABLE IF NOT EXISTS usuarios (

                id SERIAL PRIMARY KEY,

                usuario TEXT NOT NULL UNIQUE,

                senha TEXT NOT NULL,

                tipo TEXT NOT NULL
                    CHECK (
                        tipo IN ('admin', 'usuario')
                    )

            );

        `);


        await client.query(`

            CREATE TABLE IF NOT EXISTS tarefas (

                id SERIAL PRIMARY KEY,

                data TEXT NOT NULL,

                materia TEXT NOT NULL,

                descricao TEXT NOT NULL DEFAULT '',

                subtitulo TEXT,

                data_entrega TEXT

            );

        `);


        await client.query(`ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS subtitulo TEXT;`);

        console.log(
            "Tabelas criadas.\n"
        );


        // =========================
        // LER USUÁRIOS
        // =========================

        const usuarios =
            sqlite.prepare(`
                SELECT
                    id,
                    usuario,
                    senha,
                    tipo
                FROM usuarios
                ORDER BY id ASC
            `).all();


        console.log(
            `Usuários encontrados: ${usuarios.length}`
        );


        // =========================
        // MIGRAR USUÁRIOS
        // =========================

        for (
            const usuario of usuarios
        ) {

            await client.query(`

                INSERT INTO usuarios (
                    id,
                    usuario,
                    senha,
                    tipo
                )

                VALUES ($1, $2, $3, $4)

                ON CONFLICT (usuario)
                DO UPDATE SET

                    senha = EXCLUDED.senha,

                    tipo = EXCLUDED.tipo

            `, [

                usuario.id,

                usuario.usuario,

                usuario.senha,

                usuario.tipo

            ]);

        }


        console.log(
            "Usuários migrados.\n"
        );


        // =========================
        // LER TAREFAS
        // =========================

        const tarefas =
            sqlite.prepare(`
                SELECT
                    id,
                    data,
                    materia,
                    descricao
                FROM tarefas
                ORDER BY id ASC
            `).all();


        console.log(
            `Tarefas encontradas: ${tarefas.length}`
        );


        // =========================
        // MIGRAR TAREFAS
        // =========================

        for (
            const tarefa of tarefas
        ) {

            const existente =
                await client.query(`

                    SELECT id

                    FROM tarefas

                    WHERE id = $1

                `, [

                    tarefa.id

                ]);


            if (
                existente.rows.length === 0
            ) {

                await client.query(`

                    INSERT INTO tarefas (
                        id,
                        data,
                        materia,
                        descricao,
                        subtitulo,
                        data_entrega
                    )

                    VALUES ($1, $2, $3, $4, $5)

                `, [

                    tarefa.id,

                    tarefa.data,

                    tarefa.materia,

                    tarefa.descricao,

                    null,

                    tarefa.data

                ]);

            }

        }


        console.log(
            "Tarefas migradas.\n"
        );


        // =========================
        // CORRIGIR SEQUÊNCIAS
        // =========================

        await client.query(`

            SELECT setval(
                pg_get_serial_sequence(
                    'usuarios',
                    'id'
                ),

                COALESCE(
                    (
                        SELECT MAX(id)
                        FROM usuarios
                    ),
                    1
                ),

                true
            );

        `);


        await client.query(`

            SELECT setval(
                pg_get_serial_sequence(
                    'tarefas',
                    'id'
                ),

                COALESCE(
                    (
                        SELECT MAX(id)
                        FROM tarefas
                    ),
                    1
                ),

                true
            );

        `);


        // =========================
        // VERIFICAÇÃO
        // =========================

        const totalUsuarios =
            await client.query(`
                SELECT COUNT(*) AS total
                FROM usuarios
            `);


        const totalTarefas =
            await client.query(`
                SELECT COUNT(*) AS total
                FROM tarefas
            `);


        console.log(
            "================================"
        );

        console.log(
            "MIGRAÇÃO CONCLUÍDA!"
        );

        console.log(
            "================================"
        );


        console.log(
            `Usuários no Neon: ${totalUsuarios.rows[0].total}`
        );


        console.log(
            `Tarefas no Neon: ${totalTarefas.rows[0].total}`
        );


        console.log(
            "\nSeu database/tarefas.db original NÃO foi alterado."
        );


    } catch (erro) {

        console.error(
            "\nERRO DURANTE A MIGRAÇÃO:"
        );

        console.error(
            erro
        );


    } finally {

        client.release();

        await pool.end();

        sqlite.close();

    }

}


migrar();