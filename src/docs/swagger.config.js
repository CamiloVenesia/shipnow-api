// src/docs/swagger.config.js

import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ShipNow API',
            version: '1.0.0',
            description: 'Documentación de la API de ShipNow — gestión de usuarios, pedidos, entregas y datos de prueba (mocks) para un sistema de logística.'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Servidor local' }
        ]
    },
    apis: ['./src/docs/**/*.yaml']
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);