const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read", // 원하는 권한 설정
    contentType: multerS3.AUTO_CONTENT_TYPE, // 자동으로 콘텐트 타입 설정
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname }); // input 태그의 name 속성
    },
    key: function (req, file, cb) {
      const fileName = `${uuidv4()}.${file.originalname.split(".").pop()}`;
      cb(null, fileName);
    },
  }),
});

module.exports = upload;
