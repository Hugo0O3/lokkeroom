import express, { query } from 'express';
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

export const deleteMessage = (pool) => {
    const router = express.Router()

    router.delete("/:messageId", jwtToken, async (req, res) => {
        const messageId = req.params.messageId;
        const userId = req.user.id
        let connection;

        try {
            connection = await pool.getConnection();

            const [messageInfos] = await connection.query(`
                select 
                    m.users_id,
                    l.id as lobby_id,
                    j.isAdmin
                from 
                    messages m
                join 
                    lobbies l on l.id = m.lobby_id
                left join 
                    junction_users_lobbies j on j.user_id = ? and j.lobby_id = l.id
                where 
                    m.id = ?
                `, [userId, messageId])

            if (!messageInfos) {
                return res.status(403).send({ error: "Message non trouvé." })
            }

            if (!(messageInfos.users_id === userId || messageInfos.isAdmin === true)) {
                return res.status(403).send({ error: "Vous ne pouvez pas supprimer ce message." })
            }

            await connection.query(`
                delete from messages
                where id = ?
                `, [messageId])

            return res.status(200).send({ message: "Le message a été supprimé avec succès." })
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}