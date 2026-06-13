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

// Elementos dos Modais
const modalCarrinho = document.getElementById("modal-carrinho");
const modalCadastro = document.getElementById("modal-cadastro");
const formCadastro = document.getElementById("form-cadastro");
const btnAvancarPedido = document.getElementById("btn-avancar-pedido");
const carrinhoItensContainer = document.getElementById("carrinho-itens");
const modalCartTotal = document.getElementById("modal-cart-total");

// ==========================================================================
// AUTENTICAÇÃO GOOGLE E CHECAGEM DE CADASTRO NO FIRESTORE
// ==========================================================================
if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Erro na autenticação:", error);
            alert("Falha ao autenticar com o Google.");
        }
    });
}

// Observador do estado de autenticação (Dispara automaticamente ao logar/deslogar)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioLogado = user;
        if (btnLogin) btnLogin.classList.add("hidden");
        if (userInfo) {
            // Mostra o primeiro nome vindo da conta Google do usuário
            userInfo.innerText = `Olá, ${user.displayName.split(' ')[0]}`;
            userInfo.classList.remove("hidden");
        }
        // Busca se o usuário já tem Telefone/Endereço salvos no Firestore
        await carregarDadosUsuarioExistente(user);
    } else {
        usuarioLogado = null;
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (userInfo) {
            userInfo.innerText = "";
            userInfo.classList.add("hidden");
        }
    }
});

// Função que puxa os dados adicionais de endereço usando o UID do Google
async function carregarDadosUsuarioExistente(user) {
    try {
        const userDocRef = doc(db, "clientes", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const dados = userDoc.data();
            // Preenche automaticamente o formulário para o usuário não ter que digitar de novo
            if (document.getElementById("user-nome")) document.getElementById("user-nome").value = dados.nome || user.displayName;
            if (document.getElementById("user-cpf")) document.getElementById("user-cpf").value = dados.cpf || "";
            if (document.getElementById("user-telefone")) document.getElementById("user-telefone").value = dados.telefone || "";
            if (document.getElementById("user-cidade")) document.getElementById("user-cidade").value = dados.cidade || "Porto Alegre";
            if (document.getElementById("user-bairro")) document.getElementById("user-bairro").value = dados.bairro || "";
            if (document.getElementById("user-rua")) document.getElementById("user-rua").value = dados.rua || "";
            if (document.getElementById("user-numero")) document.getElementById("user-numero").value = dados.numero || "";
            if (document.getElementById("user-complemento")) document.getElementById("user-complemento").value = dados.complemento || "";
        } else {
            // Se for a primeira vez dele, apenas joga o nome do Google no campo de Nome
            if (document.getElementById("user-nome")) document.getElementById("user-nome").value = user.displayName || "";
        }
    } catch (error) {
        console.error("Erro ao carregar dados salvos do Firestore:", error);
    }
}

// Modais - Funções de Controle de Exibição
window.abrirModalCarrinho = function() {
    if (modalCarrinho) modalCarrinho.classList.remove("hidden");
    renderizarItensCarrinhoModal();
};

window.fecharModalCarrinho = function() {
    if (modalCarrinho) modalCarrinho.classList.add("hidden");
};

window.abrirModalCadastro = function() {
    if (modalCadastro) modalCadastro.classList.remove("hidden");
};

window.fecharModalCadastro = function() {
    if (modalCadastro) modalCadastro.classList.add("hidden");
};

// ==========================================================================
// RENDERIZAÇÃO DO CARDÁPIO ATRAVÉS DO FIRESTORE
// ==========================================================================
const q = query(collection(db, "lanches"), orderBy("nome", "asc"));
onSnapshot(q, (snapshot) => {
    listaLanches = [];
    snapshot.forEach(doc => {
        listaLanches.push({ id: doc.id, ...doc.data() });
    });
    renderizarCardapio(listaLanches);
});

