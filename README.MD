# NewWorky

Site de vagas, empresas e cursos feito com **Node.js + Express + EJS**.

## Como rodar

```
npm install
npm start
```

Abra http://localhost:3000

> Se o `npm install` reclamar de certificado: `npm config set strict-ssl false`

## Administrador

Na primeira execução o sistema usa o admin que está em `app/data/users.json`
(ou cria um, se não existir nenhum):

- e-mail: `admin@newworky.com`
- senha: `Admin@123`

Entre em `/login` e você será levado para `/admin`. **Troque essa senha depois.**
Para criar o admin com outros dados, apague o admin do `users.json` e rode com
`ADMIN_EMAIL` e `ADMIN_SENHA` definidos.

## Organização das pastas

```
NewWorky/
├── server.js                 -> liga tudo (configuração do Express)
├── package.json
└── app/
    ├── dados.js              -> ler/salvar JSON, listas de vagas e empresas
    ├── validacoes.js         -> regras do express-validator
    ├── routes/
    │   ├── router.js         -> rotas do site (vagas, cursos, cadastro, login, painel...)
    │   └── admin.js          -> rotas da área /admin
    ├── views/
    │   ├── pages/            -> uma página .ejs por rota (layout.ejs é o modelo)
    │   │   └── admin/        -> páginas do admin (com layout próprio)
    │   └── partials/         -> pedaços reutilizados (header, footer, cards, campo)
    ├── public/               -> tudo que o navegador pode baixar
    │   ├── css/              -> site.css (site) | login.css | cadastro.css
    │   ├── js/               -> scripts do navegador
    │   └── imagens/
    └── data/                 -> "banco de dados" em arquivos JSON
```

Regra para não se perder: o `server.js` só configura; as **rotas** ficam em
`app/routes`; o que aparece na tela fica em `app/views`; o navegador só enxerga
`app/public`.
