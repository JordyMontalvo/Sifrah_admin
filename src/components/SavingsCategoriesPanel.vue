<template>
  <div class="savings-categories-panel">
    <div class="panel-toolbar">
      <p class="panel-desc">
        Organiza el catálogo de canje con categorías, íconos y visibilidad.
      </p>
      <button class="button is-success" @click="openAddModal">
        <span class="icon"><i class="fas fa-plus"></i></span>
        <span>Nueva categoría</span>
      </button>
    </div>

    <div class="stats-grid">
      <DashboardCard
        :value="categories.length"
        label="Total categorías"
        icon="fas fa-folder"
        color="primary"
        description="Registradas en el sistema"
      />
      <DashboardCard
        :value="activeCount"
        label="Activas"
        icon="fas fa-check-circle"
        color="success"
        description="Visibles y habilitadas"
      />
      <DashboardCard
        :value="hiddenCount"
        label="Ocultas"
        icon="fas fa-eye-slash"
        color="warning"
        description="Sin eliminar del sistema"
      />
    </div>

    <div class="box table-box">
      <table class="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Ícono</th>
            <th>Nombre</th>
            <th>Productos</th>
            <th>Activa</th>
            <th>Oculta</th>
            <th class="has-text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="has-text-centered">Cargando...</td>
          </tr>
          <tr v-else-if="!categories.length">
            <td colspan="7" class="has-text-centered has-text-grey">
              No hay categorías. Crea la primera para organizar productos del Bono Ahorro.
            </td>
          </tr>
          <tr v-for="cat in sortedCategories" :key="cat.id">
            <td>{{ cat.order }}</td>
            <td>
              <span class="icon-preview" :style="{ backgroundColor: cat.color || '#f1f2f6' }">
                <i :class="cat.icon || 'fas fa-tag'"></i>
              </span>
            </td>
            <td>
              <strong>{{ cat.name }}</strong>
              <br />
              <span class="is-size-7 has-text-grey">{{ cat.icon }}</span>
            </td>
            <td>
              <span class="tag is-info is-light">{{ cat.product_count || 0 }}</span>
            </td>
            <td>
              <label class="checkbox">
                <input
                  type="checkbox"
                  :checked="cat.active !== false"
                  @change="toggleActive(cat, $event)"
                />
              </label>
            </td>
            <td>
              <label class="checkbox">
                <input
                  type="checkbox"
                  :checked="cat.hidden === true"
                  @change="toggleHidden(cat, $event)"
                />
              </label>
            </td>
            <td class="has-text-right">
              <button class="button is-small is-info" @click="openEditModal(cat)">
                <span class="icon"><i class="fas fa-edit"></i></span>
              </button>
              <button
                class="button is-small is-danger"
                @click="deleteCategory(cat)"
                :disabled="cat.product_count > 0"
                :title="cat.product_count > 0 ? 'Reasigne los productos antes de eliminar' : 'Eliminar'"
              >
                <span class="icon"><i class="fas fa-trash"></i></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal" :class="{ 'is-active': showModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            {{ editingId ? "Editar categoría" : "Nueva categoría" }}
          </p>
          <button class="delete" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Nombre <span class="has-text-danger">*</span></label>
            <div class="control">
              <input class="input" v-model="form.name" placeholder="Ej: Electrodomésticos" />
            </div>
          </div>

          <div class="field">
            <label class="label">Ícono (Font Awesome)</label>
            <div class="control has-icons-left">
              <input class="input" v-model="form.icon" placeholder="fas fa-home" />
              <span class="icon is-left">
                <i :class="form.icon || 'fas fa-tag'"></i>
              </span>
            </div>
            <p class="help">
              Ejemplos: fas fa-home, fas fa-tools, fas fa-laptop, fas fa-heart
            </p>
          </div>

          <div class="field">
            <label class="label">Color de fondo (UI tienda)</label>
            <div class="control is-flex" style="gap: 12px; align-items: center;">
              <input class="input" type="color" v-model="form.color" style="width: 64px; padding: 4px;" />
              <input class="input" v-model="form.color" placeholder="#f1f2f6" />
            </div>
          </div>

          <div class="field">
            <label class="label">Orden</label>
            <div class="control">
              <input class="input" type="number" v-model.number="form.order" min="0" />
            </div>
            <p class="help">Menor número = aparece primero en la tienda</p>
          </div>

          <div class="field">
            <label class="checkbox">
              <input type="checkbox" v-model="form.active" />
              Categoría activa
            </label>
            <p class="help">Las inactivas no se muestran en la tienda Bono Ahorro</p>
          </div>

          <div class="field">
            <label class="checkbox">
              <input type="checkbox" v-model="form.hidden" />
              Ocultar categoría
            </label>
            <p class="help">Oculta sin eliminar; útil para pausar temporalmente</p>
          </div>

          <div class="preview-box">
            <p class="label">Vista previa</p>
            <div class="cat-preview">
              <div class="cat-icon-wrapper" :style="{ backgroundColor: form.color || '#f1f2f6' }">
                <i :class="form.icon || 'fas fa-tag'"></i>
              </div>
              <span>{{ form.name || "Nombre" }}</span>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" :class="{ 'is-loading': saving }" @click="saveCategory">
            Guardar
          </button>
          <button class="button" @click="closeModal">Cancelar</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardCard from "@/components/DashboardCard.vue";
import api from "@/api";
import Swal from "sweetalert2";

const emptyForm = () => ({
  name: "",
  icon: "fas fa-tag",
  color: "#f1f2f6",
  order: 0,
  active: true,
  hidden: false,
});

export default {
  components: { DashboardCard },
  data() {
    return {
      categories: [],
      loading: false,
      saving: false,
      showModal: false,
      editingId: null,
      form: emptyForm(),
    };
  },
  computed: {
    sortedCategories() {
      return [...this.categories].sort((a, b) => {
        const orderA = Number(a.order) || 0;
        const orderB = Number(b.order) || 0;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.name).localeCompare(String(b.name));
      });
    },
    activeCount() {
      return this.categories.filter((c) => c.active !== false && c.hidden !== true).length;
    },
    hiddenCount() {
      return this.categories.filter((c) => c.hidden === true).length;
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const { data } = await api.savingsCategories.GET();
        if (data.error) throw new Error(data.msg);
        this.categories = data.categories || [];
      } catch (e) {
        Swal.fire("Error", e.message || "No se pudieron cargar las categorías", "error");
      } finally {
        this.loading = false;
      }
    },
    openAddModal() {
      this.editingId = null;
      this.form = emptyForm();
      this.showModal = true;
    },
    openEditModal(cat) {
      this.editingId = cat.id;
      this.form = {
        name: cat.name || "",
        icon: cat.icon || "fas fa-tag",
        color: cat.color || "#f1f2f6",
        order: Number(cat.order) || 0,
        active: cat.active !== false,
        hidden: cat.hidden === true,
      };
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editingId = null;
      this.form = emptyForm();
    },
    async saveCategory() {
      if (!this.form.name || !String(this.form.name).trim()) {
        return Swal.fire("Error", "El nombre es obligatorio", "warning");
      }
      this.saving = true;
      try {
        const payload = {
          action: this.editingId ? "edit" : "add",
          id: this.editingId,
          data: { ...this.form },
        };
        const { data } = await api.savingsCategories.POST(payload);
        if (data.error) throw new Error(data.msg);
        Swal.fire({
          icon: "success",
          title: "Guardado",
          timer: 1500,
          showConfirmButton: false,
        });
        this.closeModal();
        await this.load();
      } catch (e) {
        Swal.fire("Error", e.message || "No se pudo guardar", "error");
      } finally {
        this.saving = false;
      }
    },
    async toggleActive(cat, event) {
      const active = event.target.checked;
      try {
        const { data } = await api.savingsCategories.POST({
          action: "toggle_active",
          id: cat.id,
          active,
        });
        if (data.error) throw new Error(data.msg);
        cat.active = active;
      } catch (e) {
        event.target.checked = !active;
        Swal.fire("Error", e.message || "No se pudo actualizar", "error");
      }
    },
    async toggleHidden(cat, event) {
      const hidden = event.target.checked;
      try {
        const { data } = await api.savingsCategories.POST({
          action: "toggle_hidden",
          id: cat.id,
          hidden,
        });
        if (data.error) throw new Error(data.msg);
        cat.hidden = hidden;
      } catch (e) {
        event.target.checked = !hidden;
        Swal.fire("Error", e.message || "No se pudo actualizar", "error");
      }
    },
    async deleteCategory(cat) {
      const result = await Swal.fire({
        title: "¿Eliminar categoría?",
        text: `Se eliminará "${cat.name}" permanentemente.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e91e63",
      });
      if (!result.isConfirmed) return;
      try {
        const { data } = await api.savingsCategories.POST({
          action: "delete",
          id: cat.id,
        });
        if (data.error) throw new Error(data.msg);
        await this.load();
        Swal.fire({ icon: "success", title: "Eliminada", timer: 1500, showConfirmButton: false });
      } catch (e) {
        Swal.fire("Error", e.message || "No se pudo eliminar", "error");
      }
    },
  },
};
</script>

<style scoped>
.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.panel-desc {
  margin: 0;
  color: #555;
  max-width: 520px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.table-box {
  border-radius: 12px;
  overflow: hidden;
}
.icon-preview {
  display: inline-flex;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}
.preview-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
}
.cat-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.cat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
</style>