function renderizarCardapio(lanches) {
    if (!menuContainer) return;
    menuContainer.innerHTML = "";
    
    lanches.forEach(lanche => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "lanche-item";
        itemDiv.setAttribute("data-categoria", lanche.categoria);
        
        const itemNoCarrinho = carrinho.find(item => item.id === lanche.id);
        let secaoAcaoHTML = "";
        
        if (itemNoCarrinho) {
            secaoAcaoHTML = `
                <div class="carrinho-contador-inline">
                    <button onclick="alterarQuantidade('${lanche.id}', -1)" class="btn-contador">-</button>
                    <span class="qtd-contador">${itemNoCarrinho.quantidade}</span>
                    <button onclick="alterarQuantidade('${lanche.id}', 1)" class="btn-contador">+</button>
                </div>
            `;
        } else {
            secaoAcaoHTML = `
                <button class="btn-add-carrinho" onclick="adicionarAoCarrinho('${lanche.id}')">
                    <i class="fas fa-plus"></i> Adicionar
                </button>
            `;
        }
        
        itemDiv.innerHTML = `
            <img src="${lanche.imagemUrl}" alt="${lanche.nome}" class="lanche-img" onerror="this.src='logo.jpg'">
            <div class="lanche-detalhes">
                <h3 class="lanche-nome">${lanche.nome}</h3>
                <p class="lanche-descricao">${lanche.descricao}</p>
                <div class="lanche-preco-acao">
                    <span class="lanche-preco">R$ ${parseFloat(lanche.preco).toFixed(2).replace('.', ',')}</span>
                    ${secaoAcaoHTML}
                </div>
            </div>
        `;
        menuContainer.appendChild(itemDiv);
    });
}

window.adicionarAoCarrinho = function(id) {
    const lanche = listaLanches.find(l => l.id === id);
    if (!lanche) return;

    const itemExistente = carrinho.find(item => item.id === id);
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ ...lanche, quantidade: 1 });
    }
    atualizarBarraCarrinho();
    renderizarCardapio(listaLanches);
};

function atualizarBarraCarrinho() {
    const qtdTotal = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const vlrTotal = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco) * item.quantidade), 0);

    if (qtdTotal > 0) {
        if (cartBar) cartBar.classList.remove("hidden");
        if (cartQtd) cartQtd.innerText = qtdTotal;
        if (cartTotal) cartTotal.innerText = `R$ ${vlrTotal.toFixed(2).replace('.', ',')}`;
    } else {
        if (cartBar) cartBar.classList.add("hidden");
    }
}

