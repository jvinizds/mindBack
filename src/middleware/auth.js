import jwt from 'jsonwebtoken'

export default async function auth(req, res, next) {
    const token = req.header('access-token') || req.headers['x-access-token']
    if (!token) return res.status(401).json({ mensagem: "É obrigatório o envio do token!" });
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
         // decoded retorna o payload do usuario, expiration e issued at:
        req.usuario = await decoded.usuario
        next()
    } catch (e) {
        console.error(e.message)
        res.status(403).send({ error: `Token inválido: ${e.message}` });
    }
}