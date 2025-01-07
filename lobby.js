import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

export const messagePosted = (pool) => {
    const router = express.Router()

    router.post("/:id", async (req, res) => {
        const { message } = req.body
        const lobbyId = req.params.id;
        let connection;
        try {
            connection = await pool.getConnection();

            const [lobby] = await connection.query(`select id from lobbies where id = ?`, [lobbyId])

            if (!lobby) {
                return res.status(400).json({ erreur: "Le lobby n'existe pas." })
            }
            await connection.query(`insert into message (message, lobby_id) values (?, ?)`, [message, lobbyId])
            return res.status(200).send({ message: "Le message a été posté." })
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}

export const createLobby = (pool) => {
    const router = express.Router()

    router.post("/createLobby", async (req, res) => {
        const { name } = req.body
        const token = req.headers.authorization.split(' ')[1]
        let connection;

        if (!name) {
            return res.status(400).json({ erreur: "Il faut un nom pour votre lobby." })
        }

        try {
            connection = await pool.getConnection();

            await connection.query(`insert into lobbies (name) values (?)`, [name])
            return res.status(200).send({ message: "Le lobby a été créé avec succès." })
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}