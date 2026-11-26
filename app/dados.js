// Funções e constantes de dados usadas pelo site e pela área admin
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const PASTA = path.join(__dirname, 'data');
fs.mkdirSync(PASTA, { recursive: true });

const CATEGORIAS = ['Desenvolvimento', 'Tecnologia', 'UX/UI', 'Marketing', 'Dados'];
const MODELOS = ['Remoto', 'Híbrido', 'Presencial'];
const NIVEIS = ['Estágio', 'Júnior', 'Pleno', 'Sênior'];
const NIVEIS_CURSO = ['Iniciante', 'Intermediário', 'Avançado'];

function ler(nome) {
  try {
    return JSON.parse(fs.readFileSync(path.join(PASTA, nome + '.json'), 'utf8'));
  } catch (erro) {
    return [];
  }
}

function salvar(nome, dados) {
  fs.writeFileSync(path.join(PASTA, nome + '.json'), JSON.stringify(dados, null, 2));
}

const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// "Análise de Dados" -> "analise-de-dados"
function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function todasEmpresas() {
  const cadastradas = ler('users')
    .filter((u) => u.tipo === 'empresa')
    .map((u) => ({
      id: 'u' + u.id,
      nome: u.empresa.nome,
      setor: u.empresa.setor,
      cidade: u.cidade || 'Brasil',
      tamanho: 'Nova na plataforma',
      sobre: u.empresa.nome + ' atua em ' + u.empresa.setor + ' e contrata pela NewWorky.',
    }));
  return ler('empresas').concat(cadastradas);
}

function todasVagas() {
  const empresas = todasEmpresas();
  return ler('vagas')
    .concat(ler('vagas_empresas'))
    .map((v) => {
      const empresa = empresas.find((e) => e.id === v.empresaId);
      return { ...v, empresa: empresa ? empresa.nome : 'Empresa confidencial' };
    })
    .sort((a, b) => (a.publicadaEm < b.publicadaEm ? 1 : -1));
}

// Cria o primeiro administrador se ainda não existir nenhum
function garantirAdmin() {
  const users = ler('users');
  if (users.some((u) => u.tipo === 'admin')) return;

  const email = (process.env.ADMIN_EMAIL || 'admin@newworky.com').toLowerCase();
  const senha = process.env.ADMIN_SENHA || 'admin123';
  users.push({
    id: novoId(),
    tipo: 'admin',
    nome: 'Administrador',
    email,
    senha: bcrypt.hashSync(senha, 10),
    cidade: '',
    plano: null,
    criadoEm: new Date().toISOString(),
  });
  salvar('users', users);
  console.log('Administrador criado -> e-mail: ' + email + ' | senha: ' + senha + ' (troque depois!)');
}

module.exports = {
  CATEGORIAS, MODELOS, NIVEIS, NIVEIS_CURSO,
  ler, salvar, novoId, slug,
  todasEmpresas, todasVagas, garantirAdmin,
};
