/*
 * FORGE Club — Utilidades generales: selectores, fechas, formato de dinero y textos.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

const $ = (s, root = document) => root.querySelector(s);

const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const cfg = window.FORGE_CONFIG || { DEMO_MODE: true, CURRENCY: "MXN" };

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Fecha local del navegador (no UTC), para que "hoy" coincida con el día real en México.
function todayISO() {
  return localISO(new Date());
}

function addDays(date, days) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localISO(d);
}

function money(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: cfg.CURRENCY || "MXN", maximumFractionDigits: 0
  }).format(Number(n) || 0);
}

function dateLabel(s) {
  if (!s)
    return "—";
  const d = new Date(`${s}T12:00:00`);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function initials(name = "F") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function plan(id) {
  return plans.find(p => p.id === id) || plans[0];
}

function daysUntil(s) {
  return Math.ceil((new Date(`${s}T23:59:59`) - new Date()) / 86400000);
}

function roleName(role) {
  return ({
    admin: "Administrador", instructor: "Instructor", reception: "Recepción", member: "Socio", maintenance: "Mantenimiento", accounting: "Contabilidad"
  })[role] || "Empleado";
}