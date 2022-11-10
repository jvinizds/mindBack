import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { multerConfig, arquivoDelete } from "../middleware/uploadArquivos.js"

const router = express.Router()
const nomeCollection = 'perfil'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaPerfilCadastroAlterar = [
    check('cpf')
        .not().isEmpty().trim().withMessage('É obrigatório informar o CPF do usuário')
        .isNumeric().withMessage('O CPF não pode conter caracteres especiais, apenas números')
        .isLength({ min: 11, max: 11 }).withMessage('O tamanho do CPF informado é inválido.')
        .custom((value, { req }) => {
            return db.collection(nomeCollection).find({ cpf: { $eq: value } }).toArray()
                .then((perfil) => {
                    if (perfil.length) {
                        const id = perfil[0]._id.toString()
                        if (!req.params.id || id != req.params.id) {
                            return Promise.reject(`O cpf ${value} já está sendo utilizado por outro usuario`)
                        }
                    }
                })
        }),
    check('nome')
        .not().isEmpty().trim().withMessage('É obrigatório informar o nome do usuário')
        .isAlpha('pt-BR', { ignore: ' ' }).withMessage('O nome deve conter apenas texto')
        .isLength({ min: 3 }).withMessage('O nome é muito curto. Informe ao menos 3 caracteres')
        .isLength({ max: 50 }).withMessage('O nome é muito longo. Informe no máximo 50 caracteres'),
    check('sobrenome')
        .not().isEmpty().trim().withMessage('É obrigatório informar o sobrenome do usuário')
        .isAlpha('pt-BR', { ignore: ' ' }).withMessage('O sobrenome deve conter apenas texto')
        .isLength({ min: 3 }).withMessage('O sobrenome é muito curto. Informe ao menos 3 caracteres')
        .isLength({ max: 50 }).withMessage('O sobrenome é muito longo. Informe no máximo 50 caracteres'),
    check('telefone')
        .not().isEmpty().trim().withMessage('É obrigatório informar o telefone')
        .isNumeric().withMessage('O telefone não pode conter caracteres especiais, apenas números')
        .isLength({ min: 10, max: 11 }).withMessage('O tamanho do telefone informado é inválido. Deve ter entre 10 e 11 números'),
    check('login.email')
        .not().isEmpty().trim().withMessage('É obrigatório informar o email do usuário')
        .isLowercase().withMessage('O email não pode conter caracteres maiúsculos')
        .isEmail().withMessage('O email do usuário deve ser válido')
        .custom((value, { req }) => {
            return db.collection(nomeCollection).find({ "login.email": { $eq: value } }).toArray()
                .then((perfil) => {
                    if (perfil.length) {
                        const id = perfil[0]._id.toString()
                        if (!req.params.id || id != req.params.id) {
                            return Promise.reject(`O email ${value} já está sendo utilizado por outro usuario`)
                        }
                    }
                })
        }),
    check('login.senha')
        .not().isEmpty().trim().withMessage('É obrigatório informar a senha do usuário')
        .isLength({ min: 8 }).withMessage('A senha deve conter no mínimo 8 caracteres')
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        }).withMessage('A senha deve conter ao menos 1 letra minúscula, 1 letra maiúscula, 1 símbolo e 1 número')
]

const validaTipoPerfilProgresso = [
    check('tipo_perfil')
        .default('Usuario'),
    check('progresso.ansiedade')
        .default(0),
    check('progresso.foco')
        .default(0),
    check('progresso.ioga')
        .default(0),
]

const validaPlano = [
    check('plano_id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id do plano')
        .custom((value, { req }) => {
            if (!ObjectId.isValid(value)) {
                return Promise.reject('O id do plano informado está incorreto')
            }
            return db.collection('plano').find({ "_id": { $eq: ObjectId(value) } }).toArray()
                .then((plano) => {
                    if (!plano.length) {
                        return Promise.reject('O plano informado não existe')
                    }
                })
        })
]

