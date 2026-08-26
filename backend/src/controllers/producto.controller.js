import Producto
  from "../models/Producto.js";

import Categoria
  from "../models/Categoria.js";

import Consecutivo
  from "../models/Consecutivo.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


/* =========================================
   LISTAR PRODUCTOS
========================================= */

export const listarProductos =
  async (req, res) => {

    try {

      const productos =
        await Producto.find()
          .populate(
            "categoria",
            "codigo nombre estado"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(
        productos
      );

    } catch (error) {

      console.error(
        "Error listando productos:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible cargar los productos.",
      });

    }

  };


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

export const obtenerSiguienteCodigoProducto =
  async (req, res) => {

    try {

      const consecutivo =
        await Consecutivo.findOne({
          clave: "productos",
        });

      const siguiente =
        (consecutivo?.ultimoNumero || 0) + 1;

      const codigo =
        `PROD-${String(
          siguiente
        ).padStart(4, "0")}`;

      return res.json({
        codigo,
      });

    } catch (error) {

      console.error(
        "Error obteniendo código de producto:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener el siguiente código.",
      });

    }

  };


/* =========================================
   VALIDAR PRESENTACIONES
========================================= */

function validarPresentaciones(
  presentaciones
) {

  if (!Array.isArray(presentaciones)) {
    return "Las presentaciones no son válidas.";
  }


  for (
    const presentacion
    of presentaciones
  ) {

    if (
      !presentacion.nombre?.trim()
    ) {
      return "Toda presentación debe tener un nombre.";
    }


    if (
      !presentacion.unidad?.trim()
    ) {
      return "Toda presentación debe tener una unidad.";
    }


    const precioCompra =
      Number(
        presentacion.precioCompra || 0
      );

    const precioVenta =
      Number(
        presentacion.precioVenta
      );

    const stock =
      Number(
        presentacion.stock || 0
      );

    const stockMinimo =
      Number(
        presentacion.stockMinimo || 0
      );


    if (
      !Number.isFinite(precioVenta) ||
      precioVenta < 0
    ) {
      return "El precio de venta no es válido.";
    }


    if (
      !Number.isFinite(precioCompra) ||
      precioCompra < 0
    ) {
      return "El precio de compra no es válido.";
    }


    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return "El stock no es válido.";
    }


    if (
      !Number.isFinite(stockMinimo) ||
      stockMinimo < 0
    ) {
      return "El stock mínimo no es válido.";
    }

  }


  return null;
}


/* =========================================
   NORMALIZAR PRESENTACIONES
========================================= */

function normalizarPresentaciones(
  presentaciones = []
) {

  return presentaciones.map(
    (presentacion) => ({
      nombre:
        presentacion.nombre.trim(),

      unidad:
        presentacion.unidad.trim(),

      precioCompra:
        Number(
          presentacion.precioCompra ||
          0
        ),

      precioVenta:
        Number(
          presentacion.precioVenta ||
          0
        ),

      stock:
        Number(
          presentacion.stock ||
          0
        ),

      stockMinimo:
        Number(
          presentacion.stockMinimo ||
          0
        ),

      estado:
        presentacion.estado ===
        "Inactiva"
          ? "Inactiva"
          : "Activa",
    })
  );

}


/* =========================================
   NORMALIZAR SABORES
========================================= */

function normalizarSabores(
  sabores = []
) {

  if (!Array.isArray(sabores)) {
    return [];
  }


  return [
    ...new Set(
      sabores
        .map(
          (sabor) =>
            String(sabor)
              .trim()
        )
        .filter(Boolean)
    ),
  ];

}


/* =========================================
   CREAR PRODUCTO
========================================= */

export const crearProducto =
  async (req, res) => {

    try {

      const {
        nombre,
        categoria,
        marca,
        descripcion,
        presentaciones = [],
        sabores = [],
        imagen = "",
      } = req.body;


      if (!nombre?.trim()) {

        return res.status(400).json({
          mensaje:
            "El nombre del producto es obligatorio.",
        });

      }


      if (!categoria) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar una categoría.",
        });

      }


      const categoriaExiste =
        await Categoria.findById(
          categoria
        );


      if (!categoriaExiste) {

        return res.status(404).json({
          mensaje:
            "La categoría seleccionada no existe.",
        });

      }


      if (
        categoriaExiste.estado !==
        "Activa"
      ) {

        return res.status(400).json({
          mensaje:
            "No puedes asignar el producto a una categoría inactiva.",
        });

      }


      const nombreNormalizado =
        nombre.trim();


      const existe =
        await Producto.findOne({
          nombre: {
            $regex:
              `^${nombreNormalizado.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}$`,
            $options: "i",
          },

          categoria:
            categoriaExiste._id,
        });


      if (existe) {

        return res.status(400).json({
          mensaje:
            "Ya existe un producto con ese nombre en esta categoría.",
        });

      }


      const errorPresentaciones =
        validarPresentaciones(
          presentaciones
        );


      if (errorPresentaciones) {

        return res.status(400).json({
          mensaje:
            errorPresentaciones,
        });

      }


      const codigo =
        await generarConsecutivo(
          "productos",
          "PROD"
        );


      const producto =
        await Producto.create({
          codigo,

          nombre:
            nombreNormalizado,

          categoria:
            categoriaExiste._id,

          marca:
            marca?.trim() || "",

          descripcion:
            descripcion?.trim() || "",

          presentaciones:
            normalizarPresentaciones(
              presentaciones
            ),

          sabores:
            normalizarSabores(
              sabores
            ),

          imagen:
            imagen || "",

          estado:
            "Activo",

          creadoPor:
            req.usuario?._id ||
            null,
        });


      await producto.populate(
        "categoria",
        "codigo nombre estado"
      );


      return res
        .status(201)
        .json({
          mensaje:
            "Producto creado correctamente.",

          producto,
        });

    } catch (error) {

      console.error(
        "Error creando producto:",
        error
      );

      return res.status(500).json({
        mensaje:
          error.message ||
          "No fue posible crear el producto.",
      });

    }

  };


