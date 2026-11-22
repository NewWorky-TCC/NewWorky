// Página de login: botão do "olho" que mostra/oculta a senha.
function mostrarSenha() {
  const campo = document.getElementById('uePassowrd');
  const botao = document.querySelector('.submit-eye');
  const mostrando = campo.type === 'text';

  campo.type = mostrando ? 'password' : 'text';
  botao.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
  document.getElementById('ueEyePass').textContent = mostrando ? '👁' : '🙈';
}
