
const API_URL = "http://localhost:3000";

// Control de acceso: si no hay token, redirigimos a login
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

//Headers autenticados: incluyen el token JWT para acceder a rutas protegidas
function headersAuth() {
  return {
    "Content-Type": "application/json",
    // El token va aquí — el servidor lo valida antes de responder
    "Authorization": "Bearer " + token
  };
}

// ── Referencias al DOM 
const taskInput    = document.getElementById("task-input");
const addBtn       = document.getElementById("add-btn");
const taskList     = document.getElementById("task-list");
const emptyState   = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const taskCount    = document.getElementById("task-count");
const toastCont    = document.getElementById("toast-container");
const logoutBtn    = document.getElementById("logout-btn");
const userEmailEl  = document.getElementById("user-email");

// Mostrar el email del usuario en el header
if (userEmailEl) {
  userEmailEl.textContent = localStorage.getItem("userEmail") || "";
}

// ── Toast (notificaciones)
function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", info: "📌", warning: "⚠️" };
  const notif = document.createElement("div");
  notif.className = `notif ${type}`;
  notif.innerHTML = `<span>${icons[type] ?? "📌"}</span>${message}`;
  toastCont.appendChild(notif);
  setTimeout(() => {
    notif.style.transition = "opacity .3s";
    notif.style.opacity = "0";
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ── Escape XSS
function esc(str) {
  return str
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Renderizar lista
function renderTasks(tasks) {
  taskList.innerHTML = "";
  taskCount.textContent = tasks.length;

  if (tasks.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item${task.completed ? " completed" : ""}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <span class="task-id">#${task.id}</span>
      <span class="task-title">${esc(task.title)}</span>
      <span class="task-status ${task.completed ? "done" : "pending"}">
        ${task.completed ? "✔ Completada" : "⏳ Pendiente"}
      </span>
      <div class="task-actions">
        <button class="action-btn btn-complete" title="${task.completed ? "Desmarcar" : "Completar"}">
          ${task.completed ? "↩ Desmarcar" : "✔ Completar"}
        </button>
        <button class="action-btn btn-edit" title="Editar">✏ Editar</button>
        <button class="action-btn btn-delete" title="Eliminar">🗑 Eliminar</button>
      </div>
    `;

    li.querySelector(".btn-complete").addEventListener("click", () => toggleComplete(task.id, task.completed));
    li.querySelector(".btn-edit").addEventListener("click",    () => startEdit(li, task));
    li.querySelector(".btn-delete").addEventListener("click",  () => deleteTask(task.id));

    taskList.appendChild(li);
  });
}

// ── GET /tasks (con token) 
async function loadTasks() {
  loadingState.hidden = false;
  emptyState.hidden   = true;
  taskList.innerHTML  = "";

  try {
    /*
     Enviamos el token en el header Authorization.
     JSON Server Auth verifica el token y solo devuelve
     las tareas que pertenecen al usuario autenticado.
     */
    const res = await fetch(`${API_URL}/tasks`, {
      headers: headersAuth()
    });

    // Si el token expiró o es inválido, mandamos a login
    if (res.status === 401) {
      cerrarSesion();
      return;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Error al cargar tareas:", err);
    taskCount.textContent = 0;
    emptyState.hidden = false;
    showToast("No se pudo conectar con la API.", "error");
  } finally {
    loadingState.hidden = true;
  }
}

// ── POST /tasks (con token)
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    showToast("Escribe un título para la tarea.", "error");
    return;
  }

  addBtn.disabled = true;
  addBtn.innerHTML = "<span>⏳</span> Agregando…";

  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: headersAuth(),   // ← token incluido
      body: JSON.stringify({ title, completed: false })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    taskInput.value = "";
    taskInput.focus();
    showToast("Tarea agregada ✨", "success");
    await loadTasks();
  } catch (err) {
    showToast("Error al agregar la tarea.", "error");
  } finally {
    addBtn.disabled = false;
    addBtn.innerHTML = "<span>＋</span> Agregar tarea";
  }
}

// ── PATCH /tasks/:id — toggle completado (con token)
async function toggleComplete(id, currentState) {
  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: headersAuth(),   // ← token incluido
      body: JSON.stringify({ completed: !currentState })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast(
      currentState ? "Tarea desmarcada." : "Se ha completado la tarea ✔",
      currentState ? "info" : "success"
    );
    await loadTasks();
  } catch (err) {
    showToast("Error al actualizar la tarea.", "error");
  }
}

// Edición inline de título (con token)
function startEdit(li, task) {
  const titleSpan  = li.querySelector(".task-title");
  const actionsDiv = li.querySelector(".task-actions");
  const originalTitle = task.title;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-edit-input";
  input.value = task.title;
  input.maxLength = 120;
  titleSpan.replaceWith(input);
  input.focus();
  input.select();

  actionsDiv.innerHTML = `
    <button class="action-btn btn-save">💾 Guardar</button>
    <button class="action-btn btn-cancel">✕ Cancelar</button>
  `;

  actionsDiv.querySelector(".btn-save").addEventListener("click", () => saveEdit(li, task.id, input, originalTitle));
  actionsDiv.querySelector(".btn-cancel").addEventListener("click", () => loadTasks());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter")  saveEdit(li, task.id, input, originalTitle);
    if (e.key === "Escape") loadTasks();
  });
}

// ── PATCH /tasks/:id — actualizar título (con token)
async function saveEdit(li, id, input, originalTitle) {
  const newTitle = input.value.trim();
  if (!newTitle) { showToast("El título no puede estar vacío.", "error"); return; }
  if (newTitle === originalTitle) { loadTasks(); return; }

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: headersAuth(),   // ← token incluido
      body: JSON.stringify({ title: newTitle })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast("Tarea actualizada 📝", "success");
    await loadTasks();
  } catch (err) {
    showToast("Error al actualizar la tarea.", "error");
  }
}

// ── DELETE /tasks/:id (con token)
async function deleteTask(id) {
  const item = taskList.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.style.transition = "opacity .2s, transform .2s";
    item.style.opacity    = "0";
    item.style.transform  = "translateX(20px)";
    await new Promise((r) => setTimeout(r, 200));
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: headersAuth()    // ← token incluido
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast("Se ha eliminado la tarea 🗑", "info");
    await loadTasks();
  } catch (err) {
    showToast("Error al eliminar la tarea.", "error");
    await loadTasks();
  }
}

// Cerrar sesión: eliminar token y redirigir a login
function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
}

// Botón de cerrar sesión en el header
if (logoutBtn) {
  logoutBtn.addEventListener("click", cerrarSesion);
}

// ── Event listeners 
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

// ── Iniciar app
loadTasks();