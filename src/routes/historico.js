import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'

const router = express.Router()
const nomeCollection = 'historico'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaHistorico = [
    check('perfil_id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id do perfil')
        .custom(async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
                return Promise.reject('O id do perfil informado está incorreto')
            }
        }),
    check('conteudo_id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id do conteudo')
        .custom(async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
                return Promise.reject('O id do conteudo informado está incorreto')
            }
        })
]

//GET historico/
router.get("/", async (req, res) => {
    /*
        #swagger.tags = ['Historico']
        #swagger.description = 'Endpoint para obter todo o historico' 
    */

    try {
        db.collection(nomeCollection).find().toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Historico" },
                        description: "Retorno de todos o historico" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todos o historico" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todos o historico"
        })
    }
})

//GET historico/id/:id
router.get("/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Historico']
        #swagger.description = 'Endpoint para obter o historico usando o ID' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID do Historico',
            type: 'string',
            required: true,
            example: '6355842f6cfab022c939e21d'
        } 
    */
    if (!ObjectId.isValid(req.params.id)) {
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
        db.collection(nomeCollection).find({
            "_id": { $eq: ObjectId(req.params.id) }
        }).limit(1).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Historico" },
                        description: "Consulta dos historicos obtido através do ID do perfil" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o historico filtrando pelo ID" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o historico pelo ID"
        })
    }
})

//GET historico/perfil/id/:id
router.get("/perfil/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Historico']
        #swagger.description = 'Endpoint para obter todos os historicos usando o ID do perfil' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID do perfil',
            type: 'string',
            required: true,
            example: '6356ad635deae9ab35e2d925'
        } 
    */
    if (!ObjectId.isValid(req.params.id)) {
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
        db.collection(nomeCollection).find({
            "perfil_id": { $eq: ObjectId(req.params.id) }
        }).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Historico" },
                        description: "Consulta dos historicos obtido através do ID do perfil" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter os historicos filtrando pelo ID do perfil" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter os historicos filtrando pelo ID do perfil"
        })
    }
})

//GET historico/conteudo/id/:id
router.get("/conteudo/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Historico']
        #swagger.description = 'Endpoint para obter todos os historicos usando o ID do conteudo' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID do conteudo',
            type: 'string',
            required: true,
            example: '6355842f6cfab022c939e21d'
        } 
    */
    if (!ObjectId.isValid(req.params.id)) {
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
        db.collection(nomeCollection).find({
            "conteudo_id": { $eq: ObjectId(req.params.id) }
        }).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Historico" },
                        description: "Consulta dos historicos obtido através do ID do conteudo" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter os historicos filtrando pelo ID do conteudo" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter os historicos filtrando pelo ID do conteudo"
        })
    }
})

// POST historico/
router.post('/', validaHistorico, async (req, res) => {
    /*  
        #swagger.tags = ['Historico']
        #swagger.description = 'Endpoint para cadastrar um novo historico' 
    */
    /*
        #swagger.parameters['Historico'] = {
            in: 'body',
            description: 'Informações do historico.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Historico" }
        } 
    */
    const schemaErrors = validationResult(req)
    if (!schemaErrors.isEmpty()) {
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

    const perfil_id = req.body.perfil_id
    const conteudo_id = req.body.conteudo_id
    const data_historico = new Date(Date.now())

    const perfil = await db.collection('perfil').find({ "_id": { $eq: ObjectId(perfil_id) } }).toArray()
    if (!perfil.length) {
        /*
            #swagger.responses[404] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "O perfil informado não existe" 
            } 
        */
        return res.status(404).json({
            error: "O perfil informado não existe"
        })
    }

    const conteudo = await db.collection('conteudo').find({ "_id": { $eq: ObjectId(conteudo_id) } }).toArray()
    if (!conteudo.length) {
        /*
            #swagger.responses[404] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "O conteudo informado não existe" 
            } 
        */
        return res.status(404).json({
            error: "O conteudo informado não existe"
        })
    }

    const historico = { perfil_id: perfil_id, conteudo_id: conteudo_id, data_historico: data_historico }

    const progresso = { artigo: perfil[0].progresso.artigo, audio: perfil[0].progresso.audio, video: perfil[0].progresso.video }

    switch (conteudo[0].tipo) {
        case "Artigo":
            progresso.artigo++
            break;
        case "Audio":
            progresso.audio++
            break;
        case "Video":
            progresso.video++
            break;
    }

    const conteudo_recente = { conteudo_id: conteudo_id, titulo: conteudo[0].titulo, descricao: conteudo[0].descricao, tipo: conteudo[0].tipo, categoria: conteudo[0].categoria, url: conteudo[0].dados_arquivo.url, data_historico: data_historico }

    if (perfil[0].conteudo_recente && perfil[0].conteudo_recente.some(conteudo => conteudo.conteudo_id == conteudo_id)) {
        try {
            await db.collection("perfil")
                .updateOne({ '_id': { $eq: ObjectId(perfil_id) } },
                    {
                        $pull: { "conteudo_recente": { conteudo_id: conteudo_id } }
                    }
                )
        }
        catch (err) {
            /* 
                #swagger.responses[500] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Erro ao incluir novo conteudo recente, visto que não foi possivel excluir outro conteudo que já existia" 
                } 
            */
            res.status(500).json({
                error: "Erro ao incluir novo conteudo recente, visto que não foi possivel excluir outro conteudo que já existia"
            })
        }
    }

    if (perfil[0].conteudo_recente && perfil[0].conteudo_recente.length == 20) {
        try {
            await db.collection("perfil")
                .updateOne({ '_id': { $eq: ObjectId(perfil_id) } },
                    {
                        $pull: { "conteudo_recente": { conteudo_id: perfil[0].conteudo_recente[0].conteudo_id } }
                    }
                )
        }
        catch (err) {
            /* 
                #swagger.responses[500] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Erro ao incluir novo conteudo recente, visto que não foi possivel excluir outro conteudo que já existia" 
                } 
            */
            res.status(500).json({
                error: "Erro ao incluir novo conteudo recente, visto que não foi possivel excluir outro conteudo que já existia"
            })
        }
    }

    await db.collection(nomeCollection)
        .insertOne(historico)
        .then(async (result) => {
            await db.collection("perfil")
                .updateOne({ '_id': { $eq: ObjectId(perfil_id) } },
                    {
                        $set: { progresso: progresso },
                        $push: { conteudo_recente: conteudo_recente }
                    }
                )
                // #swagger.responses[201] = { description: 'Historico registrado com sucesso' }
                .then(() => {
                    res.status(201).send(result)
                })
                // #swagger.responses[400] = { description: 'Bad Request' }     
                .catch(err => res.status(400).json({ error: err }))
        })
        .catch(err => {
            /*
                #swagger.responses[400] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Bad Request" 
                } 
            */
            return res.status(400).json({ error: error_handler(err.code) })
        })
})

// DELETE historico/:id
router.delete('/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Historico']
        #swagger.description = 'Endpoint para deletar um historico pelo ID'    
    */
    /*
        #swagger.parameters['Historico'] = {
            in: 'path',
            description: 'ID do historico',
            type: 'string',
            required: true,
            example: '6356e4e117de6e42ea2f59dc'
        } 
    */
    const idHistorico = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idHistorico)) {
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

    const historico = await db.collection(nomeCollection).find({
        "_id": { $eq: ObjectId(idHistorico) }
    }).limit(1).toArray()

    if (!historico.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhum historico com esse ID"
        })
    }

    await db.collection(nomeCollection)
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        // #swagger.responses[202] = { description: 'Historico deletado' }
        .then(result => res.status(202).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

export default router