const validaPerfilLogin = [
    check('email')
        .not().isEmpty().trim().withMessage('É obrigatório informar o email do usuário')
        .isLowercase().withMessage('O email não pode conter caracteres maiúsculos')
        .isEmail().withMessage('O email do usuário deve ser válido'),
    check('senha')
        .not().isEmpty().trim().withMessage('É obrigatório informar a senha do usuário')
        .isLength({ min: 8 }).withMessage('A senha deve conter no mínimo 8 caracteres')
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        }).withMessage('A senha deve conter ao menos 1 letra minúscula, 1 letra maiúscula, 1 símbolo e 1 número')
]

//GET perfil/
router.get("/", async (req, res) => {
    /*
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para obter todos os perfis' 
    */

    try {
        db.collection(nomeCollection).find({}, {
            projection: { "login.senha": false }
        }).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Conteudo" },
                        description: "Retorno de todos os perfis obtidos" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter todos os perfis" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter todos os perfis"
        })
    }
})

//GET perfil/id/:id
router.get("/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para obter o perfil usando o ID' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID do Perfil',
            type: 'string',
            required: true,
            example: '6337486a5e8c178d178bf432'
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
        db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } }, {
            projection: { "login.senha": false }
        }).limit(1).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Perfil" },
                        description: "Consulta do perfil obtido através do ID" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o perfil filtrando pelo ID" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o perfil pelo ID"
        })
    }
})

// POST perfil/
router.post('/', validaPerfilCadastroAlterar, validaTipoPerfilProgresso, validaPlano, async (req, res) => {
    /*  
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para cadastrar um novo perfil' 
    */
    /*
        #swagger.parameters['Perfil'] = {
            in: 'body',
            description: 'Informações do perfil.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Perfil" }
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

    const salt = await bcrypt.genSalt(10)
    req.body.login.senha = await bcrypt.hash(req.body.login.senha, salt)
    await db.collection(nomeCollection)
        .insertOne(req.body)
        // #swagger.responses[201] = { description: 'Perfil registrado com sucesso' }
        .then(result => res.status(201).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))

})

// PUT perfil/:id
router.put('/:id', validaPerfilCadastroAlterar, validaPlano, async (req, res) => {
    /*  
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para alterar informações do perfil' 
    */
    /*
        #swagger.parameters['Perfil'] = {
            in: 'path',
            description: 'Informações do perfil.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Perfil" }
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
            // #swagger.responses[201] = { description: 'Perfil alterado com sucesso' }
            .then(result => res.status(201).send(result))
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => res.status(400).json({ error: err }))
    }
})

// PUT perfil/imagem/:id
router.put('/alterar/imagem/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Imagem']
        #swagger.description = 'Endpoint que permite alterar a imagem do usuario pelo ID' 
    */
    /*
        #swagger.parameters['Perfil'] = {
            in: 'path',
            description: 'ID do perfil',
            type: 'string',
            required: true,
            example: '6337486a5e8c178d178bf432'
        } 
    */
    const idPerfil = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idPerfil)) {
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

    const perfil = await db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } }, {
        projection: { "login.senha": false }
    }).limit(1).toArray()

    if (!perfil.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhum perfil com esse ID"
        })
    }

    const upload = multer(multerConfig("")).single("arquivo")
    await upload(req, res, async function (err) {
        if (err) {
            /*
                #swagger.responses[500] = { 
                    schema: { "$ref": "#/definitions/Erro" },
                    description: "Erro ao tentar alterar a imagem de perfil" 
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

        const { originalname: nome, key: key, mimetype: tipo, size: tamanho, location: url = "" } = arquivo
        const dadosArquivo = {
            nome,
            key,
            tipo,
            tamanho,
            url
        }

        await db.collection(nomeCollection)
            .updateOne({ '_id': { $eq: ObjectId(idPerfil) } },
                { $set: { "foto_perfil": dadosArquivo } }
            )
            // #swagger.responses[202] = { description: 'Imagem de perfil alterada com sucesso' }
            .then(result => {
                if (perfil[0].foto_perfil) {
                    try {
                        arquivoDelete(perfil[0].foto_perfil.key)
                    } catch (err) {
                        /*
                            #swagger.responses[500] = { 
                                schema: { "$ref": "#/definitions/Erro" },
                                description: "Erro ao deletar a imagem de perfil do sistema" 
                            } 
                        */
                        return res.status(500).json({
                            error: "Erro ao deletar a imagem de perfil do sistema"
                        })
                    }
                }
                res.status(202).send(result)
            })
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => res.status(400).json({ error: error_handler(err.code) }))

    })
})

