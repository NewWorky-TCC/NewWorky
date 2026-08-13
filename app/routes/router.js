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


router.get("/cadastro", [

    body("nome")
    .notEmpty().withMessage("O campo nome é obrigatório")
    .isLength({ min: 3 }).withMessage("O campo nome deve ter no mínimo 3 caracteres")
    .trim(),

    body("email")
    .notEmpty().withMessage("O campo email é obrigatório")
    .isEmail().withMessage("O campo email deve ser um email válido")
    .normalizeEmail(),

    body("senha")
    .notEmpty().withMessage("O campo senha é obrigatório")
    .isLength({ min: 6 }).withMessage("O campo senha deve ter no mínimo 6 caracteres")
    .matches(/[A-Z]/).withMessage("O campo senha deve conter pelo menos uma letra maiúscula")
    .matches(/[0-9]/).withMessage("O campo senha deve conter pelo menos um número"),

    body("confirmarSenha")
    .notEmpty().withMessage("O campo confirmar senha é obrigatório")
    .custom((value, { req }) => {
        if (value !== req.body.senha) {
            throw new Error("As senhas não coincidem");
        }
        return true;
    })

], (req, res) => {
    res.render("pages/cadastro");
});

router.get("/perfil", (req, res) => {
    res.render("pages/perfil");
});


module.exports = router;