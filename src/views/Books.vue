<template>
  <Layout>
    <div class="container is-fluid py-5">
      <!-- Header -->
      <div class="level mb-5">
        <div class="level-left">
          <div>
            <h1 class="title is-3 has-text-weight-bold mb-3">Gestión de Libros</h1>
            <p class="is-size-6 has-text-grey mb-0">Configura el catálogo de libros y PDFs</p>
          </div>
        </div>
        <div class="level-right">
          <button class="button is-light mr-2" @click="openSettingsModal">
            <span class="icon">
              <i class="fas fa-cog"></i>
            </span>
            <span>Ajustes</span>
          </button>
          <button class="button is-primary" @click="openModal('add')">
            <span class="icon">
              <i class="fas fa-plus"></i>
            </span>
            <span>Nuevo Libro</span>
          </button>
        </div>
      </div>

      <!-- Books Table -->
      <div class="box p-0 shadow-sm">
        <div class="py-5 px-4 is-flex is-flex-wrap-wrap is-justify-content-space-between is-align-items-center border-bottom-light" style="width: 100%;">
          <div class="field mb-0" style="min-width: 250px;">
            <p class="control has-icons-left">
              <input
                v-model="search"
                class="input is-rounded"
                type="text"
                placeholder="Buscar libro..."
              />
              <span class="icon is-small is-left">
                <i class="fas fa-search"></i>
              </span>
            </p>
          </div>
          <div class="is-flex is-align-items-center">
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">Total</p>
              <p class="title is-5 mb-0">{{ books.length }}</p>
            </div>
            <div style="height: 30px; width: 1px; background-color: #eee;"></div>
            <div class="has-text-centered px-4">
              <p class="heading has-text-grey mb-1">Activos</p>
              <p class="title is-5 mb-0 has-text-success">{{ activeBooksCount }}</p>
            </div>
          </div>
        </div>
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable is-vcentered">
            <thead>
              <tr>
                <th>Libro</th>
                <th>Categoría</th>
                <th>Autor</th>
                <th>Páginas</th>
                <th>Calif.</th>
                <th>Estado</th>
                <th class="has-text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in filteredBooks" :key="book.id">
                <td>
                  <div class="is-flex is-align-items-center">
                    <figure class="image is-32x32 mr-3" style="flex-shrink: 0;" v-if="book.image">
                      <img :src="book.image" style="object-fit: cover; border-radius: 4px; height: 100%;">
                    </figure>
                    <div>
                      <p class="has-text-weight-semibold">{{ book.title }}</p>
                      <p class="is-size-7 has-text-grey" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ book.url }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="tag is-light is-medium">{{ book.category }}</span>
                </td>
                <td>{{ book.author }}</td>
                <td>{{ book.pages }}</td>
                <td>{{ book.rating }} <i class="fas fa-star has-text-warning is-size-7"></i></td>
                <td>
                  <span :class="['tag', book.active ? 'is-success' : 'is-danger']">
                    {{ book.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="has-text-right">
                  <div class="buttons is-right">
                    <button class="button is-small is-info is-light" @click="openModal('edit', book)">
                      <span class="icon is-small">
                        <i class="fas fa-edit"></i>
                      </span>
                    </button>
                    <button class="button is-small is-danger is-light" @click="confirmDelete(book)">
                      <span class="icon is-small">
                        <i class="fas fa-trash"></i>
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredBooks.length === 0">
                <td colspan="7" class="has-text-centered py-6">
                  <p class="has-text-grey">No se encontraron libros.</p>
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
            <p class="modal-card-title">{{ modal.mode === 'add' ? 'Añadir Nuevo Libro' : 'Editar Libro' }}</p>
            <button class="delete" aria-label="close" @click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="columns is-multiline">
              <div class="column is-12">
                <div class="field">
                  <label class="label">Título</label>
                  <div class="control">
                    <input v-model="form.title" class="input" type="text" placeholder="Título del libro" required />
                  </div>
                </div>
              </div>
              <div class="column is-6">
                <div class="field">
                  <label class="label">Autor</label>
                  <div class="control">
                    <input v-model="form.author" class="input" type="text" placeholder="Ej: Robert Kiyosaki" />
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
                  <label class="label">Archivo PDF (Subir a Bunny Net)</label>
                  <div class="control">
                    <div class="file has-name is-fullwidth">
                      <label class="file-label">
                        <input class="file-input" type="file" @change="handlePdfUpload" accept=".pdf" :disabled="uploadingPdf">
                        <span class="file-cta">
                          <span class="file-icon">
                            <i class="fas" :class="uploadingPdf ? 'fa-spinner fa-spin' : 'fa-file-pdf'"></i>
                          </span>
                          <span class="file-label">
                            {{ uploadingPdf ? 'Subiendo...' : 'PDF' }}
                          </span>
                        </span>
                        <span class="file-name" v-if="form.pdfUrl">
                          {{ form.pdfUrl.split('/').pop() }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="column is-6">
                <div class="field">
                  <label class="label">O link directo al PDF / Drive</label>
                  <div class="control">
                    <input v-model="form.pdfUrl" class="input" type="text" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div class="column is-6">
                <div class="field">
                  <label class="label">Portada (Imagen) - Requerido</label>
                  <div class="control">
                    <div class="file has-name is-fullwidth">
                      <label class="file-label">
                        <input class="file-input" type="file" @change="handleImageUpload" accept="image/*" :disabled="uploadingImage">
                        <span class="file-cta">
                          <span class="file-icon">
                            <i class="fas" :class="uploadingImage ? 'fa-spinner fa-spin' : 'fa-image'"></i>
                          </span>
                          <span class="file-label">
                            {{ uploadingImage ? 'Subiendo...' : 'Elegir' }}
                          </span>
                        </span>
                        <span class="file-name" v-if="form.image">
                          {{ form.image.split('/').pop() }}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="column is-6">
                <div class="field">
                  <label class="label">Páginas</label>
                  <div class="control has-icons-left">
                    <input v-model="form.pages" class="input" type="number" placeholder="Ej: 300" />
                    <span class="icon is-small is-left">
                      <i class="fas fa-file-alt"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div class="column is-6">
                <div class="field">
                  <label class="label">Calificación (1-5)</label>
                  <div class="control has-icons-left">
                    <input v-model="form.rating" class="input" type="number" min="1" max="5" placeholder="5" />
                    <span class="icon is-small is-left">
                      <i class="fas fa-star"></i>
                    </span>
                  </div>
                </div>
              </div>

              <div class="column is-12">
                <div class="field mt-2">
                  <label class="checkbox">
                    <input v-model="form.active" type="checkbox" />
                    Libro Activo (Visible en la app)
                  </label>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot has-background-white border-top-light is-justify-content-flex-end">
            <button class="button" @click="closeModal">Cancelar</button>
            <button class="button is-primary" :class="{ 'is-loading': loading }" @click="saveBook" :disabled="!form.title || (!form.url && !form.pdfUrl) || uploadingImage || uploadingPdf">
              {{ modal.mode === 'add' ? 'Crear' : 'Guardar Cambios' }}
            </button>
          </footer>
        </div>
      </div>

      <!-- Settings Modal -->
      <div :class="['modal', { 'is-active': settingsModal.active }]">
        <div class="modal-background" @click="closeSettingsModal"></div>
        <div class="modal-card">
          <header class="modal-card-head has-background-white">
            <p class="modal-card-title">Ajustes de la Sección Libros</p>
            <button class="delete" aria-label="close" @click="closeSettingsModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Subtítulo de la sección (App)</label>
              <div class="control">
                <input v-model="settings.subtitle" class="input" type="text" placeholder="Ej: Lee y aprende sin límites" />
              </div>
              <p class="help">Esta frase aparecerá justo debajo del título "Libros" en la aplicación.</p>
            </div>
          </section>
          <footer class="modal-card-foot has-background-white is-justify-content-flex-end">
            <button class="button" @click="closeSettingsModal">Cancelar</button>
            <button class="button is-primary" :class="{ 'is-loading': savingSettings }" @click="saveSettings">
              Guardar Ajustes
            </button>
          </footer>
        </div>
      </div>

      <!-- Categories Management Modal -->
      <div :class="['modal', { 'is-active': categoryModal.active }]" style="z-index: 50;">
        <div class="modal-background" @click="closeCategoryModal"></div>
        <div class="modal-card">
          <header class="modal-card-head py-4">
            <p class="modal-card-title is-size-5 has-text-weight-bold mb-0">Categorías de Libros</p>
            <button class="delete" aria-label="close" @click="closeCategoryModal"></button>
          </header>
          <section class="modal-card-body p-5">
            <div class="field mb-5">
              <label class="label is-small has-text-grey">AÑADIR NUEVA</label>
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input v-model="newCategoryName" class="input" type="text" placeholder="Ej: Liderazgo" @keyup.enter="saveCategory" :disabled="savingCategory" />
                </div>
                <div class="control">
                  <button class="button is-primary px-5" @click="saveCategory" :class="{'is-loading': savingCategory}" :disabled="!newCategoryName.trim()">
                    Añadir
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
                <div v-if="customCategories.length === 0" class="has-text-centered py-5 has-background-light" style="border-radius: 8px;">
                  <p class="has-text-grey is-size-6">Aún no hay categorías</p>
                </div>
                
                <div v-else class="mb-2 p-2" style="background:#f9f9f9; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;" v-for="cat in customCategories" :key="cat.id">
                  <div class="is-flex is-align-items-center">
                    <span class="icon has-text-primary mr-2">
                      <i class="fas fa-tag"></i>
                    </span>
                    <span class="has-text-weight-medium">{{ cat.name }}</span>
                  </div>
                  <button class="button is-small is-ghost has-text-danger" @click="deleteCategory(cat)" title="Eliminar categoría">
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
      books: [],
      search: "",
      loading: false,
      customCategories: [],
      modal: {
        active: false,
        mode: "add",
        currentBook: null,
      },
      categoryModal: {
        active: false,
      },
      newCategoryName: "",
      savingCategory: false,
      form: {
        title: "",
        author: "Equipo SIFRAH",
        category: "Educación",
        pages: "100",
        rating: 5,
        url: "",
        pdfUrl: "",
        image: "",
        active: true,
      },
      uploadingImage: false,
      uploadingPdf: false,
      settingsModal: {
        active: false,
      },
      settings: {
        subtitle: "Lee y aprende sin límites",
      },
      savingSettings: false,
    };
  },
  computed: {
    filteredBooks() {
      if (!this.search) return this.books;
      const q = this.search.toLowerCase();
      return this.books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    },
    activeBooksCount() {
      return this.books.filter(b => b.active).length;
    },
    allCategories() {
      return this.customCategories.map(c => c.name);
    }
  },
  async mounted() {
    this.fetchBooks();
    this.fetchCategories();
    this.fetchSettings();
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await api.bookCategories.GET();
        if (res.data && res.data.categories) {
           this.customCategories = res.data.categories;
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    },
    async fetchBooks() {
      try {
        const res = await api.books.GET();
        if (res.data && res.data.books) {
          this.books = res.data.books;
        }
      } catch (err) {
        console.error("Error fetching books:", err);
      }
    },
    async fetchSettings() {
      try {
        const res = await api.books.GET_CONFIG(); // We need to add this to api.js
        if (res.data && res.data.config) {
          this.settings.subtitle = res.data.config.subtitle || "Lee y aprende sin límites";
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    },
    async handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name;
      const mimeType = file.type;

      const blobUrl = URL.createObjectURL(file);

      try {
        this.uploadingImage = true;
        const response = await fetch(blobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const url = await lib.uploadBuffer(arrayBuffer, fileName, mimeType, "books");
        this.form.image = url;
      } catch (err) {
        console.error("Error al subir imagen:", err);
        alert("Error al subir imagen: " + (err.message || 'Error desconocido'));
      } finally {
        this.uploadingImage = false;
        URL.revokeObjectURL(blobUrl);
      }
    },
    async handlePdfUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF válido');
        return;
      }

      const fileName = file.name;
      const mimeType = file.type;
      const blobUrl = URL.createObjectURL(file);

      try {
        this.uploadingPdf = true;
        const response = await fetch(blobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const url = await lib.uploadBuffer(arrayBuffer, fileName, mimeType, "books_pdf");
        this.form.pdfUrl = url;
        // Also set legacy url if empty for backward compatibility
        if(!this.form.url) this.form.url = url; 
      } catch (err) {
        console.error("Error al subir PDF:", err);
        alert("Error al subir PDF: " + (err.message || 'Error desconocido'));
      } finally {
        this.uploadingPdf = false;
        URL.revokeObjectURL(blobUrl);
      }
    },
    openModal(mode, book = null) {
      this.modal.mode = mode;
      
      if (mode === 'edit' && book) {
        this.modal.currentBook = book;
        this.form = {
          title: book.title || '',
          author: book.author || '',
          category: book.category || (this.allCategories.length ? this.allCategories[0] : ''),
          pages: book.pages || '100',
          rating: book.rating || 5,
          url: book.url || '',
          pdfUrl: book.pdfUrl || book.url || '',
          image: book.image || '',
          active: book.active !== undefined ? book.active : true,
        };
      } else {
        this.modal.currentBook = null;
        this.form = {
          title: "",
          author: "Equipo SIFRAH",
          category: this.allCategories.length ? this.allCategories[0] : "Educación",
          pages: "100",
          rating: 5,
          url: "",
          pdfUrl: "",
          image: "",
          active: true,
        };
      }
      this.modal.active = true;
    },
    closeModal() {
      if(this.loading) return;
      this.modal.active = false;
      this.modal.currentBook = null;
    },
    async saveBook() {
      if (!this.form.title || (!this.form.url && !this.form.pdfUrl)) {
        return;
      }

      try {
        this.loading = true;
        
        const payload = {
          action: this.modal.mode,
          data: { ...this.form }
        };

        if (this.modal.mode === 'edit') {
          payload.id = this.modal.currentBook.id || this.modal.currentBook._id;
        }

        const res = await api.books.POST(payload);
        
        if (res.data && !res.data.error) {
          this.closeModal();
          await this.fetchBooks();
        } else {
          alert('No se pudo guardar: ' + ((res.data && res.data.msg) || 'Error desconocido'));
        }
      } catch (err) {
        console.error("Error saving book:", err);
        alert('Ocurrió un error al guardar');
      } finally {
        this.loading = false;
      }
    },
    confirmDelete(book) {
      if (confirm(`¿Estás seguro de eliminar el libro "${book.title}"?`)) {
        this.deleteBook(book);
      }
    },
    async deleteBook(book) {
      try {
        const id = book.id || book._id;
        const res = await api.books.DELETE({ id });
        
        if (res.data && !res.data.error) {
          await this.fetchBooks();
        } else {
          alert('Error al eliminar');
        }
      } catch (err) {
        console.error("Error deleting book:", err);
      }
    },
    openCategoryModal() {
      this.categoryModal.active = true;
      this.modal.active = false; // Hide main modal temporarily
    },
    closeCategoryModal() {
      this.categoryModal.active = false;
      this.newCategoryName = "";
      if (this.modal.mode) {
         this.modal.active = true; // Show main modal again
         if(this.allCategories.length > 0 && !this.allCategories.includes(this.form.category)) {
            this.form.category = this.allCategories[this.allCategories.length - 1]; // Select newest
         }
      }
    },
    async saveCategory() {
      if (!this.newCategoryName.trim()) return;
      
      try {
        this.savingCategory = true;
        const payload = {
          action: "add",
          data: { name: this.newCategoryName.trim() }
        };
        
        const res = await api.bookCategories.POST(payload);
        
        if (res.data && !res.data.error) {
          this.newCategoryName = "";
          await this.fetchCategories();
        }
      } catch (err) {
        console.error("Error adding category:", err);
      } finally {
        this.savingCategory = false;
      }
    },
    async deleteCategory(cat) {
      if (!confirm(`¿Eliminar la categoría "${cat.name}"? Los libros usando esta categoría no se eliminarán pero podrían quedar sin categoría si se editan.`)) {
        return;
      }
      
      try {
        const id = cat.id || cat._id;
        const res = await api.bookCategories.DELETE({ id });
        
        if (res.data && !res.data.error) {
          await this.fetchCategories();
        }
      } catch (err) {
        console.error("Error deleting category:", err);
      }
    },
    openSettingsModal() {
      this.settingsModal.active = true;
    },
    closeSettingsModal() {
      if(this.savingSettings) return;
      this.settingsModal.active = false;
    },
    async saveSettings() {
      try {
        this.savingSettings = true;
        const res = await api.books.POST_CONFIG({ subtitle: this.settings.subtitle });
        if (res.data && !res.data.error) {
          this.closeSettingsModal();
        } else {
          alert('Error al guardar ajustes');
        }
      } catch (err) {
        console.error("Error saving settings:", err);
        alert('Ocurrió un error');
      } finally {
        this.savingSettings = false;
      }
    }
  }
};
</script>

<style scoped>
.border-bottom-light { border-bottom: 1px solid #f0f0f0; }
.border-top-light { border-top: 1px solid #f0f0f0; }
.shadow-sm { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
</style>
