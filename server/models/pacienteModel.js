const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pacienteSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, match: /^[^<>]+$/ },
    edad: { type: Number, required: true, min: 1 },
    especialidad: { type: String, required: true, trim: true, match: /^[^<>]+$/ },
  },
  { timestamps: true }
)

const Paciente = mongoose.model('Paciente', pacienteSchema)
module.exports = Paciente
