import express from 'express'
import { connectToDatabase, error_handler } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { multerConfig } from "../middleware/multer.js"

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
    check('telefone.ddd')
        .not().isEmpty().trim().withMessage('É obrigatório informar o DDD do telefone')
        .isNumeric().withMessage('O DDD não pode conter caracteres especiais, apenas números')
        .isLength({ min: 2, max: 2 }).withMessage('O tamanho do DDD informado é inválido'),
    check('telefone.numero')
        .not().isEmpty().trim().withMessage('É obrigatório informar o número do telefone')
        .isNumeric().withMessage('O número não pode conter caracteres especiais, apenas números')
        .isLength({ min: 9, max: 9 }).withMessage('O tamanho do número informado é inválido'),
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

const validaPerfilCadastroInicial = [
    check('tipo_perfil')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do perfil')
        .isIn(['Usuario', 'Admin']).withMessage('Dever ser Usuario ou Admin'),
    check('plano.id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id do plano'),
    check('plano.descricao')
        .not().isEmpty().trim().withMessage('É obrigatório informar a descrição do plano'),
    check('plano.tipo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do plano')
        .isIn(['Gratuito', 'Pago']).withMessage('Dever ser Gratuito ou Pago'),
    check('plano.valor')
        .not().isEmpty().trim().withMessage('É obrigatório informar o valor do plano')
        .isNumeric().withMessage('O valor do plano deve conter numeros'),
    check('foto_perfil.nome')
        .default('default-user.png'),
    check('foto_perfil.key')
        .default('ad50318226c1e5b5371b816fdc67d3c8-default-user.png'),
    check('foto_perfil.tipo')
        .default('image/png'),
    check('foto_perfil.tamanho')
        .default(12372),
    check('foto_perfil.url')
        .default('https://mind-app-bucket.s3.sa-east-1.amazonaws.com/imagens_perfil/ad50318226c1e5b5371b816fdc67d3c8-default-user.png')
        .isURL().withMessage('Deve ser uma URL válida')
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

//GET perfil/id/:id
router.get("/id/:id", async (req, res) => {
    /*
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para obter o perfil usando o id' 
    */
    /*
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Id do Perfil',
            type: 'string',
            required: true,
            example: '6337486a5e8c178d178bf432'
        } 
    */
    try {
        db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } }, {
            projection: { "login.senha": false }
        }).limit(1).toArray((err, docs) => {
            if (!err) {
                /* 
                    #swagger.responses[200] = { 
                        schema: { "$ref": "#/definitions/Usuário" },
                        description: "Consulta do perfil obtido através do id" 
                    } 
                */
                res.status(200).json(docs)
            }
        })
    } catch (err) {
        /* 
            #swagger.responses[500] = { 
                schema: { "$ref": "#/definitions/Erro" },
                description: "Erro ao obter o perfil filtrando pelo id" 
            } 
        */
        res.status(500).json({
            error: "Erro ao obter o perfil pelo id"
        })
    }
})

// POST perfil/
router.post('/', validaPerfilCadastroAlterar, validaPerfilCadastroInicial, async (req, res) => {
    /*  
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para cadastrar um novo perfil' 
    */
    /*
        #swagger.parameters['DadosPerfil'] = {
            in: 'body',
            description: 'Informações do perfil.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/DadosPerfil" }
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
        const salt = await bcrypt.genSalt(10)
        req.body.login.senha = await bcrypt.hash(req.body.login.senha, salt)
        req.body.plano.valor = Number(req.body.plano.valor)
        await db.collection(nomeCollection)
            .insertOne(req.body)
            // #swagger.responses[201] = { description: 'Perfil registrado com sucesso' }
            .then(result => res.status(201).send(result))
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => res.status(400).json({ error: error_handler(err.code) }))
    }
})

// PUT perfil/:id
router.put('/:id', validaPerfilCadastroAlterar, async (req, res) => {
    /*  
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para alter informações do perfil' 
    */
    /*
        #swagger.parameters['DadosPerfil'] = {
            in: 'body',
            description: 'Informações do perfil.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/DadosPerfil" }
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
            // #swagger.responses[201] = { description: 'Perfil alterado com sucesso' }
            .then(result => res.status(201).send(result))
            // #swagger.responses[400] = { description: 'Bad Request' }     
            .catch(err => res.status(400).json({ error: error_handler(err.code) }))
    }
})

// PUT perfil/imagem
router.put('/imagem', async (req, res) => {
    /* 
        #swagger.tags = ['Imagem']
        #swagger.description = 'Endpoint que permite alterar a imagem do usuario pelo id' 
    */
    const upload = multer(multerConfig("imagens_perfil")).single("foto_perfil")
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

        const idDocumento = req.body._id
        delete req.body._id

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
                .updateOne({ '_id': { $eq: ObjectId(idDocumento) } },
                    { $set: dadosArquivo }
                )
                // #swagger.responses[202] = { description: 'Imagem de perfil alterada com sucesso' }
                .then(result => res.status(202).send(result))
                // #swagger.responses[400] = { description: 'Bad Request' }     
                .catch(err => res.status(400).json({ error: error_handler(err.code) }))
        }
    })
})

// DELETE perfil/:id
router.delete('/:id', async (req, res) => {
    /* 
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para deletar um perfil pelo id'    
    */
    await db.collection(nomeCollection)
        .deleteOne({ '_id': { $eq: ObjectId(req.params.id) } })
        // #swagger.responses[202] = { description: 'Perfil deletado' }
        .then(result => res.status(202).send(result))
        // #swagger.responses[400] = { description: 'Bad Request' }     
        .catch(err => res.status(400).json({ error: error_handler(err.code) }))
})

// POST perfil/login
router.post('/login', validaPerfilLogin, async (req, res) => {
    /* 
        #swagger.tags = ['Perfil']
        #swagger.description = 'Endpoint para validar o login do perfil e retornar o token JWT' 
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
                    access_token: token
                })
            }
        )
    } catch (e) {
        console.error(e)
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