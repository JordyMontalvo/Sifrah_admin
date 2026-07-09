<template>
  <Layout>
    <section class="savings-redemptions-section">
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Canjes Bono Ahorro</h1>
              <p class="page-subtitle">
                Visualiza y gestiona las compras realizadas con Bono Ahorro
              </p>
            </div>
            <div class="header-actions">
              <button class="button is-info" @click="fetchData">
                <span class="icon"><i class="fas fa-sync-alt"></i></span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="stats-grid">
            <DashboardCard
              :value="stats.total"
              label="Total canjes"
              icon="fas fa-piggy-bank"
              color="primary"
              description="Registrados en el sistema"
            />
            <DashboardCard
              :value="stats.approved"
              label="Aprobados"
              icon="fas fa-check-circle"
              color="success"
              description="Canjes confirmados"
            />
            <DashboardCard
              :value="stats.pending"
              label="Pendientes"
              icon="fas fa-clock"
              color="warning"
              description="Esperando aprobación"
            />
            <DashboardCard
              :value="stats.totalAmount"
              label="Monto canjeado"
              icon="fas fa-coins"
              color="info"
              :show-currency="true"
              description="Suma de todas las órdenes"
            />
        </div>
      </div>

      <div class="container">
        <ModernTable
          :data="tableData"
          :columns="tableColumns"
          :row-class="tableRowClass"
          title="Lista de canjes"
          subtitle="Compras realizadas mediante Bono Ahorro"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="true"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          search-placeholder="Buscar por nombre o DNI..."
          :filters="tableFilters"
          :initial-filters="initialTableFilters"
          @item-action="handleItemAction"
          @search="handleSearch"
          @filter="handleFilter"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        >
          <template #cell-date="{ row }">
            <div style="display: flex; flex-direction: column; gap: 4px">
              <span>{{ formatDateTime(row.date) }}</span>
              <small
                v-if="row.period_label"
                style="color: #6b7280; font-weight: 600; font-size: 0.85em"
              >
                Período: {{ formatPeriodLabel(row.period_label) }}
              </small>
            </div>
          </template>
          <template #cell-user="{ row }">
            <div>
              <strong>{{ row.name }} {{ row.lastName }}</strong>
              <br />
              <small>DNI: {{ row.dni || "—" }}</small>
            </div>
          </template>
          <template #cell-product="{ row }">
            <span>{{ row.product || row.productsSummary || "—" }}</span>
          </template>
          <template #cell-price="{ row }">
            <span class="savings-total-coins">
              <img src="@/assets/img/coin-saldo-icon.png" alt="" />
              {{ formatCoins(row.price) }}
            </span>
          </template>
          <template #cell-pay_method="{ row }">
            <span class="tag is-light is-success">{{ formatPayMethod(row.raw || row) }}</span>
          </template>
          <template #cell-voucher="{ row }">
            <div
              v-if="hasVoucher(row)"
              style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap"
            >
              <span v-if="row.voucher && row.voucher.isImage">
                <img
                  :src="row.voucher.url"
                  alt="Voucher"
                  class="voucher-thumb"
                  @click="openImageModal(row.voucher.url)"
                />
              </span>
              <span v-else-if="row.voucher && row.voucher.url">{{
                row.voucher.url
              }}</span>
              <span v-if="row.voucher2 && row.voucher2.isImage">
                <img
                  :src="row.voucher2.url"
                  alt="Voucher 2"
                  class="voucher-thumb"
                  @click="openImageModal(row.voucher2.url)"
                />
              </span>
              <span v-else-if="row.voucher2 && row.voucher2.url">{{
                row.voucher2.url
              }}</span>
            </div>
            <span v-else class="tag is-light">No aplica</span>
          </template>
          <template #cell-payment_split="{ row }">
            <div
              style="display: flex; flex-direction: column; gap: 4px; line-height: 1.15"
            >
              <span
                class="tag is-light is-success"
                style="align-self: flex-start"
              >
                {{ paymentSplitDisplay(row.raw || row).modeLabel }}
              </span>
              <small style="color: #374151; font-weight: 700">
                Aplicado:
                {{ formatCoins(paymentSplitDisplay(row.raw || row).paid_savings) }}
                /
                {{ formatCoins((row.raw || row).price) }}
              </small>
              <small style="color: #6b7280">
                Faltante:
                {{ formatCoins(paymentSplitDisplay(row.raw || row).due) }}
              </small>
            </div>
          </template>
          <template #cell-status="{ row }">
            <span class="tag" :class="statusTagClass(row.status)">
              {{ statusLabel(row.status) }}
            </span>
            <span
              v-if="row.status === 'approved'"
              class="tag is-small ml-1"
              :class="row.delivered ? 'is-success' : 'is-warning'"
            >
              {{ row.delivered ? "Entregado" : "Pend. entrega" }}
            </span>
          </template>
        </ModernTable>
      </div>

      <div v-if="showViewModal" class="modal is-active">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-card" style="max-width: 720px; width: 95%">
          <header class="modal-card-head">
            <p class="modal-card-title">
              Detalle canje #{{ selected && selected.id }}
            </p>
            <button class="delete" aria-label="close" @click="closeModal"></button>
          </header>
          <section class="modal-card-body" v-if="selected">
            <div class="detail-grid">
              <p><strong>Usuario:</strong> {{ selected.name }} {{ selected.lastName }}</p>
              <p><strong>DNI:</strong> {{ selected.dni }}</p>
              <p><strong>Fecha:</strong> {{ formatDateTime(selected.date) }}</p>
              <p><strong>Estado:</strong> {{ statusLabel(selected.status) }}</p>
              <p><strong>Oficina:</strong> {{ selected.officeName || selected.office }}</p>
              <p><strong>Total canjeado:</strong> S/ {{ Number(selected.price || 0).toFixed(2) }}</p>
              <p><strong>Medio de pago:</strong> {{ formatPayMethod(selected) }}</p>
              <p>
                <strong>Monto faltante:</strong> S/
                {{ paymentSplitDisplay(selected).due.toFixed(2) }}
              </p>
              <p>
                <strong>Pagado con Bono Ahorro:</strong> S/
                {{ paymentSplitDisplay(selected).paid_savings.toFixed(2) }}
              </p>
              <p v-if="hasVoucher(selected)">
                <strong>Voucher:</strong>
                <a
                  v-if="selected.voucher && selected.voucher.url"
                  :href="selected.voucher.url"
                  target="_blank"
                  rel="noopener"
                >
                  Ver comprobante
                </a>
                <span v-else>—</span>
              </p>
            </div>
            <hr />
            <h4 class="title is-6">Productos</h4>
            <table class="table is-fullwidth is-striped is-narrow">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, idx) in selected.products || []" :key="idx">
                  <td>{{ p.name }}</td>
                  <td>{{ p.total }}</td>
                  <td>S/ {{ Number(p.price || 0).toFixed(2) }}</td>
                  <td>
                    S/
                    {{ (Number(p.price || 0) * Number(p.total || 1)).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="help mt-2">No genera puntos ni comisiones.</p>
          </section>
          <footer class="modal-card-foot">
            <button class="button" @click="closeModal">Cerrar</button>
          </footer>
        </div>
      </div>

      <div v-if="imageModalUrl" class="modal is-active">
        <div class="modal-background" @click="imageModalUrl = null"></div>
        <div class="modal-content" style="max-width: 90vw">
          <img :src="imageModalUrl" alt="Voucher" style="width: 100%; border-radius: 8px" />
        </div>
        <button
          class="modal-close is-large"
          aria-label="close"
          @click="imageModalUrl = null"
        ></button>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import ModernTable from "@/components/ModernTable";
import DashboardCard from "@/components/DashboardCard";
import api from "@/api";
import Swal from "sweetalert2";

export default {
  components: { Layout, ModernTable, DashboardCard },
  data() {
    return {
      tableData: [],
      stats: { total: 0, pending: 0, approved: 0, totalAmount: 0 },
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      currentFilter: "all",
      searchQuery: "",
      showViewModal: false,
      selected: null,
      imageModalUrl: null,
      tableColumns: [
        { key: "date", label: "Fecha", sortable: false },
        { key: "user", label: "Usuario", sortable: false },
        { key: "officeName", label: "Oficina", sortable: false },
        { key: "product", label: "Producto", sortable: false },
        {
          key: "price",
          label: "Total",
          sortable: false,
        },
        { key: "pay_method", label: "Medio de Pago", sortable: false },
        { key: "voucher", label: "Voucher", sortable: false },
        { key: "payment_split", label: "Monto aplicado", sortable: false },
        { key: "status", label: "Estado", sortable: false },
      ],
      initialTableFilters: { status: "" },
      tableFilters: [
        {
          key: "status",
          label: "Estado",
          type: "select",
          placeholder: "Todas",
          options: [
            { value: "", label: "Todas" },
            { value: "pending", label: "Pendientes" },
            { value: "approved", label: "Aprobadas" },
            { value: "rejected", label: "Rechazadas" },
            { value: "cancelled", label: "Anuladas" },
          ],
        },
      ],
    };
  },
  computed: {
    itemActions() {
      return [
        {
          key: "approve",
          label: "Aprobar",
          icon: "fas fa-check",
          class: "is-success",
          condition: (item) => item.status === "pending",
        },
        {
          key: "reject",
          label: "Rechazar",
          icon: "fas fa-times",
          class: "is-danger",
          condition: (item) => item.status === "pending",
        },
        {
          key: "check",
          label: "Marcar entregado",
          icon: "fas fa-box",
          class: "is-info",
          condition: (item) =>
            item.status === "approved" && !item.delivered,
        },
        {
          key: "uncheck",
          label: "Quitar entrega",
          icon: "fas fa-undo",
          class: "is-warning",
          condition: (item) =>
            item.status === "approved" && item.delivered,
        },
        {
          key: "view",
          label: "Ver detalle",
          icon: "fas fa-eye",
          class: "is-primary",
        },
        {
          key: "cancel",
          label: "Anular",
          icon: "fas fa-ban",
          class: "is-danger",
          condition: (item) => item.status !== "cancelled",
        },
      ];
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    formatDateTime(val) {
      if (!val) return "—";
      return new Date(val).toLocaleString("es-PE");
    },
    formatCoins(value) {
      const n = Number(value);
      const safe = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
      return safe.toLocaleString("es-PE");
    },
    formatPeriodLabel(label) {
      if (!label) return "—";
      const match = String(label).match(/^(\d{1,2})\/(\d{4})$/);
      if (!match) return label;
      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      const monthIndex = Number(match[1]) - 1;
      return `${months[monthIndex] || match[1]} ${match[2]}`;
    },
    formatPayMethod(row) {
      if (!row) return "—";
      if (row.payMethodLabel) return row.payMethodLabel;
      if (row.pay_method === "savings_bonus") return "Bono Ahorro";
      return row.pay_method || "Bono Ahorro";
    },
    paymentSplitDisplay(row) {
      if (row && row.paymentSplit) {
        return {
          paid_savings: Number(row.paymentSplit.paid_savings || 0),
          due: Number(row.paymentSplit.due || 0),
          modeLabel: row.paymentSplit.modeLabel || "Bono Ahorro",
        };
      }
      const price = Number((row && row.price) || 0);
      if (
        row &&
        (row.pay_method === "savings_bonus" ||
          row.order_type === "savings_bonus")
      ) {
        return {
          paid_savings: price,
          due: 0,
          modeLabel: "Bono Ahorro",
        };
      }
      return {
        paid_savings: price,
        due: 0,
        modeLabel: "Bono Ahorro",
      };
    },
    hasVoucher(row) {
      if (!row) return false;
      const v1 = row.voucher && row.voucher.url;
      const v2 = row.voucher2 && row.voucher2.url;
      return !!(v1 || v2);
    },
    openImageModal(url) {
      if (url) this.imageModalUrl = url;
    },
    statusLabel(status) {
      const map = {
        pending: "Pendiente",
        approved: "Aprobada",
        rejected: "Rechazada",
        cancelled: "Anulada",
      };
      return map[status] || status || "—";
    },
    statusTagClass(status) {
      const map = {
        pending: "is-warning",
        approved: "is-success",
        rejected: "is-danger",
        cancelled: "is-dark",
      };
      return map[status] || "is-light";
    },
    tableRowClass(item) {
      if (item.status === "rejected") return "is-danger-row";
      if (item.status === "approved") return "is-success-row";
      if (item.status === "pending") return "is-warning-row";
      return "";
    },
    async fetchData() {
      try {
        const { data } = await api.savingsRedemptions.GET({
          filter: this.currentFilter,
          page: this.currentPage,
          limit: this.itemsPerPage,
          search: this.searchQuery,
        });

        if (data.error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.msg,
          });
          return;
        }

        this.tableData = (data.redemptions || []).map((r) => ({
          ...r,
          product: r.product || r.productsSummary || "—",
          raw: r,
        }));
        this.stats = data.stats || this.stats;
        this.totalItems = data.total || 0;
        this.totalPages = data.totalPages || 1;
        this.currentPage = data.currentPage || this.currentPage;
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar la lista de canjes",
        });
      }
    },
    handleSearch(query) {
      this.searchQuery = query || "";
      this.currentPage = 1;
      this.fetchData();
    },
    handleFilter(filters) {
      const status = filters && filters.status;
      this.currentFilter = status ? status : "all";
      this.currentPage = 1;
      this.fetchData();
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchData();
    },
    handlePageSizeChange(size) {
      this.itemsPerPage = size;
      this.currentPage = 1;
      this.fetchData();
    },
    closeModal() {
      this.showViewModal = false;
      this.selected = null;
    },
    async postAction(action, item, confirmText) {
      const result = await Swal.fire({
        title: confirmText.title,
        text: confirmText.text,
        icon: confirmText.icon || "question",
        showCancelButton: true,
        confirmButtonText: confirmText.confirm || "Confirmar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return;

      try {
        const { data } = await api.savingsRedemptions.POST({ action, id: item.id });
        if (data.error) {
          Swal.fire({ icon: "error", title: "Error", text: data.msg });
          return;
        }
        Swal.fire({
          icon: "success",
          title: "Listo",
          text: data.message || "Operación realizada",
        });
        this.fetchData();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo completar la operación",
        });
      }
    },
    handleItemAction({ action, item }) {
      const row = item.raw || item;
      if (action === "view") {
        this.selected = row;
        this.showViewModal = true;
        return;
      }
      if (action === "approve") {
        this.postAction("approve", row, {
          title: "¿Aprobar canje?",
          text: `Se descontará S/ ${Number(row.price || 0).toFixed(2)} del Bono Ahorro del usuario.`,
          confirm: "Aprobar canje",
        });
      } else if (action === "reject") {
        this.postAction("reject", row, {
          title: "¿Rechazar canje?",
          text: "El usuario conservará su saldo de Bono Ahorro.",
          icon: "warning",
          confirm: "Rechazar",
        });
      } else if (action === "check") {
        this.postAction("check", row, {
          title: "¿Marcar como entregado?",
          text: "Confirma que el producto fue entregado al usuario.",
          confirm: "Marcar entregado",
        });
      } else if (action === "uncheck") {
        this.postAction("uncheck", row, {
          title: "¿Quitar marca de entrega?",
          text: "El canje volverá a estado pendiente de entrega.",
          confirm: "Confirmar",
        });
      } else if (action === "cancel") {
        this.postAction("cancel", row, {
          title: "¿Anular canje?",
          text:
            row.status === "approved"
              ? "Se revertirá el descuento del Bono Ahorro y el stock."
              : "Esta acción no se puede deshacer.",
          icon: "warning",
          confirm: "Anular",
        });
      }
    },
  },
};
</script>

<style scoped>
.savings-redemptions-section {
  padding-bottom: 48px;
}
.page-header {
  background: linear-gradient(135deg, #301050 0%, #e91e63 100%);
  color: #fff;
  padding: 28px 0 20px;
  margin-bottom: 24px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
}
.page-subtitle {
  margin: 6px 0 0;
  opacity: 0.9;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.detail-grid p {
  margin: 0;
}
.voucher-thumb {
  max-width: 60px;
  max-height: 60px;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.savings-total-coins {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #374151;
}
.savings-total-coins img {
  width: 1.15em;
  height: 1.15em;
  object-fit: contain;
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
