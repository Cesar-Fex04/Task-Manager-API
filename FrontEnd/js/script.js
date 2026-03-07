/**
 * Task Manager — app.js
 * Consume la API REST en http://localhost:3000/tasks
 * Funciones: GET, POST, PATCH (toggle completado + editar título), DELETE
 */

const API_URL = "http://localhost:3000/tasks";

// ── Referencias al DOM ────────────────────────────────────────────────────
const taskInput    = document.getElementById("task-input");
const addBtn       = document.getElementById("add-btn");
const taskList     = document.getElementById("task-list");
const emptyState   = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const taskCount    = document.getElementById("task-count");
const toastCont    = document.getElementById("toast-container");

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", info: "📌", warning: "⚠️" };
  const toast = document.createElement("div");
  toast.className = `notif ${type}`;
  toast.innerHTML = `<span>${icons[type] ?? "📌"}</span>${message}`;
  toastCont.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity .3s";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Escape XSS ───────────────────────────────────────────────────────────
function esc(str) {
  return str
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Renderizar lista ──────────────────────────────────────────────────────
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
        <button class="action-btn btn-complete" title="${task.completed ? "Desmarcar" : "Marcar como completada"}">
          ${task.completed ? "↩ Desmarcar" : "✔ Completar"}
        </button>
        <button class="action-btn btn-edit" title="Editar tarea">✏ Editar</button>
        <button class="action-btn btn-delete" title="Eliminar tarea">🗑 Eliminar</button>
      </div>
    `;

    // Eventos
    li.querySelector(".btn-complete").addEventListener("click", () => toggleComplete(task.id, task.completed));
    li.querySelector(".btn-edit").addEventListener("click",    () => startEdit(li, task));
    li.querySelector(".btn-delete").addEventListener("click",  () => deleteTask(task.id));

    taskList.appendChild(li);
  });
}

// ── GET /tasks ────────────────────────────────────────────────────────────
async function loadTasks() {
  loadingState.hidden = false;
  emptyState.hidden   = true;
  taskList.innerHTML  = "";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error("Error al cargar tareas:", err);
    taskCount.textContent = 0;
    emptyState.hidden = false;
    showToast("No se pudo conectar con la API. ¿Está corriendo el backend?", "error");
  } finally {
    loadingState.hidden = true;
  }
}

// ── POST /tasks ───────────────────────────────────────────────────────────
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
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, completed: false }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    taskInput.value = "";
    taskInput.focus();
    showToast("Tarea agregada ✨", "success");
    await loadTasks();
  } catch (err) {
    console.error("Error al agregar tarea:", err);
    showToast("Error al agregar la tarea. Verifica la API.", "error");
  } finally {
    addBtn.disabled = false;
    addBtn.innerHTML = "<span>＋</span> Agregar tarea";
  }
}

// ── PATCH /tasks/:id — toggle completado ─────────────────────────────────
async function toggleComplete(id, currentState) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !currentState }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast(
      currentState ? "Tarea desmarcada como pendiente." : "Se ha completado la tarea ✔",
      currentState ? "info" : "success"
    );
    await loadTasks();
  } catch (err) {
    console.error("Error al actualizar tarea:", err);
    showToast("Error al actualizar la tarea.", "error");
  }
}

// ── Edición inline ────────────────────────────────────────────────────────
function startEdit(li, task) {
  const titleSpan   = li.querySelector(".task-title");
  const actionsDiv  = li.querySelector(".task-actions");
  const originalTitle = task.title;

  // Reemplazar span por input
  const input = document.createElement("input");
  input.type  = "text";
  input.className = "task-edit-input";
  input.value = task.title;
  input.maxLength = 120;
  titleSpan.replaceWith(input);
  input.focus();
  input.select();

  // Reemplazar botones
  actionsDiv.innerHTML = `
    <button class="action-btn btn-save"   title="Guardar cambios">💾 Guardar</button>
    <button class="action-btn btn-cancel" title="Cancelar edición">✕ Cancelar</button>
  `;

  actionsDiv.querySelector(".btn-save").addEventListener("click", () => saveEdit(li, task.id, input, originalTitle));
  actionsDiv.querySelector(".btn-cancel").addEventListener("click", () => loadTasks());

  // Enter = guardar, Esc = cancelar
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit(li, task.id, input, originalTitle);
    if (e.key === "Escape") loadTasks();
  });
}

// ── PATCH /tasks/:id — actualizar título ─────────────────────────────────
async function saveEdit(li, id, input, originalTitle) {
  const newTitle = input.value.trim();

  if (!newTitle) {
    input.focus();
    showToast("El título no puede estar vacío.", "error");
    return;
  }
  if (newTitle === originalTitle) {
    loadTasks();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast("Tarea actualizada 📝", "success");
    await loadTasks();
  } catch (err) {
    console.error("Error al editar tarea:", err);
    showToast("Error al actualizar la tarea.", "error");
  }
}

// ── DELETE /tasks/:id ─────────────────────────────────────────────────────
async function deleteTask(id) {
  const item = taskList.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.style.transition = "opacity .2s, transform .2s";
    item.style.opacity    = "0";
    item.style.transform  = "translateX(20px)";
    await new Promise((r) => setTimeout(r, 200));
  }

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast("Se ha eliminado la tarea 🗑", "info");
    await loadTasks();
  } catch (err) {
    console.error("Error al eliminar tarea:", err);
    showToast("Error al eliminar la tarea.", "error");
    await loadTasks();
  }
}

// ── Event listeners ───────────────────────────────────────────────────────
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

// ── Init ──────────────────────────────────────────────────────────────────
loadTasks();