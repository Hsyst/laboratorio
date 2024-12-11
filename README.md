# Sistema de Login (Hsyst Auth)
![Logo Hsyst Auth](https://github.com/Hsyst/Hsyst-Auth/Hsyst_Auth-semfundo.png)

## Descrição
Criar um sistema de autenticação seguro de ponta a ponta, no qual mesmo com os dados interceptados, se torna muito dificil capturar os dados.

---

# Teoria

O sistema, basicamente se consiste em **4** endpoints, sendo 2 deles de criptografia.

## Endpoint /crypt1

O endpoint crypt1, é responsável por receber os dados em plain text, ou seja, totalmente desprotegido, e realizar a primeira camada de segurança, sendo ela **JWT**. Que terá os dados sem permitir nenhuma forma de adulteração.

---

**Exemplo de uso do crypt1**
seusiteaqui.com/crypt1?email=op3n@hsyst.com.br&senha=1234


## Endpoint /crypt2

O endpoint crypt2, é responsável por receber e conferir e criptografar os dados, assim, impossibilitando qualquer tipo de adulteração na requisição. Para isso, ele descriptografa o JWT, e confere se o email e senha recebidos e os compara com os que estavam no JWT. (Obs:. O token JWT também é verificado, vendo se a criptografia está correta.). Ele entrega o token AES, que não permite a leitura e nem a escrita sem a senha que está em nossos servidores.

---

**Exemplo de uso do crypt2**
seusiteaqui.com/crypt2?email=op3n@hsyst.com.br&senha=1234&crypt1=**JWT_RECEBIDO_PELO_ENDPOINT_CRYPT1**


# Endpoint /register

O endpoint /register é responsável por receber o Token AES gerado pelo crypt2, verificar se o token é válido, e se utiliza realmente a mesma key que está no servidor, e adiciona ao banco de dados.

---

**Exemplo de uso do register**
seusiteaqui.com/register?tokenReg=**SEU_TOKEN_AES_AQUI**


# Endpoint /login

O endpoint /login é responsável por receber o Token AES (igualmente ao /register), e verificar se o token é válido. Em seguida, ele descriptografa esse token e todos os tokens da database, e confere para verificar se o email:senha está no servidor.

---

**Exemplo de uso do login**
seusiteaqui.com/login?tokenReg=**SEU_TOKEN_AES_AQUI**



---
---

# Fluxos

Agora eu gostaria de falar para você, qual é o fluxo que é feito quanto no Login quanto no Registro para que esses dados saiam e entrem 100% protegidos.

## Fluxo 1 (/login)

Para que o seu formulário chegue até o servidor é feito o fluxo:

### /crypt1?email=seuemailaqui@gmail.com&senha=suasenhaaqui@#123
Resposta: TOKEN_JWT_DE_REGISTRO

### /crypt2?email=seuemailaqui@gmail.com&senha=suasenhaaqui@#123&crypt1=TOKEN_JWT_DE_REGISTRO
Resposta: TOKEN_AES_DE_REGISTRO

### /login?tokenReg=TOKEN_AES_DE_REGISTRO


---
---

## Fluxo 2 (/register)

Para que o seu formulário chegue até o servidor é feito o fluxo:

### /crypt1?email=seuemailaqui@gmail.com&senha=suasenhaaqui@#123
Resposta: TOKEN_JWT_DE_REGISTRO

### /crypt2?email=seuemailaqui@gmail.com&senha=suasenhaaqui@#123&crypt1=TOKEN_JWT_DE_REGISTRO
Resposta: TOKEN_AES_DE_REGISTRO

### /register?tokenReg=TOKEN_AES_DE_REGISTRO


---
---


# Como utilizar de modo prático?

Bom, quando você for utilizar, você precisa se atentar a estrutura de diretórios, e o que você deve adicionar na source do seu site para que a autenticação funcione.


## Estrutura de diretórios

/dev-tools (Ferramentas para testes e etc, se você não entender como funciona, só ignora ;-))

---

/www (Páginas pré-definidas de login, registro e logout. Além de uma index para redirecionar o usuário.)

---

/www/html (Seu site, aqui você vai colocar o seu site, e o servidor já vai fazer o resto por você!)


---
---

## O que devo alterar no meu código?

Simples, no cabeçalho do seu HTML (de preferência no inicio do arquivo) você deve adicionar o seguinte script:

```html
<script>
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure; samesite=strict`;
    }

    (async function () {
        const tokenAES = getCookie('tokenAES');

        if (tokenAES) {
            try {
                const response = await fetch(`/login?tokenReg=${encodeURIComponent(tokenAES)}`);
                const data = await response.json();

                if (data.status === "Error") {
                    deleteCookie('tokenAES');
                    window.location.href = '/login.html';
                }
            } catch (error) {
                console.error('Erro ao validar o tokenAES:', error);
                deleteCookie('tokenAES');
                window.location.href = '/login.html';
            }
        } else {
            window.location.href = '/login.html';
        }
    })();
</script>
```


E pronto! Em hipotese, se o nome da sua homepage for `index.html`, e você colocar esse script, ele já vai estar pronto para o uso!


## Como executar o servidor?

Para executar o servidor, é bem simples. Supondo que você já tenha baixado daqui tudo certo, basta executar na pasta principal
