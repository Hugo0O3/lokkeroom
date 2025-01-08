import express from 'express';
import mariadb from 'mariadb';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import register from './register.js';
import login from './login.js';
import { messagePosted, createLobby, addUser } from './lobby.js';
import { createTeam, addUserToTeam } from './teams.js'
import path from 'path';

dotenv.config();

const app = express()
const PORT = 3000
const key = process.env.APP_KEY

const __dirname = path.resolve()

const jwtSecret = process.env.JWT_SECRET;
const username = process.env.USER_NAME;
const password = process.env.USER_PASSWORD;

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    connectionLimit: 5
})

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

app.use(express.json())
app.use("/api/register", register(pool))
app.use("/api/login", login(pool))
app.use("/api/lobby", messagePosted(pool))
app.use("/api/lobby", createLobby(pool))
app.use("/api/team", createTeam(pool))
app.use("/api/team", addUserToTeam(pool))
app.use("/api/lobby", addUser(pool))

// app.use((req, res, next) => {
//     const keyUsed = req.body.key;

//     if (!keyUsed || keyUsed !== key) {
//         return res.status(403).json({ error: 'Access denied. Invalid or missing API key.' });
//     }
//     next();
// });

app.get("/api/lobby/:id", jwtToken, async (req, res) => {
    const lobbyId = req.params.id;
    let connection;
    try {
        connection = await pool.getConnection();
        const data = await connection.query(`
            select m.message, date_message
            from messages m
            where lobby_id = ?
        `, [lobbyId]);
        return res.status(200).send(data)
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.release();
    }
})

app.get("/api/lobby/:id/:id", jwtToken, async (req, res) => {
    const lobbyId = req.params.id;
    let connection;
    try {
        connection = await pool.getConnection();
        const data = await connection.query(`
            select id, message, date_message
            from messages
            where id = ?
        `, [lobbyId]);
        return res.status(200).send(data)
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.release();
    }
})

app.get("/api/users", jwtToken, async (req, res) => {
    const adminId = req.user.id
    let connection;
    try {
        connection = await pool.getConnection();
        const data = await connection.query(`
           select 
                l.id as lobby_id,
                l.name as lobby_name,
                u.id as user_id,
                u.name as user_name
            from 
                junction_users_lobbies j
            join 
                lobbies l on l.id = j.lobby_id
            join 
                users u on u.id = j.user_id
            order by 
                l.id, j.id;
        `, [adminId]);
        return res.status(200).send(data)
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.release();
    }
})

app.listen(PORT, () => {
    console.log(`Server Listening on PORT: http://127.0.0.1:${PORT}`);
});