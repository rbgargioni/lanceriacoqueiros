import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Elementos do DOM - Cards Gerais
const txtFaturamentoTotal = document.getElementById("faturamento-total");
const txtQtdTotalPedidos = document.getElementById("qtd-total-pedidos");
const txtTicketMedio = document.getElementById("ticket-medio");

// Elementos do DOM - Tabelas e Listas
const tabelaMensal = document.getElementById("tabela-financeiro-mensal");
const listaMaisVendidos = document.getElementById("lista-mais-vendidos");
const listaMenosVendidos = document.getElementById("lista-menos-vendidos");

// Escuta ativa de pedidos
const qPedidos = query(collection(db, "pedidos"), orderBy("data", "desc"));

onSnapshot(qPedidos, (snapshot) => {
    let dadosMensais = {}; // Guardará { "03/2026": { faturamento: X, qtdPedidos: Y } }
    let rankingProdutos = {}; // Guardará { "Xis Salada": qtdVendida }
    
    let faturamentoGeral = 0;
    let totalPedidosGeral = 0;

    snapshot.forEach((docSnap) => {
        const pedido = docSnap.data();
        const valorPedido = parseFloat(pedido.total || 0);
        
        faturamentoGeral += valorPedido;
        totalPedidosGeral++;

        // --- 1. PROCESSAMENTO POR MÊS ---
        // Tratamento de data (supondo timestamp do Firebase ou string convertível)
        let dataPedido = new Date();
        if (pedido.data) {
            dataPedido = pedido.data.seconds ? new Date(pedido.data.seconds * 1000) : new Date(pedido.data);
        }
        
        const mes = String(dataPedido.getMonth() + 1).padStart(2, '0');
        const ano = dataPedido.getFullYear();
        const chaveMesAno = `${mes}/${ano}`;

        if (!dadosMensais[chaveMesAno]) {
            dadosMensais[chaveMesAno] = { faturamento: 0, qtdPedidos: 0 };
        }
        dadosMensais[chaveMesAno].faturamento += valorPedido;
        dadosMensais[chaveMesAno].qtdPedidos++;

        // --- 2. PROCESSAMENTO DE ITENS MAIS/MENOS VENDIDOS ---
        if (pedido.itens && Array.isArray(pedido.itens)) {
            pedido.itens.forEach(item => {
                const nomeItem = item.nome;
                const qtdItem = parseInt(item.quantidade || 0);

                if (!rankingProdutos[nomeItem]) {
                    rankingProdutos[nomeItem] = 0;
                }
                rankingProdutos[nomeItem] += qtdItem;
            });
        }
    });

    // Atualizar os Cards de Cima
    txtFaturamentoTotal.innerText = `R$ ${faturamentoGeral.toFixed(2)}`;
    txtQtdTotalPedidos.innerText = totalPedidosGeral;
    
    const ticketMedio = totalPedidosGeral > 0 ? (faturamentoGeral / totalPedidosGeral) : 0;
    txtTicketMedio.innerText = `R$ ${ticketMedio.toFixed(2)}`;

    // Renderizar Tabela Mensal
    renderizarTabelaMensal(dadosMensais);

    // Renderizar Rankings
    renderizarRankingsProdutos(rankingProdutos);
});

// Função para preencher a tabela de faturamento por meses
function renderizarTabelaMensal(dadosMensais) {
    if (!tabelaMensal) return;
    tabelaMensal.innerHTML = "";

    const mesesOrdenados = Object.keys(dadosMensais).sort((a, b) => {
        // Ordenação reversa (meses mais recentes primeiro)
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        return (anoB - anoA) || (mesB - mesA);
    });

    if (mesesOrdenados.length === 0) {
        tabelaMensal.innerHTML = `<tr><td colspan="3" style="padding:20px; text-align:center; color:#777;">Nenhum histórico de faturamento computado.</td></tr>`;
        return;
    }

    mesesOrdenados.forEach(mesAno => {
        const dados = dadosMensais[mesAno];
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 12px 10px; font-weight: bold; color: #3e3e2f;">${mesAno}</td>
            <td style="padding: 12px 10px; color: #555;">${dados.qtdPedidos} pedidos</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #138342;">R$ ${dados.faturamento.toFixed(2)}</td>
        `;
        tabelaMensal.appendChild(tr);
    });
}

// Função para montar a listagem visual do Top Mais Vendidos e Menos Vendidos
function renderizarRankingsProdutos(rankingProdutos) {
    if (!listaMaisVendidos || !listaMenosVendidos) return;

    listaMaisVendidos.innerHTML = "";
    listaMenosVendidos.innerHTML = "";

    // Converte o objeto de ranking para um Array ordenável: [ { nome: "Xis", qtd: 10 }, ... ]
    const arrayProdutos = Object.keys(rankingProdutos).map(nome => {
        return { nome: nome, qtd: rankingProdutos[nome] };
    });

    if (arrayProdutos.length === 0) {
        const avisoVazio = `<p style="color: #888; font-style: italic; font-size: 0.9rem;">Ainda sem dados de consumo de itens.</p>`;
        listaMaisVendidos.innerHTML = avisoVazio;
        listaMenosVendidos.innerHTML = avisoVazio;
        return;
    }

    // Ordena do mais vendido para o menos vendido
    const maisVendidos = [...arrayProdutos].sort((a, b) => b.qtd - a.qtd).slice(0, 5);
    // Ordena do menos vendido para o mais vendido
    const menosVendidos = [...arrayProdutos].sort((a, b) => a.qtd - b.qtd).slice(0, 5);

    // Renderiza Mais Vendidos (Verde)
    maisVendidos.forEach((item, index) => {
        const div = document.createElement("div");
        div.style = "display: flex; justify-content: space-between; align-items: center; background: #f4fbf7; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #138342; font-size: 0.9rem;";
        div.innerHTML = `<span><strong>${index + 1}°</strong> ${item.nome}</span> <span style="background: #138342; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: bold;">${item.qtd} un.</span>`;
        listaMaisVendidos.appendChild(div);
    });

    // Renderiza Menos Vendidos (Vermelho)
    menosVendidos.forEach((item, index) => {
        const div = document.createElement("div");
        div.style = "display: flex; justify-content: space-between; align-items: center; background: #fff5f5; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #dc3545; font-size: 0.9rem;";
        div.innerHTML = `<span><strong>${index + 1}°</strong> ${item.nome}</span> <span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: bold;">${item.qtd} un.</span>`;
        listaMenosVendidos.appendChild(div);
    });
}