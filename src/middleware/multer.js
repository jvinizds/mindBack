import multer from "multer"
import crypto from "crypto"
import aws from "aws-sdk"
import multerS3 from "multer-s3"

const multerConfig = (pasta) => {

    const storageType = {
        local: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, "./public");
            },
            filename: (req, file, cb) => {
                crypto.randomBytes(16, (err, hash) => {
                    if (err) cb(err)
                    file.key = `${pasta}/${hash.toString("hex")}-${file.originalname}`
                    cb(null, file.key)
                });
            }
        }),
        s3: multerS3({
            s3: new aws.S3(),
            bucket: process.env.AWS_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            acl: "public-read",
            key: (req, file, cb) => {
                crypto.randomBytes(16, (err, hash) => {
                    if (err) cb(err)
                    const fileName = `${pasta}/${hash.toString("hex")}-${file.originalname}`
                    cb(null, fileName)
                });
            }
        })
    }
    return {
        storage: storageType[process.env.STORAGE_TYPE],
        limits: {
            fileSize: 2 * 1024 * 1024
        },
        fileFilter: (req, file, cb) => {

            const tiposPermitidos = {
                arquivos_texto: [
                    "text/plain"
                ], 
                audios: [
                    "audio/mpeg"
                ],
                imagens_miniatura: [
                    "image/jpeg",
                    "image/png"
                ],
                imagens_perfil: [
                    "image/jpeg",
                    "image/png"
                ],
                videos: [
                    "video/mp4"
                ],
            }

            if (tiposPermitidos[pasta].includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Tipo de arquivo invalido"));
            }
        }
    }
}

export { multerConfig }
