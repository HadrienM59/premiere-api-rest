const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(express.json());

// Connexion psql
const pool = new Pool({
    host: 'localhost',
    port: 54321, // Pour éviter si déjà un Postgres présent et actif en local
    user: 'user',
    password: 'user',
    database: 'userdb'
});

app.get('/produits', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM produit ORDER BY id'
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            erreur: 'Erreur lors de la récupération des produits'
        });
    }
});

app.get('/produit/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM produit WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                erreur: 'Produit introuvable'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erreur: 'Erreur lors de la récupération du produit'
        });
    }
});


app.post('/produit', async (req, res) => {
    try {
        const { nom, description, prix, categorie } = req.body;

        const result = await pool.query(
            `INSERT INTO produit
                (nom, description, prix, categorie)
             VALUES
                ($1, $2, $3, $4)
             RETURNING *`,
            [nom, description, prix, categorie]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erreur: 'Erreur lors de la création du produit'
        });
    }
});

app.put('/produit/:id', async (req, res) => {
    try {
        const { nom, description, prix, categorie } = req.body;

        const result = await pool.query(
            `UPDATE produit
             SET nom = $1,
                 description = $2,
                 prix = $3,
                 categorie = $4
             WHERE id = $5
             RETURNING *`,
            [
                nom,
                description,
                prix,
                categorie,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                erreur: 'Produit introuvable'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erreur: 'Erreur lors de la modification du produit'
        });
    }
});


app.patch('/produit/:id', async (req, res) => {
    try {
        const { nom, description, prix, categorie } = req.body;

        const result = await pool.query(
            `UPDATE produit
             SET
                nom = COALESCE($1, nom),
                description = COALESCE($2, description),
                prix = COALESCE($3, prix),
                categorie = COALESCE($4, categorie)
             WHERE id = $5
             RETURNING *`,
            [
                nom,
                description,
                prix,
                categorie,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                erreur: 'Produit introuvable'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erreur: 'Erreur lors de la modification du produit'
        });
    }
});


app.delete('/produit/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM produit WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                erreur: 'Produit introuvable'
            });
        }

        res.status(200).json({
            message: 'Produit supprimé',
            produit: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erreur: 'Erreur lors de la suppression du produit'
        });
    }
});


app.listen(port, () => {
    console.log(`API démarrée sur http://localhost:${port}`);
});
