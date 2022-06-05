import express from 'express'
import cors from 'cors'
import rotasUsuarios from './routes/usuarios.js'

const app = express();
const port = process.env.PORT || 4000

app.use(cors()) //Habilita o CORS-Cross-origin resource sharing
app.use(express.urlencoded({ extended: true }));
app.use(express.json()) // Parse JSON payloads
app.disable('x-powered-by') //Removendo o x-powered-by por segurança

// Rotas do conteúdo público 
app.use('/', express.static('public'))

// Rota default
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'API Dog Walker - 100% funcional!🐕👏',
        version: '1.0.1'
    })

})

//Rotas 
app.use('/api/usuarios', rotasUsuarios)

app.use(function (req, res) {
    res.status(404).json({
        errors: [
            {
                value: `${req.originalUrl}`,
                msg: `A rota ${req.originalUrl} não existe nesta API 🚫`,
                param: 'routes'
            }
        ]
    }
    )
})

app.listen(port, function () {
    console.log(`Servidor rodando na porta ${port}`)
})

