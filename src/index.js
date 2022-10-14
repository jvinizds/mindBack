import express from 'express'
import * as dotenv from 'dotenv'
import fs from 'fs'
import cors from 'cors'
import swaggerUI from 'swagger-ui-express'

import rotasPerfil from './routes/perfil.js'
import rotasConteudo from './routes/conteudo.js'

const app = express();
const PORT = process.env.PORT || 4000

dotenv.config()
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.disable('x-powered-by')

// Rotas do conteúdo público 
app.use('/', express.static('public'))

// Rota default
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Api funcionando',
        version: '1.0.1'
    })
})

// Rotas 
app.use('/perfil', rotasPerfil)
app.use('/conteudo', rotasConteudo)

app.use('/doc', swaggerUI.serve, swaggerUI.setup(JSON.parse(fs.readFileSync('./src/swagger/swagger_output.json'))))

// Rota invalida
app.use(function (req, res) {
    res.status(404).json({
        errors: [
            {
                value: `${req.originalUrl}`,
                msg: `Rota ${req.originalUrl} não existe`,
                param: 'routes'
            }
        ]
    }
    )
})

app.listen(PORT, function () {
    console.log(`Servidor rodando na porta ${PORT}`)
})