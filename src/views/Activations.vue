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
          <template #cell-status="{ row }">
            <span 
              class="status-badge" 
              :class="{
                'status-approved': row.status === 'approved',
                'status-pending': row.status === 'pending',
                'status-rejected': row.status === 'rejected',
                'status-cancelled': row.status === 'cancelled'
              }"
            >
              {{ row.status | status }}
            </span>
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

      <div class="modal" :class="{ 'is-active': showViewModal }">
        <div class="modal-background" @click="showViewModal = false"></div>
        <div class="modal-card modern-modal-card">
          <header class="modal-card-head modern-modal-head">
            <span class="modal-icon"><i class="fas fa-bolt"></i></span>
            <p class="modal-card-title">Detalles de la Activación</p>
            <button
              class="delete"
              aria-label="close"
              @click="showViewModal = false"
            ></button>
          </header>
          <section class="modal-card-body modern-modal-body">
            <div v-if="selectedActivation" class="details-grid">
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-hashtag"></i> ID:</span
                >
                <span class="detail-value">{{ selectedActivation.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-calendar-alt"></i> Fecha:</span
                >
                <span class="detail-value">{{
                  formatDateTime(selectedActivation.date)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-user"></i> Usuario:</span
                >
                <span class="detail-value">{{
                  formatUser(selectedActivation)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-building"></i> Oficina:</span
                >
                <span class="detail-value">{{
                  selectedActivation.office
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-box"></i> Productos:</span
                >
                <span class="detail-value">{{
                  formatProducts(selectedActivation)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-money-bill-wave"></i> Precio:</span
                >
                <span class="detail-value">{{ selectedActivation.price }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-star"></i> Puntos:</span
                >
                <span class="detail-value">{{
                  selectedActivation.points
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-credit-card"></i> Medio de Pago:</span
                >
                <span class="detail-value">{{
                  formatPayMethod(selectedActivation)
                }}</span>
              </div>
              
              <!-- Información detallada del banco (solo si NO es efectivo) -->
              <template v-if="selectedActivation.pay_method === 'bank' && selectedActivation.bank_info && !isEfectivo(selectedActivation)">
                <div class="detail-item">
                  <span class="detail-label"
                    ><i class="fas fa-university"></i> Cuenta:</span
                  >
                  <span class="detail-value">{{ selectedActivation.bank_info.account || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label"
                    ><i class="fas fa-user"></i> Titular:</span
                  >
                  <span class="detail-value">{{ selectedActivation.bank_info.holder || 'N/A' }}</span>
                </div>
              </template>
              
              <!-- Número de operación -->
              <div class="detail-item" v-if="selectedActivation.pay_method === 'bank' && selectedActivation.voucher_number">
                <span class="detail-label"
                  ><i class="fas fa-hashtag"></i> Nº de Operación:</span
                >
                <span class="detail-value">{{ selectedActivation.voucher_number }}</span>
              </div>
              
              <!-- Voucher/Comprobante -->
              <div class="detail-item" v-if="selectedActivation.pay_method === 'bank' && selectedActivation.voucher">
                <span class="detail-label"
                  ><i class="fas fa-file-invoice"></i> Comprobante:</span
                >
                <span class="detail-value"
                  ><a
                    :href="selectedActivation.voucher"
                    target="_blank"
                    >Ver Comprobante</a
                  ></span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-balance-scale"></i> Saldo:</span
                >
                <span class="detail-value">{{
                  formatBalanceObj(this.formatBalance(selectedActivation))
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-info-circle"></i> Estado:</span
                >
                <span class="detail-value">{{
                  selectedActivation.status
                }}</span>
              </div>

              <!-- Datos de Delivery -->
              <template v-if="selectedActivation.delivery_info">
                <div class="detail-item">
                  <span class="detail-label"><i class="fas fa-truck"></i> Método de entrega:</span>
                  <span class="detail-value">{{ selectedActivation.delivery_info.method === 'delivery' ? 'Delivery' : 'Recojo en oficina' }}</span>
                </div>

                <!-- Recojo en oficina -->
                <div class="detail-item" v-if="selectedActivation.delivery_info.method === 'pickup'">
                  <span class="detail-label"><i class="fas fa-store"></i> Oficina de recojo:</span>
                  <span class="detail-value">{{ getOfficeName(selectedActivation.office) }}</span>
                </div>

                <!-- Solo si es delivery -->
                <template v-if="selectedActivation.delivery_info.method === 'delivery'">
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-user-check"></i> Receptor:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.recipient_name || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-id-card"></i> Documento:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.recipient_document || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-phone"></i> Celular:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.recipient_phone || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Dirección:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.delivery_address || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-globe"></i> Ubicación:</span>
                    <span class="detail-value">{{ [selectedActivation.delivery_info.department, selectedActivation.delivery_info.province, selectedActivation.delivery_info.district].filter(Boolean).join(', ') || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-tags"></i> Tipo de delivery:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.delivery_type || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-money-bill"></i> Precio de delivery:</span>
                    <span class="detail-value">{{ (selectedActivation.delivery_info.delivery_price != null) ? `S/. ${Number(selectedActivation.delivery_info.delivery_price).toFixed(2)}` : '-' }}</span>
                  </div>

                  <!-- Zona (para Lima) -->
                  <div class="detail-item" v-if="selectedActivation.delivery_info.zone_info">
                    <span class="detail-label"><i class="fas fa-map"></i> Zona:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.zone_info.zone_name }} ({{ selectedActivation.delivery_info.zone_info.zone_id }}) - S/. {{ Number(selectedActivation.delivery_info.zone_info.zone_price || 0).toFixed(2) }}</span>
                  </div>

                  <!-- Agencia (para envíos nacionales) -->
                  <div class="detail-item" v-if="selectedActivation.delivery_info.agency || selectedActivation.delivery_info.agency_code">
                    <span class="detail-label"><i class="fas fa-building"></i> Agencia:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.agency_name || selectedActivation.delivery_info.agency || selectedActivation.delivery_info.agency_code || '-' }}</span>
                  </div>

                  <!-- Notas -->
                  <div class="detail-item" v-if="selectedActivation.delivery_info.delivery_notes">
                    <span class="detail-label"><i class="fas fa-sticky-note"></i> Notas:</span>
                    <span class="detail-value">{{ selectedActivation.delivery_info.delivery_notes }}</span>
                  </div>
                </template>
              </template>
            </div>
          </section>
          <footer
            class="modal-card-foot modern-modal-foot"
            style="justify-content: flex-end"
          >
            <button class="button is-primary" @click="showViewModal = false">
              <i class="fas fa-times"></i> Cerrar
            </button>
          </footer>
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
import Swal from "sweetalert2";

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
      showViewModal: false,
      selectedActivation: null,

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
        {
          key: "delivery",
          label: "Delivery",
          icon: "fas fa-truck",
          class: "is-link",
          condition: (item) => item.raw && item.raw.delivery_info,
        },
        {
          key: "view",
          label: "Ver Detalles",
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
            { value: "cancelled", label: "Anulada" },
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
          balance: this.formatBalanceObj(this.formatBalance(activation)),
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
      if (value == "cancelled") return "Anulada";
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

    isEfectivo(activation) {
      // Verificar si el método de pago es efectivo
      if (activation.pay_method === "cash") {
        return true;
      }
      
      if (activation.pay_method === "bank" && activation.bank_info) {
        const methodName = (activation.bank_info.name || '').toLowerCase();
        const methodType = (activation.bank_info.type || '').toLowerCase();
        return methodType.includes('efectivo') || methodName.includes('efectivo');
      }
      
      if (activation.bank) {
        return activation.bank.toLowerCase().includes('efectivo');
      }
      
      return false;
    },

    formatPayMethod(activation) {
      // Efectivo (legacy)
      if (activation.pay_method === "cash") {
        return "Efectivo";
      }
      
      // Pago con comprobante (transferencia, yape, plin, efectivo, etc.)
      if (activation.pay_method === "bank") {
        // Si existe bank_info, mostrar el nombre y tipo del método de pago
        if (activation.bank_info) {
          const methodName = activation.bank_info.name || activation.bank || '';
          const methodType = activation.bank_info.type || '';
          
          // Si el tipo o nombre contiene "Efectivo", mostrar solo "Efectivo"
          if (methodType.toLowerCase().includes('efectivo') || methodName.toLowerCase().includes('efectivo')) {
            return "Efectivo";
          }
          
          // Para otros métodos, mostrar nombre - tipo
          return `${methodName} - ${methodType || 'Transferencia'}`;
        }
        // Si solo existe bank (ID o nombre), verificar si es efectivo
        if (activation.bank && activation.bank.toLowerCase().includes('efectivo')) {
          return "Efectivo";
        }
        return `Transferencia - ${activation.bank || 'No especificado'}`;
      }
      
      // Otros métodos o sin especificar
      return activation.pay_method || "No especificado";
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

    formatBalanceObj(balance) {
      if (!balance) return "-";
      return `Disponible: S/. ${Number(balance.available).toFixed(
        2
      )}, No disponible: S/. ${Number(balance.notAvailable).toFixed(
        2
      )}, Por cobrar: S/. ${Number(balance.toCollect).toFixed(2)}`;
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
      } else if (action === "delivery") {
        this.selectedActivation = activation;
        this.showViewModal = true;
      } else if (action === "view") {
        this.selectedActivation = activation;
        this.showViewModal = true;
      } else if (action === "cancel") {
        await this.cancelActivation(activation);
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
    formatDateTime(date) {
      if (!date) return "-";
      const d = new Date(date);
      if (isNaN(d)) return date;
      return (
        d.toLocaleDateString() +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    },
    async cancelActivation(activation) {
      const confirmed = await Swal.fire({
        title: "¿Anular activación?",
        html: `¿Seguro que deseas anular la activación de <strong>${activation.name} ${activation.lastName}</strong>?<br><br>
        ${activation.status === 'approved' ? '<span style="color: #e74c3c;">⚠️ Esta activación fue aprobada. Se revertirán los puntos del usuario.</span>' : ''}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, anular",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e74c3c",
      });
      if (!confirmed.isConfirmed) return;
      try {
        await api.Activations.POST({
          action: "cancel",
          id: activation.id,
        });
        
        // Actualizar el estado local en lugar de eliminar
        activation.status = "cancelled";
        
        Swal.fire({
          icon: "success",
          title: "Activación anulada",
          text: "La activación ha sido anulada correctamente. Los puntos han sido revertidos.",
          timer: 2000,
          showConfirmButton: false,
        });
        await this.GET(this.$route.params.filter);
        await this.fetchStatusTotals();
      } catch (error) {
        console.error("Error anulando activación:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo anular la activación. Inténtalo de nuevo.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
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
.modern-modal-card {
  max-width: 520px;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  background: #fff;
  animation: modalPop 0.25s cubic-bezier(0.4, 2, 0.6, 1) 1;
}
@keyframes modalPop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.modern-modal-head {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: none;
}
.modal-icon {
  font-size: 2rem;
  margin-right: 8px;
}
.modern-modal-body {
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  background: #f8f9fa;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
.detail-item {
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}
.detail-label {
  font-size: 0.95rem;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-value {
  font-size: 1.08rem;
  color: #222;
  font-weight: 500;
  word-break: break-all;
}
.modern-modal-foot {
  background: #f8f9fa;
  border-top: none;
}

/* Badges de estado */
.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-approved {
  background: linear-gradient(135deg, #00c9a7 0%, #00b894 100%);
  color: white;
}

.status-pending {
  background: linear-gradient(135deg, #ffd32a 0%, #f39c12 100%);
  color: #333;
}

.status-rejected {
  background: linear-gradient(135deg, #ff6b6b 0%, #e74c3c 100%);
  color: white;
}

.status-cancelled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: white;
  text-decoration: line-through;
  opacity: 0.8;
}
</style>
