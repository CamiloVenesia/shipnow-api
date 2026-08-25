// tests/logger.test.js

import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

describe('Logger Test Endpoint', () => {
    it('debería generar logs de todos los niveles y responder 200', async () => {
        const response = await request(app).get('/api/loggerTest');

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal('success');
        expect(response.body.levels).to.include.members(
            ['debug', 'http', 'info', 'warning', 'error', 'fatal']
        );
    });
});