/*
 * FORGE Club — Despachador de acciones: qué hace cada botón con data-action.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function dispatch(action, el) {
  const id = el.dataset.id, page = el.dataset.page;
  switch (action) {
    case "navigate":
      navigate(page);
      break;
    case "navigateMembers":
      navigate("members");
      break;
    case "navigateRoutine":
      navigate("myRoutine");
      break;
    case "navigateRoutines":
      navigate("routines");
      break;
    case "navigateEquipment":
      navigate("equipment");
      break;
    case "navigateFinance":
      navigate("finance");
      break;
    case "newMember":
      if (["admin", "reception"].includes(currentUser?.role))
        openNewMember();
      else
        showToast("No tienes permiso para registrar socios.");
      break;
    case "newEmployee":
      if (currentUser?.role === "admin")
        openNewEmployee();
      else
        showToast("Solo el administrador puede registrar empleados.");
      break;
    case "newRoutine":
      openNewRoutine();
      break;
    case "newDiet":
      openDietForm();
      break;
    case "newPersonalDiet":
      openDietForm(null, null, true);
      break;
    case "editDiet":
      openDietForm(state.dietPlans.find(d => d.id === id));
      break;
    case "assignDietTemplate":
      openDietForm(null, dietTemplates.find(d => d.id === id));
      break;
    case "toggleMeal": {
      const assigned = state.dietPlans.find(d => d.memberEmail === currentUser.email && d.status !== "Finalizada");
      if (!assigned)
        return;
      const mealName = el.dataset.name;
      const today = todayISO();
      const existing = state.mealLogs.find(l => l.memberEmail === currentUser.email && l.date === today && l.mealName === mealName);
      if (existing) {
        existing.status = existing.status === "Completada" ? "Pendiente" : "Completada";
      }
      else
        state.mealLogs.unshift({
          id: `ML-${Date.now()}`, memberEmail: currentUser.email, date: today, mealName, status: "Completada"
        });
      save();
      renderPage();
      showToast("Seguimiento de comida actualizado.");
      break;
    }
    case "reportEquipmentFailure": {
      const eq = state.equipment.find(x => x.id === id);
      if (eq) {
        showModal(`<h2>Registrar falla</h2><p>${esc(eq.name)} · ${esc(eq.id)}</p><form id="equipmentFailureForm"><input type="hidden" name="equipmentId" value="${esc(eq.id)}"><input type="hidden" name="equipmentName" value="${esc(eq.name)}"><div><label>Fecha de la falla</label><input name="date" type="date" value="${todayISO()}" required></div><div><label>Tipo de registro</label><select name="type"><option>Falla</option><option>Mantenimiento</option></select></div><div class="field-full"><label>Descripción</label><textarea name="note" required placeholder="Describe la incidencia o reparación"></textarea></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar registro</button></div></form>`);
      }
      break;
    }
    case "editRoutine":
      openNewRoutine(state.routines.find(r => r.id === id));
      break;
    case "newReservation":
      if ([...STAFF_RES_ROLES, "member"].includes(currentUser?.role))
        openNewReservation();
      else
        showToast("Tu rol no puede crear reservas.");
      break;
    case "newEquipment":
      openNewEquipment();
      break;
    case "newTransaction":
      openNewTransaction();
      break;
    case "memberDetail":
      openMemberDetail(id);
      break;
    case "closeModal":
      closeModal();
      break;
    case "support":
      showModal(`<h2>Soporte FORGE Club</h2><p>Para la demo, contacta al personal del gimnasio por los medios habituales.</p><div class="notice-box">Configura el correo de soporte en <code>config.js</code> cuando despliegues el sistema.</div><div class="modal-actions"><button class="btn btn-primary" data-action="closeModal">Entendido</button></div>`);
      break;
    case "notifications":
      showModal(`<h2>Notificaciones</h2><p>Actividad reciente de la demo.</p>${activityHTML()}<div class="modal-actions"><button class="btn btn-primary" data-action="closeModal">Cerrar</button></div>`);
      break;
    case "profile":
      navigate("profile");
      break;
    case "myRecord":
      navigate("myRecord");
      break;
    case "addMeasurement":
      openMeasurementForm();
      break;
    case "logout":
      try { ForgeSupabase.getClient().auth.signOut(); } catch (err) { /* sin sesión de Supabase */ }
      currentUser = null;
      currentPage = "dashboard";
      $("#sidebar").classList.remove("open");
      showView("home");
      showToast("Sesión de demostración cerrada.");
      break;
    case "toggleEmployee": {
      const e = state.employees.find(x => x.id === id);
      if (e) {
        e.status = e.status === "Activo" ? "Inactivo" : "Activo";
        const u = state.users.find(x => x.email === e.email);
        if (u)
          u.status = e.status;
        save();
        renderPage();
        showToast(`Cuenta ${e.status.toLowerCase()}.`);
      }
      break;
    }
    case "cancelReservation":
      openCancelReservation(id);
      break;
    case "reservationDetail":
      openReservationDetail(id);
      break;
    case "reserveSlot":
      openNewReservation({ room: el.dataset.room, date: el.dataset.date, time: el.dataset.time });
      break;
    case "resToday":
      resViewDate = todayISO();
      renderPage();
      break;
    case "confirmReservation":
      setReservationStatus(id, "Confirmada", "Reserva confirmada");
      break;
    case "markAttended":
      setReservationStatus(id, "Asistió", "Asistencia registrada");
      break;
    case "markNoShow":
      setReservationStatus(id, "No asistió", "Inasistencia registrada");
      break;
    case "equipmentStatus": {
      const e = state.equipment.find(x => x.id === id);
      if (e) {
        e.status = e.status === "Operativo" ? "Mantenimiento" : "Operativo";
        logActivity("Estado de equipo actualizado", `${e.name} · ${e.status}`, "⚙");
        save();
        renderPage();
        showToast("Estado actualizado.");
      }
      break;
    }
    case "renewMember": {
      const m = state.members.find(x => x.id === id);
      if (m) {
        m.startDate = todayISO();
        m.endDate = addDays(todayISO(), 30);
        m.status = "Activo";
        registerMembershipPayment(m, 30);
        logActivity("Membresía renovada", `${m.name} · ${plan(m.planId).name}`, "↻");
        save();
        closeModal();
        renderPage();
        showToast("Membresía renovada y pago registrado en Contabilidad.");
      }
      break;
    }
    case "finishRegistration": {
      const email = el.dataset.email;
      closeModal();
      const user = state.users.find(u => u.email === email);
      if (user)
        openApp(user);
      break;
    }
    case "editProfile":
      showModal(`<h2>Editar perfil</h2><p>Esta pantalla de demostración no cambia credenciales de autenticación.</p><form id="profileForm"><div><label>Nombre</label><input name="name" value="${esc(currentUser.name)}" required></div><div><label>Teléfono</label><input name="phone" value="${esc(currentUser.phone || "")}"></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div></form>`);
      break;
    case "resetDemo":
      if (confirm("¿Restablecer todos los datos demo de este navegador?")) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        navigate("dashboard");
        showToast("Datos de demo restablecidos.");
      }
      break;
    case "checkin":
      navigate("checkin");
      break;
  }
}