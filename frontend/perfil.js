const API_URL = "http://localhost:3000";

async function atualizarFotoPerfilHeader() {
    const foto = document.getElementById("fotoPerfilHeader");

    if (!foto) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
        foto.src = "logo.png";
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/perfil?atualizacao=${Date.now()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (!resposta.ok) {
            console.error("Erro ao buscar perfil:", resposta.status);
            return;
        }

        const dados = await resposta.json();
        console.log("PERFIL RECEBIDO:", dados);

        const fotoPerfil = dados.usuario?.foto_perfil;

        if (fotoPerfil && fotoPerfil.startsWith("data:image/")) {
            foto.src = fotoPerfil;
            console.log("FOTO ATUALIZADA NO HEADER");
        } else {
            foto.src = "logo.png";
            console.log("Usuário não possui foto.");
        }

        foto.onerror = () => {
            console.error("Erro ao carregar a imagem.");
            foto.src = "logo.png";
        };

    } catch (erro) {
        console.error("Erro ao carregar foto:", erro);
    }
}

window.atualizarFotoPerfilHeader = atualizarFotoPerfilHeader;

document.addEventListener("DOMContentLoaded", () => {
    atualizarFotoPerfilHeader();
});