// Backend con JWT, persistencia (db.json) y bcrypt
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Configuración de entorno
const JWT_SECRET = "mi_clave_super_secreta_2026";
const DB_PATH = path.join(__dirname, "db.json");

// Lee la base de datos o retorna estructura vacía si falla
function leerDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { users: [], tasks: [] };
  }
}

// Guarda los datos en db.json con indentación legible
function escribirDB(datos) {
  fs.writeFileSync(DB_PATH, JSON.stringify(datos, null, 2), "utf-8");
}

// Middlewares globales
app.use(cors());
app.use(express.json());

// Middleware: Verifica validez del token JWT en rutas protegidas
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Se requiere token." });

  const token = authHeader.split(" ")[1];
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

// POST /register - Registra usuario con contraseña hasheada
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Email y password requeridos." });
  if (password.length < 6) return res.status(400).json({ error: "Contraseña min. 6 caracteres." });

  const db = leerDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Correo ya registrado." });
  }

  // Hashea la contraseña antes de guardarla (10 rondas)
  const passwordHash = await bcrypt.hash(password, 10);
  const nuevoId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;

  const nuevoUsuario = { id: nuevoId, email, password: passwordHash };
  db.users.push(nuevoUsuario);
  escribirDB(db);

  res.status(201).json({ message: "Usuario registrado.", user: { id: nuevoId, email } });
});

// POST /login - Verifica credenciales y devuelve JWT
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y password requeridos." });

  const db = leerDB();
  const usuario = db.users.find(u => u.email === email);
  if (!usuario) return res.status(400).json({ error: "Credenciales incorrectas." });

  // Compara contraseña en texto plano con el hash guardado
  const passwordCorrecta = await bcrypt.compare(password, usuario.password);
  if (!passwordCorrecta) return res.status(400).json({ error: "Credenciales incorrectas." });

  const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ accessToken: token });
});

// GET /tasks - Lista tareas del usuario autenticado
app.get("/tasks", verificarToken, (req, res) => {
  const db = leerDB();
  res.json(db.tasks.filter(t => t.userId === req.usuario.id));
});

// POST /tasks - Crea nueva tarea
app.post("/tasks", verificarToken, (req, res) => {
  const { title, completed } = req.body;
  if (!title || title.trim() === "") return res.status(400).json({ error: "Título requerido." });

  const db = leerDB();
  const nuevoId = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1;

  const nuevaTarea = {
    id: nuevoId,
    title: title.trim(),
    completed: completed ?? false,
    userId: req.usuario.id
  };

  db.tasks.push(nuevaTarea);
  escribirDB(db);
  res.status(201).json(nuevaTarea);
});

// PATCH /tasks/:id - Actualiza estado o título de tarea
app.patch("/tasks/:id", verificarToken, (req, res) => {
  const db = leerDB();
  const task = db.tasks.find(t => t.id === parseInt(req.params.id) && t.userId === req.usuario.id);

  if (!task) return res.status(404).json({ error: "Tarea no encontrada." });

  const { title, completed } = req.body;
  if (title !== undefined) task.title = title.trim();
  if (completed !== undefined) task.completed = Boolean(completed);

  escribirDB(db);
  res.json(task);
});

// DELETE /tasks/:id - Elimina tarea
app.delete("/tasks/:id", verificarToken, (req, res) => {
  const db = leerDB();
  const index = db.tasks.findIndex(t => t.id === parseInt(req.params.id) && t.userId === req.usuario.id);

  if (index === -1) return res.status(404).json({ error: "Tarea no encontrada." });

  const eliminada = db.tasks.splice(index, 1)[0];
  escribirDB(db);
  res.json({ message: "Tarea eliminada.", task: eliminada });
});

