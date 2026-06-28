var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");

router.get("/", (req, res) => {
    res.render("pages/index");

});
router.get("/login", (req, res) => {
    res.render("pages/login");
});

router.post("/login", (req, res) => {

    let nomeUser = req.body.nome;
    let senhaUser = req.body.senha;

    if (nomeUser == "Sla" && senhaUser == "1234") {
        res.render("pages/perfil");
    } else {
        res.send("Nome de usuário e/ou senha inválidos!")
    }

});


router.get("/cadastro", (req, res) => {
    res.render("pages/cadastro");
});

router.get("/perfil", (req, res) => {
    res.render("pages/perfil");
});


module.exports = router;