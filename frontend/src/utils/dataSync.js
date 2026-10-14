const EVENTO_DATOS = "webbuys:data-changed";
const CANAL_DATOS = "webbuys-data-sync";

let canal = null;

function obtenerCanal() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }

  if (!canal) {
    canal = new BroadcastChannel(CANAL_DATOS);
  }

  return canal;
}

export function notificarCambioDatos(detalle = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    ...detalle,
    fecha: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent(EVENTO_DATOS, {
      detail: payload,
    })
  );

  try {
    obtenerCanal()?.postMessage(payload);
  } catch {
    // La sincronización entre pestañas es complementaria.
  }
}

export function suscribirseCambiosDatos(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const manejarLocal = (event) => {
    callback(event?.detail || {});
  };

  window.addEventListener(
    EVENTO_DATOS,
    manejarLocal
  );

  const bc = obtenerCanal();

  const manejarCanal = (event) => {
    callback(event?.data || {});
  };

  if (bc) {
    bc.addEventListener(
      "message",
      manejarCanal
    );
  }

  return () => {
    window.removeEventListener(
      EVENTO_DATOS,
      manejarLocal
    );

    if (bc) {
      bc.removeEventListener(
        "message",
        manejarCanal
      );
    }
  };
}
