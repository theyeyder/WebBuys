import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsPath = path.resolve("uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_, __, callback) => {
    callback(null, uploadsPath);
  },

  filename: (_, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const nombreArchivo = `logo-empresa-${Date.now()}${extension}`;

    callback(null, nombreArchivo);
  },
});

function filtrarArchivo(_, file, callback) {
  const tiposPermitidos = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (!tiposPermitidos.includes(file.mimetype)) {
    return callback(
      new Error(
        "Solo se permiten imágenes PNG, JPG, JPEG o WEBP."
      )
    );
  }

  callback(null, true);
}

const uploadLogo = multer({
  storage,
  fileFilter: filtrarArchivo,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export default uploadLogo;