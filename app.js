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
// FUNÇÃO DE NOTIFICAÇÃO PERSONALIZADA (Substitui os alerts nativos)
// ==========================================================================
function exibirAviso(mensagem, tipo = 'sucesso') {
    const toast = document.getElementById("toast-notification");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");

    if (!toast || !toastMsg) return;

    toastMsg.innerText = mensagem;

    if (tipo === 'erro') {
        toast.classList.add("error");
        if (toastIcon) toastIcon.className = "fas fa-exclamation-circle";
    } else {
        toast.classList.remove("error");
        if (toastIcon) toastIcon.className = "fas fa-check-circle";
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

// ==========================================================================
// AUTENTICAÇÃO GOOGLE E CHECAGEM DE CADASTRO NO FIRESTORE
// ==========================================================================
if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Erro na autenticação:", error);
            exibirAviso("Falha ao autenticar com o Google.", "erro");
        }
    });
}

// Observador do estado de autenticação (Dispara automaticamente ao logar/deslogar)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioLogado = user;
        if (btnLogin) btnLogin.classList.add("hidden");
        if (userInfo) {
            userInfo.innerText = `Olá, ${user.displayName.split(' ')[0]}`;
            userInfo.classList.remove("hidden");
        }
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

// Função para buscar dados cadastrais anteriores
async function carregarDadosUsuarioExistente(user) {
    try {
        const userDocRef = doc(db, "clientes", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const dados = userDoc.data();
            if (document.getElementById("user-nome")) document.getElementById("user-nome").value = dados.nome || user.displayName;
            if (document.getElementById("user-cpf")) document.getElementById("user-cpf").value = dados.cpf || "";
            if (document.getElementById("user-telefone")) document.getElementById("user-telefone").value = dados.telefone || "";
            if (document.getElementById("user-cidade")) document.getElementById("user-cidade").value = dados.cidade || "Porto Alegre";
            if (document.getElementById("user-bairro")) document.getElementById("user-bairro").value = dados.bairro || "";
            if (document.getElementById("user-rua")) document.getElementById("user-rua").value = dados.rua || "";
            if (document.getElementById("user-numero")) document.getElementById("user-numero").value = dados.numero || "";
            if (document.getElementById("user-complemento")) document.getElementById("user-complemento").value = dados.complemento || "";
        } else {
            if (document.getElementById("user-nome")) document.getElementById("user-nome").value = user.displayName || "";
        }
    } catch (error) {
        console.error("Erro ao carregar dados salvos do Firestore:", error);
    }
}

// Função para buscar por texto
window.filtrarPorTexto = function(termo) {
    const textoBusca = termo.toLowerCase().trim();
    const secaoSobre = document.getElementById("secao-sobre");
    if (secaoSobre) secaoSobre.style.display = "none";

    if (textoBusca === "") {
        renderizarCardapio(listaLanches);
        return;
    }

    const lanchesFiltrados = listaLanches.filter(lanche => {
        const nome = (lanche.nome || "").toLowerCase();
        const descricao = (lanche.descricao || "").toLowerCase();
        return nome.includes(textoBusca) || descricao.includes(textoBusca);
    });

    renderizarCardapio(lanchesFiltrados);
};

// Controladores dos Modais
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

