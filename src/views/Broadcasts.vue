<template>
  <Layout>
    <div class="container is-fluid py-5">
      <!-- Header -->
      <div class="level mb-4">
        <div class="level-left">
          <div>
            <h1 class="title is-3 has-text-weight-bold mb-2">Audio en vivo</h1>
            <p class="is-size-6 has-text-grey mb-0">Gestión de encuentros y transmisiones en vivo con AzuraCast</p>
          </div>
        </div>
        <div class="level-right">
          <button id="broadcast-new-btn" class="button is-primary" @click="openModal('add')">
            <span class="icon">
              <i class="fas fa-plus"></i>
            </span>
            <span>Nuevo encuentro</span>
          </button>
        </div>
      </div>

      <!-- Ayuda informativa -->
      <div class="notification is-info is-light mb-5">
        <div class="is-flex is-align-items-center">
          <span class="icon mr-2"><i class="fas fa-info-circle"></i></span>
          <span>Guardar o programar un encuentro no inicia la transmisión. Usa «Poner en vivo» solo cuando el expositor ya esté transmitiendo desde AzuraCast.</span>
        </div>
      </div>

      <!-- Table Container -->
      <div class="box p-0 shadow-sm">
        <!-- Box Header with Search & Stats -->
        <div class="py-5 px-4 is-flex is-flex-wrap-wrap is-justify-content-space-between is-align-items-center border-bottom-light box-header" style="width: 100%;">
          <div class="field mb-0 search-container">
            <p class="control has-icons-left">
              <input
                id="broadcast-search-input"
                v-model="search"
                class="input is-rounded search-input"
                type="text"
                placeholder="Buscar por título o expositor..."
              />
              <span class="icon is-small is-left">
                <i class="fas fa-search"></i>
              </span>
            </p>
          </div>
          <div class="is-flex is-align-items-center stats-container">
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">Total</p>
              <p class="title is-5 mb-0">{{ broadcasts.length }}</p>
            </div>
            <div class="stat-divider"></div>
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">En Vivo</p>
              <p class="title is-5 mb-0 has-text-danger">{{ liveBroadcastsCount }}</p>
            </div>
            <div class="stat-divider"></div>
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">Programados</p>
              <p class="title is-5 mb-0 has-text-info">{{ scheduledBroadcastsCount }}</p>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table id="broadcast-table" class="table is-fullwidth is-hoverable is-vcentered">
            <thead>
              <tr>
                <th style="width: 70px;">Portada</th>
                <th>Título</th>
                <th>Expositor</th>
                <th>Inicio programado</th>
                <th>Estado</th>
                <th class="has-text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(broadcast, index) in filteredBroadcasts" :key="broadcast.id || index">
                <td>
                  <div v-if="broadcast.image" class="broadcast-thumb">
                    <img :src="broadcast.image" alt="Portada" />
                  </div>
                  <div v-else class="broadcast-thumb placeholder">
                    <i class="fas fa-broadcast-tower has-text-grey-light"></i>
                  </div>
                </td>
                <td>
                  <div>
                    <p class="has-text-weight-semibold mb-0">{{ broadcast.title }}</p>
                    <p v-if="broadcast.stream_url" class="is-size-7 has-text-grey truncate-url mb-0" :title="broadcast.stream_url">
                      <i class="fas fa-link mr-1"></i>{{ broadcast.stream_url }}
                    </p>
                  </div>
                </td>
                <td>{{ broadcast.author || 'Equipo SIFRAH' }}</td>
                <td>
                  <div>
                    <span>{{ formatLimaDate(broadcast.scheduled_start) }}</span>
                    <p v-if="broadcast.scheduled_end" class="is-size-7 has-text-grey mb-0">
                      Fin: {{ formatLimaDate(broadcast.scheduled_end) }}
                    </p>
                  </div>
                </td>
                <td>
                  <span v-if="broadcast.status === 'scheduled'" class="tag is-info">Programado</span>
                  <span v-else-if="broadcast.status === 'live'" class="tag is-danger has-text-weight-bold">
                    <i class="fas fa-circle is-size-7 mr-1"></i> EN VIVO
                  </span>
                  <span v-else-if="broadcast.status === 'ended'" class="tag is-light">Finalizado</span>
                  <span v-else-if="broadcast.status === 'cancelled'" class="tag is-warning">Cancelado</span>
                  <span v-else class="tag is-light">{{ broadcast.status }}</span>
                </td>
                <td class="has-text-right">
                  <div class="buttons is-right are-small">
                    <!-- Poner en vivo: solo si status es scheduled o ended -->
                    <button
                      v-if="broadcast.status === 'scheduled' || broadcast.status === 'ended'"
                      :id="'broadcast-live-btn-' + broadcast.id"
                      class="button is-danger is-light"
                      title="Poner en vivo"
                      @click="setLive(broadcast)"
                    >
                      <span class="icon is-small"><i class="fas fa-broadcast-tower"></i></span>
                      <span>Poner en vivo</span>
                    </button>

                    <!-- Finalizar: solo si status es live -->
                    <button
                      v-if="broadcast.status === 'live'"
                      :id="'broadcast-end-btn-' + broadcast.id"
                      class="button is-dark is-light"
                      title="Finalizar transmisión"
                      @click="endBroadcast(broadcast)"
                    >
                      <span class="icon is-small"><i class="fas fa-stop"></i></span>
                      <span>Finalizar</span>
                    </button>

                    <!-- Editar -->
                    <button
                      :id="'broadcast-edit-btn-' + broadcast.id"
                      class="button is-info is-light"
                      title="Editar encuentro"
                      @click="openModal('edit', broadcast)"
                    >
                      <span class="icon is-small"><i class="fas fa-edit"></i></span>
                      <span>Editar</span>
                    </button>

                    <!-- Cancelar: solo si status es scheduled -->
                    <button
                      v-if="broadcast.status === 'scheduled'"
                      :id="'broadcast-cancel-btn-' + broadcast.id"
                      class="button is-warning is-light"
                      title="Cancelar encuentro"
                      @click="cancelBroadcast(broadcast)"
                    >
                      <span class="icon is-small"><i class="fas fa-ban"></i></span>
                      <span>Cancelar</span>
                    </button>

                    <!-- Eliminar -->
                    <button
                      :id="'broadcast-delete-btn-' + broadcast.id"
                      class="button is-danger is-light"
                      title="Eliminar"
                      @click="deleteBroadcast(broadcast)"
                    >
                      <span class="icon is-small"><i class="fas fa-trash"></i></span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredBroadcasts.length === 0">
                <td colspan="6" class="has-text-centered py-6">
                  <p class="has-text-grey">No se encontraron encuentros de audio en vivo.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div :class="['modal', { 'is-active': modal.active }]">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-card">
          <header class="modal-card-head has-background-white border-bottom-light">
            <p class="modal-card-title">{{ modal.mode === 'add' ? 'Nuevo Encuentro' : 'Editar Encuentro' }}</p>
            <button id="broadcast-modal-close-btn" class="delete" aria-label="close" @click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="columns is-multiline">
              <!-- Estado actual (solo informativo en edición) -->
              <div v-if="modal.mode === 'edit' && modal.currentBroadcast" class="column is-12 pb-0">
                <div class="field">
                  <label class="label is-small has-text-grey">Estado actual</label>
                  <div class="control">
                    <span v-if="modal.currentBroadcast.status === 'scheduled'" class="tag is-info">Programado</span>
                    <span v-else-if="modal.currentBroadcast.status === 'live'" class="tag is-danger">EN VIVO</span>
                    <span v-else-if="modal.currentBroadcast.status === 'ended'" class="tag is-light">Finalizado</span>
                    <span v-else-if="modal.currentBroadcast.status === 'cancelled'" class="tag is-warning">Cancelado</span>
                    <span v-else class="tag is-light">{{ modal.currentBroadcast.status }}</span>
                    <p class="help has-text-grey mt-1">El estado se actualiza con los botones de acción en la tabla principal.</p>
                  </div>
                </div>
              </div>

              <!-- Título -->
              <div class="column is-12">
                <div class="field">
                  <label class="label">Título <span class="has-text-danger">*</span></label>
                  <div class="control">
                    <input
                      id="broadcast-title-input"
                      v-model="form.title"
                      class="input"
                      type="text"
                      placeholder="Ej: Masterclass de prospección y liderazgo"
                      required
                    />
                  </div>
                </div>
              </div>

              <!-- Expositor -->
              <div class="column is-6">
                <div class="field">
                  <label class="label">Expositor</label>
                  <div class="control">
                    <input
                      id="broadcast-author-input"
                      v-model="form.author"
                      class="input"
                      type="text"
                      placeholder="Ej: Equipo SIFRAH"
                    />
                  </div>
                </div>
              </div>

              <!-- Estación AzuraCast -->
              <div class="column is-6">
                <div class="field">
                  <label class="label">Estación AzuraCast</label>
                  <div class="control">
                    <input
                      id="broadcast-station-input"
                      v-model="form.station"
                      class="input"
                      type="text"
                      placeholder="Ej: sifrah"
                    />
                  </div>
                </div>
              </div>

              <!-- URL del Stream -->
              <div class="column is-12">
                <div class="field">
                  <label class="label">URL del Stream (Oyente MP3)</label>
                  <div class="control">
                    <input
                      id="broadcast-stream-url-input"
                      v-model="form.stream_url"
                      class="input"
                      type="text"
                      placeholder="https://radio.ejemplo.com/listen/sifrah/radio.mp3"
                    />
                  </div>
                </div>
              </div>

              <!-- Descripción -->
              <div class="column is-12">
                <div class="field">
                  <label class="label">Descripción</label>
                  <div class="control">
                    <textarea
                      id="broadcast-description-input"
                      v-model="form.description"
                      class="textarea"
                      rows="3"
                      placeholder="Temario o detalles del encuentro..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Portada -->
              <div class="column is-12">
                <div class="field">
                  <label class="label">Portada</label>
                  <div class="control">
                    <div class="file has-name is-fullwidth">
                      <label class="file-label">
                        <input
                          id="broadcast-image-input"
                          class="file-input"
                          type="file"
                          accept="image/*"
                          @change="handleImageUpload"
                          :disabled="uploadingImage"
                        />
                        <span class="file-cta">
                          <span class="file-icon">
                            <i class="fas" :class="uploadingImage ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
                          </span>
                          <span class="file-label">
                            {{ uploadingImage ? 'Subiendo imagen...' : 'Seleccionar portada' }}
                          </span>
                        </span>
                        <span class="file-name" v-if="form.image">
                          {{ form.image.split('/').pop() }}
                        </span>
                      </label>
                    </div>
                  </div>
                  <!-- Vista previa -->
                  <div v-if="form.image" class="mt-3 is-flex is-align-items-center">
                    <figure class="image is-64x64 mr-3 preview-figure">
                      <img :src="form.image" alt="Portada" class="preview-img" />
                    </figure>
                    <button
                      id="broadcast-remove-image-btn"
                      type="button"
                      class="button is-small is-light is-danger"
                      @click="form.image = ''"
                    >
                      <span class="icon is-small"><i class="fas fa-trash"></i></span>
                      <span>Quitar portada</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Inicio programado -->
              <div class="column is-6">
                <div class="field">
                  <label class="label">Inicio programado (Hora Perú UTC-5)</label>
                  <div class="control">
                    <input
                      id="broadcast-start-input"
                      v-model="form.local_start"
                      class="input"
                      type="datetime-local"
                    />
                  </div>
                </div>
              </div>

              <!-- Fin programado -->
              <div class="column is-6">
                <div class="field">
                  <label class="label">Fin programado (Hora Perú UTC-5)</label>
                  <div class="control">
                    <input
                      id="broadcast-end-input"
                      v-model="form.local_end"
                      class="input"
                      type="datetime-local"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot has-background-white border-top-light is-justify-content-flex-end">
            <button id="broadcast-cancel-btn" class="button" @click="closeModal">Cancelar</button>
            <button
              id="broadcast-save-btn"
              class="button is-primary"
              :class="{ 'is-loading': saving }"
              @click="saveBroadcast"
            >
              {{ modal.mode === 'add' ? 'Crear encuentro' : 'Guardar cambios' }}
            </button>
          </footer>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "./Layout.vue";
