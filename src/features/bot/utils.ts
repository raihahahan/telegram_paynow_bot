const fs = require("fs");
const path = require("path");

export function deleteGeneratedFiles() {
  const extension = ".jpg";
  const rootDirectory = path.resolve(__dirname);
  const targetDirectory = path.join(rootDirectory, "../../../"); // Combine with the desired directory path
  fs.readdir(targetDirectory, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      if (path.extname(file) === extension) {
        fs.unlink(path.join(targetDirectory, file), (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log(`File ${file} deleted successfully.`);
          }
        });
      }
    });
  });
}
