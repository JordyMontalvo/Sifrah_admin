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
            <li :class="{ 'is-active': activeTab === 'promotions' }">
              <a @click="activeTab = 'promotions'">
                <span class="icon is-small" style="margin-right: 8px;"><i class="fas fa-tags"></i></span>
                <span>Promociones</span>
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
          :columns="activeTableColumns"
          :title="activeTableTitle"
          :subtitle="activeTableSubtitle"
          :actions="tableActions"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="false"
          :server-pagination="true"
          search-placeholder="Buscar por nombre, código o categoría..."
          :filters="[]"
          @action="handleTableAction"
          @item-action="handleItemAction"
          @search="handleSearch"
        >
          <template #cell-sort_order="{ row }">
            <div class="product-order-edit" @click.stop>
              <input
                class="input is-small product-order-input"
                type="number"
                min="1"
                step="1"
                v-model.number="row.raw.sort_order"
                :disabled="!!sortOrderSaving[row.raw.id]"
                @focus="rememberSortOrder(row.raw)"
                @blur="saveSortOrderIfChanged(row.raw)"
                @keyup.enter="$event.target.blur()"
              />
            </div>
          </template>
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
          <template #cell-savings_price="{ row }">
            <div class="savings-price-edit" @click.stop>
              <div class="field has-addons">
                <p class="control">
                  <span class="button is-static is-small">S/</span>
                </p>
                <p class="control">
                  <input
                    class="input is-small"
                    type="number"
                    min="0"
                    step="0.01"
                    v-model.number="row.raw.savings_price"
                    :disabled="!!savingsPriceSaving[row.raw.id]"
                    @focus="rememberSavingsPrice(row.raw)"
                    @blur="saveSavingsPriceIfChanged(row.raw)"
                    @keyup.enter="$event.target.blur()"
                  />
                </p>
              </div>
            </div>
          </template>
          <template #cell-price="{ row }">
            <span v-if="activeTab === 'savings'" class="sifrah-price-ref" title="Precio del catálogo SIFRAH (solo lectura)">
              S/ {{ row.price }}
            </span>
            <span v-else class="currency-value">{{ row.price }}</span>
          </template>
          <template #cell-is_savings_bonus="{ row }">
            <div v-if="activeTab === 'promotions'" class="savings-toggle-field" @click.stop>
              <input
                type="checkbox"
                class="switch is-rounded is-success"
                :id="`promo-savings-${row.raw.id}`"
                :checked="!!row.raw.is_savings_bonus"
                :disabled="!!promotionToggleLoading[row.raw.id]"
                @change="togglePromotionSavings(row.raw, $event)"
              />
              <label :for="`promo-savings-${row.raw.id}`"></label>
            </div>
            <div v-else class="savings-toggle-field" @click.stop>
              <input
                type="checkbox"
                class="switch is-rounded is-success"
                :id="`savings-switch-${row.raw.id}`"
                :checked="!!row.raw.is_savings_bonus"
                :disabled="!!savingsToggleLoading[row.raw.id]"
                @change="toggleSavingsBonus(row.raw, $event)"
              />
              <label :for="`savings-switch-${row.raw.id}`"></label>
            </div>
          </template>
          <template #cell-promotion_active="{ row }">
            <div class="savings-toggle-field" @click.stop>
              <input
                type="checkbox"
                class="switch is-rounded is-success"
                :id="`promo-active-${row.raw.id}`"
                :checked="row.raw.promotion_active !== false"
                :disabled="!!promotionToggleLoading[row.raw.id]"
                @change="togglePromotionActive(row.raw, $event)"
              />
              <label :for="`promo-active-${row.raw.id}`"></label>
            </div>
          </template>
          <template #cell-available_quantity="{ row }">
            <span>{{ row.available_quantity || "—" }}</span>
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
          <header class="modal-card-head">
            <p class="modal-card-title">Nuevo Producto Bono Ahorro</p>
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
                <div class="select is-fullwidth">
                  <select v-model="newSavingsProduct.savings_category_id">
                    <option :value="null" disabled>Seleccione una categoría</option>
                    <option
                      v-for="cat in selectableSavingsCategories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.name }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="help">
                <router-link to="/savings-categories">Gestionar categorías</router-link>
              </p>
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
              <label class="label">Imagen</label>
              <div class="control">
                <div class="file has-name is-fullwidth">
                  <label class="file-label">
                    <input
                      class="file-input"
                      type="file"
                      accept="image/*"
                      @change="handleSavingsImageUpload"
                      :disabled="savingsImageUploading"
                    />
                    <span class="file-cta">
                      <span class="file-icon">
                        <i class="fas fa-upload"></i>
                      </span>
                      <span class="file-label">
                        {{ savingsImageUploading ? "Subiendo..." : "Subir imagen" }}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
              <p class="help">También puedes pegar una URL</p>
              <div class="control" style="margin-top: 8px;">
                <input
                  class="input"
                  v-model="newSavingsProduct.savings_img"
                  placeholder="https://..."
                />
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
            <button
              class="button is-success"
              @click="saveSavingsProduct"
              :class="{ 'is-loading': loading || savingsImageUploading }"
            >
              <span class="icon">
                <i class="fas fa-save"></i>
              </span>
              <span>Guardar Producto de Canje</span>
            </button>
            <button class="button" @click="showAddSavingsModal = false">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Add Promotion Modal -->
      <div class="modal" :class="{ 'is-active': showAddPromotionModal }">
        <div class="modal-background" @click="showAddPromotionModal = false"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Nueva Promoción</p>
            <button class="delete" @click="showAddPromotionModal = false"></button>
          </header>
          <section class="modal-card-body">
            <div class="notification is-info is-light" style="margin-bottom: 16px;">
              Visible solo para usuarios <strong>activos</strong>. No genera puntos ni participa en el plan de compensación.
            </div>

            <div class="field">
              <label class="label">Nombre de la promoción <span class="has-text-danger">*</span></label>
              <div class="control">
                <input class="input" v-model="newPromotion.name" placeholder="Ej: Pack Verano" />
              </div>
            </div>

            <div class="field">
              <label class="label">Descripción</label>
              <div class="control">
                <textarea class="textarea" v-model="newPromotion.description" placeholder="Descripción principal"></textarea>
              </div>
            </div>

            <div class="field">
              <label class="label">Sub-descripción</label>
              <div class="control">
                <textarea class="textarea" v-model="newPromotion.subdescription" placeholder="Detalle adicional"></textarea>
              </div>
            </div>

            <div class="form-grid">
              <div class="field">
                <label class="label">Precio (S/) <span class="has-text-danger">*</span></label>
                <div class="control">
                  <input class="input" type="number" min="0" step="0.01" v-model.number="newPromotion.price" />
                </div>
              </div>
              <div class="field">
                <label class="label">Cantidad disponible <span class="has-text-danger">*</span></label>
                <div class="control">
                  <input class="input" type="number" min="1" step="1" v-model.number="newPromotion.available_quantity" placeholder="Máximo por usuario" />
                </div>
                <p class="help">Unidades máximas que los usuarios pueden comprar en total.</p>
              </div>
            </div>

            <div class="field">
              <label class="label">Imagen principal</label>
              <div class="control">
                <div class="file has-name is-fullwidth">
                  <label class="file-label">
                    <input class="file-input" type="file" accept="image/*" @change="handlePromotionImageUpload($event, 'new')" :disabled="promotionImageUploading" />
                    <span class="file-cta">
                      <span class="file-icon"><i class="fas fa-upload"></i></span>
                      <span class="file-label">{{ promotionImageUploading ? "Subiendo..." : "Subir imagen" }}</span>
                    </span>
                  </label>
                </div>
              </div>
              <div class="control" style="margin-top: 8px;">
                <input class="input" v-model="newPromotion.img" placeholder="https://..." />
              </div>
            </div>

            <div v-if="newPromotion.img" class="field has-text-centered">
              <img :src="newPromotion.img" style="max-height: 150px; border-radius: 8px;" />
            </div>

            <div class="field" style="margin-top: 16px; padding-top: 16px; border-top: 2px dashed #eee;">
              <label class="checkbox">
                <input type="checkbox" v-model="newPromotion.is_savings_bonus" />
                Habilitar también en Tienda Bono Ahorro
              </label>
            </div>

            <div v-if="newPromotion.is_savings_bonus" class="field">
              <label class="label">Precio en Bono Ahorro (S/)</label>
              <div class="control">
                <input class="input" type="number" min="0" step="0.01" v-model.number="newPromotion.savings_price" :placeholder="String(newPromotion.price || 0)" />
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="savePromotion" :class="{ 'is-loading': loading || promotionImageUploading }">
              <span class="icon"><i class="fas fa-save"></i></span>
              <span>Guardar Promoción</span>
            </button>
            <button class="button" @click="showAddPromotionModal = false">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Edit Promotion Modal -->
      <div class="modal" :class="{ 'is-active': showEditPromotionModal }">
        <div class="modal-background" @click="closeEditPromotionModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Editar Promoción</p>
            <button class="delete" @click="closeEditPromotionModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="field">
              <label class="label">Nombre</label>
              <div class="control">
                <input class="input" v-model="editingPromotion.name" />
              </div>
            </div>
            <div class="field">
              <label class="label">Descripción</label>
              <div class="control">
                <textarea class="textarea" v-model="editingPromotion.description"></textarea>
              </div>
            </div>
            <div class="field">
              <label class="label">Sub-descripción</label>
              <div class="control">
                <textarea class="textarea" v-model="editingPromotion.subdescription"></textarea>
              </div>
            </div>
            <div class="form-grid">
              <div class="field">
                <label class="label">Precio tienda (S/)</label>
                <div class="control">
                  <input class="input" type="number" min="0" step="0.01" v-model.number="editingPromotion.price" />
                </div>
              </div>
              <div class="field">
                <label class="label">Cantidad disponible</label>
                <div class="control">
                  <input class="input" type="number" min="1" step="1" v-model.number="editingPromotion.available_quantity" />
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Imagen principal</label>
              <div class="control">
                <div class="file has-name is-fullwidth">
                  <label class="file-label">
                    <input class="file-input" type="file" accept="image/*" @change="handlePromotionImageUpload($event, 'edit')" :disabled="promotionImageUploading" />
                    <span class="file-cta">
                      <span class="file-icon"><i class="fas fa-upload"></i></span>
                      <span class="file-label">{{ promotionImageUploading ? "Subiendo..." : "Subir imagen" }}</span>
                    </span>
                  </label>
                </div>
              </div>
              <div class="control" style="margin-top: 8px;">
                <input class="input" v-model="editingPromotion.img" placeholder="https://..." />
              </div>
            </div>
            <div class="field">
              <label class="checkbox">
                <input type="checkbox" v-model="editingPromotion.is_savings_bonus" />
                Habilitar en Tienda Bono Ahorro
              </label>
            </div>
            <div v-if="editingPromotion.is_savings_bonus" class="field">
              <label class="label">Precio Bono Ahorro (S/)</label>
              <div class="control">
                <input class="input" type="number" min="0" step="0.01" v-model.number="editingPromotion.savings_price" />
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="saveEditPromotion">Guardar cambios</button>
            <button class="button" @click="closeEditPromotionModal">Cancelar</button>
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
                <label class="label">Imagen</label>
                <div class="control">
                  <div class="file has-name is-fullwidth">
                    <label class="file-label">
                      <input
                        class="file-input"
                        type="file"
                        accept="image/*"
                        @change="handleProductImageUpload($event, 'new')"
                        :disabled="productImageUploading"
                      />
                      <span class="file-cta">
                        <span class="file-icon"><i class="fas fa-upload"></i></span>
                        <span class="file-label">
                          {{ productImageUploading ? "Subiendo..." : "Subir desde dispositivo" }}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
                <p class="help">También puedes pegar una URL</p>
                <div class="control" style="margin-top: 8px;">
                  <input
                    class="input"
                    v-model="newProduct.img"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <p v-if="validationErrors.img" class="help is-danger">{{ validationErrors.img }}</p>
              </div>

              <div v-if="newProduct.img" class="field has-text-centered">
                <img :src="newProduct.img" class="product-image-preview" alt="Vista previa" />
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
                    <div class="file has-name is-fullwidth">
                      <label class="file-label">
                        <input
                          class="file-input"
                          type="file"
                          accept="image/*"
                          @change="handleProductImageUpload($event, 'new_savings')"
                          :disabled="productImageUploading"
                        />
                        <span class="file-cta">
                          <span class="file-icon"><i class="fas fa-upload"></i></span>
                          <span class="file-label">
                            {{ productImageUploading ? "Subiendo..." : "Subir imagen" }}
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                  <div class="control" style="margin-top: 8px;">
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
            <button
              class="button is-success"
              @click="addProduct"
              :class="{ 'is-loading': productImageUploading }"
            >
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
                <label class="label">Imagen</label>
                <div class="control">
                  <div class="file has-name is-fullwidth">
                    <label class="file-label">
                      <input
                        class="file-input"
                        type="file"
                        accept="image/*"
                        @change="handleProductImageUpload($event, 'edit')"
                        :disabled="productImageUploading"
                      />
                      <span class="file-cta">
                        <span class="file-icon"><i class="fas fa-upload"></i></span>
                        <span class="file-label">
                          {{ productImageUploading ? "Subiendo..." : "Subir desde dispositivo" }}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
                <p class="help">También puedes pegar una URL</p>
                <div class="control" style="margin-top: 8px;">
                  <input
                    class="input"
                    v-model="editingProduct.img"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>

              <div v-if="editingProduct.img" class="field has-text-centered">
                <img :src="editingProduct.img" class="product-image-preview" alt="Vista previa" />
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

          </section>
          <footer class="modal-card-foot">
            <button
              class="button is-success"
              @click="saveProduct"
              :class="{ 'is-loading': productImageUploading }"
            >
              Guardar Cambios
            </button>
            <button class="button" @click="closeEditModal">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- Edit Savings Catalog Modal (solo precio Bono Ahorro) -->
      <div class="modal" :class="{ 'is-active': showEditSavingsModal }">
        <div class="modal-background" @click="closeEditSavingsModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Editar precio Bono Ahorro</p>
            <button class="delete" @click="closeEditSavingsModal"></button>
          </header>
          <section class="modal-card-body">
            <p class="has-text-weight-bold is-size-5">{{ editingSavingsProduct.name }}</p>
            <p class="is-size-7 has-text-grey" style="margin-bottom: 16px;">
              Código: {{ editingSavingsProduct.code || "—" }}
            </p>

            <div class="notification is-light" style="margin-bottom: 16px;">
              Precio SIFRAH: <strong>S/ {{ editingSavingsProduct.price || 0 }}</strong>
              <span class="is-size-7 has-text-grey"> — no se modifica desde aquí</span>
            </div>

            <div class="field">
              <label class="label">Precio de canje Bono Ahorro (S/)</label>
              <div class="control">
                <input
                  class="input"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="editingSavingsProduct.savings_price"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div class="field">
              <label class="label">Descripción para canje (opcional)</label>
              <div class="control">
                <textarea
                  class="textarea"
                  v-model="editingSavingsProduct.savings_description"
                  placeholder="Descripción visible en la tienda Bono Ahorro"
                ></textarea>
              </div>
            </div>

            <div class="field" v-if="editingSavingsUsesSifrahImage">
              <label class="label">Imagen del producto</label>
              <p class="help" style="margin-bottom: 8px;">
                Usa la imagen del catálogo SIFRAH (no editable aquí).
              </p>
              <div v-if="editingSavingsProduct.img" class="has-text-centered">
                <img
                  :src="editingSavingsProduct.img"
                  alt="Imagen SIFRAH"
                  style="max-height: 150px; border-radius: 8px; border: 1px solid #eee;"
                />
              </div>
              <p v-else class="has-text-grey is-size-7">Sin imagen en catálogo SIFRAH</p>
            </div>

            <div class="field" v-else>
              <label class="label">Imagen para canje (opcional)</label>
              <div class="control">
                <div class="file has-name is-fullwidth">
                  <label class="file-label">
                    <input
                      class="file-input"
                      type="file"
                      accept="image/*"
                      @change="handleEditSavingsImageUpload"
                      :disabled="savingsImageUploading"
                    />
                    <span class="file-cta">
                      <span class="file-icon">
                        <i class="fas fa-upload"></i>
                      </span>
                      <span class="file-label">
                        {{ savingsImageUploading ? "Subiendo..." : "Subir imagen" }}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
              <p class="help">También puedes pegar una URL</p>
              <div class="control" style="margin-top: 8px;">
                <input
                  class="input"
                  v-model="editingSavingsProduct.savings_img"
                  placeholder="URL de imagen exclusiva para Bono Ahorro"
                />
              </div>
              <div v-if="editingSavingsProduct.savings_img" class="has-text-centered" style="margin-top: 12px;">
                <img
                  :src="editingSavingsProduct.savings_img"
                  alt="Vista previa"
                  style="max-height: 150px; border-radius: 8px;"
                />
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="saveSavingsCatalogProduct">
              Guardar precio Bono Ahorro
            </button>
            <button class="button" @click="closeEditSavingsModal">Cancelar</button>
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
                <tr v-for="product in savingsManagerDraft" :key="product.id">
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
                        <input
                          class="input is-small"
                          type="number"
                          v-model.number="product.savings_price"
                          :disabled="!product.is_savings_bonus"
                          :placeholder="String(product.price || 0)"
                        >
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
import lib from "@/lib";
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
        catalog_type: "sifrah",
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
          key: "rowNum",
          label: "#",
          sortable: false,
          type: "number",
        },
        {
          key: "sort_order",
          label: "Orden",
          sortable: false,
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
      savingsManagerDraft: [],
      savingsToggleLoading: {},
      savingsPriceSaving: {},
      savingsPriceSnapshot: {},
      sortOrderSaving: {},
      sortOrderSnapshot: {},
      showEditSavingsModal: false,
      savingsImageUploading: false,
      productImageUploading: false,
      editingSavingsProduct: {
        id: "",
        code: "",
        name: "",
        price: 0,
        points: 0,
        img: "",
        plans: {},
        catalog_type: "",
        savings_price: 0,
        savings_description: "",
        savings_img: "",
      },
      showAddSavingsModal: false,
      showAddPromotionModal: false,
      showEditPromotionModal: false,
      promotionImageUploading: false,
      promotionToggleLoading: {},
      newPromotion: {
        name: "",
        description: "",
        subdescription: "",
        price: 0,
        available_quantity: 1,
        img: "",
        is_savings_bonus: false,
        savings_price: 0,
      },
      editingPromotion: {
        id: "",
        name: "",
        description: "",
        subdescription: "",
        price: 0,
        available_quantity: 1,
        img: "",
        is_savings_bonus: false,
        savings_price: 0,
        promotion_active: true,
      },
      activeTab: "sifrah",
      searchQuery: "",
      activeFilters: null,
      newSavingsProduct: {
        name: "",
        type: "",
        savings_category_id: null,
        description: "",
        savings_price: 0,
        savings_img: "",
        is_savings_bonus: true,
        catalog_type: 'savings',
        price: 0,
        points: 0
      },
      savingsCategories: [],
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
        sort_order: Math.max(1, Number(product.sort_order) || 0),
        plans: product.plans || {},
        is_savings_bonus: product.is_savings_bonus || false,
        savings_price: product.savings_price || 0,
        savings_description: product.savings_description || "",
        savings_img: product.savings_img || "",
        is_promotion: !!product.is_promotion,
        promotion_active: product.promotion_active !== false,
        available_quantity: Number(product.available_quantity) || 0,
        catalog_type:
          product.catalog_type ||
          (product.points ? "both" : product.is_savings_bonus ? "savings" : "sifrah"),
        raw: product,
      }));
    },
    filteredTableData() {
      return this.getSortedCatalogRows().map((row, index) => {
        const mapped = { ...row, rowNum: index + 1 };
        if (this.activeTab === "savings") {
          mapped.type = this.savingsCategoryLabel(row.raw);
        }
        return mapped;
      });
    },
    activeTableColumns() {
      if (this.activeTab === 'promotions') return this.promotionsColumns;
      if (this.activeTab === 'savings') return this.savingsColumns;
      return this.sifrahColumns;
    },
    activeTableTitle() {
      if (this.activeTab === 'promotions') return 'Promociones';
      if (this.activeTab === 'savings') return 'Catálogo Bono Ahorro';
      return 'Catálogo SIFRAH';
    },
    activeTableSubtitle() {
      if (this.activeTab === 'promotions') {
        return 'Promociones comerciales visibles solo para usuarios activos (sin puntos ni compensación). Máx. / usuario = límite de compra individual.';
      }
      if (this.activeTab === 'savings') {
        return 'Edita el precio de canje sin modificar el catálogo SIFRAH';
      }
      return 'Gestiona productos, puntos y asignación a planes. El número en Orden define cómo se ven en la tienda virtual (1 = primero).';
    },
    sifrahColumns() {
      return this.tableColumns;
    },
    promotionsColumns() {
      return [
        { key: "rowNum", label: "#", sortable: false, type: "number" },
        { key: "sort_order", label: "Orden", sortable: false, type: "number" },
        { key: "img", label: "Imagen", sortable: false },
        { key: "name", label: "Promoción", sortable: true },
        { key: "price", label: "Precio", sortable: true, type: "currency" },
        { key: "available_quantity", label: "Máx. / usuario", sortable: true, type: "number" },
        { key: "promotion_active", label: "En tienda", sortable: true, type: "boolean" },
        { key: "is_savings_bonus", label: "Bono Ahorro", sortable: true, type: "boolean" },
      ];
    },
    savingsColumns() {
      return [
        { key: "rowNum", label: "#", sortable: false, type: "number" },
        { key: "sort_order", label: "Orden", sortable: false, type: "number" },
        { key: "img", label: "Imagen", sortable: false },
        { key: "name", label: "Producto", sortable: true },
        { key: "type", label: "Categoría", sortable: true },
        { key: "price", label: "Precio SIFRAH", sortable: true, type: "currency" },
        { key: "savings_price", label: "Precio canje", sortable: true, type: "currency" },
        { key: "is_savings_bonus", label: "Activo", sortable: true, type: "boolean" },
      ];
    },
    editingSavingsUsesSifrahImage() {
      return this.isFromSifrahCatalog(this.editingSavingsProduct);
    },
    selectableSavingsCategories() {
      return [...this.savingsCategories]
        .filter((c) => c.active !== false)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    },
  },
  created() {
    this.load();
    this.loadSavingsCategories();
    // Limpiar filtros al cargar
    this.tableFilters.forEach((f) => this.$set(f, "value", ""));
  },
  mounted() {
  },
  methods: {
    compareProductOrder(a, b) {
      const ao = Number(a && a.sort_order);
      const bo = Number(b && b.sort_order);
      const aHas = Number.isFinite(ao);
      const bHas = Number.isFinite(bo);
      if (aHas && bHas && ao !== bo) return ao - bo;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return String((a && a.name) || "").localeCompare(String((b && b.name) || ""));
    },
    sortProductsInMemory(list) {
      return [...(list || [])].sort((a, b) => this.compareProductOrder(a, b));
    },
    getSortedCatalogRows() {
      let rows = this.tableData;
      if (this.activeTab === "sifrah") {
        rows = rows.filter(
          (p) => !p.is_promotion && this.isFromSifrahCatalog(p.raw || p)
        );
      } else if (this.activeTab === "savings") {
        rows = rows.filter((p) => p.is_savings_bonus && !p.is_promotion);
      } else if (this.activeTab === "promotions") {
        rows = rows.filter((p) => p.is_promotion);
      }
      return [...rows].sort((a, b) => this.compareProductOrder(a.raw, b.raw));
    },
    rememberSortOrder(product) {
      this.$set(this.sortOrderSnapshot, product.id, Math.max(1, Number(product.sort_order) || 1));
    },
    async saveSortOrderIfChanged(product) {
      const prev = this.sortOrderSnapshot[product.id];
      let next = Math.round(Number(product.sort_order));
      if (!Number.isFinite(next) || next < 1) {
        product.sort_order = prev || 1;
        return;
      }
      product.sort_order = next;
      if (prev === next) return;

      this.$set(this.sortOrderSaving, product.id, true);
      try {
        await api.products.POST({
          action: "reorder",
          items: [{ id: product.id, sort_order: next }],
        });
        this.allProducts = this.sortProductsInMemory(this.allProducts);
        this.products = this.sortProductsInMemory(this.products);
        this.applyFilters();
      } catch (e) {
        console.error("Error guardando orden:", e);
        product.sort_order = prev || 1;
        Swal.fire("Error", "No se pudo guardar el orden del producto", "error");
      } finally {
        this.$delete(this.sortOrderSaving, product.id);
      }
    },
    isSavingsOnlyProduct(product) {
      if (!product) return false;
      if (product.catalog_type === "savings") return true;
      return !!product.is_savings_bonus && !(Number(product.points) > 0);
    },

    async loadSavingsCategories() {
      try {
        const { data } = await api.savingsCategories.GET();
        if (!data.error) {
          this.savingsCategories = data.categories || [];
        }
      } catch (e) {
        console.error("Error loading savings categories:", e);
      }
    },

    async load() {
      this.loading = true;

      try {
        const [productsResponse, plansResponse] = await Promise.all([
          api.products.GET({ all: true }),
          api.Plans.GET(),
        ]);

        const normalized = (productsResponse.data.products || []).map((p) => ({
          ...p,
          sort_order: Math.max(1, Number(p.sort_order) || 0),
          is_savings_bonus: !!p.is_savings_bonus,
          savings_price: Number(p.savings_price) || 0,
          is_promotion: !!p.is_promotion || p.type === "Promoción" || p.catalog_type === "promotion",
          promotion_active: p.promotion_active !== false,
          available_quantity: Number(p.available_quantity) || 0,
        }));

        this.allProducts = this.sortProductsInMemory(normalized);
        this.products = [...this.allProducts];
        this.applyFilters();
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
          if (this.activeTab === "promotions") {
            this.showAddPromotionModal = true;
          } else if (this.activeTab === 'savings') {
            this.showAddSavingsModal = true;
          } else {
            this.resetNewProduct();
            this.showAddModal = true;
          }
          break;
      }
    },

    async handleProductImageUpload(event, target) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "Selecciona un archivo de imagen válido", "error");
        event.target.value = "";
        return;
      }

      this.productImageUploading = true;
      try {
        const url = await lib.upload(file, file.name, "products");
        if (target === "edit") {
          this.editingProduct.img = url;
        } else if (target === "new_savings") {
          this.newProduct.savings_img = url;
        } else {
          this.newProduct.img = url;
        }
        if (this.validationErrors.img) {
          this.validationErrors.img = "";
        }
        Swal.fire({
          icon: "success",
          title: "Imagen subida",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error uploading product image:", error);
        Swal.fire("Error", error.message || "No se pudo subir la imagen", "error");
      } finally {
        this.productImageUploading = false;
        event.target.value = "";
      }
    },

    async handleSavingsImageUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "Selecciona un archivo de imagen válido", "error");
        event.target.value = "";
        return;
      }

      this.savingsImageUploading = true;
      try {
        const url = await lib.upload(file, file.name, "products");
        this.newSavingsProduct.savings_img = url;
        Swal.fire({
          icon: "success",
          title: "Imagen subida",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error uploading savings image:", error);
        Swal.fire(
          "Error",
          error.message || "No se pudo subir la imagen",
          "error"
        );
      } finally {
        this.savingsImageUploading = false;
        event.target.value = "";
      }
    },

    async handleEditSavingsImageUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "Selecciona un archivo de imagen válido", "error");
        event.target.value = "";
        return;
      }

      this.savingsImageUploading = true;
      try {
        const url = await lib.upload(file, file.name, "products");
        this.editingSavingsProduct.savings_img = url;
        Swal.fire({
          icon: "success",
          title: "Imagen subida",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error uploading savings image:", error);
        Swal.fire(
          "Error",
          error.message || "No se pudo subir la imagen",
          "error"
        );
      } finally {
        this.savingsImageUploading = false;
        event.target.value = "";
      }
    },

    generatePromotionCode() {
      const numericCodes = this.allProducts
        .map((p) => parseInt(String(p.code || "").replace(/\D/g, ""), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      const next = numericCodes.length ? Math.max(...numericCodes) + 1 : 7001;
      return `PROM-${next}`;
    },

    async handlePromotionImageUpload(event, target) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "Selecciona un archivo de imagen válido", "error");
        event.target.value = "";
        return;
      }
      this.promotionImageUploading = true;
      try {
        const url = await lib.upload(file, file.name, "products");
        if (target === "edit") {
          this.editingPromotion.img = url;
        } else {
          this.newPromotion.img = url;
        }
        Swal.fire({ icon: "success", title: "Imagen subida", timer: 1500, showConfirmButton: false });
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudo subir la imagen", "error");
      } finally {
        this.promotionImageUploading = false;
        event.target.value = "";
      }
    },

    async savePromotion() {
      const { name, price, available_quantity, img } = this.newPromotion;
      if (!name || !price || !available_quantity || available_quantity < 1) {
        return Swal.fire("Error", "Completa nombre, precio y cantidad disponible", "error");
      }

      this.loading = true;
      try {
        const savingsPrice = this.newPromotion.is_savings_bonus
          ? Number(this.newPromotion.savings_price) || Number(price)
          : 0;

        await api.products.POST({
          action: "add",
          data: {
            code: this.generatePromotionCode(),
            name: this.newPromotion.name,
            type: "Promoción",
            description: this.newPromotion.description || "",
            subdescription: this.newPromotion.subdescription || "",
            price: Number(price),
            points: 0,
            weight: 0,
            img: img || "",
            plans: {},
            prices: {},
            is_promotion: true,
            promotion_active: true,
            available_quantity: Number(available_quantity),
            catalog_type: "promotion",
            is_savings_bonus: !!this.newPromotion.is_savings_bonus,
            savings_price: savingsPrice,
            savings_img: img || "",
          },
        });

        Swal.fire({ icon: "success", title: "Promoción creada", timer: 1800, showConfirmButton: false });
        this.showAddPromotionModal = false;
        this.newPromotion = {
          name: "",
          description: "",
          subdescription: "",
          price: 0,
          available_quantity: 1,
          img: "",
          is_savings_bonus: false,
          savings_price: 0,
        };
        await this.load();
      } catch (error) {
        const msg = (error.response && error.response.data && error.response.data.error) || error.message || "No se pudo guardar";
        Swal.fire("Error", msg, "error");
      } finally {
        this.loading = false;
      }
    },

    editPromotionProduct(product) {
      const prod = this.allProducts.find((p) => p.id === product.id) || product;
      this.editingPromotion = {
        id: prod.id,
        code: prod.code || "",
        name: prod.name || "",
        description: prod.description || "",
        subdescription: prod.subdescription || "",
        price: prod.price || 0,
        available_quantity: Number(prod.available_quantity) || 1,
        img: prod.img || "",
        is_savings_bonus: !!prod.is_savings_bonus,
        savings_price: Number(prod.savings_price) || Number(prod.price) || 0,
        promotion_active: prod.promotion_active !== false,
      };
      this.showEditPromotionModal = true;
    },

    closeEditPromotionModal() {
      this.showEditPromotionModal = false;
    },

    async saveEditPromotion() {
      const p = this.editingPromotion;
      if (!p.name || !p.price || !p.available_quantity) {
        return Swal.fire("Error", "Completa los campos obligatorios", "error");
      }

      this.loading = true;
      try {
        await api.products.POST({
          action: "edit",
          id: p.id,
          data: {
            _code: p.code || this.generatePromotionCode(),
            _name: p.name,
            _type: "Promoción",
            _price: Number(p.price),
            _points: 0,
            _weight: 0,
            _img: p.img || "",
            _description: p.description || "",
            _subdescription: p.subdescription || "",
            _plans: {},
            _prices: {},
            is_promotion: true,
            promotion_active: p.promotion_active !== false,
            available_quantity: Number(p.available_quantity),
            catalog_type: "promotion",
            is_savings_bonus: !!p.is_savings_bonus,
            savings_price: p.is_savings_bonus ? Number(p.savings_price) || Number(p.price) : 0,
            savings_description: "",
            savings_img: p.img || "",
          },
        });
        Swal.fire({ icon: "success", title: "Promoción actualizada", timer: 1800, showConfirmButton: false });
        this.closeEditPromotionModal();
        await this.load();
      } catch (error) {
        Swal.fire("Error", "No se pudo actualizar la promoción", "error");
      } finally {
        this.loading = false;
      }
    },

    async togglePromotionActive(product, event) {
      const enabled = event.target.checked;
      this.$set(product, "promotion_active", enabled);
      this.$set(this.promotionToggleLoading, product.id, true);
      try {
        await api.products.POST({
          action: "toggle_promotion_active",
          id: product.id,
          enabled,
        });
      } catch (error) {
        this.$set(product, "promotion_active", !enabled);
        event.target.checked = !enabled;
        Swal.fire("Error", "No se pudo actualizar el estado", "error");
      } finally {
        this.$set(this.promotionToggleLoading, product.id, false);
      }
    },

    async togglePromotionSavings(product, event) {
      const enabled = event.target.checked;
      if (enabled && (!product.savings_price || product.savings_price <= 0)) {
        product.savings_price = product.price || 0;
      }
      this.$set(product, "is_savings_bonus", enabled);
      this.$set(this.promotionToggleLoading, product.id, true);
      try {
        await api.products.POST({
          action: "toggle_promotion_savings",
          id: product.id,
          enabled,
          savings_price: product.savings_price,
        });
      } catch (error) {
        this.$set(product, "is_savings_bonus", !enabled);
        event.target.checked = !enabled;
        Swal.fire("Error", "No se pudo actualizar Bono Ahorro", "error");
      } finally {
        this.$set(this.promotionToggleLoading, product.id, false);
      }
    },

    generateSavingsProductCode() {
      const numericCodes = this.allProducts
        .map((p) => parseInt(String(p.code || "").replace(/\D/g, ""), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      const next = numericCodes.length ? Math.max(...numericCodes) + 1 : 9001;
      return String(next);
    },

    async saveSavingsProduct() {
      if (!this.newSavingsProduct.name || !this.newSavingsProduct.savings_category_id || !this.newSavingsProduct.savings_price) {
        return Swal.fire("Error", "Por favor completa los campos obligatorios (nombre, categoría y precio)", "error");
      }

      const selectedCategory = this.savingsCategories.find(
        (c) => c.id === this.newSavingsProduct.savings_category_id
      );

      this.loading = true;
      try {
        const savingsPrice = Number(this.newSavingsProduct.savings_price) || 0;

        await api.products.POST({
          action: "add",
          data: {
            code: this.generateSavingsProductCode(),
            name: this.newSavingsProduct.name,
            type: selectedCategory ? selectedCategory.name : "",
            savings_category_id: this.newSavingsProduct.savings_category_id,
            description: this.newSavingsProduct.description || "",
            subdescription: "",
            price: savingsPrice,
            points: 0,
            weight: 0,
            img: this.newSavingsProduct.savings_img || "",
            plans: {},
            prices: {},
            is_savings_bonus: true,
            savings_price: savingsPrice,
            savings_description: this.newSavingsProduct.description || "",
            savings_img: this.newSavingsProduct.savings_img || "",
            catalog_type: "savings",
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
        this.activeTab = "savings";
        // Reset form
        this.newSavingsProduct = {
          name: "",
          type: "",
          savings_category_id: null,
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
        const msg =
          (error.response && error.response.data && error.response.data.error) ||
          error.message ||
          "No se pudo guardar el producto";
        Swal.fire("Error", msg, "error");
      } finally {
        this.loading = false;
      }
    },

    openSavingsBonusManager() {
      this.savingsManagerDraft = this.allProducts.map((p) => ({
        ...p,
        plans: { ...(p.plans || {}) },
        prices: { ...(p.prices || {}) },
        is_savings_bonus: !!p.is_savings_bonus,
        savings_price:
          p.savings_price ||
          (p.is_savings_bonus ? p.price : 0) ||
          0,
      }));
      this.showSavingsManager = true;
    },

    normalizeSavingsPrice(product) {
      if (product.is_savings_bonus && (!product.savings_price || product.savings_price <= 0)) {
        product.savings_price = product.price || 0;
      }
      return product;
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

    async toggleSavingsBonus(product, event) {
      if (!product || !product.id) {
        return;
      }

      const enabled = event.target.checked;
      const previous = !enabled;

      this.$set(product, "is_savings_bonus", enabled);
      this.normalizeSavingsPrice(product);
      this.$set(this.savingsToggleLoading, product.id, true);

      try {
        let response = await api.products.POST({
          action: "toggle_savings_bonus",
          id: product.id,
          enabled,
          savings_price: product.savings_price,
        });

        let data = response.data;
        if (data && data.is_savings_bonus === undefined) {
          response = await api.products.POST({
            action: "edit",
            id: product.id,
            data: this.buildProductEditData(product),
          });
          data = {
            is_savings_bonus: enabled,
            savings_price: product.savings_price,
          };
        }

        if (data && data.is_savings_bonus !== undefined) {
          this.$set(product, "is_savings_bonus", !!data.is_savings_bonus);
        }
        if (data && data.savings_price !== undefined) {
          this.$set(product, "savings_price", Number(data.savings_price) || 0);
        }
        if (data && data.savings_category_id !== undefined) {
          this.$set(product, "savings_category_id", data.savings_category_id);
        }

        Swal.fire({
          icon: "success",
          title: enabled ? "Bono Ahorro activado" : "Bono Ahorro desactivado",
          text: enabled
            ? `Precio de canje: S/ ${product.savings_price}`
            : "Ya no aparecerá en la tienda Bono Ahorro",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        this.$set(product, "is_savings_bonus", previous);
        event.target.checked = previous;
        console.error("Error toggling savings bonus:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el estado del producto",
        });
      } finally {
        this.$set(this.savingsToggleLoading, product.id, false);
      }
    },

    async saveSavingsBonusBulk() {
      this.loading = true;
      try {
        const updates = this.savingsManagerDraft.map((p) => {
          this.normalizeSavingsPrice(p);
          return api.products.POST({
            action: "edit",
            id: p.id,
            data: this.buildProductEditData(p),
          });
        });

        await Promise.all(updates);

        this.savingsManagerDraft.forEach((draft) => {
          const syncList = (list) => {
            const idx = list.findIndex((p) => p.id === draft.id);
            if (idx !== -1) {
              this.$set(list[idx], "is_savings_bonus", !!draft.is_savings_bonus);
              this.$set(list[idx], "savings_price", draft.savings_price || 0);
            }
          };
          syncList(this.allProducts);
          syncList(this.products);
        });

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Configuración masiva guardada",
          timer: 1800,
          showConfirmButton: false,
        });
        this.showSavingsManager = false;
        await this.load();
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
      const product = item.raw ? item.raw : item;
      if (action === "edit") {
        if (this.activeTab === "promotions") {
          this.editPromotionProduct(product);
        } else if (this.activeTab === "savings") {
          this.editSavingsProduct(product);
        } else {
          this.editProduct(product);
        }
      } else if (action === "delete") {
        this.deleteProduct(product);
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

    editSavingsProduct(product) {
      const prod =
        this.allProducts.find((p) => p.id === product.id) || product;

      this.editingSavingsProduct = {
        id: prod.id || "",
        code: prod.code || "",
        name: prod.name || "",
        price: prod.price || 0,
        points: prod.points || 0,
        img: prod.img || "",
        plans: prod.plans || {},
        catalog_type:
          prod.catalog_type ||
          (prod.points ? (prod.is_savings_bonus ? "both" : "sifrah") : "savings"),
        savings_price:
          Number(prod.savings_price) > 0
            ? Number(prod.savings_price)
            : Number(prod.price) || 0,
        savings_description: prod.savings_description || "",
        savings_img: prod.savings_img || "",
      };
      this.showEditSavingsModal = true;
    },

    isFromSifrahCatalog(prod) {
      if (!prod) return false;
      if (prod.catalog_type === "savings") return false;
      if (prod.is_promotion) return false;
      if (Number(prod.points) > 0) return true;
      if (prod.catalog_type === "sifrah" || prod.catalog_type === "both") return true;
      const plans = prod.plans || {};
      if (Object.values(plans).some(Boolean)) return true;
      return !!(prod.code && Number(prod.price) > 0);
    },

    savingsCategoryLabel(prod) {
      if (!prod) return "";
      if (prod.savings_category_id) {
        const cat = this.savingsCategories.find(
          (c) => c.id === prod.savings_category_id
        );
        if (cat) return cat.name;
      }
      if (this.isFromSifrahCatalog(prod)) return "Productos SIFRAH";
      return prod.type || "";
    },

    closeEditSavingsModal() {
      this.showEditSavingsModal = false;
    },

    rememberSavingsPrice(product) {
      if (!product || !product.id) return;
      this.$set(
        this.savingsPriceSnapshot,
        product.id,
        Number(product.savings_price) || 0
      );
    },

    async saveSavingsPriceIfChanged(product) {
      if (!product || !product.id) return;

      const previous =
        this.savingsPriceSnapshot[product.id] !== undefined
          ? this.savingsPriceSnapshot[product.id]
          : Number(product.savings_price) || 0;
      const next = Number(product.savings_price) || 0;

      this.$delete(this.savingsPriceSnapshot, product.id);

      if (next === previous) return;

      if (next <= 0) {
        this.$set(product, "savings_price", previous);
        Swal.fire({
          icon: "error",
          title: "Precio inválido",
          text: "El precio de canje debe ser mayor a 0",
        });
        return;
      }

      await this.persistSavingsCatalogFields(product, {
        savings_price: next,
      });
    },

    async saveSavingsCatalogProduct() {
      const price = Number(this.editingSavingsProduct.savings_price) || 0;
      if (price <= 0) {
        return Swal.fire({
          icon: "error",
          title: "Precio inválido",
          text: "El precio de canje debe ser mayor a 0",
        });
      }

      const product = this.allProducts.find(
        (p) => p.id === this.editingSavingsProduct.id
      );
      if (!product) {
        return Swal.fire("Error", "Producto no encontrado", "error");
      }

      this.loading = true;
      try {
        const fields = {
          savings_price: price,
          savings_description: this.editingSavingsProduct.savings_description || "",
        };

        if (this.isFromSifrahCatalog(product)) {
          fields.savings_img = "";
        } else {
          fields.savings_img = this.editingSavingsProduct.savings_img || "";
        }

        await this.persistSavingsCatalogFields(product, fields);
        this.closeEditSavingsModal();
      } finally {
        this.loading = false;
      }
    },

    async persistSavingsCatalogFields(product, fields) {
      this.$set(this.savingsPriceSaving, product.id, true);

      try {
        let response = await api.products.POST({
          action: "update_savings_catalog",
          id: product.id,
          data: fields,
        });

        let data = response.data;
        if (data && data.savings_price === undefined && fields.savings_price !== undefined) {
          const editData = {
            ...this.buildProductEditData(product),
            savings_price: fields.savings_price,
            savings_description:
              fields.savings_description !== undefined
                ? fields.savings_description
                : product.savings_description || "",
            savings_img:
              fields.savings_img !== undefined
                ? fields.savings_img
                : product.savings_img || "",
          };
          await api.products.POST({
            action: "edit",
            id: product.id,
            data: editData,
          });
          data = {
            savings_price: fields.savings_price,
            savings_description: editData.savings_description,
            savings_img: editData.savings_img,
          };
        }

        if (data && data.savings_price !== undefined) {
          this.$set(product, "savings_price", Number(data.savings_price) || 0);
        }
        if (data && data.savings_description !== undefined) {
          this.$set(product, "savings_description", data.savings_description || "");
        }
        if (data && data.savings_img !== undefined) {
          this.$set(product, "savings_img", data.savings_img || "");
        }
        if (data && data.savings_category_id !== undefined) {
          this.$set(product, "savings_category_id", data.savings_category_id);
        }

        Swal.fire({
          icon: "success",
          title: "Precio Bono Ahorro guardado",
          text: `Canje: S/ ${product.savings_price} — Precio SIFRAH sin cambios`,
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error saving savings catalog fields:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo guardar el precio de Bono Ahorro",
        });
        await this.load();
      } finally {
        this.$set(this.savingsPriceSaving, product.id, false);
      }
    },

    editProduct(product) {
      console.log("editProduct", product);
      // Buscar el producto original por id
      let original = null;
      if (!original && product.id) {
        original = this.allProducts.find((p) => p.id === product.id);
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
        is_savings_bonus: !!prod.is_savings_bonus,
        savings_price: prod.savings_price || 0,
        savings_description: prod.savings_description || "",
        savings_img: prod.savings_img || "",
        catalog_type:
          prod.catalog_type ||
          (prod.points ? (prod.is_savings_bonus ? "both" : "sifrah") : "savings"),
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
        this.validationErrors.img = "La imagen del producto es obligatoria.";
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
            is_savings_bonus: !!this.newProduct.is_savings_bonus,
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
        catalog_type: "sifrah",
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
          is_savings_bonus: !!this.editingProduct.is_savings_bonus,
          savings_price: this.editingProduct.savings_price,
          savings_description: this.editingProduct.savings_description,
          savings_img: this.editingProduct.savings_img,
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

.savings-toggle-field {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
}

.savings-price-edit {
  min-width: 120px;
}

.savings-price-edit .input.is-small {
  width: 90px;
}

.sifrah-price-ref {
  color: #6b7280;
  font-size: 0.875rem;
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

.product-order-edit {
  max-width: 72px;
}

.product-order-input {
  text-align: center;
  font-weight: 600;
}

.product-image-preview {
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