// GET / - UI y documentación (Pública)
app.get("/", (req, res) => {
  // Genera token de prueba para la vista HTML
  const tokenPrueba = jwt.sign(
    { id: 1, email: "ver db.json para el usuario real" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Task Manager API</title>
      <style>
        body { font-family: monospace; background: #0f0f13; color: #e8e8f0; padding: 2rem; max-width: 860px; margin: 0 auto; }
        h1   { color: #FA5C5C; font-size: 1.4rem; }
        h2   { color: #FD8A6B; font-size: 1rem; margin-top: 2rem; }
        .badge-pub  { background: #3dd68c22; color: #3dd68c; border: 1px solid #3dd68c44; border-radius: 5px; padding: 2px 8px; font-size: .8rem; }
        .badge-prot { background: #FA5C5C22; color: #FA5C5C; border: 1px solid #FA5C5C44; border-radius: 5px; padding: 2px 8px; font-size: .8rem; }
        table { width: 100%; border-collapse: collapse; margin-top: .8rem; }
        td, th { padding: .5rem .8rem; border: 1px solid #2e2e3d; text-align: left; }
        th { background: #18181f; color: #a0a0b0; font-size: .8rem; }
        .box { background: #18181f; border: 1px solid #2e2e3d; border-radius: 10px; padding: 1.2rem; margin-top: 1.5rem; }
        .token { word-break: break-all; color: #8b85ff; font-size: .8rem; cursor: pointer; }
        .token:hover { color: #3dd68c; }
        code { background: #22222c; padding: 2px 6px; border-radius: 4px; color: #FEC288; }
        small { color: #666; }
      </style>
    </head>
    <body>
      <h1>📋 Task Manager API</h1>
      <p>Servidor corriendo · <code>http://localhost:${PORT}</code></p>
      <div class="box">
        <h2>📌 Endpoints</h2>
        <table>
          <tr><th>Método</th><th>Ruta</th><th>Descripción</th><th>Acceso</th></tr>
          <tr><td>POST</td><td>/register</td><td>Registrar nuevo usuario</td><td><span class="badge-pub">Pública</span></td></tr>
          <tr><td>POST</td><td>/login</td><td>Obtener token JWT</td><td><span class="badge-pub">Pública</span></td></tr>
          <tr><td>GET</td><td>/tasks</td><td>Ver mis tareas</td><td><span class="badge-prot">Token requerido</span></td></tr>
          <tr><td>POST</td><td>/tasks</td><td>Crear tarea</td><td><span class="badge-prot">Token requerido</span></td></tr>
          <tr><td>PATCH</td><td>/tasks/:id</td><td>Actualizar tarea</td><td><span class="badge-prot">Token requerido</span></td></tr>
          <tr><td>DELETE</td><td>/tasks/:id</td><td>Eliminar tarea</td><td><span class="badge-prot">Token requerido</span></td></tr>
        </table>
      </div>
      <div class="box">
        <h2>🧪 Probar en consola (F12)</h2>
        <small>Primero regístrate, luego haz login para obtener tu token real:</small>
        <br><br>
        <div class="token" onclick="navigator.clipboard.writeText(this.innerText.trim())">
// 1. Registrar usuario
fetch('http://localhost:3000/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'nuevo@test.com', password: '123456' })
}).then(r => r.json()).then(console.log)

// 2. Login (copia el accessToken del resultado)
fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'nuevo@test.com', password: '123456' })
}).then(r => r.json()).then(console.log)
        </div>
        <small>👆 Click para copiar</small>
      </div>
    </body>
    </html>
  `);
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`✅ Task Manager API corriendo en http://localhost:${PORT}`);
  console.log(`   POST   /register    ← registrar usuario (pública)`);
  console.log(`   POST   /login       ← obtener token (pública)`);
  console.log(`   GET    /tasks       ← ver tareas (protegida)`);
  console.log(`   POST   /tasks       ← crear tarea (protegida)`);
  console.log(`   PATCH  /tasks/:id   ← actualizar (protegida)`);
  console.log(`   DELETE /tasks/:id   ← eliminar (protegida)\n`);
});