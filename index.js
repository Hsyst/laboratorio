// Caso você já tenha executado esse script, e portanto, tenha o tokens.db criado, ele dará erro. Por isso, comente a linha 47.

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();
const port = 3000;
const JWT_SECRET = "a61w0e=c1$@xb86fc93dcd8d27u8c";
const ciferaes = "bcf813e8a5517f9c1c634dfb4f1017c2e7ca3818f0a4ec222261aa54576965fa";

if (Buffer.from(ciferaes, 'hex').length !== 32) {
  console.log('A chave deve ter exatamente 32 bytes (64 caracteres hexadecimais).');
  process.exit(1);
}

app.use(express.json());

const db = new sqlite3.Database('./tokens.db');
function generateTokenAES(email, senha) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ciferaes, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(`${email}:${senha}`, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

function decryptTokenAES(token) {
  const iv = Buffer.from(token.slice(0, 32), 'hex');
  const encryptedText = token.slice(32);
  const key = Buffer.from(ciferaes, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function generateTokenJWT(email, senha) {
  const payload = { email, senha };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

db.serialize(() => {
  db.run("CREATE TABLE tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT)");
});

app.use(express.static('www'));

app.get('/crypt1', (req, res) => {
  const { email, senha } = req.query;
  if (!email || !senha) {
    return res.status(400).json({ message: 'Esse endpoint necessita de "email" e "senha".', status: 'Error', log: "Ocorreu um erro no login: Erro de criptografia. Tente novamente mais tarde." });
  }

  const jwtToken = generateTokenJWT(email, senha);
  res.json({ jwtToken });
});

app.get('/crypt2', (req, res) => {
  const { email, senha, crypt1 } = req.query;
  if (!email || !senha || !crypt1) {
    return res.status(400).json({ message: 'Os endpoints "email", "senha", e "crypt1" são necessários.', status: 'Error', log: "Ocorreu um erro no login: Erro na segunda etapa da criptografia. Tente novamente mais tarde." });
  }

  jwt.verify(crypt1, JWT_SECRET, (err, decoded) => {
    if (err || decoded.email !== email || decoded.senha !== senha) {
      return res.status(400).json({ message: 'Token JWT inválido', status: 'Error', log: "Erro na criptografia (token error)." });
    }

    const tokenAES = generateTokenAES(email, senha);
    res.json({ tokenAES });
  });
});

app.get('/register', (req, res) => {
  const { tokenReg } = req.query;

  if (!tokenReg) {
    return res.status(400).json({
      message: 'Auth Token is needed (AES Token)',
      status: 'Error',
      log: "Erro na validação de criptografia. Tente novamente."
    });
  }

  try {
    // Decodificar o token enviado pelo usuário
    const decodedToken = decryptTokenAES(tokenReg);

    if (!decodedToken) {
      return res.status(400).json({
        message: 'Token AES inválido ou não descriptografado corretamente.',
        status: 'Error',
        log: "Erro na validação de criptografia (l2). Tente novamente."
      });
    }

    // Verificar se o e-mail decodificado já está no banco de dados
    db.all("SELECT * FROM tokens", (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: 'Erro ao acessar o banco de dados',
          status: 'Error',
          log: "O Banco de Dados não está funcionando corretamente. Tente novamente mais tarde."
        });
      }

      // Verificar se algum token no banco de dados contém o e-mail decodificado
      const emailExists = rows.some(row => {
        const decodedDatabaseToken = decryptTokenAES(row.token); // Decodificar o token armazenado
        return decodedDatabaseToken === decodedToken; // Comparar o token (e-mail) com o token decodificado
      });

      if (emailExists) {
        return res.status(400).json({
          message: 'E-mail já registrado',
          status: "Error",
          log: "Este e-mail já está registrado! Tente usar outro e-mail."
        });
      }

      // Se o e-mail não estiver registrado, insere o novo token no banco
      db.run("INSERT INTO tokens (token) VALUES (?)", [tokenReg], function (err) {
        if (err) {
          return res.status(500).json({
            message: 'Erro ao registrar token',
            status: "Error",
            log: "O Banco de Dados não conseguiu realizar o seu registro. Tente novamente mais tarde."
          });
        }
        res.json({ message: 'Registrado com sucesso!' });
      });
    });
  } catch (err) {
    return res.status(400).json({
      message: 'Erro ao processar token AES.',
      status: 'Error',
      log: "Erro na criptografia em terceiro nível. Entre em contato com o WebMaster."
    });
  }
});


app.get('/login', (req, res) => {
  const { tokenReg } = req.query;
  if (!tokenReg) {
    return res.status(400).json({ message: 'Token AES é necessário', status: 'Error', log: "Erro na criptografia de terceiro nível. Entre em contato com o WebMaster." });
  }

  try {
    const decodedToken = decryptTokenAES(tokenReg);

    db.all("SELECT * FROM tokens", (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao acessar o banco de dados', status: 'Error', log: "Erro no acesso a Database. Tente novamente mais tarde." });
      }

      const tokenMatch = rows.some(row => {
        const decodedDatabaseToken = decryptTokenAES(row.token);
        return decodedDatabaseToken === decodedToken;
      });

      if (tokenMatch) {
        res.json({ message: 'Login com Sucesso', status: 'Success', log: "Login realizado com sucesso!" });
      } else {
        res.status(400).json({ message: 'Token não encontrado', status: 'Error', log: "Usuário ou Senha incorretos. Tente novamente." });
      }
    });
  } catch (err) {
    return res.status(400).json({ message: 'Erro ao decodificar o token', status: 'Error', log: "Erro em criptografia de terceiro nível. Entre em contato com o WebMaster." });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://127.0.0.1:${port}`);
});
