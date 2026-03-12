<template>
  <Layout>
    <div class="materials-management">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando materiales...</p>
      </div>

      <!-- Main Content -->
      <section v-else class="materials-section">
        <div class="header">
          <div class="header-content">
            <div class="title-section">
              <h1 class="title">Gestión de Materiales</h1>
              <p class="subtitle">Administra los recursos descargables y enlaces útiles</p>
            </div>
            <div class="header-actions">
              <button class="add-button" @click="showAddModal = true">
                <i class="fas fa-plus"></i>
                <span>Nuevo Material</span>
              </button>
              <button class="refresh-button" @click="fetchMaterials" :disabled="refreshing">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="materials-grid">
          <div v-for="item in materials" :key="item._id" class="material-card">
            <div class="card-image">
              <img v-if="item.image" :src="item.image" :alt="item.title" />
              <div v-else class="no-image">
                <i class="fas fa-image"></i>
              </div>
            </div>
            <div class="card-body">
              <h3 class="item-title">{{ item.title }}</h3>
              <p class="item-desc">{{ item.description }}</p>
              <div class="item-link">
                <i class="fas fa-link"></i>
                <span class="truncate">{{ item.link }}</span>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn-edit" @click="editItem(item)">
                <i class="fas fa-edit"></i>
                Editar
              </button>
              <button class="btn-delete" @click="confirmDelete(item)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Add/Edit Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <header class="modal-header">
              <h3>{{ editMode ? 'Editar Material' : 'Nuevo Material' }}</h3>
              <button class="close-btn" @click="closeModal">
                <i class="fas fa-times"></i>
              </button>
            </header>
            <section class="modal-body">
              <div class="form-group">
                <label>Título</label>
                <input type="text" v-model="form.title" placeholder="Ej: Presentación de Negocio" />
              </div>
              <div class="form-group">
                <label>Descripción (Subtítulo)</label>
                <textarea v-model="form.description" placeholder="Breve descripción del recurso"></textarea>
              </div>
              <div class="form-group">
                <label>Imagen</label>
                <div class="image-upload-area">
                  <div v-if="form.image" class="preview-container">
                    <img :src="form.image" class="preview-img" />
                    <button class="remove-img" @click="form.image = ''">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <label v-else class="upload-label">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <span>Subir imagen</span>
                    <input type="file" @change="handleFileUpload" hidden accept="image/*" />
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>Enlace (URL de destino)</label>
                <input type="text" v-model="form.link" placeholder="https://..." />
              </div>
            </section>
            <footer class="modal-footer">
              <button class="btn-cancel" @click="closeModal">Cancelar</button>
              <button class="btn-primary" :disabled="saving" @click="saveMaterial">
                <span v-if="!saving">{{ editMode ? 'Guardar Cambios' : 'Crear Material' }}</span>
                <span v-else><i class="fas fa-spinner fa-spin"></i> Guardando...</span>
              </button>
            </footer>
          </div>
        </div>
      </section>

      <!-- Toast Component -->
      <Toast ref="toast" />
    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import Toast from "@/components/Toast.vue";
import api from "@/api";
import lib from "@/lib";

export default {
  name: "MaterialsManagement",
  components: {
    Layout,
    Toast,
  },
  data() {
    return {
      materials: [],
      loading: true,
      refreshing: false,
      saving: false,
      showModal: false,
      editMode: false,
      form: {
        _id: null,
        title: "",
        description: "",
        image: "",
        link: "",
      },
    };
  },
  computed: {
    showAddModal: {
      get() { return this.showModal && !this.editMode; },
      set(val) {
        if (val) {
          this.editMode = false;
          this.resetForm();
          this.showModal = true;
        } else {
          this.showModal = false;
        }
      }
    }
  },
  created() {
    this.fetchMaterials();
  },
  methods: {
    async fetchMaterials() {
      try {
        this.refreshing = true;
        const { data } = await api.materials.GET();
        this.materials = data.materials;
      } catch (error) {
        console.error("Error fetching materials:", error);
        this.$refs.toast.error("Error al cargar materiales");
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },
    resetForm() {
      this.form = {
        _id: null,
        title: "",
        description: "",
        image: "",
        link: "",
      };
    },
    closeModal() {
      this.showModal = false;
      this.resetForm();
    },
    editItem(item) {
      this.editMode = true;
      this.form = { ...item };
      this.showModal = true;
    },
    async handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      // Leer los datos ANTES de cualquier cambio reactivo
      let arrayBuffer;
      try {
        arrayBuffer = await file.arrayBuffer();
      } catch (readErr) {
        this.$refs.toast.error("No se pudo leer el archivo");
        return;
      }
      try {
        const img = await lib.uploadBuffer(arrayBuffer, file.name, file.type, "materials");
        this.form.image = img;
      } catch (error) {
        console.error("Error uploading image:", error);
        this.$refs.toast.error("Error al subir la imagen: " + (error.message || ''));
      }
    },
    async saveMaterial() {
      if (!this.form.title || !this.form.link) {
        this.$refs.toast.error("Título y Enlace son requeridos");
        return;
      }

      try {
        this.saving = true;
        const action = this.editMode ? 'update' : 'create';
        const id = this.form._id;
        
        // Clean data for API (exclude _id)
        const payload = { ...this.form };
        delete payload._id;

        await api.materials.POST({
          action,
          id,
          data: payload
        });

        this.$refs.toast.success(this.editMode ? "Material actualizado" : "Material creado");
        this.closeModal();
        this.fetchMaterials();
      } catch (error) {
        console.error("Error saving material:", error);
        this.$refs.toast.error("Error al guardar material");
      } finally {
        this.saving = false;
      }
    },
    async confirmDelete(item) {
      if (confirm(`¿Estás seguro de eliminar "${item.title}"?`)) {
        try {
          await api.materials.POST({
            action: 'delete',
            id: item._id
          });
          this.$refs.toast.success("Material eliminado");
          this.fetchMaterials();
        } catch (error) {
          console.error("Error deleting material:", error);
          this.$refs.toast.error("Error al eliminar material");
        }
      }
    }
  }
};
</script>

<style scoped>
.materials-management {
  min-height: 100vh;
  background: #f4f7f6;
  padding: 2rem 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #764ba2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.materials-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.header {
  margin-bottom: 3rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 1.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #636e72;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(118, 75, 162, 0.4);
}

.refresh-button {
  background: white;
  border: 1px solid #dfe6e9;
  color: #636e72;
  width: 45px;
  height: 45px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-button:hover {
  background: #f8f9fa;
  color: #764ba2;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.material-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.material-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.card-image {
  height: 160px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: 3rem;
  color: #dfe6e9;
}

.card-body {
  padding: 1.5rem;
  flex-grow: 1;
}

.item-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.item-desc {
  font-size: 0.95rem;
  color: #636e72;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.item-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #9b59b6;
  background: #f3e5f5;
  padding: 0.5rem;
  border-radius: 4px;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f2f6;
  display: flex;
  gap: 1rem;
}

.btn-edit {
  flex-grow: 1;
  background: #f8f9fa;
  border: 1px solid #dfe6e9;
  color: #2d3436;
  padding: 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-edit:hover {
  background: #e9ecef;
}

.btn-delete {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #e53e3e;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: #feb2b2;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.modal-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-weight: 700;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #a0aec0;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #4a5568;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: #764ba2;
}

.image-upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.upload-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #718096;
}

.upload-label i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 120px;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-img {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .materials-grid {
    grid-template-columns: 1fr;
  }
}
</style>
