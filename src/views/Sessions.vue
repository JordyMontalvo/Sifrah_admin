<template>
  <Layout>
    <section class="section">
      <div class="container">
        <div class="level">
          <div class="level-left">
            <div>
              <h1 class="title">Sesiones</h1>
              <p class="subtitle">Control de sesiones iniciadas (app/admin).</p>
            </div>
          </div>
          <div class="level-right">
            <div class="field has-addons">
              <p class="control">
                <span class="select">
                  <select v-model="kind">
                    <option value="">Todas</option>
                    <option value="app">App</option>
                    <option value="admin">Admin</option>
                  </select>
                </span>
              </p>
              <p class="control">
                <button class="button is-info" :disabled="loading" @click="load">Refrescar</button>
              </p>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table class="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Usuario</th>
                <th>DNI</th>
                <th>IP</th>
                <th>Dispositivo</th>
                <th>Navegador</th>
                <th style="width: 120px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessions" :key="s.session">
                <td>{{ formatDate(s.createdAt) }}</td>
                <td>{{ s.kind }}</td>
                <td>
                  <span class="tag" :class="statusTagClass(s)">
                    {{ statusLabel(s) }}
                  </span>
                </td>
                <td>{{ s.user ? (s.user.name + ' ' + (s.user.lastName || '')) : '-' }}</td>
                <td>{{ s.user ? s.user.dni : '-' }}</td>
                <td>{{ s.ip || '-' }}</td>
                <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ deviceLabel(s) }}
                </td>
                <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ browserLabel(s) }}
                </td>
                <td>
                  <button
                    v-if="canRevoke(s)"
                    class="button is-small is-danger is-light"
                    :disabled="loading || revoking === s.session"
                    @click="revoke(s)"
                  >
                    Cerrar
                  </button>
                </td>
              </tr>
              <tr v-if="!loading && sessions.length === 0">
                <td colspan="9" style="text-align: center; padding: 24px;">Sin sesiones</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="help is-danger">{{ alert }}</p>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";

export default {
  components: { Layout },
  data() {
    return {
      loading: false,
      alert: null,
      kind: "",
      sessions: [],
      revoking: null,
    };
  },
  created() {
    this.load();
  },
  methods: {
    formatDate(v) {
      if (!v) return "-";
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(v);
      return d.toLocaleString();
    },
    statusLabel(s) {
      const closed = !!(s && (s.closedAt || s.revokedAt));
      return closed ? "Cerrada" : "Activa";
    },
    statusTagClass(s) {
      const closed = !!(s && (s.closedAt || s.revokedAt));
      return closed ? "is-light" : "is-success";
    },
    deviceLabel(s) {
      const os = (s && (s.os || "")) || "";
      const device = (s && (s.device || "")) || "";
      const ua = (s && (s.userAgent || "")) || "";
      if (device) return device;
      if (os) return os;
      if (ua) return ua;
      return "-";
    },
    browserLabel(s) {
      const b = (s && (s.browser || "")) || "";
      if (b) return b;
      return "-";
    },
    canRevoke(s) {
      if (!s) return false;
      const closed = !!(s.closedAt || s.revokedAt);
      if (closed) return false;
      // Por seguridad: permitir cerrar solo sesiones admin desde el panel admin.
      return String(s.kind || "") === "admin";
    },
    async revoke(s) {
      if (!s || !s.session) return;
      if (!confirm("¿Cerrar esta sesión?")) return;
      this.revoking = s.session;
      try {
        const { data } = await api.adminAuth.revokeSession({ session: s.session });
        if (data && data.error) {
          this.alert = data.msg || "No se pudo cerrar la sesión.";
          return;
        }
        await this.load();
      } catch (e) {
        this.alert =
          (e && e.response && e.response.data && e.response.data.msg) ||
          "No se pudo cerrar la sesión.";
      } finally {
        this.revoking = null;
      }
    },
    async load() {
      this.loading = true;
      this.alert = null;
      try {
        const { data } = await api.adminAuth.sessions({ kind: this.kind || undefined, limit: 200 });
        if (data && data.error) {
          this.alert = data.msg;
          this.sessions = [];
          return;
        }
        this.sessions = (data && data.sessions) || [];
      } catch (e) {
        this.alert =
          (e && e.response && e.response.data && e.response.data.msg) ||
          "No se pudo cargar sesiones.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.tag.is-light {
  background: #f5f5f5;
  color: #555;
}
</style>
