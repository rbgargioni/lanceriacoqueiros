import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const form = document.getElementById("form-cadastro");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Impede a página de recarregar

        // Coleta os valores digitados
        const nome = document.getElementById("nome").value;
        const categoria = document.getElementById("categoria").value;
        const preco = parseFloat(document.getElementById("preco").value);
        const imagemUrl = document.getElementById("imagemUrl").value;
        const descricao = document.getElementById("descricao").value;

        try {
            // Envia de forma assíncrona para a coleção 'lanches'
            const docRef = await addDoc(collection(db, "lanches"), {
                nome: nome,
                categoria: categoria,
                preco: preco,
                imagemUrl: imagemUrl,
                descricao: descricao,
                dataCriacao: new Date()
            });

            alert("Sucesso! Lanche cadastrado com o ID: " + docRef.id);
            form.reset(); // Limpa os campos do formulário para o próximo cadastro
            
        } catch (error) {
            console.error("Erro ao salvar no banco: ", error);
            alert("Ocorreu um erro ao salvar o lanche. Verifique o console.");
        }
    });
}