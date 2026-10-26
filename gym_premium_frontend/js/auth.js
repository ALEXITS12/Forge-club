/*
 * FORGE Club — Inicio de sesión y registro (demo; no es autenticación real).
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */

// Equivalencias entre los nombres de rol que pueda tener la base de datos y los roles de la interfaz.
const ROLE_ALIASES = {
  admin: "admin", administrador: "admin",
  instructor: "instructor", entrenador: "instructor", coach: "instructor",
  reception: "reception", recepcion: "reception", "recepción": "reception", recepcionista: "reception",
  maintenance: "maintenance", mantenimiento: "maintenance",
  accounting: "accounting", contabilidad: "accounting", contador: "accounting",
  member: "member", socio: "member", cliente: "member"
};

/*
 * Determina el rol del usuario autenticado.
 * 1) Busca su fila en la tabla `usuarios` por correo (columna de rol: rol / role / tipo_usuario / tipo).
 * 2) Si no hay tabla o columna, busca el correo entre los empleados de la demo.
 * 3) Si no encuentra nada, es socio (el rol con menos permisos).
 * NUNCA se lee el rol de user_metadata: el propio usuario puede editarlo al registrarse.
 */
async function resolveRole(authUser) {
  const email = (authUser.email || "").toLowerCase();
  try {
    const { data, error } = await ForgeSupabase.table("usuarios").select("*").eq("email", email).limit(1);
    if (!error && data && data[0]) {
      const raw = data[0].rol || data[0].role || data[0].tipo_usuario || data[0].tipo;
      if (raw) return ROLE_ALIASES[String(raw).toLowerCase().trim()] || "member";
    }
  } catch (err) {
    console.warn("No se pudo consultar el rol en la tabla usuarios:", err);
  }
  const emp = state.employees.find(x => x.email.toLowerCase() === email && x.status !== "Inactivo");
  return emp ? emp.role : "member";
}

async function handleLogin(e) {
  e.preventDefault();

  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;

  // Cuentas de demostración (admin@forge.demo, coach@forge.demo, recepcion@forge.demo, socio@forge.demo).
  if (cfg.DEMO_MODE) {
    const demo = state.users.find(u => u.email === email && u.password && u.password === password && u.status !== "Inactivo");
    if (demo) {
      openApp({ ...demo });
      showToast(`Sesión demo: ${roleName(demo.role)}.`);
      return;
    }
  }

  try {
    const { data, error } = await ForgeSupabase.signIn(email, password);

    if (error) {
      showToast("Correo o contraseña incorrectos.");
      console.error("Error de login:", error.message);
      return;
    }

    const authUser = data.user;
    const metadata = authUser.user_metadata || {};
    const role = await resolveRole(authUser);

    const user = {
      id: authUser.id,
      email: authUser.email,
      name: metadata.nombre
        ? `${metadata.nombre} ${metadata.apellido || ""}`.trim()
        : authUser.email,
      phone: metadata.telefono || "",
      role,
      status: "Activo"
    };

    openApp(user);
    showToast(`¡Bienvenido/a a FORGE Club! (${roleName(role)})`);

  } catch (error) {
    console.error("Error de conexión:", error);
    showToast("No se pudo iniciar sesión. Revisa la conexión.");
  }
}


async function handleRegister(e) {
  e.preventDefault();

  const name = $("#regName").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const phone = $("#regPhone").value.trim();
  const pw = $("#regPassword").value;
  const pw2 = $("#regPassword2").value;

  if (!name || !email || !phone || !pw || !pw2) {
    showToast("Completa todos los campos.");
    return;
  }

  if (pw !== pw2) {
    showToast("Las contraseñas no coinciden.");
    return;
  }

  if (pw.length < 6) {
    showToast("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  const partesNombre = name.split(/\s+/);
  const nombre = partesNombre.shift();
  const apellido = partesNombre.join(" ") || "";

  try {
    const { data, error } = await ForgeSupabase.signUp(
      email,
      pw,
      { nombre, apellido, telefono: phone }
    );

    if (error) {
      console.error("Error de Supabase Auth:", error);
      showToast("No se pudo registrar: " + error.message);
      return;
    }

    if (!data.user) {
      showToast("Supabase no devolvió los datos de la cuenta.");
      return;
    }

    showModal(`
      <h2>¡Gracias por registrarte!</h2>
      <p>Hemos procesado tu solicitud de registro en FORGE Club.</p>
      <div class="notice-box">
        <b>Confirma tu correo electrónico</b>
        <p>Revisa tu bandeja de entrada y sigue el enlace de confirmación enviado a:</p>
        <b>${esc(email)}</b>
      </div>
      <p>Después de confirmar tu correo, podrás iniciar sesión.</p>
      <div class="modal-actions">
        <button type="button"
          class="btn btn-primary"
          data-action="closeModal">
          Entendido
        </button>
      </div>
    `);

  } catch (error) {
    console.error("Error durante el registro:", error);
    showToast(
      error.message || "No se pudo conectar con Supabase."
    );
  }
}
