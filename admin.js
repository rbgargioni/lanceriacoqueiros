import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const form = document.getElementById("form-cadastro");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("Tentando enviar um lanche de teste direto para o Firestore...");

        try {
            // Enviando dados fixos para testar se as regras do banco estão abertas
            const docRef = await addDoc(collection(db, "lanches"), {
                nome: "Xis Salada Teste",
                categoria: "xis",
                preco: 25.90,
                imagemUrl: "image_2c6f96.jpg",
                descricao: "Ingredientes de teste para validação do banco de dados.",
                dataCriacao: new Date()
            });

            console.log("Sucesso completo! ID gerado no Firestore:", docRef.id);
            alert("Conexão com o banco funcionando! Lanche cadastrado com ID: " + docRef.id);
            form.reset();
            
        } catch (error) {
            // Este log vai mostrar a mensagem vermelha exata do Firebase no console
            console.error("ERRO CRÍTICO ENCONTRADO NO FIRESTORE:", error);
            alert("Falha na gravação. Olhe a linha vermelha no console (F12) para ver o motivo.");
        }
    });
}