import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  prisma,
} from "../config/postgresql.js";


export async function login(
  req,
  res
) {

  try {

    const {
      usuario,
      password,
    } = req.body;


    if (
      !usuario ||
      !password
    ) {

      return res
        .status(400)
        .json({
          message:
            "Usuario y contraseña son obligatorios.",
        });

    }


    const usuarioNormalizado =
      String(usuario)
        .trim();


    /*
      PostgreSQL pasa a ser la fuente de autenticación.
      mode: "insensitive" mantiene el acceso aunque el
      usuario haya sido guardado en mayúsculas en MongoDB.
    */
    const user =
      await prisma.usuario.findFirst({
        where: {
          usuario: {
            equals:
              usuarioNormalizado,
            mode:
              "insensitive",
          },
        },
      });


    if (!user) {

      return res
        .status(401)
        .json({
          message:
            "Usuario o contraseña incorrectos",
        });

    }


    if (
      user.estado !==
      "Activo"
    ) {

      return res
        .status(401)
        .json({
          message:
            "El usuario se encuentra bloqueado.",
        });

    }


    const valido =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!valido) {

      return res
        .status(401)
        .json({
          message:
            "Usuario o contraseña incorrectos",
        });

    }


    await prisma.usuario.update({
      where: {
        id: user.id,
      },

      data: {
        ultimoIngreso:
          new Date(),
      },
    });


    /*
      El token ya usa el UUID de PostgreSQL.
      auth.middleware acepta también tokens Mongo antiguos
      durante la transición.
    */
    const token =
      jwt.sign(
        {
          id:
            user.id,

          rol:
            user.rol,
        },

        process.env.JWT_SECRET,

        {
          expiresIn:
            "8h",
        }
      );


    return res.json({
      token,

      user: {
        /*
          Se conserva la propiedad "id" esperada por
          el frontend. Ahora contiene el UUID PostgreSQL.
        */
        id:
          user.id,

        _id:
          user.id,

        codigo:
          user.codigo,

        nombres:
          user.nombres,

        apellidos:
          user.apellidos,

        usuario:
          user.usuario,

        rol:
          user.rol,

        estado:
          user.estado,

        debeCambiarPassword:
          user.debeCambiarPassword,
      },
    });

  } catch (error) {

    console.error(
      "Error login PostgreSQL:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          error.message,
      });

  }

}
