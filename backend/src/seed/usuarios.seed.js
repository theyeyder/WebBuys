import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

export async function seedUsuarios() {
  try {
    let admin = await Usuario.findOne({
      usuario: "admin",
    });

    /* =========================================
       CREAR ADMIN SI NO EXISTE
    ========================================= */

    if (!admin) {
      admin = await Usuario.create({
        documento: "000000001",
        nombres: "Administrador",
        apellidos: "WebBuys",
        usuario: "admin",

        password: await bcrypt.hash(
          "123456",
          10
        ),

        rol: "Administrador",
        estado: "Activo",
        debeCambiarPassword: false,
      });

      console.log(
        "✅ Usuario administrador creado."
      );

      return;
    }

    /* =========================================
       ACTUALIZAR ADMIN EXISTENTE
       SI LE FALTA DOCUMENTO
    ========================================= */

    let actualizado = false;

    if (!admin.documento) {
      admin.documento = "000000001";
      actualizado = true;
    }

    /* =========================================
       ASEGURAR DATOS BÁSICOS DEL ADMIN
    ========================================= */

    if (!admin.nombres) {
      admin.nombres = "Administrador";
      actualizado = true;
    }

    if (!admin.apellidos) {
      admin.apellidos = "WebBuys";
      actualizado = true;
    }

    if (!admin.rol) {
      admin.rol = "Administrador";
      actualizado = true;
    }

    if (!admin.estado) {
      admin.estado = "Activo";
      actualizado = true;
    }

    if (
      typeof admin.debeCambiarPassword !==
      "boolean"
    ) {
      admin.debeCambiarPassword = false;
      actualizado = true;
    }

    /* =========================================
       GUARDAR SOLO SI HUBO CAMBIOS
    ========================================= */

    if (actualizado) {
      await admin.save();

      console.log(
        "✅ Usuario administrador actualizado."
      );
    } else {
      console.log(
        "ℹ️ Usuario administrador ya existe y está actualizado."
      );
    }

  } catch (error) {
    console.error(
      "❌ Error creando/actualizando usuario administrador:",
      error.message
    );
  }
}