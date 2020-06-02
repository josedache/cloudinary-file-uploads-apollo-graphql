const cloudinary = require("cloudinary").v2;
const path = require("path");

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER,
  CLOUDINARY_FILE_TAGS,
} = process.env;

const MAX_FILE_SIZE_BASE64_BYTE = 59 * 1024 * 1024;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

module.exports.saveToCloud = async function ({
  filename,
  mimetype,
  createReadStream,
}) {
  try {
    console.log("UPLOADING FILE TO CLOUDINARY:", filename);
    const file = toBase64DataUri(
      await getBufferFromReadStream(createReadStream()),
      mimetype
    );

    const IS_LARGE_FILE = file.length > MAX_FILE_SIZE_BASE64_BYTE;
    console.log(
      `IT IS ${
        IS_LARGE_FILE ? "" : "NOT"
      } LARGE FILE: NAME: ${filename} - SIZE: ${file.length / 1024 / 1024}MB`
    );

    const response = await cloudinary.uploader[
      IS_LARGE_FILE ? "upload_large" : "upload"
    ](file, {
      folder: CLOUDINARY_FOLDER,
      resource_type: "auto",
      tags: CLOUDINARY_FILE_TAGS,
    });

    console.log("CLOUDINARY FILE UPLOAD RESPONSE:", response);
    return constructGraphQLFileResponse(response);
  } catch (error) {
    console.error("CLOUDINARY UPLOAD ERROR:", error);
  }
  return null;
};

module.exports.getCloudFilesData = async function () {
  console.log("GETTING CLOUD FILES DATA");
  try {
    // const response = await cloudinary.api.resources({
    //   type: "upload",
    //   prefix: CLOUDINARY_FOLDER,
    // });
    const response = await cloudinary.search
      .expression(`folder:${CLOUDINARY_FOLDER}/*`)
      .execute();
    console.log("CLOUD FILES DATA:", response);
    const resources = response.resources;
    if (resources) {
      return resources.map(constructGraphQLFileResponse);
    }
  } catch (error) {
    console.error("ERROR GETTING FILES DATA FROM CLOUD:", error);
  }
  return [];
};

function constructGraphQLFileResponse({
  secure_url,
  format,
  resource_type,
  width,
  height,
  bytes,
}) {
  const { name, ext } = path.parse(secure_url);
  return {
    filename: name,
    extension: ext,
    width,
    height,
    mimetype: `${resource_type}/${format}`,
    size: bytes,
    publicUri: secure_url,
  };
}

function verifyCloudUpload(response) {}

function getBufferFromReadStream(readStream) {
  return new Promise((resolve, reject) => {
    console.log("CONVERTING READ_STREAM TO BUFFER");
    let buffer = Buffer.alloc(0);
    readStream.on("error", (err) => {
      reject(err);
    });

    readStream.on("end", () => {
      console.log("CONVERTED READ_STREAM [BUFFER]:", buffer);
      resolve(buffer);
    });

    readStream.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });
  });
}

function toBase64DataUri(buffer, mimetype = "text/plain") {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
}
