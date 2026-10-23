/*
 * FORGE Club — Pantallas del socio: membresía, expediente, rutina, alimentación, asistencias y perfil.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function pageMyDiet() {
  const email = currentUser.email;
  const assigned = state.dietPlans.find(d => d.memberEmail === email && d.status !== "Finalizada");
  const today = todayISO();
  const meals = assigned?.meals || [];
  const logs = state.mealLogs.filter(l => l.memberEmail === email && l.date === today);
  const done = new Set(logs.filter(l => l.status === "Completada").map(l => l.mealName));
  const completed = meals.filter(m => done.has(m.name)).length;
  const percent = meals.length ? Math.round(completed / meals.length * 100) : 0;
  const mealRows = meals.map((m, i) => `<div class="diet-meal"><div class="diet-time">${esc(m.time || "—")}</div><div class="diet-meal-info"><b>${esc(m.name)}</b><small>${esc(m.food || "Sin alimentos registrados")}</small></div><button class="btn ${done.has(m.name) ? "btn-outline" : "btn-primary"} btn-small" data-action="toggleMeal" data-id="${i}" data-name="${esc(m.name)}">${done.has(m.name) ? "✓ Realizada" : "Marcar realizada"}</button></div>`).join("");
  const history = state.mealLogs.filter(l => l.memberEmail === email).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(l => `<tr><td>${dateLabel(l.date)}</td><td>${esc(l.mealName)}</td><td><span class="status ${l.status === "Completada" ? "" : "warning"}">${esc(l.status)}</span></td></tr>`).join("");
  return heading("Mi alimentación", "Consulta tu plan y registra opcionalmente las comidas realizadas.", button("＋ Agregar mi dieta", "newPersonalDiet")) + (assigned ? `<section class="panel"><div class="panel-heading"><div><h3>${esc(assigned.name)}</h3><p class="muted">${esc(assigned.source || "Plan personalizado")} · ${esc(assigned.type || "Personalizada")}</p></div><span class="status">${percent}% registrado hoy</span></div><div class="progress-track" style="height:7px"><div class="progress-fill" style="width:${percent}%"></div></div><p class="muted" style="margin-top:10px">${completed} de ${meals.length} comidas marcadas hoy. El seguimiento es opcional y no evalúa por sí solo la calidad de tu alimentación.</p>${assigned.document ? `<div class="notice-box">Documento asociado: ${esc(assigned.document)}. El archivo original no se almacena en esta demo; se requiere backend para subirlo de forma segura.</div>` : ""}<div class="diet-meal-list">${mealRows || '<div class="empty-state"><strong>Este plan está guardado como documento</strong>Si quieres seguimiento, agrega las comidas manualmente.</div>'}</div></section>` : `<section class="panel empty-state"><span class="empty-icon">♧</span><strong>Aún no tienes una dieta registrada</strong>Elige una plantilla con tu entrenador o registra una dieta propia o de tu especialista.<div style="margin-top:14px">${button("＋ Agregar mi dieta", "newPersonalDiet")}</div></section>`) + `<div style="height:16px"></div>` + tablePanel("Historial de seguimiento", ["FECHA", "COMIDA", "ESTADO"], history) + `<div class="notice-box">Puedes registrar un plan indicado por un profesional. FORGE Club no reemplaza la asesoría de un nutriólogo y no modifica dietas externas automáticamente.</div>`;
}

function pageMyMembership() {
  const m = state.members.find(x => x.email === currentUser.email) || currentUser;
  return heading("Mi membresía", "Consulta tu plan y las fechas de vigencia.") + `<div class="membership-banner"><div><div class="eyebrow">PLAN ACTUAL</div><h2>${esc(plan(m.planId).name)}</h2><p>Inicio: ${dateLabel(m.startDate)} · Vencimiento: ${dateLabel(m.endDate)}</p></div><div><span class="status ${daysUntil(m.endDate) < 0 ? "danger" : daysUntil(m.endDate) <= 7 ? "warning" : ""}">${daysUntil(m.endDate) < 0 ? "Vencida" : daysUntil(m.endDate) <= 7 ? "Por vencer" : "Vigente"}</span><p>${money(plan(m.planId).price)} / mes</p></div></div><div class="panel"><div class="panel-heading"><h3>Detalles de la membresía</h3></div><div class="profile-info"><div class="info-item"><small>Tipo de membresía</small><b>${esc(plan(m.planId).name)}</b></div><div class="info-item"><small>Fecha de inicio</small><b>${dateLabel(m.startDate)}</b></div><div class="info-item"><small>Fecha de vencimiento</small><b>${dateLabel(m.endDate)}</b></div><div class="info-item"><small>Estado</small><b>${daysUntil(m.endDate) < 0 ? "Vencida" : "Vigente"}</b></div></div><div class="notice-box">En producción, las fechas se obtendrán de la base de datos y se enviarán por correo tras confirmar el alta o renovación.</div></div>`;
}

function currentMemberRecord() {
  return state.members.find(x => x.email === currentUser.email) || state.members.find(x => x.id === currentUser.id) || currentUser;
}

function barcodeMarkup(m) {
  const code = String(m.barcode || m.id || "FORGE-MEMBER");
  let seed = 0;
  for (const ch of code)
    seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let bars = "";
  for (let i = 0; i < 95; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const w = (seed % 3) + 1;
    bars += `<i style="width:${w}px;height:${i % 7 === 0 ? 46 : 38}px"></i>`;
  }
  return `<div class="barcode-card"><div class="barcode-top"><span class="brand-mark">F</span><div><b>FORGE CLUB</b><small>CREDENCIAL DIGITAL · DEMO</small></div><span class="status">${esc(m.status || "Activo")}</span></div><div class="barcode-bars" aria-label="Representación visual de código de barras">${bars}</div><div class="barcode-number">${esc(code)}</div><p class="muted">Este código es ilustrativo. La validación real requiere una API y un lector compatible.</p></div>`;
}

function pageMyRecord() {
  const m = currentMemberRecord();
  if (!m)
    return heading("Mi expediente", "No encontramos un expediente asociado a esta cuenta.");
  const measurements = (m.measurements || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const latest = measurements[0], previous = measurements[1];
  const weightDelta = latest && previous ? latest.weight - previous.weight : null;
  const method = state.settings?.accessMethod || "barcode";
  const history = measurements.length ? measurements.map(x => `<tr><td>${dateLabel(x.date)}</td><td>${Number(x.weight).toFixed(1)} kg</td><td>${x.bodyFat !== "" && x.bodyFat != null ? `${Number(x.bodyFat).toFixed(1)}%` : "—"}</td><td>${esc(x.notes || "—")}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty-state"><strong>Aún no hay mediciones</strong>Agrega tu peso y, si lo conoces, tu porcentaje de grasa corporal.</div></td></tr>`;
  const trend = measurements.slice(0, 8).reverse();
  const chart = trend.length > 1 ? `<div class="weight-chart">${trend.map(x => `<div class="weight-point"><span>${Number(x.weight).toFixed(1)}</span><div style="height:${Math.max(12, Math.min(100, Number(x.weight) * 1.2))}%"></div><small>${dateLabel(x.date).replace(/\s+\d{4}$/, '')}</small></div>`).join("")}</div>` : `<div class="empty-state"><strong>Tu gráfica aparecerá aquí</strong>Registra al menos dos mediciones para visualizar la tendencia.</div>`;
  return heading("Mi expediente", "Tu información personal, credencial de acceso y evolución física.", button("＋ Registrar medición", "addMeasurement")) +
    `<div class="stats-grid">${stat("Peso más reciente", latest ? `${Number(latest.weight).toFixed(1)} kg` : "Sin datos", latest ? `Registro del ${dateLabel(latest.date)}` : "Agrega tu primera medición", "↗")}${stat("Cambio desde el registro anterior", weightDelta === null ? "—" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`, weightDelta === null ? "Necesitas dos registros" : "Variación de peso, no diagnóstico", "⚖")}${stat("Grasa corporal", latest && latest.bodyFat !== "" && latest.bodyFat != null ? `${Number(latest.bodyFat).toFixed(1)}%` : "No registrada", "Dato opcional", "◉")}${stat("Asistencias registradas", m.attendance || 0, "Acumulado de la demo", "✓")}</div>` +
    `<div class="dashboard-grid"><section class="panel"><div class="panel-heading"><h3>Credencial de acceso</h3><span class="status neutral">${method === "barcode" ? "Código de barras" : "Acceso biométrico"}</span></div>${method === "barcode" ? barcodeMarkup(m) : `<div class="empty-state"><span class="empty-icon">◉</span><strong>Acceso biométrico configurado</strong>Este gimnasio utiliza huella o reconocimiento facial. Por privacidad, la página no almacena datos biométricos; el acceso lo gestiona el dispositivo del gimnasio.</div>`}</section><section class="panel"><div class="panel-heading"><h3>Datos del socio</h3></div><div class="profile-info"><div class="info-item"><small>Nombre</small><b>${esc(m.name)}</b></div><div class="info-item"><small>Folio de socio</small><b>${esc(m.id || "—")}</b></div><div class="info-item"><small>Correo</small><b>${esc(m.email)}</b></div><div class="info-item"><small>Membresía</small><b>${esc(plan(m.planId).name)}</b></div><div class="info-item"><small>Vigencia</small><b>${dateLabel(m.endDate)}</b></div><div class="info-item"><small>Rutina asignada</small><b>${esc(m.routine || "Por asignar")}</b></div></div></section></div>` +
    `<section class="panel" style="margin-top:16px"><div class="panel-heading"><div><h3>Evolución de peso</h3><p class="muted">Registros personales en el tiempo.</p></div>${button("＋ Agregar registro", "addMeasurement", "btn-outline")}</div>${chart}<div class="notice-box">El peso y el porcentaje de grasa son datos opcionales. Las variaciones pueden deberse a distintos factores; esta gráfica es informativa y no constituye una evaluación médica.</div></section>` +
    tablePanel("Historial de mediciones", ["FECHA", "PESO", "GRASA CORPORAL", "NOTAS"], history);
}

function openMeasurementForm() {
  const m = currentMemberRecord(), latest = (m.measurements || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  showModal(`<h2>Registrar medición</h2><p>Guarda un registro de tu evolución física. El porcentaje de grasa y las notas son opcionales.</p><form id="measurementForm"><div><label for="measurementDate">Fecha</label><input id="measurementDate" name="date" type="date" value="${todayISO()}" max="${todayISO()}" required></div><div><label for="measurementWeight">Peso (kg)</label><input id="measurementWeight" name="weight" type="number" min="20" max="400" step="0.1" value="${latest?.weight || ""}" required placeholder="Ej. 72.5"></div><div><label for="measurementFat">Grasa corporal (%) · opcional</label><input id="measurementFat" name="bodyFat" type="number" min="1" max="70" step="0.1" placeholder="Ej. 18.5"></div><div class="field-full"><label for="measurementNotes">Notas · opcional</label><textarea id="measurementNotes" name="notes" placeholder="Ej. medición matutina, método usado…"></textarea></div><div class="notice-box">Registra mediciones comparables, idealmente en condiciones similares. Solo tú y el personal autorizado deberían acceder a esta información.</div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar medición</button></div></form>`);
}

function pageMyRoutine() {
  return heading("Mi rutina", "Consulta el plan que te asignó tu instructor.") + `<div class="dashboard-grid">${panel("Plan de entrenamiento", `<div class="eyebrow">FUERZA / PROGRESIÓN</div><h2 style="font:700 24px var(--display);margin:12px 0">Torso / Pierna</h2><p class="muted">Ejemplo de rutina; confirma las indicaciones con tu instructor.</p><div class="routine-list"><div class="routine-item"><div class="routine-day">L</div><div><b>Torso A</b><small>Pecho · Espalda · Hombros · Brazos</small></div><span>4–5 ejercicios</span></div><div class="routine-item"><div class="routine-day">M</div><div><b>Pierna A</b><small>Cuádriceps · Femoral · Glúteo</small></div><span>4–5 ejercicios</span></div><div class="routine-item"><div class="routine-day">J</div><div><b>Torso B</b><small>Variantes y accesorios</small></div><span>4–5 ejercicios</span></div><div class="routine-item"><div class="routine-day">V</div><div><b>Pierna B</b><small>Volumen y técnica</small></div><span>4–5 ejercicios</span></div></div>`)}</div>`;
}

function pageMyAttendance() {
  const m = state.members.find(x => x.email === currentUser.email) || currentUser;
  return heading("Mis asistencias", "Revisa tu constancia de entrenamiento.") + `<div class="stats-grid">${stat("Asistencias acumuladas", m.attendance || 0, "Dato demo", "✓")}${stat("Últimos 30 días", "12", "Dato ilustrativo", "◷")}${stat("Promedio semanal", "3", "Entrenamientos", "↗")}${stat("Racha actual", "2 semanas", "Dato ilustrativo", "✳")}</div><div class="panel"><div class="panel-heading"><h3>Historial de asistencias</h3></div><div class="empty-state"><span class="empty-icon">✓</span><strong>Historial ilustrativo</strong>Las entradas reales aparecerán aquí cuando se conecte el sistema de asistencia.</div></div>`;
}

function pageProfile() {
  const m = currentUser;
  return heading("Mi perfil", "Consulta los datos de tu cuenta.") + `<div class="profile-grid"><section class="panel profile-card"><div class="profile-big-avatar">${initials(m.name)}</div><h2>${esc(m.name)}</h2><p>${esc(roleName(m.role))}</p><span class="status">Cuenta activa</span><div style="margin-top:20px">${button("Editar perfil", "editProfile", "btn-outline")}</div></section><section class="panel"><div class="panel-heading"><h3>Información personal</h3></div><div class="profile-info"><div class="info-item"><small>Nombre completo</small><b>${esc(m.name)}</b></div><div class="info-item"><small>Correo electrónico</small><b>${esc(m.email)}</b></div><div class="info-item"><small>Teléfono</small><b>${esc(m.phone || "No registrado")}</b></div><div class="info-item"><small>Tipo de cuenta</small><b>${roleName(m.role)}</b></div></div></section></div>`;
}