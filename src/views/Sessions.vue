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
                <th>Usuario</th>
                <th>DNI</th>
                <th>IP</th>
                <th>User-Agent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessions" :key="s.session">
                <td>{{ formatDate(s.createdAt) }}</td>
                <td>{{ s.kind }}</td>
                <td>{{ s.user ? (s.user.name + ' ' + (s.user.lastName || '')) : '-' }}</td>
                <td>{{ s.user ? s.user.dni : '-' }}</td>
                <td>{{ s.ip || '-' }}</td>
                <td style="max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ s.userAgent || '-' }}
                </td>
              </tr>
              <tr v-if="!loading && sessions.length === 0">
                <td colspan="6" style="text-align: center; padding: 24px;">Sin sesiones</td>
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

