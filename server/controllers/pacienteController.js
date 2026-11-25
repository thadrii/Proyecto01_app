const PacienteService = require('../services/pacienteService')
const pacienteService = new PacienteService()

exports.getAllPacientes = async (req, res) => {
  try {
    const pacientes = await pacienteService.getAll()
    res.status(200).json(pacientes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getPaciente = async (req, res) => {
  try {
    const paciente = await pacienteService.filterById(req.params.id)
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }
    res.status(200).json(paciente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createPaciente = async (req, res) => {
  try {
    const nuevo = await pacienteService.create(req.body)
    res.status(201).json(nuevo)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.updatePaciente = async (req, res) => {
  try {
    const actualizado = await pacienteService.update(req.params.id, req.body)
    if (!actualizado) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }
    res.status(200).json(actualizado)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deletePaciente = async (req, res) => {
  try {
    const paciente = await pacienteService.filterById(req.params.id)
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' })
    }
    await pacienteService.delete(req.params.id)
    res.status(200).json({ message: 'Se eliminó correctamente el paciente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
