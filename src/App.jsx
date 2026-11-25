import "./App.css";
import { useEffect, useState } from "react";

const POR_PAGINA = 2;

const ICONOS = {
  guardar: { cls: "icono-pop", path: <path d="M20 6 9 17l-5-5" /> },
  editar: {
    cls: "icono-lapiz",
    path: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
  },
  eliminar: {
    cls: "icono-basura",
    path: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      </>
    ),
  },
  aviso: {
    cls: "icono-aviso",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
  },
};

const Icono = ({ tipo, size = 15 }) => (
  <svg
    className={`icono ${ICONOS[tipo].cls}`}
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {ICONOS[tipo].path}
  </svg>
);

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
      {aviso && (
        <p className="aviso">
          <Icono tipo="aviso" />
          {aviso}
        </p>
      )}

      <form className="formulario" onSubmit={guardarPaciente} noValidate>
        <h2>{modoEdicion ? "Editar Paciente" : "Registrar Paciente"}</h2>

        <input
          type="text"
          placeholder="Nombre del Paciente"
          className={errores.nombre ? "input-error" : ""}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        {errores.nombre && (
          <p className="error">
            <Icono tipo="aviso" size={14} />
            {errores.nombre}
          </p>
        )}

        <input
          type="number"
          placeholder="Edad"
          className={errores.edad ? "input-error" : ""}
          value={edad}
          onChange={(e) => setEdad(e.target.value)}
        />
        {errores.edad && (
          <p className="error">
            <Icono tipo="aviso" size={14} />
            {errores.edad}
          </p>
        )}

        <input
          type="text"
          placeholder="Especialidad"
          className={errores.especialidad ? "input-error" : ""}
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
        />
        {errores.especialidad && (
          <p className="error">
            <Icono tipo="aviso" size={14} />
            {errores.especialidad}
          </p>
        )}

        <div className="grupo-botones form-acciones">
          <button type="submit" className={modoEdicion ? "btn-actualizar" : ""} disabled={enviando}>
            <Icono tipo="guardar" size={16} />
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
                    <Icono tipo="editar" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="eliminar"
                    disabled={modoEdicion}
                    onClick={() => setPacienteAEliminar(paciente)}
                  >
                    <Icono tipo="eliminar" />
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
            <span className="modal-icono">
              <Icono tipo="aviso" size={30} />
            </span>
            <p>¿Estás seguro de eliminar a <strong>{pacienteAEliminar.nombre}</strong>?</p>
            <div className="grupo-botones modal-botones">
              <button type="button" className="eliminar" onClick={confirmarEliminar} disabled={enviando}>
                <Icono tipo="eliminar" />
                Sí
              </button>
              <button type="button" className="btn-cancelar" onClick={() => setPacienteAEliminar(null)} disabled={enviando}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
