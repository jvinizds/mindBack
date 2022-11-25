import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'
import multer from 'multer'
import { multerConfig, arquivoDelete } from "../middleware/uploadArquivos.js"

const router = express.Router()
const nomeCollection = 'conteudo'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaConteudo = [
    check('titulo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o título do conteúdo')
        .isAlpha('pt-BR', { ignore: ' ' }).withMessage('O título do conteúdo deve conter apenas texto')
        .isLength({ min: 2, max: 40 }).withMessage('O tamanho do título informado é inválido, deve ser entre 2 e 40 caracteres'),
    check('descricao')
        .not().isEmpty().trim().withMessage('É obrigatório informar a descrição do conteúdo')
        .isLength({ min: 2, max: 100 }).withMessage('O tamanho da descrição informada é inválida, deve ser entre 2 e 100 caracteres'),
    check('tipo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do conteúdo')
        .isIn(['Artigo', 'Audio', 'Video']).withMessage('Dever ser Artigo, Audio ou Video'),
    check('categoria')
        .not().isEmpty().trim().withMessage('É obrigatório informar a categoria do conteúdo')
        .isIn(['Ansiedade', 'Ioga', 'Meditação']).withMessage('Dever ser Ansiedade, Ioga ou Meditação')
]

//GET conteudo/
router.get("/", async (req, res) => {
    /*
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para obter todos os conteudos' 
    */

    try {
        db.collection(nomeCollection).find().toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Conteudo" },
                        description: "Retorno de todos os conteudos obtidos" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todos os conteudos" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todos os conteudos"
        })
    }
})

//GET conteudo/id/:id
router.get("/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para obter um conteudo atraves do ID' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID do conteudo',
            type: 'string',
            required: true,
            example: '6345fe7a1bc5d4d93469b34c'
        } 
    */
    if(!ObjectId.isValid(req.params.id)) {
        /*
            #swagger.responses[403] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "ID enviado está incorreto" 
            } 
        */
        return res.status(403).json({
            error: "ID enviado está incorreto"
        })
    } 

    try {
        db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } })
            .limit(1).toArray((err, docs) => {
                if (!err) {
                    /* 
                        #swagger.responses[200] = { 
                            schema: { "$ref": "#/definitions/Conteudo" },
                            description: "Retorno do conteudo obtido através do ID" 
                        } 
                    */
                    res.status(200).json(docs)
                }
            })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o conteudo filtrando pelo ID" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o conteudo pelo ID"
        })
    }
})

//GET conteudo/tipo/:filtro
router.get("/tipo/:filtro", async (req, res) => {
    /*
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para obter todos os conteudos que sejam do tipo informardo' 
    */
    /*
         #swagger.parameters['filtro'] = {
             in: 'path',
             description: 'Tipo do conteudo',
             type: 'string',
             required: true,
             example: 'Video'
         } 
     */
    try {
        db.collection(nomeCollection).find({ tipo: { $regex: req.params.filtro, $options: 'i' } })
            .limit(10).sort({ titulo: 1 }).toArray((err, docs) => {
                if (!err) {
                    /* 
                        #swagger.responses[200] = { 
                            schema: { "$ref": "#/definitions/Conteudo" },
                            description: "Retorno de todos os conteudo obtidos que são do tipo informado" 
                        } 
                    */
                    res.status(200).json(docs)
                }
            })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todos os conteudos que são do tipo informado" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todos os conteudos que são do tipo informado"
        })
    }
})

//GET conteudo/categoria/:filtro
router.get("/categoria/:filtro", async (req, res) => {
    /*
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para obter todos os conteudos que sejam da categoria informarda' 
    */
    /*
         #swagger.parameters['filtro'] = {
             in: 'path',
             description: 'Categoria do conteudo',
             type: 'string',
             required: true,
             example: 'Ansiedade'
         } 
     */
    try {
        db.collection(nomeCollection).find({ tipo: { $regex: req.params.filtro, $options: 'i' } })
            .limit(10).sort({ titulo: 1 }).toArray((err, docs) => {
                if (!err) {
                    /* 
                        #swagger.responses[200] = { 
                            schema: { "$ref": "#/definitions/Conteudo" },
                            description: "Retorno de todos os conteudo obtidos que são da categoria informada" 
                        } 
                    */
                    res.status(200).json(docs)
                }
            })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todos os conteudos que são da categoria informada" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todos os conteudos que são da categoria informada"
        })
    }
})

