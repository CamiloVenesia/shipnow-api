// tests/orders.test.js

import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';

describe('Orders API', () => {

    async function createTestCustomer() {
        const user = await User.create({
            firstName: 'Cliente',
            lastName: 'Test',
            email: `cliente-${Date.now()}@mail.com`,
            password: '12345678',
            role: 'customer'
        });
        return user;
    }

    describe('GET /api/orders', () => {
        it('debería devolver una lista vacía si no hay pedidos', async () => {
            const response = await request(app).get('/api/orders');

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('items');
            expect(response.body.items).to.be.an('array');
            expect(response.body.items).to.have.length(0);
            expect(response.body).to.have.property('page', 1);
            expect(response.body).to.have.property('total', 0);
        });
    });

    describe('POST /api/orders', () => {
        it('debería crear un pedido válido y calcular el total correctamente', async () => {
            const customer = await createTestCustomer();

            const response = await request(app).post('/api/orders').send({
                customer: customer._id.toString(),
                items: [{ name: 'Bicicleta', quantity: 2, price: 1500 }],
                deliveryAddress: 'Calle Falsa 123'
            });

            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('order');
            expect(response.body.order).to.have.property('_id');
            expect(response.body.order.total).to.equal(3000);
            expect(response.body.order.status).to.equal('created');
            expect(response.body).to.have.property('shippingCost');
        });

        it('debería responder 400 si falta el cliente', async () => {
            const response = await request(app).post('/api/orders').send({
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123'
            });

            expect(response.status).to.equal(400);
            expect(response.body.status).to.equal('error');
            expect(response.body.error).to.equal('VALIDATION_ERROR');
        });

        it('debería responder 404 si el cliente no existe', async () => {
            const response = await request(app).post('/api/orders').send({
                customer: '64b000000000000000000000',
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123'
            });

            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('USER_NOT_FOUND');
        });

        it('debería responder 403 si el cliente tiene rol driver', async () => {
            const driver = await User.create({
                firstName: 'Repartidor',
                lastName: 'Test',
                email: `driver-${Date.now()}@mail.com`,
                password: '12345678',
                role: 'driver'
            });

            const response = await request(app).post('/api/orders').send({
                customer: driver._id.toString(),
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123'
            });

            expect(response.status).to.equal(403);
            expect(response.body.error).to.equal('FORBIDDEN');
        });
    });

    describe('GET /api/orders/:oid', () => {
        it('debería devolver un pedido existente', async () => {
            const customer = await createTestCustomer();
            const order = await Order.create({
                customer: customer._id,
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123',
                total: 100,
                status: 'created'
            });

            const response = await request(app).get(`/api/orders/${order._id}`);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('_id');
            expect(response.body.deliveryAddress).to.equal('Calle Falsa 123');
        });

        it('debería responder 404 si el pedido no existe', async () => {
            const response = await request(app).get('/api/orders/64b000000000000000000000');

            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('ORDER_NOT_FOUND');
        });
    });

    describe('PATCH /api/orders/:oid/status', () => {
        it('debería actualizar el estado de un pedido', async () => {
            const customer = await createTestCustomer();
            const order = await Order.create({
                customer: customer._id,
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123',
                total: 100,
                status: 'created'
            });

            const response = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .send({ status: 'in_transit' });

            expect(response.status).to.equal(200);
            expect(response.body.status).to.equal('in_transit');
        });

        it('debería responder 409 si el pedido ya fue entregado', async () => {
            const customer = await createTestCustomer();
            const order = await Order.create({
                customer: customer._id,
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123',
                total: 100,
                status: 'delivered'
            });

            const response = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .send({ status: 'created' });

            expect(response.status).to.equal(409);
            expect(response.body.error).to.equal('ORDER_ALREADY_DELIVERED');
        });

        it('debería responder 400 si no se envía el estado', async () => {
            const customer = await createTestCustomer();
            const order = await Order.create({
                customer: customer._id,
                items: [{ name: 'Test', quantity: 1, price: 100 }],
                deliveryAddress: 'Calle Falsa 123',
                total: 100,
                status: 'created'
            });

            const response = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .send({});

            expect(response.status).to.equal(400);
            expect(response.body.error).to.equal('VALIDATION_ERROR');
        });
    });
});