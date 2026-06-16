import { db } from "./firebase-config.js";
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Elementos do DOM (Cardápio)
const form = document.getElementById("form-cadastro");
const tabelaLanches = document.getElementById("tabela-lanches");
const formTitulo = document.getElementById("form-titulo");
const btnSubmit = document.getElementById("btn-submit");
const idInput = document.getElementById("lanche-id");
const buscaNome = document.getElementById("busca-nome");
const filtroCategoria = document.getElementById("filtro-categoria");
const modalLanche = document.getElementById("modal-lanche");
const btnAbrirCadastro = document.getElementById("btn-abrir-cadastro");
const btnFecharModal = document.getElementById("btn-fechar-modal");

// Elementos do DOM (Pedidos em Tempo Real)
const listaPendentesContainer = document.getElementById("lista-pedidos-pendentes");
const listaAceitosContainer = document.getElementById("lista-pedidos-aceitos");
const somBuzina = document.getElementById("som-buzina");

let lanchesArmazenados = [];

// Flag para controle de liberação do áudio pelo navegador
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
        
        // Toca e pausa imediatamente o elemento para destravar a permissão do navegador
        if (somBuzina) {
            somBuzina.play().then(() => {
                somBuzina.pause();
                somBuzina.currentTime = 0;
            }).catch(e => console.log("Erro ao validar áudio comercial:", e));
        }
        overlay.remove();
    });
}

// Inicializa a barreira de clique assim que o script carrega
verificarOuForcarCliqueInicial();

// ==========================================
// CONTROLADORES DO MODAL DE LANCHES
// ==========================================
if (btnAbrirCadastro) {
    btnAbrirCadastro.addEventListener("click", () => {
        resetarFormulario();
        if (modalLanche) modalLanche.classList.remove("hidden");
    });
}

if (btnFecharModal) {
    btnFecharModal.addEventListener("click", () => {
        if (modalLanche) modalLanche.classList.add("hidden");
    });
}

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

        // Controle da campainha/buzina ajustado com a flag de liberação de áudio
        if (somBuzina && audioPermitido) {
            if (temPedidoNovoAguardando) {
                somBuzina.play().catch(e => console.log("Áudio aguardando liberação final do navegador.", e));
            } else {
                somBuzina.pause();
                somBuzina.currentTime = 0;
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
                console.error("Erro ao aceitar pedido:", err);
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
                    console.error("Erro ao deletar/concluir pedido:", err);
                }
            }
        };
    });
}

function imprimirElemento(elementoCard) {
    const htmlClonado = elementoCard.cloneNode(true);
    const botoes = htmlClonado.querySelectorAll("button");
    botoes.forEach(b => b.remove());

    const janelaImpressao = window.open('', '', 'height=600,width=450');
    janelaImpressao.document.write('<html><head><title>Imprimir Pedido</title>');
    janelaImpressao.document.write('<style>body { font-family: "Courier New", Courier, monospace; padding: 10px; color: black; } ul { padding-left: 20px; }</style></head><body>');
    janelaImpressao.document.write('<h2 style="text-align:center; margin-bottom:5px;">LANCHERIA COQUEIRO</h2>');
    janelaImpressao.document.write('<p style="text-align:center; margin-top:0;">---------------------------------</p>');
    janelaImpressao.document.write(htmlClonado.innerHTML);
    janelaImpressao.document.write('<p style="text-align:center; margin-top:15px;">---------------------------------</p>');
    janelaImpressao.document.write('<p style="text-align:center; font-size:11px;">Obrigado pela preferência!</p>');
    janelaImpressao.document.write('</body></html>');
    janelaImpressao.document.close();
    janelaImpressao.print();
    janelaImpressao.close();
}

// ==========================================
// OPERAÇÕES DO CARDÁPIO (CRUD LANCHES)
// ==========================================
const qLanches = query(collection(db, "lanches"), orderBy("nome", "asc"));
onSnapshot(qLanches, (snapshot) => {
    lanchesArmazenados = [];
    snapshot.forEach((doc) => {
        lanchesArmazenados.push({ id: doc.id, ...doc.data() });
    });
    renderizarTabelaLanches(lanchesArmazenados);
});

