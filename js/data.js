/*
 * FORGE Club — Datos de demostración: membresías, usuarios, socios, empleados, equipos, reservas, rutinas, dietas y movimientos.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

const STORAGE_KEY = "forge_club_demo_v1";

const demoPassword = "ForgeDemo26!";

const plans = [
  {
    id: "base", name: "ESSENTIAL", price: 499, desc: "Lo esencial para mantener el ritmo.", features: ["Acceso a zona de entrenamiento", "Registro de asistencias", "Consulta de vigencia"]
  },
  {
    id: "plus", name: "PERFORMANCE", price: 699, desc: "Más herramientas para progresar.", features: ["Todo lo de Essential", "Seguimiento de progreso", "Acceso a clases seleccionadas"], popular: true
  },
  {
    id: "elite", name: "UNLIMITED", price: 899, desc: "Una experiencia de entrenamiento completa.", features: ["Todo lo de Performance", "Agenda prioritaria de clases", "Asesoría inicial con instructor"]
  }
];

const demoUsers = [
  {
    id: "u-admin", name: "Alex Morgan", email: "admin@forge.demo", phone: "", role: "admin", status: "Activo", password: demoPassword
  },
  {
    id: "u-coach", name: "Daniel Reyes", email: "coach@forge.demo", phone: "", role: "instructor", status: "Activo", password: demoPassword
  },
  {
    id: "u-recep", name: "Valeria Cruz", email: "recepcion@forge.demo", phone: "", role: "reception", status: "Activo", password: demoPassword
  },
  {
    id: "u-member", name: "Santiago López", email: "socio@forge.demo", phone: "", role: "member", status: "Activo", password: demoPassword, planId: "plus", startDate: todayISO(), endDate: addDays(todayISO(), 22), paid: 699, attendance: 18, routine: "Fuerza — torso/pierna"
  }
];

const seedMembers = [
  {
    id: "M-1048", name: "Santiago López", email: "socio@forge.demo", phone: "55 1234 5678", role: "member", status: "Activo", planId: "plus", startDate: addDays(todayISO(), -38), endDate: addDays(todayISO(), 22), paid: 699, attendance: 18, routine: "Fuerza — torso/pierna"
  },
  {
    id: "M-1047", name: "Camila Torres", email: "camila@example.com", phone: "55 2468 1357", role: "member", status: "Activo", planId: "elite", startDate: addDays(todayISO(), -65), endDate: addDays(todayISO(), 5), paid: 899, attendance: 26, routine: "Hipertrofia — 4 días"
  },
  {
    id: "M-1046", name: "Mateo Hernández", email: "mateo@example.com", phone: "55 9876 5432", role: "member", status: "Activo", planId: "base", startDate: addDays(todayISO(), -15), endDate: addDays(todayISO(), 15), paid: 499, attendance: 9, routine: "Acondicionamiento"
  },
  {
    id: "M-1045", name: "Valentina García", email: "valentina@example.com", phone: "55 1111 2222", role: "member", status: "Activo", planId: "plus", startDate: addDays(todayISO(), -50), endDate: addDays(todayISO(), -2), paid: 699, attendance: 21, routine: "Fuerza — torso/pierna"
  },
  {
    id: "M-1044", name: "Diego Ramírez", email: "diego@example.com", phone: "55 3333 4444", role: "member", status: "Activo", planId: "base", startDate: addDays(todayISO(), -7), endDate: addDays(todayISO(), 23), paid: 499, attendance: 4, routine: "Full body — 3 días"
  }
];

const seedEmployees = [
  {
    id: "E-001", name: "Valeria Cruz", email: "recepcion@forge.demo", phone: "55 1234 0001", position: "Recepcionista", role: "reception", status: "Activo"
  },
  {
    id: "E-002", name: "Daniel Reyes", email: "coach@forge.demo", phone: "55 1234 0002", position: "Instructor", role: "instructor", status: "Activo"
  },
  {
    id: "E-003", name: "Lucía Méndez", email: "lucia@example.com", phone: "55 1234 0003", position: "Mantenimiento", role: "maintenance", status: "Activo"
  },
  {
    id: "E-004", name: "Marco Silva", email: "marco@example.com", phone: "55 1234 0004", position: "Contabilidad", role: "accounting", status: "Activo"
  }
];

const seedEquipment = [
  {
    id: "EQ-001", name: "Caminadora 01", area: "Cardio", status: "Operativo", last: "2026-10-02", next: "2026-11-02"
  },
  {
    id: "EQ-002", name: "Polea doble", area: "Fuerza", status: "Mantenimiento", last: "2026-09-18", next: "2026-10-20"
  },
  {
    id: "EQ-003", name: "Bicicleta 04", area: "Cardio", status: "Operativo", last: "2026-10-01", next: "2026-11-01"
  }
];

const seedReservations = [
  {
    id: "RS-201", room: "Salón funcional", person: "Daniel Reyes", date: todayISO(), time: "17:00", duration: "60 min", status: "Confirmada"
  },
  {
    id: "RS-202", room: "Salón de yoga", person: "Andrea Flores", date: todayISO(), time: "18:30", duration: "45 min", status: "Confirmada"
  },
  {
    id: "RS-203", room: "Salón funcional", person: "Daniel Reyes", date: addDays(todayISO(), 1), time: "10:00", duration: "60 min", status: "Pendiente"
  }
];

const seedRoutines = [
  {
    id: "RT-001", name: "Fuerza — torso/pierna", member: "Santiago López", coach: "Daniel Reyes", days: "4 días", notes: "Progresión de cargas y técnica."
  },
  {
    id: "RT-002", name: "Hipertrofia — 4 días", member: "Camila Torres", coach: "Daniel Reyes", days: "4 días", notes: "Volumen moderado y seguimiento semanal."
  },
  {
    id: "RT-003", name: "Acondicionamiento", member: "Mateo Hernández", coach: "Daniel Reyes", days: "3 días", notes: "Resistencia general y movilidad."
  }
];

const dietTemplates = [
  {
    id: "volumen", name: "Volumen", description: "Plantilla orientativa para apoyar el aumento de masa muscular.", meals: [{
        time: "08:00", name: "Desayuno", food: "Avena con leche, plátano y crema de cacahuate"
      }, {
        time: "11:00", name: "Colación", food: "Yogur natural con granola"
      }, {
        time: "14:00", name: "Comida", food: "Pollo, arroz y verduras"
      }, {
        time: "17:30", name: "Colación", food: "Sándwich de atún"
      }, {
        time: "20:30", name: "Cena", food: "Huevos, tortillas y aguacate"
      }]
  },
  {
    id: "definicion", name: "Definición", description: "Plantilla orientativa para organizar una alimentación con objetivo de reducir grasa corporal.", meals: [{
        time: "08:00", name: "Desayuno", food: "Huevos con verduras y tortillas"
      }, {
        time: "11:00", name: "Colación", food: "Fruta y yogur natural"
      }, {
        time: "14:00", name: "Comida", food: "Proteína magra, arroz o papa y verduras"
      }, {
        time: "17:30", name: "Colación", food: "Queso cottage o alternativa equivalente"
      }, {
        time: "20:30", name: "Cena", food: "Tostadas de pollo con verduras"
      }]
  },
  {
    id: "recomposicion", name: "Recomposición corporal", description: "Plantilla orientativa que acompaña entrenamiento de fuerza y hábitos sostenibles.", meals: [{
        time: "08:00", name: "Desayuno", food: "Avena, leche y fruta"
      }, {
        time: "11:00", name: "Colación", food: "Yogur y nueces"
      }, {
        time: "14:00", name: "Comida", food: "Pescado o pollo, arroz y verduras"
      }, {
        time: "17:30", name: "Colación", food: "Pan integral con proteína"
      }, {
        time: "20:30", name: "Cena", food: "Tacos de pollo o frijoles con verduras"
      }]
  },
  {
    id: "mantenimiento", name: "Mantenimiento", description: "Plantilla orientativa para apoyar una alimentación estable y suficiente.", meals: [{
        time: "08:00", name: "Desayuno", food: "Pan integral, huevo y fruta"
      }, {
        time: "11:00", name: "Colación", food: "Fruta y semillas"
      }, {
        time: "14:00", name: "Comida", food: "Pollo, arroz, frijoles y verduras"
      }, {
        time: "17:30", name: "Colación", food: "Yogur o leche"
      }, {
        time: "20:30", name: "Cena", food: "Quesadillas con verduras y frijoles"
      }]
  },
  {
    id: "equilibrada", name: "Alimentación equilibrada", description: "Plantilla flexible de ejemplo para organizar comidas sin una meta específica de peso.", meals: [{
        time: "08:00", name: "Desayuno", food: "Avena o pan integral, proteína y fruta"
      }, {
        time: "11:00", name: "Colación", food: "Fruta o yogur"
      }, {
        time: "14:00", name: "Comida", food: "Proteína, cereal o tubérculo y verduras"
      }, {
        time: "17:30", name: "Colación", food: "Una opción práctica a elección"
      }, {
        time: "20:30", name: "Cena", food: "Comida casera variada"
      }]
  }
];

const seedDietPlans = [{
    id: "DP-001", memberEmail: "socio@forge.demo", member: "Santiago López", name: "Alimentación equilibrada", type: "equilibrada", source: "Plantilla FORGE", status: "Activa", meals: structuredClone(dietTemplates.find(d => d.id === "equilibrada").meals), createdAt: todayISO()
  }];

const seedMealLogs = [
  {
    id: "ML-001", memberEmail: "socio@forge.demo", date: addDays(todayISO(), -3), mealName: "Desayuno", status: "Completada"
  },
  {
    id: "ML-002", memberEmail: "socio@forge.demo", date: addDays(todayISO(), -3), mealName: "Comida", status: "Completada"
  },
  {
    id: "ML-003", memberEmail: "socio@forge.demo", date: addDays(todayISO(), -2), mealName: "Desayuno", status: "Completada"
  },
  {
    id: "ML-004", memberEmail: "socio@forge.demo", date: addDays(todayISO(), -1), mealName: "Desayuno", status: "Completada"
  }
];

const seedTransactions = [
  {
    id: "TX-401", type: "Ingreso", category: "Membresía Performance", description: "Renovación — Santiago López", amount: 699, date: todayISO()
  },
  {
    id: "TX-402", type: "Ingreso", category: "Membresía Unlimited", description: "Membresía — Camila Torres", amount: 899, date: addDays(todayISO(), -1)
  },
  {
    id: "TX-403", type: "Gasto", category: "Mantenimiento", description: "Servicio de polea doble", amount: 1250, date: addDays(todayISO(), -2)
  },
  {
    id: "TX-404", type: "Ingreso", category: "Membresía Essential", description: "Membresía — Mateo Hernández", amount: 499, date: addDays(todayISO(), -3)
  }
];

// Reservas extra de ejemplo: una de socio, una cancelación tardía y una inasistencia (alimentan los reportes).
seedReservations.push(
  { id: "RS-204", room: "Salón de yoga", person: "Santiago López", personEmail: "socio@forge.demo", date: todayISO(), time: "19:30", duration: "60 min", status: "Confirmada" },
  { id: "RS-205", room: "Salón funcional", person: "Camila Torres", personEmail: "camila@example.com", date: addDays(todayISO(), -1), time: "18:00", duration: "60 min", status: "No asistió" },
  { id: "RS-206", room: "Salón de yoga", person: "Mateo Hernández", personEmail: "mateo@example.com", date: addDays(todayISO(), -2), time: "07:00", duration: "45 min", status: "Cancelada", cancelledAt: addDays(todayISO(), -2) + "T06:20:00", cancelledBy: "Recepción", cancelReason: "El socio avisó tarde", lateCancel: true }
);

/*
 * Historial financiero ficticio (mes actual hasta hoy + 5 meses anteriores) para que las
 * gráficas de comparación tengan datos. Se marca con demo:true y se reemplaza por pagos reales.
 */