//GET conteudo/titulo/:filtro
router.get("/titulo/:filtro", async (req, res) => {
    /*
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para obter os conteudos consultando por meio de parte do titulo ou descrição' 
    */
    /*
        #swagger.parameters['filtro'] = {
            in: 'path',
            description: 'Titulo do conteudo',
            type: 'string',
            required: true,
            example: 'ansiedade'
        } 
    */
    try {
        db.collection(nomeCollection).find({
            $or:
                [
                    { titulo: { $regex: req.params.filtro, $options: 'i' } },
                    { descricao: { $regex: req.params.filtro, $options: 'i' } }
                ]
        }).limit(10).sort({ titulo: 1 }).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Conteudo" },
                        description: "Retorno dos conteudos obtidos através de parte do titulo ou descrição" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter conteudos filtrando pelo titulo informado" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter conteudos filtrando pelo titulo informado"
        })
    }
})

// POST conteudo/
router.post('/', validaConteudo, async (req, res) => {
    /*  
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para cadastrar um novo conteudo' 
    */
    /*
        #swagger.parameters['Conteudo'] = {
            in: 'body',
            description: 'Informações do conteudo.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Conteudo" }
        } 
    */
    const upload = multer(multerConfig("conteudo")).single("arquivo")
    await upload(req, res, async function (err) {
        if (err) {
            /*
                #swagger.responses[500] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Erro ao adicionar o conteudo" 
                } 
            */
            return res.status(500).json({
                error: err.message
            })
        }

        const arquivo = req.file
        if (!arquivo) {
            /*
                #swagger.responses[403] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Arquivo não enviado no request" 
                } 
            */
            return res.status(403).json({
                error: "Arquivo não enviado no request"
            })
        }

        const schemaErrors = validationResult(req.body)
        if (!schemaErrors.isEmpty()) {
            try {
                arquivoDelete(arquivo.key)
            } catch (err) {
                /*
                    #swagger.responses[500] = { 
                        schema: { "$ref": "#/definitions/Erro" },
                        description: "Validação dos parametros enviados falhou, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu" 
                    } 
                */
                return res.status(500).json({
                    error: "Validação dos parametros enviados falhou, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu"
                })
            }
            /*
                #swagger.responses[403] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Validação dos parametros enviados falhou" 
                } 
            */
            return res.status(403).json({
                error: schemaErrors.array()[0].msg
            })
        }

        const { titulo, descricao, tipo, categoria } = { titulo: req.body.titulo, descricao: req.body.descricao, tipo: req.body.tipo, categoria: req.body.categoria }

        const { originalname: nome, key: key, mimetype: extensao, size: tamanho, location: url = "" } = arquivo
        const dados_arquivo = {
            nome,
            key,
            extensao,
            tamanho,
            url
        }

        const conteudo = { titulo, descricao, tipo, categoria, dados_arquivo }

        await db.collection(nomeCollection)
            .insertOne(conteudo)
            // #swagger.responses[201] = { description: 'Conteudo registrado com sucesso' }
            .then(result => res.status(202).send(result))
            .catch(err => {
                try {
                    arquivoDelete(dados_arquivo.key)
                } catch (err) {
                    /*
                        #swagger.responses[500] = { 
                            schema: { "$ref": "#/definitions/Erro" },
                            description: "Conteudo com titulo ou key do arquivo já existente, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu" 
                        } 
                    */
                    return res.status(500).json({
                        error: "Erro ao subir documento no banco, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu"
                    })
                }
                /*
                    #swagger.responses[400] = { 
                        schema: { "$ref": "#/definitions/Erro" },
                        description: "Bad Request" 
                    } 
                */
                return res.status(400).json({ error: error_handler(err.code) })
            })
    })
})

