import express from 'express';
import bcrypt from 'bcrypt';

const saltRounds = 10; // Facteur de travail

const hashPassword = async (plainPassword) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        return hashedPassword;
    } catch (error) {
        console.error('Erreur lors du hachage du mot de passe :', error);
        throw error;
    }
};

export default (pool) => {
    const router = express.Router()

    router.post("/", async (req, res) => {
        const { name, password } = req.body

        if (!name || !password) {
            return res.status(400).json({ erreur: "Tous les champs sont nécessaires." })
        }

        let connection
        try {
            connection = await pool.getConnection()

            const userExist = await connection.query(`select * from users where name = ?`, [name])

            if (userExist > 0) {
                return res.status(400).json({ erreur: "Il existe déjà un utilisateur avec ce name." })
            }

            const hashedPassword = await hashPassword(password)

            await connection.query(`insert into users (name, password) 
                values (?,?)`, [name, hashedPassword]);

            res.status(200).json({ ok: "Inscription réussie" })
        } catch (error) {
            console.log(error)
            res.status(500).json({ erreur: "Erreur lors de l'inscription" })
        } finally {
            if (connection) connection.release()
        }
    })
    return router
}