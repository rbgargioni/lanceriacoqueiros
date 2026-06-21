import { db } from "./firebase-config.js";
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    doc, 
    updateDoc,
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Elementos do Form/Controle de Cadastro e Edição
const formCadastro = document.getElementById("form-cadastro");
const lancheIdInput = document.getElementById("lanche-id");
const formTitulo = document.getElementById("form-titulo");
const btnSubmit = document.getElementById("btn-submit");
const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
const statusLog = document.getElementById("status-log");

// Elementos de Carga
const btnCargaAutomatica = document.getElementById("btn-carga-automatica");
const btnImportarJson = document.getElementById("btn-importar-json");
const jsonInput = document.getElementById("json-input");

// Elementos da Listagem de Controle
const tabelaLanches = document.getElementById("tabela-lanches");
const buscaNome = document.getElementById("busca-nome");
const filtroCategoria = document.getElementById("filtro-categoria");

let lanchesArmazenados = [];

// Todos os itens do PDF físico mapeados com as chaves exatas que o seu banco lê (nome, preco, categoria, descricao, imagemUrl)
const cardapioMarco2026 = [
    // Novidades
    { nome: "Xis Filé coberto com gorgonzola (Meio)", preco: 75.00, categoria: "Novidades", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Filé coberto com gorgonzola (Inteiro)", preco: 150.00, categoria: "Novidades", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Triplo (Meio)", preco: 71.00, categoria: "Novidades", descricao: "Três bifes de hambúrguer, bacon em tiras, quatro ovos, cebola, tomate, milho, ervilha, alface, ketchup, mostarda, maionese e queijo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Triplo (Inteiro)", preco: 142.00, categoria: "Novidades", descricao: "Três bifes de hambúrguer, bacon em tiras, quatro ovos, cebola, tomate, milho, ervilha, alface, ketchup, mostarda, maionese e queijo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    
    // Xis Tradicionais
    { nome: "Xis Carne Salada (Meio)", preco: 41.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Carne Salada (Inteiro)", preco: 82.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Duplo - Xis (Meio)", preco: 59.00, categoria: "Xis", descricao: "Dois bifes de hambúrguer, cheddar, presunto, quatro ovos, cebola, tomate, milho, ervilha, alface, ketchup, mostarda, maionese e queijo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Duplo - Xis (Inteiro)", preco: 118.00, categoria: "Xis", descricao: "Dois bifes de hambúrguer, cheddar, presunto, quatro ovos, cebola, tomate, milho, ervilha, alface, ketchup, mostarda, maionese e queijo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Carne c/ Fritas (Meio)", preco: 49.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Carne c/ Fritas (Inteiro)", preco: 98.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Frango (Meio)", preco: 41.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Frango (Inteiro)", preco: 82.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Coração (Meio)", preco: 51.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Coração (Inteiro)", preco: 102.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Alcatra (Meio)", preco: 50.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Alcatra (Inteiro)", preco: 100.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Filé Mignon (Meio)", preco: 58.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Filé Mignon (Inteiro)", preco: 116.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },

    // Baurus Redondos
    { nome: "Bauru de Hambúrguer", preco: 36.00, categoria: "Bauru", descricao: "Alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Bauru de Hambúrguer com Bacon", preco: 42.00, categoria: "Bauru", descricao: "Alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Bauru de Frango com Catupiry", preco: 43.00, categoria: "Bauru", descricao: "Alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Bauru de Filé com 4 Queijos", preco: 56.00, categoria: "Bauru", descricao: "Alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" }
];

function exibirMensagem(texto, sucesso) {
    statusLog.style.display = "block";
    statusLog.innerText = texto;
    statusLog.style.background = sucesso ? "#d4edda" : "#f8d7da";
    statusLog.style.color = sucesso ? "#155724" : "#721c24";
}

async function salvarNoFirestore(listaItens) {
    exibirMensagem("Processando envio para o banco de dados...", true);
    try {
        let inseridos = 0;
        for (const item of listaItens) {
            await addDoc(collection(db, "lanches"), item);
            inseridos++;
        }
        exibirMensagem(`🚀 Sucesso total! ${inseridos} lanches foram cadastrados com sucesso!`, true);
    } catch (error) {
        exibirMensagem("❌ Falha ao salvar no Firestore: " + error.message, false);
    }
}

// Evento 1: Carga automática baseada no array mapeado corrigido
btnCargaAutomatica.addEventListener("click", () => {
    if (confirm("Isto vai injetar os novos lanches corrigidos do cardápio de Março de 2026 no seu banco. Deseja prosseguir?")) {
        salvarNoFirestore(cardapioMarco2026);
    }
});

// Evento 2: Carga via caixa de texto (JSON) - COM TRATAMENTO DE CONVERSÃO DE FORMATOS!
btnImportarJson.addEventListener("click", () => {
    const conteudoTexto = jsonInput.value.trim();
    if (!conteudoTexto) return;
    
    try {
        const dadosbrutos = JSON.parse(conteudoTexto);
        const listaParaVerificar = Array.isArray(dadosbrutos) ? dadosbrutos : dadosbrutos.lanches;
        
        if (!listaParaVerificar || !Array.isArray(listaParaVerificar)) {
            exibirMensagem("Erro: Estrutura inválida de JSON.", false);
            return;
        }

        const lanchesFormatados = [];

        // Trata os formatos desajustados do JSON (converte precoMeio/precoInteiro/ingredientes)
        listaParaVerificar.forEach(item => {
            const baseDesc = item.descricao || item.ingredientes || "Lanche delicioso";
            const imgDefault = item.imagemUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500";
            
            if (item.precoMeio !== undefined && item.precoInteiro !== undefined) {
                // Quebra lanche duplo em dois para bater com a estrutura do seu site
                lanchesFormatados.push({ nome: `${item.nome} (Meio)`, preco: parseFloat(item.precoMeio), categoria: item.categoria, descricao: baseDesc, imagemUrl: imgDefault });
                lanchesFormatados.push({ nome: `${item.nome} (Inteiro)`, preco: parseFloat(item.precoInteiro), categoria: item.categoria, descricao: baseDesc, imagemUrl: imgDefault });
            } else {
                const precoFinal = item.preco || item.precoUnico || 0;
                lanchesFormatados.push({ nome: item.nome, preco: parseFloat(precoFinal), categoria: item.categoria, descricao: baseDesc, imagemUrl: imgDefault });
            }
        });

        salvarNoFirestore(lanchesFormatados);
        jsonInput.value = "";
    } catch (e) {
        exibirMensagem("Erro de Sintaxe no JSON: " + e.message, false);
    }
});

// Evento 3: Envio de Formulário convencional
if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const id = lancheIdInput.value;
        const nome = document.getElementById("nomeLanche").value;
        const categoria = document.getElementById("categoria").value;
        const preco = document.getElementById("preco").value;
        const imagemUrl = document.getElementById("imagemUrl").value;
        const descricao = document.getElementById("descricao").value;

        const dadosLanche = { 
            nome, 
            categoria, 
            preco: parseFloat(preco), 
            imagemUrl, 
            descricao 
        };

        try {
            if (id) {
                await updateDoc(doc(db, "lanches", id), dadosLanche);
                exibirMensagem(`🚀 "${nome}" atualizado com sucesso!`, true);
            } else {
                await addDoc(collection(db, "lanches"), dadosLanche);
                exibirMensagem(`🚀 "${nome}" cadastrado com sucesso!`, true);
            }
            resetarFormularioEdicao();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } catch (error) {
            console.error(error);
            exibirMensagem("❌ Erro ao salvar dados do lanche.", false);
        }
    });
}

