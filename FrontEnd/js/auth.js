

// URL base de nuestra API
const API_URL = "http://localhost:3000";

// ── Referencias al DOM ────────────────────────────────────────────
const loginBtn = document.getElementById("login-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

// ── Función principal: iniciar sesión ─────────────────────────────
async function login() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Validación básica antes de llamar al servidor
  if (!email || !password) {
    mostrarError("Por favor completa todos los campos.");
    return;
  }

  // Deshabilitar botón mientras espera respuesta
  loginBtn.disabled = true;
  loginBtn.textContent = "Verificando...";

  try {
    /**
     * POST /login
     * Enviamos email y password al servidor.
     * JSON Server Auth los verifica y si son correctos
     * devuelve un objeto con { accessToken: "..." }
     */
    const respuesta = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!respuesta.ok) {
      // Si el servidor devuelve error 400 = credenciales incorrectas
      mostrarError("Correo o contraseña incorrectos.");
      return;
    }

    // Convertimos la respuesta a JSON para acceder al token
    const datos = await respuesta.json();

    /*
     ALMACENAMIENTO DEL TOKEN
     Guardamos el token en localStorage.
     */
    localStorage.setItem("token", datos.accessToken);

    // También guardamos el email para mostrarlo en la app
    localStorage.setItem("userEmail", email);

    // Redirigir a la aplicación principal
    window.location.href = "index.html";

  } catch (error) {
    // Error de red (p.ej. el servidor no está corriendo)
    console.error("Error al conectar con el servidor:", error);
    mostrarError("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Iniciar sesión";
  }
}

// ── Mostrar mensaje de error en pantalla ──────────────────────────
function mostrarError(mensaje) {
  errorMsg.textContent = "❌ " + mensaje;
  errorMsg.style.display = "block";
}

// ── Event listeners ───────────────────────────────────────────────
loginBtn.addEventListener("click", login);

// Permite hacer login con la tecla Enter
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

/**
 * ── VERIFICAR SI YA TIENE SESIÓN ACTIVA ──────────────────────────
 * Si el usuario ya inició sesión antes (tiene token guardado),
 * lo mandamos directo a index.html sin pasar por login.
 */
const tokenExistente = localStorage.getItem("token");
if (tokenExistente) {
  window.location.href = "index.html";
}