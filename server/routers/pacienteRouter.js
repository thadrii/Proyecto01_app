const express = require('express')
const router = express.Router()
const pacienteController = require('../controllers/pacienteController')

router.get('/', pacienteController.getAllPacientes)
router.get('/:id', pacienteController.getPaciente)
router.post('/', pacienteController.createPaciente)
router.put('/:id', pacienteController.updatePaciente)
router.delete('/:id', pacienteController.deletePaciente)

module.exports = router
