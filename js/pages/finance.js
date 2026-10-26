/*
 * FORGE Club — Comparativos financieros: mes actual vs. mes anterior, últimos 6 meses y por categoría.
 * Todo se calcula con state.transactions; cada pago de membresía registrado alimenta estas gráficas.
 */
"use strict";

const monthKey = d => String(d).slice(0, 7);

function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number), d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthShort(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
}

function monthLong(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

function daysInMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function compactMoney(n) {
  n = Number(n) || 0;
  return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`;
}

function sumTx(type, key, upToDay = 31) {
  return state.transactions
    .filter(t => t.type === type && monthKey(t.date) === key && Number(t.date.slice(8, 10)) <= upToDay)
    .reduce((a, t) => a + Number(t.amount), 0);
}

function pctChange(now, before) {
  return before > 0 ? (now - before) / before * 100 : null;
}

function trendText(pct, suffix) {
  if (pct === null) return `Sin datos del mes anterior para comparar`;
  const arrow = pct > 0.05 ? "▲" : pct < -0.05 ? "▼" : "＝";
  return `${arrow} ${pct > 0 ? "+" : ""}${pct.toFixed(1)}% ${suffix}`;
}

/* Comparativo del mes en curso contra el mismo tramo del mes anterior (justo, aunque el mes no haya terminado). */
function incomeSummary() {
  const cur = monthKey(todayISO()), prev = shiftMonth(cur, -1), day = Number(todayISO().slice(8, 10));
  const curTotal = sumTx("Ingreso", cur), prevFull = sumTx("Ingreso", prev), prevSame = sumTx("Ingreso", prev, day);
  const pct = pctChange(curTotal, prevSame);
  return { cur: curTotal, prevFull, prevSame, pct, day, curKey: cur, prevKey: prev, text: trendText(pct, "vs. mismo periodo del mes anterior") };
}

/* Línea acumulada de ingresos por día del mes: mes actual (sólido) vs. mes anterior (punteado). */
function incomeCompareChart() {
  const s = incomeSummary();
  const series = key => {
    const perDay = Array(32).fill(0);
    state.transactions.filter(t => t.type === "Ingreso" && monthKey(t.date) === key).forEach(t => { perDay[Number(t.date.slice(8, 10))] += Number(t.amount); });
    let acc = 0;
    return Array.from({ length: daysInMonthKey(key) }, (_, i) => (acc += perDay[i + 1]));
  };
  const prev = series(s.prevKey), cur = series(s.curKey).slice(0, s.day);
  const n = Math.max(prev.length, daysInMonthKey(s.curKey));
  const peak = Math.max(1, ...prev, ...cur);
  const step = Math.pow(10, Math.floor(Math.log10(peak))) / 2, max = Math.ceil(peak / step) * step;
  const W = 600, H = 240, L = 46, R = 12, T = 14, B = 26;
  const x = d => L + (d - 1) / (n - 1) * (W - L - R), y = v => T + (1 - v / max) * (H - T - B);
  const path = arr => arr.map((v, i) => `${i ? "L" : "M"}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const grid = [0, 1, 2, 3, 4].map(i => { const v = max * i / 4; return `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="#ffffff12"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" fill="#969b92" font-size="10">${compactMoney(v)}</text>`; }).join("");
  const xl = [1, 5, 10, 15, 20, 25, 30].filter(d => d <= n).map(d => `<text x="${x(d)}" y="${H - 8}" text-anchor="middle" fill="#969b92" font-size="10">${d}</text>`).join("");
  const last = cur.length - 1;
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos acumulados por día: ${monthLong(s.curKey)} contra ${monthLong(s.prevKey)}">${grid}${xl}<path d="${path(prev)}" fill="none" stroke="#969b92" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/><path d="${path(cur)}" fill="none" stroke="#c6f36a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(last + 1)}" cy="${y(cur[last])}" r="4.5" fill="#c6f36a"/></svg></div>` +
    `<div class="bar-legend"><span><i class="legend-dot"></i>${monthLong(s.curKey)}: ${money(s.cur)}</span><span class="muted">- - ${monthLong(s.prevKey)}: ${money(s.prevFull)} (al día ${s.day}: ${money(s.prevSame)})</span></div>` +
    `<p class="muted report-foot">${s.text}. Ingresos acumulados día por día.</p>`;
}

/* Barras agrupadas: ingresos vs. gastos de los últimos 6 meses. */
function monthlyBarsChart(count = 6) {
  const curKey = monthKey(todayISO());
  const months = Array.from({ length: count }, (_, i) => shiftMonth(curKey, i - count + 1));
  const data = months.map(k => ({ k, inc: sumTx("Ingreso", k), exp: sumTx("Gasto", k) }));
  const peak = Math.max(1, ...data.flatMap(d => [d.inc, d.exp]));
  const W = 600, H = 230, L = 10, T = 22, B = 26, gw = (W - L * 2) / count, bw = Math.min(30, gw / 3);
  const h = v => v / peak * (H - T - B);
  const bars = data.map((d, i) => {
    const cx = L + gw * i + gw / 2;
    return `<rect x="${cx - bw - 2}" y="${H - B - h(d.inc)}" width="${bw}" height="${h(d.inc)}" rx="4" fill="#c6f36a"/><rect x="${cx + 2}" y="${H - B - h(d.exp)}" width="${bw}" height="${h(d.exp)}" rx="4" fill="#ff827b" opacity=".85"/><text x="${cx - bw / 2 - 2}" y="${H - B - h(d.inc) - 5}" text-anchor="middle" fill="#f1f2ed" font-size="10">${compactMoney(d.inc)}</text><text x="${cx}" y="${H - 8}" text-anchor="middle" fill="#969b92" font-size="10">${monthShort(d.k)}${d.k === curKey ? "*" : ""}</text>`;
  }).join("");
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos y gastos de los últimos ${count} meses">${bars}</svg></div><div class="bar-legend"><span><i class="legend-dot"></i>Ingresos</span><span><i class="legend-dot" style="background:#ff827b"></i>Gastos</span><span class="muted">* mes en curso (incompleto)</span></div>`;
}

/* Ingresos por categoría: mes anterior vs. mes actual. */
function categoryCompareTable() {
  const s = incomeSummary();
  const cats = [...new Set(state.transactions.filter(t => t.type === "Ingreso" && [s.curKey, s.prevKey].includes(monthKey(t.date))).map(t => t.category))];
  const sumCat = (c, key, day = 31) => state.transactions.filter(t => t.type === "Ingreso" && t.category === c && monthKey(t.date) === key && Number(t.date.slice(8, 10)) <= day).reduce((a, t) => a + Number(t.amount), 0);
  const rows = cats.map(c => ({ c, prev: sumCat(c, s.prevKey, s.day), cur: sumCat(c, s.curKey) })).sort((a, b) => b.cur - a.cur).map(r => {
    const p = pctChange(r.cur, r.prev);
    return `<tr><td>${esc(r.c)}</td><td>${money(r.prev)}</td><td>${money(r.cur)}</td><td><span class="status ${p !== null && p < 0 ? "danger" : ""}">${p === null ? "—" : `${p > 0 ? "+" : ""}${p.toFixed(0)}%`}</span></td></tr>`;
  }).join("");
  return tablePanel(`Ingresos por categoría (al día ${s.day} de cada mes)`, ["CATEGORÍA", monthShort(s.prevKey), monthShort(s.curKey), "CAMBIO"], rows);
}

/* Bloque completo para la pantalla de Contabilidad. */
function financeChartsBlock() {
  const s = incomeSummary(), cur = s.curKey;
  const expCur = sumTx("Gasto", cur), expPrev = sumTx("Gasto", s.prevKey, s.day), bal = s.cur - expCur;
  return `<div class="stats-grid">${stat(`Ingresos de ${monthShort(cur)}`, money(s.cur), s.text, "＄")}${stat(`Ingresos de ${monthShort(s.prevKey)} (completo)`, money(s.prevFull), `Al día ${s.day}: ${money(s.prevSame)}`, "◷")}${stat(`Gastos de ${monthShort(cur)}`, money(expCur), trendText(pctChange(expCur, expPrev), "vs. mismo periodo"), "↘")}${stat("Balance del mes", money(bal), bal >= 0 ? "Ingresos superan gastos" : "Gastos superan ingresos", "＝")}</div>` +
    `<div class="dashboard-grid">${panel("Ingresos: este mes vs. mes anterior", incomeCompareChart())}${panel("Últimos 6 meses", monthlyBarsChart())}</div>` +
    categoryCompareTable() + `<div style="height:16px"></div>`;
}

/* Bloque para Reportes (sin repetir los KPIs de Contabilidad). */
function financeReportsBlock() {
  return `<div class="dashboard-grid">${panel("Ingresos vs. gastos (6 meses)", monthlyBarsChart())}${categoryCompareTable()}</div>`;
}

/* Registra el cobro de una membresía como ingreso, para que Contabilidad y las gráficas siempre cuadren. */
function registerMembershipPayment(m, days) {
  const p = plan(m.planId), amount = Math.round(p.price * days / 30);
  const label = p.name.charAt(0) + p.name.slice(1).toLowerCase();
  const t = { id: `TX-${Date.now().toString().slice(-7)}`, type: "Ingreso", category: `Membresía ${label}`, description: `${days === 30 ? "Renovación" : "Membresía"} — ${m.name}`, amount, date: todayISO() };
  state.transactions.unshift(t);
  m.paid = (m.paid || 0) + amount;
  return t;
}
