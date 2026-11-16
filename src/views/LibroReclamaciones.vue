<template>
  <Layout>
    <section class="complaints-section">
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Libro de Reclamaciones</h1>
              <p class="page-subtitle">
                Reclamos y quejas registrados desde el formulario público
                <a :href="publicUrl" target="_blank" rel="noopener">{{ publicUrl }}</a>
              </p>
            </div>
            <div class="header-right">
              <button class="button is-light" :class="{ 'is-loading': loading }" @click="load">
                <span class="icon"><i class="fas fa-sync-alt"></i></span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="stats-grid">
          <DashboardCard :value="summary.total" label="Total de registros" icon="fas fa-book-open" color="primary" description="Reclamos y quejas" />
          <DashboardCard :value="summary.reclamos" label="Reclamos" icon="fas fa-box-open" color="warning" description="Relacionados a productos" />
          <DashboardCard :value="summary.quejas" label="Quejas" icon="fas fa-comment-dots" color="info" description="Atención al público" />
        </div>
      </div>

      <div class="container">
        <p v-if="loadError" class="notification is-danger is-light">{{ loadError }}</p>
        <ModernTable
          :data="rows"
          :columns="tableColumns"
          title="Registros"
          subtitle="N.º de registro, fecha, consumidor, tipo y producto"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="false"
          search-placeholder="Buscar por n.º, nombre, documento, contacto o producto..."
          :filters="tableFilters"
          :initial-filters="{ kind: 'all', operation: 'all' }"
          :item-actions="itemActions"
          @item-action="handleItemAction"
        >
          <template #cell-code="{ value }">
            <strong class="code">{{ value }}</strong>
          </template>
          <template #cell-consumer="{ row }">
            <div class="person-cell">
              <span>{{ row.consumer.full_name }}</span>
              <small>{{ row.consumer.doc_type_label }} {{ row.consumer.doc_number }}</small>
              <small v-if="row.consumer.is_minor" class="minor-tag">Menor de edad</small>
            </div>
          </template>
          <template #cell-contact="{ row }">
            <div class="person-cell">
              <span>{{ row.consumer.email || row.consumer.phone }}</span>
              <small v-if="row.consumer.email">{{ row.email_sent ? "Copia enviada" : "Copia no enviada" }}</small>
            </div>
          </template>
          <template #cell-kind="{ row }">
            <span class="tag" :class="row.kind === 'queja' ? 'is-info is-light' : 'is-warning is-light'">
              {{ row.detail.kind_label }}
            </span>
          </template>
          <template #cell-amount="{ value }">
            <span>{{ value == null ? "—" : `S/ ${Number(value).toFixed(2)}` }}</span>
          </template>
        </ModernTable>
      </div>

      <div class="modal" :class="{ 'is-active': !!selected }">
        <div class="modal-background" @click="selected = null"></div>
        <div class="modal-card" v-if="selected">
          <header class="modal-card-head">
            <p class="modal-card-title">
              {{ selected.detail.kind_label }} N.º {{ selected.code }}
            </p>
            <button class="delete" aria-label="Cerrar" @click="selected = null"></button>
          </header>
          <section class="modal-card-body">
            <p class="detail-when">{{ formatDateTime(selected.created_at) }}</p>

            <h3 class="detail-title">Información del consumidor</h3>
            <dl class="detail-list">
              <dt>Nombres</dt><dd>{{ selected.consumer.names }}</dd>
              <dt>Apellido paterno</dt><dd>{{ selected.consumer.last_name_father }}</dd>
              <dt>Apellido materno</dt><dd>{{ selected.consumer.last_name_mother }}</dd>
              <template v-if="selected.consumer.is_minor">
                <dt>Menor de edad</dt><dd>Sí</dd>
                <dt>Padre, madre o representante</dt><dd>{{ selected.consumer.guardian }}</dd>
              </template>
              <dt>Domicilio</dt><dd>{{ selected.consumer.address }}</dd>
              <dt>Documento</dt><dd>{{ selected.consumer.doc_type_label }} {{ selected.consumer.doc_number }}</dd>
              <dt>{{ selected.consumer.email ? "Correo electrónico" : "Teléfono" }}</dt>
              <dd>{{ selected.consumer.email || selected.consumer.phone }}</dd>
            </dl>

            <h3 class="detail-title">Información del producto</h3>
            <dl class="detail-list">
              <dt>Tipo de operación</dt><dd>{{ selected.product.operation_type_label }}</dd>
              <dt>Producto(s)</dt><dd>{{ selected.product.products }}</dd>
              <dt>Monto pagado</dt>
              <dd>{{ selected.product.amount == null ? "—" : `S/ ${Number(selected.product.amount).toFixed(2)}` }}</dd>
            </dl>

            <h3 class="detail-title">Detalle</h3>
            <dl class="detail-list">
              <dt>Tipo</dt><dd>{{ selected.detail.kind_label }}</dd>
            </dl>
            <p class="detail-label">Descripción de los hechos</p>
            <p class="detail-text">{{ selected.detail.description }}</p>
            <p class="detail-label">Solicitud de solución</p>
            <p class="detail-text">{{ selected.detail.request }}</p>
          </section>
          <footer class="modal-card-foot">
            <button class="button" @click="selected = null">Cerrar</button>
          </footer>
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import ModernTable from "@/components/ModernTable";
import DashboardCard from "@/components/DashboardCard";
import api from "@/api";

