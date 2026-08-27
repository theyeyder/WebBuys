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
   NORMALIZAR REGLAS DE PRECIO
========================================= */

function normalizarReglasPrecio(
  reglas = []
) {

  if (!Array.isArray(reglas)) {
    return [];
  }

  return reglas
    .map((regla) => ({
      desde:
        Number(
          regla.desde || 0
        ),

      precio:
        Number(
          regla.precio || 0
        ),
    }))
    .filter(
      (regla) =>
        Number.isFinite(
          regla.desde
        ) &&
        Number.isFinite(
          regla.precio
        ) &&
        regla.desde > 0 &&
        regla.precio >= 0
    )
    .sort(
      (a, b) =>
        a.desde - b.desde
    );

}


/* =========================================
   VALIDAR REGLAS
========================================= */

function validarReglasPrecio(
  reglas = []
) {

  if (!Array.isArray(reglas)) {
    return "Las reglas de precio no son válidas.";
  }

  const cantidades =
    new Set();

  for (const regla of reglas) {

    const desde =
      Number(regla.desde);

    const precio =
      Number(regla.precio);


    if (
      !Number.isFinite(desde) ||
      desde <= 0
    ) {
      return "La cantidad mínima de una regla debe ser mayor que cero.";
    }


    if (
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      return "El precio de una regla no es válido.";
    }


    if (
      cantidades.has(desde)
    ) {
      return `Ya existe una regla desde ${desde}.`;
    }


    cantidades.add(
      desde
    );

  }

  return null;
}


/* =========================================
   PRESENTACIONES ADICIONALES
========================================= */

