CREATE TABLE produit (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix NUMERIC(10, 2) NOT NULL,
    categorie VARCHAR(100) NOT NULL
);

-- Quelques données
INSERT INTO produit(nom, description, prix, categorie) VALUES
('Café', 'Boisson chaude', 0.5, 'Alimentaire'),
('ThinkPad','Ordinateur portable', 169.99, 'Informatique'),
('PlayStation 2','Console de jeu de 2000', 49.5, 'Divertissement');