const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Datos en memoria
let tasks = [
  { id: 1, title: "Estudiar Web APIs", completed: false },
  { id: 2, title: "Leer documentación de Express", completed: true },
];

let nextId = 3;

// GET /tasks - Obtener todas las tareas
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// POST /tasks - Crear nueva tarea
app.post("/tasks", (req, res) => {
  const { title, completed } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "El campo 'title' es requerido." });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    completed: completed ?? false,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PATCH /tasks/:id - Actualizar tarea (título y/o completed)
app.patch("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Tarea con id ${id} no encontrada.` });
  }

  const { title, completed } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "El campo 'title' no puede estar vacío." });
    }
    task.title = title.trim();
  }

  if (completed !== undefined) {
    task.completed = Boolean(completed);
  }

  res.json(task);
});

// DELETE /tasks/:id - Eliminar tarea por ID
app.delete("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Tarea con id ${id} no encontrada.` });
  }

  const deleted = tasks.splice(index, 1)[0];
  res.json({ message: "Tarea eliminada correctamente.", task: deleted });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Task Manager API corriendo en http://localhost:${PORT}`);
  console.log(`   GET    http://localhost:${PORT}/tasks`);
  console.log(`   POST   http://localhost:${PORT}/tasks`);
  console.log(`   PATCH  http://localhost:${PORT}/tasks/:id`);
  console.log(`   DELETE http://localhost:${PORT}/tasks/:id`);
});