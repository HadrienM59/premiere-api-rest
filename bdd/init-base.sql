CREATE TABLE produit (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix NUMERIC(10, 2) NOT NULL,
    categorie VARCHAR(100) NOT NULL
);

CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'manager', 'admin'))
);

INSERT INTO utilisateur (username, password, role) VALUES
('client1',  'client123',  'client'),
('manager1', 'manager123', 'manager'),
('admin1',   'admin123',   'admin');

-- Quelques données
INSERT INTO produit(nom, description, prix, categorie) VALUES
('Café', 'Boisson chaude', 0.5, 'Alimentaire'),
('ThinkPad','Ordinateur portable', 169.99, 'Informatique'),
('PlayStation 2','Console de jeu de 2000', 49.5, 'Divertissement');

