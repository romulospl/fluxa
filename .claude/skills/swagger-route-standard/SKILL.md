---
name: swagger-route-standard
description: Garante que todas as rotas de API sigam o padrão consistente de documentação Swagger (OpenAPI). Usar ao criar ou modificar rotas em fluxa-app/app/api/**/route.ts.
---

# Swagger Route Documentation Standard

This skill ensures that all API routes in the Fluxa project follow a consistent Swagger (OpenAPI) documentation pattern.

## When to use this skill

- Use this whenever creating or modifying an API route in `fluxa-app/app/api/**/route.ts`.
- This is helpful for maintaining up-to-date and consistent API documentation.

## How to use it

You MUST include a JSDoc block with the `@swagger` tag immediately before the route handler function (e.g., `export async function POST(...)`).

### Structure

The documentation must follow the OpenAPI 3.0.0 specification and include:

1.  **Path**: The endpoint path (e.g., `/api/register`).
2.  **Method**: The HTTP method (e.g., `post`, `get`, `put`, `delete`).
3.  **Summary**: A brief description in Portuguese of what the route does.
4.  **Description**: A more detailed explanation if necessary.
5.  **RequestBody** (if applicable): Detailed schema for the expected input.
6.  **Responses**: Documentation for all possible response codes (2xx, 4xx, 5xx).

### Example Pattern

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Breve resumo da rota
 *     description: Descrição detalhada da rota.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requiredField
 *             properties:
 *               requiredField:
 *                 type: string
 *               optionalField:
 *                 type: number
 *     responses:
 *       200:
 *         description: Mensagem de sucesso
 *       400:
 *         description: Erro de validação
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: Request) {
  // Implementation...
}
```

### Best Practices

- Always use Portuguese for summaries and descriptions.
- Define specific schemas for complex objects.
- Ensure the path in the `@swagger` block matches the actual file path.
- Include common error responses like 400 (Bad Request), 401 (Unauthorized), and 500 (Internal Server Error) where applicable.