export default {
  components: { Layout, ModernTable, DashboardCard },
  data() {
    return {
      loading: false,
      loadError: "",
      complaints: [],
      selected: null,
      summary: { total: 0, reclamos: 0, quejas: 0 },
      itemActions: [{ key: "view", label: "Ver registro", icon: "fas fa-eye", class: "is-primary" }],
      tableColumns: [
        { key: "code", label: "N.º", sortable: true },
        { key: "created_at", label: "Fecha", sortable: true, type: "date" },
        { key: "consumer", label: "Consumidor", sortable: false },
        { key: "contact", label: "Contacto", sortable: false },
        { key: "kind", label: "Tipo", sortable: true },
        { key: "operation_label", label: "Operación", sortable: true },
        { key: "products", label: "Producto(s)", sortable: false },
        { key: "amount", label: "Monto", sortable: true },
      ],
      tableFilters: [
        {
          key: "kind",
          label: "Tipo",
          type: "select",
          placeholder: "Tipo",
          options: [
            { value: "all", label: "Todos" },
            { value: "reclamo", label: "Reclamo" },
            { value: "queja", label: "Queja" },
          ],
        },
        {
          key: "operation",
          label: "Operación",
          type: "select",
          placeholder: "Operación",
          options: [
            { value: "all", label: "Todas" },
            { value: "afiliacion", label: "Afiliación" },
            { value: "recompra", label: "Recompra (Reconsumo)" },
          ],
        },
      ],
    };
  },
  computed: {
    publicUrl() {
      const app = process.env.VUE_APP_APP || "https://sifrah.vercel.app";
      return `${String(app).replace(/\/$/, "")}/libro-de-reclamaciones`;
    },
    // Campos planos para que la búsqueda y los filtros de ModernTable funcionen
    rows() {
      return this.complaints.map((c) => ({
        ...c,
        kind: c.detail.kind,
        operation: c.product.operation_type,
        operation_label: c.product.operation_type_label,
        products: c.product.products,
        amount: c.product.amount,
        contact: c.consumer.email || c.consumer.phone,
      }));
    },
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.loadError = "";
      try {
        const { data } = await api.complaints.GET();
        if (data && data.error) {
          this.loadError = data.msg || "No se pudieron cargar los registros.";
          return;
        }
        this.complaints = (data && data.complaints) || [];
        this.summary = (data && data.summary) || this.summary;
      } catch (err) {
        this.loadError = "No se pudieron cargar los registros.";
      } finally {
        this.loading = false;
      }
    },
    handleItemAction({ action, item }) {
      if (action === "view") this.selected = item;
    },
    formatDateTime(value) {
      return new Date(value).toLocaleString("es-PE", {
        timeZone: "America/Lima",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    },
  },
};
</script>

<style scoped>
.complaints-section {
  padding-bottom: 32px;
}
.page-header {
  padding: 24px 0 12px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #111;
}
.page-subtitle {
  color: #666;
  margin-top: 4px;
  word-break: break-word;
}
.page-subtitle a {
  color: #e91e63;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.code {
  font-variant-numeric: tabular-nums;
}
.person-cell {
  display: flex;
  flex-direction: column;
}
.person-cell small {
  color: #777;
}
.minor-tag {
  color: #e91e63 !important;
  font-weight: 600;
}
.detail-when {
  color: #666;
  margin-bottom: 8px;
}
.detail-title {
  margin: 16px 0 8px;
  color: #e91e63;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.4px;
}
.detail-list {
  display: grid;
  grid-template-columns: minmax(140px, 38%) 1fr;
  gap: 6px 12px;
}
.detail-list dt {
  color: #666;
}
.detail-list dd {
  margin: 0;
  font-weight: 600;
  color: #111;
  word-break: break-word;
}
.detail-label {
  margin-top: 12px;
  color: #666;
}
.detail-text {
  white-space: pre-wrap;
  word-break: break-word;
  background: #fafafa;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111;
}
@media (max-width: 600px) {
  .detail-list {
    grid-template-columns: 1fr;
  }
  .detail-list dd {
    margin-bottom: 6px;
  }
}
</style>
