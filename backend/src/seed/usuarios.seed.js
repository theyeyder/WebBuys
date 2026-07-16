import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

export async function seedUsuarios() {
  try {
    const adminExiste = await Usuario.findOne({ usuario: "admin" });

    if (!adminExiste) {
      await Usuario.create({
        nombres: "Administrador",
        apellidos: "WebBuys",
        usuario: "admin",
        password: await bcrypt.hash("123456", 10),
        rol: "Administrador",
        estado: "Activo",
        debeCambiarPassword: false,
      });

      console.log("✅ Usuario administrador creado.");
    } else {
      console.log("ℹ️ Usuario administrador ya existe.");
    }
  } catch (error) {
    console.error("❌ Error creando usuarios iniciales:", error.message);
  }
}
