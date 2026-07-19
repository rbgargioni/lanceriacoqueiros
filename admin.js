import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Elementos do DOM
const listaPendentesContainer = document.getElementById("lista-pedidos-pendentes");
const listaAceitosContainer = document.getElementById("lista-pedidos-aceitos");
const somBuzina = document.getElementById("som-buzina");

let audioPermitido = false;

// ==========================================
// TELA DE ATIVAÇÃO INICIAL DE ÁUDIO
// ==========================================
function verificarOuForcarCliqueInicial() {
    const overlay = document.createElement("div");
    overlay.id = "audio-setup-overlay";
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(19, 131, 66, 0.98); z-index: 9999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: sans-serif; text-align: center; padding: 20px;
    `;
    overlay.innerHTML = `
        <i class="fas fa-bell" style="font-size: 4rem; margin-bottom: 20px; color: #e4b223;"></i>
        <h2 style="margin-bottom: 10px;">Ativar Sistema de Som da Lancheria</h2>
        <p style="margin-bottom: 20px; max-width: 420px; font-size: 0.95rem; line-height: 1.4;">
            Os navegadores modernos exigem uma interação na tela para liberar avisos sonoros automatizados de novos pedidos.
        </p>
        <button id="btn-ativar-audio" style="
            background: #e4b223; color: #3e3e2f; border: none; padding: 15px 40px; 
            font-size: 1.1rem; font-weight: bold; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        ">
            <i class="fas fa-play"></i> Ligar Painel de Pedidos
        </button>
    `;
    document.body.appendChild(overlay);

    document.getElementById("btn-ativar-audio").addEventListener("click", () => {
        audioPermitido = true;
        if (somBuzina) {
            somBuzina.play().then(() => {
                somBuzina.pause();
                somBuzina.currentTime = 0;
            }).catch(e => console.log("Erro ao validar áudio:", e));
        }
        overlay.remove();
    });
}

verificarOuForcarCliqueInicial();

// ==========================================
// MONITORAMENTO DE PEDIDOS EM TEMPO REAL
// ==========================================
if (listaPendentesContainer && listaAceitosContainer) {
    const qPedidos = query(collection(db, "pedidos"), orderBy("data", "desc"));

    onSnapshot(qPedidos, (snapshot) => {
        listaPendentesContainer.innerHTML = "";
        listaAceitosContainer.innerHTML = "";
        let temPedidoNovoAguardando = false;

        snapshot.forEach((docSnap) => {
            const pedido = docSnap.data();
            const idPedido = docSnap.id;

            const cardPedido = document.createElement("div");
            cardPedido.className = "card-pedido";
            cardPedido.style = "background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid " + (pedido.status === "Aguardando" ? "#e4b223" : "#138342");

            let itensHTML = "";
            if (pedido.itens && Array.isArray(pedido.itens)) {
                pedido.itens.forEach(item => {
                    itensHTML += `<li><strong>${item.quantidade}x</strong> ${item.nome}</li>`;
                });
            }

            cardPedido.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin:0; color: #3e3e2f;">${pedido.cliente.nome}</h4>
                        <small style="color: #777;">${pedido.cliente.telefone}</small>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: bold; background: #f4f4f5; padding: 3px 8px; border-radius: 12px;">Total: R$ ${parseFloat(pedido.total).toFixed(2)}</span>
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 10px; background: #fafafa; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0 0 5px 0;"><strong>Endereço:</strong> ${pedido.cliente.endereco.rua}, ${pedido.cliente.endereco.numero} - ${pedido.cliente.endereco.bairro}</p>
                    ${pedido.cliente.endereco.complemento ? `<p style="margin:0; font-size:0.85rem; color:#666;">Obs: ${pedido.cliente.endereco.complemento}</p>` : ""}
                </div>
                <ul style="margin: 0 0 12px 0; padding-left: 20px; font-size: 0.95rem;">
                    ${itensHTML}
                </ul>
                <div style="font-size: 0.85rem; margin-bottom: 12px; color: #555;">
                    <div><strong>Pagamento:</strong> ${pedido.formaPagamento}</div>
                    <div><strong>Troco:</strong> ${pedido.troco}</div>
                </div>
                
                ${pedido.status === "Aguardando" ? `
                    <button class="btn-imprimir" data-id="${idPedido}" style="background: #138342; color: white; border: none; width: 100%; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                        <i class="fas fa-print"></i> Aceitar e Imprimir
                    </button>
                ` : `
                    <button class="btn-concluir" data-id="${idPedido}" style="background: #007bff; color: white; border: none; width: 100%; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                        <i class="fas fa-check-double"></i> Concluir Pedido
                    </button>
                `}
            `;

            if (pedido.status === "Aguardando") {
                listaPendentesContainer.appendChild(cardPedido);
                temPedidoNovoAguardando = true;
            } else if (pedido.status === "Aceito") {
                listaAceitosContainer.appendChild(cardPedido);
            }
        });

        // Correção aplicada aqui: Nome da variável corrigido e proteção extra de áudio
        if (somBuzina && audioPermitido) {
            if (temPedidoNovoAguardando) {
                somBuzina.play().catch(e => console.log("Áudio bloqueado pelo navegador ou arquivo indisponível.", e));
            } else {
                try {
                    somBuzina.pause();
                    somBuzina.currentTime = 0;
                } catch(e) {
                    console.log("Erro ao pausar o áudio:", e);
                }
            }
        }

        configurarBotoesPedidos();
    });
}

function configurarBotoesPedidos() {
    document.querySelectorAll(".btn-imprimir").forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const elementoCard = e.currentTarget.closest(".card-pedido");
            try {
                await updateDoc(doc(db, "pedidos", id), { status: "Aceito" });
                imprimirElemento(elementoCard);
            } catch (err) {
                console.error(err);
            }
        };
    });

    document.querySelectorAll(".btn-concluir").forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (confirm("Deseja arquivar e concluir este pedido?")) {
                try {
                    await deleteDoc(doc(db, "pedidos", id));
                } catch (err) {
                    console.error(err);
                }
            }
        };
    });
}

function imprimirElemento(elementoCard) {
    const htmlClonado = elementoCard.cloneNode(true);
    htmlClonado.querySelectorAll("button").forEach(b => b.remove());
    const janelaImpressao = window.open('', '', 'height=600,width=450');
    janelaImpressao.document.write('<html><head><title>Imprimir Pedido</title><style>body { font-family: "Courier New", monospace; padding: 10px; } ul { padding-left: 20px; }</style></head><body>');
    janelaImpressao.document.write('<h2 style="text-align:center; margin-bottom:5px;">LANCHERIA COQUEIRO</h2><p style="text-align:center; margin-top:0;">---------------------------------</p>');
    janelaImpressao.document.write(htmlClonado.innerHTML);
    janelaImpressao.document.write('<p style="text-align:center; margin-top:15px;">---------------------------------</p><p style="text-align:center; font-size:11px;">Obrigado pela preferência!</p></body></html>');
    janelaImpressao.document.close();
    janelaImpressao.print();
    janelaImpressao.close();
}