/*
 * FORGE Club — Piezas de interfaz reutilizables: encabezados, botones, tarjetas, gráficas y tablas.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function heading(title, subtitle, actions = "") {
  return `<div class="page-heading"><div><div class="eyebrow">FORGE CLUB / ${esc(roleName(currentUser.role).toUpperCase())}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}

function button(label, action, variant = "btn-primary") {
  return `<button class="btn ${variant}" data-action="${action}">${label}</button>`;
}

function stat(label, value, change, icon) {
  return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-symbol">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-change">${change}</div></article>`;
}

function panel(title, body, extra = "") {
  return `<section class="panel"><div class="panel-heading"><div><h3>${title}</h3></div>${extra}</div>${body}</section>`;
}

function activityHTML() {
  return `<div class="activity-list">${state.activity.slice(0, 5).map(a => `<div class="activity-item"><span class="activity-icon">${a.icon || "•"}</span><div class="activity-text"><b>${esc(a.text)}</b><small>${esc(a.sub)}</small></div><span class="activity-time">${esc(a.time)}</span></div>`).join("")}</div>`;
}

function chartHTML() {
  const vals = [38, 51, 45, 65, 57, 74, 68, 86, 77, 94, 83, 100];
  return `<div class="chart-wrap"><svg viewBox="0 0 600 220" role="img" aria-label="Gráfica ilustrativa de ingresos mensuales"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#c6f36a" stop-opacity=".23"/><stop offset="100%" stop-color="#c6f36a" stop-opacity="0"/></linearGradient></defs>${[30, 75, 120, 165, 210].map(y => `<line x1="10" y1="${y}" x2="590" y2="${y}" stroke="#ffffff0d" stroke-width="1"/>`).join("")}<path d="M ${vals.map((v, i) => `${10 + i * 52.5},${210 - v * 1.8}`).join(" L ")} L 587.5 210 L 10 210 Z" fill="url(#chartFill)"/><path d="M ${vals.map((v, i) => `${10 + i * 52.5},${210 - v * 1.8}`).join(" L ")}" fill="none" stroke="#c6f36a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${10 + i * 52.5}" cy="${210 - v * 1.8}" r="3" fill="#c6f36a"/>`).join("")}</svg></div><div class="chart-labels"><span>ENE</span><span>FEB</span><span>MAR</span><span>ABR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AGO</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DIC</span></div><div class="bar-legend"><span><i class="legend-dot"></i>Ingresos ilustrativos</span><span class="muted">Datos de demostración</span></div>`;
}

function memberRows(list = state.members) {
  return list.map(m => `<tr><td><div class="member-cell"><span class="mini-avatar">${initials(m.name)}</span><span><b>${esc(m.name)}</b><small>${esc(m.id)}</small></span></div></td><td>${esc(m.email)}</td><td>${esc(plan(m.planId).name)}</td><td>${dateLabel(m.endDate)}</td><td><span class="status ${daysUntil(m.endDate) < 0 ? "danger" : daysUntil(m.endDate) <= 7 ? "warning" : ""}">${daysUntil(m.endDate) < 0 ? "Vencida" : daysUntil(m.endDate) <= 7 ? "Por vencer" : esc(m.status || "Activa")}</span></td><td><button class="table-action" data-action="memberDetail" data-id="${esc(m.id)}">Ver detalle ↗</button></td></tr>`).join("");
}

function tablePanel(title, headers, rows, extra = "") {
  return `<section class="panel table-panel"><div class="panel-heading"><div><h3>${title}</h3></div>${extra}</div><div class="table-scroll"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}"><div class="empty-state"><span class="empty-icon">⌕</span><strong>Sin registros</strong>No hay datos que mostrar todavía.</div></td></tr>`}</tbody></table></div></section>`;
}

function reservationList(list) {
  if (!list.length)
    return `<div class="empty-state"><span class="empty-icon">▦</span><strong>Sin reservas</strong>No hay sesiones en este horario.</div>`;
  return `<div class="calendar-list">${list.map(r => `<div class="calendar-row"><span class="time">${esc(r.time)}</span><span class="calendar-color"></span><div><b>${esc(r.room)}</b><small>${esc(r.person)} · ${esc(r.duration)}</small></div><em>${esc(r.status)}</em></div>`).join("")}</div>`;
}

function miniBarChart(title, items, labelKey, valueKey) {
  const max = Math.max(1, ...items.map(x => Number(x[valueKey]) || 0));
  return `<div class="mini-chart" role="img" aria-label="${esc(title)}">${items.map(x => `<div class="mini-chart-row"><span>${esc(x[labelKey])}</span><div class="mini-chart-track"><i style="width:${Math.max(3, (Number(x[valueKey]) || 0) / max * 100)}%"></i></div><b>${Number(x[valueKey]) || 0}</b></div>`).join("")}</div>`;
}

function noAccess() {
  return heading("Acceso restringido", "Tu rol no tiene permiso para consultar este módulo.") + `<div class="panel empty-state"><span class="empty-icon">♢</span><strong>Permisos insuficientes</strong>Si necesitas acceso, contacta al administrador del gimnasio.</div>`;
}