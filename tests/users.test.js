// tests/users.test.js

import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.model.js';

describe('Users API', () => {

    describe('GET /api/users', () => {
        it('debería devolver una lista vacía si no hay usuarios', async () => {
            const response = await request(app).get('/api/users');

            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');
            expect(response.body).to.have.length(0);
        });

        it('debería devolver los usuarios existentes', async () => {
            await User.create({
                firstName: 'Ana',
                lastName: 'Perez',
                email: 'ana@mail.com',
                password: '12345678',
                role: 'customer'
            });

            const response = await request(app).get('/api/users');

            expect(response.status).to.equal(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('email', 'ana@mail.com');
        });
    });

    describe('POST /api/users', () => {
        it('debería crear un usuario válido', async () => {
            const response = await request(app).post('/api/users').send({
                firstName: 'Juan',
                lastName: 'Gomez',
                email: 'juan@mail.com',
                password: '12345678'
            });

            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('_id');
            expect(response.body).to.have.property('role', 'customer');
        });

        it('debería responder 400 si faltan datos obligatorios', async () => {
            const response = await request(app).post('/api/users').send({
                firstName: 'Juan'
            });

            expect(response.status).to.equal(400);
            expect(response.body).to.have.property('status', 'error');
            expect(response.body).to.have.property('error', 'VALIDATION_ERROR');
        });

        it('debería responder 403 si se intenta crear un usuario admin', async () => {
            const response = await request(app).post('/api/users').send({
                firstName: 'Juan',
                lastName: 'Gomez',
                email: 'juan@mail.com',
                password: '12345678',
                role: 'admin'
            });

            expect(response.status).to.equal(403);
            expect(response.body.error).to.equal('FORBIDDEN');
        });
    });

    describe('GET /api/users/:uid', () => {
        it('debería responder 404 si el usuario no existe', async () => {
            const response = await request(app).get('/api/users/64b000000000000000000000');

            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('USER_NOT_FOUND');
        });
    });
});