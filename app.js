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
            userInfo.innerText = `Olá, ${user.displayName.split(' ')[0]}`;
            userInfo.classList.remove("hidden");
        }
        await verificarEcriarUsuario(user);
    } else {
        usuarioLogado = null;
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (userInfo) {
            userInfo.innerText = "";
            userInfo.classList.add("hidden");
        }
    }
});

async function verificarEcriarUsuario(user) {
    const userRef = doc(db, "clientes", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        await setDoc(userRef, {
            nome: user.displayName,
            email: user.email,
            telefone: "",
            endereco: {
                cidade: "Porto Alegre",
                bairro: "",
                rua: "",
                numero: "",
                complemento: ""
            },
            dataCadastro: new Date()
        });
    } else {
        const dadosPreenchidos = docSnap.data();
        if (dadosPreenchidos.telefone) {
            document.getElementById("user-telefone").value = dadosPreenchidos.telefone;
            document.getElementById("user-cidade").value = dadosPreenchidos.endereco.cidade || "Porto Alegre";
            document.getElementById("user-bairro").value = dadosPreenchidos.endereco.bairro || "";
            document.getElementById("user-rua").value = dadosPreenchidos.endereco.rua || "";
            document.getElementById("user-numero").value = dadosPreenchidos.endereco.numero || "";
            document.getElementById("user-complemento").value = dadosPreenchidos.endereco.complemento || "";
        }
    }
}

// ==========================================
// ESCUTA SESSÃO CARDÁPIO EM TEMPO REAL
// ==========================================
function carregarCardapio() {
    const q = query(collection(db, "lanches"), orderBy("nome"));
    
    onSnapshot(q, (snapshot) => {
        listaLanches = [];
        snapshot.forEach((doc) => {
            listaLanches.push({ id: doc.id, ...doc.data() });
        });

        // Mantém a exibição correta caso o usuário já esteja em uma categoria de lanches
        const botaoAtivo = document.querySelector(".cat-item.active");
        if (botaoAtivo) {
            const cat = botaoAtivo.getAttribute("onclick").match(/'([^']+)'/)[1];
            if (cat !== 'sobre') {
                const lanchesFiltrados = listaLanches.filter(lanche => lanche.categoria === cat);
                renderizarProdutos(lanchesFiltrados);
            }
        }
    });
}

