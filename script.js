const inputUsuario = document.getElementById("userInput");
const botaoIr = document.getElementById("btnIr");
const msgErro = document.getElementById("mensagemErro");
function irParaPerfil() {
    const usuario = inputUsuario.value.trim();
    if (usuario === "") {
        msgErro.textContent = "Por favor, digite um nome de usuário.";
        return;
    }
    msgErro.textContent = "";
    if (typeof gtag === "function") {
        gtag("event", "generate_charts", {
            event_category: "Charts",
            event_label: "Username Submit (Success)",
            lastfm_user: usuario,
        });
    }
    window.location.href = "resultado.html?user=" + usuario;
}
botaoIr.addEventListener("click", irParaPerfil);
inputUsuario.addEventListener("keypress", function (evento) {
    if (evento.key === "Enter") {
        irParaPerfil();
    }
});
if (document.getElementById("currentYear")) {
    document.getElementById("currentYear").textContent = new Date().getFullYear();
}
