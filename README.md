# WebBuys

Sistema web para pedidos, clientes, productos, facturación, empleados y configuración para una empresa distribuidora de lácteos.

## Estilo UI

WebBuys usa una interfaz **Spatial Bento 3D**:

- Tarjetas tipo Bento Grid
- Profundidad visual
- Glassmorphism
- Sombras suaves
- Movimiento flotante 3D
- Paleta verde, blanco y azul oscuro
- Dashboard moderno tipo producto premium

## Base de datos MongoDB

La base de datos se llama:

```txt
WebBuys
```

Archivo de configuración:

```txt
backend/.env
```

```env
MONGO_URI=mongodb://127.0.0.1:27017/WebBuys
JWT_SECRET=webbuys_secret_key
PORT=4000
```

## Usuarios iniciales

```txt
Usuario: admin
Contraseña: 123456
Rol: Administrador
```

```txt
Usuario: empleado
Contraseña: 123456
Rol: Empleado
```

## Ejecutar backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

El backend corre en:

```txt
http://localhost:4000
```

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre normalmente en:

```txt
http://localhost:5173
```

## Módulos incluidos

- Login con usuario y contraseña
- Dashboard Spatial UI
- Clientes
- Categorías
- Productos
- Pedidos
- Facturación
- Empleados
- Configuración

## Roles

### Administrador

Acceso completo al sistema.

### Empleado

Acceso operativo. No administra empleados ni configuración.

## Tecnologías

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Bcrypt

### Frontend

- React
- Vite
- React Router
- Axios
- Framer Motion
- Lucide React
- CSS personalizado
