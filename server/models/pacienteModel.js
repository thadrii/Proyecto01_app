const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pacienteSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    edad: { type: Number, required: true },
    especialidad: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

const Paciente = mongoose.model('Paciente', pacienteSchema)
module.exports = Paciente