import api from "@/api";
import lib from "@/lib";

export function limaLocalToIso(str) {
  if (!str) return null;
  const trimmed = String(str).trim();
  if (!trimmed) return null;
  const clean = trimmed.length === 16 ? trimmed + ":00" : trimmed.slice(0, 19);
  const d = new Date(clean + "-05:00");
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function isoToLimaLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const limaTime = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  const YYYY = limaTime.getUTCFullYear();
  const MM = String(limaTime.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(limaTime.getUTCDate()).padStart(2, "0");
  const hh = String(limaTime.getUTCHours()).padStart(2, "0");
  const mm = String(limaTime.getUTCMinutes()).padStart(2, "0");
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

export default {
  name: "Broadcasts",
  components: { Layout },
  data() {
    return {
      broadcasts: [],
      search: "",
      loadingList: false,
      saving: false,
      uploadingImage: false,
      modal: {
        active: false,
        mode: "add",
        currentBroadcast: null,
      },
      form: {
        title: "",
        author: "Equipo SIFRAH",
        description: "",
        image: "",
        local_start: "",
        local_end: "",
        stream_url: "",
        station: "",
      },
    };
  },
  computed: {
    filteredBroadcasts() {
      if (!this.search) return this.broadcasts;
      const q = this.search.toLowerCase().trim();
      return this.broadcasts.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    },
    liveBroadcastsCount() {
      return this.broadcasts.filter((b) => b.status === "live").length;
    },
    scheduledBroadcastsCount() {
      return this.broadcasts.filter((b) => b.status === "scheduled").length;
    },
  },
  async mounted() {
    await this.fetchBroadcasts();
  },
  methods: {
    limaLocalToIso,
    isoToLimaLocal,
    formatLimaDate(iso) {
      if (!iso) return "-";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleString("es-PE", {
        timeZone: "America/Lima",
        dateStyle: "medium",
        timeStyle: "short",
      });
    },
    async fetchBroadcasts() {
      this.loadingList = true;
      try {
        const res = await api.broadcasts.GET();
        if (res.data && res.data.broadcasts) {
          this.broadcasts = res.data.broadcasts;
        } else if (res.data && res.data.error) {
          alert(res.data.msg || "Error al cargar encuentros");
        }
      } catch (err) {
        console.error("Error fetching broadcasts:", err);
        const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error desconocido";
        alert("Error al cargar encuentros: " + msg);
      } finally {
        this.loadingList = false;
      }
    },
    openModal(mode, broadcast = null) {
      this.modal.mode = mode;
      this.modal.active = true;
      if (mode === "edit" && broadcast) {
        this.modal.currentBroadcast = broadcast;
        this.form = {
          title: broadcast.title || "",
          author: broadcast.author || "Equipo SIFRAH",
          description: broadcast.description || "",
          image: broadcast.image || "",
          local_start: this.isoToLimaLocal(broadcast.scheduled_start),
          local_end: this.isoToLimaLocal(broadcast.scheduled_end),
          stream_url: broadcast.stream_url || "",
          station: broadcast.station || "",
        };
      } else {
        this.modal.currentBroadcast = null;
        this.resetForm();
      }
    },
    closeModal() {
      this.modal.active = false;
      this.modal.currentBroadcast = null;
      this.resetForm();
    },
    resetForm() {
      this.form = {
        title: "",
        author: "Equipo SIFRAH",
        description: "",
        image: "",
        local_start: "",
        local_end: "",
        stream_url: "",
        station: "",
      };
    },
    async handleImageUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const fileName = file.name;
      const mimeType = file.type || "image/jpeg";

      const blobUrl = URL.createObjectURL(file);
      try {
        this.uploadingImage = true;
        const response = await fetch(blobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const url = await lib.uploadBuffer(arrayBuffer, fileName, mimeType, "audios");
        this.form.image = url;
      } catch (err) {
        console.error("Error al subir portada:", err);
        alert("Error al subir portada: " + (err.message || "Error desconocido"));
      } finally {
        this.uploadingImage = false;
        URL.revokeObjectURL(blobUrl);
        if (e.target) e.target.value = "";
      }
    },
    async saveBroadcast() {
      if (!this.form.title || !this.form.title.trim()) {
        alert("El título es obligatorio");
        return;
      }
      if (this.uploadingImage) {
        alert("Espera a que termine la subida de la portada");
        return;
      }
      if (this.form.local_start && this.form.local_end) {
        const startIso = this.limaLocalToIso(this.form.local_start);
        const endIso = this.limaLocalToIso(this.form.local_end);
        if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
          alert("La fecha/hora de fin debe ser posterior a la de inicio");
          return;
        }
      }

      this.saving = true;
      try {
        const scheduled_start = this.limaLocalToIso(this.form.local_start);
        const scheduled_end = this.limaLocalToIso(this.form.local_end);

        const broadcastData = {
          title: this.form.title.trim(),
          author: (this.form.author && this.form.author.trim()) || "Equipo SIFRAH",
          description: (this.form.description && this.form.description.trim()) || "",
          image: this.form.image || "",
          scheduled_start: scheduled_start,
          scheduled_end: scheduled_end,
          timezone: "America/Lima",
          stream_url: (this.form.stream_url && this.form.stream_url.trim()) || "",
          station: (this.form.station && this.form.station.trim()) || "",
        };

        let payload;
        if (this.modal.mode === "add") {
          broadcastData.status = "scheduled";
          payload = {
            action: "add",
            data: broadcastData,
          };
        } else {
          if (this.modal.currentBroadcast && this.modal.currentBroadcast.status) {
            broadcastData.status = this.modal.currentBroadcast.status;
          }
          payload = {
            action: "edit",
            id: this.modal.currentBroadcast.id,
            data: broadcastData,
          };
        }

        const res = await api.broadcasts.POST(payload);
        if (res.data && res.data.error) {
          alert(res.data.msg || "Error al guardar el encuentro");
          return;
        }

        await this.fetchBroadcasts();
        this.closeModal();
      } catch (err) {
        console.error("Error saving broadcast:", err);
        const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error al guardar";
        alert("Error al guardar: " + msg);
      } finally {
        this.saving = false;
      }
    },
    async setLive(broadcast) {
      const otherLive = this.broadcasts.find(
        (b) => b.status === "live" && b.id !== broadcast.id
      );

      if (otherLive) {
        const ok = confirm(
          `Ya hay un encuentro en vivo ("${otherLive.title}"). Se marcará como finalizado para poner en vivo este. ¿Deseas continuar?`
        );
        if (!ok) return;

        try {
          const resEnd = await api.broadcasts.POST({
            action: "setStatus",
            id: otherLive.id,
            status: "ended",
          });
          if (resEnd.data && resEnd.data.error) {
            alert(resEnd.data.msg || "Error al finalizar el encuentro anterior");
            return;
          }
        } catch (err) {
          console.error("Error finalizing previous broadcast:", err);
          const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error de red";
          alert("Error al finalizar el encuentro anterior: " + msg);
          return;
        }
      }

      try {
        const res = await api.broadcasts.POST({
          action: "setStatus",
          id: broadcast.id,
          status: "live",
        });
        if (res.data && res.data.error) {
          alert(res.data.msg || "Error al poner en vivo");
          return;
        }
        await this.fetchBroadcasts();
      } catch (err) {
        console.error("Error setting broadcast live:", err);
        const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error desconocido";
        alert("Error al poner en vivo: " + msg);
      }
    },
    async endBroadcast(broadcast) {
      try {
        const res = await api.broadcasts.POST({
          action: "setStatus",
          id: broadcast.id,
          status: "ended",
        });
        if (res.data && res.data.error) {
          alert(res.data.msg || "Error al finalizar encuentro");
          return;
        }
        await this.fetchBroadcasts();
      } catch (err) {
        console.error("Error ending broadcast:", err);
        const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error desconocido";
        alert("Error al finalizar: " + msg);
      }
    },
    async cancelBroadcast(broadcast) {
      if (!confirm(`¿Estás seguro de cancelar el encuentro "${broadcast.title}"?`)) {
        return;
      }
      try {
        const res = await api.broadcasts.POST({
          action: "setStatus",
          id: broadcast.id,
          status: "cancelled",
        });
        if (res.data && res.data.error) {
          alert(res.data.msg || "Error al cancelar encuentro");
          return;
        }
        await this.fetchBroadcasts();
      } catch (err) {
        console.error("Error cancelling broadcast:", err);
        const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error desconocido";
        alert("Error al cancelar: " + msg);
      }
    },
    async deleteBroadcast(broadcast) {
      if (!confirm(`¿Estás seguro de eliminar el encuentro "${broadcast.title}"? Esta acción no se puede deshacer.`)) {
        return;
      }
      try {
        const res = await api.broadcasts.POST({
          action: "delete",
          id: broadcast.id,
        });
        if (res.data && res.data.error) {
          alert(res.data.msg || "Error al eliminar encuentro");
          return;
        }
        await this.fetchBroadcasts();
      } catch (err) {
        console.error("Error deleting broadcast:", err);
        const msg = (err && err.response && err.response.data && err.response.data.msg) || err.message || "Error desconocido";
        alert("Error al eliminar: " + msg);
      }
    },
  },
};
</script>

<style scoped>
.shadow-sm {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.border-bottom-light {
  border-bottom: 1px solid #f0f0f0 !important;
}

.border-top-light {
  border-top: 1px solid #f0f0f0 !important;
}

.table.is-vcentered td,
.table.is-vcentered th {
  vertical-align: middle !important;
}

.modal-card {
  max-width: 650px;
}

.search-input {
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02) !important;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #e91e63 !important;
  box-shadow: 0 4px 10px rgba(233, 30, 99, 0.1) !important;
}

.stat-divider {
  width: 1px;
  height: 25px;
  background-color: #f0f0f0;
}

.heading {
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-weight: 600;
}

.search-container {
  flex: 1;
  min-width: 280px;
  max-width: 480px;
}

.stats-container {
  padding-right: 0.75rem;
}

.truncate-url {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.broadcast-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #eaeaea;
}

.broadcast-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.broadcast-thumb.placeholder {
  color: #b5b5b5;
  font-size: 1.25rem;
}

.preview-figure {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #dbdbdb;
}

.preview-img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>