function seedFinanceHistory() {
  const out = [], today = new Date(), prices = [499, 699, 899], names = ["Essential", "Performance", "Unlimited"];
  for (let k = 0; k <= 5; k++) {
    const first = new Date(today.getFullYear(), today.getMonth() - k, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const maxDay = k === 0 ? today.getDate() : last;
    for (let d = 1; d <= maxDay; d++) {
      const date = localISO(new Date(first.getFullYear(), first.getMonth(), d));
      // Los meses más antiguos tienen menos cobros: así se aprecia una tendencia de crecimiento.
      if ((d * 7 + k * 3) % 10 < 10 - k) {
        const i = (d + k) % 3;
        out.push({ id: `TXH-${k}${String(d).padStart(2, "0")}`, type: "Ingreso", category: `Membresía ${names[i]}`, description: `Membresía ${names[i]} — socio demo`, amount: prices[i] * (d % 4 === 0 ? 2 : 1), date, demo: true });
      }
      const exp = d === 1 ? ["Renta", "Renta del local", 8000] : d === 10 ? ["Servicios", "Luz, agua e internet", 2800 + k * 40] : d === 18 ? ["Mantenimiento", "Servicio de equipos", 1100 + k * 90] : null;
      if (exp) out.push({ id: `TXG-${k}${String(d).padStart(2, "0")}`, type: "Gasto", category: exp[0], description: exp[1], amount: exp[2], date, demo: true });
    }
  }
  return out;
}