function renderizarTabelaLanches(lanches) {
    if (!tabelaLanches) return;
    tabelaLanches.innerHTML = "";

    lanches.forEach(lanche => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img src="${lanche.imagemUrl}" alt="${lanche.nome}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;" onerror="this.src='logo.jpg'"></td>
            <td><strong>${lanche.nome}</strong></td>
            <td><span class="categoria-tag">${lanche.categoria.toUpperCase()}</span></td>
            <td><strong>R$ ${parseFloat(lanche.preco).toFixed(2)}</strong></td>
            <td>
                <div style="display:flex; gap:10px;">
                    <button class="btn-acao btn-editar" data-id="${lanche.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao btn-excluir" data-id="${lanche.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        tabelaLanches.appendChild(tr);
    });

    configurarBotoesCardapio();
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = idInput.value;
        const nome = document.getElementById("nome").value;
        const categoria = document.getElementById("categoria").value;
        const preco = document.getElementById("preco").value;
        const imagemUrl = document.getElementById("imagemUrl").value;
        const descricao = document.getElementById("descricao").value;

        const dadosLanche = { nome, categoria, preco: parseFloat(preco), imagemUrl, descricao };

        try {
            if (id) {
                await updateDoc(doc(db, "lanches", id), dadosLanche);
                alert("Lanche updated com sucesso!");
            } else {
                await addDoc(collection(db, "lanches"), dadosLanche);
                alert("Lanche cadastrado com sucesso!");
            }
            resetarFormulario();
            if (modalLanche) modalLanche.classList.add("hidden");
        } catch (error) {
            console.error("Erro ao salvar lanche:", error);
            alert("Erro ao salvar dados.");
        }
    });
}

function configurarBotoesCardapio() {
    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const lanche = lanchesArmazenados.find(l => l.id === id);
            if (lanche) {
                idInput.value = lanche.id;
                document.getElementById("nome").value = lanche.nome;
                document.getElementById("categoria").value = lanche.categoria;
                document.getElementById("preco").value = lanche.preco;
                document.getElementById("imagemUrl").value = lanche.imagemUrl;
                document.getElementById("descricao").value = lanche.descricao;

                formTitulo.innerText = "Editar Lanche";
                formTitulo.style.color = "#007bff";
                btnSubmit.innerText = "Atualizar Cadastro";
                btnSubmit.style.background = "#007bff";

                if (modalLanche) modalLanche.classList.remove("hidden");
            }
        };
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const lanche = lanchesArmazenados.find(l => l.id === id);
            if (lanche && confirm(`Remover "${lanche.nome}" do cardápio definitivamente?`)) {
                try {
                    await deleteDoc(doc(db, "lanches", id));
                } catch (error) {
                    console.error("Erro ao deletar:", error);
                    alert("Não foi possível excluir o item.");
                }
            }
        };
    });
}

function resetarFormulario() {
    if (form) form.reset();
    if (idInput) idInput.value = "";
    if (formTitulo) {
        formTitulo.innerText = "Novo Lanche";
        formTitulo.style.color = "var(--cor-primaria)";
    }
    if (btnSubmit) {
        btnSubmit.innerText = "Salvar Lanche";
        btnSubmit.style.background = "var(--cor-primaria)";
    }
}

// Filtros da Tabela Administrativa
if (buscaNome) {
    buscaNome.addEventListener("input", aplicarFiltrosAdmin);
}
if (filtroCategoria) {
    filtroCategoria.addEventListener("change", aplicarFiltrosAdmin);
}

function aplicarFiltrosAdmin() {
    const termo = buscaNome ? buscaNome.value.toLowerCase() : "";
    const catFiltro = filtroCategoria ? filtroCategoria.value : "";

    const filtrados = lanchesArmazenados.filter(lanche => {
        const bateNome = lanche.nome.toLowerCase().includes(termo);
        const bateCategoria = catFiltro === "" || lanche.categoria === catFiltro;
        return bateNome && bateCategoria;
    });

    renderizarTabelaLanches(filtrados);
}