// NewWorky - arquivo principal: configura o Express e liga as rotas.
// Estrutura:  app/routes (rotas) | app/views (EJS) | app/public (css, js, imagens) | app/data (JSON)
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const { ler, garantirAdmin } = require('./app/dados');
const router = require('./app/routes/router');
const adminRouter = require('./app/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Configuração ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));
app.use(expressLayouts);                 // aplica o layout em todas as páginas
app.set('layout', 'pages/layout');       // app/views/pages/layout.ejs

app.use(express.static(path.join(__dirname, 'app', 'public'))); // css, js e imagens
app.use(express.urlencoded({ extended: false }));               // lê dados de <form>
app.use((req, res, next) => {            // garante req.body (no Express 5 ele pode vir vazio)
  req.body = req.body || {};
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'newworky-segredo-de-estudo',
  resave: false,
  saveUninitialized: false,
}));

garantirAdmin(); // cria o administrador padrão na primeira vez

/* ---------- Variáveis disponíveis em todas as views ---------- */
app.use((req, res, next) => {
  res.locals.usuario = req.session.userId ? ler('users').find((u) => u.id === req.session.userId) || null : null;
  res.locals.pagina = req.path;
  res.locals.titulo = 'NewWorky | Vagas de emprego, cursos e match com empresas';
  res.locals.aviso = req.session.aviso || null; // mensagem de uma única exibição
  delete req.session.aviso;
  res.locals.reais = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  next();
});

/* ---------- Rotas ---------- */
app.use('/admin', adminRouter);
app.use('/', router);

app.use((req, res) => {
  res.status(404).render('pages/404', { titulo: 'Página não encontrada | NewWorky' });
});

app.listen(PORT, () => console.log('NewWorky rodando em http://localhost:' + PORT));
