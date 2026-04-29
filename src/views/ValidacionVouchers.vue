<template>
  <Layout>
    <section class="affiliations-section">
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Validación de Vouchers</h1>
              <p class="page-subtitle">Revisa, detecta duplicados y valida pagos bancarios</p>
            </div>
            <div class="header-actions">
              <button class="button is-info" @click="refresh">
                <span class="icon"><i class="fas fa-sync-alt"></i></span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          <!-- Tabs: Afiliaciones / Activaciones / Vouchers -->
          <div class="section-tabs" role="tablist" aria-label="Navegación Afiliaciones">
            <router-link
              to="/affiliations/all"
              class="section-tab"
              :class="{ 'is-active': $route.path.startsWith('/affiliations') }"
              role="tab"
              :aria-selected="$route.path.startsWith('/affiliations')"
            >
              Afiliaciones
            </router-link>
            <router-link
              to="/activations/all"
              class="section-tab"
              :class="{ 'is-active': $route.path.startsWith('/activations') }"
              role="tab"
              :aria-selected="$route.path.startsWith('/activations')"
            >
              Activaciones
            </router-link>
            <router-link
              to="/validacion-vouchers"
              class="section-tab"
              :class="{ 'is-active': $route.path.startsWith('/validacion-vouchers') }"
              role="tab"
              :aria-selected="$route.path.startsWith('/validacion-vouchers')"
            >
              Vouchers
            </router-link>
          </div>
        </div>
      </div>

      <div class="container">
        <ModernTable
          :data="tableData"
          :columns="tableColumns"
          :row-class="tableRowClass"
          title="Vouchers por Validar"
          subtitle="Afiliaciones y activaciones con pago por banco"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="false"
          search-placeholder="Buscar por nombre, DNI o N° operación..."
          :filters="tableFilters"
          :initial-search="search"
          :initial-filters="{ filter, kind }"
          @item-action="handleItemAction"
          @search="handleSearch"
          @filter="handleFilter"
        >
          <template #cell-date="{ row }">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <span>{{ formatDateTime(row.date) }}</span>
              <small style="color:#6b7280; font-weight:600; font-size:0.85em;">
                {{ row.kindLabel }}
              </small>
            </div>
          </template>

          <template #cell-user="{ value }">
            <span v-if="value && value.name">
              {{ value.name }} {{ value.lastName }}
              <span v-if="value.dni"> (DNI: {{ value.dni }})</span>
            </span>
            <span v-else>N/A</span>
          </template>

          <template #cell-total="{ value }">
            <span style="font-weight:800;">S/ {{ Number(value || 0).toFixed(2) }}</span>
          </template>

          <template #cell-payment="{ row }">
            <div v-if="row.payment_breakdown && row.payment_breakdown.legacy_missing_amounts">
              <span class="tag is-warning is-light">Histórico</span>
              <small style="display:block; color:#6b7280;">Sin detalle de saldo guardado</small>
            </div>
            <div v-else style="display:flex; flex-direction:column; gap:4px; line-height:1.15;">
              <span
                class="tag is-light"
                style="align-self:flex-start;"
                :class="{
                  'is-info': row.payment_breakdown.mode === 'mixed',
                  'is-success': row.payment_breakdown.mode === 'balance_only',
                  'is-dark': row.payment_breakdown.mode === 'external_only',
                }"
              >
                {{ modeLabel(row.payment_breakdown.mode) }}
              </span>
              <small v-if="row.payment_breakdown.paid_balance > 0" style="color:#374151; font-weight:700;">
                Saldo: S/ {{ Number(row.payment_breakdown.paid_balance).toFixed(2) }}
              </small>
              <small style="color:#6b7280;">
                Faltante: S/ {{ Number(row.payment_breakdown.due).toFixed(2) }}
              </small>
            </div>
          </template>

          <template #cell-voucher="{ row }">
            <div style="display:flex; gap:8px; align-items:center;">
              <!-- Voucher 1 -->
              <span v-if="row.voucher && isImage(row.voucher)">
                <img
                  :src="row.voucher"
                  alt="Voucher"
                  class="voucher-thumb"
                  @click="openImageModal(row.voucher)"
                  style="max-width: 60px; max-height: 60px; cursor:pointer; border-radius:6px; border:1px solid #eee;"
                />
              </span>
              <span v-else-if="row.voucher" class="is-size-7">{{ row.voucher }}</span>

              <!-- Voucher 2 -->
              <span v-if="row.voucher2 && isImage(row.voucher2)">
                <img
                  :src="row.voucher2"
                  alt="Voucher 2"
                  class="voucher-thumb"
                  @click="openImageModal(row.voucher2)"
                  style="max-width: 60px; max-height: 60px; cursor:pointer; border-radius:6px; border:1px solid #eee;"
                />
              </span>
              <span v-else-if="row.voucher2" class="is-size-7">{{ row.voucher2 }}</span>
            </div>
          </template>

          <template #cell-dup="{ row }">
            <span v-if="row.possibleDuplicate" class="tag is-danger is-light">
              Posible duplicado
            </span>
            <span v-else class="tag is-success is-light">OK</span>
          </template>
        </ModernTable>
      </div>

      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando vouchers...</p>
        </div>
      </div>

      <div v-if="showImageModal" class="image-modal-overlay" @click.self="closeImageModal">
        <div class="image-modal-content">
          <button class="image-modal-close" @click="closeImageModal">&times;</button>
          <img :src="imageModalUrl" alt="Voucher grande" class="image-modal-img" />
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import ModernTable from "@/components/ModernTable";
import api from "@/api";
import { debounce } from "lodash";
import Swal from "sweetalert2";

