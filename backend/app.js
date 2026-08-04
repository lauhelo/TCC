require('dotenv').config();
const express = require('express')
const cors = require('cors')
const pool = require("./db.js")

const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const app = express()
const porta = 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use(express.static('public'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(porta, () => {
    console.log(`Servidor rodando em: http://localhost:${porta}`)
    console.log(`Swagger em: http://localhost:${porta}/api-docs`)
})


function autenticarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: "Token não enviado" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ erro: "Token mal formatado" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "pet");
        req.user = decoded;
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ erro: "Token inválido ou expirado" });
    }
}


// ================= CADASTRO USUÁRIOS =================
// Mostrar 
app.get('/mostrar', autenticarToken, async (req, res) => {
    try {
        const [resultado] = await pool.query("SELECT * FROM cadastro")
        res.json(resultado)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: "erro no servidor" })
    }
})


// ROTA DE INSERIR USUÁRIO
app.post('/inserir', async (req, res) => {
    try {
        const { nome, email, cep, cpf, telefone, data_nascimento, senha, palavra_chave, tipo } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
        }

        const hash = crypto.createHash("sha256").update(senha.trim()).digest("base64");

        const sql = `INSERT INTO cadastro (nome, email, cep, cpf, telefone, data_nascimento, senha, palavra_chave, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [resultado] = await pool.query(sql, [
            nome, email, cep || null, cpf || null, telefone || null,
            data_nascimento || null, hash, palavra_chave || null, tipo || 'usuario'
        ]);

        const token = jwt.sign(
            { id_usuario: resultado.insertId, tipo: tipo || 'usuario' },
            process.env.JWT_SECRET || "pet",
            { expiresIn: "2h" }
        );

        res.json({
            resposta: "Cadastro efetuado!",
            token,
            usuario: { id_usuario: resultado.insertId, tipo: tipo || 'usuario' }
        });

    } catch (error) {
        console.error("ERRO NO CADASTRO:", error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ erro: "E-mail já cadastrado." });
        res.status(500).json({ erro: "Erro ao salvar no banco de dados." });
    }
});


app.put('/atualizar', autenticarToken, async (req, res) => {
    try {
        const { nome, email, cep, cpf, telefone, data_nascimento, senha, palavra_chave, id_usuario } = req.body;

        if (Number(req.user.id_usuario) !== Number(id_usuario)) {
            return res.status(403).json({ erro: "Sem permissão para atualizar este perfil" });
        }

        let sql;
        let valores;

        if (senha) {
            const hash = crypto
                .createHash("sha256")
                .update(senha.trim())
                .digest("base64");

            sql = `UPDATE cadastro SET nome = ?, email = ?, cep = ?, cpf = ?, telefone = ?, data_nascimento = ?, senha = ?, palavra_chave = ? WHERE id_usuario = ?`;
            valores = [nome, email, cep, cpf, telefone, data_nascimento, hash, palavra_chave, id_usuario];
        } else {
            sql = `UPDATE cadastro SET nome = ?, email = ?, cep = ?, cpf = ?, telefone = ?, data_nascimento = ?, palavra_chave = ? WHERE id_usuario = ?`;
            valores = [nome, email, cep, cpf, telefone, data_nascimento, palavra_chave, id_usuario];
        }

        const [resultado] = await pool.query(sql, valores);

        res.json({
            resposta: resultado.affectedRows ? "Perfil atualizado com sucesso!" : "Nenhuma alteração realizada."
        });

    } catch (error) {
        console.error("Erro ao atualizar:", error);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

// DELETAR CONTA 
app.delete('/deletar', autenticarToken, async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;

        await pool.query("DELETE FROM usuario_ong WHERE id_usuario = ?", [id_usuario]);

        const [resultado] = await pool.query("DELETE FROM cadastro WHERE id_usuario = ?", [id_usuario]);

        if (resultado.affectedRows > 0) {
            res.json({ resposta: "Conta excluída com sucesso!" });
        } else {
            res.status(404).json({ erro: "Usuário não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao deletar:", error);
        res.status(500).json({ erro: "Erro ao excluir conta. Verifique dependências." });
    }
});
// ================= LOGIN UNIFICADO =================
// LOGIN UNIFICADO
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const hash = crypto.createHash("sha256").update(senha.trim()).digest("base64");

        const [usuarios] = await pool.query("SELECT * FROM cadastro WHERE email = ?", [email]);

        if (usuarios.length === 0 || usuarios[0].senha !== hash) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        const user = usuarios[0];

        let possuiOngs = false;
        if (user.tipo === "ong") {
            const [ongs] = await pool.query("SELECT id_ong FROM usuario_ong WHERE id_usuario = ? LIMIT 1", [user.id_usuario]);
            possuiOngs = ongs.length > 0;
        }

        const token = jwt.sign(
            { id_usuario: user.id_usuario, tipo: user.tipo },
            process.env.JWT_SECRET || "pet",
            { expiresIn: "2h" }
        );

        res.json({
            token,
            possuiOngs,
            usuario: { id_usuario: user.id_usuario, nome: user.nome, email: user.email, tipo: user.tipo }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro no servidor durante o login" });
    }
});

// ================= ROTA DE RECUPERAÇÃO E ATUALIZAÇÃO DE SENHA =============================================================
app.put('/recuperar-senha', async (req, res) => {
    try {
        const { email, senha, confirmar_senha, palavra_chave } = req.body;

        if (!email || !senha || !confirmar_senha || !palavra_chave) {
            return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
        }

        if (senha !== confirmar_senha) {
            return res.status(400).json({ erro: "A senha e a confirmação não coincidem." });
        }

        const emailLimpo = email.trim().toLowerCase();
        const palavraLimpa = palavra_chave.trim();

        const hash = crypto
            .createHash("sha256")
            .update(senha.trim())
            .digest("base64");

        const sql = `UPDATE cadastro SET senha = ? WHERE LOWER(email) = ? AND palavra_chave = ?`;
        const [resultado] = await pool.query(sql, [hash, emailLimpo, palavraLimpa]);

        if (resultado.affectedRows === 0) {
            return res.status(401).json({ erro: "E-mail ou Palavra-Chave incorretos." });
        }

        return res.json({ resposta: "Senha atualizada com sucesso!" });

    } catch (error) {
        console.error("Erro na recuperação de senha:", error);
        res.status(500).json({ erro: "Erro interno no servidor ao atualizar senha." });
    }
});

// ================= CADASTRO ANIMAIS ============================================================================================================

// Mostrar 
app.get('/mostrarAnimal', async (req, res) => {
    try {

        const { especie, sexo, porte } = req.query;

        let sql = `SELECT * FROM animais WHERE 1=1`;
        let valores = [];

        if (especie) {
            sql += ` AND LOWER(especie) = LOWER(?)`;
            valores.push(especie);
        }

        if (sexo) {
            sql += ` AND LOWER(sexo) LIKE ?`;
            valores.push(sexo.toLowerCase().charAt(0) + '%');
        }

        if (porte) {
            sql += ` AND LOWER(porte) LIKE ?`;
            valores.push(porte.toLowerCase().charAt(0) + '%');
        }

        const [resultado] = await pool.query(sql, valores);

        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar animais" });
    }
});
//inserir
app.post('/inserirAnimal', autenticarToken, async (req, res) => {
    try {
        // 1. Tenta pegar o ID do token (req.usuario) 
        // 2. Se não existir, tenta pegar do corpo da requisição (req.body)
        const id_ong = (req.usuario && req.usuario.id) || req.body.id_ong;

        const { nome, especie, raca, porte, idade, sexo, descricao, status, imagem, ong, cidade, estado } = req.body;

        // Validação extra antes de enviar ao banco
        if (!id_ong) {
            return res.status(400).json({ erro: "O sistema não conseguiu identificar a ONG logada. Tente fazer login novamente." });
        }

        if (!nome) {
            return res.status(400).json({ erro: "O nome do animal é obrigatório." });
        }

        const sql = `INSERT INTO animais (id_ong, nome, especie, raca, porte, idade, sexo, descricao, status, imagem, ong, cidade, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

        const [resultado] = await pool.query(sql, [
            id_ong, nome, especie, raca, porte, idade, sexo, descricao, status,
            imagem || "", // Garante que não vá null se estiver vazio
            ong, cidade, estado
        ]);

        res.json({ resposta: "Animal cadastrado com sucesso!" });

    } catch (error) {
        console.error("ERRO NO BANCO:", error);
        res.status(500).json({
            erro: "Erro interno no banco de dados",
            detalhe: error.sqlMessage || error.message
        });
    }
});

