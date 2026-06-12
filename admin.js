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

// Elementos do DOM
const form = document.getElementById("form-cadastro");
const tabelaLanches = document.getElementById("tabela-lanches");
const formTitulo = document.getElementById("form-titulo");
const btnSubmit = document.getElementById("btn-submit");
const idInput = document.getElementById("lanche-id");

// Elementos de Busca e Filtro
const buscaNome = document.getElementById("busca-nome");
const filtroCategoria = document.getElementById("filtro-categoria");

// Elementos do Modal
const modalLanche = document.getElementById("modal-lanche");
const btnAbrirCadastro = document.getElementById("btn-abrir-cadastro");
const btnFecharModal = document.getElementById("btn-fechar-modal");

let lanchesArmazenados = [];

// ==========================================
// CONTROLADORES DO MODAL (ABRIR/FECHAR)
// ==========================================
if (btnAbrirCadastro) {
    btnAbrirCadastro.addEventListener("click", () => {
        resetarFormulario();
        modalLanche.classList.remove("hidden");
    });
}

if (btnFecharModal) {
    btnFecharModal.addEventListener("click", () => {
        modalLanche.classList.add("hidden");
    });
}

if (modalLanche) {
    modalLanche.addEventListener("click", (e) => {
        if (e.target === modalLanche) {
            modalLanche.classList.add("hidden");
        }
    });
}

// ==========================================
// RENDERIZAR E FILTRAR TABELA (CLIENT-SIDE)
// ==========================================
function carregarTabelaAdmin() {
    const q = query(collection(db, "lanches"), orderBy("nome"));
    
    onSnapshot(q, (snapshot) => {
        lanchesArmazenados = [];
        snapshot.forEach((documento) => {
            lanchesArmazenados.push({ id: documento.id, ...documento.data() });
        });

        // Toda vez que o banco mudar, aplica os filtros atuais da tela
        aplicarFiltrosTabela();
    });
}

function aplicarFiltrosTabela() {
    tabelaLanches.innerHTML = "";
    
    const termoBusca = buscaNome.value.toLowerCase().trim();
    const categoriaSelecionada = filtroCategoria.value;

    // Filtra o array local baseado nos inputs de busca do painel
    const lanchesFiltrados = lanchesArmazenados.filter(lanche => {
        const correspondeCategoria = (categoriaSelecionada === "todos" || lanche.categoria === categoriaSelecionada);
        
        const correspondeTexto = (
            lanche.nome.toLowerCase().includes(termoBusca) || 
            lanche.descricao.toLowerCase().includes(termoBusca)
        );

        return correspondeCategoria && correspondeTexto;
    });

    if (lanchesFiltrados.length === 0) {
        tabelaLanches.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Nenhum item corresponde aos filtros.</td></tr>`;
        return;
    }

    // Renderiza apenas os itens filtrados
    lanchesFiltrados.forEach((lanche) => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";
        
        tr.innerHTML = `
            <td style="padding: 10px;"><img src="${lanche.imagemUrl}" style="width:45px; height:45px; object-fit:cover; border-radius:6px;" onerror="this.src='logo.png'"></td>
            <td style="padding: 10px; font-weight:600; color:#333;">${lanche.nome}</td>
            <td style="padding: 10px; color:#666;">${lanche.categoria.toUpperCase()}</td>
            <td style="padding: 10px; font-weight:600; color:var(--cor-primaria);">R$ ${lanche.preco.toFixed(2).replace('.', ',')}</td>
            <td style="padding: 10px; text-align: center;">
                <button class="btn-editar" data-id="${lanche.id}" style="background:#007bff; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; margin-right:5px;"><i class="fas fa-edit"></i></button>
                <button class="btn-excluir" data-id="${lanche.id}" style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tabelaLanches.appendChild(tr);
    });

    configurarBotoesAcao();
}

// Ouvintes de evento para a barra de pesquisa e filtros
if (buscaNome) buscaNome.addEventListener("input", aplicarFiltrosTabela);
if (filtroCategoria) filtroCategoria.addEventListener("change", aplicarFiltrosTabela);

// ==========================================
// OPERAÇÃO DE SALVAMENTO (GRAVAÇÃO / EDIÇÃO)
// ==========================================
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = idInput.value;
        const nome = document.getElementById("nome").value;
        const categoria = document.getElementById("categoria").value;
        const preco = parseFloat(document.getElementById("preco").value);
        const imagemUrl = document.getElementById("imagemUrl").value;
        const descricao = document.getElementById("descricao").value;

        try {
            if (id) {
                const docRef = doc(db, "lanches", id);
                await updateDoc(docRef, { nome, categoria, preco, imagemUrl, descricao });
                alert("Lanche atualizado com sucesso!");
            } else {
                await addDoc(collection(db, "lanches"), { nome, categoria, preco, imagemUrl, descricao, dataCriacao: new Date() });
                alert("Lanche incluído com sucesso!");
            }
            
            modalLanche.classList.add("hidden");
            resetarFormulario();
            
        } catch (error) {
            console.error("Erro na transação:", error);
            alert("Erro ao salvar informações.");
        }
    });
}

// ==========================================
// BOTÕES EDITAR E DELETAR
// ==========================================
function configurarBotoesAcao() {
    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
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

                modalLanche.classList.remove("hidden");
            }
        });
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.removeEventListener("click", lidarExclusao); // Previne duplicação de listeners
        btn.addEventListener("click", lidarExclusao);
    });
}

async function lidarExclusao(e) {
    const id = e.currentTarget.getAttribute("data-id");
    const lanche = lanchesArmazenados.find(l => l.id === id);
    
    if (confirm(`Remover "${lanche.nome}" do cardápio definitivamente?`)) {
        try {
            await deleteDoc(doc(db, "lanches", id));
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("Não foi possível excluir o item.");
        }
    }
}

function resetarFormulario() {
    form.reset();
    idInput.value = "";
    formTitulo.innerText = "Novo Lanche";
    formTitulo.style.color = "var(--cor-primaria)";
    btnSubmit.innerText = "Salvar Lanche";
    btnSubmit.style.background = "var(--cor-primaria)";
}

// Inicializa o fluxo
carregarTabelaAdmin();