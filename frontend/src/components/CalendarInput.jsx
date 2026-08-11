import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/calendar.css";

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

const DIAS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function fechaInput(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fechaVisible(value) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

export default function CalendarInput({
  name,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
}) {
  const containerRef = useRef(null);

  const fechaInicial = value
    ? new Date(`${value}T00:00:00`)
    : new Date();

  const [abierto, setAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(
    fechaInicial.getMonth()
  );
  const [anioActual, setAnioActual] = useState(
    fechaInicial.getFullYear()
  );

  useEffect(() => {
    function cerrar(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", cerrar);

    return () => {
      document.removeEventListener("mousedown", cerrar);
    };
  }, []);

  const diasCalendario = useMemo(() => {
    const primerDia = new Date(
      anioActual,
      mesActual,
      1
    );

    const ultimoDia = new Date(
      anioActual,
      mesActual + 1,
      0
    );

    let inicioSemana = primerDia.getDay();

    // Convertir domingo=0 a lunes=0
    inicioSemana =
      inicioSemana === 0 ? 6 : inicioSemana - 1;

    const diasMesAnterior = new Date(
      anioActual,
      mesActual,
      0
    ).getDate();

    const resultado = [];

    for (let i = inicioSemana - 1; i >= 0; i--) {
      resultado.push({
        dia: diasMesAnterior - i,
        fueraMes: true,
        fecha: new Date(
          anioActual,
          mesActual - 1,
          diasMesAnterior - i
        ),
      });
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      resultado.push({
        dia,
        fueraMes: false,
        fecha: new Date(
          anioActual,
          mesActual,
          dia
        ),
      });
    }

    let siguiente = 1;

    while (resultado.length < 42) {
      resultado.push({
        dia: siguiente,
        fueraMes: true,
        fecha: new Date(
          anioActual,
          mesActual + 1,
          siguiente
        ),
      });

      siguiente++;
    }

    return resultado;
  }, [mesActual, anioActual]);

  function anterior() {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual((actual) => actual - 1);
    } else {
      setMesActual((actual) => actual - 1);
    }
  }

  function siguiente() {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual((actual) => actual + 1);
    } else {
      setMesActual((actual) => actual + 1);
    }
  }

  function seleccionar(fecha) {
    onChange({
      target: {
        name,
        value: fechaInput(fecha),
        type: "date",
      },
    });

    setMesActual(fecha.getMonth());
    setAnioActual(fecha.getFullYear());
    setAbierto(false);
  }

  function hoy() {
    const fecha = new Date();

    seleccionar(fecha);
  }

  return (
    <div
      className="wb-calendar-input"
      ref={containerRef}
    >
      <button
        type="button"
        className="wb-date-trigger"
        onClick={() => setAbierto((actual) => !actual)}
      >
        <span
          className={
            value
              ? "wb-date-value"
              : "wb-date-placeholder"
          }
        >
          {value
            ? fechaVisible(value)
            : placeholder}
        </span>

        <span className="wb-date-symbol">
          ▦
        </span>
      </button>

      {abierto && (
        <div className="wb-calendar">
          <div className="wb-calendar-header">
            <button
              type="button"
              className="wb-calendar-arrow"
              onClick={anterior}
            >
              ‹
            </button>

            <strong>
              {MESES[mesActual]} {anioActual}
            </strong>

            <button
              type="button"
              className="wb-calendar-arrow"
              onClick={siguiente}
            >
              ›
            </button>

            <button
              type="button"
              className="wb-calendar-today"
              onClick={hoy}
            >
              HOY
            </button>
          </div>

          <div className="wb-calendar-week">
            {DIAS.map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>

          <div className="wb-calendar-grid">
            {diasCalendario.map(
              ({ dia, fecha, fueraMes }, index) => {
                const fechaValor =
                  fechaInput(fecha);

                const seleccionado =
                  value === fechaValor;

                return (
                  <button
                    key={`${fechaValor}-${index}`}
                    type="button"
                    className={[
                      "wb-calendar-day",
                      fueraMes ? "outside" : "",
                      seleccionado ? "selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      seleccionar(fecha)
                    }
                  >
                    {dia}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}