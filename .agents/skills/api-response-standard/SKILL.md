---
name: api-response-standard
description: Define o padrão para as respostas das APIs no projeto Fluxa, mantendo-as simples e sem mensagens de sucesso redundantes.
---

# API Response Standard

Este guia define o padrão para as respostas das APIs no projeto Fluxa. O objetivo é manter as respostas simples, diretas e sem atributos desnecessários como "message" em casos de sucesso.

## When to use this skill

- Use ao criar novos endpoints de API ou modificar existentes.
- Útil para manter a consistência da interface de comunicação entre o frontend e backend.

## How to use it

### Regras Gerais

1.  **Sem Mensagens de Sucesso**: Não inclua atributos como `"message": "Operação realizada com sucesso"` em respostas de sucesso (200, 201). O status code HTTP já indica o sucesso.
2.  **Estrutura de Dados Limpa**: Retorne os dados diretamente no nível raiz do JSON, sem encapsulá-los em objetos adicionais (ex: retorne o usuário diretamente em vez de `{ "user": { ... } }`), a não ser que haja múltiplos objetos distintos.
3.  **Tratamento de Erros**: Em caso de erro (4xx, 5xx), retorne um objeto com o atributo `error`.
    - Exemplo: `{ "error": "E-mail já cadastrado" }`
4.  **Uso de JWT**: Rotas de autenticação que requerem login devem retornar o token JWT junto com os dados do usuário.
    - Exemplo: `{ "user": { ... }, "token": "..." }`

### Exemplos

#### Sucesso (Criação)
**Endpoint**: `POST /api/register`
**Status**: 201 Created
**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name"
}
```

#### Sucesso (Login)
**Endpoint**: `POST /api/login`
**Status**: 200 OK
**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "eyJhbG..."
}
```

#### Erro
**Status**: 400 Bad Request
**Response**:
```json
{
  "error": "Email e senha são obrigatórios"
}
```
