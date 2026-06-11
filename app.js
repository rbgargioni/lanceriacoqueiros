import { auth, googleProvider, db } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Estado Global do Carrinho e Usuário
let listaLanches = [];
let carrinho = [];
let usuarioLogado = null;

// Captura de Elementos do DOM
const menuContainer = document.getElementById("menu-lanches");
const cartBar = document.getElementById("cart-bar");
const cartQtd = document.getElementById("cart-qtd");
const cartTotal = document.getElementById("cart-total");
const btnLogin = document.getElementById("btn-login");
const userInfo = document.getElementById("user-info");

// ==========================================
// CONTROLADOR DE LOGINS E DADOS DO CLIENTE
// ==========================================
if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Erro na autenticação:", error);
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioLogado = user;
        if (btnLogin) btnLogin.classList.add("hidden");
        if (userInfo) {
            userInfo.classList.remove("hidden");
            userInfo.innerText = `Olá, ${user.displayName.split(' ')[0]}`;
        }
        
        // Validação se o perfil de entrega já existe
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            document.getElementById("modal-cadastro-usuario").classList.remove("hidden");
        }
    } else {
        usuarioLogado = null;
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (userInfo) userInfo.classList.add("hidden");
    }
});

// Manipulador do formulário complementar
document.getElementById("form-completar-cadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!usuarioLogado) return;

    const telefone = document.getElementById("user-telefone").value;
    const rua = document.getElementById("user-rua").value;
    const numero = document.getElementById("user-numero").value;
    const bairro = document.getElementById("user-bairro").value;

    try {
        await setDoc(doc(db, "usuarios", usuarioLogado.uid), {
            nome: usuarioLogado.displayName,
            email: usuarioLogado.email,
            telefone: telefone,
            isAdmin: false,
            enderecos: [{ rua, numero, bairro, cidade: "Porto Alegre", principal: true }]
        });

        document.getElementById("modal-cadastro-usuario").classList.add("hidden");
        alert("Perfil de entrega configurado!");
    } catch (error) {
        console.error("Erro ao salvar cadastro do cliente:", error);
    }
});

// ==========================================
// RENDERIZADOR DO CARDÁPIO EM TEMPO REAL
// ==========================================
function carregarCardapio() {
    if (!menuContainer) return;
    const q = query(collection(db, "lanches"), orderBy("nome"));
    
    onSnapshot(q, (snapshot) => {
        listaLanches = [];
        if (snapshot.empty) {
            menuContainer.innerHTML = `<div style="text-align:center; padding:30px;">Cardápio indisponível no momento.</div>`;
            return;
        }

        snapshot.forEach((doc) => {
            listaLanches.push({ id: doc.id, ...doc.data() });
        });

        renderizarLanches(listaLanches);
    });
}

function renderizarLanches(lanches) {
    menuContainer.innerHTML = "";
    lanches.forEach(lanche => {
        const card = document.createElement("div");
        card.classList.add("lanche-card");
        card.innerHTML = `
            <div class="lanche-info">
                <h3>${lanche.nome}</h3>
                <p>${lanche.descricao}</p>
                <div class="lanche-preco">R$ ${lanche.preco.toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="lanche-img-container">
                <img src="${lanche.imagemUrl}" alt="${lanche.nome}" class="lanche-img" onerror="this.src='image_2c6f96.jpg'">
                <button class="btn-add-carrinho" data-id="${lanche.id}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        menuContainer.appendChild(card);
    });
    adicionarEventosBotoes();
}

// ==========================================
// GERENCIADOR LOGICO DO CARRINHO (MEMÓRIA)
// ==========================================
function adicionarEventosBotoes() {
    document.querySelectorAll(".btn-add-carrinho").forEach(botao => {
        botao.addEventListener("click", (e) => {
            e.stopPropagation(); // Evita disparar a abertura do modal ao clicar no botão '+'
            const lancheId = e.currentTarget.getAttribute("data-id");
            adicionarAoCarrinho(lancheId);
        });
    });
}

function adicionarAoCarrinho(id) {
    const lanche = listaLanches.find(item => item.id === id);
    if (!lanche) return;

    const itemNoCarrinho = carrinho.find(item => item.id === id);
    if (itemNoCarrinho) {
        itemNoCarrinho.quantidade += 1;
    } else {
        carrinho.push({ id: lanche.id, nome: lanche.nome, preco: lanche.preco, quantidade: 1 });
    }
    atualizarBarraCarrinho();
}

function atualizarBarraCarrinho() {
    if (!cartBar) return;

    if (carrinho.length === 0) {
        cartBar.classList.add("hidden");
        document.getElementById("modal-sacola").classList.add("hidden");
        return;
    }

    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    cartQtd.innerText = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
    cartTotal.innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    
    cartBar.classList.remove("hidden");
    renderizarItensSacola();
}

// ==========================================
// INTERAÇÃO E FLUXO DOS MODAIS
// ==========================================
window.abrirModalCarrinho = function() {
    document.getElementById("modal-sacola").classList.remove("hidden");
};

window.fecharModalCarrinho = function() {
    document.getElementById("modal-sacola").classList.add("hidden");
};

function renderizarItensSacola() {
    const container = document.getElementById("itens-sacola-container");
    if (!container) return;
    container.innerHTML = "";

    carrinho.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #f0f0f0;";
        itemDiv.innerHTML = `
            <div style="flex:1; text-align:left;">
                <h4 style="font-size:0.95rem; margin-bottom:2px; color:var(--cor-texto); font-weight:600;">${item.nome}</h4>
                <span style="color:var(--cor-primaria); font-weight:bold; font-size:0.9rem;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <button onclick="mudarQtd('${item.id}', -1)" style="border:1px solid #ccc; background:white; width:26px; height:26px; border-radius:6px; cursor:pointer; font-weight:bold; color:#555;">-</button>
                <span style="font-weight:bold; font-size:0.9rem; min-width:15px; text-align:center;">${item.quantidade}</span>
                <button onclick="mudarQtd('${item.id}', 1)" style="border:1px solid #ccc; background:white; width:26px; height:26px; border-radius:6px; cursor:pointer; font-weight:bold; color:#555;">+</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    document.getElementById("total-sacola-modal").innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
}

window.mudarQtd = function(id, valor) {
    const item = carrinho.find(item => item.id === id);
    if (!item) return;

    item.quantidade += valor;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter(item => item.id !== id);
    }
    atualizarBarraCarrinho();
};

window.finalizarPedido = function() {
    if (!usuarioLogado) {
        alert("Por favor, faça login com a conta Google antes de enviar seu pedido.");
        return;
    }
    alert("Pedido enviado com sucesso para a produção!");
    carrinho = [];
    atualizarBarraCarrinho();
};

// ==========================================
// FILTRAGEM DINÂMICA DE CATEGORIAS
// ==========================================
window.filtrarCategoria = function(categoria) {
    const botoes = document.querySelectorAll(".cat-item");
    botoes.forEach(btn => btn.classList.remove("active"));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }

    if (categoria === 'todos') {
        renderizarLanches(listaLanches);
    } else {
        const lanchesFiltrados = listaLanches.filter(l => l.categoria === categoria);
        renderizarLanches(lanchesFiltrados);
    }
};

carregarCardapio();