// PUT conteudo/:id
router.put('/:id', validaConteudo, async (req, res) => {
    /*  
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para alter informações do conteudo' 
    */
    /*
        #swagger.parameters['Conteudo'] = {
            in: 'body',
            description: 'Informações do conteudo.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Conteudo" }
        } 
    */
    const idConteudo = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idConteudo)) {
        /*
            #swagger.responses[403] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "ID enviado está incorreto" 
            } 
        */
        return res.status(403).json({
            error: "ID enviado está incorreto"
        })
    }

    const conteudoExistente = await db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } }).limit(1).toArray()

    if (!conteudoExistente.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhum conteudo com esse ID"
        })
    }

    const upload = multer(multerConfig("conteudo")).single("arquivo")
    await upload(req, res, async function (err) {
        if (err) {
            /*
                #swagger.responses[500] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Erro ao tentar alterar o conteudo" 
                } 
            */
            return res.status(500).json({
                error: err.message
            })
        }

        const arquivo = req.file
        if (!arquivo) {
            /*
                #swagger.responses[403] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Arquivo não enviado no request" 
                } 
            */
            return res.status(403).json({
                error: "Arquivo não enviado no request"
            })
        }
        const schemaErrors = validationResult(req.body)
        if (!schemaErrors.isEmpty()) {
            try {
                arquivoDelete(arquivo.key)
            } catch (err) {
                /*
                    #swagger.responses[500] = { 
                        schema: { "$ref": "#/definitions/Erro" },
                        description: "Validação dos parametros enviados falhou, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu" 
                    } 
                */
                return res.status(500).json({
                    error: "Validação dos parametros enviados falhou, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu"
                })
            }
            /*
                #swagger.responses[403] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Validação dos parametros enviados falhou" 
                } 
            */
            return res.status(403).json({
                error: schemaErrors.array()[0].msg
            })
        }

        const { titulo, descricao, tipo, categoria } = { titulo: req.body.titulo, descricao: req.body.descricao, tipo: req.body.tipo, categoria: req.body.categoria }

        const { originalname: nome, key: key, mimetype: extensao, size: tamanho, location: url = "" } = arquivo
        const dados_arquivo = {
            nome,
            key,
            extensao,
            tamanho,
            url
        }

        const conteudo = { titulo, descricao, tipo, categoria, dados_arquivo }

        await db.collection(nomeCollection)
            .updateOne({ '_id': { $eq: ObjectId(idConteudo) } },
                { $set: conteudo }
            )
            // #swagger.responses[202] = { description: 'Conteudo alterado com sucesso' }
            .then(result => {
                try {
                    arquivoDelete(conteudoExistente[0].dados_arquivo.key)
                } catch (err) {
                    /*
                        #swagger.responses[500] = { 
                            schema: { "$ref": "#/definitions/Erro" },
                            description: "Erro ao deletar o conteudo do sistema" 
                        } 
                    */
                    return res.status(500).json({
                        error: "Erro ao deletar o conteudo anterior do sistema"
                    })
                }
                res.status(202).send(result)
            })
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => {
                try {
                    arquivoDelete(dados_arquivo.key)
                } catch (err) {
                    /*
                        #swagger.responses[500] = { 
                            schema: { "$ref": "#/definitions/Erro" },
                            description: "Erro ao deletar o conteudo do sistema" 
                        } 
                    */
                    return res.status(500).json({
                        error: "Conteudo com titulo ou key do arquivo já existente, no entanto houve um erro ao excluir do armazenamento o arquivo que subiu"
                    })
                }
                /*
                    #swagger.responses[400] = { 
                        schema: { "$ref": "#/definitions/Erro" },
                        description: "Bad Request" 
                    } 
                */
                return res.status(400).json({ error: error_handler(err.code) })
            })
    })
})

// DELETE conteudo/:id
router.delete('/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Conteudo']
        #swagger.description = 'Endpoint para deletar um conteudo pelo ID'    
    */
    /*
        #swagger.parameters['Conteudo'] = {
            in: 'path',
            description: 'ID do conteudo',
            type: 'string',
            required: true,
            example: '6352df85cd1b22e88e0b87f0'
        } 
    */
    const idConteudo = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idConteudo)) {
        /*
            #swagger.responses[403] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "ID enviado está incorreto" 
            } 
        */
        return res.status(403).json({
            error: "ID enviado está incorreto"
        })
    }

    const conteudo = await db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(idConteudo) } }).limit(1).toArray()

    if (!conteudo.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhum conteudo com esse ID"
        })
    }

    if (conteudo[0].dados_arquivo.key) {
        try {
            arquivoDelete(conteudo[0].dados_arquivo.key)
        } catch (err) {
            /*
                #swagger.responses[500] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Erro ao deletar o conteudo do sistema" 
                } 
            */
            return res.status(500).json({
                error: "Erro ao deletar o conteudo do sistema"
            })
        }
    }

    await db.collection(nomeCollection)
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        // #swagger.responses[202] = { description: 'Conteudo deletado' }
        .then(result => res.status(202).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

export default router