/*
 * FORGE Club — Estado de la aplicación: carga y guardado en localStorage, y registro de actividad.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved)
      return {
        ...saved, settings: { accessMethod: "barcode", ...(saved.settings || {}) }, users: [...demoUsers, ...(saved.users || []).filter(u => !demoUsers.some(d => d.email === u.email))]
      };
  }
  catch (e) { }
  return {
    users: demoUsers.map(u => ({ ...u })), members: seedMembers.map(x => ({ ...x })), employees: seedEmployees.map(x => ({ ...x })), equipment: seedEquipment.map(x => ({ ...x })), reservations: seedReservations.map(x => ({ ...x })), routines: seedRoutines.map(x => ({ ...x })), transactions: seedTransactions.map(x => ({ ...x })), settings: { accessMethod: "barcode" }, activity: [{
        text: "Se registró una renovación de membresía", sub: "Santiago López · Performance", time: "Hace 12 min", icon: "↻"
      }, {
        text: "Nueva reserva de salón", sub: "Salón funcional · 17:00", time: "Hace 38 min", icon: "▦"
      }, {
        text: "Revisión de equipo programada", sub: "Polea doble · Mantenimiento", time: "Hace 1 h", icon: "⚙"
      }]
  };
}

let state = loadState(), currentUser = null, currentPage = "dashboard", toastTimer, pendingPage = null;

// Migración ligera para que los navegadores que ya guardaron una versión anterior reciban los nuevos módulos.
state.dietPlans = state.dietPlans || structuredClone(seedDietPlans);

state.mealLogs = state.mealLogs || structuredClone(seedMealLogs);

state.equipmentEvents = state.equipmentEvents || [
  {
    equipmentId: "EQ-002", equipmentName: "Polea doble", date: addDays(todayISO(), -20), type: "Falla", note: "Cable desgastado"
  },
  {
    equipmentId: "EQ-001", equipmentName: "Caminadora 01", date: addDays(todayISO(), -35), type: "Falla", note: "Revisión de banda"
  },
  {
    equipmentId: "EQ-002", equipmentName: "Polea doble", date: addDays(todayISO(), -8), type: "Falla", note: "Ajuste de polea"
  },
  {
    equipmentId: "EQ-002", equipmentName: "Polea doble", date: addDays(todayISO(), -2), type: "Mantenimiento", note: "Servicio correctivo"
  }
];

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, users: state.users.filter(u => !demoUsers.some(d => d.email === u.email)) }));
  }
  catch (e) { }
}

function logActivity(text, sub, icon = "•") {
  state.activity.unshift({
    text, sub, time: "Ahora", icon
  });
  save();
}