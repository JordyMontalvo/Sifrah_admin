<template>
  <Layout>
    <section class="store-orders-section">
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Tienda</h1>
              <p class="page-subtitle">Compras realizadas desde las tiendas de los socios</p>
            </div>
          </div>

          <div class="section-tabs" role="tablist" aria-label="Navegación Afiliaciones">
            <router-link
              to="/affiliations/all"
              class="section-tab"
              role="tab"
              aria-selected="false"
            >
              Afiliaciones
            </router-link>
            <router-link
              to="/activations/all"
              class="section-tab"
              role="tab"
              aria-selected="false"
            >
              Activaciones
            </router-link>
            <router-link
              to="/tienda"
              class="section-tab is-active"
              role="tab"
              aria-selected="true"
            >
              Tienda
            </router-link>
            <router-link
              to="/validacion-vouchers"
              class="section-tab"
              role="tab"
              aria-selected="false"
            >
              Vouchers
            </router-link>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="stats-grid">
          <DashboardCard
            :value="summary.total"
            label="Total de compras"
            icon="fas fa-store"
            color="primary"
            description="Pedidos de las tiendas"
          />
          <DashboardCard
            :value="summary.pending"
            label="Pendientes"
            icon="fas fa-clock"
            color="warning"
            description="Esperando revisión"
          />
          <DashboardCard
            :value="summary.approved"
            label="Aprobadas"
            icon="fas fa-check-circle"
            color="success"
            description="Compras confirmadas"
          />
          <DashboardCard
            :value="summary.amount"
            label="Importe"
            icon="fas fa-money-bill-wave"
            color="info"
            :show-currency="true"
            description="Pendientes y aprobadas"
          />
        </div>
      </div>

      <div class="container">
        <ModernTable
          :data="orders"
          :columns="tableColumns"
          title="Compras de la tienda"
          subtitle="Comprador, socio vendedor, productos, importe y estado"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="false"
          search-placeholder="Buscar por comprador, socio, DNI o producto..."
          :filters="tableFilters"
          :initial-filters="{ status: 'all' }"
          :item-actions="itemActions"
          @item-action="handleItemAction"
        >
          <template #cell-buyer="{ row }">
            <div class="person-cell">
              <span>{{ row.buyer.name }}</span>
              <small v-if="row.buyer.document">DNI {{ row.buyer.document }}</small>
              <small v-if="row.buyer.phone">{{ row.buyer.phone }}</small>
            </div>
          </template>

          <template #cell-seller="{ row }">
            <div class="person-cell">
              <span>{{ row.seller.name }}</span>
              <small v-if="row.seller.dni">DNI {{ row.seller.dni }}</small>
            </div>
          </template>

          <template #cell-points="{ value }">
            <span class="points-badge">
              <i class="fas fa-star points-icon"></i>
              {{ Number(value || 0) }} pts
            </span>
          </template>

          <template #cell-amount="{ value }">
            <span class="amount">S/ {{ Number(value || 0).toFixed(2) }}</span>
          </template>

          <template #header-comprobante>
            <div class="comprobante-header">
              <span>Comprobante</span>
              <span class="comprobante-header__right">Entrega</span>
            </div>
          </template>
          <template #cell-comprobante="{ row }">
            <div class="payment-step-stack">
              <div class="payment-step-top-row">
                <div class="payment-step-top-row__fin">
                  <div v-if="isBank(row)" class="payment-step-container">
                    <span
                      v-if="purchaseStatus(row) === 'pending'"
                      class="delivery-badge delivery-pending status-main-badge"
                    >
                      <i class="fas fa-clock"></i>
                      Pendiente
                    </span>
                    <span
                      v-else-if="purchaseStatus(row) === 'in_process' || purchaseStatus(row) === 'finalized'"
                      class="delivery-badge delivery-delivered status-main-badge"
                    >
                      <i class="fas fa-check-circle"></i>
                      Confirmado
                    </span>
                    <span
                      v-else-if="purchaseStatus(row) === 'rejected'"
                      class="delivery-badge delivery-rejected status-main-badge"
                    >
                      <i class="fas fa-times-circle"></i>
                      Rechazado
                    </span>
                    <span
                      v-else-if="purchaseStatus(row) === 'cancelled'"
                      class="delivery-badge delivery-cancelled status-main-badge"
                    >
                      <i class="fas fa-ban"></i>
                      Anulada
                    </span>
                    <span v-else class="delivery-badge delivery-delivered status-main-badge">
                      <i class="fas fa-check-circle"></i>
                      Confirmado
                    </span>
                  </div>
                  <div v-else>
                    <span class="tag is-light is-rounded">No aplica</span>
                  </div>
                </div>
                <div class="payment-step-top-row__del">
                  <span
                    class="delivery-badge status-main-badge"
                    :class="{
                      'delivery-delivered': row.delivered,
                      'delivery-pending': !row.delivered && isDeliveryEnabled(row),
                      'delivery-disabled': !isDeliveryEnabled(row),
                    }"
                    :title="deliveryTitle(row)"
                  >
                    <i :class="row.delivered ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                    {{ row.delivered ? "Entregado" : "Pendiente" }}
                  </span>
                </div>
              </div>
              <div class="payment-step-record-row">
                <span :class="recordTabClass(purchaseStatus(row))" class="record-tab record-tab--full">
                  {{ recordTabLabel(purchaseStatus(row)) }}
                </span>
              </div>
            </div>
          </template>
        </ModernTable>
      </div>

      <div class="modal" :class="{ 'is-active': showDetail }">
        <div class="modal-background" @click="showDetail = false"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Compra {{ selected && selected.id }}</p>
            <button class="delete" aria-label="Cerrar" @click="showDetail = false"></button>
          </header>
          <section class="modal-card-body" v-if="selected">
            <p><strong>Comprador:</strong> {{ selected.buyer.name }} <span v-if="selected.buyer.document">· DNI {{ selected.buyer.document }}</span></p>
            <p><strong>Celular:</strong> {{ selected.buyer.phone || "-" }}</p>
            <p><strong>Socio:</strong> {{ selected.seller.name }} <span v-if="selected.seller.dni">· DNI {{ selected.seller.dni }}</span></p>
            <p><strong>Productos:</strong> {{ selected.products }}</p>
            <p>
              <strong>Puntos generados:</strong>
              <span class="points-badge">
                <i class="fas fa-star points-icon"></i>
                {{ Number(selected.points || 0) }} pts
              </span>
            </p>
            <p><strong>Importe:</strong> S/ {{ Number(selected.amount || 0).toFixed(2) }}</p>
            <p><strong>Banco:</strong> {{ selected.bank || "-" }}</p>
            <p><strong>N° de operación:</strong> {{ selected.voucher_number || "-" }}</p>
            <p><strong>Dirección:</strong> {{ selected.address || "-" }}</p>
            <img
              v-if="isImage(selected.voucher)"
              :src="selected.voucher"
              alt="Comprobante"
              class="voucher-photo"
            />
          </section>
          <footer class="modal-card-foot">
            <button class="button" @click="showDetail = false">Cerrar</button>
          </footer>
        </div>
      </div>

      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando compras...</p>
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
import Swal from "sweetalert2";