export default {
  components: { Layout, ModernTable },
  data() {
    return {
      loading: true,
      items: [],
      search: "",
      filter: "pending",
      kind: "all",
      showImageModal: false,
      imageModalUrl: "",
      tableColumns: [
        { key: "date", label: "Fecha", sortable: true, type: "date" },
        { key: "user", label: "Usuario", sortable: false },
        { key: "total", label: "Total", sortable: true, type: "currency" },
        { key: "payment", label: "Saldo / Faltante", sortable: false },
        { key: "bank", label: "Banco", sortable: true },
        { key: "voucher_number", label: "N° Operación", sortable: true },
        { key: "voucher", label: "Voucher", sortable: false },
        { key: "dup", label: "Duplicado", sortable: false },
        { key: "status", label: "Estado", sortable: true, type: "status" },
      ],
      tableFilters: [
        {
          key: "filter",
          label: "Estado",
          type: "select",
          placeholder: "Estado",
          options: [
            { value: "pending", label: "Pendiente" },
            { value: "approved", label: "Aprobada" },
            { value: "rejected", label: "Rechazada" },
            { value: "all", label: "Todos" },
          ],
        },
        {
          key: "kind",
          label: "Tipo",
          type: "select",
          placeholder: "Tipo",
          options: [
            { value: "all", label: "Todos" },
            { value: "affiliation", label: "Afiliación" },
            { value: "activation", label: "Activación" },
          ],
        },
      ],
      itemActions: [
        {
          key: "approve",
          label: "Aprobar",
          icon: "fas fa-check",
          class: "is-success",
          condition: (item) => (item.status || "").toLowerCase() === "pending",
        },
        {
          key: "reject",
          label: "Rechazar",
          icon: "fas fa-times",
          class: "is-danger",
          condition: (item) => (item.status || "").toLowerCase() === "pending",
        },
        {
          key: "open",
          label: "Ver Voucher",
          icon: "fas fa-eye",
          class: "is-primary",
          condition: (item) => !!item.voucher,
        },
      ],
    };
  },
  computed: {
    tableData() {
      return this.items.map((raw) => {
        const kindLabel = raw.kind === "activation" ? "Activación" : "Afiliación";
        return {
          date: raw.date,
          user: raw.user,
          total: raw.total,
          payment: raw.payment_breakdown,
          bank: raw.bank || "-",
          voucher_number: raw.voucher_number || "-",
          voucher: raw.voucher || "",
          dup: raw.possibleDuplicate ? "dup" : "ok",
          status: raw.status,
          // ModernTable filtra por `filter` y `kind` según las keys definidas en `tableFilters`.
          // Si no existen en el item, el filtro por defecto (pending) elimina todas las filas.
          filter: String(raw.status || "pending").toLowerCase(),
          kind: String(raw.kind || "affiliation").toLowerCase(),
          kindLabel,
          payment_breakdown: raw.payment_breakdown || null,
          possibleDuplicate: !!raw.possibleDuplicate,
          raw,
        };
      });
    },
  },
  async created() {
    const { search, voucher_number } = this.$route.query;
    if (search || voucher_number) {
      this.search = search || voucher_number;
    }

    // Primera vez: Estado=Todos, Tipo=Todos. Luego recordar lo último elegido por el admin.
    try {
      const STORAGE_KEY = "payment_validations_filters_v1";
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (parsed.filter) this.filter = parsed.filter;
          if (parsed.kind) this.kind = parsed.kind;
        }
      } else {
        this.filter = "all";
        this.kind = "all";
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ filter: this.filter, kind: this.kind }));
      }
    } catch (e) {
      // Si localStorage falla, no bloquear la vista.
      this.filter = this.filter || "all";
      this.kind = this.kind || "all";
    }

    await this.refresh();
  },
  methods: {
    tableRowClass(item) {
      if (!item || item._rowType === "separator") return null;
      if (String(item.status || "").toLowerCase() === "cancelled") {
        return "table-row--cancelled";
      }
      return null;
    },
    isImage(url) {
      if (!url) return false;
      const s = String(url);
      return (
        /\.(png|jpg|jpeg|gif|webp|svg)/i.test(s) || 
        s.startsWith("data:image/") ||
        s.includes("cloudinary.com") ||
        s.includes("blob:")
      );
    },
    modeLabel(mode) {
      if (mode === "balance_only") return "Todo con saldo";
      if (mode === "mixed") return "Mixto";
      return "Sin saldo";
    },
    formatDateTime(date) {
      if (!date) return "-";
      const d = new Date(date);
      if (isNaN(d)) return String(date);
      return (
        d.toLocaleDateString() +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    },
    openImageModal(url) {
      this.imageModalUrl = url;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.imageModalUrl = "";
    },
    buildDuplicateFlags(items) {
      // Usamos el flag possibleDuplicate que viene del backend (valida contra toda la base de datos)
      // Pero también hacemos un chequeo local rápido por si acaso
      const keyCount = new Map();
      items.forEach((it) => {
        const k = `${String(it.bank || "").toLowerCase()}::${String(it.voucher_number || "").trim()}`;
        if (!it.voucher_number) return;
        keyCount.set(k, (keyCount.get(k) || 0) + 1);
      });

      return items.map((it) => {
        const k = `${String(it.bank || "").toLowerCase()}::${String(it.voucher_number || "").trim()}`;
        const localDup = !!it.voucher_number && (keyCount.get(k) || 0) > 1;
        // Priorizamos el flag del backend if exists, sino el local
        const possibleDuplicate = it.possibleDuplicate || localDup;
        return { ...it, possibleDuplicate };
      });
    },
    async refresh() {
      this.loading = true;
      try {
        const { data } = await api.paymentValidations.GET({
          filter: this.filter,
          kind: this.kind,
        });
        let items = (data && data.items) || [];
        this.items = this.buildDuplicateFlags(items);
      } catch (e) {
        console.error("Error cargando payment-validations:", e);
        if (this.$toast) this.$toast.error("No se pudo cargar la validación de vouchers");
      } finally {
        this.loading = false;
      }
    },
    handleSearch: debounce(function (search) {
      this.search = search || "";
      this.refresh();
    }, 250),
    handleFilter(filters) {
      if (filters && filters.filter) this.filter = filters.filter;
      if (filters && filters.kind) this.kind = filters.kind;

      // Persistir elección del admin
      try {
        const STORAGE_KEY = "payment_validations_filters_v1";
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ filter: this.filter, kind: this.kind })
        );
      } catch (e) {}

      this.refresh();
    },
    async handleItemAction({ action, item }) {
      const raw = item.raw;
      if (action === "open") {
        this.openImageModal(raw.voucher);
        return;
      }
      if (action === "approve" || action === "reject") {
        const actionLabel = action === "approve" ? "aprobar" : "rechazar";
        const result = await Swal.fire({
          title: `¿Deseas ${actionLabel} este pago?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: action === "approve" ? "#3085d6" : "#d33",
          cancelButtonColor: action === "approve" ? "#d33" : "#3085d6",
          confirmButtonText: `Sí, ${actionLabel}`,
          cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        Swal.fire({
          title: "Procesando...",
          text: "Por favor espere.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const { data } = await api.paymentValidations.POST({
            action,
            id: raw.id,
            kind: raw.kind,
          });
          // El backend a veces responde 200 con `{ error:true, msg }`.
          if (data && data.error) {
            const msg = data.msg || "No se pudo ejecutar la acción";
            Swal.fire("Aviso", msg, "warning");
            return;
          }
          
          Swal.fire("¡Éxito!", `El pago fue ${action === "approve" ? "aprobado" : "rechazado"} correctamente.`, "success");
          await this.refresh();
        } catch (e) {
          console.error("Error acción validación:", e);
          const msg =
            (e.response && e.response.data && (e.response.data.msg || e.response.data.error)) ||
            e.message ||
            "No se pudo ejecutar la acción";
          Swal.fire("Error", msg, "error");
        }
      }
    },
  },
};
</script>

<style scoped>
.affiliations-section {
  min-height: 100vh;
  background: #f8f9fa;
}
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
}
.section-tabs {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-bottom: 6px;
}
.section-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}
.section-tab:hover {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-1px);
}
.section-tab.is-active {
  background: rgba(255, 255, 255, 0.95);
  color: #3b2b5a;
  border-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
.page-subtitle {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
}
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.image-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.image-modal-content {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
}
.image-modal-img {
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 8px;
}
.image-modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
}
</style>
