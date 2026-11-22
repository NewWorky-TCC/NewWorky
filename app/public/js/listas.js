// Funções de listas e tabelas: filtro ao vivo, ordenação e vagas favoritas.

/* 1. Filtro ao vivo: <input data-filtrar="#id-da-lista"> esconde os itens que não combinam */
function iniciarFiltroAoVivo() {
  document.querySelectorAll('[data-filtrar]').forEach((campo) => {
    const lista = document.querySelector(campo.dataset.filtrar);
    const contador = document.querySelector(campo.dataset.contador);
    if (!lista) return;

    // Em formulários só de filtro (sem ação), o Enter não precisa recarregar a página
    if (campo.form && campo.form.dataset.semEnvio !== undefined) {
      campo.form.addEventListener('submit', (e) => e.preventDefault());
    }

    campo.addEventListener('input', () => {
      const termo = campo.value.trim().toLowerCase();
      let visiveis = 0;

      Array.from(lista.children).forEach((item) => {
        const combina = item.textContent.toLowerCase().includes(termo);
        item.hidden = !combina;
        if (combina) visiveis++;
      });

      if (contador) {
        contador.textContent = visiveis + ' ' + (visiveis === 1 ? campo.dataset.singular : campo.dataset.plural) + '.';
      }
    });
  });
}

/* 2. Ordenar tabelas ao clicar no título da coluna (botão .ordenar dentro do <th>) */
function iniciarOrdenacao() {
  document.querySelectorAll('table[data-ordenavel]').forEach((tabela) => {
    tabela.addEventListener('click', (e) => {
      const botao = e.target.closest('.ordenar');
      if (!botao) return;

      const th = botao.closest('th');
      const coluna = th.cellIndex;
      const crescente = th.getAttribute('aria-sort') !== 'ascending';

      tabela.querySelectorAll('th').forEach((outro) => outro.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', crescente ? 'ascending' : 'descending');

      const corpo = tabela.tBodies[0];
      const linhas = Array.from(corpo.rows);
      // usa data-ordem (ex.: data ISO) quando existir; senão usa o texto da célula
      const valor = (linha) => linha.cells[coluna].dataset.ordem || linha.cells[coluna].textContent.trim();

      linhas.sort((a, b) => valor(a).localeCompare(valor(b), 'pt-BR', { numeric: true }) * (crescente ? 1 : -1));
      linhas.forEach((linha) => corpo.appendChild(linha));
    });
  });
}

/* 3. Vagas favoritas: guardadas no navegador (localStorage) */
const CHAVE_FAVORITAS = 'nw_favoritas';

function lerFavoritas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FAVORITAS)) || [];
  } catch (erro) {
    return [];
  }
}

function desenharFavorito(botao, favorita) {
  botao.setAttribute('aria-pressed', String(favorita));
  botao.textContent = favorita ? '♥ Favorita' : '♡ Favoritar';
}

function iniciarFavoritas() {
  const botoes = document.querySelectorAll('[data-favoritar]');
  if (botoes.length === 0) return;

  const so = document.getElementById('so-favoritas');

  function aplicarFiltro() {
    if (!so) return;
    const favoritas = lerFavoritas();
    document.querySelectorAll('[data-vaga-id]').forEach((item) => {
      item.hidden = so.checked && !favoritas.includes(item.dataset.vagaId);
    });
  }

  botoes.forEach((botao) => {
    desenharFavorito(botao, lerFavoritas().includes(botao.dataset.favoritar));

    botao.addEventListener('click', () => {
      let favoritas = lerFavoritas();
      const id = botao.dataset.favoritar;
      favoritas = favoritas.includes(id) ? favoritas.filter((f) => f !== id) : favoritas.concat(id);
      localStorage.setItem(CHAVE_FAVORITAS, JSON.stringify(favoritas));
      desenharFavorito(botao, favoritas.includes(id));
      aplicarFiltro();
    });
  });

  if (so) so.addEventListener('change', aplicarFiltro);
}

iniciarFiltroAoVivo();
iniciarOrdenacao();
iniciarFavoritas();