export default {
  components: { Layout, ModernTable, DashboardCard },
  data() {
    return {
      loading: true,
      orders: [],
      showDetail: false,
      selected: null,
      itemActions: [
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
          key: "view",
          label: "Ver compra",
          icon: "fas fa-eye",
          class: "is-primary",
        },
        {
          key: "validate_voucher",
          label: "Validar comprobante",
          icon: "fas fa-file-invoice-dollar",
          class: "is-success",
          condition: (item) => {
            const method = String(item.pay_method || "").toLowerCase();
            return method.includes("bank") || method.includes("banco");
          },
        },
        {
          key: "cancel",
          label: "Anular",
          icon: "fas fa-ban",
          class: "is-danger",
          condition: (item) => item.status !== "cancelled",
        },
      ],
      summary: { total: 0, pending: 0, approved: 0, amount: 0 },
      tableColumns: [
        { key: "id", label: "Pedido", sortable: true },
        { key: "date", label: "Fecha", sortable: true, type: "date" },
        { key: "buyer", label: "Comprador", sortable: false },
        { key: "seller", label: "Socio", sortable: false },
        { key: "products", label: "Productos", sortable: false },
        { key: "points", label: "Puntos", sortable: true, type: "number" },
        { key: "amount", label: "Importe", sortable: true, type: "currency" },
        { key: "comprobante", label: "Comprobante", sortable: false },
      ],
      tableFilters: [
        {
          key: "status",
          label: "Estado",
          type: "select",
          placeholder: "Estado",
          options: [
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendiente" },
            { value: "approved", label: "Aprobado" },
            { value: "rejected", label: "Rechazado" },
            { value: "cancelled", label: "Anulado" },
          ],
        },
      ],
    };
  },
  async created() {
    await this.load();
  },
  methods: {
    isBank(row) {
      const method = String((row && row.pay_method) || "").toLowerCase();
      return method.includes("bank") || method.includes("banco");
    },
    purchaseStatus(row) {
      const rawStatus = String((row && row.status) || "").toLowerCase();
      const status = rawStatus === "verified" ? "pending" : rawStatus;
      if (status === "cancelled") return "cancelled";
      if (status === "rejected") return "rejected";
      if (status === "approved") return row && row.delivered ? "finalized" : "in_process";
      return "pending";
    },
    isDeliveryEnabled(row) {
      const status = this.purchaseStatus(row);
      return status === "in_process" || status === "finalized";
    },
    deliveryTitle(row) {
      if (!this.isDeliveryEnabled(row)) return "La entrega se habilita al aprobar el comprobante";
      if (row && row.delivered) return "Entregado";
      return "Pendiente de entrega";
    },
    recordTabLabel(status) {
      const labels = {
        pending: "Pendiente",
        in_process: "En proceso",
        finalized: "Finalizado",
        rejected: "Rechazado",
        cancelled: "Anulado",
      };
      return labels[status] || "Pendiente";
    },
    recordTabClass(status) {
      const classes = {
        pending: "record-tab--pending",
        in_process: "record-tab--process",
        finalized: "record-tab--finalized",
        rejected: "record-tab--rejected",
        cancelled: "record-tab--cancelled",
      };
      return ["record-tab", classes[status] || "record-tab--default"];
    },
    isImage(url) {
      return typeof url === "string" && /^https:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url);
    },
    async handleItemAction({ action, item }) {
      if (!item) return;
      if (action === "view") {
        this.selected = item;
        this.showDetail = true;
        return;
      }
      if (action === "validate_voucher") {
        this.$router.push({
          path: "/validacion-vouchers",
          query: { search: item.voucher_number || "" },
        });
        return;
      }
      if (action === "approve") return this.changeStatus(item, "approve", "¿Aprobar esta compra?", "La compra quedó aprobada.");
      if (action === "reject") return this.changeStatus(item, "reject", "¿Rechazar esta compra?", "La compra quedó rechazada.");
      if (action === "cancel") return this.changeStatus(item, "cancel", "¿Anular esta compra?", "La compra quedó anulada.");
    },
    async changeStatus(item, action, title, done) {
      const result = await Swal.fire({
        title,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return;
      try {
        const { data } = await api.Activations.POST({ action, id: item.id });
        if (data && data.error) {
          Swal.fire("Aviso", data.msg || "No se pudo actualizar la compra.", "warning");
          return;
        }
        await this.load();
        Swal.fire("Listo", done, "success");
      } catch (e) {
        Swal.fire("Error", "No se pudo actualizar la compra.", "error");
      }
    },
    async load() {
      this.loading = true;
      try {
        const { data } = await api.storeOrders.GET();
        if (data && data.error) {
          this.orders = [];
          return;
        }
        this.orders = (data && data.orders) || [];
        this.summary = (data && data.summary) || this.summary;
      } catch (e) {
        this.orders = [];
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.store-orders-section {
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.person-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
}
.person-cell small {
  color: #6b7280;
  font-weight: 600;
}
.amount {
  font-weight: 800;
}
.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
}
.points-icon {
  color: #f59e0b;
  font-size: 0.8rem;
}
.voucher-photo {
  display: block;
  max-width: 220px;
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.payment-step-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: max-content;
  max-width: 100%;
}
.payment-step-top-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 6px;
  width: max-content;
}
.payment-step-top-row__fin,
.payment-step-top-row__del {
  flex: 0 0 auto;
  display: flex;
}
.payment-step-record-row {
  display: flex;
  justify-content: center;
  width: 100%;
}
.payment-step-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.comprobante-header {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: max-content;
}
.comprobante-header span {
  min-width: 132px;
  text-align: center;
}
.record-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  line-height: 1.2;
}
.record-tab--full {
  width: 100%;
  box-sizing: border-box;
}
.record-tab--pending,
.record-tab--process {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
.record-tab--finalized {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}
.record-tab--rejected {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.record-tab--cancelled,
.record-tab--default {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}
.delivery-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid transparent;
  box-sizing: border-box;
}
.status-main-badge {
  min-width: 132px;
  justify-content: center;
}
.delivery-delivered {
  background: linear-gradient(135deg, #00c9a7 0%, #00b894 100%);
  color: white;
}
.delivery-pending {
  background: linear-gradient(135deg, #ffd32a 0%, #f39c12 100%);
  color: #333;
}
.delivery-disabled {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}
.delivery-rejected {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.delivery-cancelled {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
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
  color: #222;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
