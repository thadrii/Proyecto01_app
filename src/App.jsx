import "./App.css";
import { useEffect, useState } from "react";

const POR_PAGINA = 2;

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [errores, setErrores] = useState({});
  const [idEditando, setIdEditando] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  const modoEdicion = idEditando !== null;

  const mostrarAviso = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(""), 3000);
  };

  useEffect(() => {
    fetch("/api/pacientes")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setPacientes)
      .catch(() => setAviso("Sin conexión con MongoDB (inicia npm run server)"));
  }, []);

  const validar = () => {
    const errs = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio";
    const numEdad = Number(edad);
    if (!String(edad).trim()) errs.edad = "La edad es obligatoria";
    else if (!Number.isInteger(numEdad) || numEdad <= 0) errs.edad = "Ingresa una edad válida";
    if (!especialidad.trim()) errs.especialidad = "La especialidad es obligatoria";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const limpiarFormulario = () => {
    setNombre("");
    setEdad("");
    setEspecialidad("");
    setErrores({});
  };

  const guardarPaciente = async (e) => {
    e.preventDefault();
    if (enviando || !validar()) return;

    setEnviando(true);
    const datos = {
      nombre: nombre.trim(),
      edad: Number(edad),
      especialidad: especialidad.trim(),
    };

    try {
      const url = modoEdicion ? `/api/pacientes/${idEditando}` : "/api/pacientes";
      const res = await fetch(url, {
        method: modoEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error();
      const guardado = await res.json();

      if (modoEdicion) {
        setPacientes((prev) => prev.map((p) => (p._id === idEditando ? guardado : p)));
        setIdEditando(null);
        mostrarAviso("Paciente actualizado");
      } else {
        setPacientes((prev) => [guardado, ...prev]);
        setPagina(1);
        mostrarAviso("Paciente guardado");
      }
      limpiarFormulario();
    } catch {
      mostrarAviso("No se pudo guardar en MongoDB");
    } finally {
      setEnviando(false);
    }
  };

  const editarPaciente = (paciente) => {
    setIdEditando(paciente._id);
    setNombre(paciente.nombre);
    setEdad(String(paciente.edad));
    setEspecialidad(paciente.especialidad);
    setErrores({});
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    limpiarFormulario();
  };

  const confirmarEliminar = async () => {
    if (!pacienteAEliminar || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/pacientes/${pacienteAEliminar._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPacientes((prev) => {
        const restantes = prev.filter((p) => p._id !== pacienteAEliminar._id);
        setPagina((actual) => Math.min(actual, Math.max(1, Math.ceil(restantes.length / POR_PAGINA))));
        return restantes;
      });
      setPacienteAEliminar(null);
      mostrarAviso("Paciente eliminado");
    } catch {
      mostrarAviso("No se pudo eliminar el paciente");
    } finally {
      setEnviando(false);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(pacientes.length / POR_PAGINA));
  const pacientesPaginados = pacientes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="contenedor">
      <h1>Sistema de Pacientes</h1>
      {aviso && <p className="aviso">{aviso}</p>}

      <form className="formulario" onSubmit={guardarPaciente} noValidate>
        <h2>{modoEdicion ? "Editar Paciente" : "Registrar Paciente"}</h2>

        <input type="text" placeholder="Nombre del Paciente" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {errores.nombre && <p className="error">{errores.nombre}</p>}

        <input type="number" placeholder="Edad" value={edad} onChange={(e) => setEdad(e.target.value)} />
        {errores.edad && <p className="error">{errores.edad}</p>}

        <input type="text" placeholder="Especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
        {errores.especialidad && <p className="error">{errores.especialidad}</p>}

        <div className="grupo-botones">
          <button type="submit" className={modoEdicion ? "btn-actualizar" : ""} disabled={enviando}>
            {modoEdicion ? "Actualizar Paciente" : "Guardar Paciente"}
          </button>
          {modoEdicion && (
            <button type="button" className="btn-cancelar" onClick={cancelarEdicion} disabled={enviando}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="lista">
        <h2>Lista de Pacientes</h2>
        {pacientes.length === 0 ? (
          <p>No hay pacientes registrados</p>
        ) : (
          <>
            {pacientesPaginados.map((paciente) => (
              <div key={paciente._id} className="card-paciente">
                <div className="info-paciente">
                  <p><strong>Nombre:</strong> {paciente.nombre}</p>
                  <p><strong>Edad:</strong> {paciente.edad}</p>
                  <p><strong>Especialidad:</strong> {paciente.especialidad}</p>
                </div>
                <div className="grupo-botones">
                  <button type="button" className="editar" onClick={() => editarPaciente(paciente)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="eliminar"
                    disabled={modoEdicion}
                    onClick={() => setPacienteAEliminar(paciente)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {totalPaginas > 1 && (
              <nav className="paginacion" aria-label="Paginación">
                <a href="#primero" className={pagina === 1 ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina(1); }}>&laquo;</a>
                <a href="#anterior" className={pagina === 1 ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina((p) => Math.max(1, p - 1)); }}>&lsaquo;</a>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <a
                    key={num}
                    href={`#p${num}`}
                    className={num === pagina ? "activa" : ""}
                    onClick={(e) => { e.preventDefault(); setPagina(num); }}
                  >
                    {num}
                  </a>
                ))}
                <a href="#siguiente" className={pagina === totalPaginas ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina((p) => Math.min(totalPaginas, p + 1)); }}>&rsaquo;</a>
                <a href="#ultimo" className={pagina === totalPaginas ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina(totalPaginas); }}>&raquo;</a>
              </nav>
            )}
          </>
        )}
      </div>

      {pacienteAEliminar && (
        <div className="modal-fondo" role="dialog" aria-modal="true">
          <div className="modal-caja">
            <p>¿Estás seguro de eliminar a <strong>{pacienteAEliminar.nombre}</strong>?</p>
            <div className="grupo-botones modal-botones">
              <button type="button" className="eliminar" onClick={confirmarEliminar} disabled={enviando}>Sí</button>
              <button type="button" className="btn-cancelar" onClick={() => setPacienteAEliminar(null)} disabled={enviando}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
