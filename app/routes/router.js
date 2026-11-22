// Rotas do site (páginas públicas, cadastro/login e painel do usuário)
const express = require('express');
const bcrypt = require('bcryptjs');
const validar = require('../validacoes');
const {
  CATEGORIAS, MODELOS, NIVEIS, NIVEIS_CURSO,
  ler, salvar, novoId, todasEmpresas, todasVagas,
} = require('../dados');

const router = express.Router();

/* ---------- Funções auxiliares ---------- */
// Pontuação simples: 40 base + 30 se a área bate + 10 por habilidade em comum
function calcularMatch(vaga, usuario) {
  if (!usuario || usuario.tipo !== 'candidato') return null;
  let pontos = 40;
  if (usuario.area === vaga.categoria) pontos += 30;
  const minhas = (usuario.habilidades || []).map((h) => h.toLowerCase());
  const iguais = vaga.tags.filter((t) => minhas.includes(t.toLowerCase())).length;
  return Math.min(100, pontos + Math.min(30, iguais * 10));
}

function vagasDaEmpresa(usuario) {
  const candidaturas = ler('candidaturas');
  return todasVagas()
    .filter((v) => v.empresaId === 'u' + usuario.id)
    .map((v) => ({ ...v, candidatos: candidaturas.filter((c) => c.vagaId === v.id).length }));
}

// Protege rotas que exigem login
function exigirLogin(req, res, next) {
  if (!res.locals.usuario) {
    req.session.aviso = 'Entre na sua conta para continuar.';
    return res.redirect('/login');
  }
  next();
}

/* ---------- Páginas públicas ---------- */
router.get('/', (req, res) => {
  const vagas = todasVagas().slice(0, 3).map((v) => ({ ...v, match: calcularMatch(v, res.locals.usuario) }));
  res.render('pages/index', {
    vagas,
    cursos: ler('cursos').slice(0, 3),
    totais: { vagas: todasVagas().length, empresas: todasEmpresas().length, cursos: ler('cursos').length },
  });
});

router.get('/vagas', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const local = (req.query.local || '').toLowerCase();
  const { categoria = '', modelo = '' } = req.query;

  let vagas = todasVagas().filter((v) => {
    if (categoria && v.categoria !== categoria) return false;
    if (modelo && v.modelo !== modelo) return false;
    if (local && !v.local.toLowerCase().includes(local)) return false;
    if (q && !(v.titulo + ' ' + v.empresa + ' ' + v.tags.join(' ')).toLowerCase().includes(q)) return false;
    return true;
  });
  vagas = vagas.map((v) => ({ ...v, match: calcularMatch(v, res.locals.usuario) }));
  if (res.locals.usuario && res.locals.usuario.tipo === 'candidato') vagas.sort((a, b) => b.match - a.match);

  res.render('pages/vagas', {
    titulo: 'Vagas de emprego | NewWorky',
    vagas,
    filtros: { q: req.query.q || '', local: req.query.local || '', categoria, modelo },
    categorias: CATEGORIAS,
    modelos: MODELOS,
  });
});

router.get('/vagas/:id', (req, res, next) => {
  const vaga = todasVagas().find((v) => v.id === req.params.id);
  if (!vaga) return next(); // cai no 404
  const empresa = todasEmpresas().find((e) => e.id === vaga.empresaId);
  res.render('pages/vaga', { titulo: vaga.titulo + ' na ' + vaga.empresa + ' | NewWorky', vaga, empresa });
});

router.post('/vagas/:id/candidatar', exigirLogin, (req, res) => {
  const id = req.params.id;
  const usuario = res.locals.usuario;
  const voltar = '/vagas/' + id;

  if (usuario.tipo !== 'candidato') {
    req.session.aviso = 'Apenas contas de candidato podem se candidatar.';
    return res.redirect(voltar);
  }
  const candidaturas = ler('candidaturas');
  if (candidaturas.some((c) => c.userId === usuario.id && c.vagaId === id)) {
    req.session.aviso = 'Você já se candidatou a esta vaga.';
    return res.redirect(voltar);
  }
  const mes = new Date().toISOString().slice(0, 7);
  const doMes = candidaturas.filter((c) => c.userId === usuario.id && c.em.startsWith(mes)).length;
  if (usuario.plano === 'candidato-gratis' && doMes >= 5) {
    req.session.aviso = 'Limite de 5 candidaturas por mês no plano gratuito. Conheça o plano Pro.';
    return res.redirect(voltar);
  }
  candidaturas.push({ id: novoId(), userId: usuario.id, vagaId: id, em: new Date().toISOString() });
  salvar('candidaturas', candidaturas);
  req.session.aviso = 'Candidatura enviada com sucesso!';
  res.redirect(voltar);
});

