import express from 'express'
import { connectToDatabase } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()
const nomeCollection = 'perfil'
const { db, ObjectId } = await connectToDatabase()

// Validações
const validaCadastroUsuario = [
    check('cpf')
        .not().isEmpty().trim().withMessage('É obrigatório informar o CPF do usuário')
        .isNumeric().withMessage('O CPF não pode conter caracteres especiais, apenas números')
        .isLength({ min: 11, max: 11 }).withMessage('O tamanho do CPF informado é inválido.')
        .custom((value, { req }) => {
            return db.collection(nomeCollection).find({ cpf: { $eq: value } }).toArray()
                .then((cpf) => {
                    if (cpf.length && !req.body._id) {
                        return Promise.reject(`O cpf ${value} já está sendo utilizado por outro usuario`)
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
    check('tipo_perfil')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do perfil')
        .isIn(['Usuario', 'Admin']).withMessage('Dever ser Usuario ou Admin'),
    check('telefone.telefone_ddd')
        .not().isEmpty().trim().withMessage('É obrigatório informar o DDD do telefone')
        .isNumeric().withMessage('O DDD não pode conter caracteres especiais, apenas números')
        .isLength({ min: 2, max: 2 }).withMessage('O tamanho do DDD informado é inválido'),
    check('telefone.telefone_numero')
        .not().isEmpty().trim().withMessage('É obrigatório informar o número do telefone')
        .isNumeric().withMessage('O número não pode conter caracteres especiais, apenas números')
        .isLength({ min: 9, max: 9 }).withMessage('O tamanho do número informado é inválido'), 
    check('login.login_email')
        .not().isEmpty().trim().withMessage('É obrigatório informar o email do usuário')
        .isLowercase().withMessage('O email não pode conter caracteres maiúsculos')
        .isEmail().withMessage('O email do usuário deve ser válido'),
    check('login.login_senha')
        .not().isEmpty().trim().withMessage('É obrigatório informar a senha do usuário')
        .isLength({ min: 8 }).withMessage('A senha deve conter no mínimo 8 caracteres')
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1
        }).withMessage('A senha deve conter ao menos 1 letra minúscula, 1 letra maiúscula, 1 símbolo e 1 número'),
        check('plano.plano_id')
        .not().isEmpty().trim().withMessage('É obrigatório informar o id do plano'),
    check('plano.plano_descricao')
        .not().isEmpty().trim().withMessage('É obrigatório informar a descrição do plano'),
    check('plano.plano_tipo')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tipo do plano')
        .isIn(['Gratuito', 'Pago']).withMessage('Dever ser Gratuito ou Pago'),
    check('plano.plano_valor')
        .not().isEmpty().trim().withMessage('É obrigatório informar o valor do plano')
        .isNumeric().withMessage('O valor do plano deve conter numeros'), 
    check('foto_perfil.foto_perfil_nome')
        .not().isEmpty().trim().withMessage('É obrigatório informar o nome da imagem do perfil'),
    check('foto_perfil.foto_perfil_key')
        .not().isEmpty().trim().withMessage('É obrigatório informar a key da imagem do perfil'), 
    check('foto_perfil.foto_perfil_tamanho')
        .not().isEmpty().trim().withMessage('É obrigatório informar o tamanho da imagem'),
    check('foto_perfil.foto_perfil_url')
        .not().isEmpty().trim().withMessage('É obrigatório informar o email do usuário')
        .isURL().withMessage('Deve ser uma URL válida')

]

const validaLoginUsuario = [
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

// POST /perfil/
 
router.post('/cadastro', validaCadastroUsuario, async (req, res) => {
    const schemaErrors = validationResult(req)
    if (!schemaErrors.isEmpty()) {
        return res.status(403).json(({
            errors: schemaErrors.array()
        }))
    } else {
        const salt = await bcrypt.genSalt(10)
        req.body.login.senha = await bcrypt.hash(req.body.login.login_senha, salt)

        await db.collection(nomeCollection)
            .insertOne(req.body)
            .then(result => res.status(201).send(result))
            .catch(err => res.status(400).json(err))
    }
})

export default router