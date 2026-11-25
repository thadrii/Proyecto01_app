const Paciente = require('../models/pacienteModel')

class PacienteService {
  constructor() {}

  async getAll() {
    return await Paciente.find({}).sort({ _id: -1 })
  }

  async filterById(id) {
    return await Paciente.findOne({ _id: id })
  }

  async create(data) {
    const paciente = new Paciente(data)
    return await paciente.save()
  }

  async update(id, data) {
    return await Paciente.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  }

  async delete(id) {
    return await Paciente.deleteOne({ _id: id })
  }
}

module.exports = PacienteService
