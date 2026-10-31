function mostrarSenha() {
    const senha = document.getElementById("uePassowrd");
    const olho = document.getElementById("ueEyePass");

    senha.type = senha.type === "password" ? "text" : "password";

    olho.classList.toggle("fa-eye");
    olho.classList.toggle("fa-eye-slash");
}