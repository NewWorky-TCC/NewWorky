// Funções gerais do site: menu, voltar ao topo, avisos, confirmação e copiar link.

/* 1. Menu do celular: botão .menu-botao abre/fecha o <nav> indicado em aria-controls */
function iniciarMenu() {
  document.querySelectorAll('.menu-botao').forEach((botao) => {
    const menu = document.getElementById(botao.getAttribute('aria-controls'));
    if (!menu) return;

    function definir(aberto) {
      menu.classList.toggle('aberto', aberto);
      botao.setAttribute('aria-expanded', String(aberto));
    }

    botao.addEventListener('click', () => definir(!menu.classList.contains('aberto')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) definir(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) {
        definir(false);
        botao.focus();
      }
    });
  });
}

/* 2. Botão "voltar ao topo": aparece depois de rolar a página */
function iniciarVoltarAoTopo() {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'voltar-topo';
  botao.textContent = '↑ Topo';
  botao.setAttribute('aria-label', 'Voltar ao topo da página');
  botao.hidden = true;
  document.body.appendChild(botao);

  window.addEventListener('scroll', () => { botao.hidden = window.scrollY < 400; });
  botao.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* 3. Avisos (mensagens de sucesso/erro) somem sozinhos depois de alguns segundos */
function iniciarAvisos() {
  const aviso = document.querySelector('.aviso');
  if (aviso) setTimeout(() => aviso.remove(), 6000);
}

/* 4. Pergunta antes de enviar formulários com data-confirmar="texto" */
function iniciarConfirmacao() {
  document.addEventListener('submit', (e) => {
    const texto = e.target.dataset.confirmar;
    if (texto && !confirm(texto)) e.preventDefault();
  });
}

/* 5. Botão "Copiar link da vaga" */
function iniciarCopiarLink() {
  document.querySelectorAll('[data-copiar-link]').forEach((botao) => {
    const aviso = document.querySelector('[data-copiar-status]');
    botao.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        aviso.textContent = 'Link copiado!';
      } catch (erro) {
        aviso.textContent = 'Não foi possível copiar. Copie o endereço do navegador.';
      }
    });
  });
}

iniciarMenu();
iniciarVoltarAoTopo();
iniciarAvisos();
iniciarConfirmacao();
iniciarCopiarLink();
