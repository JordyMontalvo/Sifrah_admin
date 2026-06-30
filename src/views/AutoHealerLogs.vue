<template>
  <Layout>
    <div class="pa-4">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">Logs del Auto-Sanador (Auto-Healer)</p>
          <button class="button is-primary" @click="fetchLogs" :class="{'is-loading': loading}" style="margin: 10px;">
            Refrescar
          </button>
        </header>
        <div class="card-content">
          <p class="mb-4">
            Aquí puedes ver el historial de inconsistencias de puntos que el sistema ha detectado y reparado automáticamente.
          </p>

          <table class="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Fecha de Reparación</th>
                <th>Tipo</th>
                <th>ID del Pago</th>
                <th>Usuario</th>
                <th>Cambios Realizados</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in logs" :key="item.id">
                <td>{{ new Date(item.date).toLocaleString() }}</td>
                <td>
                  <span class="tag" :class="item.collection === 'activations' ? 'is-info' : 'is-primary'">
                    {{ item.collection === 'activations' ? 'Activación' : 'Afiliación' }}
                  </span>
                </td>
                <td><strong>{{ item.target_id }}</strong></td>
                <td>{{ item.user_id }}</td>
                <td>
                  <div v-if="item.state_before && item.state_after">
                    <span v-if="item.state_before.points !== undefined">
                      Puntos: {{ item.state_before.points }} ➡️ <strong>{{ item.state_after.points }}</strong>
                    </span>
                    <br v-if="item.state_before.points !== undefined" />
                    Activado: 
                    <span :class="item.state_after.activated ? 'has-text-success' : 'has-text-danger'">
                      {{ item.state_before.activated ? 'Sí' : 'No' }} ➡️ {{ item.state_after.activated ? 'Sí' : 'No' }}
                    </span>
                  </div>
                  <div v-else>
                    Reparación de log
                  </div>
                </td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="5" class="has-text-centered">No hay registros de reparaciones.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import api from "../api";
import Layout from "@/views/Layout.vue";

export default {
  name: "AutoHealerLogs",
  components: { Layout },
  data() {
    return {
      loading: false,
      logs: [],
    };
  },
  created() {
    this.fetchLogs();
  },
  methods: {
    async fetchLogs() {
      this.loading = true;
      try {
        const res = await api.get("/admin/auto-healer-logs");
        if (res && res.logs) {
          this.logs = res.logs;
        } else if (res && res.data && res.data.logs) {
          this.logs = res.data.logs;
        }
      } catch (e) {
        console.error("Error fetching auto-healer logs", e);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
