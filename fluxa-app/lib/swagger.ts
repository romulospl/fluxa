import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Fluxa API',
        version: '1.0.0',
        description: 'API Documentation for Fluxa App',
      },
      tags: [
        { name: 'Autenticação', description: 'Rotas de login, registro e logout' },
        { name: 'Usuário', description: 'Rotas de consulta e atualização de dados do usuário' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
