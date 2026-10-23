/*
 * FORGE Club — Pantallas de operación: socios, empleados, rutinas, dietas, reservas, equipos, finanzas, reportes, usuarios, configuración y asistencia.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function pageMembers() {
  if (!["admin", "reception", "instructor"].includes(currentUser.role))
    return noAccess();
  const action = currentUser.role === "admin" || currentUser.role === "reception" ? button("＋ Registrar socio", "newMember") : "";
  return heading(currentUser.role === "instructor" ? "Mis alumnos" : "Socios y membresías", "Consulta los registros y vigencias de los socios.", action) +
    `<div class="toolbar"><div class="search-box"><input id="memberSearch" placeholder="Buscar por nombre, correo o folio…"></div><select id="memberFilter"><option value="all">Todos los estados</option><option value="active">Vigentes</option><option value="soon">Por vencer</option><option value="expired">Vencidas</option></select>${currentUser.role === "reception" ? button("Registrar asistencia", "checkin", "btn-outline") : ""}</div>` +
    `<div id="membersTable">${tablePanel("Directorio de socios", ["SOCIO", "CORREO", "MEMBRESÍA", "VENCIMIENTO", "ESTADO", ""], memberRows())}</div>`;
}

function refreshMemberTable() {
  const q = ($("#memberSearch")?.value || "").toLowerCase(), f = $("#memberFilter")?.value || "all";
  let list = state.members.filter(m => [m.name, m.email, m.id].some(x => (x || "").toLowerCase().includes(q)));
  list = list.filter(m => f === "all" || (f === "active" && daysUntil(m.endDate) >= 0) || (f === "soon" && daysUntil(m.endDate) >= 0 && daysUntil(m.endDate) <= 7) || (f === "expired" && daysUntil(m.endDate) < 0));
  $("#membersTable").innerHTML = tablePanel("Directorio de socios", ["SOCIO", "CORREO", "MEMBRESÍA", "VENCIMIENTO", "ESTADO", ""], memberRows(list));
}

function pageEmployees() {
  if (currentUser.role !== "admin")
    return noAccess();
  const rows = state.employees.map(e => `<tr><td><div class="member-cell"><span class="mini-avatar">${initials(e.name)}</span><span><b>${esc(e.name)}</b><small>${esc(e.id)}</small></span></div></td><td>${esc(e.email)}</td><td>${esc(e.position)}</td><td>${roleName(e.role)}</td><td><span class="status ${e.status === "Inactivo" ? "neutral" : ""}">${esc(e.status)}</span></td><td><button class="table-action" data-action="toggleEmployee" data-id="${esc(e.id)}">${e.status === "Activo" ? "Desactivar" : "Activar"}</button></td></tr>`).join("");
  return heading("Empleados", "Administra las cuentas del personal y sus puestos.", button("＋ Registrar empleado", "newEmployee")) + `<div class="notice-box">Solo el administrador puede dar de alta empleados y asignar roles. En producción, estos permisos se validan en el backend.</div>` + tablePanel("Directorio de empleados", ["EMPLEADO", "CORREO", "PUESTO", "ROL", "ESTADO", "ACCIÓN"], rows);
}

function pageRoutines() {
  if (!["admin", "instructor"].includes(currentUser.role))
    return noAccess();
  const rows = state.routines.map(r => `<tr><td><b>${esc(r.name)}</b><small class="muted" style="display:block;margin-top:3px">${esc(r.id)}</small></td><td>${esc(r.member)}</td><td>${esc(r.coach)}</td><td>${esc(r.days)}</td><td><button class="table-action" data-action="editRoutine" data-id="${r.id}">Editar ↗</button></td></tr>`).join("");
  return heading("Rutinas y progreso", "Crea planes de entrenamiento y da seguimiento a los alumnos.", button("＋ Nueva rutina", "newRoutine")) + tablePanel("Planes de entrenamiento", ["RUTINA", "SOCIO", "INSTRUCTOR", "FRECUENCIA", ""], rows);
}

function pageDiets() {
  if (!["admin", "instructor"].includes(currentUser.role))
    return noAccess();
  const rows = state.dietPlans.map(d => `<tr><td><b>${esc(d.name)}</b><small class="muted" style="display:block">${esc(d.id)}</small></td><td>${esc(d.member || "Sin asignar")}</td><td>${esc(d.type || "Personalizada")}</td><td>${esc(d.source || "Personalizada")}</td><td><span class="status">${esc(d.status || "Activa")}</span></td><td><button class="table-action" data-action="editDiet" data-id="${esc(d.id)}">Editar ↗</button></td></tr>`).join("");
  const cards = dietTemplates.map(d => `<article class="detail-card"><span class="detail-icon">♧</span><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><p>${d.meals.length} comidas de ejemplo</p><button class="btn btn-outline" data-action="assignDietTemplate" data-id="${d.id}">Asignar plantilla</button></article>`).join("");
  return heading("Banco de dietas", "Gestiona plantillas y planes personalizados para los socios.", button("＋ Crear dieta personalizada", "newDiet")) + `<div class="notice-box">Las plantillas son ejemplos generales, no prescripciones nutricionales. El plan debe adaptarse a cada persona; una dieta de un especialista puede registrarse como personalizada o como documento externo.</div><div class="detail-grid">${cards}</div><div style="height:16px"></div>` + tablePanel("Planes asignados a socios", ["PLAN", "SOCIO", "TIPO", "ORIGEN", "ESTADO", ""], rows);
}

function openDietForm(existing = null, template = null, personal = false) {
  const source = existing || template || {
    name: "", type: "Personalizada", source: "Personalizada", meals: []
  };
  const allowedMembers = currentUser.role === "member" ? state.members.filter(m => m.email === currentUser.email) : state.members;
  const members = allowedMembers.map(m => `<option value="${esc(m.email)}" ${(existing?.memberEmail === m.email || (!existing && m.email === currentUser.email)) ? "selected" : ""}>${esc(m.name)} (${esc(m.email)})</option>`).join("");
  const meals = (source.meals || []).map(m => `${m.time || ""} | ${m.name || ""} | ${m.food || ""}`).join("\n");
  showModal(`<h2>${existing ? "Editar dieta" : template ? "Asignar plantilla" : "Registrar dieta personalizada"}</h2><p>Una línea por comida con el formato: hora | nombre de comida | alimentos e indicaciones.</p><form id="dietForm"><input type="hidden" name="id" value="${esc(existing?.id || "")}"><input type="hidden" name="templateId" value="${esc(template?.id || "")}"><div class="field-full"><label>Nombre del plan</label><input name="name" value="${esc(source.name || "")}" required placeholder="Ej. Plan personal del especialista"></div><div><label>Tipo de plan</label><select name="type">${["Volumen", "Definición", "Recomposición corporal", "Mantenimiento", "Alimentación equilibrada", "Personalizada", "Dieta de especialista"].map(t => `<option ${source.type === t || source.name === t ? "selected" : ""}>${t}</option>`).join("")}</select></div><div><label>Socio</label><select name="memberEmail" required>${members}</select></div><div><label>Origen</label><select name="source"><option ${source.source === "Plantilla FORGE" ? "selected" : ""}>Plantilla FORGE</option><option ${source.source === "Personalizada" ? "selected" : ""}>Personalizada</option><option ${source.source === "Especialista externo" ? "selected" : ""}>Especialista externo</option><option ${source.source === "Documento externo" ? "selected" : ""}>Documento externo</option></select></div><div><label>Estado</label><select name="status"><option>Activa</option><option>Pausada</option><option>Finalizada</option></select></div><div class="field-full"><label>Comidas (hora | nombre | alimentos)</label><textarea name="meals" rows="7" placeholder="08:00 | Desayuno | Avena, leche y fruta">${esc(meals)}</textarea></div><div class="field-full"><label>Documento externo (opcional)</label><input name="document" type="file" accept=".pdf,application/pdf"></div><div class="notice-box field-full">No introduzcas datos médicos sensibles innecesarios. La referencia a documentos solo es ilustrativa; el almacenamiento seguro de archivos se conectará al backend.</div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar dieta</button></div></form>`);
}

function pageReservations() {
  if (!["admin", "reception", "instructor"].includes(currentUser.role))
    return noAccess();
  const rows = state.reservations.map(r => `<tr><td><b>${esc(r.room)}</b><small class="muted" style="display:block">${esc(r.id)}</small></td><td>${dateLabel(r.date)}</td><td>${esc(r.time)}</td><td>${esc(r.person)}</td><td>${esc(r.duration)}</td><td><span class="status ${r.status === "Pendiente" ? "warning" : ""}">${esc(r.status)}</span></td><td>${currentUser.role === "admin" ? `<button class="table-action" data-action="cancelReservation" data-id="${r.id}">Cancelar</button>` : "—"}</td></tr>`).join("");
  const roomStats = [...new Set(state.reservations.map(r => r.room))].map(name => ({
    name, count: state.reservations.filter(r => r.room === name && r.status !== "Cancelada").length
  })).sort((a, b) => b.count - a.count);
  return heading("Salones y reservas", "Consulta la agenda y evita perder reservas o espacios disponibles.", currentUser.role === "admin" ? button("＋ Nueva reserva", "newReservation") : "") + `<div class="dashboard-grid">${panel("Agenda", reservationList(state.reservations))}${panel("Reservas activas por espacio", miniBarChart("Uso de salones", roomStats, "name", "count"))}</div>` + tablePanel("Reservas registradas", ["ESPACIO", "FECHA", "HORA", "RESPONSABLE", "DURACIÓN", "ESTADO", ""], rows);
}

function pageEquipment() {
  if (!["admin", "maintenance"].includes(currentUser.role))
    return noAccess();
  const rows = state.equipment.map(e => `<tr><td><b>${esc(e.name)}</b><small class="muted" style="display:block">${esc(e.id)}</small></td><td>${esc(e.area)}</td><td><span class="status ${e.status === "Operativo" ? "" : "warning"}">${esc(e.status)}</span></td><td>${dateLabel(e.last)}</td><td>${dateLabel(e.next)}</td><td>${currentUser.role === "admin" || currentUser.role === "maintenance" ? `<button class="table-action" data-action="equipmentStatus" data-id="${e.id}">Estado</button> <button class="table-action" data-action="reportEquipmentFailure" data-id="${e.id}">Registrar falla</button>` : "—"}</td></tr>`).join("");
  return heading("Equipos y mantenimiento", "Controla el estado de los activos, revisiones e incidencias.", button("＋ Registrar equipo", "newEquipment")) + `<div class="stats-grid">${stat("Activos registrados", state.equipment.length, "Inventario demo", "⚙")}${stat("Operativos", state.equipment.filter(e => e.status === "Operativo").length, "Listos para uso", "✓")}${stat("En mantenimiento", state.equipment.filter(e => e.status !== "Operativo").length, "Requieren seguimiento", "◷")}${stat("Próxima revisión", "20 oct.", "Fecha ilustrativa", "▦")}</div>` + `<div class="notice-box">Registra cada falla desde la tabla para alimentar las estadísticas de mantenimiento.</div>` + tablePanel("Inventario de equipo", ["EQUIPO", "ÁREA", "ESTADO", "ÚLTIMO SERVICIO", "PRÓXIMO SERVICIO", ""], rows);
}

function pageFinance() {
  if (!["admin", "accounting"].includes(currentUser.role))
    return noAccess();
  const income = state.transactions.filter(t => t.type === "Ingreso").reduce((a, t) => a + Number(t.amount), 0), expenses = state.transactions.filter(t => t.type === "Gasto").reduce((a, t) => a + Number(t.amount), 0);
  const rows = state.transactions.map(t => `<tr><td>${esc(t.id)}</td><td>${dateLabel(t.date)}</td><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td><span class="status ${t.type === "Gasto" ? "warning" : ""}">${esc(t.type)}</span></td><td>${t.type === "Gasto" ? "−" : "+"}${money(t.amount)}</td></tr>`).join("");
  return heading("Contabilidad", "Consulta ingresos, gastos y movimientos registrados.", currentUser.role === "admin" ? button("＋ Registrar movimiento", "newTransaction") : "") + `<div class="stats-grid">${stat("Ingresos registrados", money(income), "Datos demo", "＄")}${stat("Gastos registrados", money(expenses), "Datos demo", "↘")}${stat("Balance demo", money(income - expenses), "No representa contabilidad real", "＝")}${stat("Movimientos", state.transactions.length, "Registros visibles", "▤")}</div>` + tablePanel("Movimientos recientes", ["FOLIO", "FECHA", "DESCRIPCIÓN", "CATEGORÍA", "TIPO", "IMPORTE"], rows);
}

function pageReports() {
  if (!["admin", "accounting"].includes(currentUser.role))
    return noAccess();
  const roomNames = [...new Set(state.reservations.map(r => r.room))];
  const roomStats = roomNames.map(name => ({
    name, count: state.reservations.filter(r => r.room === name && r.status !== "Cancelada").length
  })).sort((a, b) => b.count - a.count);
  const cancelled = state.reservations.filter(r => r.status === "Cancelada").length;
  const equipmentNames = [...new Set([...state.equipment.map(e => e.name), ...(state.equipmentEvents || []).map(e => e.equipmentName)])];
  const equipmentStats = equipmentNames.map(name => ({
    name, count: (state.equipmentEvents || []).filter(e => e.equipmentName === name && e.type === "Falla").length
  })).sort((a, b) => b.count - a.count).slice(0, 6);
  const dietCounts = dietTemplates.map(d => ({
    name: d.name, count: state.dietPlans.filter(p => p.type === d.name || p.type === d.id || p.name === d.name).length
  }));
  const customCount = state.dietPlans.filter(p => !dietTemplates.some(d => d.name === p.type || d.id === p.type || d.name === p.name)).length;
  dietCounts.push({ name: "Personalizada / externa", count: customCount });
  const today = todayISO();
  const mealTotal = state.mealLogs.filter(l => l.date === today).length;
  const mealDone = state.mealLogs.filter(l => l.date === today && l.status === "Completada").length;
  const followRate = mealTotal ? Math.round(mealDone / mealTotal * 100) : 0;
  return heading("Reportes", "Indicadores de uso, alimentación, salones y mantenimiento.") +
    `<div class="dashboard-grid">${panel("Tendencia de ingresos", chartHTML())}${panel("Distribución de membresías", `<div class="activity-list">${plans.map(p => {
      const count = state.members.filter(m => m.planId === p.id).length;
      return `<div class="activity-item"><div class="activity-text"><b>${p.name}</b><small>${count} socio(s)</small></div><strong>${count}</strong></div>`;
    }).join("")}</div>`)}</div>` +
    `<div class="report-grid">${panel("Tipos de dieta asignados", miniBarChart("Tipos de dieta", dietCounts, "name", "count"))}${panel("Seguimiento de comidas de hoy", `<div class="report-kpi"><strong>${followRate}%</strong><span>de comidas registradas hoy marcadas como realizadas</span></div><div class="notice-box">${mealDone} de ${mealTotal} registros de hoy figuran como realizados. Es una métrica de registro, no una evaluación nutricional.</div>`)}</div>` +
    `<div class="report-grid">${panel("Salones más reservados", miniBarChart("Reservas por salón", roomStats, "name", "count") + `<p class="muted report-foot">Reservas no canceladas · ${cancelled} canceladas en total.</p>`)}${panel("Máquinas con más fallas", miniBarChart("Fallas por equipo", equipmentStats, "name", "count") + `<p class="muted report-foot">Basado en incidencias registradas. Registra cada falla y reparación para mantener el indicador útil.</p>`)}</div>` +
    `<div class="notice-box">Las cifras se calculan con datos guardados en este navegador y son de demostración. Para decisiones reales se necesitan registros consistentes de reservas, comidas, fallas, reparaciones y costos.</div>`;
}

function pageUsers() {
  if (currentUser.role !== "admin")
    return noAccess();
  return heading("Usuarios y permisos", "Controla los accesos según el puesto y responsabilidad.") + `<div class="notice-box">En producción, el servidor debe validar cada permiso. Ocultar opciones en el navegador no protege por sí solo una API.</div><div class="detail-grid">${[{
      role: "admin", title: "Administrador", desc: "Acceso total, configuración y gestión de empleados."
    }, {
      role: "reception", title: "Recepción", desc: "Socios, membresías, pagos autorizados y asistencia."
    }, {
      role: "instructor", title: "Instructor", desc: "Alumnos asignados, rutinas y agenda de espacios."
    }, {
      role: "maintenance", title: "Mantenimiento", desc: "Inventario de equipos e incidencias."
    }, {
      role: "accounting", title: "Contabilidad", desc: "Ingresos, gastos y reportes financieros."
    }, {
      role: "member", title: "Socio", desc: "Solo su membresía, rutina, asistencias y perfil."
    }].map(r => `<article class="detail-card"><span class="detail-icon">♢</span><h3>${r.title}</h3><p>${r.desc}</p><span class="status neutral">${r.role}</span></article>`).join("")}</div>` + tablePanel("Cuentas de empleados", ["NOMBRE", "CORREO", "ROL", "ESTADO"], state.employees.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.email)}</td><td>${roleName(e.role)}</td><td><span class="status">${esc(e.status)}</span></td></tr>`).join(""));
}

function pageSettings() {
  if (currentUser.role !== "admin")
    return noAccess();
  return heading("Configuración", "Preferencias de la demo y herramientas para desarrollo.") + `<div class="panel" style="margin-bottom:16px"><div class="panel-heading"><h3>Método de acceso de socios</h3></div><p class="muted">Selecciona cómo controla el gimnasio las entradas. Esto cambia la vista del expediente, pero no configura un lector físico.</p><label for="accessMethod">Método utilizado por el gimnasio</label><select id="accessMethod"><option value="barcode" ${(state.settings?.accessMethod || "barcode") === "barcode" ? "selected" : ""}>Código de barras / credencial</option><option value="biometric" ${state.settings?.accessMethod === "biometric" ? "selected" : ""}>Huella o reconocimiento facial</option></select><p class="form-note">En modo biométrico no se mostrará un código de barras en el expediente. La verificación biométrica debe realizarse con el equipo del gimnasio y no almacenar datos biométricos en esta demo.</p></div><div class="detail-grid"><article class="detail-card"><span class="detail-icon">☁</span><h3>Conexión con API</h3><p>Configura API_BASE_URL en config.js cuando tengas un backend desplegado.</p><span class="status warning">Sin conectar</span></article><article class="detail-card"><span class="detail-icon">✉</span><h3>Correos automáticos</h3><p>El backend puede enviar confirmaciones y avisos con AWS SES.</p><span class="status warning">Sin conectar</span></article><article class="detail-card"><span class="detail-icon">▣</span><h3>Respaldos</h3><p>Planifica copias de seguridad de la base de datos en AWS.</p><span class="status neutral">Pendiente</span></article></div><div class="panel" style="margin-top:15px"><div class="panel-heading"><h3>Datos de demostración</h3></div><p class="muted">Esto elimina registros de demostración y cuentas creadas desde este navegador.</p><button class="btn btn-outline" data-action="resetDemo">Restablecer demo</button></div>`;
}

function pageCheckin() {
  if (!["admin", "reception"].includes(currentUser.role))
    return noAccess();
  return heading("Registrar asistencia", "Busca al socio y registra su entrada.") + `<section class="panel form-panel"><form id="checkinForm"><div class="field-full"><label for="checkinMember">Socio</label><select id="checkinMember" required>${state.members.map(m => `<option value="${m.id}">${esc(m.name)} — ${esc(m.id)} (${daysUntil(m.endDate) < 0 ? "membresía vencida" : "vigencia hasta " + dateLabel(m.endDate)})</option>`).join("")}</select></div><div class="field-full"><label for="checkinCode">Código de barras / folio (opcional en demo)</label><input id="checkinCode" placeholder="Escanea o escribe el folio del socio"></div><div class="form-actions"><button type="button" class="btn btn-outline" data-action="navigateMembers">Cancelar</button><button class="btn btn-primary" type="submit">Registrar entrada ✓</button></div></form></section>`;
}