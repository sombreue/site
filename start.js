require("dotenv").config();

// Entrada única da aplicação. O servidor principal registra todas as APIs e inicia o Express.
console.log("[START] Carregando aplicação...");
require("./server.js");
