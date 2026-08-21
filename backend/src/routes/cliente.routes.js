import { clienteController } from "../controllers/cliente.controller.js";
import { crearRutasCRUD } from "./crudRoutes.js";

export default crearRutasCRUD(clienteController);