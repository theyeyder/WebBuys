import { useEffect, useState } from "react";

export default function UsuarioModal({

    abierto,
    onClose,
    onGuardar,
    usuarioEditar = null

}) {

    const [form, setForm] = useState({

        nombres: "",
        apellidos: "",
        rol: "Empleado",
        password: "",
        repetirPassword: ""

    });

    useEffect(() => {

        if (usuarioEditar) {

            setForm({

                nombres: usuarioEditar.nombres,
                apellidos: usuarioEditar.apellidos,
                rol: usuarioEditar.rol,
                password: "",
                repetirPassword: ""

            });

        }

    }, [usuarioEditar]);

    if (!abierto) return null;

    const cambiar = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    return (

        <div className="modal-overlay">

            <div className="modal-webbuys">

                <div className="modal-header">

                    <h2>

                        {
                            usuarioEditar
                                ? "Editar Usuario"
                                : "Nuevo Usuario"
                        }

                    </h2>

                </div>

                <div className="modal-body">

                    <div className="form-grid">

                        <div>

                            <label>Nombres</label>

                            <input
                                name="nombres"
                                value={form.nombres}
                                onChange={cambiar}
                            />

                        </div>

                        <div>

                            <label>Apellidos</label>

                            <input
                                name="apellidos"
                                value={form.apellidos}
                                onChange={cambiar}
                            />

                        </div>

                        <div>

                            <label>Rol</label>

                            <select
                                name="rol"
                                value={form.rol}
                                onChange={cambiar}
                            >

                                <option>

                                    Administrador

                                </option>

                                <option>

                                    Empleado

                                </option>

                            </select>

                        </div>

                        <div>

                            <label>Contraseña</label>

                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={cambiar}
                            />

                        </div>

                        <div>

                            <label>

                                Repetir contraseña

                            </label>

                            <input
                                type="password"
                                name="repetirPassword"
                                value={form.repetirPassword}
                                onChange={cambiar}
                            />

                        </div>

                    </div>

                </div>

                <div className="modal-footer">

                    <button
                        className="icon-btn"
                        onClick={() => onGuardar(form)}
                    >

                        {/* ICONO GUARDAR */}

                    </button>

                    <button
                        className="icon-btn"
                    >

                        {/* ICONO RESET */}

                    </button>

                    <button
                        className="icon-btn"
                    >

                        {/* ICONO BLOQUEAR */}

                    </button>

                    <button
                        className="icon-btn"
                        onClick={onClose}
                    >

                        {/* ICONO CERRAR */}

                    </button>

                </div>

            </div>

        </div>

    );

}