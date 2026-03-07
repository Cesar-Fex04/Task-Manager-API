# 📋 Task Manager API

Proyecto de la materia **Desarrollo Front-End** — Implementación de una Web API REST consumida desde un frontend estático.

🌐 **Demo en vivo:** [https://TU-USUARIO.github.io/task-manager-api/frontend/](https://TU-USUARIO.github.io/task-manager-api/frontend/)

---

## 📌 Descripción

**Task Manager API** es una aplicación web que permite gestionar una lista de tareas a través de una API REST desarrollada con Node.js y Express. El frontend consume la API mediante `fetch` y actualiza la interfaz dinámicamente sin recargar la página.

---

## ✨ Funcionalidades

| Acción | Método HTTP | Endpoint |
|---|---|---|
| Ver todas las tareas al cargar | `GET` | `/tasks` |
| Agregar nueva tarea | `POST` | `/tasks` |
| Marcar / desmarcar como completada | `PATCH` | `/tasks/:id` |
| Editar el título de una tarea | `PATCH` | `/tasks/:id` |
| Eliminar una tarea | `DELETE` | `/tasks/:id` |

---

## 🗂 Estructura del repositorio

```
task-manager-api/
│
├── backend/
│   ├── index.js          ← Servidor Express (API REST)
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── index.html        ← Interfaz principal (HTML semántico)
│   ├── css/
│   │   └── styles.css    ← Estilos personalizados
│   └── js/
│       └── app.js        ← Lógica fetch (GET, POST, PATCH, DELETE)
│
├── .gitignore
└── README.md
```

> ⚠️ **GitHub Pages** solo hostea el frontend estático.
> El backend se ejecuta **localmente** con Node.js según la especificación `localhost:3000`.

---

## ⚙️ Cómo correr el proyecto

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior

### 1 — Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/task-manager-api.git
cd task-manager-api
```

### 2 — Iniciar el backend

```bash
cd backend
npm install
npm start
```

El servidor quedará corriendo en `http://localhost:3000` ✅

### 3 — Abrir el frontend

Abre el archivo `frontend/index.html` directamente en tu navegador,
o visita la demo en GitHub Pages (el link está arriba).

---

## 🛠 Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Frontend | HTML5 semántico |
| Estilos | Bootstrap 5 + CSS personalizado |
| JavaScript | Vanilla JS con `fetch` |
| Hosting | GitHub Pages (solo frontend) |
| Datos | En memoria (arreglo JS) |

---

## 👨‍💻 Autor

**TU NOMBRE** — Materia: Desarrollo Front-End

[![GitHub](https://img.shields.io/badge/GitHub-TU--USUARIO-FA5C5C?style=flat&logo=github)](https://github.com/TU-USUARIO)