// ROTA PARA EXCLUIR
app.delete('/excluirAnimal/:id', autenticarToken, async (req, res) => {
    try {
        const idAnimal = req.params.id;

        // TESTE DE SEGURANÇA: Vamos ver o que está chegando
        console.log("ID para excluir:", idAnimal);

        // SQL Simplificado para teste
        // IMPORTANTE: Verifique se no seu MySQL a coluna é 'id_animal' ou apenas 'id'
        const sql = "DELETE FROM animais WHERE id_animal = ?";

        const [resultado] = await pool.query(sql, [idAnimal]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: "Animal não encontrado no banco." });
        }

        res.json({ resposta: "Excluído com sucesso!" });

    } catch (error) {
        // ESSA LINHA É A MAIS IMPORTANTE AGORA:
        console.error("ERRO REAL DO MYSQL:", error.sqlMessage || error);

        res.status(500).json({
            erro: "Erro técnico no servidor",
            detalhe: error.sqlMessage || "Erro desconhecido"
        });
    }
});
// ROTA PARA ATUALIZAR O ANIMAL
app.put('/atualizarAnimal/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const { nome, especie, raca, porte, idade, sexo, descricao, status, imagem } = req.body;

    try {
        // 1. Verificamos se o animal existe
        const [animal] = await pool.query("SELECT * FROM animais WHERE id_animal = ?", [id]);
        if (animal.length === 0) return res.status(404).json({ erro: "Animal não encontrado." });

        // 2. Montamos o SQL dinamicamente
        // Se 'imagem' estiver vazia (string vazia ou null), não atualizamos esse campo no banco
        let sql = `UPDATE animais SET nome=?, especie=?, raca=?, porte=?, idade=?, sexo=?, descricao=?, status=?`;
        let params = [nome, especie, raca, porte, idade, sexo, descricao, status];

        if (imagem && imagem.trim() !== "") {
            sql += `, imagem = ? WHERE id_animal = ?`;
            params.push(imagem, id);
        } else {
            sql += ` WHERE id_animal = ?`;
            params.push(id);
        }

        const [resultado] = await pool.query(sql, params);

        if (resultado.affectedRows > 0) {
            res.json({ mensagem: "Atualizado com sucesso!" });
        } else {
            res.status(400).json({ erro: "Nenhuma alteração detectada." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar no banco." });
    }
});
// ================= ANIMAIS (LISTAGEM, FILTROS E DETALHES) =================
app.get("/animais", autenticarToken, async (req, res) => {
    try {
        const { id, especie, sexo, porte } = req.query;

// Se for busca por ID (detalhes)
        if (id) {
            const [dados] = await pool.query(
                `SELECT 
                    a.*,
                    o.nome AS ong_nome,
                    o.email AS ong_email,
                    o.telefone AS ong_telefone,
                    o.endereco AS ong_endereco,
                    o.cidade AS ong_cidade,
                    o.estado AS ong_estado,
                    o.pix AS ong_pix,
                    o.cnpj AS ong_cnpj,
                    o.trabalho_ofe AS ong_trabalho_ofe
                FROM animais a
                LEFT JOIN ong o ON a.id_ong = o.id_ong
                WHERE a.id_animal = ?`, [id]);

            if (dados.length === 0) {
                return res.status(404).json({ erro: "Animal não encontrado" });
            }

            return res.json(dados[0]);
        }

        // Base da query
        // Usamos WHERE 1=1 para facilitar a concatenação de ANDs
        let sql = "SELECT * FROM animais WHERE (LOWER(status) = 'disponivel' OR LOWER(status) = 'disponível')";
        let valores = [];

        // Filtro espécie
        if (especie) {
            sql += " AND LOWER(especie) = LOWER(?)";
            valores.push(especie);
        }

        // Filtro sexo
        if (sexo) {
            if (sexo.toLowerCase().includes("feme")) {
                // CORREÇÃO: Usamos parênteses para agrupar as duas opções de escrita
                // Isso garante que o banco procure por (femea OU fêmea) E que o status seja disponível
                sql += " AND (LOWER(sexo) = 'femea' OR LOWER(sexo) = 'fêmea')";
            } else {
                sql += " AND LOWER(sexo) = LOWER(?)";
                valores.push(sexo);
            }
        }

        // Filtro porte
        if (porte) {
            if (porte.toLowerCase().includes("medi")) {
                sql += " AND (LOWER(porte) LIKE 'medi%' OR LOWER(porte) LIKE 'méd %')";
            } else {
                sql += " AND LOWER(porte) = LOWER(?)";
                valores.push(porte);
            }
        }
        sql += " ORDER BY id_animal DESC";

        const [resultado] = await pool.query(sql, valores);
        res.json(resultado);

    } catch (error) {
        console.error("Erro na rota /animais:", error);
        res.status(500).json({ erro: "Erro no servidor" });
    }
});

// ================= GESTÃO DE ONGS (CORRIGIDO) =================

// 1. BUSCAR TODAS AS ONGS DO USUÁRIO (Para a listagem)
app.get('/minhas-ongs', autenticarToken, async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;

        const sql = `
            SELECT ong.id_ong, ong.nome, ong.cidade, ong.estado, ong.email, ong.cnpj
            FROM ong
            INNER JOIN usuario_ong ON ong.id_ong = usuario_ong.id_ong
            WHERE usuario_ong.id_usuario = ?`;

        const [ongs] = await pool.query(sql, [id_usuario]);
        res.json(ongs);
    } catch (error) {
        console.error("ERRO AO BUSCAR ONGS:", error);
        res.status(500).json({ erro: "Erro ao buscar instituições." });
    }
});

