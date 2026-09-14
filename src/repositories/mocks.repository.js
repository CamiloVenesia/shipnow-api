// src/repositories/mocks.repository.js

import User from '../models/user.model.js'
import Order from '../models/order.model.js'
import Delivery from '../models/delivery.model.js'

export const mocksRepository = {

    async insertUsers(usersData) {
        return await User.insertMany(usersData)
    },

    async createOrder(orderData) {
        return await Order.create(orderData)
    },

    async createDelivery(deliveryData) {
        return await Delivery.create(deliveryData)
    },

    async updateOrderDelivery(orderId, deliveryId) {
        return await Order.findByIdAndUpdate(orderId, { delivery: deliveryId })
    }
}