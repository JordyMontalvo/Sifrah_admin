<template>
  <Layout>
    <section class="offices-section">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">{{ title }}</h1>
              <p class="page-subtitle">Gestiona las oficinas del sistema</p>
            </div>

            <div class="header-actions">
              <button class="button is-info" @click="clearAllNotifications" v-if="notifications.length > 0">
                <span class="icon">
                  <i class="fas fa-bell-slash"></i>
                </span>
                <span>Limpiar Notificaciones</span>
              </button>
              <button class="button is-success" @click="showAddModal = true">
                <span class="icon">
                  <i class="fas fa-plus"></i>
                </span>
                <span>Nueva Oficina</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="container">
        <div class="info-banner">
          <div class="info-content">
            <i class="fas fa-info-circle"></i>
            <span>
              <strong>Consejo:</strong> Para agregar la URL de Google Maps, ve a Google Maps, busca la ubicación de tu oficina, haz clic en "Compartir" y copia el enlace.
            </span>
          </div>
        </div>
        
        <div class="stats-grid">
          <DashboardCard
            :value="offices.length"
            label="Total Oficinas"
            icon="fas fa-building"
            color="primary"
            :description="`Configuradas en el sistema`"
          />

          <DashboardCard
            :value="totalProducts"
            label="Total Productos"
            icon="fas fa-box"
            color="success"
            :description="`En todas las oficinas`"
          />

          <DashboardCard
            :value="totalRecharges"
            label="Total Recargas"
            icon="fas fa-sync-alt"
            color="info"
            :description="`Realizadas en el sistema`"
          />
        </div>
      </div>

      <!-- Office Tabs -->
      <div class="container">
        <div class="office-tabs">
          <div class="tabs">
            <ul>
              <li
                v-for="office in offices"
                :key="office.id"
                :class="{
                  'is-active':
                    selected_office && selected_office.id === office.id,
                }"
                @click="selected_office = office"
              >
                <a>
                  {{ office.name }}
                  <span v-if="office.googleMapsUrl" class="maps-indicator" title="Tiene Google Maps">
                    <i class="fas fa-map-marker-alt"></i>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Office Details -->
        <div v-if="selected_office" class="office-details">
          <div class="office-header">
            <h2 class="office-title">{{ selected_office.name }}</h2>
            <div class="office-actions">
              <button
                v-if="selected_office.googleMapsUrl"
                class="button is-warning"
                @click="openGoogleMaps"
                title="Abrir en Google Maps"
              >
                <span class="icon">
                  <i class="fas fa-map-marked-alt"></i>
                </span>
                <span>Ver Mapa</span>
              </button>
              <button
                class="button is-info"
                @click="editOffice(selected_office)"
              >
                <span class="icon">
                  <i class="fas fa-edit"></i>
                </span>
                <span>Editar</span>
              </button>
            </div>
          </div>

          <!-- Office Info -->
          <div class="office-info">
            <div class="info-grid">
              <div class="info-item">
                <label>Teléfono:</label>
                <span>{{ selected_office.phone || 'No disponible' }}</span>
              </div>
              <div class="info-item">
                <label>Dirección:</label>
                <span>{{ selected_office.address }}</span>
              </div>
              <div class="info-item">
                <label>Google Maps:</label>
                <span v-if="selected_office.googleMapsUrl">
                  <a 
                    :href="selected_office.googleMapsUrl" 
                    target="_blank" 
                    class="maps-link"
                  >
                    <i class="fas fa-map-marker-alt"></i>
                    Ver en Google Maps
                  </a>
                </span>
                <span v-else class="no-maps">No disponible</span>
              </div>
              <div class="info-item">
                <label>Cuentas:</label>
                <span>{{ selected_office.accounts }}</span>
              </div>
            </div>
          </div>

          <!-- Products Section -->
          <div class="products-section">
            <div class="columns">
              <div class="column">
                <h3 class="section-title">Productos Actuales</h3>
                <div class="table-container">
                  <table class="table is-fullwidth">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(product, i) in selected_office.products"
                        :key="i"
                      >
                        <td>{{ i + 1 }}</td>
                        <td>{{ product.name }}</td>
                        <td>{{ product.total }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="column">
                <h3 class="section-title">Recargar Productos</h3>
                <div class="recharge-form">
                  <div class="table-container">
                    <table class="table is-fullwidth">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Producto</th>
                          <th>Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(product, i) in selected_office.new_products"
                          :key="i"
                        >
                          <td>{{ i + 1 }}</td>
                          <td>{{ product.name }}</td>
                          <td>
                            <input
                              type="number"
                              class="input is-small"
                              v-model="product.total"
                              min="0"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button class="button is-primary" @click="recharge">
                    <span class="icon">
                      <i class="fas fa-sync-alt"></i>
                    </span>
                    <span>Recargar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recharges History -->
          <div class="recharges-section">
            <h3 class="section-title">Historial de Recargas</h3>
            <div class="table-container">
              <table class="table is-fullwidth">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Productos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(recharge, i) of selected_office.recharges"
                    :key="i"
                    @click="toggleRecharge(i)"
                    class="clickable-row"
                  >
                    <td>{{ recharge.date | date }}</td>
                    <td v-show="recharge.show">
                      <div
                        v-for="product in recharge.products"
                        :key="product.name"
                        v-if="product.total"
                      >
                        {{ product.total }} {{ product.name }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Office Modal -->
      <div class="modal" :class="{ 'is-active': showEditModal }">
        <div class="modal-background" @click="closeEditModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Editar Oficina</p>
            <button
              class="delete"
              aria-label="close"
              @click="closeEditModal"
            ></button>
          </header>
          <section class="modal-card-body">
            <div class="form-grid">
              <div class="field">
                <label class="label">Nombre</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="editingOffice.name"
                    placeholder="Nombre de la oficina"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Teléfono</label>
                <div class="control">
                  <input
                    class="input"
                    type="tel"
                    v-model="editingOffice.phone"
                    placeholder="Teléfono de la oficina"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Dirección</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="editingOffice.address"
                    placeholder="Dirección de la oficina"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">URL de Google Maps</label>
                <div class="control">
                  <input
                    class="input"
                    type="url"
                    v-model="editingOffice.googleMapsUrl"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <p class="help">Opcional: Enlace directo a la ubicación en Google Maps</p>
              </div>

              <div class="field">
                <label class="label">Cuentas</label>
                <div class="control">
                  <textarea
                    class="textarea"
                    v-model="editingOffice.accounts"
                    placeholder="Información de cuentas"
                  ></textarea>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="saveOffice">
              Guardar Cambios
            </button>
            <button class="button" @click="closeEditModal">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Add Office Modal -->
      <div class="modal" :class="{ 'is-active': showAddModal }">
        <div class="modal-background" @click="closeAddModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Nueva Oficina</p>
            <button
              class="delete"
              aria-label="close"
              @click="closeAddModal"
            ></button>
          </header>
          <section class="modal-card-body">
            <div class="form-grid">
              <div class="field">
                <label class="label">Nombre *</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="newOffice.name"
                    placeholder="Nombre de la oficina"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Teléfono *</label>
                <div class="control">
                  <input
                    class="input"
                    type="tel"
                    v-model="newOffice.phone"
                    placeholder="Teléfono de la oficina"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Dirección *</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="newOffice.address"
                    placeholder="Dirección de la oficina"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">URL de Google Maps</label>
                <div class="control">
                  <input
                    class="input"
                    type="url"
                    v-model="newOffice.googleMapsUrl"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <p class="help">Opcional: Enlace directo a la ubicación en Google Maps</p>
              </div>

              <div class="field">
                <label class="label">Cuentas</label>
                <div class="control">
                  <textarea
                    class="textarea"
                    v-model="newOffice.accounts"
                    placeholder="Información de cuentas bancarias"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="createOffice" :disabled="!isValidNewOffice">
              <span class="icon">
                <i class="fas fa-plus"></i>
              </span>
              <span>Crear Oficina</span>
            </button>
            <button class="button is-light" @click="resetNewOfficeForm">
              <span class="icon">
                <i class="fas fa-undo"></i>
              </span>
              <span>Limpiar</span>
            </button>
            <button class="button" @click="closeAddModal">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando oficinas...</p>
        </div>
      </div>

      <!-- Custom Notifications -->
      <div class="notifications-container">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`, { 'removing': notification.removing }]"
          @click="removeNotification(notification.id)"
        >
          <div class="notification-content">
            <i :class="getNotificationIcon(notification.type)"></i>
            <div class="notification-text">
              <h4>{{ notification.title }}</h4>
              <p>{{ notification.message }}</p>
            </div>
            <button class="notification-close" @click.stop="removeNotification(notification.id)">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Botones de confirmación para notificaciones de confirmación -->
          <div v-if="notification.isConfirm" class="notification-actions">
            <button class="notification-btn confirm-btn" @click="confirmAction(notification)">
              Confirmar
            </button>
            <button class="notification-btn cancel-btn" @click="cancelAction(notification)">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import DashboardCard from "@/components/DashboardCard";
import api from "@/api";

export default {
  components: { Layout, DashboardCard },
  data() {
    return {
      loading: null,
      title: "Oficinas",
      offices: [],
      selected_office: null,
      showAddModal: false,
      showEditModal: false,
      editingOffice: {
        name: "",
        phone: "",
        address: "",
        googleMapsUrl: "",
        accounts: "",
      },
      newOffice: {
        name: "",
        phone: "",
        address: "",
        googleMapsUrl: "",
        accounts: "",
      },
      notifications: [],
      notificationId: 0,
    };
  },

  computed: {
    totalProducts() {
      let total = 0;
      this.offices.forEach((office) => {
        if (office.products && Array.isArray(office.products)) {
          office.products.forEach((product) => {
            total += product.total || 0;
          });
        }
      });
      return total;
    },
    totalRecharges() {
      let total = 0;
      this.offices.forEach((office) => {
        if (office.recharges && Array.isArray(office.recharges)) {
          total += office.recharges.length;
        }
      });
      return total;
    },
    isValidNewOffice() {
      return this.newOffice.name && this.newOffice.phone && this.newOffice.address;
    }
  },

  filters: {
    date(val) {
      return new Date(val).toLocaleDateString();
    },
  },

  async created() {
    const account = JSON.parse(localStorage.getItem("session"));

    this.$store.commit("SET_ACCOUNT", account);

    this.loading = true;

    // // GET data
    const { data } = await api.offices.GET();
    console.log({ data });

    this.loading = false;

    // error
    // if(data.error && data.msg == 'invalid filter') this.$router.push('collects/all')

    data.offices = data.offices.map((office) => {
      office.new_products = [];

      office.products.forEach((p) => {
        office.new_products.push({
          id: p.id,
          name: p.name,
          total: 0,
        });
      });

      office.recharges.forEach((r) => {
        r.show = false;
      });

      return office;
    });

    this.offices = data.offices;

    this.selected_office = this.offices[0];
  },

  methods: {
    async recharge() {
      console.log("recharge");

      const id = this.selected_office.id;
      const products = this.selected_office.new_products;

      products.forEach((p) => {
        p.total = parseInt(p.total);
      });

      console.log({ id, products });

      confirm("Seguro que desea hacer la recarga de productos?");

      this.selected_office.products.forEach((p, i) => {
        p.total += products[i].total;
      });

      const { data } = await api.offices.POST({ id, products });
      console.log({ data });
    },

    async update() {
      console.log("update ...");

      const office = this.selected_office;

      const { data } = await api.offices.POST({ id: office.id, office });
      console.log({ data });
    },

    open(i) {
      console.log(i);
      this.selected_office.recharges[i].show =
        !this.selected_office.recharges[i].show;
    },

    editOffice(office) {
      this.editingOffice = { ...office };
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
    },

    async saveOffice() {
      try {
        const { data } = await api.offices.POST({ 
          id: this.editingOffice.id, 
          office: this.editingOffice 
        });
        
        // Actualizar la oficina en el array local
        const index = this.offices.findIndex(o => o.id === this.editingOffice.id);
        if (index !== -1) {
          this.offices[index] = { ...this.offices[index], ...this.editingOffice };
          this.selected_office = this.offices[index];
        }
        
        this.closeEditModal();
        this.showNotification('success', 'Éxito', 'Oficina actualizada exitosamente!');
      } catch (error) {
        console.error("Error al actualizar oficina:", error);
        this.showNotification('error', 'Error', 'Error al actualizar oficina. Inténtalo de nuevo.');
      }
    },

    toggleRecharge(i) {
      this.selected_office.recharges[i].show =
        !this.selected_office.recharges[i].show;
    },

    closeAddModal() {
      this.showAddModal = false;
      this.newOffice = {
        name: "",
        phone: "",
        address: "",
        googleMapsUrl: "",
        accounts: "",
      };
    },

    async createOffice() {
      if (!this.isValidNewOffice) {
        this.showNotification('error', 'Error', 'Por favor, complete todos los campos obligatorios.');
        return;
      }

      // Mostrar notificación de confirmación
      this.showConfirmNotification(
        'Confirmar Creación',
        '¿Está seguro de que desea crear esta nueva oficina?',
        () => this.processCreateOffice(),
        () => this.showNotification('info', 'Cancelado', 'Creación de oficina cancelada.')
      );
    },

    async processCreateOffice() {
      try {
        this.loading = true;
        
        const { data } = await api.offices.POST({ office: this.newOffice });
        console.log({ data });
        
        // Agregar la nueva oficina al array local
        if (data.office) {
          this.offices.push(data.office);
          this.selected_office = data.office;
          this.closeAddModal();
          
          // Mostrar mensaje de éxito
          this.showNotification('success', 'Éxito', 'Oficina creada exitosamente!');
        } else {
          // Si no hay data.office, mostrar error
          this.showNotification('error', 'Error', 'No se recibió confirmación del servidor');
        }
      } catch (error) {
        console.error("Error al crear oficina:", error);
        this.showNotification('error', 'Error', 'Error al crear oficina. Inténtalo de nuevo.');
      } finally {
        this.loading = false;
      }
    },

    openGoogleMaps() {
      if (this.selected_office.googleMapsUrl) {
        window.open(this.selected_office.googleMapsUrl, '_blank');
      } else {
        this.showNotification('warning', 'Advertencia', 'No hay URL de Google Maps disponible para esta oficina.');
      }
    },

    resetNewOfficeForm() {
      this.newOffice = {
        name: "",
        phone: "",
        address: "",
        googleMapsUrl: "",
        accounts: "",
      };
    },

    // Métodos para notificaciones personalizadas
    showNotification(type, title, message, duration = 5000) {
      const notification = {
        id: ++this.notificationId,
        type,
        title,
        message,
        timestamp: Date.now()
      };
      
      this.notifications.push(notification);
      
      // Auto-remover después del tiempo especificado
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    },

    showConfirmNotification(title, message, onConfirm, onCancel) {
      const notification = {
        id: ++this.notificationId,
        type: 'info',
        title,
        message,
        timestamp: Date.now(),
        isConfirm: true,
        onConfirm,
        onCancel
      };
      
      this.notifications.push(notification);
      
      // Auto-remover después de 10 segundos si no se confirma
      setTimeout(() => {
        if (this.notifications.find(n => n.id === notification.id)) {
          this.removeNotification(notification.id);
        }
      }, 10000);
    },

    removeNotification(id) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        // Agregar clase para animación de salida
        notification.removing = true;
        
        // Esperar a que termine la animación antes de remover
        setTimeout(() => {
          const index = this.notifications.findIndex(n => n.id === id);
          if (index !== -1) {
            this.notifications.splice(index, 1);
          }
        }, 300);
      }
    },

    getNotificationIcon(type) {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      };
      return icons[type] || icons.info;
    },

    confirmAction(notification) {
      if (notification.onConfirm) {
        notification.onConfirm();
      }
      this.removeNotification(notification.id);
    },

    cancelAction(notification) {
      if (notification.onCancel) {
        notification.onCancel();
      }
      this.removeNotification(notification.id);
    },

    clearAllNotifications() {
      this.notifications = [];
    }
  },
};
</script>

<style scoped>
.offices-section {
  padding: 0;
}

/* Page Header */
.page-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 40px 0;
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left .page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
}

.header-left .page-subtitle {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .button {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.header-actions .button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* Info Banner */
.info-banner {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.info-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
}

.info-content i {
  font-size: 1.2rem;
  color: #93c5fd;
}

.info-content strong {
  font-weight: 600;
}

/* Office Tabs */
.office-tabs {
  margin-bottom: 30px;
}

.office-tabs .tabs ul {
  border-bottom-color: #e5e7eb;
}

.office-tabs .tabs li {
  margin-bottom: -1px;
}

.office-tabs .tabs li a {
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-weight: 500;
  padding: 12px 20px;
  transition: all 0.3s ease;
}

.office-tabs .tabs li.is-active a {
  border-bottom-color: #10b981;
  color: #10b981;
}

.office-tabs .tabs li a:hover {
  color: #059669;
}

.maps-indicator {
  margin-left: 8px;
  color: #f59e0b;
  font-size: 0.8rem;
}

.maps-indicator i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* Office Details */
.office-details {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.office-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.office-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.office-actions .button {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
}

/* Office Info */
.office-info {
  margin-bottom: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.info-item span {
  color: #6b7280;
  font-size: 1rem;
}

.maps-link {
  color: #10b981;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.maps-link:hover {
  color: #059669;
  text-decoration: underline;
}

.maps-link i {
  font-size: 0.9rem;
}

.no-maps {
  color: #9ca3af;
  font-style: italic;
}

.help {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

/* Section Titles */
.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

/* Products Section */
.products-section {
  margin-bottom: 30px;
}

.products-section .columns {
  margin: 0;
}

.products-section .column {
  padding: 0 15px;
}

.recharge-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recharge-form .button {
  align-self: flex-start;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
}

/* Table Styles */
.table-container {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.table {
  margin: 0;
  background: white;
}

.table th {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background: #f3f4f6 !important;
}

/* Recharges Section */
.recharges-section {
  margin-top: 30px;
}

/* Modal Styles */
.modal-card {
  border-radius: 12px;
  overflow: hidden;
}

.modal-card-head {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-bottom: none;
}

.modal-card-title {
  color: white;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.field .label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-content p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .header-left .page-title {
    font-size: 2rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .button {
    width: 100%;
    justify-content: center;
  }

  .office-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .products-section .columns {
    flex-direction: column;
  }

  .products-section .column {
    padding: 0;
    margin-bottom: 20px;
  }
}

/* Custom Notifications */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification:hover {
  transform: translateX(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.notification-success {
  border-left-color: #10b981;
}

.notification-error {
  border-left-color: #ef4444;
}

.notification-warning {
  border-left-color: #f59e0b;
}

.notification-info {
  border-left-color: #3b82f6;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.notification-content i {
  font-size: 1.2rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-success i {
  color: #10b981;
}

.notification-error i {
  color: #ef4444;
}

.notification-warning i {
  color: #f59e0b;
}

.notification-info i {
  color: #3b82f6;
}

.notification-text {
  flex: 1;
  min-width: 0;
}

.notification-text h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #111827;
}

.notification-text p {
  font-size: 0.85rem;
  margin: 0;
  color: #6b7280;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.notification-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: flex-end;
}

.notification-btn {
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn {
  background-color: #10b981;
  color: white;
  border: none;
}

.confirm-btn:hover {
  background-color: #059669;
}

.cancel-btn {
  background-color: #ef4444;
  color: white;
  border: none;
}

.cancel-btn:hover {
  background-color: #d61e1e;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.notification.removing {
  animation: slideOutRight 0.3s ease-in forwards;
}
</style>
