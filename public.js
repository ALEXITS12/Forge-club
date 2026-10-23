/*
 * FORGE Club — Página pública: planes, submenú del botón ☰ y botones de navegación rápida.
 * Frontend de demostración: no es autenticación real; sustituir por una API segura antes de producción.
 */
"use strict";

function populatePlans() {
  $("#publicPlans").innerHTML = plans.map(p => `<article class="plan-card ${p.popular ? "popular" : ""}">${p.popular ? '<span class="plan-tag">MÁS ELEGIDO</span>' : ""}<div class="plan-name">${p.name}</div><div class="plan-price">${money(p.price)}<small> / mes</small></div><p class="plan-desc">${p.desc}</p><ul class="plan-features">${p.features.map(f => `<li>${f}</li>`).join("")}</ul><button class="btn ${p.popular ? "btn-primary" : "btn-outline"}" data-plan="${p.id}">Elegir plan ↗</button></article>`).join("");
  populatePlanSelect();
}

function populatePlanSelect() {
  const s = $("#regPlan");
  if (!s)
    return;
  const old = s.value;
  s.innerHTML = '<option value="">Selecciona una membresía</option>' + plans.map(p => `<option value="${p.id}">${p.name} — ${money(p.price)}/mes</option>`).join("");
  if (plans.some(p => p.id === old))
    s.value = old;
}

// Submenú del botón ☰ de la cabecera pública
const menuBtn = $("#mobileMenu"), submenu = $("#publicSubmenu");

function setSubmenu(open) {
  submenu.classList.toggle("hidden", !open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "✕" : "☰";
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

menuBtn.addEventListener("click", e => {
  e.stopPropagation();
  setSubmenu(submenu.classList.contains("hidden"));
});

document.addEventListener("click", e => {
  if (submenu.classList.contains("hidden"))
    return;
  const item = e.target.closest(".submenu-item");
  if (item) {
    const gate = item.dataset.gate;
    if (gate) {
      pendingPage = item.dataset.goto;
      showView("login");
      showToast(gate);
    }
    else
      pendingPage = null;
    setSubmenu(false);
    return;
  }
  if (!e.target.closest("#publicSubmenu"))
    setSubmenu(false);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !submenu.classList.contains("hidden")) {
    setSubmenu(false);
    menuBtn.focus();
  }
});

// Botones pequeños de navegación: resalta la sección visible
const spyLinks = $$("#quickNav .quick-link");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting)
        spyLinks.forEach(a => a.classList.toggle("active", a.dataset.spy === en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["inicio", "quienes", "sedes", "horario"].forEach(id => {
    const el = document.getElementById(id);
    if (el)
      io.observe(el);
  });
}