// 2. MOSTRAR DADOS DE UMA ONG ESPECÍFICA (Para preencher o formulário de edição)
app.get('/mostrarOng/:id', autenticarToken, async (req, res) => {
    const { id } = req.params; 
    try {
        // IMPORTANTE: Verifique se no seu banco a tabela é 'ong' ou 'ongs'
        const [rows] = await pool.execute('SELECT * FROM ong WHERE id_ong = ?', [id]);
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ erro: "ONG não encontrada no banco de dados." });
        }
    } catch (err) {
        console.error("Erro no Banco (GET /mostrarOng):", err.message);
        res.status(500).json({ erro: "Erro interno ao buscar dados da ONG." });
    }
});

// 3. ATUALIZAR DADOS DA ONG
app.put('/atualizarOng/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const { 
        nome, email, telefone, endereco, 
        cidade, estado, pix, trabalho_ofe 
    } = req.body;

    try {
        const sql = `
            UPDATE ong 
            SET nome = ?, email = ?, telefone = ?, endereco = ?, 
                cidade = ?, estado = ?, pix = ?, trabalho_ofe = ? 
            WHERE id_ong = ?
        `;
        
        const valores = [nome, email, telefone, endereco, cidade, estado, pix || null, trabalho_ofe || null, id];
        
        const [result] = await pool.execute(sql, valores);

        if (result.affectedRows > 0) {
            res.json({ mensagem: "ONG atualizada com sucesso!" });
        } else {
            res.status(404).json({ erro: "ONG não encontrada para atualizar." });
        }
    } catch (err) {
        console.error("Erro no Banco (PUT /atualizarOng):", err.message);
        res.status(500).json({ erro: "Erro ao atualizar os dados." });
    }
});

