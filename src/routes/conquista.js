import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'

const router = express.Router()
const nomeCollection = 'conquista'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaConquista = [
    check('titulo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o título da conquista')
        .isLength({ min: 2, max: 40 }).withMessage('O tamanho do título informado é inválido, deve ser entre 2 e 40 caracteres'),
    check('descricao')
        .not().isEmpty().trim().withMessage('É obrigatório informar a descrição da conquista')
        .isLength({ min: 2, max: 100 }).withMessage('O tamanho da descrição informada é inválida, deve ser entre 2 e 100 caracteres')
]

const validaConquistaPerfil = [
    check('perfil_id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id do perfil')
        .custom(async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
                return Promise.reject('O id do perfil informado está incorreto')
            }
        }),
    check('conquista_id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id da conquista')
        .custom(async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
                return Promise.reject('O id da conquista informado está incorreto')
            }
        })
]

//GET conquista/
router.get("/", async (req, res) => {
    /*
        #swagger.tags = ['Conquista']
        #swagger.description = 'Endpoint para obter todas as conquistas' 
    */

    try {
        db.collection(nomeCollection).find().toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Conquista" },
                        description: "Retorno de todas as conquistas" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todas as conquistas" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todas as conquistas"
        })
    }
})

//GET conquista/id/:id
router.get("/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Conquista']
        #swagger.description = 'Endpoint para obter a conquista usando o ID' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID da Conquista',
            type: 'string',
            required: true,
            example: '635ee052b55a97c089642009'
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
                        schema: { "$ref": "#/definitions/Conquista" },
                        description: "Consulta da conquista obtida através do ID da conquista" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter a conquista filtrando pelo ID" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter a conquista pelo ID"
        })
    }
})

// POST conquista/
router.post('/', validaConquista, async (req, res) => {
    /*  
        #swagger.tags = ['Conquista']
        #swagger.description = 'Endpoint para cadastrar uma nova conquista' 
    */
    /*
        #swagger.parameters['Conquista'] = {
            in: 'body',
            description: 'Informações da conquista.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Conquista" }
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

    await db.collection(nomeCollection)
        .insertOne(req.body)
        // #swagger.responses[201] = { description: 'Conquista registrada com sucesso' }
        .then(result => res.status(201).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

// POST conquista/perfil
router.post('/perfil/', validaConquistaPerfil, async (req, res) => {
    /*  
        #swagger.tags = ['Conquista']
        #swagger.description = 'Endpoint para cadastrar uma nova conquista no perfil do usuario' 
    */
    /*
        #swagger.parameters['Conquista'] = {
            in: 'body',
            description: 'Informações da conquista.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Conquista" }
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
    const conquista_id = req.body.conquista_id
    const data_conquista = new Date(Date.now())

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

    const conquistaConsultada = await db.collection('conquista').find({ "_id": { $eq: ObjectId(conquista_id) } }).toArray()
    if (!conquistaConsultada.length) {
        /*
            #swagger.responses[404] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "A conquista informada não existe" 
            } 
        */
        return res.status(404).json({
            error: "A conquista informada não existe"
        })
    }

    if (perfil[0].conquistas && perfil[0].conquistas.some(conquista => conquista.id == conquista_id)) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Conquista já existente nesse perfil" 
            } 
        */
        return res.status(500).json({
            error: "Conquista já existente nesse perfil"
        })
    }

    const conquista = { id: conquista_id, titulo: conquistaConsultada[0].titulo, descricao: conquistaConsultada[0].descricao, data_conquista: data_conquista }

    await db.collection('perfil')
        .updateOne({ '_id': { $eq: ObjectId(perfil_id) } },
            {
                $push: { conquistas: conquista }
            }
        )
        // #swagger.responses[201] = { description: 'Conquista registrada para o perfil com sucesso' }
        .then(result => res.status(201).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

// PUT conquista/:id
router.put('/:id', validaConquista, async (req, res) => {
    /*  
        #swagger.tags = ['Conquista']
        #swagger.description = 'Endpoint para alterar informações da conquista' 
    */
    /*
        #swagger.parameters['Conquista'] = {
            in: 'path',
            description: 'Informações da conquista.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Conquista" }
        } 
    */
    const idConquista = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idConquista)) {
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

    const conquista = await db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(idConquista) } }).toArray()
    if (!conquista.length) {
        /*
            #swagger.responses[404] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "A conquista informada não existe" 
            } 
        */
        return res.status(404).json({
            error: "Não foi localizado nenhuma conquista com esse ID"
        })
    }

    await db.collection(nomeCollection)
        .updateOne({ '_id': { $eq: ObjectId(req.params.id) } },
            { $set: req.body }
        )
        // #swagger.responses[201] = { description: 'Conquista alterada com sucesso' }
        .then(result => res.status(201).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))

})

// DELETE conquista/:id
router.delete('/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Conquista']
        #swagger.description = 'Endpoint para deletar uma conquista pelo ID'    
    */
    /*
        #swagger.parameters['Conquista'] = {
            in: 'path',
            description: 'ID da conquista',
            type: 'string',
            required: true,
            example: '635ee052b55a97c089642009'
        } 
    */
    const idConquista = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idConquista)) {
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

    const conquista = await db.collection(nomeCollection).find({
        "_id": { $eq: ObjectId(idConquista) }
    }).limit(1).toArray()

    if (!conquista.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhuma conquista com esse ID"
        })
    }

    await db.collection(nomeCollection)
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        // #swagger.responses[202] = { description: 'Conquista deletada' }
        .then(result => res.status(202).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

export default router