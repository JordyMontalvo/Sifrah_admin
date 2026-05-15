<template>
  <Layout>
    <section class="products-section">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">Productos</h1>
              <p class="page-subtitle">
                Gestiona el catálogo de productos del sistema
              </p>
            </div>

            <div class="header-actions">
              <router-link to="/plans" class="button is-primary">
                <span class="icon">
                  <i class="fas fa-list"></i>
                </span>
                <span>Ver Planes</span>
              </router-link>

              <button class="button is-success" @click="enableAllPlans">
                <span class="icon">
                  <i class="fas fa-check-double"></i>
                </span>
                <span>Habilitar Todos</span>
              </button>

              <button class="button is-info" @click="showAddModal = true">
                <span class="icon">
                  <i class="fas fa-plus"></i>
                </span>
                <span>Nuevo Producto</span>
              </button>

              <button class="button is-warning" @click="openSavingsBonusManager">
                <span>Gestionar Bono Ahorro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Section -->
      <div class="container" style="margin-top: 20px; margin-bottom: 20px;">
        <div class="tabs is-boxed is-centered is-toggle">
          <ul>
            <li :class="{ 'is-active': activeTab === 'sifrah' }">
              <a @click="activeTab = 'sifrah'">
                <span class="icon is-small" style="margin-right: 8px;"><i class="fas fa-leaf"></i></span>
                <span>Catálogo SIFRAH</span>
              </a>
            </li>
            <li :class="{ 'is-active': activeTab === 'savings' }">
              <a @click="activeTab = 'savings'">
                <span class="icon is-small" style="margin-right: 8px;"><i class="fas fa-piggy-bank"></i></span>
                <span>Tienda Bono Ahorro</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="container">
        <div class="stats-grid">
          <DashboardCard
            :value="products.length"
            label="Total Productos"
            icon="fas fa-box"
            color="primary"
            :description="`En el catálogo`"
          />

          <DashboardCard
            :value="activeProducts.length"
            label="Productos Activos"
            icon="fas fa-check-circle"
            color="success"
            :description="`Asignados a planes`"
          />

          <DashboardCard
            :value="categories.length"
            label="Categorías"
            icon="fas fa-tags"
            color="info"
            :description="`Diferentes tipos`"
          />

          <DashboardCard
            :value="totalWeight"
            label="Peso Total"
            icon="fas fa-weight-hanging"
            color="warning"
            :unit="'kg'"
            :description="`Suma de todos los productos`"
          />
        </div>
      </div>

      <!-- Modern Table -->
      <div class="container">
        <ModernTable
          :data="filteredTableData"
          :columns="activeTab === 'sifrah' ? sifrahColumns : savingsColumns"
          :title="activeTab === 'sifrah' ? 'Catálogo SIFRAH' : 'Catálogo Bono Ahorro'"
          :subtitle="activeTab === 'sifrah' ? 'Gestiona productos, puntos y asignación a planes' : 'Gestiona productos de canje, electrodomésticos y premios'"
          :actions="tableActions"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="false"
          :server-pagination="true"
          search-placeholder="Buscar por nombre, código o categoría..."
          :filters="tableFilters"
          @action="handleTableAction"
          @item-action="handleItemAction"
          @search="handleSearch"
          @filter="handleFilter"
        >
          <template #cell-name="{ value, row }">
            <div style="display: flex; flex-direction: column;">
              <span class="has-text-weight-bold">{{ value }}</span>
              <div class="tags" style="margin-top: 4px;">
                <span v-if="row.catalog_type === 'savings' || (row.is_savings_bonus && !row.points)" class="tag is-warning is-light is-small">Externo / Canje</span>
                <span v-if="row.catalog_type === 'sifrah' || row.points" class="tag is-info is-light is-small">SIFRAH</span>
                <span v-if="row.is_savings_bonus" class="tag is-danger is-light is-small">Bono Ahorro</span>
              </div>
            </div>
          </template>
          <template #cell-is_savings_bonus="{ value, row }">
            <div class="field">
              <input
                type="checkbox"
                class="switch is-rounded is-success"
                v-model="row.raw.is_savings_bonus"
                @change="toggleSavingsBonus(row.raw)"
              />
              <label></label>
            </div>
          </template>
          <template #cell-img="{ value }">
            <span v-if="value">
              <img
                :src="value"
                alt="Imagen del producto"
                class="product-thumb"
                @click="openImageModal(value)"
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
            <span v-else style="color: #aaa">Sin imagen</span>
          </template>
        </ModernTable>
      </div>

      <!-- Add Savings Product Modal (Exclusive for Bono Ahorro) -->
      <div class="modal" :class="{ 'is-active': showAddSavingsModal }">
        <div class="modal-background" @click="showAddSavingsModal = false"></div>
        <div class="modal-card">
          <header class="modal-card-head" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <p class="modal-card-title" style="color: white;">Nuevo Producto Bono Ahorro</p>
            <button class="delete" @click="showAddSavingsModal = false"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Nombre del Producto <span class="has-text-danger">*</span></label>
              <div class="control">
                <input class="input" v-model="newSavingsProduct.name" placeholder="Ej: Licuadora, Herramientas, etc." />
              </div>
            </div>

            <div class="field">
              <label class="label">Categoría <span class="has-text-danger">*</span></label>
              <div class="control">
                <input class="input" v-model="newSavingsProduct.type" placeholder="Ej: Electrodomésticos, Herramientas" />
              </div>
            </div>

            <div class="field">
              <label class="label">Descripción</label>
              <div class="control">
                <textarea class="textarea" v-model="newSavingsProduct.description" placeholder="Descripción para el catálogo de canje"></textarea>
              </div>
            </div>

            <div class="field">
              <label class="label">Precio en Soles (para el canje) <span class="has-text-danger">*</span></label>
              <div class="control">
                <input class="input" type="number" v-model.number="newSavingsProduct.savings_price" placeholder="0.00" />
              </div>
            </div>

            <div class="field">
              <label class="label">Imagen URL</label>
              <div class="control">
                <input class="input" v-model="newSavingsProduct.savings_img" placeholder="https://..." />
              </div>
            </div>

            <div v-if="newSavingsProduct.savings_img" class="field">
              <label class="label">Previsualización</label>
              <div class="has-text-centered">
                <img :src="newSavingsProduct.savings_img" style="max-height: 150px; border-radius: 8px;" />
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-warning" @click="saveSavingsProduct" :class="{ 'is-loading': loading }">Guardar Producto de Canje</button>
            <button class="button" @click="showAddSavingsModal = false">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Add Product Modal -->
      <div class="modal" :class="{ 'is-active': showAddModal }">
        <div class="modal-background" @click="showAddModal = false"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Nuevo Producto</p>
            <button class="delete" @click="showAddModal = false"></button>
          </header>

          <section class="modal-card-body">
            <div class="form-grid">
              <div class="field">
                <label class="label">Código</label>
                <div class="control">
                  <input
                    class="input"
                    v-model="newProduct.code"
                    placeholder="Código del producto"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Tipo de Catálogo</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="newProduct.catalog_type">
                      <option value="both">Ambos (Sifrah + Bono Ahorro)</option>
                      <option value="sifrah">Solo SIFRAH</option>
                      <option value="savings">Solo Bono Ahorro (Canje Externo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Nombre <span class="required">*</span></label>
                <div class="control">
                  <input
                    class="input"
                    :class="{ 'is-danger': validationErrors.name }"
                    v-model="newProduct.name"
                    placeholder="Nombre del producto"
                    @input="clearValidationError('name')"
                  />
                  <p v-if="validationErrors.name" class="help is-danger">
                    {{ validationErrors.name }}
                  </p>
                </div>
              </div>

              <div class="field">
                <label class="label">Categoría <span class="required">*</span></label>
                <div class="control">
                  <input
                    class="input"
                    :class="{ 'is-danger': validationErrors.type }"
                    v-model="newProduct.type"
                    placeholder="Categoría del producto"
                    @input="clearValidationError('type')"
                  />
                  <p v-if="validationErrors.type" class="help is-danger">
                    {{ validationErrors.type }}
                  </p>
                </div>
              </div>

              <div class="field">
                <label class="label">Descripción</label>
                <div class="control">
                  <textarea
                    class="textarea"
                    v-model="newProduct.description"
                    placeholder="Descripción del producto"
                  ></textarea>
                </div>
              </div>

              <div class="field">
                <label class="label">Sub-descripción</label>
                <div class="control">
                  <textarea
                    class="textarea"
                    v-model="newProduct.subdescription"
                    placeholder="Sub-descripción del producto"
                  ></textarea>
                </div>
              </div>

              <div class="field">
                <label class="label">Precio</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    v-model.number="newProduct.price"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div v-if="newProduct.catalog_type !== 'savings'" class="field">
                <label class="label">Puntos</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    v-model.number="newProduct.points"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Peso</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    v-model.number="newProduct.weight"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Imagen URL</label>
                <div class="control">
                  <input
                    class="input"
                    v-model="newProduct.img"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Precios por Paquete de Afiliación</label>
                <div class="plans-grid">
                  <div
                    v-for="plan in plans"
                    :key="plan.id"
                    class="plan-price-input"
                  >
                    <span class="plan-name">{{ plan.name }}</span>
                    <input
                      class="input"
                      type="number"
                      v-model.number="newProduct.prices[plan.id]"
                      :placeholder="'Precio para ' + plan.name"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="newProduct.catalog_type !== 'savings'" class="field">
              <label class="label">Asignar a Planes</label>
              <div class="plans-grid">
                <label
                  v-for="plan in plans"
                  :key="plan.id"
                  class="checkbox-wrapper"
                >
                  <input type="checkbox" v-model="newProduct.plans[plan.id]" />
                  <span class="checkmark"></span>
                  <span class="plan-name">{{ plan.name }}</span>
                </label>
              </div>
            </div>

            <!-- Savings Bonus Configuration -->
            <div class="savings-bonus-config-section" style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #eee;">
              <h3 class="title is-5" style="color: #e91e63;">
                <i class="fas fa-piggy-bank"></i> Configuración Bono Ahorro
              </h3>
              
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="newProduct.is_savings_bonus">
                  Habilitar para tienda Bono Ahorro
                </label>
              </div>

              <div v-if="newProduct.is_savings_bonus" class="form-grid">
                <div class="field">
                  <label class="label">Precio Bono Ahorro (S/)</label>
                  <div class="control">
                    <input class="input" type="number" v-model.number="newProduct.savings_price" placeholder="Precio en el bono">
                  </div>
                </div>

                <div class="field">
                  <label class="label">Imagen Exclusiva Bono (Opcional)</label>
                  <div class="control">
                    <input class="input" v-model="newProduct.savings_img" placeholder="URL imagen para bono">
                  </div>
                </div>

                <div class="field is-full">
                  <label class="label">Descripción Exclusiva Bono (Opcional)</label>
                  <div class="control">
                    <textarea class="textarea" v-model="newProduct.savings_description" placeholder="Descripción especial para el canje"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer class="modal-card-foot">
            <button class="button is-success" @click="addProduct">
              <span class="icon">
                <i class="fas fa-save"></i>
              </span>
              <span>Guardar Producto</span>
            </button>
            <button class="button" @click="showAddModal = false">
              Cancelar
            </button>
          </footer>
        </div>
      </div>

      <!-- Edit Product Modal -->
      <div class="modal" :class="{ 'is-active': showEditModal }">
        <div class="modal-background" @click="closeEditModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Editar Producto</p>
            <button
              class="delete"
              aria-label="close"
              @click="closeEditModal"
            ></button>
          </header>
          <section class="modal-card-body">
            <div class="form-grid">
              <div class="field">
                <label class="label">Código</label>
                <div class="control">
                  <input
                    class="input"
                    v-model="editingProduct.code"
                    placeholder="Código del producto"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Tipo de Catálogo</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="editingProduct.catalog_type">
                      <option value="both">Ambos (Sifrah + Bono Ahorro)</option>
                      <option value="sifrah">Solo SIFRAH</option>
                      <option value="savings">Solo Bono Ahorro (Canje Externo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Nombre</label>
                <div class="control">
                  <input
                    class="input"
                    v-model="editingProduct.name"
                    placeholder="Nombre del producto"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Categoría</label>
                <div class="control">
                  <input
                    class="input"
                    v-model="editingProduct.type"
                    placeholder="Categoría del producto"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Descripción</label>
                <div class="control">
                  <textarea
                    class="textarea"
                    v-model="editingProduct.description"
                    placeholder="Descripción del producto"
                  ></textarea>
                </div>
              </div>

              <div class="field">
                <label class="label">Sub-descripción</label>
                <div class="control">
                  <textarea
                    class="textarea"
                    v-model="editingProduct.subdescription"
                    placeholder="Sub-descripción del producto"
                  ></textarea>
                </div>
              </div>

              <div class="field">
                <label class="label">Precio</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    step="0.01"
                    v-model.number="editingProduct.price"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div v-if="editingProduct.catalog_type !== 'savings'" class="field">
                <label class="label">Puntos</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    v-model.number="editingProduct.points"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Peso</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    step="0.01"
                    v-model.number="editingProduct.weight"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Imagen URL</label>
                <div class="control">
                  <input
                    class="input"
                    v-model="editingProduct.img"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Precios por Paquete de Afiliación</label>
                <div class="plans-grid">
                  <div
                    v-for="plan in plans"
                    :key="plan.id"
                    class="plan-price-input"
                  >
                    <span class="plan-name">{{ plan.name }}</span>
                    <input
                      class="input"
                      type="number"
                      v-model.number="editingProduct.prices[plan.id]"
                      :placeholder="'Precio para ' + plan.name"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="editingProduct.catalog_type !== 'savings'" class="field">
              <label class="label">Asignar a Planes</label>
              <div class="plans-grid">
                <label
                  v-for="plan in plans"
                  :key="plan.id"
                  class="checkbox-wrapper"
                >
                  <input
                    type="checkbox"
                    v-model="editingProduct.plans[plan.id]"
                  />
                  <span class="checkmark"></span>
                  <span class="plan-name">{{ plan.name }}</span>
                </label>
              </div>
            </div>

            <!-- Savings Bonus Configuration -->
            <div class="savings-bonus-config-section" style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #eee;">
              <h3 class="title is-5" style="color: #e91e63;">
                <i class="fas fa-piggy-bank"></i> Configuración Bono Ahorro
              </h3>
              
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="editingProduct.is_savings_bonus">
                  Habilitar para tienda Bono Ahorro
                </label>
              </div>

              <div v-if="editingProduct.is_savings_bonus" class="form-grid">
                <div class="field">
                  <label class="label">Precio Bono Ahorro (S/)</label>
                  <div class="control">
                    <input class="input" type="number" v-model.number="editingProduct.savings_price" placeholder="Precio en el bono">
                  </div>
                </div>

                <div class="field">
                  <label class="label">Imagen Exclusiva Bono (Opcional)</label>
                  <div class="control">
                    <input class="input" v-model="editingProduct.savings_img" placeholder="URL imagen para bono">
                  </div>
                </div>

                <div class="field" style="grid-column: span 2;">
                  <label class="label">Descripción Exclusiva Bono (Opcional)</label>
                  <div class="control">
                    <textarea class="textarea" v-model="editingProduct.savings_description" placeholder="Descripción especial para el canje"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="saveProduct">
              Guardar Cambios
            </button>
            <button class="button" @click="closeEditModal">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Modal para imagen grande -->
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
            alt="Producto grande"
            class="image-modal-img"
          />
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      </div>

      <!-- Savings Bonus Manager Modal -->
      <div class="modal" :class="{ 'is-active': showSavingsManager }">
        <div class="modal-background" @click="showSavingsManager = false"></div>
        <div class="modal-card" style="width: 90%; max-width: 1000px;">
          <header class="modal-card-head">
            <p class="modal-card-title">Gestionar Productos Bono Ahorro</p>
            <button class="delete" @click="showSavingsManager = false"></button>
          </header>
          <section class="modal-card-body">
            <p class="subtitle is-6">Selecciona qué productos aparecen en la tienda de Bono Ahorro y define su precio de canje.</p>
            <table class="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Habilitar</th>
                  <th>Imagen</th>
                  <th>Producto</th>
                  <th>Precio Regular</th>
                  <th>Precio Bono Ahorro</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products" :key="product.id">
                  <td style="text-align: center;">
                    <input type="checkbox" v-model="product.is_savings_bonus">
                  </td>
                  <td>
                    <img :src="product.img" style="width: 40px; border-radius: 4px;">
                  </td>
                  <td>
                    <p class="has-text-weight-bold">{{ product.name }}</p>
                    <p class="is-size-7">{{ product.code }}</p>
                  </td>
                  <td>S/ {{ product.price }}</td>
                  <td>
                    <div class="field has-addons">
                      <p class="control">
                        <a class="button is-static is-small">S/</a>
                      </p>
                      <p class="control">
                        <input class="input is-small" type="number" v-model.number="product.savings_price" :disabled="!product.is_savings_bonus">
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="saveSavingsBonusBulk">
              Guardar Cambios Masivos
            </button>
            <button class="button" @click="showSavingsManager = false">Cerrar</button>
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
import Swal from "sweetalert2";

export default {
  components: {
    Layout,
    DashboardCard,
    ModernTable,
  },
  data() {
    return {
      products: [],
      allProducts: [],
      plans: [],
      loading: true,
      showAddModal: false,
      showEditModal: false,
      showImageModal: false,
      imageModalUrl: "",
      newProduct: {
        code: "",
        name: "",
        type: "",
        description: "",
        subdescription: "",
        price: 0,
        points: 0,
        weight: 0,
        img: "",
        plans: {},
        prices: {},
        is_savings_bonus: false,
        savings_price: 0,
        savings_description: "",
        savings_img: "",
        catalog_type: "both",
      },
      editingProduct: {
        code: "",
        name: "",
        type: "",
        description: "",
        subdescription: "",
        price: 0,
        points: 0,
        weight: 0,
        img: "",
        plans: {},
        prices: {},
        is_savings_bonus: false,
        savings_price: 0,
        savings_description: "",
        savings_img: "",
        catalog_type: "both",
      },
      validationErrors: {
        type: "",
      },

      // Table configuration
      tableColumns: [
        {
          key: "id",
          label: "#",
          sortable: true,
          type: "number",
        },
        {
          key: "code",
          label: "Código",
          sortable: true,
        },
        {
          key: "name",
          label: "Nombre",
          sortable: true,
        },
        {
          key: "type",
          label: "Categoría",
          sortable: true,
        },
        {
          key: "description",
          label: "Descripción",
          sortable: false,
        },
        {
          key: "price",
          label: "Precio",
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
          key: "weight",
          label: "Peso",
          sortable: true,
          type: "number",
        },
        {
          key: "img",
          label: "Imagen",
          sortable: false,
        },
        {
          key: "is_savings_bonus",
          label: "Bono Ahorro",
          sortable: true,
          type: "boolean",
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
          key: "add",
          label: "Nuevo",
          icon: "fas fa-plus",
          class: "is-success",
        },
      ],
      itemActions: [
        {
          key: "edit",
          label: "Editar",
          icon: "fas fa-edit",
          class: "is-warning",
        },
        {
          key: "delete",
          label: "Eliminar",
          icon: "fas fa-trash",
          class: "is-danger",
        },
        {
          key: "view",
          label: "Ver",
          icon: "fas fa-eye",
          class: "is-primary",
        },
      ],
      tableFilters: [
        {
          key: "type",
          label: "Categoría",
          placeholder: "Filtrar por categoría",
          options: [],
        },
        {
          key: "hasPlans",
          label: "Con Planes",
          placeholder: "Filtrar por asignación",
          options: [
            { value: true, label: "Asignados" },
            { value: false, label: "Sin asignar" },
          ],
        },
        {
          key: "is_savings_bonus",
          label: "Bono Ahorro",
          placeholder: "Filtrar Bono Ahorro",
          options: [
            { value: true, label: "Habilitados" },
            { value: false, label: "Deshabilitados" },
          ],
        },
      ],
      showSavingsManager: false,
      showAddSavingsModal: false,
      activeTab: "sifrah",
      searchQuery: "",
      activeFilters: null,
      newSavingsProduct: {
        name: "",
        type: "",
        description: "",
        savings_price: 0,
        savings_img: "",
        is_savings_bonus: true,
        catalog_type: 'savings',
        price: 0, // precio regular (opcional en este caso)
        points: 0
      },
    };
  },
  computed: {
    activeProducts() {
      return this.allProducts.filter(
        (product) => product.plans && Object.values(product.plans).some(Boolean)
      );
    },
    categories() {
      const categories = new Set(this.allProducts.map((p) => p.type));
      return Array.from(categories).filter(Boolean);
    },
    totalWeight() {
      return this.allProducts.reduce(
        (sum, product) => sum + (product.weight || 0),
        0
      );
    },
    tableData() {
      return this.products.map((product, index) => ({
        id: product.id || index + 1,
        code: product.code || "",
        name: product.name || "",
        type: product.type || "",
        description: product.description || "",
        price: product.price || 0,
        points: product.points || 0,
        weight: product.weight || 0,
        img: product.img || "",
        plans: product.plans || {},
        is_savings_bonus: product.is_savings_bonus || false,
        savings_price: product.savings_price || 0,
        savings_description: product.savings_description || "",
        savings_img: product.savings_img || "",
        catalog_type: product.catalog_type || (product.points ? 'both' : 'savings'),
        raw: product,
      }));
    },
    filteredTableData() {
      let rows = this.tableData;
      if (this.activeTab === 'savings') {
        rows = rows.filter(p => p.is_savings_bonus);
      }
      return rows.map((row, index) => ({ ...row, rowNum: index + 1 }));
    },
    sifrahColumns() {
      return this.tableColumns;
    },
    savingsColumns() {
      return [
        { key: "rowNum", label: "#", sortable: true, type: "number" },
        { key: "img", label: "Imagen", sortable: false },
        { key: "name", label: "Producto", sortable: true },
        { key: "type", label: "Categoría", sortable: true },
        { key: "price", label: "Precio Regular", sortable: true, type: "currency" },
        { key: "savings_price", label: "Precio Bono", sortable: true, type: "currency" },
        { key: "is_savings_bonus", label: "Estado", sortable: true, type: "boolean" },
      ];
    },
  },
  created() {
    this.load();
    // Limpiar filtros al cargar
    this.tableFilters.forEach((f) => this.$set(f, "value", ""));
  },
  mounted() {
  },
  methods: {
    async load() {
      this.loading = true;

      try {
        const [productsResponse, plansResponse] = await Promise.all([
          api.products.GET({ all: true }),
          api.Plans.GET(),
        ]);

        this.products = productsResponse.data.products || [];
        this.allProducts = productsResponse.data.products || [];
        this.plans = plansResponse.data.plans || [];

        // Update filter options
        this.tableFilters[0].options = this.categories.map((cat) => ({
          value: cat,
          label: cat,
        }));

        this.loading = false;
      } catch (error) {
        console.error("Error loading data:", error);
        this.loading = false;
      }
    },

    handleTableAction(action) {
      switch (action.key) {
        case "refresh":
          this.load();
          break;
        case "add":
          if (this.activeTab === 'savings') {
            this.showAddSavingsModal = true;
          } else {
            this.showAddModal = true;
          }
          break;
      }
    },

    async saveSavingsProduct() {
      if (!this.newSavingsProduct.name || !this.newSavingsProduct.type || !this.newSavingsProduct.savings_price) {
        return Swal.fire("Error", "Por favor completa los campos obligatorios", "error");
      }

      this.loading = true;
      try {
        await api.products.POST({
          action: "add",
          data: {
            ...this.newSavingsProduct,
            // Sincronizar precio base con el de ahorro para que aparezca bien en listas
            price: this.newSavingsProduct.savings_price,
            img: this.newSavingsProduct.savings_img,
            description: this.newSavingsProduct.description
          },
        });

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto de canje añadido correctamente",
          timer: 2000,
          showConfirmButton: false,
        });

        this.showAddSavingsModal = false;
        // Reset form
        this.newSavingsProduct = {
          name: "",
          type: "",
          description: "",
          savings_price: 0,
          savings_img: "",
          is_savings_bonus: true,
          catalog_type: 'savings',
          price: 0,
          points: 0
        };
        this.load();
      } catch (error) {
        console.error("Error saving savings product:", error);
        Swal.fire("Error", "No se pudo guardar el producto", "error");
      } finally {
        this.loading = false;
      }
    },

    openSavingsBonusManager() {
      this.showSavingsManager = true;
    },

    buildProductEditData(product) {
      return {
        _name: product.name,
        _type: product.type,
        _price: product.price,
        _points: product.points || 0,
        _img: product.img || "",
        _code: product.code || "",
        _description: product.description || "",
        _subdescription: product.subdescription || "",
        _plans: product.plans || {},
        _weight: product.weight || 0,
        _prices: product.prices || {},
        is_savings_bonus: !!product.is_savings_bonus,
        savings_price: product.savings_price || 0,
        savings_description: product.savings_description || "",
        savings_img: product.savings_img || "",
      };
    },

    async toggleSavingsBonus(product) {
      const enabled = !!product.is_savings_bonus;
      try {
        await api.products.POST({
          action: "edit",
          id: product.id,
          data: this.buildProductEditData(product),
        });

        const syncList = (list) => {
          const idx = list.findIndex((p) => p.id === product.id);
          if (idx !== -1) {
            this.$set(list[idx], "is_savings_bonus", enabled);
          }
        };
        syncList(this.allProducts);
        syncList(this.products);

        if (!enabled && this.activeTab === "savings") {
          Swal.fire({
            icon: "success",
            title: "Producto desactivado",
            text: "Ya no aparecerá en la tienda Bono Ahorro",
            timer: 1800,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        product.is_savings_bonus = !enabled;
        console.error("Error toggling savings bonus:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el estado del producto",
        });
      }
    },

    async saveSavingsBonusBulk() {
      this.loading = true;
      try {
        // Enviar cada producto actualizado (esto es ineficiente si hay muchos, 
        // pero seguimos el patrón del API actual que es por producto)
        // Alternativamente, si el backend soporta bulk, sería mejor.
        // Por ahora, asumimos que Products.POST procesa un solo producto o acción.
        
        const updates = this.products.map(p => {
          return api.products.POST({
            action: 'update',
            id: p.id,
            data: {
              ...p,
              is_savings_bonus: p.is_savings_bonus,
              savings_price: p.savings_price
            }
          });
        });

        await Promise.all(updates);

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Configuración masiva guardada",
          timer: 1800,
          showConfirmButton: false,
        });
        this.showSavingsManager = false;
        this.load();
      } catch (error) {
        console.error("Error bulk saving savings bonus:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al guardar cambios masivos",
        });
      } finally {
        this.loading = false;
      }
    },

    handleItemAction({ action, item }) {
      console.log("handleItemAction", action, item);
      if (action === "edit") {
        this.editProduct(item.raw ? item.raw : item);
      } else if (action === "delete") {
        this.deleteProduct(item.raw ? item.raw : item);
      } else if (action === "view") {
        this.viewProduct(item.raw ? item.raw : item);
      }
    },

    handleSearch(query) {
      this.searchQuery = query;
      this.applyFilters();
    },

    handleFilter(filters) {
      this.activeFilters = filters;
      this.applyFilters();
    },

    applyFilters() {
      let filtered = [...this.allProducts];

      // Search
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.type && p.type.toLowerCase().includes(q))
        );
      }

      // Filters
      if (this.activeFilters) {
        if (this.activeFilters.type) {
          filtered = filtered.filter(p => p.type === this.activeFilters.type);
        }
        
        if (this.activeFilters.is_savings_bonus !== undefined && this.activeFilters.is_savings_bonus !== "") {
          const val = this.activeFilters.is_savings_bonus === "true" || this.activeFilters.is_savings_bonus === true;
          filtered = filtered.filter(p => p.is_savings_bonus === val);
        }

        if (this.activeFilters.hasPlans !== undefined && this.activeFilters.hasPlans !== "") {
          const val = this.activeFilters.hasPlans === "true" || this.activeFilters.hasPlans === true;
          filtered = filtered.filter(p => {
            const has = p.plans && Object.values(p.plans).some(Boolean);
            return val ? has : !has;
          });
        }
      }

      this.products = filtered;
    },

    editProduct(product) {
      console.log("editProduct", product);
      // Buscar el producto original por id
      let original = null;
      if (!original && product.id) {
        original = this.products.find((p) => p.id === product.id);
      }
      // Si no se encuentra, usar el producto recibido
      const prod = original || product;
      this.editingProduct = {
        code: prod.code || "",
        name: prod.name || "",
        type: prod.type || "",
        description: prod.description || "",
        subdescription: prod.subdescription || "",
        price: prod.price || 0,
        points: prod.points || 0,
        weight: prod.weight || 0,
        img: prod.img || "",
        id: prod.id || "",
        plans: prod.plans || {},
        prices: prod.prices || {},
        is_savings_bonus: prod.is_savings_bonus || false,
        savings_price: prod.savings_price || 0,
        savings_description: prod.savings_description || "",
        savings_img: prod.savings_img || "",
      };
      this.showEditModal = true;
    },

    async deleteProduct(product) {
      if (!confirm(`¿Está seguro de eliminar el producto "${product.name}"?`)) {
        return;
      }

      try {
        await api.products.POST({ action: "delete", id: product.id });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto eliminado exitosamente",
          timer: 1800,
          showConfirmButton: false,
        });
        this.load();
      } catch (error) {
        console.error("Error deleting product:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al eliminar producto",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },

    viewProduct(product) {
      // Open product details modal
      console.log("View product:", product);
    },

    async addProduct() {
      this.validationErrors = {}; // Clear previous errors
      let hasError = false;

      if (!this.newProduct.code) {
        this.validationErrors.code = "El código del producto es obligatorio.";
        hasError = true;
      }
      if (!this.newProduct.name) {
        this.validationErrors.name = "El nombre del producto es obligatorio.";
        hasError = true;
      }
      if (!this.newProduct.type) {
        this.validationErrors.type = "La categoría del producto es obligatoria.";
        hasError = true;
      }
      if (!this.newProduct.price) {
        this.validationErrors.price = "El precio del producto es obligatorio.";
        hasError = true;
      }
      if (!this.newProduct.points) {
        this.validationErrors.points = "Los puntos del producto son obligatorios.";
        hasError = true;
      }
      if (!this.newProduct.weight) {
        this.validationErrors.weight = "El peso del producto es obligatorio.";
        hasError = true;
      }
      if (!this.newProduct.img) {
        this.validationErrors.img = "La URL de la imagen es obligatoria.";
        hasError = true;
      }
      if (Object.keys(this.newProduct.plans).length === 0) {
        this.validationErrors.plans = "Debe asignar el producto a al menos un plan.";
        hasError = true;
      }
      if (Object.keys(this.newProduct.prices).length === 0) {
        this.validationErrors.prices = "Debe definir el precio para al menos un plan.";
        hasError = true;
      }

      if (hasError) {
        return;
      }

      try {
        await api.products.POST({
          action: "add",
          data: {
            code: this.newProduct.code,
            name: this.newProduct.name,
            type: this.newProduct.type,
            price: this.newProduct.price,
            points: this.newProduct.points,
            img: this.newProduct.img,
            description: this.newProduct.description,
            subdescription: this.newProduct.subdescription,
            plans: this.newProduct.plans,
            weight: this.newProduct.weight,
            prices: this.newProduct.prices,
            is_savings_bonus: this.newProduct.catalog_type !== 'sifrah',
            savings_price: this.newProduct.savings_price,
            savings_description: this.newProduct.savings_description,
            savings_img: this.newProduct.savings_img,
            catalog_type: this.newProduct.catalog_type,
          },
        });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto agregado exitosamente",
          timer: 1800,
          showConfirmButton: false,
        });
        this.showAddModal = false;
        this.resetNewProduct();
        this.load();
      } catch (error) {
        console.error("Error adding product:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al agregar producto",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },

    resetNewProduct() {
      this.newProduct = {
        code: "",
        name: "",
        type: "",
        description: "",
        subdescription: "",
        price: 0,
        points: 0,
        weight: 0,
        img: "",
        plans: {},
        prices: {},
        is_savings_bonus: false,
        savings_price: 0,
        savings_description: "",
        savings_img: "",
      };
      this.validationErrors = {}; // Clear validation errors
    },

    clearValidationError(field) {
      this.validationErrors[field] = "";
    },

    async enableAllPlans() {
      if (
        !confirm("¿Desea habilitar todos los productos para todos los planes?")
      ) {
        return;
      }

      try {
        await api.products.POST({ action: "enable_all_plans" });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Todos los productos habilitados exitosamente",
          timer: 1800,
          showConfirmButton: false,
        });
        this.load();
      } catch (error) {
        console.error("Error enabling all plans:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al habilitar productos",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },

    closeEditModal() {
      this.showEditModal = false;
    },

    async saveProduct() {
      try {
        // Prepara el objeto data con los nombres correctos
        const data = {
          _name: this.editingProduct.name,
          _type: this.editingProduct.type,
          _price: this.editingProduct.price,
          _points: this.editingProduct.points,
          _img: this.editingProduct.img,
          _code: this.editingProduct.code,
          _description: this.editingProduct.description,
          _subdescription: this.editingProduct.subdescription,
          _plans: this.editingProduct.plans,
          _weight: this.editingProduct.weight,
          _prices: this.editingProduct.prices,
          is_savings_bonus: this.editingProduct.catalog_type !== 'sifrah',
          savings_price: this.editingProduct.savings_price,
          savings_description: this.editingProduct.savings_description,
          savings_img: this.editingProduct.savings_img,
          catalog_type: this.editingProduct.catalog_type,
        };

        await api.products.POST({
          action: "edit",
          id: this.editingProduct.id,
          data,
        });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto actualizado exitosamente",
          timer: 1800,
          showConfirmButton: false,
        });
        this.closeEditModal();
        this.load();
      } catch (error) {
        console.error("Error updating product:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al actualizar producto",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },

    openImageModal(url) {
      this.imageModalUrl = url;
      this.showImageModal = true;
    },

    closeImageModal() {
      this.showImageModal = false;
      this.imageModalUrl = "";
    },
  },
};
</script>

<style scoped>
.products-section {
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

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-wrapper:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.checkbox-wrapper input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkmark {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.plan-name {
  font-weight: 500;
  color: #374151;
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

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark Mode Support */
.dark-mode .page-header {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
}

.dark-mode .loading-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.dark-mode .loading-content p {
  color: #e2e8f0;
}

.dark-mode .field .label {
  color: #e2e8f0;
}

.dark-mode .checkbox-wrapper {
  border-color: #4a5568;
  background: #2d3748;
}

.dark-mode .checkbox-wrapper:hover {
  background: #4a5568;
  border-color: #718096;
}

.dark-mode .plan-name {
  color: #e2e8f0;
}

.product-thumb {
  transition: transform 0.2s;
}
.product-thumb:hover {
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
</style>
