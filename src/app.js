const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Durée de validité token = 5 min
const validityDuration = 5 * 60 * 1000;

app.use(express.json());

// Connexion psql
const pool = new Pool({
    host: 'localhost',
    port: 54321,
    user: 'user',
    password: 'user',
    database: 'userdb'
});

// Stockage des jetons : token -> { expiration, username, role }
const tokens = new Map();

/**
 * Droits par rôle
 * (selon l'énoncé, l'admin ne peut pas modifier : ajouter 'modifier' si besoin)
 */
const permissions = {
    client:  ['lire'],
    manager: ['lire', 'creer', 'modifier'],
    admin:   ['lire', 'creer', 'supprimer']
};

/**
 * Authentification
 */
function generateToken(username, role) {
    const token = crypto.randomBytes(32).toString('hex');
    tokens.set(token, {
        expiration: Date.now() + validityDuration,
        username,
        role
    });
    return token;
}


function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erreur: 'Jeton manquant' });
    }

    const token = authHeader.substring(7);
    const session = tokens.get(token);

    if (!session) {
        return res.status(401).json({ erreur: 'Jeton invalide ou expiré' });
    }

    if (Date.now() >= session.expiration) {
        tokens.delete(token);
        return res.status(401).json({ erreur: 'Jeton expiré' });
    }

    req.user = { username: session.username, role: session.role };
    next();
}

/**
 * Autorisation : vérifie que le rôle possède l'action demandée
 */
function authorize(action) {
    return (req, res, next) => {
        const droits = permissions[req.user?.role] || [];
        if (!droits.includes(action)) {
            return res.status(403).json({
                erreur: 'Accès refusé : droits insuffisants'
            });
        }
        next();
    };
}

// Route d'auth
app.post('/auth', async (req, res) => {
    try {
        const { usernm, passwd } = req.body;

        if (!usernm || !passwd) {
            return res.status(400).json({ erreur: 'Identifiants manquants' });
        }

        const result = await pool.query(
            'SELECT username, password, role FROM utilisateur WHERE username = $1',
            [usernm]
        );
        const user = result.rows[0];

        if (!user || user.password !== passwd) {
            return res.status(401).json({ erreur: 'Identifiant ou MDP invalides.' });
        }

        const tok = generateToken(user.username, user.role);
        res.status(200).json({ tok, role: user.role, expires: 300 });

    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de l\'authentification' });
    }
});

// Routes
app.get('/produits', authenticateToken, authorize('lire'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produit ORDER BY id');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération des produits' });
    }
});

app.get('/produit/:id', authenticateToken, authorize('lire'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM produit WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Produit introuvable' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération du produit' });
    }
});

app.post('/produit', authenticateToken, authorize('creer'), async (req, res) => {
    try {
        const { nom, description, prix, categorie } = req.body;

        const result = await pool.query(
            `INSERT INTO produit (nom, description, prix, categorie)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [nom, description, prix, categorie]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de la création du produit' });
    }
});

app.put('/produit/:id', authenticateToken, authorize('modifier'), async (req, res) => {
    try {
        const { nom, description, prix, categorie } = req.body;

        const result = await pool.query(
            `UPDATE produit
             SET nom = $1, description = $2, prix = $3, categorie = $4
             WHERE id = $5
             RETURNING *`,
            [nom, description, prix, categorie, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Produit introuvable' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de la modification du produit' });
    }
});

app.patch('/produit/:id', authenticateToken, authorize('modifier'), async (req, res) => {
    try {
        const { nom, description, prix, categorie } = req.body;

        const result = await pool.query(
            `UPDATE produit
             SET nom = COALESCE($1, nom),
                 description = COALESCE($2, description),
                 prix = COALESCE($3, prix),
                 categorie = COALESCE($4, categorie)
             WHERE id = $5
             RETURNING *`,
            [nom, description, prix, categorie, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Produit introuvable' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de la modification du produit' });
    }
});

app.delete('/produit/:id', authenticateToken, authorize('supprimer'), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM produit WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Produit introuvable' });
        }

        res.status(200).json({
            message: 'Produit supprimé',
            produit: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erreur: 'Erreur lors de la suppression du produit' });
    }
});

app.listen(port, () => {
    console.log(`API démarrée sur http://localhost:${port}`);
});