<template>
  <Layout>
    <section class="section">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <h1 class="title">Bloqueados y Eliminados</h1>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="box">
        <div class="columns is-vcentered">
          <div class="column is-4">
            <div class="field">
              <label class="label">Buscar</label>
              <div class="control">
                <input class="input" type="text" v-model="search" placeholder="DNI o Nombre..." />
              </div>
            </div>
          </div>
          <div class="column is-3">
            <div class="field">
              <label class="label">Estado</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="filterStatus">
                    <option value="all">Todos</option>
                    <option value="blocked">Bloqueados</option>
                    <option value="eliminated">Eliminados</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="box" style="padding: 0; overflow-x: auto;">
        <table class="table is-fullwidth is-striped is-hoverable" style="margin-bottom: 0;">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredUsers" :key="item.id">
              <td><span class="has-text-weight-bold">{{ item.dni }}</span></td>
              <td>{{ item.name }} {{ item.lastName }}</td>
              <td>
                <span class="tag is-danger" v-if="item.status === 'eliminated'">Eliminado</span>
                <span class="tag is-warning" v-if="item.status === 'blocked'">Bloqueado</span>
              </td>
              <td><span style="font-size: 0.9em; color: #555;">{{ item.statusReason || 'Sin motivo registrado' }}</span></td>
              <td>
                <span style="font-size: 0.85em; color: #7f8c8d;">
                  {{ item.status === 'eliminated' ? formatDateTime(item.eliminated_at) : formatDateTime(item.blocked_at) }}
                </span>
              </td>
              <td>
                <div class="buttons are-small">
                  <button
                    v-if="item.status === 'blocked'"
                    class="button is-success is-light"
                    @click="unblockUser(item)"
                    title="Desbloquear usuario"
                  >
                    <span class="icon"><i class="fas fa-unlock"></i></span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="has-text-centered has-text-grey" style="padding: 2rem;">
                No hay usuarios registrados con este estado
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import Swal from "sweetalert2";

export default {
  components: {
    Layout,
  },
  data() {
    return {
      users: [],
      loading: true,
      search: "",
      filterStatus: "all",
    };
  },
  computed: {
    filteredUsers() {
      return this.users.filter((u) => {
        let matchesSearch = true;
        if (this.search) {
          const s = this.search.toLowerCase();
          matchesSearch = 
            (u.dni && u.dni.toLowerCase().includes(s)) ||
            (u.name && u.name.toLowerCase().includes(s)) ||
            (u.lastName && u.lastName.toLowerCase().includes(s));
        }

        let matchesStatus = true;
        if (this.filterStatus !== "all") {
          matchesStatus = u.status === this.filterStatus;
        }

        return matchesSearch && matchesStatus;
      });
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        // Obtenemos bloqueados y eliminados
        const [resBlocked, resEliminated] = await Promise.all([
          api.users.GET({ filter: "blocked" }),
          api.users.GET({ filter: "eliminated" })
        ]);
        
        let arr = [];
        if (resBlocked.data && !resBlocked.data.error) arr = arr.concat(resBlocked.data.users);
        if (resEliminated.data && !resEliminated.data.error) arr = arr.concat(resEliminated.data.users);
        
        // Ordenar por fecha más reciente (blocked_at o eliminated_at)
        arr.sort((a, b) => {
          const dateA = new Date(a.eliminated_at || a.blocked_at || 0);
          const dateB = new Date(b.eliminated_at || b.blocked_at || 0);
          return dateB - dateA;
        });

        this.users = arr;
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudieron cargar los datos", "error");
      } finally {
        this.loading = false;
      }
    },
    formatDateTime(d) {
      if (!d) return "-";
      return new Date(d).toLocaleString();
    },
    async unblockUser(user) {
      const result = await Swal.fire({
        icon: "question",
        title: "Desbloquear usuario",
        html: `¿Deseas desbloquear a <b>${user.name} ${user.lastName}</b>?`,
        showCancelButton: true,
        confirmButtonText: "Sí, desbloquear",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#27ae60",
      });
      if (!result.isConfirmed) return;
      try {
        await api.users.POST({ action: "unblock", id: user.id });
        Swal.fire({ icon: "success", title: "Usuario desbloqueado", timer: 1800, showConfirmButton: false });
        this.fetchData();
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error", text: e.message });
      }
    },
  },
};
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  border-radius: 8px;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #7f8c8d;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #6e62cc;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