function animarCards(){
    const cards = document.querySelectorAll(".lanche-item");
    const observer = new IntersectionObserver((entries)=>{
        entries.forEach((entry,index)=>{
            if(entry.isIntersecting){
                setTimeout(()=>{
                    entry.target.classList.add("show");
                },index*80);
            }
        });
    });
    cards.forEach(card=>observer.observe(card));
}

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
    animarCards();
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
    atualizarCard(id);
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

    carrinho.forEach((item, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.style.flexDirection = "column";
        itemDiv.style.marginBottom = "12px";
        itemDiv.style.background = "#f9f9f9";
        itemDiv.style.padding = "10px 12px";
        itemDiv.style.borderRadius = "8px";
        itemDiv.style.gap = "8px";

        itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
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
            </div>
            
            <input type="text" 
                class="input-obs-item"
                placeholder="Ex: sem alface, sem ervilha..." 
                value="${item.observacao || ''}" 
                onchange="atualizarObservacaoItem(${index}, this.value)"
            />
        `;
        carrinhoItensContainer.appendChild(itemDiv);
    });

    const vlrTotal = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco) * item.quantidade), 0);
    if (modalCartTotal) modalCartTotal.innerText = `R$ ${vlrTotal.toFixed(2).replace('.', ',')}`;
}

window.atualizarObservacaoItem = function(index, texto) {
    if (carrinho[index]) {
        carrinho[index].observacao = texto;
    }
};

window.alterarQuantidade = function(id, delta) {
    const item = carrinho.find(item => item.id === id);
    if (!item) return;

    item.quantidade += delta;
    if (item.quantidade <= 0) {
        carrinho = carrinho.filter(item => item.id !== id);
    }
    atualizarBarraCarrinho();
    atualizarCard(id);
    
    if (modalCarrinho && !modalCarrinho.classList.contains("hidden")) {
        renderizarItensCarrinhoModal();
    }
};

function atualizarCard(id){
    const card = document.querySelector(`[onclick="adicionarAoCarrinho('${id}')"]`)?.closest(".lanche-item")
        || [...document.querySelectorAll(".lanche-item")].find(c =>
            c.querySelector(`[onclick*="${id}"]`)
        );

    if(!card) return;

    const lanche = listaLanches.find(l=>l.id===id);
    const item = carrinho.find(i=>i.id===id);

    const area = card.querySelector(".lanche-preco-acao");

    area.innerHTML = `
        <span class="lanche-preco">
            R$ ${parseFloat(lanche.preco).toFixed(2).replace('.',',')}
        </span>

        ${
            item ?
            `<div class="carrinho-contador-inline">
                <button onclick="alterarQuantidade('${id}',-1)" class="btn-contador">-</button>
                <span class="qtd-contador">${item.quantidade}</span>
                <button onclick="alterarQuantidade('${id}',1)" class="btn-contador">+</button>
            </div>`
            :
            `<button class="btn-add-carrinho" onclick="adicionarAoCarrinho('${id}')">
                <i class="fas fa-plus"></i> Adicionar
            </button>`
        }
    `;
}

if (btnAvancarPedido) {
    btnAvancarPedido.addEventListener("click", () => {
        if (!usuarioLogado) {
            exibirAviso("Conecte-se com sua conta Google para continuar!", "erro");
            fecharModalCarrinho();
            if (btnLogin) btnLogin.click();
            return;
        }
        fecharModalCarrinho();
        abrirModalCadastro();
    });
}

// ==========================================================================
// SUBMIT DO FORMULÁRIO DE ENTREGA
// ==========================================================================
if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!usuarioLogado) {
            exibirAviso("Você precisa estar conectado ao Google.", "erro");
            return;
        }

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
            email: usuarioLogado.email, 
            atualizadoEm: new Date().toISOString()
        };

        try {
            const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js");

            await setDoc(doc(db, "clientes", usuarioLogado.uid), dadosCliente);

            const vlrTotal = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco) * item.quantidade), 0);

            const novoPedidoFirestore = {
                data: new Date().toISOString(),
                status: "Aguardando",
                total: vlrTotal,
                formaPagamento: document.getElementById("user-pagamento")?.value || "Não informado",
                troco: document.getElementById("user-troco")?.value || "Não informado",
                cliente: {
                    nome: dadosCliente.nome,
                    telefone: dadosCliente.telefone,
                    endereco: {
                        rua: dadosCliente.rua,
                        numero: dadosCliente.numero,
                        bairro: dadosCliente.bairro,
                        complemento: dadosCliente.complemento
                    }
                },
                itens: carrinho.map(item => ({
                    quantidade: item.quantidade,
                    nome: item.nome,
                    observacao: item.observacao || ""
                }))
            };

            await addDoc(collection(db, "pedidos"), novoPedidoFirestore);

            // Montagem da mensagem
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
                if (item.observacao && item.observacao.trim() !== "") {
                    textoPedido += `   └ 📝 *Obs:* ${item.observacao.trim()}\n`;
                }
            });
            
            textoPedido += `\n💰 *Total Geral:* R$ ${vlrTotal.toFixed(2).replace('.', ',')}`;

            const numeroLancheria = "5551984779161"; 
            // Link wa.me para garantir compatibilidade com iOS/Safari
            const linkWhatsapp = `https://wa.me/${numeroLancheria}?text=${encodeURIComponent(textoPedido)}`;
            
            // Limpezas
            carrinho = [];
            atualizarBarraCarrinho();
            fecharModalCadastro();
            renderizarCardapio(listaLanches);
            
            exibirAviso("Pedido gerado! Redirecionando para o WhatsApp...");

            // Abre na própria janela para evitar o bloqueio de pop-up no iPhone
            setTimeout(() => {
                window.location.href = linkWhatsapp;
            }, 800);

        } catch (error) {
            console.error("Erro ao salvar dados no Firestore:", error);
            exibirAviso("Erro ao sincronizar informações com o servidor.", "erro");
        }
    });
}

// Filtragem de categorias
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