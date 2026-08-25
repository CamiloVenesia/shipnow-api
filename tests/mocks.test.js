// tests/mocks.test.js

import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

describe('Mocks API', () => {

    describe('GET /api/mocks/mockingusers', () => {
        it('debería generar usuarios simulados sin persistirlos', async () => {
            const response = await request(app).get('/api/mocks/mockingusers?count=3');

            expect(response.status).to.equal(200);
            expect(response.body.status).to.equal('success');
            expect(response.body.payload).to.have.length(3);
            expect(response.body.payload[0]).to.have.property('email');
        });

        it('debería responder 400 si la cantidad no es un número', async () => {
            const response = await request(app).get('/api/mocks/mockingusers?count=abc');

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('INVALID_MOCK_QUANTITY');
        });

        it('debería responder 400 si la cantidad es negativa', async () => {
            const response = await request(app).get('/api/mocks/mockingusers?count=-5');

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('INVALID_MOCK_QUANTITY');
        });
    });

    describe('POST /api/mocks/generateData', () => {
        it('debería generar y persistir datos de prueba correctamente', async () => {
            const response = await request(app).post('/api/mocks/generateData').send({
                users: 5,
                orders: 3,
                deliveries: 3
            });

            expect(response.status).to.equal(201);
            expect(response.body.status).to.equal('success');
            expect(response.body.payload.usersCreated).to.equal(5);
            expect(response.body.payload.ordersCreated).to.equal(3);
            expect(response.body.payload.deliveriesCreated).to.equal(3);
        });

        it('debería responder 400 si alguna cantidad es inválida', async () => {
            const response = await request(app).post('/api/mocks/generateData').send({
                users: 0,
                orders: 5,
                deliveries: 5
            });

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('INVALID_MOCK_QUANTITY');
        });
    });
});