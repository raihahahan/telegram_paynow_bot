import { downloadImage } from "./utils";
import { v4 as uuidv4 } from "uuid";

export function generateQRCode(mobile: string, amount: string): string {
  const imageUrl = `https://sgqrcode.com/paynow?mobile=${mobile}&uen=&editable=0&amount=${amount}&expiry=2030%2F03%2F17%2010%3A03&ref_id=&company=`;

  const destinationPath = `${uuidv4()}-image.jpg`; // Path where you want to save the image
  downloadImage(imageUrl, destinationPath)
    .then(() => {
      console.log("Image downloaded successfully.");
    })
    .catch((error) => {
      console.error("Error downloading image:", error);
    });

  return destinationPath;
}
