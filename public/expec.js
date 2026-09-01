async function carregarEquipes() {

    try {

        const resposta = await fetch("/api/feira/equipes");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar equipes.");
        }

        const equipes = await resposta.json();

        const lista = document.getElementById("listaEquipes");

        lista.innerHTML = "";

        if (equipes.length === 0) {

            lista.innerHTML = `
                <p>Nenhuma equipe cadastrada ainda.</p>
            `;

            return;
        }

        equipes.forEach(equipe => {

            const card = document.createElement("div");

            card.className = "equipe";

            card.innerHTML = `
                <h3>${equipe.nome}</h3>

                <p>
                    <strong>Tema:</strong>
                    ${equipe.tema}
                </p>

                <p>
                    <strong>Professor:</strong>
                    ${equipe.professor || "Não informado"}
                </p>

                <p>
                    <strong>Integrantes:</strong>
                    ${equipe.integrantes || "Não informados"}
                </p>
            `;

            lista.appendChild(card);
        });

    } catch (erro) {

        console.error(erro);

        document.getElementById("listaEquipes").innerHTML = `
            <p>Não foi possível carregar as equipes.</p>
        `;
    }
}


carregarEquipes();
