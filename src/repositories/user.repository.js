// src/repositories/user.repository.js

import User from '../models/user.model.js'

export const userRepository = {

    async findAll({ skip, limit }) {
        return await User.find().skip(skip).limit(limit)
    },

    async count() {
        return await User.countDocuments()
    },

    async findById(uid) {
        return await User.findById(uid)
    },

    async findByEmail(email) {
        return await User.findOne({ email })
    },

    async create(data) {
        return await User.create(data)
    },

    async deleteById(uid) {
        return await User.findByIdAndDelete(uid)
    },

    async save(userDoc) {
        return await userDoc.save()
    }
}