/*
 * FORGE Club — Reservas de salones: disponibilidad, reservar, cancelar y reportes de cancelaciones.
 * Reemplaza la antigua pantalla de reservas de admin.js.
 */
"use strict";

const ROOMS = [
  { name: "Salón funcional", capacity: 20 },
  { name: "Salón de yoga", capacity: 15 },
  { name: "Área de entrenamiento", capacity: 30 }
];
const OPEN_HOUR = 6, CLOSE_HOUR = 22;       // horario del gimnasio
const CANCEL_LIMIT_HOURS = 2;                // un socio solo puede cancelar con esta anticipación
const MAX_ACTIVE_MEMBER_RES = 3;             // reservas futuras simultáneas por socio (evita acaparar salones)
const STAFF_RES_ROLES = ["admin", "reception", "instructor"];
const CANCEL_REASONS = ["Cambio de planes", "Enfermedad o lesión", "El salón no está en condiciones", "El socio avisó tarde", "Reserva duplicada", "Otro"];

let resViewDate = todayISO();

/* ---------- utilidades de tiempo ---------- */
const toMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
const fmtMin = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const resMinutes = r => parseInt(r.duration, 10) || 60;
const resStart = r => toMin(r.time);
const resEnd = r => resStart(r) + resMinutes(r);
const isActiveRes = r => r.status !== "Cancelada";
const resMoment = r => new Date(`${r.date}T${r.time}:00`);
const hoursUntil = r => (resMoment(r) - new Date()) / 3600000;

function findConflict(room, date, start, mins, ignoreId) {
  return state.reservations.find(r => r.id !== ignoreId && r.room === room && r.date === date && isActiveRes(r) && resStart(r) < start + mins && resEnd(r) > start);
}

function isOwnRes(r) {
  return !!currentUser && (r.personEmail ? r.personEmail === currentUser.email : r.person === currentUser.name);
}

/* Quién puede cancelar qué. `late` = cancelación con menos de CANCEL_LIMIT_HOURS de anticipación. */
function cancelPermission(r) {
  if (!currentUser || !isActiveRes(r) || ["No asistió", "Asistió"].includes(r.status)) return { ok: false };
  const late = hoursUntil(r) < CANCEL_LIMIT_HOURS;
  if (["admin", "reception"].includes(currentUser.role)) return { ok: true, late };
  if (!isOwnRes(r)) return { ok: false };
  if (hoursUntil(r) < 0) return { ok: false, reason: "La reserva ya inició." };
  if (currentUser.role === "member" && late) return { ok: false, reason: `Solo puedes cancelar con ${CANCEL_LIMIT_HOURS} h de anticipación. Avisa en recepción.` };
  return { ok: true, late };
}

/* ---------- disponibilidad ---------- */
function roomNow(room) {
  const today = todayISO(), n = nowMin();
  const current = state.reservations.find(r => r.room === room.name && r.date === today && isActiveRes(r) && resStart(r) <= n && resEnd(r) > n);
  if (current) return { busy: true, r: current, text: `Ocupado hasta las ${fmtMin(resEnd(current))}` };
  if (n < OPEN_HOUR * 60 || n >= CLOSE_HOUR * 60) return { busy: false, closed: true, text: "Fuera de horario" };
  const next = state.reservations.filter(r => r.room === room.name && r.date === today && isActiveRes(r) && resStart(r) > n).sort((a, b) => resStart(a) - resStart(b))[0];
  return { busy: false, text: next ? `Libre hasta las ${fmtMin(resStart(next))}` : "Libre el resto del día" };
}

function roomCards(staff) {
  return `<div class="room-grid">${ROOMS.map(room => {
    const s = roomNow(room);
    const who = s.busy && staff ? ` · ${esc(s.r.person)}` : "";
    return `<article class="room-card ${s.busy ? "busy" : "free"}"><div class="room-top"><h3>${esc(room.name)}</h3><span class="status ${s.busy ? "danger" : s.closed ? "neutral" : ""}">${s.busy ? "Ocupado" : s.closed ? "Cerrado" : "Disponible"}</span></div><p>${esc(s.text)}${who}</p><small>Capacidad: ${room.capacity} personas</small></article>`;
  }).join("")}</div>`;
}

function slotIsPast(date, hour) {
  const today = todayISO();
  return date < today || (date === today && (hour + 1) * 60 <= nowMin());
}

