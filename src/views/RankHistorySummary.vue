<template>
  <Layout>
    <section class="rank-history-summary">
      <div class="page-header">
        <div>
          <h1>Historial de Rangos y Bonos de Cierre</h1>
          <p>Vista general por usuario para seguimiento de cierres</p>
        </div>
      </div>

      <div class="filters">
        <input
          v-model="search"
          class="search-input"
          placeholder="Buscar por nombre, DNI o ID"
          @input="onSearchInput"
        />
      </div>

      <div class="table-card">
        <table class="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>DNI</th>
              <th>Rango Actual</th>
              <th>Historial Rangos</th>
              <th>Bonos de Cierre</th>
              <th>Último Bono</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <div class="user-name">{{ item.name }} {{ item.lastName }}</div>
                <div class="user-id">{{ item.id }}</div>
              </td>
              <td>{{ item.dni || "-" }}</td>
              <td>{{ item.rank || "none" }}</td>
              <td>
                <div>{{ item.rank_history_count || 0 }} registros</div>
                <div class="history-mini" v-if="item.rank_history && item.rank_history.length">
                  {{
                    item.rank_history
                      .slice(0, 2)
                      .map((h) => `${h.rank} (${h.period || formatPeriod(h.date)})`)
                      .join(" · ")
                  }}
                </div>
              </td>
              <td>S/. {{ Number(item.closure_bonus_total || 0).toFixed(2) }} ({{ item.closure_bonus_count || 0 }})</td>
              <td>{{ formatDate(item.closure_bonus_last_date) }}</td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="6" class="empty">Sin resultados</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <button class="button" :disabled="currentPage <= 1 || loading" @click="changePage(currentPage - 1)">Anterior</button>
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <button class="button" :disabled="currentPage >= totalPages || loading" @click="changePage(currentPage + 1)">Siguiente</button>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import { debounce } from "lodash";

export default {
  components: { Layout },
  data() {
    return {
      items: [],
      loading: false,
      search: "",
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 20,
    };
  },
  created() {
    const account = JSON.parse(localStorage.getItem("session"));
    this.$store.commit("SET_ACCOUNT", account);
    this.GET();
    this.debouncedSearch = debounce(() => {
      this.currentPage = 1;
      this.GET();
    }, 400);
  },
  methods: {
    async GET() {
      this.loading = true;
      try {
        const { data } = await api.rankHistory.GET({
          page: this.currentPage,
          limit: this.limit,
          search: this.search,
        });
        this.items = data.items || [];
        this.totalPages = data.totalPages || 1;
        this.total = data.total || 0;
      } finally {
        this.loading = false;
      }
    },
    onSearchInput() {
      this.debouncedSearch();
    },
    changePage(page) {
      this.currentPage = page;
      this.GET();
    },
    formatDate(v) {
      if (!v) return "-";
      const d = new Date(v);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleString("es-PE");
    },
    formatPeriod(v) {
      if (!v) return "-";
      const d = new Date(v);
      if (isNaN(d.getTime())) return "-";
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    },
  },
};
</script>

<style scoped>
.rank-history-summary { padding: 24px; }
.page-header { margin-bottom: 14px; }
.page-header h1 { margin: 0; font-size: 1.4rem; font-weight: 700; }
.page-header p { margin: 4px 0 0; color: #64748b; }
.filters { margin-bottom: 12px; }
.search-input { width: 360px; max-width: 100%; padding: 8px 10px; border: 1px solid #dbe1e8; border-radius: 8px; }
.table-card { background: #fff; border-radius: 12px; border: 1px solid #e8edf3; overflow: auto; }
.user-name { font-weight: 600; }
.user-id { color: #94a3b8; font-size: 0.8rem; }
.history-mini { color: #64748b; font-size: 0.8rem; }
.empty { text-align: center; color: #94a3b8; }
.pager { margin-top: 12px; display: flex; align-items: center; gap: 12px; }
</style>

