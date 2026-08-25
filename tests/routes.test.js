// tests/routes.test.js

import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

describe('Ruta inexistente', () => {
    it('debería responder 404 con el formato de error estándar', async () => {
        const response = await request(app).get('/api/blabla');

        expect(response.status).to.equal(404);
        expect(response.body.status).to.equal('error');
        expect(response.body.error).to.equal('ROUTE_NOT_FOUND');
    });
});