function availabilityGrid(date, staff) {
  const hours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const head = hours.map(h => `<th>${String(h).padStart(2, "0")}:00</th>`).join("");
  const rows = ROOMS.map(room => `<tr><th class="room-name">${esc(room.name)}</th>${hours.map(h => {
    const a = h * 60, b = a + 60;
    const r = state.reservations.find(x => x.room === room.name && x.date === date && isActiveRes(x) && resStart(x) < b && resEnd(x) > a);
    if (r) {
      return staff
        ? `<td><button class="slot slot-busy" data-action="reservationDetail" data-id="${esc(r.id)}" title="${esc(r.person)} · ${esc(r.time)} · ${esc(r.status)}">${esc(initials(r.person))}</button></td>`
        : `<td><span class="slot slot-busy" title="Ocupado">Ocupado</span></td>`;
    }
    if (slotIsPast(date, h)) return `<td><span class="slot slot-past"></span></td>`;
    return `<td><button class="slot slot-free" data-action="reserveSlot" data-room="${esc(room.name)}" data-date="${date}" data-time="${String(h).padStart(2, "0")}:00">Libre</button></td>`;
  }).join("")}</tr>`).join("");
  return `<div class="table-scroll"><table class="slot-grid"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div><div class="legend-row"><span><i style="background:#c6f36a55"></i>Libre (toca para reservar)</span><span><i style="background:#ff827b66"></i>Ocupado</span><span><i style="background:#ffffff14"></i>Hora pasada</span></div>`;
}

function dateToolbar() {
  return `<div class="res-toolbar"><label for="resDate" class="muted">Ver disponibilidad del día</label><input type="date" id="resDate" value="${resViewDate}" min="${addDays(todayISO(), -30)}"><button class="btn btn-outline" data-action="resToday">Hoy</button></div>`;
}

/* ---------- pantallas ---------- */
function reservationActions(r) {
  const out = [];
  const p = cancelPermission(r);
  const staffManage = ["admin", "reception"].includes(currentUser.role);
  if (staffManage && r.status === "Pendiente") out.push(`<button class="table-action" data-action="confirmReservation" data-id="${esc(r.id)}">Confirmar</button>`);
  if (staffManage && isActiveRes(r) && !["Asistió", "No asistió"].includes(r.status) && hoursUntil(r) < 0) {
    out.push(`<button class="table-action" data-action="markAttended" data-id="${esc(r.id)}">Asistió</button>`);
    out.push(`<button class="table-action" data-action="markNoShow" data-id="${esc(r.id)}">No asistió</button>`);
  }
  if (p.ok) out.push(`<button class="table-action" data-action="cancelReservation" data-id="${esc(r.id)}">Cancelar</button>`);
  else if (p.reason && isActiveRes(r)) out.push(`<small class="muted" title="${esc(p.reason)}">No cancelable</small>`);
  return out.join(" ") || "—";
}

function statusClass(s) {
  return s === "Cancelada" || s === "No asistió" ? "danger" : s === "Pendiente" ? "warning" : "";
}

function reservationRows(list) {
  return list.map(r => `<tr><td><b>${esc(r.room)}</b><small class="muted" style="display:block">${esc(r.id)}</small></td><td>${dateLabel(r.date)}</td><td>${esc(r.time)}–${fmtMin(resEnd(r))}</td><td>${esc(r.person)}</td><td><span class="status ${statusClass(r.status)}">${esc(r.status)}${r.lateCancel ? " (tardía)" : ""}</span></td><td>${reservationActions(r)}</td></tr>`).join("");
}

