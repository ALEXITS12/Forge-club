/*
 * FORGE Club — cliente inicial de Supabase.
 * Este archivo solo prepara la conexión; no migra automáticamente los módulos demo.
 * Cargado con supabase-js v2 mediante CDN en index.html.
 */
(function () {
  "use strict";

  const cfg = window.FORGE_CONFIG || {};
  const allowedTables = new Set([
    "usuarios", "socios", "membresias", "pagos",
    "mediciones", "dietas", "comidas_dieta"
  ]);

  let client = null;
  let initError = null;
  const key = (cfg.SUPABASE_PUBLISHABLE_KEY || "").trim();
  const url = (cfg.SUPABASE_URL || "").trim().replace(/\/$/, "");

  if (!url) {
    initError = new Error("Falta configurar SUPABASE_URL en config.js.");
  } else if (!key) {
    initError = new Error("Falta SUPABASE_PUBLISHABLE_KEY en config.js.");
  } else if (!window.supabase || typeof window.supabase.createClient !== "function") {
    initError = new Error("No se pudo cargar supabase-js. Comprueba tu conexión a internet.");
  } else {
    try {
      client = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (error) {
      initError = error;
    }
  }

  function requireClient() {
    if (!client) throw initError || new Error("Supabase no está inicializado.");
    return client;
  }

  function table(name) {
    if (!allowedTables.has(name)) {
      throw new Error("Tabla no autorizada en el cliente: " + name);
    }
    return requireClient().from(name);
  }

  window.ForgeSupabase = {
    get ready() { return !!client; },
    get error() { return initError; },
    get client() { return requireClient(); },
    table,
    signIn: async (email, password) => requireClient().auth.signInWithPassword({ email, password }),
    signUp: async (email, password, metadata = {}) => requireClient().auth.signUp({
      email,
      password,
      options: { data: metadata }
    }),
    signOut: async () => requireClient().auth.signOut(),
    getSession: async () => requireClient().auth.getSession(),
    getUser: async () => requireClient().auth.getUser(),
    resetPassword: async (email, redirectTo) => requireClient().auth.resetPasswordForEmail(email, {
      ...(redirectTo ? { redirectTo } : {})
    }),
    // Prueba de lectura: solo indica si la tabla es accesible; no cambia datos.
    testTable: async (name) => {
      const { error } = await table(name).select("*").limit(1);
      return { ok: !error, error: error ? error.message : null };
    }
  };
})();
