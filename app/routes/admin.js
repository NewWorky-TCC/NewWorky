// Área administrativa (/admin): só entra quem tem tipo "admin"
const express = require('express');
const validar = require('../validacoes');
const { CATEGORIAS, NIVEIS_CURSO, ler, salvar, slug, todasVagas } = require('../dados');

const router = express.Router();

/* ---------- Proteção: todas as rotas abaixo exigem administrador ---------- */
router.use((req, res, next) => {
  const usuario = res.locals.usuario;
  if (!usuario) {
    req.session.aviso = 'Entre com uma conta de administrador.';
    return res.redirect('/login');
  }
  if (usuario.tipo !== 'admin') {
    req.session.aviso = 'Acesso restrito a administradores.';
    return res.redirect('/');
  }
  res.locals.naoLidas = ler('contatos').filter((c) => !c.lida).length;
  next();
});

// Todas as páginas do admin usam views/admin/layout.ejs
function mostrar(res, view, dados) {
  res.render('pages/admin/' + view, { layout: 'pages/admin/layout', ...dados });
}

/* ---------- Resumo ---------- */
router.get('/', (req, res) => {
  const users = ler('users');
  mostrar(res, 'resumo', {
    titulo: 'Resumo | Admin NewWorky',
    totais: {
      candidatos: users.filter((u) => u.tipo === 'candidato').length,
      empresas: users.filter((u) => u.tipo === 'empresa').length,
      vagas: todasVagas().length,
      cursos: ler('cursos').length,
      candidaturas: ler('candidaturas').length,
    },
    ultimos: users.filter((u) => u.criadoEm).slice(-5).reverse(),
  });
});

/* ---------- Usuários ---------- */
router.get('/usuarios', (req, res) => {
  const tipo = req.query.tipo || '';
  const usuarios = ler('users').filter((u) => !tipo || u.tipo === tipo);
  mostrar(res, 'usuarios', { titulo: 'Usuários | Admin NewWorky', usuarios, tipo });
});

router.post('/usuarios/:id/admin', (req, res) => {
  const users = ler('users');
  const alvo = users.find((u) => u.id === req.params.id);
  if (alvo && alvo.tipo === 'candidato') {
    alvo.tipo = 'admin';
    salvar('users', users);
    req.session.aviso = alvo.nome + ' agora é administrador(a).';
  } else {
    req.session.aviso = 'Só candidatos podem ser promovidos a administrador.';
  }
  res.redirect('/admin/usuarios');
});

router.post('/usuarios/:id/excluir', (req, res) => {
  const id = req.params.id;
  const alvo = ler('users').find((u) => u.id === id);

  if (!alvo) {
    req.session.aviso = 'Usuário não encontrado.';
  } else if (alvo.tipo === 'admin') {
    req.session.aviso = 'Administradores não podem ser excluídos por aqui.';
  } else {
    // apaga o usuário e tudo que depende dele
    const vagasDele = ler('vagas_empresas').filter((v) => v.empresaId === 'u' + id).map((v) => v.id);
    salvar('users', ler('users').filter((u) => u.id !== id));
    salvar('vagas_empresas', ler('vagas_empresas').filter((v) => v.empresaId !== 'u' + id));
    salvar('candidaturas', ler('candidaturas').filter((c) => c.userId !== id && !vagasDele.includes(c.vagaId)));
    req.session.aviso = 'Usuário ' + alvo.nome + ' excluído.';
  }
  res.redirect('/admin/usuarios');
});

/* ---------- Vagas ---------- */
router.get('/vagas', (req, res) => {
  const candidaturas = ler('candidaturas');
  const vagas = todasVagas().map((v) => ({ ...v, candidatos: candidaturas.filter((c) => c.vagaId === v.id).length }));
  mostrar(res, 'vagas', { titulo: 'Vagas | Admin NewWorky', vagas });
});

router.post('/vagas/:id/excluir', (req, res) => {
  const id = req.params.id;
  salvar('vagas', ler('vagas').filter((v) => v.id !== id));
  salvar('vagas_empresas', ler('vagas_empresas').filter((v) => v.id !== id));
  salvar('candidaturas', ler('candidaturas').filter((c) => c.vagaId !== id));
  req.session.aviso = 'Vaga excluída.';
  res.redirect('/admin/vagas');
});

/* ---------- Cursos ---------- */
function paginaCursos(res, erros, valores) {
  mostrar(res, 'cursos', {
    titulo: 'Cursos | Admin NewWorky',
    cursos: ler('cursos'),
    categorias: CATEGORIAS.concat('Carreira'),
    niveis: NIVEIS_CURSO,
    erros,
    valores,
  });
}

router.get('/cursos', (req, res) => paginaCursos(res, {}, {}));

router.post('/cursos', validar.curso, (req, res) => {
  const erros = validar.mapaDeErros(req);
  if (Object.keys(erros).length) return paginaCursos(res, erros, req.body);

  const cursos = ler('cursos');
  let id = slug(req.body.titulo);
  if (cursos.some((c) => c.id === id)) id += '-' + cursos.length; // evita id repetido
  cursos.push({
    id,
    titulo: req.body.titulo,
    categoria: req.body.categoria,
    nivel: req.body.nivel,
    horas: Number(req.body.horas),
    gratuito: req.body.gratuito === 'on',
    descricao: req.body.descricao,
  });
  salvar('cursos', cursos);
  req.session.aviso = 'Curso criado.';
  res.redirect('/admin/cursos');
});

router.post('/cursos/:id/excluir', (req, res) => {
  salvar('cursos', ler('cursos').filter((c) => c.id !== req.params.id));
  req.session.aviso = 'Curso excluído.';
  res.redirect('/admin/cursos');
});

/* ---------- Mensagens (formulário "Fale com a equipe") ---------- */
router.get('/mensagens', (req, res) => {
  const mensagens = ler('contatos').slice().reverse();
  mostrar(res, 'mensagens', { titulo: 'Mensagens | Admin NewWorky', mensagens });
});

router.post('/mensagens/:id/lida', (req, res) => {
  const contatos = ler('contatos');
  const msg = contatos.find((c) => c.id === req.params.id);
  if (msg) {
    msg.lida = true;
    salvar('contatos', contatos);
  }
  res.redirect('/admin/mensagens');
});

router.post('/mensagens/:id/excluir', (req, res) => {
  salvar('contatos', ler('contatos').filter((c) => c.id !== req.params.id));
  req.session.aviso = 'Mensagem excluída.';
  res.redirect('/admin/mensagens');
});

module.exports = router;