function sortedRes(list) {
  return list.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

function pageReservations() {
  if (!STAFF_RES_ROLES.includes(currentUser.role)) return noAccess();
  const today = todayISO();
  const todayList = state.reservations.filter(r => r.date === today && isActiveRes(r));
  const bookedMin = todayList.reduce((a, r) => a + resMinutes(r), 0);
  const capacityMin = ROOMS.length * (CLOSE_HOUR - OPEN_HOUR) * 60;
  const monthKeyNow = today.slice(0, 7);
  const cancelledMonth = state.reservations.filter(r => r.status === "Cancelada" && r.date.slice(0, 7) === monthKeyNow).length;
  const noShowMonth = state.reservations.filter(r => r.status === "No asistió" && r.date.slice(0, 7) === monthKeyNow).length;
  const busyNow = ROOMS.filter(r => roomNow(r).busy).length;
  return heading("Salones y reservas", "Consulta qué salones están ocupados y cuáles disponibles, y reserva o cancela con registro.", button("＋ Nueva reserva", "newReservation")) +
    `<div class="stats-grid">${stat("Ocupados ahora", `${busyNow} de ${ROOMS.length}`, `${ROOMS.length - busyNow} disponibles`, "▦")}${stat("Reservas de hoy", todayList.length, "Activas, sin canceladas", "◷")}${stat("Ocupación de hoy", `${Math.round(bookedMin / capacityMin * 100)}%`, "Horas reservadas / horas disponibles", "↗")}${stat("Cancel. y no asistencias (mes)", cancelledMonth + noShowMonth, `${cancelledMonth} canceladas · ${noShowMonth} no asistieron`, "×")}</div>` +
    roomCards(true) +
    panel("Disponibilidad por hora", dateToolbar() + availabilityGrid(resViewDate, true)) +
    `<div style="height:16px"></div>` +
    tablePanel("Reservas registradas", ["ESPACIO", "FECHA", "HORARIO", "RESPONSABLE", "ESTADO", ""], reservationRows(sortedRes(state.reservations).slice(0, 60)));
}

function pageMyReservations() {
  if (currentUser.role !== "member") return noAccess();
  const mine = sortedRes(state.reservations.filter(isOwnRes));
  const upcoming = mine.filter(r => isActiveRes(r) && hoursUntil(r) > -resMinutes(r) / 60);
  return heading("Reservar salón", "Elige un horario libre, reserva y cancela cuando lo necesites.", button("＋ Nueva reserva", "newReservation")) +
    `<div class="notice-box">Puedes cancelar hasta <b>${CANCEL_LIMIT_HOURS} horas antes</b>. Después de ese tiempo, avisa en recepción: así el salón se libera para otro socio. Máximo ${MAX_ACTIVE_MEMBER_RES} reservas activas a la vez.</div>` +
    roomCards(false) +
    panel("Horarios disponibles", dateToolbar() + availabilityGrid(resViewDate, false)) +
    `<div style="height:16px"></div>` +
    tablePanel(`Mis reservas (${upcoming.length} próximas)`, ["ESPACIO", "FECHA", "HORARIO", "RESPONSABLE", "ESTADO", ""], reservationRows(mine));
}

/* ---------- formularios ---------- */
function openNewReservation(prefill = {}) {
  const isMember = currentUser.role === "member";
  const times = [];
  for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += 30) times.push(fmtMin(m));
  const date = prefill.date || (resViewDate >= todayISO() ? resViewDate : todayISO());
  showModal(`<h2>Nueva reserva</h2><p>Reserva un salón o espacio. El sistema evita traslapes de horario.</p><form id="reservationForm"><div><label>Espacio</label><select name="room">${ROOMS.map(r => `<option ${prefill.room === r.name ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></div><div><label>Responsable</label><input name="person" value="${esc(currentUser.name)}" ${isMember ? "readonly" : ""} required></div><div><label>Fecha</label><input name="date" type="date" value="${date}" min="${todayISO()}" required></div><div><label>Hora de inicio</label><select name="time">${times.map(t => `<option ${prefill.time === t ? "selected" : ""}>${t}</option>`).join("")}</select></div><div><label>Duración</label><select name="duration"><option>45 min</option><option selected>60 min</option><option>90 min</option></select></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar reserva</button></div></form>`);
}

function createReservation(data) {
  const mins = parseInt(data.duration, 10) || 60, start = toMin(data.time), today = todayISO();
  if (data.date < today) return showToast("No se puede reservar en una fecha pasada.");
  if (data.date === today && start < nowMin()) return showToast("Esa hora ya pasó. Elige un horario posterior.");
  if (start < OPEN_HOUR * 60 || start + mins > CLOSE_HOUR * 60) return showToast(`El horario del gimnasio es de ${OPEN_HOUR}:00 a ${CLOSE_HOUR}:00.`);
  const clash = findConflict(data.room, data.date, start, mins);
  if (clash) return showToast(`Ese horario se traslapa con otra reserva (${clash.time}–${fmtMin(resEnd(clash))}).`);

  let personEmail = "";
  if (currentUser.role === "member") {
    const m = currentMemberRecord();
    if (m.endDate && daysUntil(m.endDate) < 0) return showToast("Tu membresía está vencida. Renueva en recepción para reservar.");
    const active = state.reservations.filter(r => isOwnRes(r) && isActiveRes(r) && r.date >= today && !["Asistió", "No asistió"].includes(r.status)).length;
    if (active >= MAX_ACTIVE_MEMBER_RES) return showToast(`Ya tienes ${MAX_ACTIVE_MEMBER_RES} reservas activas. Cancela una para reservar otra.`);
    personEmail = currentUser.email;
  } else {
    const match = state.members.find(m => m.name.toLowerCase() === data.person.trim().toLowerCase());
    personEmail = match ? match.email : (data.person.trim() === currentUser.name ? currentUser.email : "");
  }

  const nextNum = Math.max(200, ...state.reservations.map(r => Number(String(r.id).replace(/\D/g, "")) || 0)) + 1;
  const r = { id: `RS-${nextNum}`, room: data.room, person: data.person.trim(), personEmail, date: data.date, time: data.time, duration: `${mins} min`, status: "Confirmada", createdAt: new Date().toISOString(), createdBy: currentUser.name };
  state.reservations.unshift(r);
  logActivity("Nueva reserva creada", `${r.room} · ${dateLabel(r.date)} ${r.time}`, "▦");
  save();
  closeModal();
  resViewDate = r.date;
  navigate(currentUser.role === "member" ? "myReservations" : "reservations");
  showToast("Reserva confirmada.");
}

function openCancelReservation(id) {
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  const p = cancelPermission(r);
  if (!p.ok) return showToast(p.reason || "No tienes permiso para cancelar esta reserva.");
  showModal(`<h2>Cancelar reserva</h2><p>${esc(r.room)} · ${dateLabel(r.date)} · ${esc(r.time)}–${fmtMin(resEnd(r))} · ${esc(r.person)}</p>${p.late ? `<div class="notice-box"><b>Cancelación tardía</b>: faltan menos de ${CANCEL_LIMIT_HOURS} horas. Quedará registrada como tardía para el reporte de pérdidas.</div>` : ""}<form id="cancelReservationForm"><input type="hidden" name="id" value="${esc(r.id)}"><div class="field-full"><label>Motivo</label><select name="reason">${CANCEL_REASONS.map(x => `<option>${x}</option>`).join("")}</select></div><div class="field-full"><label>Notas (opcional)</label><textarea name="notes" placeholder="Detalles adicionales"></textarea></div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeModal">Volver</button><button class="btn btn-primary" type="submit">Confirmar cancelación</button></div></form>`);
}

function submitCancelReservation(data) {
  const r = state.reservations.find(x => x.id === data.id);
  if (!r) return;
  const p = cancelPermission(r);
  if (!p.ok) return showToast(p.reason || "No tienes permiso para cancelar esta reserva.");
  r.status = "Cancelada";
  r.cancelledAt = new Date().toISOString();
  r.cancelledBy = currentUser.name;
  r.cancelReason = data.reason + (data.notes && data.notes.trim() ? ` — ${data.notes.trim()}` : "");
  r.lateCancel = !!p.late;
  logActivity(p.late ? "Cancelación tardía de reserva" : "Reserva cancelada", `${r.room} · ${dateLabel(r.date)} ${r.time}`, "×");
  save();
  closeModal();
  renderPage();
  showToast("Reserva cancelada y registrada. El horario quedó libre.");
}

function openReservationDetail(id) {
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  const p = cancelPermission(r);
  showModal(`<h2>${esc(r.room)}</h2><p>Reserva ${esc(r.id)}</p><div class="profile-info"><div class="info-item"><small>Responsable</small><b>${esc(r.person)}</b></div><div class="info-item"><small>Fecha</small><b>${dateLabel(r.date)}</b></div><div class="info-item"><small>Horario</small><b>${esc(r.time)}–${fmtMin(resEnd(r))}</b></div><div class="info-item"><small>Estado</small><b>${esc(r.status)}</b></div>${r.cancelReason ? `<div class="info-item"><small>Motivo de cancelación</small><b>${esc(r.cancelReason)}</b></div>` : ""}</div><div class="modal-actions"><button class="btn btn-outline" data-action="closeModal">Cerrar</button>${p.ok ? `<button class="btn btn-primary" data-action="cancelReservation" data-id="${esc(r.id)}">Cancelar reserva</button>` : ""}</div>`);
}

function setReservationStatus(id, status, text) {
  if (!["admin", "reception"].includes(currentUser.role)) return showToast("Solo administración o recepción pueden hacer este cambio.");
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  r.status = status;
  logActivity(text, `${r.room} · ${r.person} · ${dateLabel(r.date)} ${r.time}`, "▦");
  save();
  renderPage();
  showToast(text + ".");
}

/* ---------- indicadores para Reportes ---------- */
function reservationInsightsBlock() {
  const all = state.reservations, total = all.length;
  const cancelled = all.filter(r => r.status === "Cancelada"), late = cancelled.filter(r => r.lateCancel).length;
  const noShow = all.filter(r => r.status === "No asistió").length;
  const lost = cancelled.length + noShow, rate = total ? Math.round(lost / total * 100) : 0;
  const hourCounts = {};
  all.filter(isActiveRes).forEach(r => { const h = `${String(Math.floor(resStart(r) / 60)).padStart(2, "0")}:00`; hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const hours = Object.keys(hourCounts).sort().map(h => ({ name: h, count: hourCounts[h] }));
  return `<div class="report-grid">${panel("Cancelaciones y no asistencias", `<div class="report-kpi"><strong>${rate}%</strong><span>de las reservas se perdieron (canceladas o sin asistir)</span></div><div class="notice-box">${cancelled.length} cancelada(s), de las cuales ${late} fueron tardías (menos de ${CANCEL_LIMIT_HOURS} h) · ${noShow} no asistieron · ${total} reservas en total. Cada cancelación guarda quién la hizo, cuándo y por qué.</div>`)}${panel("Horas con más demanda", hours.length ? miniBarChart("Reservas por hora de inicio", hours, "name", "count") : `<div class="empty-state"><strong>Sin datos</strong>Aún no hay reservas.</div>`)}</div>`;
}
