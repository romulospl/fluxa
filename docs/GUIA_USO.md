# Guia de Uso - Fluxa

O **Fluxa** é uma plataforma que conecta métodos de pagamento tradicionais do Brasil (PIX e Boleto) ao mundo das criptomoedas. O lojista cria uma cobrança em reais, o cliente paga normalmente e o Fluxa converte e deposita o valor em **USDC** (dólar digital) diretamente na carteira do lojista.

---

## 1. Pré-requisitos

Para rodar o projeto localmente, certifique-se de ter instalado:
- **Node.js 20+**
- **pnpm** (gerenciador de pacotes)
- **PostgreSQL** (banco de dados)

---

## 2. Como Executar o Projeto

O Fluxa é composto por duas aplicações principais que devem rodar simultaneamente: o **app principal** e o **serviço blockchain**.

### Passo 2.1: Banco de Dados
Crie um banco de dados PostgreSQL para o projeto:
```bash
createdb fluxa
```

### Passo 2.2: Serviço Blockchain (`fluxa-stellar`)
Este serviço se comunica com a rede Stellar e roda na porta `3001`.
1. Acesse a pasta: `cd fluxa-stellar`
2. Instale as dependências: `pnpm install`
3. Crie um arquivo `.env` baseado nas configurações do ambiente (chaves Stellar, Contract ID, etc.).
4. Inicie o serviço: `pnpm dev`

### Passo 2.3: Aplicação Principal (`fluxa-app`)
Responsável pelo painel do lojista e interface de pagamento. Roda na porta `3000`.
1. Acesse a pasta: `cd fluxa-app`
2. Instale as dependências: `pnpm install`
3. Crie um arquivo `.env` (com a URL do banco `DATABASE_URL`, chaves do Asaas, e `STELLAR_SERVICE_SECRET` idêntica a do serviço stellar).
4. Rode as migrations do banco: `npx prisma migrate dev`
5. Inicie a aplicação: `pnpm dev`

---

## 3. Como Usar

Com os dois terminais rodando:
1. Acesse **http://localhost:3000** no seu navegador.
2. Faça login para acessar seu **Dashboard**.
3. **Crie uma cobrança** definindo o valor em Reais.
4. O sistema irá gerar um link de pagamento.
5. Compartilhe o link com o cliente para que ele pague via PIX ou Boleto.
6. Acompanhe os status no painel (Pendente, Pago, Transferência em andamento, Concluído).

---

## 4. Configurando o Ngrok para Webhooks (Testes Locais)

Para que o provedor de pagamentos (Asaas) consiga confirmar automaticamente os pagamentos na sua máquina local, ele precisa conseguir acessar o seu servidor. Como o `localhost` é fechado, utilizamos o **ngrok** para expor a porta local para a internet.

### 4.1 Instalando o Ngrok
Se estiver no macOS (usando Homebrew):
```bash
brew install ngrok/ngrok/ngrok
```
Ou baixe diretamente pelo site: [ngrok.com](https://ngrok.com/)

### 4.2 Iniciando o Túnel
Como o `fluxa-app` está rodando na porta `3000`, execute em um novo terminal:
```bash
ngrok http 3000
```

### 4.3 Configurando no Asaas
1. O ngrok vai gerar uma URL pública no terminal (exemplo: `https://abcd-12-34.ngrok-free.app`).
2. Acesse o painel do Asaas e vá nas **Configurações de Webhook**.
3. Cadastre a URL do ngrok adicionando a rota do webhook do Fluxa. O link ficará parecido com:
   `https://abcd-12-34.ngrok-free.app/api/webhook-asaas`
4. Salve e agora todos os pagamentos simulados no Asaas notificarão sua aplicação local automaticamente!
