import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

let chartVendasDia = null;
let chartMaisVendidos = null;

async function carregarDashboard() {
    try {
        const q = query(collection(db, "pedidos"), orderBy("data", "desc"));
        const snapshot = await getDocs(q);

        let totalFaturamento = 0;
        let totalPedidos = 0;
        const contagemItens = {};
        const faturamentoPorDia = {};
        const tabelaBody = document.getElementById("tabela-historico-body");

        if (tabelaBody) tabelaBody.innerHTML = "";

        if (snapshot.empty) {
            if (tabelaBody) tabelaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhum pedido encontrado.</td></tr>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            
            // Só contabiliza pedidos que não foram cancelados
            if (p.status !== "Cancelado") {
                const valor = parseFloat(p.total) || 0;
                totalFaturamento += valor;
                totalPedidos++;

                // Agrupamento por Data (YYYY-MM-DD)
                const dataFormatada = p.data ? new Date(p.data).toLocaleDateString('pt-BR') : 'Outros';
                faturamentoPorDia[dataFormatada] = (faturamentoPorDia[dataFormatada] || 0) + valor;

                // Agrupamento dos Itens Mais Vendidos
                if (p.itens && Array.isArray(p.itens)) {
                    p.itens.forEach(item => {
                        contagemItens[item.nome] = (contagemItens[item.nome] || 0) + (parseInt(item.quantidade) || 1);
                    });
                }
            }

            // Popula Tabela
            if (tabelaBody) {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid #eee";
                
                const dataString = p.data ? new Date(p.data).toLocaleString('pt-BR') : '-';
                const itensTexto = p.itens ? p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ") : "-";

                tr.innerHTML = `
                    <td style="padding: 10px;">${dataString}</td>
                    <td style="padding: 10px;"><strong>${p.cliente?.nome || 'Anônimo'}</strong><br><small>${p.cliente?.telefone || ''}</small></td>
                    <td style="padding: 10px; max-width: 250px;">${itensTexto}</td>
                    <td style="padding: 10px;">${p.formaPagamento || '-'}</td>
                    <td style="padding: 10px; font-weight: bold; color: #138342;">R$ ${parseFloat(p.total || 0).toFixed(2)}</td>
                    <td style="padding: 10px;"><span style="background:#e8f5e9; color:#138342; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">${p.status || 'Concluído'}</span></td>
                `;
                tabelaBody.appendChild(tr);
            }
        });

        // Atualizar KPIs
        document.getElementById("kpi-faturamento").innerText = `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`;
        document.getElementById("kpi-pedidos").innerText = totalPedidos;
        const ticketMedio = totalPedidos > 0 ? (totalFaturamento / totalPedidos) : 0;
        document.getElementById("kpi-ticket-medio").innerText = `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;

        // Renderizar Gráficos
        renderizarGraficoVendas(faturamentoPorDia);
        renderizarGraficoMaisVendidos(contagemItens);

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }
}

function renderizarGraficoVendas(dadosDias) {
    const ctx = document.getElementById('grafico-vendas-dia').getContext('2d');
    const labels = Object.keys(dadosDias).reverse();
    const valores = Object.values(dadosDias).reverse();

    if (chartVendasDia) chartVendasDia.destroy();

    chartVendasDia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento (R$)',
                data: valores,
                backgroundColor: '#138342',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

function renderizarGraficoMaisVendidos(dadosItens) {
    const ctx = document.getElementById('grafico-mais-vendidos').getContext('2d');
    const labels = Object.keys(dadosItens);
    const valores = Object.values(dadosItens);

    if (chartMaisVendidos) chartMaisVendidos.destroy();

    chartMaisVendidos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: ['#138342', '#e4b223', '#007bff', '#ff5722', '#9c27b0', '#607d8b']
            }]
        },
        options: {
            responsive: true
        }
    });
}

carregarDashboard();