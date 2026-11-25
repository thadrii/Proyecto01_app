const mongoose = require('mongoose')
const { db } = require('../config')

const connection = mongoose
  .connect(`mongodb://${db.host}:${db.port}/${db.database}`)
  .then(() => {
    console.log('conexión exitosa a MongoDB')
  })
  .catch((err) => {
    console.error('error al conectar a MongoDB:', err.message)
  })

module.exports = connection
