document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formPerfil");
    const nome = document.getElementById("nome");
    const email = document.getElementById("email");
    const telefone = document.getElementById("telefone");
    const tipoUsuario = document.getElementById("tipoUsuario");
    const mensagem = document.getElementById("mensagem");

    const fotoPerfil = document.getElementById("fotoPerfil");
    const fotoPerfilHeader = document.getElementById("fotoPerfilHeader");
    const iconePerfil = document.getElementById("iconePerfil");
    const nomeFoto = document.getElementById("nomeFoto");

    const inputFoto = document.getElementById("inputFoto");
    const btnAlterarFoto = document.getElementById("btnAlterarFoto");
    const btnRemoverFoto = document.getElementById("btnRemoverFoto");
    const btnCancelar = document.getElementById("btnCancelar");
    const btnVoltar = document.getElementById("btnVoltar");

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    
    let usuarioOriginal = {};

    function mostrarMensagem(texto, tipo) {
        mensagem.textContent = texto;
        mensagem.className = `mensagem ${tipo}`;

        clearTimeout(mostrarMensagem.timer);

        mostrarMensagem.timer = setTimeout(() => {
            mensagem.textContent = "";
            mensagem.className = "mensagem";
        }, 2500);
    }

    function atualizarNome() {
        nomeFoto.textContent = nome.value.trim() || "Meu perfil";
    }

    function preencherCampos(usuario) {
        usuarioOriginal = usuario;

        nome.value = usuario.nome || "";
        email.value = usuario.email || "";
        telefone.value = usuario.telefone || "";
        tipoUsuario.value = usuario.tipo || "adotante";

        atualizarNome();
    }

    async function carregarPerfil() {
        try {
            const resposta = await fetch("/api/usuario/perfil", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível carregar o perfil.");
            }

            preencherCampos(dados);

        } catch (erro) {
            console.error(erro);
            mostrarMensagem(erro.message, "erro");
        }
    }

    async function atualizarCampo(campo, valor) {
        try {
            const resposta = await fetch("/api/usuario/perfil", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    [campo]: valor
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Erro ao atualizar informação.");
            }

            if (dados.usuario) {
                usuarioOriginal = dados.usuario;
            }

            mostrarMensagem("Alteração salva automaticamente!", "sucesso");

        } catch (erro) {
            console.error(erro);
            mostrarMensagem(erro.message, "erro");
        }
    }

    function atualizarCampoComAtraso(elemento, campo, atraso = 700) {
        let temporizador;

        elemento.addEventListener("input", () => {
            clearTimeout(temporizador);

            if (campo === "nome") {
                atualizarNome();
            }

            temporizador = setTimeout(() => {
                atualizarCampo(campo, elemento.value);
            }, atraso);
        });
    }

    atualizarCampoComAtraso(nome, "nome");
    atualizarCampoComAtraso(email, "email");
    atualizarCampoComAtraso(telefone, "telefone");
    atualizarCampoComAtraso(tipoUsuario, "tipoUsuario");

    tipoUsuario.addEventListener("change", () => {
        atualizarCampo("tipo", tipoUsuario.value);
    });

    email.addEventListener("blur", () => {
        atualizarCampo("email", email.value.trim().toLowerCase());
    });

    telefone.addEventListener("blur", () => {
        atualizarCampo("telefone", telefone.value.trim());
    });

    nome.addEventListener("blur", () => {
        atualizarCampo("nome", nome.value.trim());
    });

    btnAlterarFoto.addEventListener("click", () => {
        inputFoto.click();
    });

    inputFoto.addEventListener("change", () => {
        const arquivo = inputFoto.files[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            mostrarMensagem("Selecione uma imagem válida.", "erro");
            inputFoto.value = "";
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            const foto = leitor.result;

            localStorage.setItem("fotoPerfil", foto);

            fotoPerfil.src = foto;
            fotoPerfil.style.display = "block";

            iconePerfil.style.display = "none";

            fotoPerfilHeader.src = foto;
            fotoPerfilHeader.style.display = "block";

            mostrarMensagem("Foto atualizada automaticamente!", "sucesso");
        };

        leitor.readAsDataURL(arquivo);
    });

    btnRemoverFoto.addEventListener("click", () => {
        localStorage.removeItem("fotoPerfil");

        fotoPerfil.removeAttribute("src");
        fotoPerfil.style.display = "none";

        iconePerfil.style.display = "flex";

        fotoPerfilHeader.removeAttribute("src");
        fotoPerfilHeader.style.display = "none";

        inputFoto.value = "";

        mostrarMensagem("Foto removida!", "sucesso");
    });

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        mostrarMensagem("As informações já são salvas automaticamente.", "sucesso");
    });

    btnCancelar.addEventListener("click", () => {
        window.location.href = "perfil.html";
    });

    btnVoltar.addEventListener("click", () => {
        window.location.href = "perfil.html";
    });

    const fotoSalva = localStorage.getItem("fotoPerfil");

    if (fotoSalva) {
        fotoPerfil.src = fotoSalva;
        fotoPerfil.style.display = "block";

        iconePerfil.style.display = "none";

        fotoPerfilHeader.src = fotoSalva;
        fotoPerfilHeader.style.display = "block";
    } else {
        fotoPerfil.style.display = "none";
        fotoPerfilHeader.style.display = "none";
        iconePerfil.style.display = "flex";
    }

    await carregarPerfil();
});
