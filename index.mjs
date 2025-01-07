import express from 'express';
import mariadb from 'mariadb';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { promisify } from 'util';
import JWT from 'jsonwebtoken';
import register from './register.js';
import login from './login.js';
import { messagePosted, createLobby } from './lobby.js';
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

app.use(express.json())
app.use("/api/register", register(pool))
app.use("/api/login", login(pool))
// app.use("/api/lobby", messagePosted(pool))
app.use("/api/lobby", createLobby(pool))

// app.use((req, res, next) => {
//     const keyUsed = req.body.key;

//     if (!keyUsed || keyUsed !== key) {
//         return res.status(403).json({ error: 'Access denied. Invalid or missing API key.' });
//     }
//     next();
// });

app.get("/api/lobby/:id", async (req, res) => {
    const lobbyId = req.params.id;
    let connection;
    try {
        connection = await pool.getConnection();
        const data = await connection.query(`
            select m.id, m.date_message, m.message, l.name as lobby_name
            from message m
            join lobby l on m.lobby_id = l.id
            where l.id = ?;
        `, [lobbyId]);
        return res.status(200).send(data)
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.release();
    }
})

app.get("/api/lobby/:id/:id", async (req, res) => {
    const lobbyId = req.params.id;
    const messageId = req.params.id
    let connection;
    try {
        connection = await pool.getConnection();
        const data = await connection.query(`
            select m.id, m.date_message, m.message, l.name as lobby_name
            from message m
            join lobby l on m.lobby_id = l.id
            where m.id = ?;
        `, [lobbyId, messageId]);
        return res.status(200).send(data)
    } catch (err) {
        throw err;
    } finally {
        if (connection) connection.release();
    }
})

app.get("/api/users", async (req, res) => {
    const lobbyId = req.params.id;
    const messageId = req.params.id
    let connection;
    try {
        connection = await pool.getConnection();
        const data = await connection.query(`
            select m.id, m.date_message, m.message, l.name as lobby_name
            from message m
            join lobby l on m.lobby_id = l.id
            where m.id = ?;
        `, [lobbyId, messageId]);
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