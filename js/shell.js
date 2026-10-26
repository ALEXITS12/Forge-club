/*
 * FORGE Club — Estructura de la app: avisos, ventanas modales, cambio de pantalla, menú lateral y navegación.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function showToast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

function showModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modal").showModal();
}

function closeModal() {
  $("#modal").close();
}

function showView(view) {
  $("#publicNav").classList.toggle("hidden", view !== "home");
  $("#publicPage").classList.toggle("hidden", view !== "home");
  $("#authPage").classList.toggle("hidden", !["login", "register"].includes(view));
  $("#appPage").classList.toggle("hidden", view !== "app");
  if (view === "login" || view === "register") {
    $("#loginForm").classList.toggle("hidden", view !== "login");
    $("#registerForm").classList.toggle("hidden", view !== "register");
    if (view === "register")
      populatePlanSelect();
    window.scrollTo(0, 0);
  }
  if (view === "home")
    window.scrollTo(0, 0);
}

const navByRole = {
  admin: [{ section: "GENERAL" }, {
      id: "dashboard", label: "Resumen", icon: "⌂"
    }, {
      id: "members", label: "Socios", icon: "♙"
    }, {
      id: "employees", label: "Empleados", icon: "♧"
    }, { section: "OPERACIÓN" }, {
      id: "routines", label: "Rutinas y progreso", icon: "↗"
    }, {
      id: "diets", label: "Banco de dietas", icon: "♧"
    }, {
      id: "reservations", label: "Salones y reservas", icon: "▦"
    }, {
      id: "equipment", label: "Equipos y mantenimiento", icon: "⚙"
    }, {
      id: "finance", label: "Contabilidad", icon: "＄"
    }, { section: "SISTEMA" }, {
      id: "reports", label: "Reportes", icon: "▤"
    }, {
      id: "users", label: "Usuarios y permisos", icon: "♢"
    }, {
      id: "settings", label: "Configuración", icon: "☷"
    }],
  reception: [{ section: "RECEPCIÓN" }, {
      id: "dashboard", label: "Resumen", icon: "⌂"
    }, {
      id: "members", label: "Socios y membresías", icon: "♙"
    }, {
      id: "checkin", label: "Registrar asistencia", icon: "✓"
    }, {
      id: "reservations", label: "Reservas", icon: "▦"
    }],
  instructor: [{ section: "ENTRENAMIENTO" }, {
      id: "dashboard", label: "Mi resumen", icon: "⌂"
    }, {
      id: "routines", label: "Rutinas y progreso", icon: "↗"
    }, {
      id: "diets", label: "Dietas y seguimiento", icon: "♧"
    }, {
      id: "reservations", label: "Agenda de salones", icon: "▦"
    }, {
      id: "members", label: "Mis alumnos", icon: "♙"
    }],
  member: [{ section: "MI ESPACIO" }, {
      id: "dashboard", label: "Mi resumen", icon: "⌂"
    }, {
      id: "myMembership", label: "Mi membresía", icon: "▣"
    }, {
      id: "myRecord", label: "Mi expediente", icon: "▤"
    }, {
      id: "myRoutine", label: "Mi rutina", icon: "↗"
    }, {
      id: "myDiet", label: "Mi alimentación", icon: "♧"
    }, {
      id: "myAttendance", label: "Mis asistencias", icon: "✓"
    }, {
      id: "profile", label: "Mi perfil", icon: "♙"
    }],
  maintenance: [{ section: "MANTENIMIENTO" }, {
      id: "dashboard", label: "Resumen", icon: "⌂"
    }, {
      id: "equipment", label: "Equipos e incidencias", icon: "⚙"
    }],
  accounting: [{ section: "CONTABILIDAD" }, {
      id: "dashboard", label: "Resumen", icon: "⌂"
    }, {
      id: "finance", label: "Ingresos y gastos", icon: "＄"
    }, {
      id: "reports", label: "Reportes", icon: "▤"
    }]
};

const pageTitles = {
  dashboard: "Resumen", members: "Socios", employees: "Empleados", routines: "Rutinas y progreso", diets: "Banco de dietas", myDiet: "Mi alimentación", reservations: "Salones y reservas", equipment: "Equipos y mantenimiento", finance: "Contabilidad", reports: "Reportes", users: "Usuarios y permisos", settings: "Configuración", checkin: "Registrar asistencia", myMembership: "Mi membresía", myRecord: "Mi expediente", myRoutine: "Mi rutina", myAttendance: "Mis asistencias", profile: "Mi perfil"
};

function renderNav() {
  const nav = navByRole[currentUser.role] || navByRole.member;
  $("#sideNav").innerHTML = nav.map(n => n.section ? `<div class="nav-section">${n.section}</div>` : `<button class="nav-item ${currentPage === n.id ? "active" : ""}" data-action="navigate" data-page="${n.id}"><span class="nav-icon">${n.icon}</span>${n.label}</button>`).join("");
  $("#sideUserName").textContent = currentUser.name;
  $("#sideUserRole").textContent = roleName(currentUser.role);
  $("#sideAvatar").textContent = initials(currentUser.name);
  $("#topAvatar").textContent = initials(currentUser.name);
  $("#todayLabel").textContent = new Date().toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short"
  });
}

function openApp(user) {
  currentUser = user;
  currentPage = "dashboard";
  showView("app");
  renderNav();
  renderPage();
  $("#sidebar").classList.remove("open");
}

function navigate(page) {
  currentPage = page;
  renderNav();
  renderPage();
  $("#sidebar").classList.remove("open");
  $(".mobile-overlay")?.classList.remove("show");
}

function renderPage() {
  const routes = {
    dashboard: () => currentUser.role === "admin" ? dashboardAdmin() : currentUser.role === "member" ? dashboardMember() : currentUser.role === "instructor" ? dashboardInstructor() : currentUser.role === "reception" ? dashboardReception() : dashboardOther(), members: pageMembers, employees: pageEmployees, routines: pageRoutines, diets: pageDiets, myDiet: pageMyDiet, reservations: pageReservations, equipment: pageEquipment, finance: pageFinance, reports: pageReports, users: pageUsers, settings: pageSettings, checkin: pageCheckin, myMembership: pageMyMembership, myRecord: pageMyRecord, myRoutine: pageMyRoutine, myAttendance: pageMyAttendance, profile: pageProfile
  };
  $("#breadcrumbCurrent").textContent = pageTitles[currentPage] || "Resumen";
  $("#appContent").innerHTML = (routes[currentPage] || routes.dashboard)();
}