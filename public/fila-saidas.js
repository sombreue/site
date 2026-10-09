(() => {
    const $ = id => document.getElementById(id);
    const aviso = (mensagem, tipo = "") => {
        $("aviso").textContent = mensagem || "";
        $("aviso").className = "aviso" + (tipo ? " " + tipo : "");
    };
    const escapar = valor => String(valor ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const hora = valor => valor ? new Date(valor).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"}) : "";
    const api = async (url, opcoes = {}) => {
        const resposta = await fetch(url, {
            credentials: "same-origin",
            headers: {"Content-Type":"application/json", ...(opcoes.headers || {})},
            ...opcoes
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok || dados.sucesso === false) throw new Error(dados.mensagem || "Não foi possível concluir a operação.");
        return dados;
    };
    let filaAtual = null;
    let pedidosAtuais = [];
    let turmaAtual = "";

    async function carregarFila() {
        if (!turmaAtual) return;
        try {
            const dados = await api("/api/fila?turma=" + encodeURIComponent(turmaAtual));
            filaAtual = dados.fila;
            pedidosAtuais = dados.pedidos || [];
            $("painel-ativa").hidden = !filaAtual;
            $("titulo-turma").textContent = filaAtual ? filaAtual.turma : "";
            $("resumo-fila").textContent = filaAtual ? "Fila iniciada às " + hora(filaAtual.criadaEm) : "";
            $("form-turma").hidden = !!filaAtual;
            renderizarFila();
        } catch (erro) { aviso(erro.message, "erro"); }
    }

    function renderizarFila() {
        const fora = pedidosAtuais.find(p => p.estado === "fora");
        $("aluno-fora").hidden = !fora;
        $("aluno-fora").innerHTML = fora ? `<strong>Fora da sala: ${escapar(fora.aluno)}</strong><span class="detalhe-aluno">${fora.motivo === "agua" ? "Beber água" : "Banheiro"} · saiu às ${hora(fora.saiuEm)}</span><div class="acoes"><button type="button" data-acao="voltou" data-id="${fora.id}">Registrar retorno</button></div>` : "";
        const aguardando = pedidosAtuais.filter(p => p.estado === "aguardando");
        $("lista-fila").innerHTML = aguardando.map((p, i) => `<li class="item-fila"><span class="numero-fila">${i + 1}º</span><div class="dados-aluno"><strong>${escapar(p.aluno)}</strong><span class="detalhe-aluno">Entrou às ${hora(p.criadoEm)}</span><span class="motivo">${p.motivo === "agua" ? "Beber água" : "Banheiro"}</span></div><div class="acoes"><button type="button" data-acao="fora" data-id="${p.id}" ${fora || i !== 0 ? "disabled" : ""}>${i === 0 ? "Liberar saída" : "Aguardar"}</button><button type="button" class="botao-cancelar" data-acao="cancelado" data-id="${p.id}">Remover</button></div></li>`).join("");
        const voltaram = pedidosAtuais.filter(p => p.estado === "voltou");
        $("fila-vazia").hidden = aguardando.length > 0 || !!fora;
        if (voltaram.length) {
            const resumo = document.createElement("p");
            resumo.className = "ajuda";
            resumo.textContent = "Já retornaram nesta aula: " + voltaram.map(p => p.aluno).join(", ");
            $("lista-fila").appendChild(resumo);
        }
        $("resumo-fila").textContent = filaAtual ? `${aguardando.length} aguardando · ${fora ? "1 aluno fora" : "ninguém fora"}` : "";
    }

    $("form-turma").addEventListener("submit", async e => {
        e.preventDefault();
        const turma = $("turma").value.trim();
        if (!turma) return;
        try {
            const dados = await api("/api/fila/iniciar", {method:"POST", body:JSON.stringify({turma})});
            turmaAtual = dados.fila.turma;
            $("turma").value = turmaAtual;
            aviso("Fila aberta para " + turmaAtual + ".", "sucesso");
            await carregarFila();
        } catch (erro) { aviso(erro.message, "erro"); }
    });

    $("form-aluno").addEventListener("submit", async e => {
        e.preventDefault();
        if (!filaAtual) return;
        const aluno = $("aluno").value.trim();
        if (!aluno) return;
        try {
            await api("/api/fila/" + filaAtual.id + "/pedidos", {method:"POST", body:JSON.stringify({aluno, motivo:$("motivo").value})});
            $("aluno").value = "";
            $("aluno").focus();
            aviso(aluno + " entrou no fim da fila.", "sucesso");
            await carregarFila();
        } catch (erro) { aviso(erro.message, "erro"); }
    });

    $("lista-fila").addEventListener("click", executarAcao);
    $("aluno-fora").addEventListener("click", executarAcao);
    async function executarAcao(e) {
        const botao = e.target.closest("button[data-acao]");
        if (!botao || !filaAtual) return;
        const {acao, id} = botao.dataset;
        try {
            await api("/api/fila/" + filaAtual.id + "/pedidos/" + id, {method:"PATCH", body:JSON.stringify({estado:acao})});
            aviso(acao === "fora" ? "Saída registrada." : acao === "voltou" ? "Retorno registrado." : "Pedido removido da fila.", "sucesso");
            await carregarFila();
        } catch (erro) { aviso(erro.message, "erro"); }
    }

    $("atualizar-fila").addEventListener("click", carregarFila);
    $("encerrar-fila").addEventListener("click", async () => {
        if (!filaAtual || !confirm("Encerrar a fila desta turma? Os registros desta aula ficarão no histórico do sistema.")) return;
        try {
            await api("/api/fila/" + filaAtual.id + "/encerrar", {method:"POST", body:"{}"});
            filaAtual = null;
            pedidosAtuais = [];
            aviso("Fila encerrada.", "sucesso");
            $("painel-ativa").hidden = true;
            $("form-turma").hidden = false;
            $("turma").value = turmaAtual;
        } catch (erro) { aviso(erro.message, "erro"); }
    });

    async function carregarProfessores() {
        try {
            const dados = await api("/api/fila/admin/professores");
            $("lista-professores").innerHTML = dados.usuarios.map(u => `<div class="professor-item"><span><strong>${escapar(u.usuario)}</strong>${u.tipo === "admin" ? " · administrador" : u.autorizado ? " · autorizado" : " · sem acesso"}</span><button type="button" data-usuario="${u.id}" data-autorizado="${u.autorizado ? "false" : "true"}" ${u.tipo === "admin" ? "disabled" : ""}>${u.tipo === "admin" ? "Acesso administrativo" : u.autorizado ? "Remover acesso" : "Autorizar"}</button></div>`).join("");
            $("lista-professores").querySelectorAll("button[data-usuario]").forEach(b => b.addEventListener("click", async () => {
                try {
                    await api("/api/fila/admin/professores/" + b.dataset.usuario, {method:"PUT", body:JSON.stringify({autorizado:b.dataset.autorizado === "true"})});
                    aviso("Permissão atualizada.", "sucesso");
                    await carregarProfessores();
                } catch (erro) { aviso(erro.message, "erro"); }
            }));
        } catch (erro) { $("lista-professores").textContent = erro.message; }
    }

    async function iniciar() {
        try {
            const status = await api("/api/fila/status");
            if (status.admin) {
                $("area-admin").hidden = false;
                await carregarProfessores();
            }
            if (!status.autorizado) {
                $("area-fila").hidden = true;
                aviso("Sua conta ainda não tem acesso à fila. Peça ao administrador para autorizar a conta do professor.", "erro");
                return;
            }
            $("area-fila").hidden = false;
            aviso("");
        } catch (erro) { aviso(erro.message, "erro"); return; }
    }
    iniciar();
})();
