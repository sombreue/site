require("dotenv").config();

// Entrada compatível com Render e com execução local.
// O registro de login fica diretamente no server.js, onde a autenticação realmente acontece.
console.log("[START] Carregando aplicação...");
require("./server-sugestoes.js");
console.log("[START] Módulo principal carregado.");
