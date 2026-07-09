export const crearCRUD = (Modelo, populate = '') => ({
  listar: async (req, res) => {
    const datos = populate ? await Modelo.find().populate(populate).sort({ createdAt: -1 }) : await Modelo.find().sort({ createdAt: -1 });
    res.json(datos);
  },
  obtener: async (req, res) => {
    const dato = populate ? await Modelo.findById(req.params.id).populate(populate) : await Modelo.findById(req.params.id);
    if (!dato) return res.status(404).json({ mensaje: 'Registro no encontrado' });
    res.json(dato);
  },
  crear: async (req, res) => {
    const dato = await Modelo.create(req.body);
    res.status(201).json(dato);
  },
  actualizar: async (req, res) => {
    const dato = await Modelo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dato) return res.status(404).json({ mensaje: 'Registro no encontrado' });
    res.json(dato);
  },
  eliminar: async (req, res) => {
    const dato = await Modelo.findByIdAndDelete(req.params.id);
    if (!dato) return res.status(404).json({ mensaje: 'Registro no encontrado' });
    res.json({ mensaje: 'Registro eliminado correctamente' });
  }
});
