const sharp = require('sharp'); // 이미지 리사이징 라이브러리
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client();

exports.handler = async (event, context, callback) => {

    const Bucket = event.Records[0].s3.bucket.name;
    const Key = decodeURIComponent(event.Records[0].s3.object.key); // original/고양이.png
    const filename = Key.split('/').at(-1);
    const ext = Key.split('.').at(-1).toLowerCase();

    // sharp에서는 확장자가 jpg면 jpeg로 변경해줘야 한다.
    const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
    console.log('name', filename, 'ext', ext);

    try {
        const getObject = await s3.send(new GetObjectCommand({ Bucket, Key}));
        const buffers = [];
        for await (const data of getObject.body) {
            buffers.push(data);
        }
        const imagebuffer = Buffer.concat(buffers);

        const resizedImage = await sharp(imagebuffer)
            .resize(200, 200, { fit : 'inside'})
            .toFormat(requiredFormat)
            .toBuffer();
        await s3.send(new PutObjectCommand({
            Bucket,
            Key : `thumb/${filename}`,
            Body : resizedImage,
        }));
        console.log('put', imagebuffer.length);
        // 첫번째자리는 에러자리, 두번째자리는 응답값자리
        return callback(null, `thumb/${filename}`);
    } catch (error) {
        console.error(error);
        return callback(error);
    }
};