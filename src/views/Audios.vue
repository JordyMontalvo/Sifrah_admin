<template>
  <Layout>
    <div class="container is-fluid py-5">
      <!-- Header -->
      <div class="level mb-5">
        <div class="level-left">
          <div>
            <h1 class="title is-3 has-text-weight-bold mb-3">Gestión de Audios</h1>
            <p class="is-size-6 has-text-grey mb-0">Sube y configura los audios para la aplicación móvil</p>
          </div>
        </div>
        <div class="level-right">
          <button class="button is-primary" @click="openModal('add')">
            <span class="icon">
              <i class="fas fa-plus"></i>
            </span>
            <span>Nuevo Audio</span>
          </button>
        </div>
      </div>

      <!-- Audios Table -->
      <div class="box p-0 shadow-sm">
        <!-- Box Header with Search & Stats -->
        <div class="py-5 px-4 is-flex is-flex-wrap-wrap is-justify-content-space-between is-align-items-center border-bottom-light box-header" style="width: 100%;">
          <div class="field mb-0 search-container">
            <p class="control has-icons-left">
              <input
                v-model="search"
                class="input is-rounded search-input"
                type="text"
                placeholder="Buscar audio..."
              />
              <span class="icon is-small is-left">
                <i class="fas fa-search"></i>
              </span>
            </p>
          </div>
          <div class="is-flex is-align-items-center stats-container">
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">Total</p>
              <p class="title is-5 mb-0">{{ audios.length }}</p>
            </div>
            <div class="stat-divider"></div>
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">Activos</p>
              <p class="title is-5 mb-0 has-text-success">{{ activeAudiosCount }}</p>
            </div>
          </div>
        </div>
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable is-vcentered">
            <thead>
              <tr>
                <th>Audio</th>
                <th>Categoría</th>
                <th>Autor</th>
                <th>Duración</th>
                <th>Estado</th>
                <th class="has-text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="audio in filteredAudios" :key="audio.id">
                <td>
                  <div>
                    <p class="has-text-weight-semibold">{{ audio.title }}</p>
                    <p class="is-size-7 has-text-grey truncate-100">{{ audio.url }}</p>
                  </div>
                </td>
                <td>
                  <span class="tag is-light is-medium">{{ audio.category }}</span>
                </td>
                <td>{{ audio.author }}</td>
                <td>{{ audio.duration }}</td>
                <td>
                  <span :class="['tag', audio.active ? 'is-success' : 'is-danger']">
                    {{ audio.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="has-text-right">
                  <div class="buttons is-right">
                    <button class="button is-small is-info is-light" @click="openModal('edit', audio)">
                      <span class="icon is-small">
                        <i class="fas fa-edit"></i>
                      </span>
                    </button>
                    <button class="button is-small is-danger is-light" @click="confirmDelete(audio)">
                      <span class="icon is-small">
                        <i class="fas fa-trash"></i>
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredAudios.length === 0">
                <td colspan="6" class="has-text-centered py-6">
                  <p class="has-text-grey">No se encontraron audios.</p>
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
            <p class="modal-card-title">{{ modal.mode === 'add' ? 'Añadir Nuevo Audio' : 'Editar Audio' }}</p>
            <button class="delete" aria-label="close" @click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="columns is-multiline">
              <div class="column is-12">
                <div class="field">
                  <label class="label">Título</label>
                  <div class="control">
                    <input v-model="form.title" class="input" type="text" placeholder="Ej: Cómo prospectar con éxito" required />
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field">
                  <label class="label">Autor</label>
                  <div class="control">
                    <input v-model="form.author" class="input" type="text" placeholder="Ej: Equipo SIFRAH" />
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field">
                  <label class="label">Categoría</label>
                  <div class="control is-flex">
                    <div class="select is-fullwidth">
                      <select v-model="form.category">
                        <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
                      </select>
                    </div>
                    <button class="button is-info is-light ml-2" @click.prevent="openCategoryModal">
                      <span class="icon is-small">
                        <i class="fas fa-cog"></i>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field">
                  <label class="label">Método de Carga</label>
                  <div class="control">
                    <label class="radio">
                      <input type="radio" value="url" v-model="uploadType">
                      URL Directa
                    </label>
                    <label class="radio ml-3">
                      <input type="radio" value="file" v-model="uploadType">
                      Subir Archivo
                    </label>
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field" v-if="uploadType === 'url'">
                  <label class="label">Audio URL (CDN/S3)</label>
                  <div class="control">
                    <input v-model="form.url" class="input" type="text" placeholder="https://..." required />
                  </div>
                </div>
                <div class="field" v-else>
                  <label class="label">Subir MP3</label>
                  <div class="control">
                    <div class="file has-name is-fullwidth">
                      <label class="file-label">
                        <input class="file-input" type="file" @change="handleAudioUpload" accept="audio/mpeg" :disabled="uploadingAudio">
                        <span class="file-cta">
                          <span class="file-icon">
                            <i class="fas" :class="uploadingAudio ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
                          </span>
                          <span class="file-label">
                            {{ uploadingAudio ? 'Subiendo...' : 'Seleccionar archivo' }}
                          </span>
                        </span>
                        <span class="file-name" v-if="form.url">
                          {{ form.url.split('/').pop() }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field">
                  <label class="label">Duración (Auto)</label>
                  <div class="control has-icons-left">
                    <input v-model="form.duration" class="input" type="text" placeholder="--:--" readonly />
                    <span class="icon is-small is-left">
                      <i class="fas" :class="detectingDuration ? 'fa-spinner fa-spin' : 'fa-clock'"></i>
                    </span>
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field mt-5">
                  <label class="checkbox">
                    <input v-model="form.active" type="checkbox" />
                    Audio Activo
                  </label>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot has-background-white border-top-light is-justify-content-flex-end">
            <button class="button" @click="closeModal">Cancelar</button>
            <button class="button is-primary" :class="{ 'is-loading': loading }" @click="saveAudio">
              {{ modal.mode === 'add' ? 'Crear' : 'Guardar Cambios' }}
            </button>
          </footer>
        </div>
      </div>

      <!-- Categories Management Modal -->
      <div :class="['modal', { 'is-active': categoryModal.active }]" style="z-index: 50;">
        <div class="modal-background" @click="closeCategoryModal"></div>
        <div class="modal-card category-modal">
          <header class="modal-card-head has-background-white border-bottom-light py-4">
            <p class="modal-card-title is-size-5 has-text-weight-bold mb-0">Configuración de Categorías</p>
            <button class="delete" aria-label="close" @click="closeCategoryModal"></button>
          </header>
          <section class="modal-card-body p-5">
            <div class="field mb-5">
              <label class="label is-small has-text-grey">AÑADIR NUEVA</label>
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input v-model="newCategoryName" class="input category-input" type="text" placeholder="Ej: Entrenamiento VIP" @keyup.enter="saveCategory" :disabled="savingCategory" />
                </div>
                <div class="control">
                  <button class="button is-primary px-5" @click="saveCategory" :class="{'is-loading': savingCategory}" :disabled="!newCategoryName.trim()">
                    <span class="icon is-small mr-1">
                      <i class="fas fa-plus"></i>
                    </span>
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="categories-list-wrapper">
              <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <p class="label is-small has-text-grey mb-0">CATEGORÍAS ACTUALES</p>
                <span class="tag is-light is-rounded">{{ customCategories.length }}</span>
              </div>
              
              <div class="categories-list">
                <div v-if="customCategories.length === 0" class="has-text-centered py-5 has-background-light is-rounded-8">
                  <span class="icon is-large has-text-grey-light mb-2">
                    <i class="fas fa-folder-open fa-2x"></i>
                  </span>
                  <p class="has-text-grey is-size-6">Aún no hay categorías</p>
                  <p class="has-text-grey-light is-size-7">Añade la primera categoría arriba.</p>
                </div>
                
                <div v-else class="category-item is-flex is-justify-content-space-between is-align-items-center" v-for="cat in customCategories" :key="cat.id">
                  <div class="is-flex is-align-items-center">
                    <span class="icon has-text-primary mr-2">
                      <i class="fas fa-tag"></i>
                    </span>
                    <span class="has-text-weight-medium">{{ cat.name }}</span>
                  </div>
                  <button class="button is-small is-ghost has-text-danger category-delete-btn" @click="deleteCategory(cat)" title="Eliminar categoría">
                    <span class="icon is-small">
                      <i class="far fa-trash-alt"></i>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "./Layout.vue";
import api from "@/api";
import lib from "@/lib";

export default {
  components: { Layout },
  data() {
    return {
      audios: [],
      search: "",
      loading: false,
      defaultImage: "https://api.sifrah.com/uploads/audios/default.png",
      customCategories: [],
      modal: {
        active: false,
        mode: "add",
        currentAudio: null,
      },
      categoryModal: {
        active: false,
      },
      newCategoryName: "",
      savingCategory: false,
      form: {
        title: "",
        author: "Equipo SIFRAH",
        category: "Bienvenida",
        duration: "00:00",
        url: "",
        image: "",
        active: true,
      },
      uploadType: 'url',
      uploadingAudio: false,
      detectingDuration: false,
    };
  },
  watch: {
    'form.url': function(newUrl) {
      if (newUrl && (newUrl.startsWith('http') || newUrl.startsWith('https'))) {
        this.getAudioDuration(newUrl);
      }
    }
  },
  computed: {
    filteredAudios() {
      if (!this.search) return this.audios;
      const q = this.search.toLowerCase();
      return this.audios.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    },
    activeAudiosCount() {
      return this.audios.filter(a => a.active).length;
    },
    allCategories() {
      return this.customCategories.map(c => c.name);
    }
  },
  async mounted() {
    this.fetchAudios();
    this.fetchCategories();
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await api.audioCategories.GET();
        if (res.data && res.data.categories) {
           this.customCategories = res.data.categories;
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    },
    async fetchAudios() {
      try {
        const res = await api.audios.GET();
        if (res.data && res.data.audios) {
          this.audios = res.data.audios;
        }
      } catch (err) {
        console.error("Error fetching audios:", err);
      }
    },
    async handleAudioUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name;
      const mimeType = file.type;

      // URL.createObjectURL crea una referencia permanente al archivo en memoria.
      // Es inmune a re-renders de Vue, disabled del input, y yields del event loop.
      const blobUrl = URL.createObjectURL(file);
      console.log(`[Audios] Created blob URL for: ${fileName} (${file.size} bytes)`);

      try {
        this.uploadingAudio = true;

        // Leer desde la blob URL — no depende del input ni del evento original
        const response = await fetch(blobUrl);
        const arrayBuffer = await response.arrayBuffer();
        console.log(`[Audios] Blob read OK: ${arrayBuffer.byteLength} bytes`);

        const url = await lib.uploadBuffer(arrayBuffer, fileName, mimeType, "audios");
        this.form.url = url;
      } catch (err) {
        console.error("Error al subir audio:", err);
        alert("Error al subir MP3: " + (err.message || 'Error desconocido'));
      } finally {
        this.uploadingAudio = false;
        URL.revokeObjectURL(blobUrl); // Limpiar memoria
      }
    },
    getAudioDuration(url) {
      if (!url) return;
      this.detectingDuration = true;
      const audio = new Audio();
      audio.src = url;
      audio.addEventListener('loadedmetadata', () => {
        const seconds = Math.floor(audio.duration);
        const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
        const ss = (seconds % 60).toString().padStart(2, '0');
        this.form.duration = `${mm}:${ss}`;
        this.detectingDuration = false;
      });
      audio.addEventListener('error', () => {
        this.detectingDuration = false;
        console.error("Error detecting duration for URL:", url);
      });
    },
    openModal(mode, audio = null) {
      this.modal.mode = mode;
      this.modal.active = true;
      this.uploadType = 'url';
      if (mode === "edit" && audio) {
        this.modal.currentAudio = audio;
        this.form = { ...audio };
      } else {
        this.resetForm();
      }
    },
    closeModal() {
      this.modal.active = false;
      this.modal.currentAudio = null;
      this.resetForm();
    },
    openCategoryModal() {
      this.modal.active = false;
      this.categoryModal.active = true;
      this.fetchCategories();
    },
    closeCategoryModal() {
      this.categoryModal.active = false;
      this.newCategoryName = "";
      this.modal.active = true;
    },
    async saveCategory() {
      if (!this.newCategoryName.trim()) return;
      this.savingCategory = true;
      try {
        await api.audioCategories.POST({
           action: "add",
           data: { name: this.newCategoryName.trim() }
        });
        this.newCategoryName = "";
        await this.fetchCategories();
      } catch (err) {
        console.error("Error saving category:", err);
        alert("Error al guardar la categoría");
      } finally {
        this.savingCategory = false;
      }
    },
    async deleteCategory(cat) {
      if (confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
        try {
          await api.audioCategories.DELETE({ id: cat.id });
          await this.fetchCategories();
        } catch (err) {
          console.error("Error deleting category:", err);
          alert("Error al eliminar la categoría");
        }
      }
    },
    resetForm() {
      this.form = {
        title: "",
        author: "Equipo SIFRAH",
        category: "Bienvenida",
        duration: "00:00",
        url: "",
        image: "",
        active: true,
      };
    },
    async saveAudio() {
      if (!this.form.title || !this.form.url) {
        alert("Título y URL son obligatorios");
        return;
      }
      if (this.uploadingAudio) {
        alert("Espera a que termine la subida del audio");
        return;
      }
      this.loading = true;
      try {
        const payload = {
          action: this.modal.mode,
          id: this.modal.mode === "edit" ? this.modal.currentAudio.id : null,
          data: this.form
        };
        await api.audios.POST(payload);
        this.fetchAudios();
        this.closeModal();
      } catch (err) {
        console.error("Error saving audio:", err);
        alert("Error al guardar el audio");
      } finally {
        this.loading = false;
      }
    },
    async confirmDelete(audio) {
      if (confirm(`¿Estás seguro de eliminar el audio "${audio.title}"?`)) {
        try {
          await api.audios.POST({ action: "delete", id: audio.id });
          this.fetchAudios();
        } catch (err) {
          console.error("Error deleting audio:", err);
          alert("Error al eliminar el audio");
        }
      }
    }
  },
};
</script>

<style scoped>
.shadow-sm {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
}
.is-rounded-8 {
  border-radius: 8px;
}
.border-bottom-light {
  border-bottom: 1px solid #f0f0f0 !important;
}
.border-top-light {
  border-top: 1px solid #f0f0f0 !important;
}
.truncate-100 {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.table.is-vcentered td, .table.is-vcentered th {
  vertical-align: middle !important;
}

/* Fix double box in Bulma Select caused by global styles */
div.select {
  padding: 0 !important;
  border: none !important;
}

div.select select {
  height: 2.5em;
  padding: 0.5em 1em;
  border: 1px solid #d1d5db !important;
  border-radius: 6px !important;
  width: 100%;
}

.modal-card {
  max-width: 600px;
}

.search-input {
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02) !important;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #E91E63 !important;
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
  min-width: 300px;
  max-width: 480px;
}

.stats-container {
  padding-right: 0.75rem;
}

@media screen and (max-width: 768px) {
  .box-header {
    flex-direction: column !important;
    align-items: center !important;
    padding: 1.5rem 1rem !important;
  }

  .table-container {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  .table-container table {
    min-width: 800px !important;
  }

  .search-container {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 1.5rem !important;
  }
  
  .stats-container {
    width: 100% !important;
    justify-content: center !important;
    padding-right: 0 !important;
  }
}

/* Category Modal Styles */
.category-modal {
  max-width: 450px !important;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.category-input {
  box-shadow: none !important;
  border-color: #dbdbdb;
  transition: all 0.3s ease;
}

.category-input:focus {
  border-color: #E91E63;
}

.categories-list-wrapper {
  background-color: #fcfcfc;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  padding: 1rem;
}

.categories-list {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 5px;
}

/* Custom Scrollbar for list */
.categories-list::-webkit-scrollbar {
  width: 6px;
}
.categories-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.categories-list::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 4px;
}
.categories-list::-webkit-scrollbar-thumb:hover {
  background: #c1c1c1;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #eaeaea;
  transition: all 0.2s ease;
}

.category-item:hover {
  border-color: #d0d0d0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transform: translateY(-1px);
}

.category-item:last-child {
  margin-bottom: 0;
}

.category-delete-btn {
  opacity: 0.5;
  transition: all 0.2s;
  height: 28px;
  width: 28px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
}

.category-item:hover .category-delete-btn {
  opacity: 1;
}

.category-delete-btn:hover {
  background-color: #fee2e2 !important;
  color: #ef4444 !important;
}
</style>
