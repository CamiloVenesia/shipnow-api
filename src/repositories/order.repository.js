// src/repositories/order.repository.js

import Order from '../models/order.model.js'

export const orderRepository = {

    async findAll({ skip, limit }) {
        return await Order.find().skip(skip).limit(limit)
    },

    async count() {
        return await Order.countDocuments()
    },

    async findById(oid) {
        return await Order.findById(oid)
    },

    async create(data) {
        return await Order.create(data)
    },

    async deleteById(oid) {
        return await Order.findByIdAndDelete(oid)
    },

    async save(orderDoc) {
        return await orderDoc.save()
    }
}