// tests/uploads.test.js

import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';

describe('Uploads API', () => {

    async function createTestUser(role = 'customer') {
        return await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: `user-${Date.now()}-${Math.random()}@mail.com`,
            password: '12345678',
            role
        });
    }

    describe('POST /api/users/:uid/documents', () => {
        it('debería cargar un documento válido correctamente', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field('documentType', 'dni')
                .attach('document', Buffer.from('contenido de prueba'), {
                    filename: 'dni.pdf',
                    contentType: 'application/pdf'
                });

            expect(response.status).to.equal(201);
            expect(response.body.documents).to.have.length(1);
            expect(response.body.documents[0]).to.have.property('documentType', 'dni');
            expect(response.body.documents[0]).to.have.property('originalName', 'dni.pdf');
        });

        it('debería responder 400 si falta el archivo', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field('documentType', 'dni');

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('FILE_REQUIRED');
        });

        it('debería responder 400 si el tipo de documento es inválido', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field('documentType', 'pasaporte_invalido')
                .attach('document', Buffer.from('contenido'), {
                    filename: 'doc.pdf',
                    contentType: 'application/pdf'
                });

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('INVALID_DOCUMENT_TYPE');
        });

        it('debería responder 400 si el tipo de archivo no está permitido', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field('documentType', 'dni')
                .attach('document', Buffer.from('contenido'), {
                    filename: 'virus.exe',
                    contentType: 'application/x-msdownload'
                });

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('INVALID_FILE_TYPE');
        });

        it('debería responder 404 si el usuario no existe', async () => {
            const response = await request(app)
                .post('/api/users/64b000000000000000000000/documents')
                .field('documentType', 'dni')
                .attach('document', Buffer.from('contenido'), {
                    filename: 'dni.pdf',
                    contentType: 'application/pdf'
                });

            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('USER_NOT_FOUND');
        });
    });

    describe('POST /api/orders/:oid/receipt', () => {
        it('debería asociar un comprobante a un pedido existente', async () => {
            const customer = await createTestUser();
            const order = await Order.create({
                customer: customer._id,
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123',
                total: 100,
                status: 'created'
            });

            const response = await request(app)
                .post(`/api/orders/${order._id}/receipt`)
                .attach('receipt', Buffer.from('comprobante'), {
                    filename: 'comprobante.jpg',
                    contentType: 'image/jpeg'
                });

            expect(response.status).to.equal(201);
            expect(response.body.receipt).to.have.property('originalName', 'comprobante.jpg');
        });

        it('debería responder 404 si el pedido no existe', async () => {
            const response = await request(app)
                .post('/api/orders/64b000000000000000000000/receipt')
                .attach('receipt', Buffer.from('comprobante'), {
                    filename: 'comprobante.jpg',
                    contentType: 'image/jpeg'
                });

            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('ORDER_NOT_FOUND');
        });
    });

    describe('POST /api/deliveries/:did/receipt', () => {
        it('debería asociar un comprobante a una entrega existente', async () => {
            const customer = await createTestUser();
            const driver = await createTestUser('driver');
            const order = await Order.create({
                customer: customer._id,
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123',
                total: 100,
                status: 'assigned'
            });
            const delivery = await Delivery.create({
                order: order._id,
                driver: driver._id,
                status: 'assigned'
            });

            const response = await request(app)
                .post(`/api/deliveries/${delivery._id}/receipt`)
                .attach('receipt', Buffer.from('comprobante'), {
                    filename: 'comprobante.png',
                    contentType: 'image/png'
                });

            expect(response.status).to.equal(201);
            expect(response.body.receipt).to.have.property('originalName', 'comprobante.png');
        });

        it('debería responder 404 si la entrega no existe', async () => {
            const response = await request(app)
                .post('/api/deliveries/64b000000000000000000000/receipt')
                .attach('receipt', Buffer.from('comprobante'), {
                    filename: 'comprobante.png',
                    contentType: 'image/png'
                });

            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('DELIVERY_NOT_FOUND');
        });
    });
});