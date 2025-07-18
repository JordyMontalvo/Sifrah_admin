<template>
  <Layout>
    <section class="affiliations-section">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">{{ title }}</h1>
              <p class="page-subtitle">Gestiona las afiliaciones del sistema</p>
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
            :value="totalAffiliations"
            label="Total Afiliaciones"
            icon="fas fa-handshake"
            color="primary"
            :description="`Registradas en el sistema`"
          />

          <DashboardCard
            :value="approvedTotal"
            label="Aprobadas"
            icon="fas fa-check-circle"
            color="success"
            :description="`Afiliaciones confirmadas`"
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
            :description="`Valor de todas las afiliaciones`"
          />
        </div>
      </div>

      <!-- Modern Table -->
      <div class="container">
        <ModernTable
          :data="tableData"
          :columns="tableColumns"
          title="Lista de Afiliaciones"
          subtitle="Gestiona y aprueba afiliaciones de usuarios"
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
          <template #cell-user="{ value }">
            <span v-if="value && value.name">
              {{ value.name
              }}<span v-if="value.dni"> (DNI: {{ value.dni }}</span
              ><span v-if="value.phone">, Celular: {{ value.phone }}</span
              ><span v-if="value.dni">)</span>
            </span>
            <span v-else>N/A</span>
          </template>
          <template #cell-plan="{ value }">
            <span v-if="value && value.name">
              {{ value.name
              }}<span v-if="value.amount"> (S/ {{ value.amount }})</span>
            </span>
            <span v-else>N/A</span>
          </template>
          <template #cell-office="{ row }">
            {{ getOfficeName(row.raw.officeId || row.raw.office) }}
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
          <template #cell-type="{ value }">
            <span v-if="value === 'upgrade'" class="tag is-warning"
              >Upgrade</span
            >
            <span v-else class="tag is-info">Afiliación</span>
          </template>
        </ModernTable>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando afiliaciones...</p>
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
            <span class="modal-icon"><i class="fas fa-user-plus"></i></span>
            <p class="modal-card-title">Detalles de la Afiliación</p>
            <button
              class="delete"
              aria-label="close"
              @click="showViewModal = false"
            ></button>
          </header>
          <section class="modal-card-body modern-modal-body">
            <div v-if="selectedAffiliation" class="details-grid">
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-hashtag"></i> ID:</span
                >
                <span class="detail-value">{{ selectedAffiliation.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-calendar-alt"></i> Fecha:</span
                >
                <span class="detail-value">{{
                  formatDateTime(selectedAffiliation.date)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-user"></i> Usuario:</span
                >
                <span class="detail-value"
                  >{{ selectedAffiliation.name }}
                  {{ selectedAffiliation.lastName }}</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-id-card"></i> DNI:</span
                >
                <span class="detail-value">{{ selectedAffiliation.dni }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-building"></i> Oficina:</span
                >
                <span class="detail-value">{{
                  selectedAffiliation.office
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-cube"></i> Plan:</span
                >
                <span class="detail-value">{{
                  selectedAffiliation.plan && selectedAffiliation.plan.name
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-money-bill-wave"></i> Monto:</span
                >
                <span class="detail-value">{{
                  selectedAffiliation.plan && selectedAffiliation.plan.amount
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-box"></i> Productos:</span
                >
                <span class="detail-value">{{
                  formatProducts(selectedAffiliation)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-credit-card"></i> Medio de Pago:</span
                >
                <span class="detail-value">{{
                  formatPayMethod(selectedAffiliation)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-file-invoice"></i> Voucher:</span
                >
                <span class="detail-value"
                  ><a
                    v-if="selectedAffiliation.voucher"
                    :href="selectedAffiliation.voucher.url"
                    target="_blank"
                    >Ver</a
                  ></span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-info-circle"></i> Estado:</span
                >
                <span class="detail-value">{{
                  selectedAffiliation.status
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label"
                  ><i class="fas fa-tag"></i> Tipo:</span
                >
                <span class="detail-value">
                  <span v-if="selectedAffiliation.type === 'upgrade'"
                    >Upgrade de plan</span
                  >
                  <span v-else>Afiliación normal</span>
                </span>
              </div>
              <div v-if="selectedAffiliation.type === 'upgrade'">
                <div class="detail-item">
                  <span class="detail-label"
                    ><i class="fas fa-arrow-up"></i> Plan anterior:</span
                  >
                  <span class="detail-value">{{
                    selectedAffiliation.previousPlan &&
                    selectedAffiliation.previousPlan.name
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label"
                    ><i class="fas fa-donate"></i> Diferencia pagada:</span
                  >
                  <span class="detail-value"
                    >S/
                    {{
                      selectedAffiliation.difference &&
                      selectedAffiliation.difference.amount
                    }}</span
                  >
                </div>
                <div class="detail-item">
                  <span class="detail-label"
                    ><i class="fas fa-box"></i> Productos adicionales:</span
                  >
                  <span class="detail-value">
                    <span
                      v-if="
                        selectedAffiliation.difference &&
                        selectedAffiliation.difference.products
                      "
                    >
                      {{
                        selectedAffiliation.difference.products
                          .filter((p) => p.total > 0)
                          .map((p) => `${p.total} ${p.name}`)
                          .join(", ")
                      }}
                    </span>
                    <span v-else>N/A</span>
                  </span>
                </div>
              </div>
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

const INVOICE_ROOT = process.env.VUE_APP_INVOICE_ROOT;
console.log({ INVOICE_ROOT });

export default {
  components: {
    Layout,
    DashboardCard,
    ModernTable,
  },
  data() {
    return {
      affiliations: [],
      allAffiliations: [],
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
      selectedAffiliation: null,

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
          key: "plan",
          label: "Plan",
          sortable: true,
        },
        {
          key: "total",
          label: "Total",
          sortable: true,
          type: "currency",
        },
        {
          key: "products",
          label: "Productos",
          sortable: false,
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
          key: "status",
          label: "Estado",
          sortable: true,
          type: "status",
        },
        {
          key: "type",
          label: "Tipo",
          sortable: false,
          formatter: (value, row) =>
            value === "upgrade" ? "Upgrade" : "Afiliación",
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
          key: "invoice",
          label: "Boleta",
          icon: "fas fa-file-invoice",
          class: "is-warning",
          condition: (item) => item.status === "approved",
        },
        {
          key: "revert",
          label: "Eliminar",
          icon: "fas fa-trash",
          class: "is-danger",
        },
        {
          key: "view",
          label: "Ver Detalles",
          icon: "fas fa-eye",
          class: "is-primary",
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
    totalAffiliations() {
      return this.allAffiliations.length;
    },
    approvedTotal() {
      return this.allAffiliations.filter(
        (a) => (a.status || "").toLowerCase() === "approved"
      ).length;
    },
    pendingTotal() {
      return this.allAffiliations.filter(
        (a) => (a.status || "").toLowerCase() === "pending"
      ).length;
    },
    totalAmount() {
      return this.allAffiliations
        .filter((a) => (a.status || "").toLowerCase() === "approved")
        .reduce(
          (sum, a) =>
            sum +
            (a.type === "upgrade"
              ? (a.difference && a.difference.amount) || 0
              : (a.plan && a.plan.amount) || 0),
          0
        );
    },
    tableData() {
      const sortedAffiliations = this.affiliations
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return sortedAffiliations.map((affiliation, index) => {
        // Buscar el nombre bonito de la oficina usando el id original
        let officeName = "N/A";
        const officeId = String(affiliation.officeId || affiliation.office);

        const officeObj = this.accounts.find((x) => String(x.id) === officeId);
        if (officeObj && officeObj.name) {
          officeName = officeObj.name;
        } else if (typeof officeId === "string" && officeId) {
          officeName = officeId.charAt(0).toUpperCase() + officeId.slice(1);
        }
        // Log para depuración
        console.log(
          `Afiliación: ${affiliation.id}, officeId: ${officeId}, officeName: ${officeName}`
        );

        // Calcular el índice global del registro en la lista completa
        const globalIndex = (this.currentPage - 1) * this.itemsPerPage + index;
        return {
          id:
            this.allAffiliations.length > 0
              ? this.allAffiliations.length - globalIndex
              : index + 1,
          date: affiliation.date,
          user: {
            name: `${affiliation.name} ${affiliation.lastName}`,
            dni: affiliation.dni,
            phone: affiliation.phone,
          },
          office: officeName,
          plan: {
            name: (affiliation.plan && affiliation.plan.name) || "",
            amount: (affiliation.plan && affiliation.plan.amount) || 0,
          },
          total:
            affiliation.type === "upgrade"
              ? (affiliation.difference && affiliation.difference.amount) || 0
              : (affiliation.plan && affiliation.plan.amount) || 0,
          products: this.formatProducts(affiliation),
          pay_method: this.formatPayMethod(affiliation),
          voucher: this.formatVoucher(affiliation),
          status: affiliation.status,
          raw: affiliation,
          balance: this.formatBalanceObj(affiliation.balance),
          type: affiliation.type, // Add type to the data object
          previousPlan: affiliation.previousPlan, // Add previousPlan to the data object
          difference: affiliation.difference, // Add difference to the data object
        };
      });
    },
  },
  watch: {
    accounts: {
      handler() {
        // Remap office names in affiliations when accounts change
        if (this.affiliations && this.accounts) {
          this.affiliations.forEach((affiliation) => {
            const office = this.accounts.find(
              (x) => x.id == affiliation.officeId
            );
            if (office && office.name) {
              affiliation.office = office.name;
            } else if (
              typeof affiliation.officeId === "string" &&
              affiliation.officeId
            ) {
              affiliation.office =
                affiliation.officeId.charAt(0).toUpperCase() +
                affiliation.officeId.slice(1);
            } else {
              affiliation.office = "N/A";
            }
          });
        }
      },
      immediate: true,
      deep: true,
    },
  },
  filters: {
    status(value) {
      if (value == "approved") return "Aprobada";
      if (value == "pending") return "Pendiente";
      if (value == "rejected") return "Rechazada";
      return value;
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
  },
  methods: {
    async GET(filter = "all") {
      this.loading = true;

      try {
        console.log("Loading affiliations with params:", {
          filter,
          account: "admin",
          page: this.currentPage,
          limit: this.itemsPerPage,
          search: this.search,
        });

        const { data } = await api.Affiliations.GET({
          filter,
          account: "admin",
          page: this.currentPage,
          limit: this.itemsPerPage,
          search: this.search,
        });

        // Obtener todas las afiliaciones para los totales
        const { data: allData } = await api.Affiliations.GET({
          filter: "all",
          account: "admin",
          page: 1,
          limit: 10000,
        });
        this.allAffiliations = allData.affiliations || [];
        this.affiliations = data.affiliations || [];
        this.totalItems = data.totalItems || 0;
        this.totalPages = data.totalPages || 0;

        console.log("Processed affiliations:", {
          count: this.affiliations.length,
          totalItems: this.totalItems,
          totalPages: this.totalPages,
        });

        // Enriquecer con información de oficinas
        console.log("Accounts:", this.accounts);
        this.affiliations.forEach((affiliation) => {
          if (!affiliation.officeId) {
            affiliation.officeId = affiliation.office;
          }
          const office = this.accounts.find(
            (x) => x.id == affiliation.officeId
          );
          if (office && office.name) {
            affiliation.office = office.name;
          } else if (
            typeof affiliation.officeId === "string" &&
            affiliation.officeId
          ) {
            affiliation.office =
              affiliation.officeId.charAt(0).toUpperCase() +
              affiliation.officeId.slice(1);
          } else {
            affiliation.office = "N/A";
          }
        });
        console.log(
          "Affiliations después de asignar oficina:",
          this.affiliations
        );

        if (filter == "all") this.title = "Todas las Afiliaciones";
        if (filter == "pending") this.title = "Afiliaciones Pendientes";
      } catch (error) {
        console.error("Error loading affiliations:", error);
        this.$toast.error("Error al cargar las afiliaciones");
      } finally {
        this.loading = false;
      }
    },

    formatProducts(affiliation) {
      if (affiliation.products) {
        return affiliation.products
          .filter((p) => p.total > 0)
          .map((p) => `${p.total} ${p.name}`)
          .join(", ");
      }
      if (affiliation.plan && affiliation.plan.products) {
        const products = [];
        affiliation.plan.products.forEach((group) => {
          group.list.forEach((product) => {
            if (product.total) {
              products.push(`${product.total} ${product.name}`);
            }
          });
        });
        return products.join(", ");
      }
      return "N/A";
    },

    formatPayMethod(affiliation) {
      if (affiliation.pay_method === "cash") {
        return "Efectivo";
      }
      if (affiliation.pay_method === "bank") {
        return `Banco - ${affiliation.bank}`;
      }
      return affiliation.pay_method;
    },

    formatVoucher(affiliation) {
      let voucherIsImage = false;
      let voucherUrl = affiliation.voucher || "";
      if (voucherUrl && typeof voucherUrl === "string") {
        voucherIsImage = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/i.test(
          voucherUrl
        );
      }
      return voucherIsImage
        ? { url: voucherUrl, isImage: true }
        : { url: voucherUrl, isImage: false };
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
      const affiliation = item.raw;
      if (action === "approve") {
        await this.approve(affiliation);
      } else if (action === "reject") {
        await this.reject(affiliation);
      } else if (action === "edit") {
        this.editVoucher(affiliation);
      } else if (action === "invoice") {
        window.open(`${this.INVOICE_ROOT}?id=${affiliation.id}`, "_blank");
      } else if (action === "revert") {
        await this.deleteAffiliation(affiliation);
      } else if (action === "view") {
        this.selectedAffiliation = affiliation;
        this.showViewModal = true;
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

    async approve(affiliation) {
      if (!confirm("¿Desea aprobar esta afiliación?")) return;

      affiliation.sending = true;

      try {
        const { data } = await api.Affiliations.POST({
          action: "approve",
          id: affiliation.id,
        });

        if (data.error && data.msg == "already approved") {
          affiliation.status = "approved";
        } else {
          affiliation.status = "approved";
        }
      } catch (error) {
        console.error("Error approving affiliation:", error);
      } finally {
        affiliation.sending = false;
      }
    },

    async reject(affiliation) {
      if (!confirm("¿Desea rechazar esta afiliación?")) return;

      affiliation.sending = true;

      try {
        const { data } = await api.Affiliations.POST({
          action: "reject",
          id: affiliation.id,
        });

        affiliation.status = "rejected";
      } catch (error) {
        console.error("Error rejecting affiliation:", error);
      } finally {
        affiliation.sending = false;
      }
    },

    editVoucher(affiliation) {
      affiliation.editing = true;
      affiliation.newVoucher = affiliation.voucher;
    },

    async saveVoucher(affiliation) {
      try {
        const { data } = await api.Affiliations.POST({
          action: "update_voucher",
          id: affiliation.id,
          voucher: affiliation.newVoucher,
        });

        affiliation.voucher = affiliation.newVoucher;
        affiliation.editing = false;
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

    getOfficeName(officeId) {
      const officeObj = this.accounts.find(
        (x) => String(x.id) === String(officeId)
      );
      if (officeObj && officeObj.name) {
        return officeObj.name;
      } else if (typeof officeId === "string" && officeId) {
        return officeId.charAt(0).toUpperCase() + officeId.slice(1);
      }
      return "N/A";
    },

    async deleteAffiliation(affiliation) {
      if (
        !confirm(
          "¿Desea eliminar esta afiliación? Esta acción no se puede deshacer."
        )
      )
        return;
      affiliation.sending = true;
      try {
        const { data } = await api.Affiliations.POST({
          action: "revert",
          id: affiliation.id,
        });
        console.log("Respuesta de revert:", data);
        if (data && data.error === false) {
          // Eliminar de la lista local
          this.affiliations = this.affiliations.filter(
            (a) => a.id !== affiliation.id
          );
          this.allAffiliations = this.allAffiliations.filter(
            (a) => a.id !== affiliation.id
          );
          this.$toast.success("Afiliación eliminada correctamente");
        } else {
          this.$toast.error(
            (data && data.msg) || "No se pudo eliminar la afiliación"
          );
        }
      } catch (error) {
        console.error("Error eliminando afiliación:", error);
        let msg = "Error al eliminar la afiliación";
        if (error && error.response && error.response.data) {
          msg =
            error.response.data.msg ||
            JSON.stringify(error.response.data) ||
            msg;
        } else if (error && error.message) {
          msg = error.message;
        }
        this.$toast.error(msg);
      } finally {
        affiliation.sending = false;
      }
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
  },
};

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return new Date(dateStr);
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateStr);
}
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
</style>
