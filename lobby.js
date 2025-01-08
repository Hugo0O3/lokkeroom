import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

const jwtToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
        return res.status(403).json({ error: 'Le token est manquant.' })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide ou arrivé à expiration' })
        }

        req.user = user
        next()
    });
};

export const messagePosted = (pool) => {
    const router = express.Router()

    router.post("/:id", jwtToken, async (req, res) => {
        const { message } = req.body
        const lobbyId = req.params.id;
        const userId = req.user.id
        let connection;
        try {
            connection = await pool.getConnection();

            const [lobby] = await connection.query(`select id from lobbies where id = ?`, [lobbyId])

            if (!lobby) {
                return res.status(400).json({ erreur: "Le lobby n'existe pas." })
            }
            await connection.query(`insert into messages (message, users_id, lobby_id) values (?, ?, ?)`, [message, userId, lobbyId])
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

    router.post("/createLobby", jwtToken, async (req, res) => {
        const { name, teamId } = req.body
        const userId = req.user.id
        let connection;

        if (!name) {
            return res.status(400).json({ erreur: "Il faut un nom pour votre lobby." })
        }

        try {
            connection = await pool.getConnection();

            const result = await connection.query(`insert into lobbies (name, team_id) values (?, ?)`, [name, teamId])

            const lobbyId = result.insertId;

            await connection.query(`insert into junction_users_lobbies (user_id, lobby_id, isAdmin) values (?, ?, ?)`, [userId, lobbyId, 'true'])

            return res.status(200).send({ message: "Le lobby a été créé avec succès." })
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}