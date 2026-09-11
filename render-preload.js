const expressPath = require.resolve("express");
const expressOriginal = require(expressPath);
const apps = [];

function expressCapturado(...args) {
    const app = expressOriginal(...args);
    apps.push(app);
    return app;
}

Object.assign(expressCapturado, expressOriginal);
require.cache[expressPath].exports = expressCapturado;

process.nextTick(() => {
    const app = apps[0];
    if (app) console.log("Servidor principal localizado pelo preload.");
});
