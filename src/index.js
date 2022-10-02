import express from 'express'
import fs from 'fs'
import cors from 'cors'
import rotasPerfil from './routes/perfil.js'
import swaggerUI from 'swagger-ui-express'

const app = express();
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.disable('x-powered-by')

// Rotas do conteúdo público 
app.use('/', express.static('public'))

// Rota default
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'Api funcionando',
        version: '1.0.1'
    })
})

// Rotas 
app.use('/api/perfil', rotasPerfil)

app.use('/api/doc', swaggerUI.serve, swaggerUI.setup(JSON.parse(fs.readFileSync('./src/swagger/swagger_output.json'))))

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

app.listen(port, function () {
    console.log(`Servidor rodando na porta ${port}`)
})