function normalizarPresentacionesAdicionales(
  presentaciones = []
) {

  if (!Array.isArray(presentaciones)) {
    return [];
  }

  return presentaciones
    .filter(
      (presentacion) =>
        presentacion.nombre
          ?.trim()
    )
    .map(
      (presentacion) => ({

        nombre:
          presentacion.nombre
            .trim(),

        tipoVenta:
          presentacion.tipoVenta ===
          "Peso"
            ? "Peso"
            : "Unidad",

        unidad:
          presentacion.unidad
            ?.trim() ||
          "Unidad",

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

        reglasPrecio:
          normalizarReglasPrecio(
            presentacion.reglasPrecio ||
            []
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
   VALIDAR PRESENTACIONES ADICIONALES
========================================= */

function validarPresentacionesAdicionales(
  presentaciones = []
) {

  if (!Array.isArray(presentaciones)) {
    return "Las presentaciones adicionales no son válidas.";
  }


  for (
    const presentacion
    of presentaciones
  ) {

    if (
      !presentacion.nombre?.trim()
    ) {
      return "Toda presentación adicional debe tener nombre.";
    }


    if (
      !presentacion.unidad?.trim()
    ) {
      return "Toda presentación adicional debe tener unidad.";
    }


    const precioCompra =
      Number(
        presentacion.precioCompra ||
        0
      );

    const precioVenta =
      Number(
        presentacion.precioVenta
      );

    const stock =
      Number(
        presentacion.stock ||
        0
      );

    const stockMinimo =
      Number(
        presentacion.stockMinimo ||
        0
      );


    if (
      !Number.isFinite(
        precioCompra
      ) ||
      precioCompra < 0
    ) {
      return "El valor unitario de una presentación no es válido.";
    }


    if (
      !Number.isFinite(
        precioVenta
      ) ||
      precioVenta < 0
    ) {
      return "El precio de venta de una presentación no es válido.";
    }


    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return "El stock de una presentación no es válido.";
    }


    if (
      !Number.isFinite(
        stockMinimo
      ) ||
      stockMinimo < 0
    ) {
      return "El stock mínimo de una presentación no es válido.";
    }


    const errorReglas =
      validarReglasPrecio(
        presentacion.reglasPrecio ||
        []
      );


    if (errorReglas) {
      return errorReglas;
    }

  }


  return null;
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

        tipoVenta,
        unidad,

        precioCompra,
        precioVenta,

        stock,
        stockMinimo,

        reglasPrecio = [],

        presentacionesAdicionales = [],

        sabores = [],

        imagen = "",
      } = req.body;


      /* DATOS OBLIGATORIOS */

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


      if (!unidad?.trim()) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar una unidad.",
        });

      }


      const precioCompraNumero =
        Number(
          precioCompra || 0
        );

      const precioVentaNumero =
        Number(
          precioVenta
        );

      const stockNumero =
        Number(
          stock || 0
        );

      const stockMinimoNumero =
        Number(
          stockMinimo || 0
        );


      if (
        !Number.isFinite(
          precioCompraNumero
        ) ||
        precioCompraNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El valor unitario no es válido.",
        });

      }


      if (
        !Number.isFinite(
          precioVentaNumero
        ) ||
        precioVentaNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El precio de venta no es válido.",
        });

      }


      if (
        !Number.isFinite(
          stockNumero
        ) ||
        stockNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El stock inicial no es válido.",
        });

      }


      if (
        !Number.isFinite(
          stockMinimoNumero
        ) ||
        stockMinimoNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El stock mínimo no es válido.",
        });

      }


      /* CATEGORÍA */

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
            "No puedes crear productos en una categoría inactiva.",
        });

      }


      /* DUPLICADO */

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
            "Ya existe un producto con ese nombre dentro de esta categoría.",
        });

      }


      /* REGLAS */

      const errorReglas =
        validarReglasPrecio(
          reglasPrecio
        );


      if (errorReglas) {

        return res.status(400).json({
          mensaje:
            errorReglas,
        });

      }


      /* PRESENTACIONES ADICIONALES */

      const errorPresentaciones =
        validarPresentacionesAdicionales(
          presentacionesAdicionales
        );


      if (errorPresentaciones) {

        return res.status(400).json({
          mensaje:
            errorPresentaciones,
        });

      }


      /* CONSECUTIVO */

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
            marca?.trim() ||
            "",

          descripcion:
            descripcion?.trim() ||
            "",


          /* VENTA PRINCIPAL */

          tipoVenta:
            tipoVenta === "Peso"
              ? "Peso"
              : "Unidad",

          unidad:
            unidad.trim(),


          /* PRECIOS */

          precioCompra:
            precioCompraNumero,

          precioVenta:
            precioVentaNumero,


          /* INVENTARIO */

          stock:
            stockNumero,

          stockMinimo:
            stockMinimoNumero,


          /* REGLAS */

          reglasPrecio:
            normalizarReglasPrecio(
              reglasPrecio
            ),


          /* PRESENTACIONES */

          presentacionesAdicionales:
            normalizarPresentacionesAdicionales(
              presentacionesAdicionales
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


      const {
        nombre,
        categoria,
        marca,
        descripcion,

        tipoVenta,
        unidad,

        precioCompra,
        precioVenta,

        stock,
        stockMinimo,

        reglasPrecio = [],

        presentacionesAdicionales = [],

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


      if (!unidad?.trim()) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar una unidad.",
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
            $ne:
              producto._id,
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
            "Ya existe otro producto con ese nombre dentro de esta categoría.",
        });

      }


      const precioCompraNumero =
        Number(
          precioCompra || 0
        );

      const precioVentaNumero =
        Number(
          precioVenta
        );

      const stockNumero =
        Number(
          stock || 0
        );

      const stockMinimoNumero =
        Number(
          stockMinimo || 0
        );


      if (
        !Number.isFinite(
          precioCompraNumero
        ) ||
        precioCompraNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El valor unitario no es válido.",
        });

      }


      if (
        !Number.isFinite(
          precioVentaNumero
        ) ||
        precioVentaNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El precio de venta no es válido.",
        });

      }


      const errorReglas =
        validarReglasPrecio(
          reglasPrecio
        );


      if (errorReglas) {

        return res.status(400).json({
          mensaje:
            errorReglas,
        });

      }


      const errorPresentaciones =
        validarPresentacionesAdicionales(
          presentacionesAdicionales
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
        marca?.trim() ||
        "";

      producto.descripcion =
        descripcion?.trim() ||
        "";

      producto.tipoVenta =
        tipoVenta === "Peso"
          ? "Peso"
          : "Unidad";

      producto.unidad =
        unidad.trim();

      producto.precioCompra =
        precioCompraNumero;

      producto.precioVenta =
        precioVentaNumero;

      producto.stock =
        stockNumero;

      producto.stockMinimo =
        stockMinimoNumero;

      producto.reglasPrecio =
        normalizarReglasPrecio(
          reglasPrecio
        );

      producto.presentacionesAdicionales =
        normalizarPresentacionesAdicionales(
          presentacionesAdicionales
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
   ACTIVAR / DESACTIVAR
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
   ELIMINAR
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