(() => {
    const container = document.getElementById("meme-do-dia");
    if (!container) return;

    function escaparHtml(valor) {
        return String(valor || "").replace(/[&<>\"]/g, caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;"
        })[caractere]);
    }

    function renderizarMeme(meme) {
        const url = String(meme.url || "");
        const titulo = escaparHtml(meme.title || "Meme");
        const postLink = escaparHtml(meme.postLink || "https://www.reddit.com/r/MemesBrasil/");
        const lowerUrl = url.toLowerCase().split("?")[0];
        const isVideo = /\.(mp4|webm|mov|m4v)(?:$|\.)/.test(lowerUrl) || url.includes("v.redd.it");

        if (!/^https?:\/\//i.test(url)) {
            throw new Error("Mídia inválida recebida da API.");
        }

        const media = isVideo
            ? `<video class="meme-do-dia-midia" src="${escaparHtml(url)}" controls playsinline preload="metadata" aria-label="${titulo}"></video>`
            : `<img class="meme-do-dia-midia" src="${escaparHtml(url)}" alt="${titulo}" loading="eager" referrerpolicy="no-referrer">`;

        container.innerHTML = `
            ${media}
            <a class="meme-do-dia-link" href="${postLink}" target="_blank" rel="noopener noreferrer">Ver no Reddit</a>
        `;
        container.classList.add("carregado");
    }

    async function carregarMeme() {
        try {
            const resposta = await fetch("/api/meme-do-dia", {
                headers: { Accept: "application/json" },
                cache: "no-store"
            });
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso || !dados.meme) {
                throw new Error(dados.mensagem || "Não foi possível carregar o meme.");
            }
            renderizarMeme(dados.meme);
        } catch (erro) {
            console.warn("Meme do dia indisponível:", erro);
            container.innerHTML = "";
            container.classList.add("indisponivel");
        }
    }

    carregarMeme();
})();
