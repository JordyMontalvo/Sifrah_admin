<template>
  <Layout>
    <section class="activations-section">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">{{ title }}</h1>
              <p class="page-subtitle">
                Gestiona las activaciones de productos del sistema
              </p>
            </div>

            <div class="header-actions">
              <button class="button is-info" @click="download">
                <span class="icon">
                  <i class="fas fa-download"></i>
                </span>
                <span>Descargar Reporte</span>
              </button>

              <router-link to="/reports" class="button is-primary">
                <span class="icon">
                  <i class="fas fa-chart-line"></i>
                </span>
                <span>Ver Analytics</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="container">
        <div class="stats-grid">
          <DashboardCard
            :value="totalActivations"
            label="Total Activaciones"
            icon="fas fa-bolt"
            color="primary"
            :description="`Registradas en el sistema`"
          />

          <DashboardCard
            :value="approvedTotal"
            label="Aprobadas"
            icon="fas fa-check-circle"
            color="success"
            :description="`Activaciones confirmadas`"
          />

          <DashboardCard
            :value="pendingTotal"
            label="Pendientes"
            icon="fas fa-clock"
            color="warning"
            :description="`Esperando aprobación`"
          />

          <DashboardCard
            :value="totalAmount"
            label="Monto Total"
            icon="fas fa-money-bill-wave"
            color="info"
            :show-currency="true"
            :description="`Valor de todas las activaciones`"
          />
        </div>
      </div>

      <!-- Modern Table -->
      <div class="container">
        <ModernTable
          :data="tableData"
          :columns="tableColumns"
          title="Lista de Activaciones"
          subtitle="Gestiona y aprueba activaciones de productos"
          :actions="tableActions"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="true"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          search-placeholder="Buscar por nombre, DNI o oficina..."
          :filters="tableFilters"
          @action="handleTableAction"
          @item-action="handleItemAction"
          @search="handleSearch"
          @filter="handleFilter"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        >
          <template #cell-user="{ row }">
            {{ formatUser(row.raw) }}
          </template>
          <template #cell-office="{ row }">
            {{ getOfficeName(row.raw.office) }}
          </template>
          <template #cell-voucher="{ row }">
            <span v-if="row.voucher.isImage">
              <img
                :src="row.voucher.url"
                alt="Voucher"
                class="voucher-thumb"
                @click="openImageModal(row.voucher.url)"
                style="
                  max-width: 60px;
                  max-height: 60px;
                  cursor: pointer;
                  border-radius: 6px;
                  border: 1px solid #eee;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                "
              />
            </span>
            <span v-else>{{ row.voucher.url }}</span>
          </template>
        </ModernTable>
      </div>
      <!-- End of Modern Table -->
      <!-- Loading Overlay -->
      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando activaciones...</p>
        </div>
      </div>

      <div
        v-if="showImageModal"
        class="image-modal-overlay"
        @click.self="closeImageModal"
      >
        <div class="image-modal-content">
          <button class="image-modal-close" @click="closeImageModal">
            &times;
          </button>
          <img
            :src="imageModalUrl"
            alt="Voucher grande"
            class="image-modal-img"
          />
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import DashboardCard from "@/components/DashboardCard";
import ModernTable from "@/components/ModernTable";
import api from "@/api";
import { debounce } from "lodash";

const INVOICE_ROOT = process.env.VUE_APP_INVOICE_ROOT;

