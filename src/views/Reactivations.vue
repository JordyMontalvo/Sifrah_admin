<template>
  <Layout>
    <section class="reactivations-section">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Reactivaciones de Cuentas</h1>
              <p class="page-subtitle">
                Gestiona las solicitudes de usuarios eliminados
              </p>
            </div>
            <div class="header-actions">
              <router-link to="/users" class="button is-light">
                <span class="icon">
                  <i class="fas fa-arrow-left"></i>
                </span>
                <span>Volver a Usuarios</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Table -->
      <div class="container">
        <ModernTable
          :data="tableData"
          :columns="tableColumns"
          title="Solicitudes"
          subtitle="Lista de solicitudes de reactivación"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="true"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          :filters="tableFilters"
          :row-class="getRowClass"
          @item-action="handleItemAction"
          @filter="handleFilter"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
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
  components: {
    Layout,
    ModernTable,
    DashboardCard,
  },
  data() {
    return {
      tableData: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      currentFilter: "pending",

      tableColumns: [
        {
          key: "dni",
          label: "DNI",
          sortable: false,
        },
        {
          key: "name",
          label: "Nombre",
          sortable: false,
        },
        {
          key: "lastName",
          label: "Apellido",
          sortable: false,
        },
        {
          key: "reason",
          label: "Motivo",
          sortable: false,
          format: (val) => val && val.length > 50 ? val.substring(0, 50) + '...' : val
        },
        {
          key: "new_sponsor_code",
          label: "Nuevo Patrocinador",
          sortable: false,
          format: (val) => val ? val : "N/A"
        },
        {
          key: "status",
          label: "Estado",
          sortable: false,
          type: "status",
        },
        {
          key: "created_at",
          label: "Fecha",
          sortable: false,
          format: (val) => new Date(val).toLocaleDateString()
        }
      ],

      tableFilters: [
        { label: "Pendientes", value: "pending" },
        { label: "Aprobadas", value: "approved" },
        { label: "Rechazadas", value: "rejected" },
        { label: "Todas", value: "all" },
      ],
    };
  },
  computed: {
    itemActions() {
      return [
        {
          id: "approve",
          label: "Aprobar",
          icon: "fas fa-check",
          class: "is-success",
          showIf: (item) => item.status === "pending",
        },
        {
          id: "reject",
          label: "Rechazar",
          icon: "fas fa-times",
          class: "is-danger",
          showIf: (item) => item.status === "pending",
        },
        {
          id: "view",
          label: "Ver Detalle",
          icon: "fas fa-eye",
          class: "is-info",
        }
      ];
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const { data } = await api.reactivations.GET({
          page: this.currentPage,
          limit: this.itemsPerPage,
          status: this.currentFilter,
        });

        if (data.error) {
          Swal.fire("Error", data.msg, "error");
          return;
        }

        this.tableData = data.items.map(req => ({
          ...req,
          _statusColor: this.getStatusColor(req.status)
        }));
        
        this.totalItems = data.total;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      } catch (error) {
        console.error("Error fetching reactivations:", error);
        Swal.fire("Error", "No se pudo cargar la lista", "error");
      }
    },
    
    getStatusColor(status) {
      const colors = {
        pending: "warning",
        approved: "success",
        rejected: "danger"
      };
      return colors[status] || "info";
    },

    getRowClass(item) {
      if (item.status === 'rejected') return 'is-danger-row';
      if (item.status === 'approved') return 'is-success-row';
      return '';
    },

    handleFilter(filterValue) {
      this.currentFilter = filterValue;
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

    handleItemAction({ action, item }) {
      if (action === "approve") {
        this.approveRequest(item);
      } else if (action === "reject") {
        this.rejectRequest(item);
      } else if (action === "view") {
        this.viewDetails(item);
      }
    },

    viewDetails(item) {
      Swal.fire({
        title: 'Detalle de Solicitud',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p><strong>Usuario:</strong> ${item.name} ${item.lastName} (${item.dni})</p>
            <p><strong>Fecha:</strong> ${new Date(item.created_at).toLocaleString()}</p>
            <hr style="margin: 10px 0;">
            <p><strong>Motivo:</strong><br/>${item.reason}</p>
            <hr style="margin: 10px 0;">
            <p><strong>Patrocinador Solicitado:</strong> ${item.new_sponsor_code || 'No especificado (mantiene original)'}</p>
            <p><strong>Estado:</strong> ${item.status}</p>
          </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#6e62cc'
      });
    },

    async approveRequest(item) {
      const { value: formValues } = await Swal.fire({
        title: 'Aprobar Reactivación',
        html: `
          <p style="font-size: 14px; margin-bottom: 15px;">Estás a punto de reactivar al usuario <strong>${item.name} ${item.lastName}</strong>.</p>
          <div style="text-align: left;">
            <label style="font-size: 12px; font-weight: bold; color: #555;">Código del Patrocinador</label>
            <input id="admin-sponsor-code" class="swal2-input" style="margin: 5px 0; width: 100%; box-sizing: border-box; text-transform: uppercase;" value="${item.new_sponsor_code || ''}" placeholder="Código de patrocinador (opcional)">
            <small style="font-size: 11px; color: #888;">Puedes modificar el código que solicitó el usuario, o dejarlo en blanco si debe volver con su patrocinador original.</small>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Confirmar y Reactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#d33',
        preConfirm: () => {
          return { new_sponsor_code: document.getElementById('admin-sponsor-code').value };
        }
      });

      if (formValues) {
        try {
          const { data } = await api.reactivations.POST({
            action: 'approve',
            request_id: item.id,
            admin_id: this.$store.state.user ? this.$store.state.user.id : null,
            new_sponsor_code: formValues.new_sponsor_code
          });

          if (data.error) {
            Swal.fire("Error", data.msg, "error");
          } else {
            Swal.fire("Aprobado", data.msg, "success");
            this.fetchData();
          }
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Hubo un error al procesar la solicitud", "error");
        }
      }
    },

    async rejectRequest(item) {
      const result = await Swal.fire({
        title: '¿Rechazar solicitud?',
        text: "El usuario permanecerá eliminado.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, rechazar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          const { data } = await api.reactivations.POST({
            action: 'reject',
            request_id: item.id,
            admin_id: this.$store.state.user ? this.$store.state.user.id : null
          });

          if (data.error) {
            Swal.fire("Error", data.msg, "error");
          } else {
            Swal.fire("Rechazado", data.msg, "success");
            this.fetchData();
          }
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Hubo un error al procesar la solicitud", "error");
        }
      }
    }
  },
};
</script>

<style scoped>
.page-header {
  background: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid #f1f2f6;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Custom row styles based on ModernTable classes */
::v-deep .is-danger-row {
  background-color: #ffeef0;
}

::v-deep .is-success-row {
  background-color: #f0fdf4;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-actions .button {
    flex: 1;
  }
}
</style>
