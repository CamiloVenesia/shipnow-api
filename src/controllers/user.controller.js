// src/controllers/user.controller.js

import { userService } from '../services/user.service.js'

export const userController = {

    async getAll(req, res) {
        const result = await userService.getAll(req.query)
        res.json(result)
    },

    async getById(req, res) {
        const user = await userService.getById(req.params.uid)
        res.json(user)
    },

    async create(req, res) {
        const newUser = await userService.create(req.body)
        res.status(201).json(newUser)
    },

    async remove(req, res) {
        await userService.remove(req.params.uid)
        res.json({ message: 'Usuario eliminado' })
    },

    async addDocument(req, res) {
        const { documentType } = req.body
        const user = await userService.addDocument(req.params.uid, req.file, documentType)
        res.status(201).json(user)
    }
}