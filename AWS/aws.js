// Importing required modules from AWS SDK v3
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { fromEnv } = require('@aws-sdk/credential-provider-env');

// AWS Configuration for SDK v3
const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: fromEnv(), // Automatically loads credentials from environment variables
});

// Function to upload a PDF to AWS S3 using SDK v3
let uploadPdfToS3 = async (pdfBuffer, fileName, folderName) => {
  try {
    // Using high-level Upload class from lib-storage for managed uploads
    const uploader = new Upload({
      client: s3Client,
      params: {
        ACL: 'public-read',
        Bucket: 'dresscode-invoices',
        Key: `${folderName}/${fileName+'.pdf'}`,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      },
    });

    const result = await uploader.done();
    return result.Location;
  } catch (err) {
    console.error('Error uploading PDF to S3', err);
    throw err; // Rethrowing the error to handle it outside this function if necessary
  }
};

// Exporting the updated function
module.exports = { uploadPdfToS3 };

