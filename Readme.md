# 📋 Task Manager API

Proyecto de la materia **Desarrollo Front-End** — Implementación de una Web API REST con autenticación JWT, consumida desde un frontend estático hosteado en GitHub Pages.

🌐 **Demo frontend:** [https://cesar-fex04.github.io/Task-Manager-API/FrontEnd/login.html](https://cesar-fex04.github.io/Task-Manager-API/FrontEnd/login.html)

---

## 📌 Descripción

**Task Manager API** es una aplicación web full-stack que permite gestionar tareas personales de forma segura. Implementa un flujo completo de autenticación con JWT: el usuario se registra, inicia sesión y recibe un token que se envía en cada petición para acceder a sus tareas protegidas.

El frontend consume la API mediante `fetch` y actualiza la interfaz dinámicamente sin recargar la página. Los datos se persisten en un archivo `db.json` en el servidor.

---

## ✨ Funcionalidades

### Autenticación
| Acción | Método HTTP | Endpoint | Acceso |
|---|---|---|---|
| Registrar nuevo usuario | `POST` | `/register` | Pública |
| Iniciar sesión (obtener JWT) | `POST` | `/login` | Pública |

### Tareas (requieren token JWT)
| Acción | Método HTTP | Endpoint | Acceso |
|---|---|---|---|
| Ver todas mis tareas | `GET` | `/tasks` | 🔒 Protegida |
| Agregar nueva tarea | `POST` | `/tasks` | 🔒 Protegida |
| Marcar / desmarcar completada | `PATCH` | `/tasks/:id` | 🔒 Protegida |
| Editar el título de una tarea | `PATCH` | `/tasks/:id` | 🔒 Protegida |
| Eliminar una tarea | `DELETE` | `/tasks/:id` | 🔒 Protegida |

---

## 🎯 Decisiones técnicas

### ISIP06 — Flujo completo de autenticación JWT
Se implementó la **Opción B** (Node.js + Express con JWT manual) en lugar de JSON Server Auth, ya que esta última no es compatible con Node.js v22. Esto permitió entender el proceso interno de JWT con mayor profundidad:

- `POST /register` → el backend hashea la contraseña con **bcrypt** y guarda el hash en `db.json`
- `POST /login` → el backend verifica con `bcrypt.compare()` y genera un token firmado con `jsonwebtoken`
- Cada ruta protegida pasa por el middleware `verificarToken()` que valida el JWT antes de responder

### ISIP05 — Almacenamiento del token: localStorage vs cookies httpOnly

Se eligió **localStorage** como estrategia de almacenamiento del token.

Para este proyecto escolar donde el frontend está en GitHub Pages y el backend corre localmente, **localStorage es la opción viable**. En un sistema de producción real se usarían cookies httpOnly.

### ISIP03 — Vulnerabilidades identificadas y soluciones propuestas

**Vulnerabilidad detectada: XSS en localStorage**

Si un atacante logra inyectar código JavaScript malicioso en la página (ataque XSS), puede robar el token con:
```javascript
// Código malicioso que un atacante podría ejecutar
localStorage.getItem("token");
```

**Solución propuesta para producción: Cookie httpOnly**
```
Set-Cookie: token=eyJhbG...; HttpOnly; Secure; SameSite=Strict
```
Una cookie `httpOnly` no puede ser accedida por JavaScript, por lo que un ataque XSS no puede robar el token. Solo el servidor puede leerla y enviarla. Esta es la práctica recomendada en sistemas reales.

---


> ⚠️ **GitHub Pages** solo hostea el frontend estático.
> El backend se ejecuta **localmente** con Node.js en `localhost:3000`.
> Esto es estándar en proyectos escolares donde la especificación indica `localhost`.

---

## ⚙️ Cómo correr el proyecto

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior

### 1 — Clonar el repositorio

```bash
git clone https://github.com/Cesar-Fex04/Task-Manager-API.git
cd Task-Manager-API
```

### 2 — Instalar dependencias e iniciar el backend

```bash
cd Backend
npm install
npm start
```

El servidor quedará corriendo en `http://localhost:3000` ✅

Puedes visitar `http://localhost:3000` en el navegador para ver los endpoints disponibles.
Se recomienda ver video tutorial para obtener token de prueba e  postman, depspues de haber creado un usuario

### 3 — Abrir el frontend

Abre `FrontEnd/login.html` con Live Server en VS Code, o visita la demo en GitHub Pages.
si usted intenta abrir `FrontEnd/index.html` directamente, lo devolvera al login.

### 4 — Crear tu cuenta

1. Ve a `register.html` y crea una cuenta con tu correo y contraseña
2. Inicia sesión en `login.html`
3. ¡Empieza a gestionar tus tareas!

---

## 🛠 Tecnologías utilizadas

| Capa | Tecnología | Propósito |
|---|---|---|
| Backend | Node.js + Express | Servidor HTTP y rutas REST |
| Autenticación | jsonwebtoken (JWT) | Generación y verificación de tokens |
| Seguridad | bcryptjs | Hash de contraseñas (unidireccional) |
| Persistencia | fs + db.json | Base de datos en archivo JSON |
| Frontend | HTML5 semántico | Estructura (`header`, `main`, `section`, `footer`) |
| Estilos | Bootstrap 5 + CSS personalizado | Diseño responsive |
| JavaScript | Vanilla JS con `fetch` | Consumo de la API sin frameworks |
| Hosting | GitHub Pages | Solo frontend estático |

---

## 👨‍💻 Autor

**Julio César Lopez** — Materia: Desarrollo Front-End · Semestre 8

