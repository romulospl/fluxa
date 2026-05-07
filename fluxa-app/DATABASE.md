# Guia de Configuração do Banco de Dados (Prisma)

Este projeto utiliza **Prisma ORM** com **PostgreSQL**. Siga os passos abaixo para criar as tabelas no seu banco de dados local.

## 1. Configurar Variáveis de Ambiente
Certifique-se de que o arquivo `.env` na raiz do projeto contenha a URL de conexão correta:
```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/NOME_DO_BANCO?schema=public"
```

## 2. Criar as Tabelas
Existem duas formas principais de sincronizar o schema com o banco de dados:

### Opção A: Usando Migrations (Recomendado para desenvolvimento)
Este comando cria um arquivo de migração e aplica as mudanças ao banco. É ideal para manter o histórico de alterações.
```bash
npx prisma migrate dev --name init
```

### Opção B: Sincronização Direta (Rápido para testes)
Sincroniza o banco diretamente com o schema sem criar arquivos de migração.
```bash
npx prisma db push
```

## 3. Gerar o Cliente Prisma
Sempre que você alterar o arquivo `prisma/schema.prisma`, execute este comando para atualizar o cliente TypeScript:
```bash
npx prisma generate
```

## 4. Visualizar os Dados (Prisma Studio)
Para abrir uma interface gráfica no navegador e gerenciar os dados das tabelas:
```bash
npx prisma studio
```

---
*Nota: Certifique-se de ter um banco PostgreSQL rodando localmente (ou via Docker) antes de executar os comandos acima.*
