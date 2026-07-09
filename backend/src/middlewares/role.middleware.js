export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'Administrador') {
    return res.status(403).json({ mensaje: 'Acceso permitido solo para Administrador' });
  }
  next();
};
