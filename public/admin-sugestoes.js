async function lerResposta(resposta) {
    const tipo = resposta.headers.get("content-type") || "";
    if (!tipo.includes("application/json")) { const texto = await resposta.text(); throw new Error(texto.trimStart().startsWith("<!DOCTYPE") || texto.trimStart().startsWith("<html") ? `O servidor não está entregando a API solicitada (HTTP ${resposta.status}).` : `Resposta inválida do servidor (HTTP ${resposta.status}).`); }
    return resposta.json();
}

async function carregarPedidosConta() {
    const lista = document.getElementById("lista-pedidos-conta");
    const contador = document.getElementById("contador-pedidos-conta");
    try {
        const resposta = await fetch("/api/pedidos-conta", { headers:{"Accept":"application/json"}, cache:"no-store" });
        if (resposta.status === 401) { window.location.href="/login.html"; return; }
        if (resposta.status === 403) { window.location.href="/"; return; }
        const dados = await lerResposta(resposta);
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível carregar os pedidos.");
        const pedidos = dados.pedidos || [];
        contador.textContent = `${pedidos.length} pedido(s) pendente(s)`;
        if (!pedidos.length) { lista.innerHTML='<div class="estado-vazio-contas">Nenhum pedido de conta pendente.</div>'; return; }
        lista.innerHTML = pedidos.map(item => `
            <article class="pedido-conta-card">
                <div class="pedido-conta-cabecalho">
                    <h3>${escaparHtml(item.usuario)}</h3>
                    <span class="pedido-conta-data">${formatarData(item.data)}</span>
                </div>
                <p>Este usuário pediu para entrar no site. A senha foi armazenada com segurança e não é exibida aqui.</p>
                <div class="pedido-conta-acoes">
                    <button type="button" class="botao-aceitar-conta" onclick="aceitarPedidoConta(${item.id}, '${escaparAtributo(item.usuario)}')">Aceitar</button>
                    <button type="button" class="botao-recusar-conta" onclick="recusarPedidoConta(${item.id}, '${escaparAtributo(item.usuario)}')">Recusar</button>
                </div>
            </article>
        `).join("");
    } catch (erro) { lista.innerHTML=`<div class="estado-vazio-contas">${escaparHtml(erro.message)}</div>`; }
}

async function aceitarPedidoConta(id, usuario) {
    if (!confirm(`Aceitar o pedido de ${usuario} e criar a conta?`)) return;
    try {
        const resposta = await fetch(`/api/pedidos-conta/${id}/aceitar`, { method:"POST", headers:{"Accept":"application/json"} });
        if (resposta.status === 401) { window.location.href="/login.html"; return; }
        if (resposta.status === 403) { window.location.href="/"; return; }
        const dados = await lerResposta(resposta);
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível aceitar o pedido.");
        await carregarPedidosConta();
    } catch (erro) { alert(erro.message); }
}

async function recusarPedidoConta(id, usuario) {
    if (!confirm(`Recusar o pedido de ${usuario}?`)) return;
    try {
        const resposta = await fetch(`/api/pedidos-conta/${id}`, { method:"DELETE", headers:{"Accept":"application/json"} });
        if (resposta.status === 401) { window.location.href="/login.html"; return; }
        if (resposta.status === 403) { window.location.href="/"; return; }
        const dados = await lerResposta(resposta);
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível recusar o pedido.");
        await carregarPedidosConta();
    } catch (erro) { alert(erro.message); }
}

async function carregarSugestoes() {
    const lista=document.getElementById("lista-sugestoes"), contador=document.getElementById("contador-sugestoes");
    try {
        const resposta=await fetch("/api/sugestoes",{headers:{"Accept":"application/json"},cache:"no-store"});
        if(resposta.status===401){window.location.href="/login.html";return;} if(resposta.status===403){window.location.href="/";return;}
        const dados=await lerResposta(resposta); if(!resposta.ok)throw new Error(dados.mensagem||"Não foi possível carregar os envios.");
        const sugestoes=dados.sugestoes||[]; contador.textContent=`${sugestoes.length} envio(s) recebido(s)`;
        if(!sugestoes.length){lista.innerHTML='<div class="estado-vazio">Nenhum envio recebido ainda.</div>';return;}
        lista.innerHTML=sugestoes.map(item=>{const tipo=item.tipo==="bug"?"Bug / erro":"Sugestão";return `<article class="sugestao-card"><div class="sugestao-tipo">${tipo}</div><h3>${escaparHtml(item.nome)}</h3><p>${escaparHtml(item.sugestao)}</p><div class="sugestao-data">${formatarData(item.data)}</div><button type="button" class="botao-excluir-sugestao" onclick="excluirSugestao(${item.id})">Excluir</button></article>`;}).join("");
    } catch(erro){lista.innerHTML=`<div class="estado-vazio">${escaparHtml(erro.message)}</div>`;}
}
async function excluirSugestao(id){
    if(!confirm("Excluir este envio?"))return;
    try{const resposta=await fetch(`/api/sugestoes/${id}`,{method:"DELETE",headers:{"Accept":"application/json"}});if(resposta.status===401){window.location.href="/login.html";return;}if(resposta.status===403){window.location.href="/";return;}const dados=await lerResposta(resposta);if(!resposta.ok)throw new Error(dados.mensagem||"Não foi possível excluir.");carregarSugestoes();}catch(erro){alert(erro.message);}
}
function escaparHtml(valor){const div=document.createElement("div");div.textContent=valor??"";return div.innerHTML;}
function escaparAtributo(valor){return String(valor??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");}
function formatarData(data){if(!data)return"";const dataObj=new Date(data);if(Number.isNaN(dataObj.getTime()))return"";return dataObj.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});}
document.getElementById("botao-atualizar")?.addEventListener("click",carregarSugestoes);
document.getElementById("botao-atualizar-pedidos")?.addEventListener("click",carregarPedidosConta);
document.addEventListener("DOMContentLoaded",()=>{carregarPedidosConta();carregarSugestoes();});
