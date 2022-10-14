import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { multerConfig } from "../middleware/multer.js"

const router = express.Router()
const nomeCollection = 'conteudo'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaConteudo = [
    check('tipo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do conteúdo')
        .isIn(['Artigo', 'Audio', 'Video']).withMessage('Dever ser Artigo, Audio ou Video'),
    check('categoria')
        .not().isEmpty().trim().withMessage('É obrigatório informar a categoria do conteúdo')
        .isIn(['Ansiedade', 'Ioga', 'Meditação']).withMessage('Dever ser Ansiedade, Ioga ou Meditação'),
    check('titulo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o título do conteúdo')
        .isAlpha('pt-BR', { ignore: ' ' }).withMessage('O título do conteúdo deve conter apenas texto')
        .isLength({ min: 2, max: 40 }).withMessage('O tamanho do título informado é inválido, deve ser entre 2 e 40 caracteres'),
    check('descricao')
        .not().isEmpty().trim().withMessage('É obrigatório informar a descrição do conteúdo')
        .isLength({ min: 2, max: 100 }).withMessage('O tamanho da descrição informada é inválida, deve ser entre 2 e 100 caracteres'),
    check('url')
        .not().isEmpty().trim().withMessage('É obrigatório informar a URL do conteúdo')
        .isURL().withMessage('Deve ser uma URL válida')
]

//GET conteudo/
router.get("/", async (req, res) => {
    /*
        #swagger.tags = ['conteudo']
        #swagger.description = 'Endpoint para obter todos os conteudos' 
    */

    try {
        db.collection(nomeCollection).find().toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Conteudo" },
                        description: "Consulta todos os conteudos" 
                    } 
                */
                console.log(docs)
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
        #swagger.tags = ['conteudo']
        #swagger.description = 'Endpoint para obter o conteudo usando o id' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Id do conteudo',
            type: 'string',
            required: true,
            example: '6345fe7a1bc5d4d93469b34c'
        } 
    */
    try {
        db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } })
            .limit(1).toArray((err, docs) => {
                if (!err) {
                    /* 
                        #swagger.responses[200] = { 
                            schema: { "$ref": "#/definitions/Conteudo" },
                            description: "Retorno do conteudo obtido através do id" 
                        } 
                    */
                    res.status(200).json(docs)
                }
            })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o conteudo filtrando pelo id" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o conteudo pelo id"
        })
    }
})

//GET conteudo/titulo/:filtro
router.get("/titulo/:filtro", async (req, res) => {
    /*
        #swagger.tags = ['conteudo']
        #swagger.description = 'Endpoint para obter o conteudo consultando por meio de parte do titulo ou descrição' 
    */
    /*
        #swagger.parameters['filtro'] = {
            in: 'path',
            description: 'Texto do conteudo',
            type: 'string',
            required: true,
            example: 'ansieddade'
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
                        description: "Retonro do conteudo obtido através de parte do titulo ou descrição" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o conteudo filtrando pelo texto informado" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o conteudo pelo texto informado"
        })
    }
})

// POST conteudo/
router.post('/', validaConteudo, async (req, res) => {
    /*  
        #swagger.tags = ['conteudo']
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
    } else {
        await db.collection(nomeCollection)
            .insertOne(req.body)
            // #swagger.responses[201] = { description: 'Conteudo registrado com sucesso' }
            .then(result => res.status(201).send(result))
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => res.status(400).json({ error: error_handler(err.code) }))
    }
})

// PUT conteudo/:id
router.put('/:id', validaConteudo, async (req, res) => {
    /*  
        #swagger.tags = ['conteudo']
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
    } else {
        await db.collection(nomeCollection)
            .updateOne({ '_id': { $eq: ObjectId(req.params.id) } },
                { $set: req.body }
            )
            // #swagger.responses[201] = { description: 'Conteudo alterado com sucesso' }
            .then(result => res.status(201).send(result))
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => res.status(400).json({ error: error_handler(err.code) }))
    }
})

export default router