// Painel de acessibilidade: tamanho do texto, modo escuro e alto contraste.
// As escolhas ficam salvas no navegador (localStorage).
const raiz = document.documentElement;
const tamanhos = [100, 112, 125, 150];
let config = { tamanho: 0, tema: '' };

try {
  config = Object.assign(config, JSON.parse(localStorage.getItem('nw_acessibilidade')));
} catch (erro) {
  // sem configuração salva: usa o padrão
}

function aplicar() {
  raiz.style.fontSize = tamanhos[config.tamanho] + '%';
  if (config.tema) raiz.dataset.tema = config.tema;
  else delete raiz.dataset.tema;
  localStorage.setItem('nw_acessibilidade', JSON.stringify(config));
}

document.addEventListener('click', (evento) => {
  const acao = evento.target.dataset.acao;
  if (!acao) return;

  if (acao === 'mais') config.tamanho = Math.min(tamanhos.length - 1, config.tamanho + 1);
  if (acao === 'menos') config.tamanho = Math.max(0, config.tamanho - 1);
  if (acao === 'escuro') config.tema = config.tema === 'escuro' ? '' : 'escuro';
  if (acao === 'alto') config.tema = config.tema === 'alto' ? '' : 'alto';
  if (acao === 'padrao') config = { tamanho: 0, tema: '' };
  aplicar();
});

aplicar();
