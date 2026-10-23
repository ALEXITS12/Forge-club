/*
 * FORGE Club — Inicio de sesión y registro (demo; no es autenticación real).
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */

async function handleLogin(e) {
  e.preventDefault();

  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;

  try {
    const { data, error } = await ForgeSupabase.signIn(email, password);

    if (error) {
      showToast("Correo o contraseña incorrectos.");
      console.error("Error de login:", error.message);
      return;
    }

    const authUser = data.user;
    const metadata = authUser.user_metadata || {};

    const user = {
      id: authUser.id,
      email: authUser.email,
      name: metadata.nombre
        ? `${metadata.nombre} ${metadata.apellido || ""}`.trim()
        : authUser.email,
      phone: metadata.telefono || "",
      role: "member",
      status: "Activo"
    };

    openApp(user);
    showToast(`¡Bienvenido/a a FORGE Club!`);

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
