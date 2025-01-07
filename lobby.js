import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

export default (pool) => {
    const router = express.Router()

    router.post("/:id", async (req, res) => {
        const { message } = req.body
        const lobbyId = req.params.id;
        let connection;
        try {
            connection = await pool.getConnection();

            const [lobby] = await connection.query(`select id from lobby where id = ?`, [lobbyId])

            if (!lobby) {
                return res.status(400).json({ erreur: "Le lobby n'existe pas." })
            }
            // let date = new Date().toISOString().split('T')[0]
            // const data = 
            const data = await connection.query(`insert into message (message, lobby_id) values (?, ?)`, [message, lobbyId])
            return res.status(200).send({ message: "Le message a été posté."})
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}