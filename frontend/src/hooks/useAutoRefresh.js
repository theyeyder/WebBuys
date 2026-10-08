import {
  useEffect,
  useRef,
} from "react";

import {
  suscribirseCambiosDatos,
} from "../utils/dataSync.js";

export default function useAutoRefresh(
  callback,
  {
    intervalMs = 15000,
    onDataChange = true,
    onFocus = true,
    onVisibility = true,
    shouldRefresh = null,
  } = {}
) {
  const callbackRef =
    useRef(callback);

  const shouldRefreshRef =
    useRef(shouldRefresh);

  const ejecutandoRef =
    useRef(false);

  const pendienteRef =
    useRef(false);

  const timerRef =
    useRef(null);

  useEffect(() => {
    callbackRef.current =
      callback;
  }, [callback]);

  useEffect(() => {
    shouldRefreshRef.current =
      shouldRefresh;
  }, [shouldRefresh]);

  useEffect(() => {
    let activo = true;

    async function refrescar() {
      if (!activo) return;

      if (ejecutandoRef.current) {
        pendienteRef.current = true;
        return;
      }

      ejecutandoRef.current = true;

      try {
        await callbackRef.current?.();
      } catch (error) {
        console.error(
          "No fue posible actualizar automáticamente el módulo:",
          error
        );
      } finally {
        ejecutandoRef.current = false;

        if (
          activo &&
          pendienteRef.current
        ) {
          pendienteRef.current = false;

          clearTimeout(
            timerRef.current
          );

          timerRef.current =
            setTimeout(
              refrescar,
              250
            );
        }
      }
    }

    function programarRefresco() {
      clearTimeout(
        timerRef.current
      );

      timerRef.current =
        setTimeout(
          refrescar,
          250
        );
    }

    function manejarFocus() {
      if (onFocus) {
        programarRefresco();
      }
    }

    function manejarVisibilidad() {
      if (
        onVisibility &&
        document.visibilityState ===
          "visible"
      ) {
        programarRefresco();
      }
    }

    const desuscribir =
      onDataChange
        ? suscribirseCambiosDatos(
            (detalle) => {
              const filtro =
                shouldRefreshRef.current;

              if (
                typeof filtro ===
                  "function" &&
                !filtro(detalle)
              ) {
                return;
              }

              programarRefresco();
            }
          )
        : () => {};

    if (onFocus) {
      window.addEventListener(
        "focus",
        manejarFocus
      );
    }

    if (onVisibility) {
      document.addEventListener(
        "visibilitychange",
        manejarVisibilidad
      );
    }

    const intervalId =
      intervalMs > 0
        ? setInterval(() => {
            if (
              document.visibilityState ===
              "visible"
            ) {
              refrescar();
            }
          }, intervalMs)
        : null;

    return () => {
      activo = false;

      clearTimeout(
        timerRef.current
      );

      if (intervalId) {
        clearInterval(
          intervalId
        );
      }

      desuscribir();

      window.removeEventListener(
        "focus",
        manejarFocus
      );

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );
    };
  }, [
    intervalMs,
    onDataChange,
    onFocus,
    onVisibility,
  ]);
}
