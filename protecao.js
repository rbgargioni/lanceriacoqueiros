import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Bloqueia a visualização da página imediatamente até que o Firebase valide o usuário
document.body.style.display = "none";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Se não estiver logado no Google, expulsa para a página inicial
        alert("Acesso negado! Você precisa fazer login na página inicial.");
        window.location.href = "index.html";
        return;
    }

    try {
        // Verifica se o e-mail do usuário logado existe na coleção "usuarios_permitidos"
        const docRef = doc(db, "usuarios_permitidos", user.email.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Usuário autorizado! Libera o HTML da página
            document.body.style.display = "block";
        } else {
            // E-mail não cadastrado no sistema
            alert(`O e-mail ${user.email} não tem permissão para acessar esta área.`);
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Erro na verificação de permissões:", error);
        window.location.href = "index.html";
    }
});