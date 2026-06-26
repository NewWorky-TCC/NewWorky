const express = require("express");
const app = express();
const porta = 3000;

app.use(express.static("./app/public"));

app.set("view engine", "ejs");

app.set("views", "./app/views");

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const rotas = require("./app/routes/router");
const rotasAdm = require("./app/routes/router-adm");

app.use("/", rotas);
app.use("/adm", rotasAdm);

app.listen(porta, () => {
    console.log(`Servidor on-line\nhttp://localhost:${porta}`);
})