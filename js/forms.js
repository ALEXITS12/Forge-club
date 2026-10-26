/*
 * FORGE Club — Formularios en ventana modal y su procesamiento al guardarse.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function openNewMember() {
  showModal(`<h2>Registrar socio</h2><p>Captura sus datos y asigna una membresía. El envío real de correo se configurará en el backend.</p><form id="newMemberForm"><div><label>Nombre completo</label><input name="name" required minlength="3"></div><div><label>Correo electrónico</label><input name="email" type="email" required></div><div><label>Teléfono</label><input name="phone" type="tel"></div><div><label>Membresía</label><select name="planId" required>${plans.map(p => `<option value="${p.id}">${p.name} — ${money(p.price)}</option>`).join("")}</select></div><div><label>Fecha de inicio</label><input name="startDate" type="date" value="${todayISO()}" required></div><div><label>Duración</label><select name="duration"><option value="30">1 mes (30 días)</option><option value="90">3 meses (90 días)</option><option value="180">6 meses (180 días)</option><option value="365">12 meses (365 días)</option></select></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar socio</button></div></form>`);
}

function openNewEmployee() {
  showModal(`<h2>Registrar empleado</h2><p>El administrador asigna el puesto. La cuenta real debe crearse desde un endpoint protegido.</p><form id="newEmployeeForm"><div><label>Nombre completo</label><input name="name" required minlength="3"></div><div><label>Correo electrónico</label><input name="email" type="email" required></div><div><label>Teléfono</label><input name="phone" type="tel"></div><div><label>Puesto / rol</label><select name="role"><option value="reception">Recepcionista</option><option value="instructor">Instructor</option><option value="maintenance">Mantenimiento</option><option value="accounting">Contabilidad</option></select></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Crear empleado</button></div></form>`);
}

function openNewRoutine(r = null) {
  showModal(`<h2>${r ? "Editar rutina" : "Nueva rutina"}</h2><p>Asigna un plan de entrenamiento a un socio.</p><form id="routineForm"><input type="hidden" name="id" value="${r?.id || ""}"><div><label>Nombre de la rutina</label><input name="name" value="${esc(r?.name || "")}" required></div><div><label>Socio</label><select name="member" required>${state.members.map(m => `<option ${r?.member === m.name ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></div><div><label>Instructor</label><input name="coach" value="${esc(r?.coach || currentUser.name)}" required></div><div><label>Frecuencia</label><select name="days"><option>3 días</option><option ${r?.days === "4 días" ? "selected" : ""}>4 días</option><option>5 días</option><option>6 días</option></select></div><div class="field-full"><label>Notas</label><textarea name="notes">${esc(r?.notes || "")}</textarea></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar rutina</button></div></form>`);
}

function openNewEquipment() {
  showModal(`<h2>Registrar equipo</h2><form id="equipmentForm"><div><label>Nombre del equipo</label><input name="name" required></div><div><label>Área</label><select name="area"><option>Cardio</option><option>Fuerza</option><option>Funcional</option><option>Salón</option></select></div><div><label>Próximo mantenimiento</label><input name="next" type="date" value="${addDays(todayISO(), 30)}" required></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar equipo</button></div></form>`);
}

function openNewTransaction() {
  showModal(`<h2>Registrar movimiento</h2><form id="transactionForm"><div><label>Tipo</label><select name="type"><option>Ingreso</option><option>Gasto</option></select></div><div><label>Categoría</label><input name="category" required placeholder="Membresía, mantenimiento…"></div><div class="field-full"><label>Descripción</label><input name="description" required></div><div><label>Importe (MXN)</label><input name="amount" type="number" min="1" step=".01" required></div><div><label>Fecha</label><input name="date" type="date" value="${todayISO()}" required></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar movimiento</button></div></form>`);
}

function openMemberDetail(id) {
  const m = state.members.find(x => x.id === id);
  if (!m)
    return;
  showModal(`<h2>${esc(m.name)}</h2><p>Ficha de socio · ${esc(m.id)}</p><div class="profile-info"><div class="info-item"><small>Correo</small><b>${esc(m.email)}</b></div><div class="info-item"><small>Teléfono</small><b>${esc(m.phone || "No registrado")}</b></div><div class="info-item"><small>Membresía</small><b>${esc(plan(m.planId).name)}</b></div><div class="info-item"><small>Inicio</small><b>${dateLabel(m.startDate)}</b></div><div class="info-item"><small>Vencimiento</small><b>${dateLabel(m.endDate)}</b></div><div class="info-item"><small>Asistencias</small><b>${m.attendance || 0}</b></div><div class="info-item"><small>Último peso registrado</small><b>${(m.measurements || []).length ? `${Number(m.measurements.slice().sort((a, b) => b.date.localeCompare(a.date))[0].weight).toFixed(1)} kg` : "Sin registro"}</b></div></div><div class="modal-actions"><button class="btn btn-outline" data-action="closeModal">Cerrar</button>${currentUser.role === "admin" || currentUser.role === "reception" ? `<button class="btn btn-primary" data-action="renewMember" data-id="${m.id}">Renovar membresía</button>` : ""}</div>`);
}

function handleModalSubmit(e) {
  e.preventDefault();
  const f = e.target, data = Object.fromEntries(new FormData(f).entries());
  if (f.id === "newMemberForm") {
    const email = data.email.trim().toLowerCase();
    if (state.members.some(m => m.email.toLowerCase() === email)) {
      showToast("Ya existe un socio con ese correo.");
      return;
    }
    const id = `M-${Math.floor(1000 + Math.random() * 9000)}`, end = addDays(data.startDate, Number(data.duration));
    const m = {
      id, name: data.name.trim(), email, phone: data.phone, role: "member", status: "Activo", planId: data.planId, startDate: data.startDate, endDate: end, paid: 0, attendance: 0, routine: "Pendiente"
    };
    state.members.unshift(m);
    registerMembershipPayment(m, Number(data.duration));
    if (!state.users.some(u => u.email === email))
      state.users.push({
        ...m, id: `u-${Date.now()}`, password: "", role: "member", needsActivation: true
      });
    logActivity("Nuevo socio registrado", `${m.name} · ${plan(m.planId).name}`, "♙");
    save();
    closeModal();
    renderPage();
    showToast("Socio registrado y pago enviado a Contabilidad.");
  }
  else if (f.id === "newEmployeeForm") {
    const email = data.email.trim().toLowerCase();
    if (state.employees.some(x => x.email.toLowerCase() === email)) {
      showToast("Ya existe un empleado con ese correo.");
      return;
    }
    const emp = {
      id: `E-${String(state.employees.length + 1).padStart(3, "0")}`, name: data.name.trim(), email, phone: data.phone, position: roleName(data.role), role: data.role, status: "Activo"
    };
    state.employees.unshift(emp);
    if (!state.users.some(u => u.email === email))
      state.users.push({
        id: `u-${Date.now()}`, name: emp.name, email, phone: emp.phone, role: emp.role, status: "Activo", password: "", needsActivation: true
      });
    logActivity("Empleado registrado", `${emp.name} · ${emp.position}`, "♧");
    save();
    closeModal();
    renderPage();
    showToast("Empleado registrado. En producción, envía invitación de activación por correo.");
  }
  else if (f.id === "routineForm") {
    const routine = {
      id: data.id || `RT-${String(state.routines.length + 1).padStart(3, "0")}`, name: data.name, member: data.member, coach: data.coach, days: data.days, notes: data.notes
    };
    const idx = state.routines.findIndex(x => x.id === routine.id);
    if (idx >= 0)
      state.routines[idx] = routine;
    else
      state.routines.unshift(routine);
    logActivity("Rutina guardada", `${routine.member} · ${routine.name}`, "↗");
    save();
    closeModal();
    navigate("routines");
    showToast("Rutina guardada en la demo.");
  }
  else if (f.id === "dietForm" || f.id === "personalDietForm") {
    const existing = state.dietPlans.find(d => d.id === data.id);
    const target = state.members.find(m => m.email === data.memberEmail) || state.members.find(m => m.email === currentUser.email);
    const parsed = (data.meals || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, i) => {
      const parts = line.split("|").map(v => v.trim());
      return {
        time: parts[0] || "", name: parts[1] || `Comida ${i + 1}`, food: parts.slice(2).join(" | ") || "Por definir"
      };
    });
    const diet = {
      id: data.id || `DP-${String(Date.now()).slice(-6)}`, memberEmail: target?.email || data.memberEmail, member: target?.name || currentUser.name, name: data.name.trim(), type: data.type || "Personalizada", source: data.source || "Personalizada", status: data.status || "Activa", meals: parsed, createdAt: existing?.createdAt || todayISO(), document: data.document && data.document.name ? data.document.name : (typeof data.document === "string" ? data.document : "")
    };
    if (existing)
      Object.assign(existing, diet);
    else
      state.dietPlans.unshift(diet);
    logActivity("Dieta guardada", `${diet.name} · ${diet.member}`, "♧");
    save();
    closeModal();
    navigate(currentUser.role === "member" ? "myDiet" : "diets");
    showToast("Dieta guardada en la demo.");
  }
  else if (f.id === "reservationForm") {
    createReservation(data);
  }
  else if (f.id === "equipmentForm") {
    const item = {
      id: `EQ-${String(state.equipment.length + 1).padStart(3, "0")}`, name: data.name, area: data.area, status: "Operativo", last: "—", next: data.next
    };
    state.equipment.unshift(item);
    logActivity("Equipo registrado", item.name, "⚙");
    save();
    closeModal();
    navigate("equipment");
    showToast("Equipo registrado.");
  }
  else if (f.id === "transactionForm") {
    const t = {
      id: `TX-${401 + state.transactions.length}`, type: data.type, category: data.category, description: data.description, amount: Number(data.amount), date: data.date
    };
    state.transactions.unshift(t);
    logActivity("Movimiento contable registrado", `${t.type} · ${money(t.amount)}`, "＄");
    save();
    closeModal();
    navigate("finance");
    showToast("Movimiento registrado.");
  }
  else if (f.id === "checkinForm") {
    const m = state.members.find(x => x.id === data.member);
    if (!m)
      return;
    if (daysUntil(m.endDate) < 0) {
      showToast("La membresía está vencida. Renueva antes de registrar la entrada.");
      return;
    }
    m.attendance = (m.attendance || 0) + 1;
    logActivity("Asistencia registrada", `${m.name} · ${dateLabel(todayISO())}`, "✓");
    save();
    renderPage();
    showToast(`Entrada registrada: ${m.name}.`);
  }
}

/*
 * Formularios que se envían dentro de la ventana modal y que se identifican por su id:
 * registro de falla/mantenimiento, recuperar contraseña, medición corporal y perfil.
 */
