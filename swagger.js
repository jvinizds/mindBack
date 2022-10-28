
import swaggerAutogen from 'swagger-autogen'

const doc = {
    swagger: "1.0",
    info: {
        version: "1.0.0",
        title: "API Mind",
        description: "Documentação gerada usando o módulo <a href='https://github.com/davibaltar/swagger-autogen' target='_blank'>swagger-autogen</a>."
    },
    host: '',
    basePath: "/",
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
        apiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "access-token",
            description: "Token de acesso gerado após o login"
        }
    },
    definitions: {
        Erro: {
            error: "Mensagem detalhando o erro"
        },
        Perfil: {
            cpf: "47231369752",
            nome: "João Vinicius",
            sobrenome: "Santos",
            tipo_perfil: "Usuario",
            telefone: {
                ddd: "11",
                numero: "975003307"
            },
            plano_id: "6331bdd97a625c4641e95715",
            login: {
                email: "joaoviniciuszds@gmail.com",
                senha: "Senha"
            }
        },
        Conteudo: {
            titulo: "Sabe o que é ansiedade?",
            descricao: "Video ensinando o que é ansiedade",
            tipo: "Video",
            categoria: "Ansiedade",
            video: "Arquivo"
        },
        Historico: {
            perfil_id: "6356ad635deae9ab35e2d925",
            conteudo_id: "6355842f6cfab022c939e21d"
        }
    }

}

const outputFile = './src/swagger/swagger_output.json'
const endpointsFiles = ['./src/index.js']
const options = {
    swagger: '2.0',
    language: 'pt-BR',
    disableLogs: false,
    disableWarnings: false
}

swaggerAutogen(options)(outputFile, endpointsFiles, doc).then(async () => {
    await import('./src/index.js');

})