function renderizarItensCarrinhoModal() {
    if (!carrinhoItensContainer) return;
    carrinhoItensContainer.innerHTML = "";
    
    if (carrinho.length === 0) {
        carrinhoItensContainer.innerHTML = "<p style='text-align:center; color:#888; padding: 20px;'>Seu carrinho está vazio.</p>";
        if (modalCartTotal) modalCartTotal.innerText = "R$ 0,00";
        return;
    }

    carrinho.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.style.display = "flex";
        itemDiv.style.justifyContent = "space-between";
        itemDiv.style.alignItems = "center";
        itemDiv.style.marginBottom = "12px";
        itemDiv.style.background = "#f9f9f9";
        itemDiv.style.padding = "8px 12px";
        itemDiv.style.borderRadius = "8px";
        itemDiv.style.gap = "10px";

        itemDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <img src="${item.imagemUrl}" alt="${item.nome}" class="modal-lanche-thumb" onerror="this.src='logo.jpg'">
                <div>
                    <h4 style="margin:0; font-size:0.95rem;">${item.nome}</h4>
                    <small style="color:#777;">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')} x ${item.quantidade}</small>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="alterarQuantidade('${item.id}', -1)" style="border:none; background:#ddd; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">-</button>
                <span style="font-weight:bold; font-size:0.9rem;">${item.quantidade}</span>
                <button onclick="alterarQuantidade('${item.id}', 1)" style="border:none; background:#ddd; padding:2px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">+</button>
            </div>
        `;
        carrinhoItensContainer.appendChild(itemDiv);
    });

    const vlrTotal = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco) * item.quantidade), 0);
    if (modalCartTotal) modalCartTotal.innerText = `R$ ${vlrTotal.toFixed(2).replace('.', ',')}`;
}

window.alterarQuantidade = function(id, delta) {
    const item = carrinho.find(item => item.id === id);
    if (!item) return;

    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter(item => item.id !== id);
    }
    atualizarBarraCarrinho();
    renderizarCardapio(listaLanches);
    
    if (modalCarrinho && !modalCarrinho.classList.contains("hidden")) {
        renderizarItensCarrinhoModal();
    }
};

// Ação do Botão Avançar dentro da Sacola
if (btnAvancarPedido) {
    btnAvancarPedido.addEventListener("click", () => {
        // REGRA DE SEGURANÇA: Se não estiver logado com Google, força o login primeiro
        if (!usuarioLogado) {
            alert("Para prosseguir com o seu pedido, você precisa se conectar com sua conta Google!");
            fecharModalCarrinho();
            if (btnLogin) btnLogin.click();
            return;
        }
        // Se já está logado, fecha a sacola e abre o modal para confirmar/inserir telefone e endereço
        fecharModalCarrinho();
        abrirModalCadastro();
    });
}

// ==========================================================================
// SUBMIT DO FORMULÁRIO: VINCULA DADOS AO UID GOOGLE E ENVIA WHATSAPP
// ==========================================================================
if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!usuarioLogado) {
            alert("Erro: Você precisa estar autenticado com o Google.");
            return;
        }

        // Montagem do Objeto mesclando ID do Google com inputs de Telefone/Endereço
        const dadosCliente = {
            uid: usuarioLogado.uid,
            nome: document.getElementById("user-nome").value,
            cpf: document.getElementById("user-cpf").value,
            telefone: document.getElementById("user-telefone").value,
            cidade: document.getElementById("user-cidade").value,
            bairro: document.getElementById("user-bairro").value,
            rua: document.getElementById("user-rua").value,
            numero: document.getElementById("user-numero").value,
            complemento: document.getElementById("user-complemento").value,
            email: usuarioLogado.email, // Puxado direto da conta Google
            atualizadoEm: new Date().toISOString()
        };

        try {
            // Salva ou atualiza os dados na coleção "clientes" com o ID fixo do Google
            await setDoc(doc(db, "clientes", usuarioLogado.uid), dadosCliente);

            // Geração da mensagem de texto formatada para o WhatsApp
            let textoPedido = `*🍔 NOVO PEDIDO (LANCHERIA COQUEIRO)*\n\n`;
            textoPedido += `*--- DADOS DE ENTREGA ---*\n`;
            textoPedido += `👤 *Nome:* ${dadosCliente.nome}\n`;
            textoPedido += `🆔 *CPF:* ${dadosCliente.cpf}\n`;
            textoPedido += `📞 *WhatsApp:* ${dadosCliente.telefone}\n`;
            textoPedido += `📍 *Endereço:* ${dadosCliente.rua}, Nº ${dadosCliente.numero}\n`;
            textoPedido += `🏘️ *Bairro:* ${dadosCliente.bairro} - ${dadosCliente.cidade}\n`;
            if (dadosCliente.complemento) {
                textoPedido += `🏢 *Complemento:* ${dadosCliente.complemento}\n`;
            }
            textoPedido += `\n*--- ITENS DO PEDIDO ---*\n`;

            carrinho.forEach(item => {
                textoPedido += `▪️ ${item.quantidade}x ${item.nome} (R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')} cada)\n`;
            });

            const vlrTotal = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco) * item.quantidade), 0);
            textoPedido += `\n💰 *Total Geral:* R$ ${vlrTotal.toFixed(2).replace('.', ',')}`;

            // Substitua pelo número oficial de atendimento da lancheria
            const numeroLancheria = "5551999999999"; 
            const linkWhatsapp = `https://api.whatsapp.com/send?phone=${numeroLancheria}&text=${encodeURIComponent(textoPedido)}`;
            
            // Limpezas pós sucesso
            carrinho = [];
            atualizarBarraCarrinho();
            fecharModalCadastro();
            renderizarCardapio(listaLanches);
            
            alert("Cadastro sincronizado e pedido enviado!");
            window.open(linkWhatsapp, "_blank");

        } catch (error) {
            console.error("Erro ao salvar dados no Firestore:", error);
            alert("Erro ao sincronizar suas informações com o banco de dados.");
        }
    });
}

// Filtragem de categorias por abas horizontais
window.filtrarCategoria = function(categoria) {
    const botoes = document.querySelectorAll(".cat-item");
    botoes.forEach(btn => btn.classList.remove("active"));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }

    const secaoSobre = document.getElementById("secao-sobre");

    if (categoria === 'sobre') {
        if (secaoSobre) secaoSobre.style.display = "block";
        menuContainer.innerHTML = "";
        return;
    }

    if (secaoSobre) secaoSobre.style.display = "none";

    if (categoria === 'todos') {
        renderizarCardapio(listaLanches);
    } else {
        const filtrados = listaLanches.filter(l => l.categoria === categoria);
        renderizarCardapio(filtrados);
    }
};