import Configuracion from '../models/Configuracion.js';

export const obtenerConfiguracion = async (req, res) => {
  let config = await Configuracion.findOne();
  if (!config) config = await Configuracion.create({});
  res.json(config);
};

export const actualizarConfiguracion = async (req, res) => {
  let config = await Configuracion.findOne();
  if (!config) config = await Configuracion.create(req.body);
  else config = await Configuracion.findByIdAndUpdate(config._id, req.body, { new: true });
  res.json(config);
};
