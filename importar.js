import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const btnCargaAutomatica = document.getElementById("btn-carga-automatica");
const btnImportarJson = document.getElementById("btn-importar-json");
const jsonInput = document.getElementById("json-input");
const statusLog = document.getElementById("status-log");

// Todo o mapeamento estruturado do seu PDF físico de Março 2026
const cardapioMarco2026 = [
    // Novidades
    { nome: "Xis Filé coberto com gorgonzola (Meio)", preco: 75.00, categoria: "Novidades", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Filé coberto com gorgonzola (Inteiro)", preco: 150.00, categoria: "Novidades", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Triplo (Meio)", preco: 71.00, categoria: "Novidades", descricao: "Três bifes de hambúrguer, bacon em tiras, quatro ovos, cebola, tomate, milho, ervilha, alface, ketchup, mostarda, maionese e queijo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Triplo (Inteiro)", preco: 142.00, categoria: "Novidades", descricao: "Três bifes de hambúrguer, bacon em tiras, quatro ovos, cebola, tomate, milho, ervilha, alface, ketchup, mostarda, maionese e queijo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    
    // Xis Tradicionais
    { nome: "Xis Carne Salada (Meio)", preco: 41.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Carne Salada (Inteiro)", preco: 82.00, categoria: "Xis", descricao: "Cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Duplo - Xis (Meio)", preco: 59.00, categoria: "Xis", descricao: "Dois bifes, cheddar, presunto, 4 ovos, salada e condimentos tradicionais.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Duplo - Xis (Inteiro)", preco: 118.00, categoria: "Xis", descricao: "Dois bifes, cheddar, presunto, 4 ovos, salada e condimentos tradicionais.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Frango (Meio)", preco: 41.00, categoria: "Xis", descricao: "Frango desfiado, cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Frango (Inteiro)", preco: 82.00, categoria: "Xis", descricao: "Frango desfiado, cebola, alface, tomate, milho, ervilha, ketchup, mostarda, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Coração (Meio)", preco: 51.00, categoria: "Xis", descricao: "Coração de frango acebolado, alface, tomate, milho, ervilha e condimentos.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Coração (Inteiro)", preco: 102.00, categoria: "Xis", descricao: "Coração de frango acebolado, alface, tomate, milho, ervilha e condimentos.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Alcatra (Meio)", preco: 50.00, categoria: "Xis", descricao: "Iscas de alcatra, cebola, alface, tomate, milho, ervilha, queijo, ovo e maionese.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Alcatra (Inteiro)", preco: 100.00, categoria: "Xis", descricao: "Iscas de alcatra, cebola, alface, tomate, milho, ervilha, queijo, ovo e maionese.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Filé Mignon (Meio)", preco: 58.00, categoria: "Xis", descricao: "Iscas de filé mignon legítimo, salada completa, ovo, queijo e molhos.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis Filé Mignon (Inteiro)", preco: 116.00, categoria: "Xis", descricao: "Iscas de filé mignon legítimo, salada completa, ovo, queijo e molhos.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis da Casa Coqueiro (Meio)", preco: 64.00, categoria: "Xis", descricao: "Filé, presunto, azeitona, palmito, picles, salada, ovo, queijo e maionese.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Xis da Casa Coqueiro (Inteiro)", preco: 128.00, categoria: "Xis", descricao: "Filé, presunto, azeitona, palmito, picles, salada, ovo, queijo e maionese.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },

    // Baurus Redondos
    { nome: "Bauru de Hambúrguer", preco: 36.00, categoria: "Bauru", descricao: "Alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Bauru de Hambúrguer com Bacon", preco: 42.00, categoria: "Bauru", descricao: "Hambúrguer, tiras de bacon crocante, alface, tomate, queijo, ovo e maionese.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Bauru de Frango com Catupiry", preco: 43.00, categoria: "Bauru", descricao: "Frango desfiado, catupiry original, alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" },
    { nome: "Bauru de Filé Mignon", preco: 49.00, categoria: "Bauru", descricao: "Iscas de filé mignon, alface, tomate, maionese, queijo e ovo.", imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500" }
];

function exibirMensagem(texto, sucesso) {
    statusLog.style.display = "block";
    statusLog.innerText = texto;
    statusLog.style.background = sucesso ? "#d4edda" : "#f8d7da";
    statusLog.style.color = sucesso ? "#155724" : "#721c24";
}

async function salvarNoFirestore(listaItens) {
    exibirMensagem("Processando envio para o banco de dados... Aguarde.", true);
    try {
        let inseridos = 0;
        for (const item of listaItens) {
            // "lanches" é o nome da coleção que o seu admin.js utiliza
            await addDoc(collection(db, "lanches"), item);
            inseridos++;
        }
        exibirMensagem(`🚀 Sucesso total! ${inseridos} lanches foram cadastrados com sucesso!`, true);
    } catch (error) {
        console.error(error);
        exibirMensagem("❌ Falha crítica ao salvar no Firestore: " + error.message, false);
    }
}

// Evento 1: Carga automática baseada no PDF físico
btnCargaAutomatica.addEventListener("click", () => {
    if (confirm("Isto vai injetar os novos lanches do cardápio de Março de 2026 no seu banco. Deseja prosseguir?")) {
        salvarNoFirestore(cardapioMarco2026);
    }
});

// Evento 2: Carga via caixa de texto (JSON)
btnImportarJson.addEventListener("click", () => {
    const conteudoTexto = jsonInput.value.trim();
    if (!conteudoTexto) {
        exibirMensagem("Erro: O campo de texto está vazio!", false);
        return;
    }

    try {
        const dadosConvertidos = JSON.parse(conteudoTexto);
        if (!Array.isArray(dadosConvertidos)) {
            exibirMensagem("Erro: O JSON precisa ser uma lista de objetos [{}, {}]", false);
            return;
        }
        salvarNoFirestore(dadosConvertidos);
    } catch (e) {
        exibirMensagem("Erro de Sintaxe no JSON! Verifique se esqueceu alguma vírgula ou aspas. Detalhe: " + e.message, false);
    }
});