// 4. INSERIR NOVA ONG
app.post('/inserirOng', autenticarToken, async (req, res) => {
    try {
        const { nome, email, telefone, endereco, cidade, estado, pix, trabalho_ofe, cnpj } = req.body;
        const id_usuario = req.user.id_usuario;

        // 1. Insere na tabela principal
        const sqlOng = `INSERT INTO ong (nome, email, telefone, endereco, cnpj, cidade, estado, pix, trabalho_ofe) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [resultado] = await pool.query(sqlOng, [
            nome, email, telefone, endereco, cnpj, cidade, estado, pix || null, trabalho_ofe || null
        ]);

        const id_ong = resultado.insertId;

        // 2. Cria o vínculo na tabela intermediária
        await pool.query("INSERT INTO usuario_ong (id_usuario, id_ong) VALUES (?, ?)", [id_usuario, id_ong]);

        res.json({ resposta: "ONG cadastrada com sucesso!", id_ong });
    } catch (error) {
        console.error("ERRO AO INSERIR ONG:", error.message);
        res.status(500).json({ erro: "Erro ao salvar ONG no banco." });
    }
});

// 5. DELETAR ONG
app.delete('/deletarOng/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Se houver chave estrangeira configurada com ON DELETE CASCADE na usuario_ong, 
        // basta deletar da tabela ong. Caso contrário, delete da usuario_ong primeiro.
        await pool.execute('DELETE FROM usuario_ong WHERE id_ong = ?', [id]);
        const [result] = await pool.execute('DELETE FROM ong WHERE id_ong = ?', [id]);

        if (result.affectedRows > 0) {
            res.json({ mensagem: "ONG removida com sucesso!" });
        } else {
            res.status(404).json({ erro: "ONG não encontrada." });
        }
    } catch (err) {
        console.error("ERRO AO DELETAR:", err.message);
        res.status(500).json({ erro: "Erro ao excluir a instituição." });
    }
});


// ================= DICAS =========================================================================================================================================

app.get('/mostrarDicas', async (req, res) => {
    try {
        const [resultado] = await pool.query(`SELECT * FROM dicas ORDER BY id_dica DESC`);
        return res.json(resultado);
    } catch (error) {
        return res.status(500).json({ erro: "Erro no MySQL ao buscar", detalhe: error.message });
    }
});

app.post('/inserirDica', autenticarToken, async (req, res) => {
    try {
        const usuario = req.user || req.usuario;
        const id_usuario = usuario.id_usuario || usuario.id || null;

        if (!id_usuario) {
            return res.status(401).json({ erro: "ID do usuário não encontrado dentro do seu Token." });
        }

        const { titulo, categoria, qualPet, conteudo } = req.body;

        if (!titulo || !categoria || !qualPet || !conteudo) {
            return res.status(400).json({ erro: "Campos obrigatórios faltando no formulário." });
        }

        const sql = `INSERT INTO dicas (id_usuario, titulo, categoria, qualPet, conteudo) VALUES (?, ?, ?, ?, ?)`;

        const [resultado] = await pool.query(sql, [
            id_usuario, titulo, categoria, qualPet, conteudo
        ]);

        return res.json({ resposta: "Dica publicada com sucesso!" });

    } catch (error) {
        return res.status(500).json({ 
            erro: "O MySQL rejeitou a inserção", 
            mensagemBanco: error.message, 
            codigoBanco: error.code 
        });
    }
});

app.put('/atualizarDica', autenticarToken, async (req, res) => {
    try {
        const { id_dica, titulo, categoria, qualPet, conteudo } = req.body;
        const sql = `UPDATE dicas SET titulo = ?, categoria = ?, qualPet = ?, conteudo = ? WHERE id_dica = ?`;
        await pool.query(sql, [titulo, categoria, qualPet, conteudo, id_dica]);
        return res.json({ resposta: "Dica updated com sucesso!" });
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao atualizar", mensagemBanco: error.message });
    }
});

app.delete('/deletarDica', autenticarToken, async (req, res) => {
    try {
        const { id_dica } = req.body;
        await pool.query(`DELETE FROM dicas WHERE id_dica = ?`, [id_dica]);
        return res.json({ resposta: "Dica removida com sucesso!" });
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao deletar", mensagemBanco: error.message });
    }
});
// ================= NECESSIDADES =============================================================================================================================
//  MOSTRAR 
app.get('/mostrarNecessidades', async (req, res) => {
    try {
        const [resultado] = await pool.query(`
            SELECT n.*, a.nome AS animal 
            FROM necessidades n 
            JOIN animais a ON n.id_animal = a.id_animal
        `)

        res.json(resultado)

    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: "erro no servidor" })
    }
})


// INSERIR
app.post('/inserirNecessidade', autenticarToken, async (req, res) => {
    try {
        const { id_animal, nome, categoria, grau_importancia, descricao, botao } = req.body

        if (!id_animal || !nome) {
            return res.status(400).json({ erro: "Campos obrigatórios faltando" })
        }

        const sql = `INSERT INTO necessidades (id_animal, nome, categoria, grau_importancia, descricao, botao)VALUES (?, ?, ?, ?, ?, ?)`

        const [resultado] = await pool.query(sql, [
            id_animal, nome, categoria, grau_importancia, descricao, botao
        ])

        return res.json({
            resposta: resultado.affectedRows === 1
                ? "Necessidade cadastrada!"
                : "Erro ao cadastrar!"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ erro: "erro no servidor" })
    }
})


// ================= ATUALIZAR (PROTEGIDO) =================
app.put('/atualizarNecessidade', autenticarToken, async (req, res) => {
    try {
        const { id_necessidade, id_animal, nome, categoria, grau_importancia, descricao, botao } = req.body

        if (!id_necessidade) {
            return res.status(400).json({ erro: "id_necessidade é obrigatório" })
        }

        const sql = `UPDATE necessidades SET id_animal = ?, nome = ?, categoria = ?, grau_importancia = ?, descricao = ?, botao = ? WHERE id_necessidade = ?`

        const [resultado] = await pool.query(sql, [
            id_animal, nome, categoria, grau_importancia, descricao, botao, id_necessidade
        ])

        return res.json({
            resposta: resultado.affectedRows === 1
                ? "Atualizado com sucesso!"
                : "Erro ao atualizar!"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ erro: "erro no servidor" })
    }
})


// DELETAR 
app.delete('/deletarNecessidade', autenticarToken, async (req, res) => {
    try {
        const { id_necessidade } = req.body

        if (!id_necessidade) {
            return res.status(400).json({ erro: "id_necessidade é obrigatório" })
        }

        const [resultado] = await pool.query(`DELETE FROM necessidades WHERE id_necessidade = ?`, [id_necessidade])

        return res.json({
            resposta: resultado.affectedRows === 1
                ? "Deletado com sucesso!"
                : "Erro ao deletar!"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ erro: "erro no servidor" })
    }
})

// ================= EVENTOS (CORRIGIDO) ==================================================================================================================================
//  MOSTRAR TODOS
app.get('/mostrarEventos', async (req, res) => {
    try {

        const [resultado] = await pool.query(`
            SELECT
                e.*,
                o.nome AS ong,
                o.id_ong
            FROM eventos e
            JOIN ong o ON e.id_ong = o.id_ong
        `);

        res.json(resultado);

    } catch (error) {
        console.log(error);
        res.status(500).json({ erro: "erro no servidor" });
    }
});

// BUSCAR CAMPANHAS/EVENTOS PERTO DE MIM (FÓRMULA DE HAVERSINE)
app.get('/eventos-proximos', async (req, res) => {
    try {
        const { lat, lng, raio } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ erro: "Latitude (lat) e Longitude (lng) são obrigatórias para buscar perto de você." });
        }

        const raioMaximo = raio ? parseFloat(raio) : 50; 
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const sql = `
            SELECT e.*, o.nome AS ong,
                (6371 * ACOS(
                    COS(RADIANS(?)) * COS(RADIANS(e.latitude)) * COS(RADIANS(e.longitude) - RADIANS(?)) + 
                    SIN(RADIANS(?)) * SIN(RADIANS(e.latitude))
                )) AS distancia_km
            FROM eventos e
            JOIN ong o ON e.id_ong = o.id_ong
            HAVING distancia_km <= ?
            ORDER BY distancia_km ASC
        `;

        const [resultado] = await pool.query(sql, [userLat, userLng, userLat, raioMaximo]);
        res.json(resultado);

    } catch (error) {
        console.error("Erro ao buscar eventos próximos:", error);
        res.status(500).json({ erro: "Erro interno no servidor ao calcular proximidade." });
    }
});


// INSERIR EVENTO CORRIGIDO - BUSCA A ONG AUTOMATICAMENTE PELO USUÁRIO LOGADO
app.post('/inserirEvento', autenticarToken, async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario; // Pega o ID do usuário do Token verificado
        const { nome_evento, hora, data, endereco, categoria, localizacao, imagem, latitude, longitude } = req.body

        if (!nome_evento) {
            return res.status(400).json({ erro: "O nome do evento é obrigatório." })
        }

        // Descobre qual ONG pertence a este usuário logado
        const [ongs] = await pool.query("SELECT id_ong FROM usuario_ong WHERE id_usuario = ? LIMIT 1", [id_usuario]);
        
        if (ongs.length === 0) {
            return res.status(403).json({ erro: "Este perfil não possui nenhuma ONG cadastrada para criar eventos." });
        }

        const id_ong = ongs[0].id_ong; // Aqui está o ID correto da ONG!

        const sql = `INSERT INTO eventos (id_ong, nome_evento, hora, data, endereco, categoria, localizacao, imagem, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

        const [resultado] = await pool.query(sql, [
            id_ong, nome_evento, hora, data, endereco, categoria, localizacao, imagem || null, latitude || null, longitude || null
        ])

        return res.json({
            resposta: "Evento cadastrado com sucesso!"
        })

    } catch (error) {
        console.error("ERRO AO INSERIR EVENTO:", error);
        return res.status(500).json({ erro: "erro no servidor", detalhe: error.sqlMessage || error.message })
    }
})


app.put('/atualizarEvento', autenticarToken, async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;

        const {
            id_evento,
            nome_evento,
            hora,
            data,
            endereco,
            categoria,
            localizacao,
            imagem,
            latitude,
            longitude
        } = req.body;

        const [ongs] = await pool.query(
            "SELECT id_ong FROM usuario_ong WHERE id_usuario = ? LIMIT 1",
            [id_usuario]
        );

        if (ongs.length === 0) {
            return res.status(403).json({
                erro: "Você não possui ONG vinculada."
            });
        }

        const id_ong = ongs[0].id_ong;

        // VERIFICA SE O EVENTO É DA ONG LOGADA
        const [evento] = await pool.query(
            "SELECT id_ong FROM eventos WHERE id_evento = ?",
            [id_evento]
        );

        if (evento.length === 0) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }

        if (Number(evento[0].id_ong) !== Number(id_ong)) {
            return res.status(403).json({
                erro: "Você não tem permissão para editar este evento."
            });
        }

        await pool.query(`
            UPDATE eventos
            SET
                nome_evento = ?,
                hora = ?,
                data = ?,
                endereco = ?,
                categoria = ?,
                localizacao = ?,
                imagem = ?,
                latitude = ?,
                longitude = ?
            WHERE id_evento = ?
        `, [
            nome_evento,
            hora,
            data,
            endereco,
            categoria,
            localizacao,
            imagem,
            latitude,
            longitude,
            id_evento
        ]);

        return res.json({
            resposta: "Evento atualizado com sucesso!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro no servidor"
        });
    }
});


