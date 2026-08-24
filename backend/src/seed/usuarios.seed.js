import bcrypt from "bcryptjs";

import Usuario from "../models/Usuario.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


export async function seedUsuarios() {

  try {

    let admin =
      await Usuario.findOne({
        usuario: "admin",
      });


    /* =========================================
       CREAR ADMIN SI NO EXISTE
    ========================================= */

    if (!admin) {

      const codigo =
        await generarConsecutivo(
          "usuarios",
          "USER"
        );

      admin =
        await Usuario.create({

          codigo,

          documento:
            "000000001",

          nombres:
            "Administrador",

          apellidos:
            "WebBuys",

          usuario:
            "admin",

          password:
            await bcrypt.hash(
              "123456",
              10
            ),

          rol:
            "Administrador",

          estado:
            "Activo",

          debeCambiarPassword:
            false,
        });


      console.log(
        `✅ Usuario administrador creado: ${codigo}`
      );

      return;
    }


    /* =========================================
       ACTUALIZAR ADMIN EXISTENTE
    ========================================= */

    let actualizado = false;


    /* =========================================
       ASIGNAR CONSECUTIVO SI NO TIENE
    ========================================= */

    if (!admin.codigo) {

      admin.codigo =
        await generarConsecutivo(
          "usuarios",
          "USER"
        );

      actualizado = true;

    }


    /* =========================================
       DOCUMENTO
    ========================================= */

    if (!admin.documento) {

      admin.documento =
        "000000001";

      actualizado = true;

    }


    /* =========================================
       DATOS BÁSICOS
    ========================================= */

    if (!admin.nombres) {

      admin.nombres =
        "Administrador";

      actualizado = true;

    }


    if (!admin.apellidos) {

      admin.apellidos =
        "WebBuys";

      actualizado = true;

    }


    if (!admin.rol) {

      admin.rol =
        "Administrador";

      actualizado = true;

    }


    if (!admin.estado) {

      admin.estado =
        "Activo";

      actualizado = true;

    }


    if (
      typeof admin.debeCambiarPassword !==
      "boolean"
    ) {

      admin.debeCambiarPassword =
        false;

      actualizado = true;

    }


    /* =========================================
       GUARDAR SOLO SI HUBO CAMBIOS
    ========================================= */

    if (actualizado) {

      await admin.save();

      console.log(
        `✅ Usuario administrador actualizado: ${admin.codigo}`
      );

    } else {

      console.log(
        `ℹ️ Usuario administrador ya existe y está actualizado: ${admin.codigo}`
      );

    }


  } catch (error) {

    console.error(
      "❌ Error creando/actualizando usuario administrador:",
      error.message
    );

  }

}