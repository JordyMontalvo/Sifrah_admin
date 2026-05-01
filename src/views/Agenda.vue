<template>
  <Layout>
    <div class="agenda-admin-container">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Agenda / Eventos</h1>
          <p class="page-subtitle">Gestiona y programa los eventos que verán los usuarios.</p>
        </div>
        <div class="header-right">
          <button class="button is-primary" @click="createNewEvent">
            <span class="icon"><i class="fas fa-plus"></i></span>
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      <div class="columns is-desktop agenda-content">
        <!-- Columna Izquierda: Lista de Eventos -->
        <div class="column is-8 list-column">
          <div class="filters-row">
            <div class="control has-icons-left search-control">
              <input class="input" type="text" v-model="search" placeholder="Buscar evento..." />
              <span class="icon is-small is-left">
                <i class="fas fa-search"></i>
              </span>
            </div>
            <div class="select">
              <select v-model="filterType">
                <option value="all">Todos los tipos</option>
                <option value="Presentación">Presentación</option>
                <option value="Capacitación">Capacitación</option>
                <option value="Taller">Taller</option>
                <option value="Reunión">Reunión</option>
                <option value="Lanzamiento">Lanzamiento</option>
                <option value="Entrenamiento">Entrenamiento</option>
                <option value="Evento de Salud">Evento de Salud</option>
                <option value="Testimonio">Testimonio</option>
              </select>
            </div>
            <div class="select">
              <select v-model="filterStatus">
                <option value="all">Todos los estados</option>
                <option value="Publicado">Publicado</option>
                <option value="Programado">Programado</option>
                <option value="Borrador">Borrador</option>
              </select>
            </div>
          </div>

          <div class="events-table-container">
            <table class="table is-fullwidth events-table">
              <thead>
                <tr>
                  <th>EVENTO</th>
                  <th>FECHA</th>
                  <th>HORA</th>
                  <th>TIPO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredEvents.length === 0">
                  <td colspan="6" class="has-text-centered py-5">
                    No hay eventos registrados.
                  </td>
                </tr>
                <tr v-for="event in paginatedEvents" :key="event.id">
                  <td>
                    <div class="event-info-cell">
                      <div class="event-icon" :style="{ backgroundColor: getTypeColor(event.type) + '20', color: getTypeColor(event.type) }">
                        <i :class="getModalityIcon(event.modality)"></i>
                      </div>
                      <div>
                        <div class="event-title">{{ event.title }}</div>
                        <div class="event-desc">{{ truncate(event.description, 40) }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="ws-nowrap">
                    <span class="icon is-small"><i class="far fa-calendar-alt"></i></span>
                    {{ formatDate(event.date) }}
                  </td>
                  <td class="ws-nowrap">
                    <span class="icon is-small"><i class="far fa-clock"></i></span>
                    {{ event.time }}
                  </td>
                  <td>
                    <span class="tag type-tag" :style="{ backgroundColor: getTypeColor(event.type) + '15', color: getTypeColor(event.type) }">
                      {{ event.type }}
                    </span>
                  </td>
                  <td>
                    <span class="tag status-tag" :class="getStatusClass(event.status)">
                      {{ event.status }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button class="action-btn" @click="editEvent(event)" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                      </button>
                      <button class="action-btn has-text-danger" @click="deleteEvent(event)" title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="pagination-footer" v-if="filteredEvents.length > 0">
            <span class="pagination-info">
              {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredEvents.length) }} de {{ filteredEvents.length }} eventos
            </span>
            <div class="pagination-controls">
              <button class="pagination-btn" :disabled="currentPage === 1" @click="currentPage--">
                <i class="fas fa-chevron-left"></i>
              </button>
              <span class="current-page-badge">{{ currentPage }}</span>
              <button class="pagination-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Formulario -->
        <div class="column is-4 form-column">
          <div class="form-card">
            <h2 class="form-title">
              <span class="icon"><i class="far fa-calendar-plus"></i></span>
              {{ isEditing ? 'Editar Evento' : 'Crear Nuevo Evento' }}
            </h2>

            <form @submit.prevent="saveEvent">
              <div class="columns is-mobile is-multiline">
                <div class="column is-12">
                  <div class="field">
                    <label class="label">1. Fecha del evento</label>
                    <div class="control has-icons-left">
                      <input class="input" type="date" v-model="form.date" required />
                      <span class="icon is-small is-left"><i class="far fa-calendar-alt"></i></span>
                    </div>
                  </div>
                </div>
                
                <div class="column is-12">
                  <div class="field">
                    <label class="label">2. Hora</label>
                    <div class="control has-icons-left">
                      <input class="input" type="time" v-model="form.time" required />
                      <span class="icon is-small is-left"><i class="far fa-clock"></i></span>
                    </div>
                  </div>
                </div>

                <div class="column is-12">
                  <div class="field">
                    <label class="label">3. Título del evento</label>
                    <div class="control">
                      <input class="input" type="text" v-model="form.title" placeholder="Ej: Reunión de Presentación" required />
                    </div>
                  </div>
                </div>

                <div class="column is-12">
                  <div class="field">
                    <label class="label">4. Descripción breve</label>
                    <div class="control">
                      <textarea class="textarea" rows="3" v-model="form.description" placeholder="Ej: Conoce la oportunidad SIFRAH y cómo iniciar tu negocio." required maxlength="120"></textarea>
                    </div>
                    <p class="help has-text-right">{{ form.description.length }}/120</p>
                  </div>
                </div>

                <div class="column is-6">
                  <div class="field">
                    <label class="label">5. Tipo de evento</label>
                    <div class="control has-icons-left">
                      <div class="select is-fullwidth">
                        <select v-model="form.type" required>
                          <option value="Presentación">Presentación</option>
                          <option value="Capacitación">Capacitación</option>
                          <option value="Taller">Taller</option>
                          <option value="Reunión">Reunión</option>
                          <option value="Lanzamiento">Lanzamiento</option>
                          <option value="Entrenamiento">Entrenamiento</option>
                          <option value="Evento de Salud">Evento de Salud</option>
                          <option value="Testimonio">Testimonio</option>
                        </select>
                      </div>
                      <span class="icon is-small is-left"><i class="fas fa-tag"></i></span>
                    </div>
                  </div>
                </div>

                <div class="column is-6">
                  <div class="field">
                    <label class="label">6. Modalidad</label>
                    <div class="control has-icons-left">
                      <div class="select is-fullwidth">
                        <select v-model="form.modality" required>
                          <option value="Virtual">Virtual</option>
                          <option value="Presencial">Presencial</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                      <span class="icon is-small is-left"><i class="fas fa-globe"></i></span>
                    </div>
                  </div>
                </div>

                <div class="column is-12">
                  <div class="field">
                    <label class="label">7. Enlace o Dirección</label>
                    <div class="control has-icons-left">
                      <input class="input" type="text" v-model="form.link" placeholder="https://zoom.us/... o Dirección" />
                      <span class="icon is-small is-left"><i class="fas fa-link"></i></span>
                    </div>
                  </div>
                </div>

                <div class="column is-12">
                  <div class="field">
                    <label class="label">8. Estado del evento</label>
                    <div class="control has-icons-left">
                      <div class="select is-fullwidth">
                        <select v-model="form.status" required>
                          <option value="Publicado">Publicado</option>
                          <option value="Programado">Programado</option>
                          <option value="Borrador">Borrador</option>
                        </select>
                      </div>
                      <span class="icon is-small is-left">
                        <i class="fas fa-circle" :class="{'has-text-success': form.status === 'Publicado', 'has-text-warning': form.status === 'Programado', 'has-text-grey': form.status === 'Borrador'}"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-actions mt-4">
                <button type="button" class="button is-light is-fullwidth cancel-btn" @click="resetForm">
                  Cancelar
                </button>
                <button type="submit" class="button is-primary is-fullwidth save-btn" :class="{'is-loading': saving}">
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "./Layout";
import api from "@/api";
import Swal from "sweetalert2";