app.delete('/deletarEvento', autenticarToken, async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { id_evento } = req.body;

        const [ongs] = await pool.query(
            "SELECT id_ong FROM usuario_ong WHERE id_usuario = ? LIMIT 1",
            [id_usuario]
        );

        if (ongs.length === 0) {
            return res.status(403).json({
                erro: "Você não possui ONG vinculada."
            });
        }

        const id_ong = ongs[0].id_ong;

        const [evento] = await pool.query(
            "SELECT id_ong FROM eventos WHERE id_evento = ?",
            [id_evento]
        );

        if (evento.length === 0) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }

        if (Number(evento[0].id_ong) !== Number(id_ong)) {
            return res.status(403).json({
                erro: "Você não tem permissão para excluir este evento."
            });
        }

        await pool.query(
            "DELETE FROM eventos WHERE id_evento = ?",
            [id_evento]
        );

        return res.json({
            resposta: "Evento deletado com sucesso!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro no servidor"
        });
    }
});
// ================= CRUD HISTÓRIAS / HOMENAGENS =================
// 1. BUSCAR TODAS AS HISTÓRIAS (PÚBLICO)
app.get('/api/historias', async (req, res) => {
    try {
        const [linhas] = await pool.query("SELECT * FROM historias ORDER BY id DESC");
       
        const historiasFormatadas = linhas.map(h => ({
            _id: String(h.id),
            id: h.id,
            ong_id: h.ong_id,
            titulo: h.titulo,
            texto: h.texto,
            imagens: [ h.imagem1 || 'https://placehold.co/400x300?text=Sem+Foto' ]
        }));

        res.json(historiasFormatadas);
    } catch (error) {
        console.error("Erro ao buscar histórias:", error);
        res.status(500).json({ erro: "Erro no servidor ao buscar homenagens." });
    }
});

