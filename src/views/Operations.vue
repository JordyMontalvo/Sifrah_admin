<template>
  <Layout>
    <div class="operations-page">
      <header class="ops-header">
        <div class="ops-header-inner">
          <h1 class="ops-title">
            <i class="fas fa-shopping-cart"></i>
            Operaciones de Socio
          </h1>

          <div class="ops-search">
            <input
              v-model.trim="dniInput"
              type="text"
              class="ops-dni-input"
              placeholder="DNI del socio"
              inputmode="numeric"
              :disabled="iframeLoading"
              @keydown.enter.prevent="searchMember"
            />
            <button
              type="button"
              class="ops-search-btn"
              :disabled="!canSearch"
              @click="searchMember"
            >
              <i class="fas fa-search"></i>
              <span>{{ iframeLoading ? "Cargando..." : "Buscar Socio" }}</span>
            </button>
          </div>
        </div>
      </header>

      <div v-if="activeDni" class="ops-member-bar">
        <div class="ops-member-info">
          <span class="ops-member-dni">{{ activeDni }}</span>
          <span class="ops-member-sep">→</span>
          <span class="ops-member-name">
            <template v-if="memberNameLoading">…</template>
            <template v-else-if="memberName">{{ memberName }}</template>
            <template v-else-if="memberNotFound">Socio sin registro encontrado</template>
          </span>
        </div>
        <div class="ops-member-actions">
          <button type="button" class="ops-chip-btn" @click="copyDni">
            <i class="fas fa-copy"></i> Copiar DNI
          </button>
          <button type="button" class="ops-chip-btn" @click="copyOfficePassword">
            <i class="fas fa-key"></i> Copiar Clave
          </button>
          <button type="button" class="ops-chip-btn ops-chip-btn--outline" @click="clearMember">
            <i class="fas fa-user-times"></i> Cambiar Socio
          </button>
        </div>
      </div>

      <main class="ops-main">
        <div v-if="!activeDni" class="ops-empty">
          <div class="ops-empty-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <h2>Ingresa el DNI del socio</h2>
          <p>
            Pulsa «Buscar Socio» para abrir la sesión del cliente en esta pantalla,
            igual que la vista de operaciones de referencia.
          </p>
        </div>

        <iframe
          v-else
          :key="iframeKey"
          :src="iframeSrc"
          class="ops-iframe"
          title="Sesión del socio"
          @load="onIframeLoad"
        />
      </main>
    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import Swal from "sweetalert2";

const PRODUCTION_APP_URL = "https://sifrah.vercel.app";
const STORAGE_KEY = "sifrah_operations_dni";

function isPrivateNetworkHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (!h || h === "localhost" || h === "127.0.0.1") return true;
  if (h.endsWith(".local")) return true;
  if (h.startsWith("192.168.") || h.startsWith("10.")) return true;
  return /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

function isPrivateNetworkUrl(url) {
  try {
    return isPrivateNetworkHost(new URL(url).hostname);
  } catch (e) {
    return false;
  }
}

/** URL de la app embebida en iframe (nunca localhost si el admin está en HTTPS público). */
function resolveEmbedAppUrl() {
  const isPublicAdmin =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    !isPrivateNetworkHost(window.location.hostname);

  const candidates = [
    process.env.VUE_APP_APP,
    process.env.NODE_ENV === "production" ? PRODUCTION_APP_URL : null,
    process.env.VUE_APP_ROOT,
    PRODUCTION_APP_URL,
  ]
    .map((v) => (v ? String(v).trim().replace(/\/$/, "") : ""))
    .filter(Boolean);

  for (const url of candidates) {
    if (isPublicAdmin && isPrivateNetworkUrl(url)) continue;
    return url;
  }

  return PRODUCTION_APP_URL;
}

