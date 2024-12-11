const crypto = require('crypto');

// Chave fornecida (ciferaes) com 32 bytes em formato hexadecimal
const ciferaes = "bcf813e8a5517f9c1c634dfb4f1017c2e7ca3818f0a4ec222261aa54576965fa";

// Verifique se a chave tem exatamente 32 bytes (64 caracteres hexadecimais)
if (Buffer.from(ciferaes, 'hex').length !== 32) {
  console.log('A chave deve ter exatamente 32 bytes (64 caracteres hexadecimais).');
  process.exit(1);
}

// Função para gerar o token AES
function generateTokenAES(email, senha) {
  const iv = crypto.randomBytes(16); // Gerar IV aleatório de 16 bytes
  const key = Buffer.from(ciferaes, 'hex'); // Converter a chave hexadecimal para Buffer de 32 bytes
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(`${email}:${senha}`, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted; // Retornar IV + texto cifrado
}

// Exemplo de dados para criptografar
const email = 'humbertodzard2@gmail.com';
const senha = 'humfla321';

const tokenAES = generateTokenAES(email, senha);
console.log('Token AES:', tokenAES);
