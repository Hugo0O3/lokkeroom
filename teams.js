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

export const createTeam = (pool) => {
    const router = express.Router()

    router.post("/createTeam", jwtToken, async (req, res) => {
        const { name } = req.body
        const userId = req.user.id
        let connection;

        if (!name) {
            return res.status(400).json({ erreur: "Il faut un nom pour votre team." })
        }

        try {
            connection = await pool.getConnection();

            const result = await connection.query(`insert into teams (name) values (?)`, [name])

            const teamId = result.insertId;

            await connection.query(`insert into junction_users_teams (user_id, team_id, isAdmin) values (?, ?, ?)`, [userId, teamId, 'true'])

            return res.status(200).send({ message: "La team a été créé avec succès." })
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}

export const addUserToTeam = (pool) => {
    const router = express.Router()

    router.post("/:teamId/add-userTeam", jwtToken, async (req, res) => {
        const { userId } = req.body
        const teamId = req.params.teamId
        const adminId = req.user.id
        let connection;

        if (!userId) {
            return res.status(400).json({ erreur: "Il faut l'id." })
        }

        try {
            connection = await pool.getConnection();

            const [isUserAdmin] = await connection.query(`select isAdmin from junction_users_teams where user_id = ? and team_id = ?`, [adminId, teamId])

            if (!isUserAdmin || isUserAdmin.isAdmin !== 'true') {
                return res.status(400).json({ erreur: "Vous n'êtes pas l'admin de cette team! Vous ne pouvez pas ajouter de user." })
            }

            await connection.query(`insert into junction_users_teams (user_id, team_id, isAdmin) values (?, ?, ?)`, [userId, teamId, 'false'])

            return res.status(200).send({ message: "Le user a été ajouté avec succès à la team." })
        } catch (err) {
            throw err;
        } finally {
            if (connection) connection.release();
        }
    });
    return router
}