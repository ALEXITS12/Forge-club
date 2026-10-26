/*
 * FORGE Club — Pantallas de resumen (dashboard) de cada rol.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function dashboardAdmin() {
  const revenue = state.transactions.filter(t => t.type === "Ingreso").reduce((a, t) => a + Number(t.amount), 0);
  const expiring = state.members.filter(m => daysUntil(m.endDate) >= 0 && daysUntil(m.endDate) <= 7).length;
  const active = state.members.filter(m => daysUntil(m.endDate) >= 0).length;
  const issues = state.equipment.filter(e => e.status !== "Operativo").length;
  return heading(`Hola, ${esc(currentUser.name.split(" ")[0])} 👋`, "Este es el resumen operativo de FORGE Club.", button("＋ Registrar socio", "newMember") + button("＋ Registrar empleado", "newEmployee", "btn-outline")) +
    `<div class="stats-grid">${stat("Socios vigentes", active, "De los registros disponibles", "♙")}${stat("Ingresos registrados", money(revenue), "Movimientos de demostración", "＄")}${stat("Vencen en 7 días", expiring, expiring ? "Requieren seguimiento" : "Sin vencimientos cercanos", "◷")}${stat("Incidencias de equipo", issues, issues ? "Revisar mantenimiento" : "Todo operativo", "⚙")}</div>` +
    `<div class="dashboard-grid">${panel("Ingresos del año", chartHTML(), '<span class="status neutral">DEMO</span>')}${panel("Actividad reciente", activityHTML(), '<button class="table-action" data-action="navigate" data-page="reports">Ver todo ↗</button>')}</div>` +
    tablePanel("Membresías que requieren atención", ["SOCIO", "CORREO", "PLAN", "VENCIMIENTO", "ESTADO", ""], memberRows(state.members.filter(m => daysUntil(m.endDate) <= 7).slice(0, 5)), button("Ver socios ↗", "navigateMembers", "btn-outline"));
}

function dashboardMember() {
  const m = state.members.find(x => x.email === currentUser.email) || currentUser;
  const end = m.endDate || addDays(todayISO(), 30), days = Math.max(0, daysUntil(end));
  return heading(`Hola, ${esc(currentUser.name.split(" ")[0])} 👋`, "Tu entrenamiento, tu progreso y tu membresía en un solo lugar.") +
    `<div class="membership-banner"><div><div class="eyebrow">TU MEMBRESÍA ACTUAL</div><h2>${esc(plan(m.planId).name)}</h2><p>Vigente hasta el ${dateLabel(end)} · ${days} días restantes</p></div><div class="membership-progress"><strong>${days}</strong><small>días restantes</small><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, days / 30 * 100)}%"></div></div></div></div>` +
    `<div class="stats-grid">${stat("Asistencias registradas", m.attendance || 18, "Tu constancia suma", "✓")}${stat("Rutina asignada", m.routine ? "Sí" : "Pendiente", m.routine || "Consulta con tu instructor", "↗")}${stat("Próxima renovación", dateLabel(end), "Revisa tu vigencia", "◷")}${stat("Estado", "Activo", "Cuenta habilitada", "♙")}</div>` +
    `<div class="dashboard-grid">${panel("Tu rutina", `<div class="routine-list"><div class="routine-item"><div class="routine-day">L</div><div><b>Torso · Fuerza</b><small>Pecho, espalda, hombros y brazos</small></div><span class="status">Asignada</span></div><div class="routine-item"><div class="routine-day">M</div><div><b>Pierna · Fuerza</b><small>Cuádriceps, femoral y glúteos</small></div><span class="status">Asignada</span></div><div class="routine-item"><div class="routine-day">V</div><div><b>Torso · Volumen</b><small>Progresión de cargas</small></div><span class="status">Asignada</span></div></div>`, button("Ver rutina ↗", "navigateRoutine", "btn-outline"))}${panel("Actividad reciente", activityHTML())}</div>`;
}

function dashboardInstructor() {
  const mine = state.routines.filter(r => r.coach === currentUser.name || currentUser.role === "instructor");
  return heading(`Hola, ${esc(currentUser.name.split(" ")[0])}`, "Organiza tus sesiones y da seguimiento a tus alumnos.", button("＋ Asignar rutina", "newRoutine")) +
    `<div class="stats-grid">${stat("Alumnos asignados", mine.length, "Registros de demostración", "♙")}${stat("Rutinas activas", state.routines.length, "Planes de entrenamiento", "↗")}${stat("Reservas de hoy", state.reservations.filter(r => r.date === todayISO()).length, "Sesiones programadas", "▦")}${stat("Seguimientos", "3", "Requieren actualización", "✓")}</div>` +
    `<div class="dashboard-grid">${panel("Agenda de hoy", reservationList(state.reservations.filter(r => r.date === todayISO())))}${panel("Mis alumnos", `<div class="activity-list">${state.routines.slice(0, 5).map(r => `<div class="activity-item"><span class="mini-avatar">${initials(r.member)}</span><div class="activity-text"><b>${esc(r.member)}</b><small>${esc(r.name)}</small></div><button class="table-action" data-action="editRoutine" data-id="${r.id}">Abrir</button></div>`).join("")}</div>`, button("Ver rutinas", "navigateRoutines", "btn-outline"))}</div>`;
}

function dashboardReception() {
  return heading("Recepción", "Registra socios, consulta membresías y agiliza el acceso.", button("＋ Registrar socio", "newMember")) +
    `<div class="stats-grid">${stat("Socios registrados", state.members.length, "Base de demostración", "♙")}${stat("Vencen pronto", state.members.filter(m => daysUntil(m.endDate) >= 0 && daysUntil(m.endDate) <= 7).length, "Próximos 7 días", "◷")}${stat("Reservas de hoy", state.reservations.filter(r => r.date === todayISO()).length, "Agenda del día", "▦")}${stat("Asistencias hoy", "24", "Dato ilustrativo", "✓")}</div>` +
    `<div class="dashboard-grid">${panel("Accesos rápidos", `<div class="detail-grid"><article class="detail-card"><span class="detail-icon">♙</span><h3>Alta de socio</h3><p>Registra datos y membresía.</p>${button("Registrar", "newMember", "btn-outline")}</article><article class="detail-card"><span class="detail-icon">✓</span><h3>Asistencia</h3><p>Registra la entrada del socio.</p>${button("Registrar entrada", "checkin", "btn-outline")}</article></div>`)}${panel("Actividad reciente", activityHTML())}</div>` +
    tablePanel("Socios recientes", ["SOCIO", "CORREO", "PLAN", "VENCIMIENTO", "ESTADO", ""], memberRows(state.members.slice(0, 5)), button("Ver todos", "navigateMembers", "btn-outline"));
}

function dashboardOther() {
  return heading(`Hola, ${esc(currentUser.name.split(" ")[0])}`, "Este es tu espacio de trabajo en FORGE Club.") +
    `<div class="stats-grid">${stat("Incidencias abiertas", state.equipment.filter(e => e.status !== "Operativo").length, "Equipo por revisar", "⚙")}${stat("Movimientos", state.transactions.length, "Registros disponibles", "＄")}${stat("Reservas", state.reservations.length, "Agenda del gimnasio", "▦")}${stat("Socios", state.members.length, "Consulta autorizada", "♙")}</div><div class="dashboard-grid">${panel("Actividad reciente", activityHTML())}${panel("Accesos de trabajo", `<div class="detail-grid"><article class="detail-card"><span class="detail-icon">⚙</span><h3>Equipos</h3><p>Consulta estado e incidencias.</p>${button("Abrir", "navigateEquipment", "btn-outline")}</article><article class="detail-card"><span class="detail-icon">＄</span><h3>Movimientos</h3><p>Consulta registros disponibles.</p>${button("Abrir", "navigateFinance", "btn-outline")}</article></div>`)}</div>`;
}