export default {
  components: { Layout },
  data() {
    return {
      dniInput: "",
      activeDni: "",
      memberName: "",
      memberNameLoading: false,
      memberNotFound: false,
      iframeSrc: "",
      iframeKey: 0,
      iframeLoading: false,
      officePassword: process.env.VUE_APP_OFFICE_PASSWORD || "2374",
    };
  },
  computed: {
    canSearch() {
      return !!String(this.dniInput || "").trim() && !this.iframeLoading;
    },
    appPath() {
      const filter = this.$route.params.filter;
      if (filter === "plan") return "affiliation";
      if (filter === "products") return "activation";
      return "dashboard";
    },
  },
  watch: {
    "$route.params.filter"() {
      if (this.activeDni) {
        this.reloadIframe({ silent: true });
      }
    },
  },
  async created() {
    await this.loadOfficePassword();

    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.dniInput = saved;
      await this.searchMember({ silent: true });
    }
  },
  methods: {
    async loadOfficePassword() {
      try {
        const { data } = await api.generalPassword.GET();
        if (data && !data.error && data.office_password) {
          this.officePassword = data.office_password;
        }
      } catch (e) {
        console.warn("No se pudo cargar clave de oficina", e);
      }
    },
    buildIframeSrc(dni, session) {
      const params = new URLSearchParams({
        session,
        path: this.appPath,
        dni: String(dni).trim(),
        office_id: "central",
        embed: "office",
        _t: String(Date.now()),
      });
      return `${resolveEmbedAppUrl()}/sudo-login?${params.toString()}`;
    },
    async fetchMemberName(dni) {
      this.memberNameLoading = true;
      this.memberName = "";
      this.memberNotFound = false;
      try {
        const { data } = await api.users.GET({
          filter: "all",
          search: String(dni).trim(),
          page: 1,
          limit: 20,
        });
        if (data && data.error) {
          this.memberNotFound = true;
          return;
        }
        const users = data.users || [];
        const exact = users.find(
          (u) => String(u.dni || "").trim() === String(dni).trim()
        );
        if (exact) {
          this.memberName = [exact.name, exact.lastName].filter(Boolean).join(" ");
        } else {
          this.memberNotFound = true;
        }
      } catch (e) {
        console.error("Error buscando socio:", e);
        this.memberNotFound = true;
      } finally {
        this.memberNameLoading = false;
      }
    },
    async searchMember(opts = {}) {
      const dni = String(this.dniInput || "").trim();
      if (!dni) return;

      this.iframeLoading = true;
      this.activeDni = dni;
      sessionStorage.setItem(STORAGE_KEY, dni);

      await this.fetchMemberName(dni);
      await this.reloadIframe(opts);
    },
    async reloadIframe(opts = {}) {
      if (!this.activeDni) return;
      this.iframeLoading = true;

      try {
        const { data } = await api.operations.impersonate({
          dni: this.activeDni,
          path: this.appPath,
          office_id: "central",
        });

        if (!data || data.error) {
          if (!opts.silent) {
            Swal.fire(
              "Error",
              (data && data.msg) || "No se pudo abrir la sesión del socio",
              "error"
            );
          }
          this.iframeLoading = false;
          return;
        }

        this.iframeSrc = "about:blank";
        this.iframeKey += 1;
        await this.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 80));
        this.iframeSrc = this.buildIframeSrc(this.activeDni, data.session);
        this.iframeKey += 1;
      } catch (e) {
        console.error("Error al impersonar socio:", e);
        if (!opts.silent) {
          const status = e && e.response && e.response.status;
          const serverMsg =
            e && e.response && e.response.data && e.response.data.msg;
          let msg = "No se pudo conectar con el servidor";
          if (status === 404) {
            msg =
              "El servidor aún no tiene el módulo de impersonación. Despliega el backend actualizado.";
          } else if (serverMsg) {
            msg = serverMsg;
          } else if (status) {
            msg = `Error del servidor (${status})`;
          }
          Swal.fire("Error", msg, "error");
        }
        this.iframeLoading = false;
      }
    },
    onIframeLoad() {
      this.iframeLoading = false;
    },
    clearMember() {
      this.activeDni = "";
      this.dniInput = "";
      this.memberName = "";
      this.memberNotFound = false;
      this.iframeSrc = "";
      this.iframeKey += 1;
      this.iframeLoading = false;
      sessionStorage.removeItem(STORAGE_KEY);
    },
    async copyDni() {
      if (!this.activeDni) return;
      try {
        await navigator.clipboard.writeText(this.activeDni);
        Swal.fire({
          icon: "success",
          title: "DNI copiado",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire("Error", "No se pudo copiar el DNI", "error");
      }
    },
    async copyOfficePassword() {
      try {
        await navigator.clipboard.writeText(this.officePassword);
        Swal.fire({
          icon: "success",
          title: "Clave de oficina copiada",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire("Error", "No se pudo copiar la clave", "error");
      }
    },
  },
};
</script>

<style scoped>
.operations-page {
  min-height: calc(100vh - 52px);
  background: #fdfafc;
  display: flex;
  flex-direction: column;
}

.ops-header {
  background: #e91e63;
  color: #fff;
  box-shadow: 0 2px 12px rgba(233, 30, 99, 0.25);
  position: sticky;
  top: 0;
  z-index: 20;
}

.ops-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.ops-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.ops-title i {
  font-size: 1.1rem;
}

.ops-search {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  justify-content: flex-end;
  min-width: 280px;
  max-width: 520px;
}

.ops-dni-input {
  flex: 1;
  min-width: 140px;
  border: none;
  border-radius: 6px 0 0 6px;
  padding: 10px 14px;
  font-size: 0.95rem;
  outline: none;
}

.ops-search-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 0 6px 6px 0;
  padding: 10px 16px;
  background: #c2185b;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.ops-search-btn:hover:not(:disabled) {
  background: #ad1457;
}

.ops-search-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ops-member-bar {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f0e6ec;
  background: #fff;
}

.ops-member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.95rem;
}

.ops-member-dni {
  font-weight: 700;
  color: #e91e63;
}

.ops-member-sep {
  color: #bbb;
}

.ops-member-name {
  color: #333;
}

.ops-member-missing {
  color: #c0392b;
  font-style: italic;
}

.ops-member-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ops-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e91e63;
  background: #fff;
  color: #e91e63;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ops-chip-btn:hover {
  background: #fce4ec;
}

.ops-chip-btn--outline {
  border-color: #ccc;
  color: #666;
}

.ops-chip-btn--outline:hover {
  background: #f5f5f5;
}

.ops-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ops-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  color: #666;
}

.ops-empty-icon {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 16px;
}

.ops-empty h2 {
  margin: 0 0 8px;
  color: #444;
  font-size: 1.25rem;
}

.ops-empty p {
  margin: 0;
  max-width: 420px;
  line-height: 1.5;
  color: #888;
  font-size: 0.95rem;
}

.ops-iframe {
  width: 100%;
  flex: 1;
  min-height: calc(100vh - 200px);
  border: none;
  background: #fff;
}

@media (max-width: 768px) {
  .ops-header-inner {
    flex-direction: column;
    align-items: stretch;
  }

  .ops-search {
    max-width: none;
    width: 100%;
  }

  .ops-member-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