// DELETE perfil/:id
router.delete('/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para deletar um perfil pelo ID'    
    */
    /*
        #swagger.parameters['Perfil'] = {
            in: 'path',
            description: 'ID do perfil',
            type: 'string',
            required: true,
            example: '6337486a5e8c178d178bf432'
        } 
    */
    const idPerfil = req.params.id
    delete req.body.id

    if (!ObjectId.isValid(idPerfil)) {
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

    const perfil = await db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(idPerfil) } }, {
        projection: { "login.senha": false }
    }).limit(1).toArray()

    if (!perfil.length) {
        return res.status(404).json({
            error: "Não foi localizado nenhum perfil com esse ID"
        })
    }

    await db.collection(nomeCollection)
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        // #swagger.responses[202] = { description: 'Perfil deletado' }
        .then(result => {
            if (perfil[0].foto_perfil) {
                try {
                    arquivoDelete(perfil[0].foto_perfil.key)
                } catch (err) {
                    /*
                        #swagger.responses[500] = { 
                            schema: { "$ref": "#/definitions/Erro" },
                            description: "Erro ao deletar a imagem de perfil do sistema" 
                        } 
                    */
                    return res.status(500).json({
                        error: "Erro ao deletar a imagem de perfil do sistema"
                    })
                }
            }
            res.status(202).send(result)
        })
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

// POST perfil/login
router.post('/login', validaPerfilLogin, async (req, res) => {
    /* 
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para validar o login do perfil e retornar o token JWT' 
    */
    /*
        #swagger.parameters['Perfil'] = {
            in: 'path',
            description: 'Informações de login.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/Login" }
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
        return res.status(403).json(({
            error: schemaErrors.array()[0].msg
        }))
    }

    const { email, senha } = req.body
    try {
        let usuario = await db.collection(nomeCollection).find({ "login.email": email }).limit(1).toArray()
        if (!usuario.length)
            return res.status(404).json({
                error: "Não foi localizado nenhum perfil com esse email"
            })

        const isMatch = await bcrypt.compare(senha, usuario[0].login.senha)
        if (!isMatch)
            return res.status(403).json({
                error: 'A senha informada está incorreta'
            })

        jwt.sign(
            { usuario: { id: usuario[0]._id } },
            process.env.SECRET_KEY,
            {
                expiresIn: process.env.EXPIRES_IN
            },
            (err, token) => {
                if (err) throw err
                //setTokenCookie(res, token)
                res.status(200).json({
                    access_token: token,
                    perfil_id: usuario[0]._id
                })
            }
        )
    } catch (err) {
        res.status(500).json({
            error: 'Erro ao gerar o token'
        })
    }
})

//GET perfil/token
router.get('/token', auth, async (req, res) => {
    /* 
        #swagger.tags = ['Usuários']
        #swagger.description = 'Endpoint para verificar se o token passado é válido' 
    */
    /*
        #swagger.parameters['Perfil'] = {
            in: 'header',
            description: 'Token',
            type: 'string',
            required: true
        } 
    */
    try {
        let access_token = jwt.sign(
            { usuario: { id: req.usuario.id } },
            process.env.SECRET_KEY,
            { expiresIn: process.env.EXPIRES_IN })
        res.status(200).json({
            access_token: access_token
        })
    } catch (err) {
        res.status(500).send({
            error: 'Erro ao gerar o token'
        })
    }
})



export default router