export default {
  components: { Layout },
  data() {
    return {
      events: [],
      search: "",
      filterType: "all",
      filterStatus: "all",
      currentPage: 1,
      itemsPerPage: 10,
      saving: false,
      isEditing: false,
      form: this.getEmptyForm(),
    };
  },
  computed: {
    filteredEvents() {
      let result = this.events;
      if (this.search) {
        const s = this.search.toLowerCase();
        result = result.filter(e => 
          (e.title && e.title.toLowerCase().includes(s)) ||
          (e.description && e.description.toLowerCase().includes(s))
        );
      }
      if (this.filterType !== "all") {
        result = result.filter(e => e.type === this.filterType);
      }
      if (this.filterStatus !== "all") {
        result = result.filter(e => e.status === this.filterStatus);
      }
      // Sort by date (descending)
      return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    totalPages() {
      return Math.ceil(this.filteredEvents.length / this.itemsPerPage) || 1;
    },
    paginatedEvents() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredEvents.slice(start, start + this.itemsPerPage);
    }
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    getModalityIcon(modality) {
      const m = (modality || "").toString().toLowerCase();
      if (m === "virtual") return "fas fa-video";
      if (m === "presencial") return "fas fa-users";
      if (m === "mixto" || m === "mixta") return "fas fa-camera";
      return "fas fa-video";
    },
    getEmptyForm() {
      return {
        id: null,
        title: "",
        description: "",
        date: "",
        time: "",
        type: "Presentación",
        modality: "Virtual",
        link: "",
        status: "Publicado",
      };
    },
    async fetchEvents() {
      try {
        const { data } = await api.agenda.GET();
        if (data && data.events) {
          this.events = data.events;
        }
      } catch (e) {
        console.error("Error loading events", e);
        this.$toast && this.$toast.error("Error al cargar agenda");
      }
    },
    createNewEvent() {
      this.isEditing = false;
      this.form = this.getEmptyForm();
    },
    editEvent(event) {
      this.isEditing = true;
      this.form = { ...event };
    },
    async deleteEvent(event) {
      const result = await Swal.fire({
        title: "¿Eliminar evento?",
        text: `¿Seguro que deseas eliminar "${event.title}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (result.isConfirmed) {
        try {
          await api.agenda.POST({ action: "delete", id: event.id });
          this.$toast && this.$toast.success("Evento eliminado");
          await this.fetchEvents();
        } catch (e) {
          console.error("Error deleting event", e);
          this.$toast && this.$toast.error("No se pudo eliminar el evento");
        }
      }
    },
    async saveEvent() {
      this.saving = true;
      try {
        const action = this.isEditing ? "update" : "insert";
        await api.agenda.POST({ action, event: this.form });
        this.$toast && this.$toast.success(this.isEditing ? "Evento actualizado" : "Evento creado");
        this.resetForm();
        await this.fetchEvents();
      } catch (e) {
        console.error("Error saving event", e);
        this.$toast && this.$toast.error("Ocurrió un error al guardar");
      } finally {
        this.saving = false;
      }
    },
    resetForm() {
      this.isEditing = false;
      this.form = this.getEmptyForm();
    },
    truncate(text, length) {
      if (!text) return "";
      return text.length > length ? text.substring(0, length) + "..." : text;
    },
    formatDate(dateStr) {
      if (!dateStr) return "-";
      const d = new Date(dateStr + "T00:00:00"); // avoid timezone shift
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return isNaN(d) ? dateStr : d.toLocaleDateString('es-ES', options);
    },
    getTypeColor(type) {
      const colors = {
        "Presentación": "#6b46c1",
        "Capacitación": "#38a169",
        "Taller": "#3182ce",
        "Reunión": "#dd6b20",
        "Lanzamiento": "#e53e3e",
        "Entrenamiento": "#0ea5e9",
        "Evento de Salud": "#16a34a",
        "Testimonio": "#a855f7"
      };
      return colors[type] || "#718096";
    },
    getTypeIcon(type) {
      const icons = {
        "Presentación": "fas fa-video",
        "Capacitación": "fas fa-users",
        "Taller": "fas fa-graduation-cap",
        "Reunión": "fas fa-handshake",
        "Lanzamiento": "fas fa-rocket",
        "Entrenamiento": "fas fa-dumbbell",
        "Evento de Salud": "fas fa-heartbeat",
        "Testimonio": "fas fa-quote-left"
      };
      return icons[type] || "fas fa-calendar";
    },
    getStatusClass(status) {
      if (status === "Publicado") return "is-success is-light";
      if (status === "Programado") return "is-warning is-light";
      return "is-light";
    }
  }
};
</script>

<style scoped>
.agenda-admin-container {
  padding: 1.5rem;
  background-color: #f8fafc;
  min-height: calc(100vh - 4.5rem);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #64748b;
  font-size: 0.95rem;
}

.agenda-content {
  align-items: flex-start;
}

.filters-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-control {
  flex-grow: 1;
  min-width: 250px;
}

.events-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.events-table th {
  color: #64748b;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.events-table td {
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
}

.ws-nowrap {
  white-space: nowrap;
}

.event-info-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.event-title {
  font-weight: 600;
  color: #1e293b;
}

.event-desc {
  font-size: 0.85rem;
  color: #64748b;
}

.type-tag {
  font-weight: 600;
  border-radius: 6px;
}

.status-tag {
  font-weight: 600;
  border-radius: 6px;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #3b82f6;
}

.action-btn.has-text-danger:hover {
  color: #ef4444;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 0 0.5rem;
}

.pagination-info {
  color: #64748b;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-page-badge {
  background: #6b46c1;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-title .icon {
  color: #6b46c1;
}

.field .label {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.cancel-btn, .save-btn {
  font-weight: 600;
  border-radius: 8px;
}

.save-btn {
  background-color: #6b46c1;
}

.save-btn:hover {
  background-color: #553c9a;
}
</style>
