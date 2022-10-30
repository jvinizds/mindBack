import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'

const router = express.Router()
const nomeCollection = 'plano'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaPlano = [
    check('nome')
        .not().isEmpty().trim().withMessage('É obrigatório informar o título do plano')
        .isLength({ min: 2, max: 40 }).withMessage('O tamanho do título informado é inválido, deve ser entre 2 e 40 caracteres'),
    check('descricao')
        .not().isEmpty().trim().withMessage('É obrigatório informar a descrição do plano')
        .isLength({ min: 2, max: 100 }).withMessage('O tamanho da descrição informada é inválida, deve ser entre 2 e 100 caracteres'),
    check('tipo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do plano')
        .isIn(['Gratuito', 'Pago']).withMessage('Dever ser Gratuito ou Pago'),
    check('valor')
        .not().isEmpty().trim().withMessage('É obrigatório informar o valor do plano')
        .isFloat({ min: 0, max: 100 }).withMessage('O valor do plano deve conter numeros e estar entre 0 e 100'),
]

//GET plano/
router.get("/", async (req, res) => {
    /*
        #swagger.tags = ['Plano']
        #swagger.description = 'Endpoint para obter todo o planos' 
    */

    try {
        db.collection(nomeCollection).find().toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Plano" },
                        description: "Retorno de todos o planos" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todos o planos" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todos o planos"
        })
    }
})

//GET plano/id/:id
router.get("/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Plano']
        #swagger.description = 'Endpoint para obter o plano usando o ID' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID do Plano',
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
                        schema: { "$ref": "#/definitions/Plano" },
                        description: "Consulta dos planos obtido através do ID do plano" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o plano filtrando pelo ID" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o plano pelo ID"
        })
    }
})

// POST plano/
router.post('/', validaPlano, async (req, res) => {
    /*  
        #swagger.tags = ['Plano']
        #swagger.description = 'Endpoint para cadastrar um novo plano' 
    */
    /*
        #swagger.parameters['Plano'] = {
            in: 'body',
            description: 'Informações do plano.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Plano" }
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

    req.body.valor = Number(req.body.valor)

    await db.collection(nomeCollection)
        .insertOne(req.body)
        // #swagger.responses[201] = { description: 'Plano registrado com sucesso' }
        .then(result => res.status(201).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

// PUT plano/:id
router.put('/:id', validaPlano, async (req, res) => {
    /*  
        #swagger.tags = ['Plano']
        #swagger.description = 'Endpoint para alterar informações do plano' 
    */
    /*
        #swagger.parameters['Plano'] = {
            in: 'path',
            description: 'Informações do plano.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Plano" }
        } 
    */
    const idPlano = req.params.id
    delete req.body.id

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

    req.body.valor = Number(req.body.valor)

    const plano = await db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(idPlano) } }).toArray()
    if (!plano.length) {
        /*
            #swagger.responses[404] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "O plano informado não existe" 
            } 
        */
        return res.status(404).json({
            error: "Não foi localizado nenhum plano com esse ID"
        })
    }

    await db.collection(nomeCollection)
        .updateOne({ '_id': { $eq: ObjectId(req.params.id) } },
            { $set: req.body }
        )
        // #swagger.responses[201] = { description: 'Plano alterado com sucesso' }
        .then(result => res.status(201).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))

})

// DELETE plano/:id
router.delete('/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Plano']
        #swagger.description = 'Endpoint para deletar um plano pelo ID'    
    */
    /*
        #swagger.parameters['Plano'] = {
            in: 'path',
            description: 'ID do plano',
            type: 'string',
            required: true,
            example: '635ee052b55a97c089642009'
        } 
    */
    const idPlano = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idPlano)) {
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

    const plano = await db.collection(nomeCollection).find({
        "_id": { $eq: ObjectId(idPlano) }
    }).limit(1).toArray()

    if (!plano.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhum plano com esse ID"
        })
    }

    await db.collection(nomeCollection)
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        // #swagger.responses[202] = { description: 'Plano deletado' }
        .then(result => res.status(202).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

export default router