import { createPortal } from "react-dom";

export default function Toast({
  mensaje,
  error,
  className = "",
}) {
  if (!mensaje && !error) return null;

  return createPortal(
    <div
      className={`webbuys-toast ${
        error
          ? "webbuys-toast-error"
          : "webbuys-toast-success"
      } ${className}`}
      role="status"
    >
      {error || mensaje}
    </div>,
    document.body
  );
}