btnCancelarEdicao.onclick = () => {
    resetarFormularioEdicao();
};

function resetarFormularioEdicao() {
    formCadastro.reset();
    lancheIdInput.value = "";
    formTitulo.innerHTML = `<i class="fas fa-plus-circle"></i> Cadastrar Novo Lanche`;
    btnSubmit.innerHTML = `<i class="fas fa-save"></i> Salvar Lanche`;
    btnSubmit.style.background = "#138342";
    btnCancelarEdicao.style.display = "none";
}

// Escuta Ativa do Firebase
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
            <td><img src="${lanche.imagemUrl}" alt="${lanche.nome}" style="width:45px; height:45px; object-fit:cover; border-radius:6px;" onerror="this.src='logo.jpg'"></td>
            <td><strong>${lanche.nome}</strong><br><small style="color: gray;">${lanche.categoria}</small></td>
            <td><strong>R$ ${parseFloat(lanche.preco).toFixed(2)}</strong></td>
            <td style="text-align: center;">
                <button class="btn-editar" data-id="${lanche.id}" style="background: #ffc107; color: #212529; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;"><i class="fas fa-edit"></i></button>
                <button class="btn-excluir" data-id="${lanche.id}" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tabelaLanches.appendChild(tr);
    });

    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const lanche = lanchesArmazenados.find(l => l.id === id);
            
            if (lanche) {
                lancheIdInput.value = lanche.id;
                document.getElementById("nomeLanche").value = lanche.nome;
                document.getElementById("categoria").value = lanche.categoria;
                document.getElementById("preco").value = lanche.preco;
                document.getElementById("imagemUrl").value = lanche.imagemUrl;
                document.getElementById("descricao").value = lanche.descricao;

                formTitulo.innerHTML = `<i class="fas fa-edit"></i> Editando: ${lanche.nome}`;
                btnSubmit.innerHTML = `<i class="fas fa-sync-alt"></i> Atualizar Informações`;
                btnSubmit.style.background = "#e4b223";
                btnCancelarEdicao.style.display = "block";

                document.getElementById("bloco-formulario").scrollIntoView({ behavior: 'smooth' });
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
                    if (lancheIdInput.value === id) resetarFormularioEdicao();
                } catch (error) {
                    alert("Não foi possível excluir o item.");
                }
            }
        };
    });
}

if (buscaNome) buscaNome.addEventListener("input", aplicarFiltrosImportar);
if (filtroCategoria) filtroCategoria.addEventListener("change", aplicarFiltrosImportar);

function aplicarFiltrosImportar() {
    const termo = buscaNome.value.toLowerCase();
    const catFiltro = filtroCategoria.value;
    const filtrados = lanchesArmazenados.filter(lanche => {
        const bateNome = lanche.nome.toLowerCase().includes(termo);
        const bateCategoria = catFiltro === "todos" || lanche.categoria === catFiltro;
        return bateNome && bateCategoria;
    });
    renderizarTabelaLanches(filtrados);
}