// 2. CRIAR HISTÓRIA (PROTEGIDO)
app.post('/api/historias', autenticarToken, async (req, res) => {
    try {
        const { titulo, texto, imagens } = req.body;
        const idOngLogada = req.user?.id_usuario || 1;

        if (!titulo || !texto) {
            return res.status(400).json({ erro: "Título e texto são obrigatórios." });
        }

        const imgUsuario = (imagens && imagens[0] && imagens[0].trim() !== "") ? imagens[0] : 'https://placehold.co/400x300?text=Sem+Foto';

        const sql = `INSERT INTO historias (titulo, texto, imagem1, ong_id) VALUES (?, ?, ?, ?)`;
        const [resultado] = await pool.query(sql, [titulo, texto, imgUsuario, idOngLogada]);

        res.status(201).json({
            _id: String(resultado.insertId),
            id: resultado.insertId,
            ong_id: idOngLogada,
            titulo,
            texto,
            imagens: [imgUsuario]
        });
    } catch (error) {
        console.error("Erro ao inserir história:", error);
        res.status(500).json({ erro: "Erro ao salvar a homenagem no banco de dados." });
    }
});

// 3. ATUALIZAR HISTÓRIA (PROTEGIDO E VALIDADO)
app.put('/api/historias/:id', autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, texto, imagens } = req.body;
        const idOngLogada = req.user.id_usuario;

        const [historias] = await pool.query("SELECT ong_id FROM historias WHERE id = ?", [id]);
        if (historias.length === 0) {
            return res.status(404).json({ erro: "História não encontrada." });
        }

        if (Number(historias[0].ong_id) !== Number(idOngLogada)) {
            return res.status(403).json({ erro: "Ação não permitida. Você não é o criador desta história." });
        }

        const imgUsuario = (imagens && imagens[0] && imagens[0].trim() !== "") ? imagens[0] : 'https://placehold.co/400x300?text=Sem+Foto';

        const sql = `UPDATE historias SET titulo = ?, texto = ?, imagem1 = ? WHERE id = ?`;
        await pool.query(sql, [titulo, texto, imgUsuario, id]);

        res.json({ _id: id, id, titulo, texto, imagens: [imgUsuario] });
    } catch (error) {
        console.error("Erro ao atualizar história:", error);
        res.status(500).json({ erro: "Erro ao atualizar história no servidor." });
    }
});

// 4. DELETAR HISTÓRIA (PROTEGIDO E VALIDADO)
app.delete('/api/historias/:id', autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const idOngLogada = req.user.id_usuario;

        const [historias] = await pool.query("SELECT ong_id FROM historias WHERE id = ?", [id]);
        if (historias.length === 0) {
            return res.status(404).json({ erro: "História não encontrada." });
        }

        if (Number(historias[0].ong_id) !== Number(idOngLogada)) {
            return res.status(403).json({ erro: "Ação não permitida. Você não é o criador desta história." });
        }

        await pool.query("DELETE FROM historias WHERE id = ?", [id]);
        res.json({ resposta: "História deletada com sucesso!", id: id });
    } catch (error) {
        console.error("Erro ao deletar história:", error);
        res.status(500).json({ erro: "Erro interno ao deletar a história." });
    }
});