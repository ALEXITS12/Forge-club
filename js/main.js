/*
 * FORGE Club — Arranque: eventos globales y pantalla inicial.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

// Clics globales: cambio de pantalla, selección de plan y acciones con data-action.
document.addEventListener("click", e => {
  const view = e.target.closest("[data-view]");
  if (view) {
    e.preventDefault();
    showView(view.dataset.view);
    return;
  }
  const planBtn = e.target.closest("[data-plan]");
  if (planBtn) {
    showView("register");
    $("#regPlan").value = planBtn.dataset.plan;
    return;
  }
  const actionEl = e.target.closest("[data-action]");
  if (actionEl) {
    dispatch(actionEl.dataset.action, actionEl);
    return;
  }
  const modal = $("#modal");
  if (e.target === modal)
    closeModal();
});

// Formularios de inicio de sesión y registro.
$("#loginForm").addEventListener("submit", handleLogin);

$("#registerForm").addEventListener("submit", handleRegister);

// Formularios de las ventanas modales (alta de socios, empleados, rutinas, etc.).
document.addEventListener("submit", e => {
  if (e.target.matches("#newMemberForm,#newEmployeeForm,#routineForm,#dietForm,#personalDietForm,#reservationForm,#equipmentForm,#transactionForm,#checkinForm"))
    handleModalSubmit(e);
});

// Búsqueda y filtros de la tabla de socios, y método de acceso.
document.addEventListener("input", e => {
  if (e.target.id === "memberSearch")
    refreshMemberTable();
});

document.addEventListener("change", e => {
  if (e.target.id === "memberFilter")
    refreshMemberTable();
  if (e.target.id === "resDate" && e.target.value) {
    resViewDate = e.target.value;
    renderPage();
  }
  if (e.target.id === "accessMethod") {
    state.settings = state.settings || {};
    state.settings.accessMethod = e.target.value;
    save();
    showToast("Método de acceso actualizado en la demo.");
  }
});

// Botones de la pantalla de acceso y de la barra lateral.
$("#forgotPassword").addEventListener("click", () => showModal(`<h2>Recuperar contraseña</h2><p>En producción se enviará un enlace de recuperación a tu correo mediante un flujo seguro del backend.</p><form id="recoverForm"><div><label>Correo electrónico</label><input type="email" name="email" required placeholder="tu@correo.com"></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Solicitar enlace</button></div></form>`));

$("#fillAdmin").addEventListener("click", () => {
  $("#loginEmail").value = "admin@forge.demo";
  $("#loginPassword").value = demoPassword;
});

$("#sideToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

// Año del pie de página.
$("#year").textContent = new Date().getFullYear();

$("#modal").addEventListener("submit", handleDynamicFormSubmit);

// Pantalla inicial: planes de la página pública y vista de inicio.
populatePlans();

showView("home");