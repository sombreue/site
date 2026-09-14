// Pré-carregado pelo Node antes do server.js no Render.
// Isso permite manter o Start Command existente (node server.js)
// enquanto aplica as correções necessárias antes da aplicação ser carregada.

function executar(nome, funcao) {
    try {
        funcao();
    } catch (erro) {
        console.error(`Erro ao executar ${nome}:`, erro);
        throw erro;
    }
}

executar("correção da API da EXPEC", () => {
    // O fix-expec-api.js antigo usa process.exit(0) quando já está corrigido.
    // Durante o preload isso deve significar apenas "não há nada a fazer".
    const exitOriginal = process.exit;
    process.exit = function() {};
    try {
        require("./fix-expec-api.js");
    } finally {
        process.exit = exitOriginal;
    }
});

executar("correção de sessão", () => {
    require("./fix-session.js");
});

executar("correção do cliente EXPEC", () => {
    require("./fix-expec-client.js");
});

console.log("Preload da EXPEC concluído.");
