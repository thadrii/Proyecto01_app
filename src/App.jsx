import "./App.css";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Pencil, Search, Trash2 } from "lucide-react";

const POR_PAGINA = 2;
const VACIO = { nombre: "", edad: "", especialidad: "" };

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [editId, setEditId] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [borrar, setBorrar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  const notificar = (txt) => {
    setAviso(txt);
    setTimeout(() => setAviso(""), 3000);
  };

  useEffect(() => {
    fetch("/api/pacientes")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPacientes)
      .catch(() => setAviso("Sin conexión con MongoDB (inicia npm run server)"));
  }, []);

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    else if (/[<>]/.test(form.nombre)) e.nombre = "No uses < ni >";
    const n = Number(form.edad);
    if (!String(form.edad).trim()) e.edad = "La edad es obligatoria";
    else if (!Number.isInteger(n) || n <= 0) e.edad = "Ingresa una edad válida";
    if (!form.especialidad.trim()) e.especialidad = "La especialidad es obligatoria";
    else if (/[<>]/.test(form.especialidad)) e.especialidad = "No uses < ni >";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (enviando || !validar()) return;
    setEnviando(true);
    try {
      const res = await fetch(editId ? `/api/pacientes/${editId}` : "/api/pacientes", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre.trim(), edad: Number(form.edad), especialidad: form.especialidad.trim() }),
      });
      if (!res.ok) throw new Error();
      const doc = await res.json();
      if (editId) {
        setPacientes((p) => p.map((x) => (x._id === editId ? doc : x)));
        setEditId(null);
        notificar("Paciente actualizado");
      } else {
        setPacientes((p) => [doc, ...p]);
        setPagina(1);
        notificar("Paciente guardado");
      }
      setForm(VACIO);
      setErrores({});
    } catch {
      notificar("No se pudo guardar en MongoDB");
    } finally {
      setEnviando(false);
    }
  };

  const editar = (p) => {
    setEditId(p._id);
    setForm({ nombre: p.nombre, edad: String(p.edad), especialidad: p.especialidad });
    setErrores({});
  };

  const cancelar = () => {
    setEditId(null);
    setForm(VACIO);
    setErrores({});
  };

  const confirmarBorrar = async () => {
    if (!borrar || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/pacientes/${borrar._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPacientes((prev) => {
        const list = prev.filter((x) => x._id !== borrar._id);
        setPagina((a) => Math.min(a, Math.max(1, Math.ceil(list.length / POR_PAGINA))));
        return list;
      });
      setBorrar(null);
      notificar("Paciente eliminado");
    } catch {
      notificar("No se pudo eliminar");
    } finally {
      setEnviando(false);
    }
  };

  const manejarBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPagina(1);
  };

  const texto = busqueda.trim().toLowerCase();
  const filtrados = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(texto) ||
      p.especialidad.toLowerCase().includes(texto) ||
      String(p.edad).includes(texto)
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="contenedor">
      <h1>Sistema de Pacientes</h1>
      {aviso && <p className="aviso"><AlertCircle size={15} />{aviso}</p>}

      <form className="formulario" onSubmit={guardar} noValidate>
        <h2>{editId ? "Editar Paciente" : "Registrar Paciente"}</h2>

        <input type="text" placeholder="Nombre del Paciente" className={errores.nombre ? "input-error" : ""} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        {errores.nombre && <p className="error">{errores.nombre}</p>}

        <input type="number" placeholder="Edad" className={errores.edad ? "input-error" : ""} value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
        {errores.edad && <p className="error">{errores.edad}</p>}

        <input type="text" placeholder="Especialidad" className={errores.especialidad ? "input-error" : ""} value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} />
        {errores.especialidad && <p className="error">{errores.especialidad}</p>}

        <div className="grupo-botones form-acciones">
          <button type="submit" className={editId ? "btn-actualizar" : ""} disabled={enviando}>
            <Check size={16} className="ico ico-pop" />
            {editId ? "Actualizar Paciente" : "Guardar Paciente"}
          </button>
          {editId && <button type="button" className="btn-cancelar" onClick={cancelar} disabled={enviando}>Cancelar</button>}
        </div>
      </form>

      <div className="lista">
        <div className="lista-cabecera">
          <h2>Lista de Pacientes</h2>
          <div className="buscador-caja">
            <Search size={15} />
            <input type="search" className="buscador" placeholder="Buscar paciente..." value={busqueda} onChange={manejarBusqueda} />
          </div>
        </div>

        {pacientes.length === 0 ? (
          <p>No hay pacientes registrados</p>
        ) : filtrados.length === 0 ? (
          <p>No se encontraron pacientes</p>
        ) : (
          <>
            {visibles.map((p) => (
              <div key={p._id} className="card-paciente">
                <div className="info-paciente">
                  <p><strong>Nombre:</strong> {p.nombre}</p>
                  <p><strong>Edad:</strong> {p.edad}</p>
                  <p><strong>Especialidad:</strong> {p.especialidad}</p>
                </div>
                <div className="grupo-botones">
                  <button type="button" className="editar" onClick={() => editar(p)}>
                    <Pencil size={15} className="ico ico-lapiz" />Editar
                  </button>
                  <button type="button" className="eliminar" disabled={Boolean(editId)} onClick={() => setBorrar(p)}>
                    <Trash2 size={15} className="ico ico-basura" />Eliminar
                  </button>
                </div>
              </div>
            ))}

            {totalPaginas > 1 && (
              <nav className="paginacion" aria-label="Paginación">
                <a href="#1" className={pagina === 1 ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina(1); }}>&laquo;</a>
                <a href="#ant" className={pagina === 1 ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina((n) => Math.max(1, n - 1)); }}>&lsaquo;</a>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <a key={num} href={`#p${num}`} className={num === pagina ? "activa" : ""} onClick={(e) => { e.preventDefault(); setPagina(num); }}>{num}</a>
                ))}
                <a href="#sig" className={pagina === totalPaginas ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina((n) => Math.min(totalPaginas, n + 1)); }}>&rsaquo;</a>
                <a href="#ult" className={pagina === totalPaginas ? "disabled" : ""} onClick={(e) => { e.preventDefault(); setPagina(totalPaginas); }}>&raquo;</a>
              </nav>
            )}
          </>
        )}
      </div>

      {borrar && (
        <div className="modal-fondo" role="dialog" aria-modal="true">
          <div className="modal-caja">
            <span className="modal-icono"><AlertCircle size={28} /></span>
            <p>¿Estás seguro de eliminar a <strong>{borrar.nombre}</strong>?</p>
            <div className="grupo-botones modal-botones">
              <button type="button" className="eliminar" onClick={confirmarBorrar} disabled={enviando}>Sí</button>
              <button type="button" className="btn-cancelar" onClick={() => setBorrar(null)} disabled={enviando}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
