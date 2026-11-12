const API_URL = "http://localhost:3000";

function limparDadosAutenticacaoHeader() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("idOngAtiva");
    localStorage.removeItem("nomeOngAtiva");
    localStorage.removeItem("nome");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("tipoUsuario");
    sessionStorage.removeItem("idOngAtiva");
    sessionStorage.removeItem("nomeOngAtiva");
    sessionStorage.removeItem("nome");
}

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
                "Authorization": `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (resposta.status === 401) {
            limparDadosAutenticacaoHeader();
            foto.src = "logo.png";
            return;
        }

        if (!resposta.ok) {
            console.error("Erro ao buscar perfil:", resposta.status);
            foto.src = "logo.png";
            return;
        }

        const dados = await resposta.json();
        const fotoPerfil = dados.usuario?.foto_perfil;

        foto.src = fotoPerfil && String(fotoPerfil).trim() !== ""
            ? fotoPerfil
            : "logo.png";

    } catch (erro) {
        console.error("Erro ao carregar foto:", erro);
        foto.src = "logo.png";
    }

    foto.onerror = function () {
        this.onerror = null;
        this.src = "logo.png";
    };
}

window.atualizarFotoPerfilHeader = atualizarFotoPerfilHeader;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", atualizarFotoPerfilHeader);
} else {
    atualizarFotoPerfilHeader();
}

window.addEventListener("storage", atualizarFotoPerfilHeader);