import "./App.css";
import "sileo/styles.css";
import { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Toaster, sileo } from "sileo";

const POR_PAGINA = 2;

const validationSchema = Yup.object({
  nombre: Yup.string().trim().required("El nombre es obligatorio"),
  edad: Yup.number()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? undefined : value
    )
    .typeError("La edad debe ser un número")
    .required("La edad es obligatoria")
    .positive("La edad debe ser mayor a 0")
    .integer("La edad debe ser un número entero"),
  especialidad: Yup.string().trim().required("La especialidad es obligatoria"),
});

const IconoGuardar = () => (
  <svg className="icono icono-pop" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconoEditar = () => (
  <svg className="icono icono-lapiz" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconoEliminar = () => (
  <svg className="icono icono-basura" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

const IconoAviso = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [idEditando, setIdEditando] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Candados síncronos contra doble clic rápido antes de que React re-renderice disabled
  const enviandoRef = useRef(false);
  const eliminandoRef = useRef(false);

  const modoEdicion = idEditando !== null;

  useEffect(() => {
    fetch("/api/pacientes")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar los pacientes");
        return res.json();
      })
      .then((data) => setPacientes(data))
      .catch(() => {
        sileo.error({
          title: "Sin conexión con MongoDB",
          description: "Inicia el servidor backend con npm run server.",
        });
      });
  }, []);

  const formik = useFormik({
    initialValues: {
      nombre: "",
      edad: "",
      especialidad: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (enviandoRef.current) return;
      enviandoRef.current = true;

      const datos = {
        nombre: values.nombre.trim(),
        edad: Number(values.edad),
        especialidad: values.especialidad.trim(),
      };

      try {
        if (modoEdicion) {
          const actualizado = await sileo.promise(
            async () => {
              const res = await fetch(`/api/pacientes/${idEditando}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
              });
              if (!res.ok) throw new Error("Error al actualizar");
              return res.json();
            },
            {
              loading: { title: "Actualizando paciente..." },
              success: (p) => ({
                title: "Paciente actualizado",
                description: `${p.nombre} (${p.especialidad})`,
              }),
              error: {
                title: "Error al actualizar",
                description: "No se pudo guardar los cambios en MongoDB.",
              },
            }
          );

          setPacientes((prev) =>
            prev.map((p) => (p._id === idEditando ? actualizado : p))
          );
          setIdEditando(null);
        } else {
          const nuevo = await sileo.promise(
            async () => {
              const res = await fetch("/api/pacientes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
              });
              if (!res.ok) throw new Error("Error al guardar");
              return res.json();
            },
            {
              loading: { title: "Guardando paciente..." },
              success: (p) => ({
                title: "Paciente registrado",
                description: `${p.nombre} fue agregado a la lista.`,
              }),
              error: {
                title: "Error al registrar",
                description: "No se pudo guardar el paciente en MongoDB.",
              },
            }
          );

          setPacientes((prev) => [nuevo, ...prev]);
          setPagina(1);
        }
        resetForm();
      } catch {
        // sileo.promise ya muestra la notificación de error
      } finally {
        enviandoRef.current = false;
      }
    },
  });

  useEffect(() => {
    if (formik.submitCount > 0 && !formik.isValid) {
      sileo.warning({
        title: "Campos incompletos",
        description: "Revisa las advertencias marcadas en el formulario.",
      });
    }
  }, [formik.submitCount, formik.isValid]);

  const editarPaciente = (paciente) => {
    setIdEditando(paciente._id);
    formik.setValues({
      nombre: paciente.nombre,
      edad: paciente.edad,
      especialidad: paciente.especialidad,
    });
    sileo.info({
      title: "Editando paciente",
      description: `Modifica los datos de ${paciente.nombre} y pulsa Actualizar.`,
    });
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    formik.resetForm();
    sileo.info({ title: "Edición cancelada" });
  };

  const confirmarEliminar = async () => {
    if (!pacienteAEliminar || eliminandoRef.current) return;
    eliminandoRef.current = true;
    setEliminando(true);

    const objetivo = pacienteAEliminar;
    try {
      await sileo.promise(
        async () => {
          const res = await fetch(`/api/pacientes/${objetivo._id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Error al eliminar");
        },
        {
          loading: { title: "Eliminando paciente..." },
          success: {
            title: "Paciente eliminado",
            description: `${objetivo.nombre} fue eliminado de la base de datos.`,
          },
          error: {
            title: "Error al eliminar",
            description: "No se pudo eliminar el registro.",
          },
        }
      );

      setPacientes((prev) => {
        const restantes = prev.filter((p) => p._id !== objetivo._id);
        const nuevasPaginas = Math.max(1, Math.ceil(restantes.length / POR_PAGINA));
        setPagina((pagActual) => Math.min(pagActual, nuevasPaginas));
        return restantes;
      });
      setPacienteAEliminar(null);
    } catch {
      
    } finally {
      eliminandoRef.current = false;
      setEliminando(false);
    }
  };

  const irAPagina = (e, destino) => {
    e.preventDefault();
    if (destino < 1 || destino > totalPaginas || destino === pagina) return;
    setPagina(destino);
  };

  const totalPaginas = Math.max(1, Math.ceil(pacientes.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const pacientesPaginados = pacientes.slice(inicio, inicio + POR_PAGINA);

  const errorNombre = formik.touched.nombre && formik.errors.nombre;
  const errorEdad = formik.touched.edad && formik.errors.edad;
  const errorEspecialidad = formik.touched.especialidad && formik.errors.especialidad;

  return (
    <>
      <Toaster position="top-right" theme="light" />
      <div className="contenedor">
        <h1>Sistema de Pacientes</h1>

        <form className="formulario" onSubmit={formik.handleSubmit} noValidate>
          <h2>{modoEdicion ? "Editar Paciente" : "Registrar Paciente"}</h2>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre del Paciente"
            className={errorNombre ? "input-error" : ""}
            value={formik.values.nombre}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {errorNombre && (
            <p className="error" role="alert">
              <IconoAviso />
              {formik.errors.nombre}
            </p>
          )}

          <input
            type="number"
            name="edad"
            placeholder="Edad"
            className={errorEdad ? "input-error" : ""}
            value={formik.values.edad}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {errorEdad && (
            <p className="error" role="alert">
              <IconoAviso />
              {formik.errors.edad}
            </p>
          )}

          <input
            type="text"
            name="especialidad"
            placeholder="Especialidad"
            className={errorEspecialidad ? "input-error" : ""}
            value={formik.values.especialidad}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {errorEspecialidad && (
            <p className="error" role="alert">
              <IconoAviso />
              {formik.errors.especialidad}
            </p>
          )}

          {modoEdicion ? (
            <div className="grupo-botones">
              <button type="submit" className="btn-actualizar" disabled={formik.isSubmitting}>
                <IconoGuardar />
                {formik.isSubmitting ? "Actualizando..." : "Actualizar Paciente"}
              </button>
              <button
                type="button"
                className="btn-cancelar"
                onClick={cancelarEdicion}
                disabled={formik.isSubmitting}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button type="submit" disabled={formik.isSubmitting}>
              <IconoGuardar />
              {formik.isSubmitting ? "Guardando..." : "Guardar Paciente"}
            </button>
          )}
        </form>

        <div className="lista">
          <div className="lista-cabecera">
            <h2>Lista de Pacientes</h2>
            <span className="contador">{pacientes.length} registrados</span>
          </div>

          {pacientes.length === 0 ? (
            <p className="vacio">No hay pacientes registrados</p>
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
                    <button
                      type="button"
                      onClick={() => editarPaciente(paciente)}
                      className="editar"
                    >
                      <IconoEditar />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPacienteAEliminar(paciente)}
                      className="eliminar"
                      disabled={modoEdicion}
                      title={modoEdicion ? "Termina o cancela la edición primero" : "Eliminar paciente"}
                    >
                      <IconoEliminar />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {totalPaginas > 1 && (
                <nav className="paginacion" aria-label="Paginación de pacientes">
                  <a
                    href="#primero"
                    className={pagina === 1 ? "pag-link disabled" : "pag-link"}
                    aria-disabled={pagina === 1}
                    aria-label="Primera página"
                    title="Primera página"
                    onClick={(e) => irAPagina(e, 1)}
                  >
                    &laquo;
                  </a>
                  <a
                    href="#anterior"
                    className={pagina === 1 ? "pag-link disabled" : "pag-link"}
                    aria-disabled={pagina === 1}
                    aria-label="Anterior"
                    title="Anterior"
                    onClick={(e) => irAPagina(e, pagina - 1)}
                  >
                    &lsaquo;
                  </a>

                  <span className="pag-numeros">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                      <a
                        key={num}
                        href={`#pagina-${num}`}
                        className={num === pagina ? "pag-num activa" : "pag-num"}
                        aria-current={num === pagina ? "page" : undefined}
                        onClick={(e) => irAPagina(e, num)}
                      >
                        {num}
                      </a>
                    ))}
                  </span>

                  <a
                    href="#siguiente"
                    className={pagina === totalPaginas ? "pag-link disabled" : "pag-link"}
                    aria-disabled={pagina === totalPaginas}
                    aria-label="Siguiente"
                    title="Siguiente"
                    onClick={(e) => irAPagina(e, pagina + 1)}
                  >
                    &rsaquo;
                  </a>
                  <a
                    href="#ultimo"
                    className={pagina === totalPaginas ? "pag-link disabled" : "pag-link"}
                    aria-disabled={pagina === totalPaginas}
                    aria-label="Última página"
                    title="Última página"
                    onClick={(e) => irAPagina(e, totalPaginas)}
                  >
                    &raquo;
                  </a>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {pacienteAEliminar && (
        <div
          className="modal-fondo"
          role="dialog"
          aria-modal="true"
          onClick={() => !eliminando && setPacienteAEliminar(null)}
        >
          <div className="modal-sileo" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sileo-header">
              <span className="modal-sileo-badge">
                <IconoAviso />
              </span>
              <h3>Eliminar paciente</h3>
            </div>
            <p className="modal-sileo-desc">
              ¿Estás seguro de eliminar a <strong>{pacienteAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-sileo-acciones">
              <button
                type="button"
                className="modal-sileo-btn modal-sileo-si"
                onClick={confirmarEliminar}
                disabled={eliminando}
              >
                <IconoEliminar />
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                type="button"
                className="modal-sileo-btn modal-sileo-no"
                onClick={() => setPacienteAEliminar(null)}
                disabled={eliminando}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