router.get('/empresas', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const vagas = todasVagas();
  const empresas = todasEmpresas()
    .filter((e) => !q || (e.nome + ' ' + e.setor + ' ' + e.cidade).toLowerCase().includes(q))
    .map((e) => ({ ...e, abertas: vagas.filter((v) => v.empresaId === e.id).length }));
  res.render('pages/empresas', { titulo: 'Empresas que contratam | NewWorky', empresas, q: req.query.q || '' });
});

router.get('/cursos', (req, res) => {
  const { categoria = '', nivel = '' } = req.query;
  const meus = res.locals.usuario ? res.locals.usuario.cursos || [] : [];
  const cursos = ler('cursos')
    .filter((c) => (!categoria || c.categoria === categoria) && (!nivel || c.nivel === nivel))
    .map((c) => {
      const feito = meus.find((m) => m.id === c.id);
      return { ...c, progresso: feito ? feito.progresso : null };
    });
  res.render('pages/cursos', {
    titulo: 'Cursos online | NewWorky',
    cursos,
    filtros: { categoria, nivel },
    categorias: CATEGORIAS.concat('Carreira'),
    niveis: NIVEIS_CURSO,
  });
});

router.post('/cursos/:id/iniciar', exigirLogin, (req, res) => {
  const curso = ler('cursos').find((c) => c.id === req.params.id);
  if (curso) {
    const users = ler('users');
    const u = users.find((x) => x.id === res.locals.usuario.id);
    u.cursos = u.cursos || [];
    if (!u.cursos.some((c) => c.id === curso.id)) {
      u.cursos.push({ id: curso.id, titulo: curso.titulo, progresso: 0 });
      salvar('users', users);
      req.session.aviso = 'Curso adicionado ao seu painel.';
    }
  }
  res.redirect('/cursos');
});

router.get('/plano', (req, res) => {
  res.render('pages/plano', {
    titulo: 'Planos para candidatos | NewWorky',
    planos: ler('planos').filter((p) => p.publico === 'candidato'),
  });
});

router.post('/plano', exigirLogin, (req, res) => {
  const plano = ler('planos').find((p) => p.id === req.body.plano);
  const usuario = res.locals.usuario;
  if (!plano || plano.publico !== usuario.tipo) {
    req.session.aviso = 'Este plano não está disponível para a sua conta.';
  } else {
    const users = ler('users');
    users.find((u) => u.id === usuario.id).plano = plano.id;
    salvar('users', users);
    req.session.aviso = 'Plano ' + plano.nome + ' ativado.';
  }
  res.redirect(usuario.tipo === 'empresa' ? '/para-empresas' : '/plano');
});

/* ---------- Para empresas + contato ---------- */
function paginaParaEmpresas(res, erros, valores) {
  res.render('pages/para-empresas', {
    titulo: 'Contrate talentos | NewWorky',
    planos: ler('planos').filter((p) => p.publico === 'empresa'),
    erros,
    valores,
  });
}

router.get('/para-empresas', (req, res) => paginaParaEmpresas(res, {}, {}));

router.post('/contato', validar.contato, (req, res) => {
  const erros = validar.mapaDeErros(req);
  if (Object.keys(erros).length) return paginaParaEmpresas(res, erros, req.body);

  const { nome, email, empresa, mensagem } = req.body;
  const contatos = ler('contatos');
  contatos.push({ id: novoId(), nome, email, empresa, mensagem, lida: false, em: new Date().toISOString() });
  salvar('contatos', contatos);
  req.session.aviso = 'Recebemos sua mensagem! Responderemos em até 1 dia útil.';
  res.redirect('/para-empresas');
});

router.get('/privacidade', (req, res) => {
  res.render('pages/privacidade', { titulo: 'Privacidade e acessibilidade | NewWorky' });
});

/* ---------- Cadastro, login e logout ---------- */
function paginaCadastro(res, erros, valores) {
  res.render('pages/cadastro', { layout: false, titulo: 'Criar conta | NewWorky', erros, valores, categorias: CATEGORIAS });
}

router.get('/cadastro', (req, res) => {
  paginaCadastro(res, {}, { tipo: req.query.tipo === 'empresa' ? 'empresa' : 'candidato' });
});

