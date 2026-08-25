import mongoose from 'mongoose';
import app from './app.js';
import logger from './utils/logger.js';

const PORT = 3000;
const MONGODB_URI = 'mongodb://localhost:27017/shipnow';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Conexión a MongoDB establecida');
    app.listen(PORT, () => {
      logger.info(`Servidor ShipNow escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    logger.fatal(`No se pudo conectar a MongoDB: ${error.message}`);
    process.exit(1);
  });