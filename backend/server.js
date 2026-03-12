require('dotenv').config(); // SEMPRE NA LINHA 1
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão (Igual ao seu, mas agora garantimos que process.env existe)


const db = mysql.createConnection({

    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306
    
}); 

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco da nuvem:', err);
        return;
    }
    console.log('Conectado com sucesso ao MySQL no Clever Cloud!');
});

// --- ROTA PARA SERVIR O FRONTEND NO RENDER ---
// Isso vai fazer seu site abrir quando você acessar o link do Render
app.use(express.static(path.join(__dirname, '../'))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ... (Restante das suas rotas de cadastro, login e produtos)

// --- CONFIGURAÇÃO DE ARQUIVOS (MULTER & STATIC) ---

app.use('/IMG', express.static(path.join(__dirname, '../IMG')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../IMG'); 
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// --- ROTAS DE AUTENTICAÇÃO ---

app.post("/cadastro", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const hash = await bcrypt.hash(senha, 10);
        // Colocamos 'user' entre aspas simples na query SQL
        const sql = "INSERT INTO usuarios (email, senha, tipo) VALUES (?, ?, 'user')";
        db.query(sql, [email, hash], (err) => {
            if (err) return res.status(500).json({ error: "Erro ao cadastrar" });
            res.json({ message: "Sucesso!" });
        });
    } catch (e) { res.status(500).send(); }
});

app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erro no banco" });
        if (results.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

        // LOGS PARA DEBUG
        const match = await bcrypt.compare(senha, results[0].senha);
        console.log("--- TENTATIVA DE LOGIN ---");
        console.log("Senha digitada:", senha);
        console.log("Hash no banco:", results[0].senha);
        console.log("Bateu?", match);

        if (!match) return res.status(401).json({ error: "Senha incorreta" });

        res.json({ 
            message: "Logado!", 
            tipo: results[0].tipo 
        });
    });
});


// --- ROTAS DE PRODUTOS ---

app.get('/produtos', (req, res) => {
    db.query('SELECT * FROM produtos', (err, results) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar produtos" });
        res.json(results);
    });
});

app.post('/produtos', upload.single('imagem_arquivo'), (req, res) => {
    const { nome, preco } = req.body;
    const imagem_url = req.file ? `IMG/${req.file.filename}` : 'IMG/default.jpg';
    const sql = 'INSERT INTO produtos (nome, preco, imagem_url) VALUES (?, ?, ?)';
    db.query(sql, [nome, preco, imagem_url], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao salvar produto" });
        res.json({ message: "Salvo com sucesso!" });
    });
});

app.delete('/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM produtos WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao deletar produto" });
        res.json({ message: "Removido!" });
    });
});

app.put('/produtos/:id', (req, res) => {
    const { id } = req.params;
    const { nome, preco } = req.body;
    db.query('UPDATE produtos SET nome = ?, preco = ? WHERE id = ?', [nome, preco, id], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao editar produto" });
        res.json({ message: "Editado!" });
    });
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));