router.post('/cadastro', validar.cadastro, (req, res) => {
  const erros = validar.mapaDeErros(req);
  if (Object.keys(erros).length) return paginaCadastro(res, erros, req.body);

  const b = req.body; // já validado e limpo pelo express-validator
  const tipo = b.tipo === 'empresa' ? 'empresa' : 'candidato';
  const usuario = {
    id: novoId(),
    tipo,
    nome: b.nome,
    email: b.email,
    senha: bcrypt.hashSync(b.senha, 10),
    cidade: (b.cidade || '').trim(),
    plano: tipo === 'empresa' ? 'empresa-start' : 'candidato-gratis',
    criadoEm: new Date().toISOString(),
  };
  if (tipo === 'candidato') {
    usuario.area = b.area;
    usuario.habilidades = (b.habilidades || '').split(',').map((h) => h.trim()).filter(Boolean);
    usuario.cursos = [];
  } else {
    usuario.empresa = { nome: b.empresaNome, cnpj: b.cnpj, setor: b.setor };
  }
  const users = ler('users');
  users.push(usuario);
  salvar('users', users);

  req.session.userId = usuario.id;
  res.redirect('/painel');
});

router.get('/login', (req, res) => {
  res.render('pages/login', { layout: false, titulo: 'Entrar | NewWorky', erro: null, email: '' });
});

router.post('/login', validar.login, (req, res) => {
  const email = req.body.email || '';
  const dadosInvalidos = Object.keys(validar.mapaDeErros(req)).length > 0;
  const usuario = ler('users').find((u) => u.email === email);

  if (dadosInvalidos || !usuario || !bcrypt.compareSync(req.body.senha || '', usuario.senha)) {
    return res.render('pages/login', { layout: false, titulo: 'Entrar | NewWorky', erro: 'E-mail ou senha incorretos.', email });
  }
  req.session.userId = usuario.id;
  res.redirect(usuario.tipo === 'admin' ? '/admin' : '/painel');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

/* ---------- Painel (candidato ou empresa) ---------- */
function paginaPainel(res, usuario, erros, valores) {
  const dados = { titulo: 'Meu painel | NewWorky', erros, valores, categorias: CATEGORIAS, modelos: MODELOS, niveis: NIVEIS };

  if (usuario.tipo === 'candidato') {
    const vagas = todasVagas();
    dados.candidaturas = ler('candidaturas')
      .filter((c) => c.userId === usuario.id)
      .map((c) => ({ ...c, vaga: vagas.find((v) => v.id === c.vagaId) }));
    dados.plano = ler('planos').find((p) => p.id === usuario.plano);
  } else {
    dados.minhasVagas = vagasDaEmpresa(usuario);
  }
  res.render('pages/painel', dados);
}

router.get('/painel', exigirLogin, (req, res) => {
  if (res.locals.usuario.tipo === 'admin') return res.redirect('/admin');
  paginaPainel(res, res.locals.usuario, {}, {});
});

router.post('/painel/cursos/:id/avancar', exigirLogin, (req, res) => {
  const users = ler('users');
  const u = users.find((x) => x.id === res.locals.usuario.id);
  const curso = (u.cursos || []).find((c) => c.id === req.params.id);
  if (curso) {
    curso.progresso = Math.min(100, curso.progresso + 25);
    salvar('users', users);
  }
  res.redirect('/painel');
});

router.post('/painel/vagas', exigirLogin, validar.vaga, (req, res) => {
  const usuario = res.locals.usuario;
  if (usuario.tipo !== 'empresa') return res.redirect('/painel');

  const erros = validar.mapaDeErros(req);
  if (Object.keys(erros).length) return paginaPainel(res, usuario, erros, req.body);

  const b = req.body;
  const linhas = (texto) => (texto || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const vagas = ler('vagas_empresas');
  vagas.push({
    id: novoId(),
    titulo: b.titulo,
    empresaId: 'u' + usuario.id,
    local: b.modelo === 'Remoto' ? 'Remoto' : b.local,
    modelo: b.modelo,
    categoria: b.categoria,
    nivel: b.nivel,
    salarioMin: Number(b.salarioMin) || null,
    salarioMax: Number(b.salarioMax) || null,
    tags: (b.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    descricao: b.descricao,
    requisitos: linhas(b.requisitos),
    beneficios: linhas(b.beneficios),
    publicadaEm: new Date().toISOString().slice(0, 10),
  });
  salvar('vagas_empresas', vagas);
  req.session.aviso = 'Vaga publicada com sucesso!';
  res.redirect('/painel');
});

router.post('/painel/vagas/:id/excluir', exigirLogin, (req, res) => {
  const vagas = ler('vagas_empresas').filter(
    (v) => !(v.id === req.params.id && v.empresaId === 'u' + res.locals.usuario.id)
  );
  salvar('vagas_empresas', vagas);
  req.session.aviso = 'Vaga excluída.';
  res.redirect('/painel');
});


module.exports = router;
