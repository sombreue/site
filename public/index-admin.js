(() => {
    const usuarioLogado = document.getElementById('usuario-logado-index');
    const botaoLogout = document.getElementById('botao-logout-index');
    const painel = document.getElementById('painel-admin-index');
    const lista = document.getElementById('lista-usuarios-index');
    const form = document.getElementById('form-criar-usuario-index');
    const status = document.getElementById('status-admin-index');
    const botaoMin = document.getElementById('botao-minimizar-admin-index');
    const conteudo = document.getElementById('conteudo-admin-index');

    function textoSeguro(valor) {
        return String(valor ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
    }

    async function carregarUsuarios() {
        try {
            const resposta = await fetch('/api/usuarios');
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || 'Não foi possível carregar os usuários.');
            lista.innerHTML = dados.usuarios.map(usuario => `
                <div class="usuario-admin-item">
                    <div><strong>${textoSeguro(usuario.usuario)}</strong><span>${usuario.tipo === 'admin' ? 'Administrador' : 'Usuário'}</span></div>
                    ${usuario.id === dados.usuarioLogadoId ? '<em>Conta atual</em>' : `<button type="button" data-excluir-usuario="${usuario.id}">Excluir</button>`}
                </div>
            `).join('') || '<p>Nenhum usuário cadastrado.</p>';
        } catch (erro) {
            lista.innerHTML = `<p>${textoSeguro(erro.message)}</p>`;
        }
    }

    async function sair() {
        try { await fetch('/api/logout', { method: 'POST' }); } finally { window.location.href = '/login.html'; }
    }

    botaoLogout.addEventListener('click', sair);

    botaoMin.addEventListener('click', () => {
        const aberto = conteudo.hidden;
        conteudo.hidden = !aberto;
        botaoMin.textContent = aberto ? '−' : '+';
        botaoMin.setAttribute('aria-expanded', String(aberto));
    });

    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        status.textContent = 'Criando usuário...';
        const usuario = document.getElementById('novo-usuario-index').value.trim();
        const senha = document.getElementById('nova-senha-index').value;
        try {
            const resposta = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ usuario, senha })
            });
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || 'Não foi possível criar o usuário.');
            status.textContent = 'Usuário criado com sucesso.';
            form.reset();
            carregarUsuarios();
        } catch (erro) {
            status.textContent = erro.message;
        }
    });

    lista.addEventListener('click', async evento => {
        const botao = evento.target.closest('[data-excluir-usuario]');
        if (!botao || !confirm('Excluir este usuário?')) return;
        try {
            const resposta = await fetch(`/api/usuarios/${botao.dataset.excluirUsuario}`, { method: 'DELETE' });
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || 'Não foi possível excluir.');
            status.textContent = 'Usuário excluído.';
            carregarUsuarios();
        } catch (erro) {
            status.textContent = erro.message;
        }
    });

    async function inicializar() {
        try {
            const resposta = await fetch('/api/sessao');
            const sessao = await resposta.json();
            if (!sessao.logado) {
                window.location.href = '/login.html';
                return;
            }
            usuarioLogado.textContent = `Logado como: ${sessao.usuario}${sessao.tipo === 'admin' ? ' (administrador)' : ''}`;
            botaoLogout.hidden = false;
            if (sessao.tipo === 'admin') {
                painel.hidden = false;
                carregarUsuarios();
            }
        } catch (erro) {
            window.location.href = '/login.html';
        }
    }

    inicializar();
})();
