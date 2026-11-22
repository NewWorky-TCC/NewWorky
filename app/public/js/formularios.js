// Funções dos formulários: mostrar senha, força da senha, máscara de CNPJ,
// contador de caracteres e proteção contra envio duplo.

/* 1. Botão "Mostrar/Ocultar" em todos os campos de senha */
function iniciarMostrarSenha() {
  document.querySelectorAll('input[type="password"]').forEach((campo) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'ver-senha';
    botao.textContent = 'Mostrar senha';
    botao.setAttribute('aria-pressed', 'false');
    campo.insertAdjacentElement('afterend', botao);

    botao.addEventListener('click', () => {
      const mostrando = campo.type === 'text';
      campo.type = mostrando ? 'password' : 'text';
      botao.textContent = mostrando ? 'Mostrar senha' : 'Ocultar senha';
      botao.setAttribute('aria-pressed', String(!mostrando));
    });
  });
}

/* 2. Força da senha (0 a 4 pontos) mostrada com <meter> */
function calcularForca(senha) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  return pontos;
}

function iniciarForcaDaSenha() {
  const campo = document.getElementById('campo-senha');
  if (!campo || !campo.form || !campo.form.querySelector('#campo-senha2')) return;

  const medidor = document.createElement('meter');
  medidor.min = 0;
  medidor.max = 4;
  medidor.low = 2;
  medidor.high = 3;
  medidor.optimum = 4;
  medidor.value = 0;
  medidor.setAttribute('aria-label', 'Força da senha');

  const texto = document.createElement('span');
  texto.className = 'dica';
  texto.setAttribute('aria-live', 'polite');

  const botao = campo.nextElementSibling; // botão "Mostrar senha"
  (botao || campo).insertAdjacentElement('afterend', medidor);
  medidor.insertAdjacentElement('afterend', texto);

  campo.addEventListener('input', () => {
    const pontos = calcularForca(campo.value);
    medidor.value = pontos;
    texto.textContent = campo.value ? 'Força: ' + ['muito fraca', 'fraca', 'média', 'boa', 'forte'][pontos] : '';
  });
}

/* 3. Confere se as duas senhas são iguais enquanto digita */
function iniciarConferirSenhas() {
  const senha = document.getElementById('campo-senha');
  const confirmar = document.getElementById('campo-senha2');
  if (!senha || !confirmar) return;

  function conferir() {
    confirmar.setCustomValidity(confirmar.value && confirmar.value !== senha.value ? 'As senhas não coincidem.' : '');
    confirmar.setAttribute('aria-invalid', String(confirmar.validationMessage !== ''));
  }
  senha.addEventListener('input', conferir);
  confirmar.addEventListener('input', conferir);
}

/* 4. Máscara de CNPJ: 00.000.000/0000-00 */
function mascararCnpj(texto) {
  const n = texto.replace(/\D/g, '').slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function iniciarMascaraCnpj() {
  const campo = document.getElementById('campo-cnpj');
  if (!campo) return;
  campo.value = mascararCnpj(campo.value);
  campo.inputMode = 'numeric';
  campo.addEventListener('input', () => { campo.value = mascararCnpj(campo.value); });
}

/* 5. Contador de caracteres em todo <textarea> */
function iniciarContadores() {
  document.querySelectorAll('textarea').forEach((area) => {
    const contador = document.createElement('span');
    contador.className = 'dica contador';
    area.insertAdjacentElement('afterend', contador);

    function atualizar() {
      const n = area.value.length;
      contador.textContent = n + (n === 1 ? ' caractere' : ' caracteres');
    }
    area.addEventListener('input', atualizar);
    atualizar();
  });
}

/* 6. Desativa o botão depois do envio para não enviar duas vezes */
function iniciarEnvioUnico() {
  document.addEventListener('submit', (e) => {
    if (e.defaultPrevented || e.target.method !== 'post') return; // só formulários POST
    const botao = e.target.querySelector('button[type="submit"]');
    if (botao) {
      setTimeout(() => { botao.disabled = true; botao.textContent = 'Enviando...'; }, 0);
    }
  });
}

iniciarMostrarSenha();
iniciarForcaDaSenha();
iniciarConferirSenhas();
iniciarMascaraCnpj();
iniciarContadores();
iniciarEnvioUnico();
