const express = require('express')
const config = require('./config')
require('./database/connection')
const pacienteRouter = require('./routers/pacienteRouter')

const app = express()
app.use(express.json())
app.use('/api/pacientes', pacienteRouter)

app.listen(config.port, () => {
  console.log(`API de pacientes ejecutándose en el puerto ${config.port}`)
})
