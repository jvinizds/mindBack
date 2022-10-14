
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
            error: "Erro gerado pela aplicação"
            
        },
        Perfil: {
            cpf: "47231369752",
            nome: "João Vinicius",
            sobrenome: "Santos",
            tipo_perfil: "Usuario",
            telefone: {
                telefone_ddd: "11",
                telefone_numero: "975003307"
            },
            plano: {
                plano_id: "6331bdd97a625c4641e95715",
                plano_descricao: "Plano premium",
                plano_tipo: "Pago",
                plano_valor: 19
            },
            login: {
                login_email: "joaoviniciuszds@gmail.com",
                login_senha: "Senha"
            }
        },
        Conteudo: {
            tipo: "Video",
            categoria: "Ansiedade",
            titulo: "Sabe o que é ansiedade?",
            descricao: "Video ensinando o que é ansiedade",
            url: "https://mind-app-bucket.s3.sa-east-1.amazonaws.com/imagens_perfil/ad50318226c1e5b5371b816fdc67d3c8-default-user.png"
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