function handleDynamicFormSubmit(e) {
  if (e.target.id === "equipmentFailureForm") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    state.equipmentEvents = state.equipmentEvents || [];
    state.equipmentEvents.unshift({
      equipmentId: data.equipmentId, equipmentName: data.equipmentName, date: data.date, type: data.type, note: data.note
    });
    const eq = state.equipment.find(x => x.id === data.equipmentId);
    if (eq && data.type === "Falla")
      eq.status = "Mantenimiento";
    logActivity(data.type === "Falla" ? "Falla de equipo registrada" : "Mantenimiento registrado", `${data.equipmentName} · ${data.note}`, "⚙");
    save();
    closeModal();
    navigate(currentPage);
    showToast("Registro de mantenimiento guardado.");
  }
  if (e.target.id === "cancelReservationForm") {
    e.preventDefault();
    submitCancelReservation(Object.fromEntries(new FormData(e.target).entries()));
  }
  if (e.target.id === "recoverForm") {
    e.preventDefault();
    closeModal();
    showToast("Solicitud demo recibida. No se envió ningún correo.");
  }
  if (e.target.id === "measurementForm") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const m = currentMemberRecord();
    if (!m)
      return;
    const entry = {
      date: data.date, weight: Number(data.weight), bodyFat: data.bodyFat === "" ? null : Number(data.bodyFat), notes: data.notes.trim()
    };
    if (!m.measurements)
      m.measurements = [];
    m.measurements.push(entry);
    const member = state.members.find(x => x.email === currentUser.email);
    if (member)
      member.measurements = m.measurements;
    const user = state.users.find(x => x.email === currentUser.email);
    if (user)
      user.measurements = m.measurements;
    save();
    closeModal();
    navigate("myRecord");
    showToast("Medición guardada en la demo.");
  }
  if (e.target.id === "profileForm") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    currentUser.name = data.name;
    currentUser.phone = data.phone;
    const u = state.users.find(x => x.email === currentUser.email);
    if (u) {
      u.name = data.name;
      u.phone = data.phone;
    }
    save();
    closeModal();
    renderNav();
    renderPage();
    showToast("Perfil actualizado en la demo.");
  }
}