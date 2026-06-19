import { db } from "./firebase-config.js";
import { 
    collection, 
    setDoc, 
    doc, 
    onSnapshot, 
    deleteDoc,
    query
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const formUsuario = document.getElementById("form-usuario");
const tabelaUsuarios = document.getElementById("tabela-usuarios");
const statusLog = document.getElementById("status-log");

function exibirMensagem(texto, sucesso) {
    statusLog.style.display = "block";
    statusLog.innerText = texto;
    statusLog.style.background = sucesso ? "#d4edda" : "#f8d7da";
    statusLog.style.color = sucesso ? "#155724" : "#721c24";
    setTimeout(() => { statusLog.style.display = "none"; }, 4000);
}

// Evento: Cadastrar/Salvar Usuário e Senha Internos
if (formUsuario) {
    formUsuario.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const usuarioInput = document.getElementById("loginUsuarioCadastro").value.trim().toLowerCase();
        const senhaInput = document.getElementById("senhaUsuarioCadastro").value.trim();

        try {
            // Cria ou atualiza o operador usando o login como chave ID única
            await setDoc(doc(db, "usuarios_permitidos", usuarioInput), {
                usuario: usuarioInput,
                senha: senhaInput,
                dataCriacao: new Date().toISOString()
            });
            
            exibirMensagem(`🚀 Operador "${usuarioInput}" configurado com sucesso!`, true);
            formUsuario.reset();
        } catch (error) {
            console.error(error);
            exibirMensagem("❌ Erro ao salvar credenciais no Firestore.", false);
        }
    });
}

// Ouvinte em tempo real da coleção de credenciais
onSnapshot(query(collection(db, "usuarios_permitidos")), (snapshot) => {
    if (!tabelaUsuarios) return;
    tabelaUsuarios.innerHTML = "";

    let total = 0;
    snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        total++;
        
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 12px 10px;"><strong><i class="fas fa-user-shield" style="color:#777;"></i> ${u.usuario}</strong></td>
            <td style="padding: 12px 10px; font-family: monospace; color: #555;">${u.senha}</td>
            <td style="text-align: center; padding: 12px 10px;">
                <button class="btn-revogar" data-id="${u.usuario}" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size:0.85rem;">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </td>
        `;
        tabelaUsuarios.appendChild(tr);
    });

    if (total === 0) {
        tabelaUsuarios.innerHTML = `<tr><td colspan="3" style="padding:20px; text-align:center; color:#999; font-style:italic;">Nenhuma credencial configurada no banco.</td></tr>`;
        return;
    }

    // Configurando cliques de remoção
    document.querySelectorAll(".btn-revogar").forEach(btn => {
        btn.onclick = async (e) => {
            const idOperador = e.currentTarget.getAttribute("data-id");
            if (confirm(`Remover permanentemente o acesso do usuário "${idOperador}"?`)) {
                try {
                    await deleteDoc(doc(db, "usuarios_permitidos", idOperador));
                    exibirMensagem("Usuário removido do sistema.", true);
                } catch (error) {
                    alert("Não foi possível excluir o usuário.");
                }
            }
        };
    });
});