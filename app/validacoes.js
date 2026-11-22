// Regras de validação com express-validator
const { body, validationResult } = require('express-validator');
const { ler, CATEGORIAS, MODELOS, NIVEIS, NIVEIS_CURSO } = require('./dados');

const MSG_SENHA = 'Use ao menos 8 caracteres, com letras e números.';

// Condições para validar só os campos do tipo de conta escolhido
const ehEmpresa = (valor, { req }) => req.body.tipo === 'empresa';
const ehCandidato = (valor, { req }) => req.body.tipo !== 'empresa';
const naoRemoto = (valor, { req }) => req.body.modelo !== 'Remoto';

// Transforma o resultado do validator em { campo: 'mensagem' } (formato usado nas views)
function mapaDeErros(req) {
  const resultado = validationResult(req).mapped();
  const erros = {};
  Object.keys(resultado).forEach((campo) => {
    erros[campo] = resultado[campo].msg;
  });
  return erros;
}

const cadastro = [
  body('nome').trim().isLength({ min: 3 }).withMessage('Informe seu nome completo.'),
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Informe um e-mail válido.')
    .bail()
    .custom((email) => {
      if (ler('users').some((u) => u.email === email)) throw new Error('Este e-mail já está cadastrado.');
      return true;
    }),
  body('senha')
    .isLength({ min: 8 }).withMessage(MSG_SENHA)
    .matches(/[A-Za-z]/).withMessage(MSG_SENHA)
    .matches(/\d/).withMessage(MSG_SENHA),
  body('senha2').custom((valor, { req }) => valor === req.body.senha).withMessage('As senhas não coincidem.'),
  body('aceite').equals('on').withMessage('É necessário aceitar a Política de Privacidade.'),

  body('area').if(ehCandidato).isIn(CATEGORIAS).withMessage('Escolha sua área de interesse.'),

  body('empresaNome').if(ehEmpresa).trim().isLength({ min: 2 }).withMessage('Informe o nome da empresa.'),
  body('cnpj')
    .if(ehEmpresa)
    .customSanitizer((valor) => String(valor || '').replace(/\D/g, ''))
    .isLength({ min: 14, max: 14 }).withMessage('O CNPJ deve ter 14 dígitos.'),
  body('setor').if(ehEmpresa).trim().isLength({ min: 2 }).withMessage('Informe o setor de atuação.'),
];

const login = [
  body('email').trim().toLowerCase().isEmail(),
  body('senha').notEmpty(),
];

const contato = [
  body('nome').trim().isLength({ min: 3 }).withMessage('Informe seu nome.'),
  body('email').trim().isEmail().withMessage('Informe um e-mail válido.'),
  body('empresa').trim().isLength({ min: 2 }).withMessage('Informe o nome da empresa.'),
  body('mensagem').trim().isLength({ min: 10 }).withMessage('Conte um pouco mais (mínimo 10 caracteres).'),
];

const vaga = [
  body('titulo').trim().isLength({ min: 5 }).withMessage('Título muito curto.'),
  body('categoria').isIn(CATEGORIAS).withMessage('Escolha a área.'),
  body('nivel').isIn(NIVEIS).withMessage('Escolha o nível.'),
  body('modelo').isIn(MODELOS).withMessage('Escolha o modelo.'),
  body('local').if(naoRemoto).trim().notEmpty().withMessage('Informe o local.'),
  body('descricao').trim().isLength({ min: 30 }).withMessage('Descreva a vaga com pelo menos 30 caracteres.'),
  body('salarioMin').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Informe um valor válido.'),
  body('salarioMax')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 }).withMessage('Informe um valor válido.')
    .bail()
    .custom((max, { req }) => !req.body.salarioMin || Number(max) >= Number(req.body.salarioMin))
    .withMessage('O salário máximo deve ser maior que o mínimo.'),
];

const curso = [
  body('titulo').trim().isLength({ min: 5 }).withMessage('Título muito curto.'),
  body('categoria').isIn(CATEGORIAS.concat('Carreira')).withMessage('Escolha a área.'),
  body('nivel').isIn(NIVEIS_CURSO).withMessage('Escolha o nível.'),
  body('horas').isInt({ min: 1, max: 500 }).withMessage('Informe as horas (de 1 a 500).'),
  body('descricao').trim().isLength({ min: 10 }).withMessage('Descreva o curso (mínimo 10 caracteres).'),
];

module.exports = { mapaDeErros, cadastro, login, contato, vaga, curso };
