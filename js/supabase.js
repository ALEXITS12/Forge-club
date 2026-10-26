/*
 * Cliente y utilidades de Supabase para FORGE Club.
 */
"use strict";

window.ForgeSupabase = (() => {
  const cfg = window.FORGE_CONFIG || {};
  let client = null;

  function getClient() {
    if (!cfg.SUPABASE_ENABLED) throw new Error("Supabase está desactivado en config.js.");
    if (!window.supabase?.createClient) throw new Error("No se cargó la biblioteca de Supabase.");
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) throw new Error("Falta la URL o la publishable key.");
    if (!client) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return client;
  }

  return {
    getClient,
    testConnection: async () => {
      const sb = getClient();
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      return { connected: true, hasSession: Boolean(data.session), user: data.session?.user ?? null };
    },
    signUp: async (email, password, metadata = {}) => {
      const sb = getClient();
      return await sb.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
    },
    signIn: async (email, password) => {
      const sb = getClient();
      return await sb.auth.signInWithPassword({ email, password });
    },
    table: (name) => {
      const sb = getClient();
      return sb.from(name);
    }
  };
})();