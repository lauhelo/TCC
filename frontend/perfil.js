const API_URL="http://localhost:3000";

async function atualizarFotoPerfilHeader(){
const foto=document.getElementById("fotoPerfilHeader");

if(!foto)return;

const token=localStorage.getItem("token")||sessionStorage.getItem("token");

if(!token){
foto.src="logo.png";
return;
}

try{
const resposta=await fetch(`${API_URL}/perfil?atualizacao=${Date.now()}`,{
method:"GET",
headers:{
"Authorization":`Bearer ${token}`
},
cache:"no-store"
});

if(resposta.status===401){
foto.src="logo.png";
return;
}

if(!resposta.ok){
console.error("Erro ao buscar perfil:",resposta.status);
foto.src="logo.png";
return;
}

const dados=await resposta.json();
const fotoPerfil=dados.usuario?.foto_perfil;

if(fotoPerfil&&String(fotoPerfil).trim()!==""){
foto.src=fotoPerfil;
}else{
foto.src="logo.png";
}

foto.onerror=function(){
this.onerror=null;
this.src="logo.png";
};

}catch(erro){
console.error("Erro ao carregar foto:",erro);
foto.src="logo.png";
}
}

window.atualizarFotoPerfilHeader=atualizarFotoPerfilHeader;

document.addEventListener("DOMContentLoaded",()=>{
atualizarFotoPerfilHeader();
});