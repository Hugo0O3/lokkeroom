import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    if (match) {
      console.log('✅ Mot de passe valide');
    } else {
      console.log('❌ Mot de passe invalide');
    }
    return match;
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe :', error);
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

      const [userExist] = await connection.query(`select * from users where name = ?`, [name])

      if (!userExist) {
        return res.status(400).json({ erreur: "L'utilisateur n'existe pas." })
      }

      const passwordVerify = await verifyPassword(password, userExist.password)

      if (!passwordVerify) {
        return res.status('400').json({ erreur: "Il y a un problème avec le mot de passe." })
      }

      const token = jwt.sign(
        { id: userExist.id, name: userExist.name },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res.status(200).json({ ok: "Connexion réussie", token: token })
    } catch (error) {
      console.log(error)
      res.status(500).json({ erreur: "Erreur lors de l'inscription" })
    } finally {
      if (connection) connection.release()
    }
  })
  return router
}