/* =========================================
   ACTUALIZAR PRODUCTO
========================================= */

export const actualizarProducto =
  async (req, res) => {

    try {

      const {
        nombre,
        categoria,
        marca,
        descripcion,
        presentaciones = [],
        sabores = [],
        imagen = "",
      } = req.body;


      const producto =
        await Producto.findById(
          req.params.id
        );


      if (!producto) {

        return res.status(404).json({
          mensaje:
            "Producto no encontrado.",
        });

      }


      if (!nombre?.trim()) {

        return res.status(400).json({
          mensaje:
            "El nombre del producto es obligatorio.",
        });

      }


      if (!categoria) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar una categoría.",
        });

      }


      const categoriaExiste =
        await Categoria.findById(
          categoria
        );


      if (!categoriaExiste) {

        return res.status(404).json({
          mensaje:
            "La categoría seleccionada no existe.",
        });

      }


      if (
        categoriaExiste.estado !==
        "Activa"
      ) {

        return res.status(400).json({
          mensaje:
            "La categoría seleccionada está inactiva.",
        });

      }


      const nombreNormalizado =
        nombre.trim();


      const duplicado =
        await Producto.findOne({
          _id: {
            $ne: producto._id,
          },

          nombre: {
            $regex:
              `^${nombreNormalizado.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}$`,
            $options: "i",
          },

          categoria:
            categoriaExiste._id,
        });


      if (duplicado) {

        return res.status(400).json({
          mensaje:
            "Ya existe otro producto con ese nombre en esta categoría.",
        });

      }


      const errorPresentaciones =
        validarPresentaciones(
          presentaciones
        );


      if (errorPresentaciones) {

        return res.status(400).json({
          mensaje:
            errorPresentaciones,
        });

      }


      producto.nombre =
        nombreNormalizado;

      producto.categoria =
        categoriaExiste._id;

      producto.marca =
        marca?.trim() || "";

      producto.descripcion =
        descripcion?.trim() || "";

      producto.presentaciones =
        normalizarPresentaciones(
          presentaciones
        );

      producto.sabores =
        normalizarSabores(
          sabores
        );

      producto.imagen =
        imagen || "";


      await producto.save();


      await producto.populate(
        "categoria",
        "codigo nombre estado"
      );


      return res.json({
        mensaje:
          "Producto actualizado correctamente.",

        producto,
      });

    } catch (error) {

      console.error(
        "Error actualizando producto:",
        error
      );

      return res.status(500).json({
        mensaje:
          error.message ||
          "No fue posible actualizar el producto.",
      });

    }

  };


/* =========================================
   ACTIVAR / DESACTIVAR PRODUCTO
========================================= */

export const cambiarEstadoProducto =
  async (req, res) => {

    try {

      const producto =
        await Producto.findById(
          req.params.id
        );


      if (!producto) {

        return res.status(404).json({
          mensaje:
            "Producto no encontrado.",
        });

      }


      producto.estado =
        producto.estado === "Activo"
          ? "Inactivo"
          : "Activo";


      await producto.save();


      return res.json({
        mensaje:
          producto.estado === "Activo"
            ? "Producto activado correctamente."
            : "Producto desactivado correctamente.",

        estado:
          producto.estado,
      });

    } catch (error) {

      console.error(
        "Error cambiando estado:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible cambiar el estado del producto.",
      });

    }

  };


/* =========================================
   ELIMINAR PRODUCTO
========================================= */

export const eliminarProducto =
  async (req, res) => {

    try {

      const producto =
        await Producto.findById(
          req.params.id
        );


      if (!producto) {

        return res.status(404).json({
          mensaje:
            "Producto no encontrado.",
        });

      }


      /*
       * Más adelante, cuando Pedidos y
       * Facturación estén implementados,
       * aquí validaremos que el producto
       * no tenga movimientos históricos.
       */


      await producto.deleteOne();


      return res.json({
        mensaje:
          "Producto eliminado correctamente.",
      });

    } catch (error) {

      console.error(
        "Error eliminando producto:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible eliminar el producto.",
      });

    }

  };