import axios from "axios";
const fs = require("fs");

export async function downloadImage(imageUrl, destinationPath) {
  try {
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    // Pipe the response data to a file stream
    const fileStream = fs.createWriteStream(destinationPath);
    response.data.pipe(fileStream);

    // Return a promise that resolves when the file has been written
    return new Promise((resolve, reject) => {
      fileStream.on("finish", () => {
        resolve(null);
      });

      fileStream.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    throw new Error(`Error downloading image: ${error.message}`);
  }
}
