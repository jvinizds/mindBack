import multer from "multer"
import crypto from "crypto"
import aws from "aws-sdk"
import multerS3 from "multer-s3"
import fs from "fs"

const s3 = new aws.S3();

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

        fileFilter: (req, file, cb) => {

            if (file.mimetype == "video/mp4") {
                pasta = "videos"
            }

            const tiposPermitidos = {
                arquivos_texto: [
                    "text/plain"
                ],
                audios: [
                    "audio/mpeg"
                ],
                imagens_perfil: [
                    "image/jpeg",
                    "image/png"
                ],
                videos: [
                    "video/mp4"
                ],
            }

            const tamanhosPermitidos = {
                arquivos_texto: 2097152, // 2 MB
                audios: 10485760, // 10 MB
                imagens_perfil: 2097152, // 2 MB
                videos: 20971520, // 20 MB
            }

            if (tiposPermitidos[pasta].includes(file.mimetype)) {
                if (req.headers['content-length'] < tamanhosPermitidos[pasta]) {
                    return cb(null, true);
                } else {
                    return cb(new Error("Tamanho do arquivo invalido"));
                }
            } else {
                return cb(new Error("Tipo de arquivo invalido"));
            }
        }
    }
}

const arquivoDelete = (key) => {
    if (process.env.STORAGE_TYPE === "s3") {
        s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }, (err) => {
            if (err) throw err
        })
    } else {
        fs.unlink(`public/${key}`, function (err) {
            if (err) throw err
        })
    }
}

export { multerConfig, arquivoDelete }