export default {
  components: {
    Layout,
    DashboardCard,
    ModernTable,
  },
  data() {
    return {
      activations: [],
      allActivations: [],
      loading: true,
      title: null,
      search: null,
      INVOICE_ROOT,
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      totalPages: 0,
      approvedAmount: 0,
      showImageModal: false,
      imageModalUrl: "",

      // Table configuration
      tableColumns: [
        {
          key: "id",
          label: "#",
          sortable: true,
          type: "number",
        },
        {
          key: "date",
          label: "Fecha",
          sortable: true,
          type: "date",
        },
        {
          key: "user",
          label: "Usuario",
          sortable: true,
        },
        {
          key: "office",
          label: "Oficina",
          sortable: true,
        },
        {
          key: "products",
          label: "Productos",
          sortable: false,
        },
        {
          key: "price",
          label: "Precio Total",
          sortable: true,
          type: "currency",
        },
        {
          key: "points",
          label: "Puntos",
          sortable: true,
          type: "number",
        },
        {
          key: "pay_method",
          label: "Medio de Pago",
          sortable: true,
        },
        {
          key: "voucher",
          label: "Voucher",
          sortable: false,
        },
        {
          key: "balance",
          label: "Saldo",
          sortable: false,
        },
        {
          key: "status",
          label: "Estado",
          sortable: true,
          type: "status",
        },
      ],
      tableActions: [
        {
          key: "refresh",
          label: "Actualizar",
          icon: "fas fa-sync-alt",
          class: "is-info",
        },
        {
          key: "export",
          label: "Exportar",
          icon: "fas fa-file-excel",
          class: "is-success",
        },
      ],
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
          key: "edit",
          label: "Editar",
          icon: "fas fa-edit",
          class: "is-info",
        },
        {
          key: "invoice",
          label: "Boleta",
          icon: "fas fa-file-invoice",
          class: "is-warning",
          condition: (item) => item.status === "approved",
        },
      ],
      tableFilters: [
        {
          key: "status",
          label: "Estado",
          type: "select",
          options: [
            { value: "", label: "Todos" },
            { value: "pending", label: "Pendiente" },
            { value: "approved", label: "Aprobada" },
            { value: "rejected", label: "Rechazada" },
          ],
        },
        {
          key: "pay_method",
          label: "Medio de Pago",
          type: "select",
          options: [
            { value: "", label: "Todos" },
            { value: "cash", label: "Efectivo" },
            { value: "bank", label: "Banco" },
          ],
        },
      ],
    };
  },
  computed: {
    accounts() {
      return this.$store.state.accounts;
    },
    account() {
      return this.$store.state.account;
    },
    totalActivations() {
      return this.allActivations.length;
    },
    approvedTotal() {
      return this.allActivations.filter(
        (a) => (a.status || "").toLowerCase() === "approved"
      ).length;
    },
    pendingTotal() {
      return this.allActivations.filter(
        (a) => (a.status || "").toLowerCase() === "pending"
      ).length;
    },
    totalAmount() {
      return this.allActivations
        .filter((a) => (a.status || "").toLowerCase() === "approved")
        .reduce((sum, a) => sum + ((a.plan && a.plan.amount) || 0), 0);
    },
    tableData() {
      const sortedActivations = this.activations
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return sortedActivations.map((activation, index) => {
        // Validar price y points
        let price = "-";
        if (
          activation.price !== null &&
          activation.price !== undefined &&
          activation.price !== "" &&
          !isNaN(Number(activation.price))
        ) {
          price = Number(activation.price).toFixed(2);
        }

        let points = "-";
        if (
          activation.points !== null &&
          activation.points !== undefined &&
          activation.points !== "" &&
          !isNaN(Number(activation.points))
        ) {
          points = Number(activation.points).toFixed(2);
        }

        // Usuario
        const userName =
          (activation.name ? activation.name : "") +
          " " +
          (activation.lastName ? activation.lastName : "");
        const user = {
          name: userName.trim() || "N/A",
          dni: activation.dni || "-",
          phone: activation.phone || "-",
        };

        // Oficina
        const office = activation.office || "N/A";

        // Productos
        let products = "-";
        if (Array.isArray(activation.products)) {
          products = activation.products
            .filter((p) => Number(p.total) > 0)
            .map((p) => `${p.total} ${p.name}`)
            .join(", ");
          if (!products) products = "-";
        }

        // Voucher
        let voucherIsImage = false;
        let voucherUrl = activation.voucher || "";
        if (voucherUrl && typeof voucherUrl === "string") {
          voucherIsImage =
            /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/i.test(voucherUrl);
        }
        const globalIndex = (this.currentPage - 1) * this.itemsPerPage + index;
        return {
          id:
            this.allActivations.length > 0
              ? this.allActivations.length - globalIndex
              : index + 1,
          user,
          office,
          products,
          price,
          points,
          pay_method: this.formatPayMethod(activation) || "-",
          voucher: voucherIsImage
            ? { url: voucherUrl, isImage: true }
            : { url: voucherUrl, isImage: false },
          balance: this.formatBalance(activation) || "-",
          status: activation.status || "-",
          raw: activation,
          date: activation.date,
        };
      });
    },
  },
  filters: {
    status(value) {
      if (value == "approved") return "Aprobada";
      if (value == "pending") return "Pendiente";
      if (value == "rejected") return "Rechazada";
      return value;
    },
    date(val) {
      return new Date(val).toLocaleDateString();
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.GET(to.params.filter);
    next();
  },
  async created() {
    const account = JSON.parse(localStorage.getItem("session"));
    this.$store.commit("SET_ACCOUNT", account);
    await this.GET(this.$route.params.filter);
    await this.fetchStatusTotals();
  },
  methods: {
    async GET(filter = "all") {
      this.loading = true;

      try {
        console.log("Loading activations with params:", {
          filter,
          account: this.account.id,
          page: this.currentPage,
          limit: this.itemsPerPage,
          search: this.search,
        });

        const { data } = await api.Activations.GET({
          filter,
          account: this.account.id,
          page: this.currentPage,
          limit: this.itemsPerPage,
          search: this.search,
        });

        // Obtener todas las activaciones para los totales
        const { data: allData } = await api.Activations.GET({
          filter: "all",
          page: 1,
          limit: 10000,
        });
        this.allActivations = allData.activations || [];
        this.activations = data.activations || [];
        this.totalItems = data.totalItems || 0;
        this.totalPages = data.totalPages || 0;

        console.log("Processed activations:", {
          count: this.activations.length,
          totalItems: this.totalItems,
          totalPages: this.totalPages,
        });

        // Enriquecer con información de oficinas
        this.activations.forEach((activation) => {
          const office = this.accounts.find((x) => x.id == activation.office);
          activation.office = (office && office.name) || "N/A";
        });

        if (filter == "all") this.title = "Todas las Activaciones";
        if (filter == "pending") this.title = "Activaciones Pendientes";
      } catch (error) {
        console.error("Error loading activations:", error);
        this.$toast.error("Error al cargar las activaciones");
      } finally {
        this.loading = false;
      }
    },

    formatProducts(activation) {
      if (activation.products) {
        return activation.products
          .filter((p) => p.total > 0)
          .map((p) => `${p.total} ${p.name}`)
          .join(", ");
      }
      return "N/A";
    },

    formatPayMethod(activation) {
      if (activation.pay_method === "cash") {
        return "Efectivo";
      }
      if (activation.pay_method === "bank") {
        return `Banco - ${activation.bank}`;
      }
      return activation.pay_method;
    },

    formatBalance(activation) {
      if (activation.amounts) {
        return {
          notAvailable: activation.amounts[0],
          available: Number(activation.amounts[1]).toFixed(2),
          toCollect: Number(activation.amounts[2]).toFixed(2),
        };
      }
      return null;
    },

    async handleTableAction(action) {
      if (action === "refresh") {
        await this.GET(this.$route.params.filter);
      } else if (action === "export") {
        this.download();
      }
    },

    async handleItemAction({ action, item }) {
      const activation = item.raw;
      if (action === "approve") {
        await this.approve(activation);
      } else if (action === "reject") {
        await this.reject(activation);
      } else if (action === "edit") {
        this.editVoucher(activation);
      } else if (action === "invoice") {
        window.open(`${this.INVOICE_ROOT}?id=${activation.id}`, "_blank");
      }
    },

    handleSearch: debounce(function (search) {
      this.search = search;
      this.currentPage = 1;
      this.GET(this.$route.params.filter);
    }, 300),

    handleFilter(filters) {
      console.log("Filters applied:", filters);
      this.currentPage = 1;
      this.GET(this.$route.params.filter);
    },

    async handlePageChange(page) {
      console.log("Page changed to:", page);
      this.currentPage = page;
      await this.GET(this.$route.params.filter);
    },

    async handlePageSizeChange(pageSize) {
      console.log("Page size changed to:", pageSize);
      this.itemsPerPage = pageSize;
      this.currentPage = 1;
      await this.GET(this.$route.params.filter);
    },

    async approve(activation) {
      if (!confirm("¿Desea aprobar esta activación?")) return;

      activation.sending = true;

      try {
        const { data } = await api.Activations.POST({
          action: "approve",
          id: activation.id,
        });

        activation.status = "approved";
      } catch (error) {
        console.error("Error approving activation:", error);
      } finally {
        activation.sending = false;
      }
    },

    async reject(activation) {
      if (!confirm("¿Desea rechazar esta activación?")) return;

      activation.sending = true;

      try {
        const { data } = await api.Activations.POST({
          action: "reject",
          id: activation.id,
        });

        activation.status = "rejected";
      } catch (error) {
        console.error("Error rejecting activation:", error);
      } finally {
        activation.sending = false;
      }
    },

    editVoucher(activation) {
      activation.editing = true;
      activation.newVoucher = activation.voucher;
    },

    async saveVoucher(activation) {
      try {
        const { data } = await api.Activations.POST({
          action: "update_voucher",
          id: activation.id,
          voucher: activation.newVoucher,
        });

        activation.voucher = activation.newVoucher;
        activation.editing = false;
      } catch (error) {
        console.error("Error updating voucher:", error);
      }
    },

    download() {
      // Implement download functionality
      console.log("Downloading report...");
    },

    openImageModal(url) {
      this.imageModalUrl = url;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.imageModalUrl = "";
    },

    async fetchStatusTotals() {
      try {
        const { data: approved } = await api.Activations.GET({
          filter: "approved",
          page: 1,
          limit: 99999, // Asegura traer todos si la API lo permite
          account: this.account.id,
        });
        console.log("Aprobadas:", approved);
      } catch (e) {
        console.warn("No se pudo obtener aprobadas", e);
      }
      try {
        const { data: pending } = await api.Activations.GET({
          filter: "pending",
          page: 1,
          limit: 99999,
          account: this.account.id,
        });
        console.log("Pendientes:", pending);
      } catch (e) {
        console.warn("No se pudo obtener pendientes", e);
      }
    },

    getOfficeName(officeId) {
      console.log(
        "Buscando officeId:",
        officeId,
        "en accounts:",
        this.accounts.map((x) => x.id)
      );
      const officeObj = this.accounts.find(
        (x) => String(x.id) === String(officeId)
      );
      if (officeObj && officeObj.name) {
        console.log("Encontrado:", officeObj.name);
        return officeObj.name;
      } else if (typeof officeId === "string" && officeId) {
        return officeId.charAt(0).toUpperCase() + officeId.slice(1);
      }
      return "N/A";
    },
    formatUser(activation) {
      const name = [activation.name, activation.lastName]
        .filter(Boolean)
        .join(" ");
      const dni = activation.dni ? `DNI: ${activation.dni}` : "";
      const phone = activation.phone ? `Celular: ${activation.phone}` : "";
      let extra = [dni, phone].filter(Boolean).join(", ");
      return extra ? `${name} (${extra})` : name;
    },
  },
};
</script>

<style scoped>
.activations-section {
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
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

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.voucher-thumb {
  transition: transform 0.2s;
}
.voucher-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.image-modal-img {
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
.image-modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 2rem;
  color: #333;
  cursor: pointer;
  z-index: 2;
}
</style>