function renderizarProdutos(produtos) {
    menuContainer.innerHTML = "";

    if (produtos.length === 0) {
        menuContainer.innerHTML = `<p style="text-align:center; padding:30px; color:#999; font-size:0.95rem;">Nenhum produto cadastrado nesta categoria.</p>`;
        return;
    }

    produtos.forEach((lanche) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "menu-item";
        itemDiv.style.display = "flex";
        itemDiv.style.background = "white";
        itemDiv.style.padding = "12px";
        itemDiv.style.borderRadius = "12px";
        itemDiv.style.marginBottom = "10px";
        itemDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.03)";
        itemDiv.style.gap = "12px";

        itemDiv.innerHTML = `
            <img src="${lanche.imagemUrl}" alt="${lanche.nome}" style="width:85px; height:85px; object-fit:cover; border-radius:8px;" onerror="this.src='logo.png'">
            <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <h3 style="font-size:1rem; margin-bottom:4px; color:#333;">${lanche.nome}</h3>
                    <p style="font-size:0.8rem; color:#777; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${lanche.descricao}</p>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                    <span style="font-weight:bold; color:var(--cor-primaria); font-size:0.95rem;">R$ ${lanche.preco.toFixed(2).replace('.', ',')}</span>
                    <button class="btn-add-carrinho" onclick="adicionarAoCarrinho('${lanche.id}')" style="background:#f4f4f5; border:none; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--cor-primaria); cursor:pointer; font-weight:bold;"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
        menuContainer.appendChild(itemDiv);
    });
}

// ==========================================
// GERENCIADOR DA SACOLA DE COMPRAS (CARRINHO)
// ==========================================
window.adicionarAoCarrinho = function(id) {
    const lanche = listaLanches.find(item => item.id === id);
    if (!lanche) return;

    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ ...lanche, quantidade: 1 });
    }

    atualizarBarraCarrinho();
};

function atualizarBarraCarrinho() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    if (totalItens > 0) {
        cartQtd.innerText = totalItens;
        cartTotal.innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
        cartBar.classList.remove("hidden");
    } else {
        cartBar.classList.add("hidden");
        fecharModalSacola();
    }
}

// Controladores das Telas Modais da Sacola
window.abrirModalSacola = function() {
    document.getElementById("modal-sacola").classList.remove("hidden");
    montarItensSacolaModal();
};

window.fecharModalSacola = function() {
    document.getElementById("modal-sacola").classList.add("hidden");
};

window.abrirModalCadastro = function() {
    fecharModalSacola();
    document.getElementById("modal-cadastro").classList.remove("hidden");
};

window.fecharModalCadastro = function() {
    document.getElementById("modal-cadastro").classList.add("hidden");
};

function montarItensSacolaModal() {
    const containerItens = document.getElementById("itens-sacola-modal");
    containerItens.innerHTML = "";

    carrinho.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.style.display = "flex";
        itemDiv.style.justifyContent = "space-between";
        itemDiv.style.alignItems = "center";
        itemDiv.style.marginBottom = "12px";
        itemDiv.style.borderBottom = "1px solid #f4f4f5";
        itemDiv.style.paddingBottom = "8px";

        itemDiv.innerHTML = `
            <div style="flex:1; padding-right:10px;">
                <h4 style="font-size:0.95rem; color:#333; margin-bottom:2px;">${item.nome}</h4>
                <span style="font-size:0.85rem; color:var(--cor-primaria); font-weight:600;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; background:#f4f4f5; padding:4px 10px; border-radius:20px;">
                <button onclick="mudarQtd('${item.id}', -1)" style="background:none; border:none; font-weight:bold; color:#777; cursor:pointer; font-size:1rem; width:20px;">-</button>
                <span style="font-size:0.9rem; font-weight:bold; min-width:15px; text-align:center;">${item.quantidade}</span>
                <button onclick="mudarQtd('${item.id}', 1)" style="background:none; border:none; font-weight:bold; color:var(--cor-primaria); cursor:pointer; font-size:1rem; width:20px;">+</button>
            </div>
        `;
        containerItens.appendChild(itemDiv);
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
    if (carrinho.length > 0) montarItensSacolaModal();
};

// ==========================================
// COMPACTAÇÃO E ENVIO DO PEDIDO VIA WHATSAPP
// ==========================================
const formEndereco = document.getElementById("form-endereco");
if (formEndereco) {
    formEndereco.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!usuarioLogado) {
            alert("Por favor, faça o login com o Google para concluir o seu pedido.");
            return;
        }

        const telefone = document.getElementById("user-telefone").value;
        const cidade = document.getElementById("user-cidade").value;
        const bairro = document.getElementById("user-bairro").value;
        const rua = document.getElementById("user-rua").value;
        const numero = document.getElementById("user-numero").value;
        const complemento = document.getElementById("user-complemento").value;

        // 1. Salva de forma persistente os dados de entrega no Firestore do cliente
        try {
            await setDoc(doc(db, "clientes", usuarioLogado.uid), {
                nome: usuarioLogado.displayName,
                email: usuarioLogado.email,
                telefone: telefone,
                endereco: { cidade, bairro, rua, numero, complemento },
                ultimoPedido: new Date()
            }, { merge: true });
        } catch (err) {
            console.error("Erro ao guardar dados do endereço no Firebase:", err);
        }

        // 2. Monta o texto legível da mensagem para o WhatsApp da Lancheria
        let textoPedido = `*🍔 NOVO PEDIDO - LANCHERIA COQUEIRO* \n\n`;
        textoPedido += `*Cliente:* ${usuarioLogado.displayName}\n`;
        textoPedido += `*Telefone:* ${telefone}\n\n`;
        textoPedido += `--- *ITENS SOLICITADOS* ---\n`;

        carrinho.forEach(item => {
            textoPedido += `${item.quantidade}x _${item.nome}_ (R$ ${item.preco.toFixed(2).replace('.', ',')} un)\n`;
        });

        const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        textoPedido += `\n*TOTAL DO PEDIDO:* R$ ${valorTotal.toFixed(2).replace('.', ',')}\n\n`;
        textoPedido += `--- *ENDEREÇO DE ENTREGA* ---\n`;
        textoPedido += `${rua}, Nº ${numero}\n`;
        textoPedido += `Bairro: ${bairro} - ${cidade}\n`;
        if (complemento) textoPedido += `Complemento: ${complemento}\n`;

        // 3. Dispara a API oficial do WhatsApp
        const numeroLancheria = "5551999999999"; // Substitua pelo número real da lancheria com DDD
        const linkWhatsapp = `https://api.whatsapp.com/send?phone=${numeroLancheria}&text=${encodeURIComponent(textoPedido)}`;
        
        // Limpa a aplicação e redireciona
        carrinho = [];
        atualizarBarraCarrinho();
        fecharModalCadastro();
        
        window.open(linkWhatsapp, "_blank");
    });
}

// ==========================================
// FILTRAGEM DINÂMICA DE CATEGORIAS
// ==========================================
window.filtrarCategoria = function(categoria) {
    const botoes = document.querySelectorAll(".cat-item");
    botoes.forEach(btn => btn.classList.remove("active"));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }

    const secaoSobre = document.getElementById("secao-sobre");

    // Se clicar em "sobre", mostra o card institucional e limpa a lista de itens abaixo
    if (categoria === 'sobre') {
        if (secaoSobre) secaoSobre.style.display = "block";
        menuContainer.innerHTML = "";
        return;
    }

    // Se escolher um cardápio (xis, hambúrguer, bebidas...), esconde a seção Sobre e filtra os itens
    if (secaoSobre) secaoSobre.style.display = "none";
    
    const lanchesFiltrados = listaLanches.filter(lanche => lanche.categoria === categoria);
    renderizarProdutos(lanchesFiltrados);
};

// Inicializa o app
carregarCardapio();