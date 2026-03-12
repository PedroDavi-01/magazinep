require('dotenv').config();
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

// Conexão com o Banco
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306
}); 

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err);
        return;
    }
    console.log('Conectado ao MySQL no Clever Cloud!');
});

// --- SERVIR ARQUIVOS ESTÁTICOS ---
// Servir a pasta IMG (que está na raiz do projeto, fora da pasta backend)
app.use('/IMG', express.static(path.join(__dirname, '../IMG')));
// Servir o Frontend
app.use(express.static(path.join(__dirname, '../'))); 

// Configuração do Multer para salvar na pasta IMG da raiz
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

// --- ROTAS ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.post("/cadastro", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const hash = await bcrypt.hash(senha, 10);
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
        const match = await bcrypt.compare(senha, results[0].senha);
        if (!match) return res.status(401).json({ error: "Senha incorreta" });
        res.json({ message: "Logado!", tipo: results[0].tipo });
    });
});

app.get('/produtos', (req, res) => {
    db.query('SELECT * FROM produtos', (err, results) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar produtos" });
        res.json(results);
    });
});

app.post('/produtos', upload.single('imagem_arquivo'), (req, res) => {
    const { nome, preco } = req.body;
    // IMPORTANTE: Salvamos apenas 'IMG/nome-do-arquivo.jpg'
    const imagem_url = req.file ? `IMG/${req.file.filename}` : 'IMG/default.jpg';
    
    console.log("Salvando produto com imagem:", imagem_url);

    const sql = 'INSERT INTO produtos (nome, preco, imagem_url) VALUES (?, ?, ?)';
    db.query(sql, [nome, preco, imagem_url], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao salvar produto" });
        res.json({ message: "Salvo com sucesso!", url: imagem_url });
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

// AJUSTE DE PORTA PARA O RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));