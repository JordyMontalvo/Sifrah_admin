<template>
  <Layout>
    <section class="users-section">
      <!-- Page Header -->
      <div class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">{{ title }}</h1>
              <p class="page-subtitle">
                Gestiona todos los usuarios del sistema
              </p>
            </div>

            <div class="header-actions">
              <button class="button" @click="openMasterPasswordModal" style="color: #6e62cc; background-color: #f1f2f6; border-color: transparent; font-weight: 600;">
                <span class="icon">
                  <i class="fas fa-key"></i>
                </span>
                <span>Clave Maestra</span>
              </button>

              <router-link to="/reports" class="button is-primary">
                <span class="icon">
                  <i class="fas fa-chart-line"></i>
                </span>
                <span>Ver Analytics</span>
              </router-link>

              <button class="button is-info" @click="exportToExcel">
                <span class="icon">
                  <i class="fas fa-file-excel"></i>
                </span>
                <span>Exportar Excel</span>
              </button>

              <router-link to="/dashboard-config" class="button is-success">
                <span class="icon">
                  <i class="fas fa-cog"></i>
                </span>
                <span>Config. Dashboard</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="container">
        <div class="stats-grid">
          <DashboardCard
            :value="totalBalance"
            label="Saldo Total Disponible"
            icon="fas fa-wallet"
            color="success"
            :show-currency="true"
            :description="`${totalItems} usuarios activos`"
          />

          <DashboardCard
            :value="totalVirtualBalance"
            label="Saldo No Disponible"
            icon="fas fa-lock"
            color="warning"
            :show-currency="true"
            :description="`Saldo pendiente de migración`"
          />

          <DashboardCard
            :value="totalSifrahBalance"
            label="Saldo Sifrah"
            icon="fas fa-gift"
            color="success"
            :show-currency="true"
            :description="`Saldo de Bono Ahorro`"
          />

          <DashboardCard
            :value="totalItems"
            label="Total Usuarios"
            icon="fas fa-users"
            color="primary"
            :description="`Registrados en el sistema`"
          />

          <DashboardCard
            :value="affiliatedTotal"
            label="Usuarios Afiliados"
            icon="fas fa-user-plus"
            color="info"
            :description="`Con plan activo`"
          />
        </div>
      </div>

      <!-- Modern Table -->
      <div class="container">
        <ModernTable
          :data="tableData"
          :columns="tableColumns"
          title="Lista de Usuarios"
          subtitle="Gestiona y edita información de usuarios"
          :actions="tableActions"
          :item-actions="itemActions"
          :show-filters="true"
          :show-pagination="true"
          :server-pagination="true"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          search-placeholder="Buscar por nombre, DNI o email..."
          :filters="tableFilters"
          @action="handleTableAction"
          @item-action="handleItemAction"
          @search="handleSearch"
          @filter="handleFilter"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>

      <!-- Edit User Modal -->
      <div class="modal" :class="{ 'is-active': showEditModal }">
        <div class="modal-background" @click="closeEditModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Editar Usuario</p>
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
                    v-model="editingUser.name"
                    placeholder="Nombre del usuario"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Apellidos</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="editingUser.lastName"
                    placeholder="Apellidos del usuario"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">DNI</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="editingUser.dni"
                    placeholder="DNI del usuario"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Contraseña</label>
                <div class="control">
                  <input
                    class="input"
                    type="password"
                    v-model="editingUser.password"
                    placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Rango</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="editingUser.rank">
                      <option value="none">Ninguno</option>
                      <option value="active">ACTIVO</option>
                      <option value="star">BRONCE</option>
                      <option value="silver">PLATA</option>
                      <option value="gold">ORO</option>
                      <option value="ruby">RUBY</option>
                      <option value="emerald">ESMERALDA</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Puntos</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    step="0.01"
                    v-model.number="editingUser.points"
                    placeholder="Puntos del usuario"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Ciudad</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="editingUser.city"
                    placeholder="Ciudad del usuario"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">DNI de Patrocinador</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    v-model="editingUser.parentDni"
                    placeholder="DNI del patrocinador"
                  />
                </div>
              </div>

              <div class="field">
                <label class="label">Plan</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="editingUser.plan">
                      <option value="basic">EJECUTIVO</option>
                      <option value="standard">DISTRIBUIDOR</option>
                      <option value="master">EMPRESARIO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Puntos de Afiliación</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    step="0.01"
                    v-model.number="editingUser.affiliation_points"
                    placeholder="Puntos de afiliación"
                  />
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-success" @click="saveUser">
              Guardar Cambios
            </button>
            <button class="button" @click="closeEditModal">Cancelar</button>
          </footer>
        </div>
      </div>

      <!-- View User Details Modal -->
      <div class="modal" :class="{ 'is-active': showViewModal }">
        <div class="modal-background" @click="closeViewModal"></div>
        <div class="modal-card" style="max-width: 600px">
          <header
            class="modal-card-head"
            style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            "
          >
            <p class="modal-card-title">Detalles del Usuario</p>
            <button
              class="delete"
              aria-label="close"
              @click="closeViewModal"
            ></button>
          </header>
          <section class="modal-card-body">
            <div class="user-modal-tabs">
              <button
                class="user-modal-tab"
                :class="{ 'is-active': viewTab === 'profile' }"
                @click="viewTab = 'profile'"
              >
                Perfil
              </button>
              <button
                class="user-modal-tab"
                :class="{ 'is-active': viewTab === 'rank_history' }"
                @click="viewTab = 'rank_history'"
              >
                Historial de Rangos
              </button>
            </div>

            <div v-if="viewTab === 'profile'">
            <div
              style="
                display: flex;
                flex-direction: row;
                gap: 32px;
                align-items: flex-start;
              "
            >
              <div
                style="
                  flex: 0 0 140px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                "
              >
                <img
                  :src="
                    viewingUser.photo ||
                    viewingUser.img ||
                    'https://ui-avatars.com/api/?name=' +
                      (viewingUser.name || 'U') +
                      '&background=667eea&color=fff'
                  "
                  alt="Foto de perfil"
                  style="
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    object-fit: cover;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    margin-bottom: 12px;
                  "
                />
                <div
                  style="
                    font-weight: 600;
                    font-size: 1.1rem;
                    text-align: center;
                  "
                >
                  {{ viewingUser.name }} {{ viewingUser.lastName }}
                </div>
                <div
                  style="font-size: 0.95rem; color: #888; text-align: center"
                >
                  {{ getEffectiveRankLabel(viewingUser) }}
                </div>
              </div>
              <div
                style="
                  flex: 1;
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px 24px;
                "
              >
                <div class="field"><b>DNI:</b> {{ viewingUser.dni }}</div>
                <div class="field"><b>Puntos:</b> {{ viewingUser.points }}</div>
                <div class="field"><b>Ciudad:</b> {{ viewingUser.city }}</div>
                <div class="field"><b>País:</b> {{ viewingUser.country }}</div>
                <div class="field"><b>Email:</b> {{ viewingUser.email }}</div>
                <div class="field">
                  <b>Teléfono:</b> {{ viewingUser.phone }}
                </div>
                <div class="field">
                  <b>Fecha de Nacimiento:</b> {{ viewingUser.birthdate }}
                </div>
                <div class="field">
                  <b>Fecha de Registro:</b> {{ viewingUser.date }}
                </div>
                <div class="field" style="grid-column: span 2">
                  <b>Patrocinador:</b>
                  {{
                    viewingUser.parent
                      ? `${viewingUser.parent.name} ${
                          viewingUser.parent.lastName
                        } (DNI: ${viewingUser.parent.dni || ""})`
                      : "N/A"
                  }}
                </div>
                <div class="field">
                  <b>Estado:</b> {{ getUserStatus(viewingUser) }}
                </div>
                <div class="field">
                  <b>Saldo Disponible:</b> S/.
                  {{ Number(viewingUser.balance).toFixed(2) }}
                </div>
                <div class="field">
                  <b>Saldo No Disponible:</b> S/.
                  {{ Number(viewingUser.virtualbalance).toFixed(2) }}
                  <div class="user-cell__balance-row">
                  <b>Saldo Sifrah:</b> S/.
                  {{ Number(viewingUser.sifrahbalance).toFixed(2) }}
                </div>
              </div>
                <div class="field">
                  <b>Plan:</b> {{ getPlanLabel(viewingUser.plan) }}
                </div>
              </div>
            </div>
            </div>

            <div v-else class="rank-history-panel">
              <div class="rank-history-form">
                <div class="field">
                  <label class="label">Rango</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="rankHistoryForm.rank">
                        <option>ACTIVO</option>
                        <option>BRONCE</option>
                        <option>PLATA</option>
                        <option>ORO</option>
                        <option>RUBÍ</option>
                        <option>ESMERALDA</option>
                        <option>DIAMANTE</option>
                        <option>DOBLE DIAMANTE</option>
                        <option>TRIPLE DIAMANTE</option>
                        <option>DIAMANTE IMPERIAL</option>
                        <option>EMBAJADOR SIFRAH</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label class="label">Periodo de cierre</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="rankHistoryForm.period" @change="onPeriodSelect">
                        <option value="" disabled>Seleccionar período...</option>
                        <option
                          v-for="p in availablePeriods"
                          :key="p.key"
                          :value="p.key"
                        >{{ p.key }}</option>
                      </select>
                    </div>
                  </div>
                  <p v-if="!availablePeriods.length" class="help is-warning">
                    No hay cierres guardados en la base de datos.
                  </p>
                </div>
                <div class="field">
                  <button class="button is-primary is-fullwidth" @click="addRankHistoryEntry">
                    Agregar al historial
                  </button>
                </div>
              </div>

              <div class="rank-history-table-wrap">
                <table class="table is-fullwidth is-striped is-hoverable">
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th>Fecha</th>
                      <th>Rango</th>
                      <th style="width: 120px">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="entry in sortedRankHistory"
                      :key="rankHistoryRowKey(entry)"
                    >
                      <td>{{ entry.period || periodFromDate(entry.date) || '-' }}</td>
                      <td>{{ formatDateTime(entry.date) }}</td>
                      <td>{{ entry.rank }}</td>
                      <td>
                        <button
                          type="button"
                          class="button is-small is-danger is-light"
                          title="Eliminar este registro"
                          @click="removeRankHistoryEntry(entry)"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!sortedRankHistory.length">
                      <td colspan="4" style="text-align: center; color: #7a7a7a;">
                        Sin historial registrado
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot" style="justify-content: flex-end">
            <button class="button" @click="closeViewModal">Cerrar</button>
          </footer>
        </div>
      </div>

      <!-- Master Password Modal -->
      <div class="modal" :class="{ 'is-active': showMasterPasswordModal }">
        <div class="modal-background" @click="closeMasterPasswordModal"></div>
        <div class="modal-card" style="max-width: 600px; width: 100%;">
          <header class="modal-card-head" style="background: #f8f9fa; border-bottom: none; padding-bottom: 0;">
            <div>
              <p class="modal-card-title" style="font-weight: 700; color: #2c3e50; font-size: 1.5rem; margin-bottom: 0;">Clave maestra</p>
              <p style="color: #7f8c8d; font-size: 0.9rem;">Cambia la clave maestra que permite ingresar a cualquier cuenta (uso administrativo).</p>
            </div>
          </header>
          <section class="modal-card-body" style="background-color: #f8f9fa;">
            
            <div class="box" style="box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 15px; border-bottom: 1px solid #eee; margin-bottom: 15px;">
                <span style="font-weight: 600; color: #34495e;">Estado</span>
                <span v-if="!masterPasswordStatus.configured" class="tag is-warning" style="font-weight: 600; background-color: #fbd341; color: #8a6d3b;">No configurada (usa la clave legacy)</span>
                <span v-else class="tag is-success" style="font-weight: 600;">Configurada</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600; color: #34495e;">Última actualización</span>
                <span style="color: #7f8c8d; font-weight: 500;">{{ masterPasswordStatus.updated_at ? new Date(masterPasswordStatus.updated_at).toLocaleString() : '—' }}</span>
              </div>
            </div>

            <div class="box" style="padding: 0; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <div style="background: #6e62cc; color: white; padding: 20px; display: flex; align-items: center; gap: 15px;">
                <i class="fas fa-key" style="font-size: 1.5rem; transform: rotate(-45deg);"></i>
                <div>
                  <div style="font-weight: 700; font-size: 1.2rem; margin-bottom: 5px;">Rotar clave maestra</div>
                  <div style="font-size: 0.85rem; opacity: 0.9;">Recomendación: usa una clave larga y única. Al guardarla, la clave anterior dejará de funcionar.</div>
                </div>
              </div>
              
              <div style="padding: 20px;">
                <div class="field">
                  <label class="label" style="font-size: 0.9rem; color: #2c3e50;">Nueva clave</label>
                  <div class="control">
                    <input class="input" type="password" v-model="masterPasswordForm.newPassword" placeholder="Ingresa la nueva clave" />
                  </div>
                </div>
                
                <div class="field">
                  <label class="label" style="font-size: 0.9rem; color: #2c3e50;">Confirmar nueva clave</label>
                  <div class="control">
                    <input class="input" type="password" v-model="masterPasswordForm.confirmPassword" placeholder="Repite la nueva clave" />
                  </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                  <button class="button" style="background: #a9b5f5; color: white; border: none; font-weight: 600; padding-left: 20px; padding-right: 20px;" @click="saveMasterPassword" :class="{ 'is-loading': loadingMasterPassword }">
                    <span class="icon"><i class="fas fa-save"></i></span>
                    <span>Guardar</span>
                  </button>
                  <button class="button" style="background: #f1f2f6; color: #2c3e50; border: none; font-weight: 600;" @click="closeMasterPasswordModal">
                    <span class="icon"><i class="fas fa-undo"></i></span>
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" v-if="loading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando usuarios...</p>
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
import { debounce } from "lodash";
import Swal from "sweetalert2";

export default {
  components: {
    Layout,
    DashboardCard,
    ModernTable,
  },
  data() {
    return {
      users: [],
      allUsers: [],
      loading: true,
      title: null,
      search: null,
      check: false,
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      totalPages: 0,
      totalBalance: 0,
      totalVirtualBalance: 0,
      totalSifrahBalance: 0,
      affiliatedTotal: 0,
      selectedStatus: null,
      selectedBalance: null,

      // Table configuration
      tableColumns: [
        {
          key: "id",
          label: "#",
          sortable: true,
          type: "number",
        },
        {
          key: "date",
          label: "Fecha Registro",
          sortable: true,
          type: "date",
        },
        {
          key: "name",
          label: "Usuario",
          sortable: true,
        },
        {
          key: "rankLabel",
          label: "Rango",
          sortable: false,
        },
        {
          key: "status",
          label: "Estado",
          sortable: true,
          type: "status",
        },
        {
          key: "points",
          label: "Puntos",
          sortable: true,
          type: "number",
        },
        {
          key: "balance",
          label: "Saldo Disponible",
          sortable: true,
          type: "currency",
        },
        {
          key: "virtualbalance",
          label: "No Disponible",
          sortable: true,
          type: "currency",
        },
        {
          key: "sifrahbalance",
          label: "Saldo Sifrah",
          sortable: true,
          type: "currency",
        },
        {
          key: "parent",
          label: "Patrocinador",
          sortable: true,
        },
        {
          key: "country",
          label: "País",
          sortable: true,
        },
        {
          key: "city",
          label: "Ciudad",
          sortable: true,
        },
        {
          key: "planLabel",
          label: "Plan",
          sortable: false,
        },
        {
          key: "affiliation_points",
          label: "Puntos Afiliación",
          sortable: false,
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
          key: "export",
          label: "Exportar",
          icon: "fas fa-download",
          class: "is-success",
        },
      ],
      itemActions: [
        {
          key: "config_dashboard",
          label: "Config. Dashboard",
          icon: "fas fa-cog",
          class: "is-info",
        },
        {
          key: "edit",
          label: "Editar",
          icon: "fas fa-edit",
          class: "is-warning",
        },
        {
          key: "migrate",
          label: "Migrar Saldo",
          icon: "fas fa-exchange-alt",
          class: "is-info",
          condition: (item) => item.virtualbalanceRaw > 0,
        },
        {
          key: "view",
          label: "Ver Detalles",
          icon: "fas fa-eye",
          class: "is-primary",
        },
        {
          key: "delete_activation",
          label: "Eliminar Activación",
          icon: "fas fa-trash",
          class: "is-danger",
          condition: (item) => item.raw && item.raw.activated,
        },
      ],
      tableFilters: [
        {
          key: "status",
          label: "Estado",
          placeholder: "Filtrar por estado",
          options: [
            { value: "registered", label: "Registrado" },
            { value: "affiliated", label: "Afiliado" },
            { value: "active_simple", label: "Activo (simple)" },
            { value: "activated", label: "Activado" },
          ],
        },
        {
          key: "balance",
          label: "Saldo",
          placeholder: "Filtrar por saldo",
          options: [
            { value: "available", label: "Con saldo disponible" },
            { value: "not_available", label: "Sin saldo disponible" },
            { value: "virtual", label: "Saldo no disponible" },
          ],
        },
      ],
      showEditModal: false,
      showViewModal: false,
      showMasterPasswordModal: false,
      loadingMasterPassword: false,
      masterPasswordStatus: {
        configured: false,
        updated_at: null
      },
      masterPasswordForm: {
        newPassword: "",
        confirmPassword: ""
      },
      viewTab: "profile",
      editingUser: {
        name: "",
        lastName: "",
        dni: "",
        password: "",
        rank: "user",
        points: 0,
        city: "",
        parentDni: "",
        plan: "",
        affiliation_points: 0,
      },
      viewingUser: {},
      availablePeriods: [],
      rankHistoryForm: {
        rank: "ACTIVO",
        date: "",
        period: "",
      },
    };
  },
  computed: {
    sortedUsers() {
      return this.users.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    affiliatedUsers() {
      return this.allUsers.filter((user) => user.affiliated);
    },
    tableData() {
      return this.sortedUsers.map((user, index) => ({
        ...user,
        status: user.activated
          ? "activated"
          : user._activated
          ? "active_simple"
          : user.affiliated
          ? "affiliated"
          : "registered",
        parent: user.parent
          ? `${user.parent.name} ${user.parent.lastName} (DNI: ${
              user.parent.dni || ""
            })`
          : "N/A",
        name: `${user.name} ${user.lastName}\nDNI: ${user.dni || ""}\nCel: ${
          user.phone || ""
        }`,
        id:
          this.totalItems - (this.currentPage - 1) * this.itemsPerPage - index,
        balance:
          user.balance != null
            ? `S/. ${Number(user.balance).toFixed(2)}`
            : "S/. 0.00",
        virtualbalance:
          user.virtualbalance != null
            ? `S/. ${Number(user.virtualbalance).toFixed(2)}`
            : "S/. 0.00",
        virtualbalanceRaw:
          user.virtualbalance != null ? Number(user.virtualbalance) : 0,
        sifrahbalance:
          user.sifrahbalance != null
            ? `S/. ${Number(user.sifrahbalance).toFixed(2)}`
            : "S/. 0.00",
        sifrahbalanceRaw:
          user.sifrahbalance != null ? Number(user.sifrahbalance) : 0,
        rankLabel: this.getEffectiveRankLabel(user),
        plan: user.plan || "",
        planLabel: this.getPlanLabel(user.plan),
        affiliation_pointsplan: user.affiliation_pointsplan || 0,
        raw: user,
      }));
    },
    sortedRankHistory() {
      const arr = Array.isArray(this.viewingUser.rank_history)
        ? [...this.viewingUser.rank_history]
        : [];
      return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
  },
  filters: {
    date(val) {
      return new Date(val).toLocaleDateString();
    },
    money(val) {
      if (val == null || isNaN(val)) return "0.00";
      return `S/. ${Number(val).toFixed(2)}`;
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.selectedStatus = null;
    this.selectedBalance = null;
    this.GET(to.params.filter);
    next();
  },
  async created() {
    const account = JSON.parse(localStorage.getItem("session"));
    this.$store.commit("SET_ACCOUNT", account);
    await this.GET(this.$route.params.filter);
    await this.fetchAffiliatedTotal();
    this.debouncedInput = debounce(this.input, 1500);
  },
  methods: {
    async GET() {
      this.loading = true;
      try {
        let filter = this.selectedStatus || this.$route.params.filter || "all";
        let backendFilter = filter;
        let users = [];
        let totalItems = 0;
        let totalPages = 0;
        let totalBalance = 0;
        let totalVirtualBalance = 0;
        let totalSifrahBalance = 0;
        let showAvailable = undefined;
        let showVirtualBalance = undefined;
        if (this.selectedBalance === "available") showAvailable = true;
        if (this.selectedBalance === "not_available") showAvailable = false;
        if (this.selectedBalance === "virtual") showVirtualBalance = true;
        // Si el filtro es 'registered', pide todos y pagina en frontend
        if (filter === "registered") {
          backendFilter = "all";
          const { data } = await api.users.GET({
            filter: backendFilter,
            page: 1,
            limit: 10000,
            search: this.search || undefined,
            showAvailable,
            showVirtualBalance,
          });
          users = (data.users || []).filter(
            (user) =>
              (!user.affiliated ||
                user.affiliated === "false" ||
                user.affiliated === 0) &&
              (!user.activated ||
                user.activated === "false" ||
                user.activated === 0)
          );
          // Filtro de saldo no disponible (saldo = 0)
          if (this.selectedBalance === "not_available") {
            users = users.filter((user) => Number(user.balance) === 0);
          }
          // El filtro de saldo virtual se hace en el backend, no aquí
          totalItems = users.length;
          totalPages = Math.ceil(totalItems / this.itemsPerPage);
          // Paginar en frontend
          const skip = (this.currentPage - 1) * this.itemsPerPage;
          users = users.slice(skip, skip + this.itemsPerPage);
          totalBalance = data.totalBalance || 0;
          totalVirtualBalance = data.totalVirtualBalance || 0;
          totalSifrahBalance = data.totalSifrahBalance || 0;
        } else {
          const { data } = await api.users.GET({
            filter: backendFilter,
            page: this.currentPage,
            limit: this.itemsPerPage,
            search: this.search || undefined,
            showAvailable,
            showVirtualBalance,
          });
          users = data.users || [];
          // Filtro de saldo no disponible (saldo = 0)
          if (this.selectedBalance === "not_available") {
            users = users.filter((user) => Number(user.balance) === 0);
          }
          // El filtro de saldo virtual se hace en el backend, no aquí
          totalItems = data.total || 0;
          totalPages = data.totalPages || 0;
          totalBalance = data.totalBalance || 0;
          totalVirtualBalance = data.totalVirtualBalance || 0;
          totalSifrahBalance = data.totalSifrahBalance || 0;
        }
        // Obtener todos los usuarios para los totales (limit alto)
        const { data: allData } = await api.users.GET({
          page: 1,
          limit: 10000,
        });
        this.allUsers = allData.users || [];
        this.users = users;
        this.totalItems = totalItems;
        this.totalPages = totalPages;
        this.totalBalance = totalBalance;
        this.totalVirtualBalance = totalVirtualBalance;
        this.totalSifrahBalance = totalSifrahBalance;
        if (filter == "all") this.title = "Todos los usuarios";
        if (filter == "affiliated") this.title = "Usuarios Afiliados";
        if (filter == "activated") this.title = "Usuarios Activados";
        if (filter == "registered") this.title = "Usuarios Registrados";
      } catch (error) {
        console.error("Error loading users:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al cargar los usuarios",
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        this.loading = false;
      }
    },

    getUserStatus(user) {
      if (!user) return "-";
      if (user.activated) return "Activado";
      if (user._activated) return "Activo (simple)";
      if (user.affiliated) return "Afiliado";
      return "Registrado";
    },

    handleTableAction(action) {
      switch (action.key) {
        case "refresh":
          this.GET(this.$route.params.filter);
          break;
        case "export":
          this.exportToExcel();
          break;
      }
    },

    handleItemAction({ action, item }) {
      switch (action) {
        case "config_dashboard":
          this.configUserDashboard(item.raw || item);
          break;
        case "edit":
          this.editUser(item.raw || item);
          break;
        case "migrate":
          this.migrateBalance(item.raw || item);
          break;
        case "view":
          this.viewUser(item.raw || item);
          break;
        case "delete_activation":
          this.deleteActivation(item.raw || item);
          break;
      }
    },

    configUserDashboard(user) {
      // Navegar a la página de configuración del dashboard con el userId como query param
      this.$router.push({ 
        path: '/dashboard-config', 
        query: { userId: user.id } 
      });
    },

    handleSearch(query) {
      this.search = query;
      this.currentPage = 1;
      this.GET(this.$route.params.filter);
    },

    handleFilter(filters) {
      this.selectedStatus = filters.status || null;
      this.selectedBalance = filters.balance || null;
      this.currentPage = 1;
      this.GET();
    },

    async handlePageChange(page) {
      console.log("Page changed to:", page);
      this.currentPage = page;
      await this.GET(this.$route.params.filter);
    },

    async handlePageSizeChange(pageSize) {
      console.log("Page size changed to:", pageSize);
      this.itemsPerPage = pageSize;
      this.currentPage = 1;
      await this.GET(this.$route.params.filter);
    },

    editUser(user) {
      this.showEditModal = false; // Forzar cierre previo
      this.$nextTick(() => {
        this.showEditModal = true; // Forzar apertura
      });
      this.editingUser = {
        id: user.id,
        name: user.name || "",
        lastName: user.lastName || "",
        dni: user.dni || "",
        password: "", // Siempre vacío para nueva contraseña
        rank: user.rank || "user",
        points: user.points || 0,
        city: user.city || "",
        parentDni: user.parent && user.parent.dni ? user.parent.dni : "",
        plan: user.plan || "",
        affiliation_points: user.affiliation_points || 0,
      };
    },

    async migrateBalance(user) {
      if (!confirm("¿Desea migrar el saldo no disponible?")) return;


      try {
        // Llamar al API
        const response = await api.users.POST({
          action: "migrate",
          id: user.id,
        });


        // Actualizar el usuario en la lista local
        const oldBalance = user.balance;
        const oldVirtualBalance = user.virtualbalance;
        
        user.balance += user.virtualbalance;
        user.virtualbalance = 0;


        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Saldo migrado exitosamente",
          timer: 1800,
          showConfirmButton: false,
        });
        
        // Recargar datos para verificar cambios reales
        console.log("🔄 Recargando datos de la tabla...");
        await this.GET(this.$route.params.filter);
        console.log("✅ Datos recargados");
      } catch (error) {
        console.error("❌ Error migrating balance:", error);
        console.error("Detalles del error:", (error.response && error.response.data) || error.message);
        
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al migrar saldo: " + ((error.response && error.response.data && error.response.data.msg) || error.message),
          timer: 3000,
          showConfirmButton: false,
        });
      }
    },

    async viewUser(user) {
      this.viewingUser = user;
      this.viewTab = "profile";
      this.rankHistoryForm = {
        rank: user.rank && user.rank !== "none" ? this.getRankLabel(user.rank) : "ACTIVO",
        date: "",
        period: "",
      };
      this.showViewModal = true;
      await this.loadAvailablePeriods();
    },

    async loadAvailablePeriods() {
      try {
        const { data } = await api.Periods.GET();
        const periods = data.periods || [];

        // Lista completa de períodos existentes en DB (YYYY-MM), ordenados desc.
        this.availablePeriods = periods
          .map((p) => ({
            key: p.key || "",
            createdAt: p.createdAt || null,
          }))
          .filter((p) => /^\d{4}-\d{2}$/.test(p.key));

        // Pre-seleccionar el período más reciente
        if (this.availablePeriods.length && !this.rankHistoryForm.period) {
          this.rankHistoryForm.period = this.availablePeriods[0].key;
          this.onPeriodSelect();
        }
      } catch (e) {
        console.error("Error cargando períodos disponibles:", e);
      }
    },

    formatDateTime(value) {
      if (!value) return "-";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleString("es-PE");
    },

    onPeriodSelect() {
      const found = this.availablePeriods.find(
        (p) => p.key === this.rankHistoryForm.period
      );
      if (found) {
        // Para rank_history, el campo date es obligatorio: usamos createdAt del período (o 'ahora' si no existe).
        const d = found.createdAt ? new Date(found.createdAt) : new Date();
        this.rankHistoryForm.date = d.toISOString().slice(0, 16);
      }
    },

    periodFromDate(value) {
      const d = new Date(value || new Date());
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    },

    async input() {
      this.GET(this.$route.params.filter);
    },

    async exportToExcel() {
      try {
        const { data } = await api.users.GET({
          filter: this.$route.params.filter,
          page: 1,
          limit: 1000,
          search: this.search || undefined,
          totalBalance: this.totalBalance,
          totalVirtualBalance: this.totalVirtualBalance,
          showAvailable: this.check,
        });

        const worksheet = XLSX.utils.json_to_sheet(
          data.users.map((user) => ({
            Nombre: user.name,
            Apellido: user.lastName,
            DNI: user.dni,
            Puntos: user.points,
            Saldo: user.balance,
            País: user.country,
            Email: user.email,
            Teléfono: user.phone,
            FechaNacimiento: user.birthdate,
            FechaRegistro: user.date,
            Ciudad: user.city,
          }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
        XLSX.writeFile(workbook, "usuarios.xlsx");

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Archivo exportado exitosamente",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al exportar archivo",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },

    closeEditModal() {
      this.showEditModal = false;
    },

    closeViewModal() {
      this.showViewModal = false;
      this.viewTab = "profile";
    },

    async addRankHistoryEntry() {
      if (!this.viewingUser.id) return;
      try {
        await api.users.POST({
          action: "add_rank_history",
          id: this.viewingUser.id,
          data: {
            rank: this.rankHistoryForm.rank,
            date: this.rankHistoryForm.date,
            period: this.rankHistoryForm.period || this.periodFromDate(this.rankHistoryForm.date),
          },
        });

        const entry = {
          rank: this.rankHistoryForm.rank,
          date: this.rankHistoryForm.date ? new Date(this.rankHistoryForm.date) : new Date(),
          period: this.rankHistoryForm.period || this.periodFromDate(this.rankHistoryForm.date),
          points: 0,
          residual_bonus: 0,
        };

        const current = Array.isArray(this.viewingUser.rank_history)
          ? [...this.viewingUser.rank_history]
          : [];
        current.push(entry);
        this.viewingUser = { ...this.viewingUser, rank_history: current };

        Swal.fire({
          icon: "success",
          title: "Historial actualizado",
          text: "Se agregó el registro de rango correctamente",
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error adding rank history:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo agregar el historial de rango",
          timer: 2200,
          showConfirmButton: false,
        });
      }
    },

    rankHistoryRowKey(entry) {
      const p = entry.period || this.periodFromDate(entry.date) || "";
      const t = new Date(entry.date).getTime();
      return `rh-${entry.rank}-${t}-${p}`;
    },

    sameRankHistoryRow(a, b) {
      if (String(a.rank) !== String(b.rank)) return false;
      if (new Date(a.date).getTime() !== new Date(b.date).getTime()) return false;
      const pa = a.period || this.periodFromDate(a.date);
      const pb = b.period || this.periodFromDate(b.date);
      return pa === pb;
    },

    async removeRankHistoryEntry(entry) {
      const confirmed = await Swal.fire({
        title: "¿Eliminar este registro?",
        html: "Se quitará esta fila del historial de rangos del usuario.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d209b6",
      });
      if (!confirmed.isConfirmed) return;
      if (!this.viewingUser.id) return;
      try {
        await api.users.POST({
          action: "remove_rank_history",
          id: this.viewingUser.id,
          data: {
            rank: entry.rank,
            date: entry.date,
            period: entry.period || this.periodFromDate(entry.date),
          },
        });

        const current = Array.isArray(this.viewingUser.rank_history)
          ? [...this.viewingUser.rank_history]
          : [];
        const i = current.findIndex((e) => this.sameRankHistoryRow(e, entry));
        if (i !== -1) current.splice(i, 1);
        this.viewingUser = { ...this.viewingUser, rank_history: current };

        const uid = this.viewingUser.id;
        const listIdx = this.users.findIndex((u) => u.id === uid);
        if (listIdx !== -1) {
          const u = { ...this.users[listIdx], rank_history: current };
          this.$set(this.users, listIdx, u);
        }

        Swal.fire({
          icon: "success",
          title: "Registro eliminado",
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error removing rank history:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el registro",
          timer: 2200,
          showConfirmButton: false,
        });
      }
    },

    async saveUser() {
      try {
        // Estructura que espera el servidor
        const updateData = {
          _name: this.editingUser.name,
          _lastName: this.editingUser.lastName,
          _dni: this.editingUser.dni || "",
          _password: this.editingUser.password || "",
          _points: this.editingUser.points || 0,
          _rank: this.editingUser.rank || "user",
          city: this.editingUser.city || "",
          _parent_dni: this.editingUser.parentDni || "",
          plan: this.editingUser.plan || "",
          affiliation_points: this.editingUser.affiliation_points || 0,
        };

        // Llamar al API
        await api.users.POST({
          action: "name",
          id: this.editingUser.id,
          data: updateData,
        });

        // Actualizar el usuario en la lista local
        const index = this.users.findIndex((u) => u.id === this.editingUser.id);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            name: this.editingUser.name,
            lastName: this.editingUser.lastName,
            points: this.editingUser.points,
            rank: this.editingUser.rank,
            dni: this.editingUser.dni,
            city: this.editingUser.city,
            parent: {
              ...this.users[index].parent,
              dni: this.editingUser.parentDni,
            },
            plan: this.editingUser.plan,
            planLabel: this.getPlanLabel(this.editingUser.plan),
            affiliation_points: this.editingUser.affiliation_points,
          };
        }

        // Cerrar modal y mostrar éxito
        this.closeEditModal();
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Usuario actualizado correctamente",
          timer: 1800,
          showConfirmButton: false,
        });
        await this.GET(this.$route.params.filter);
      } catch (error) {
        // Si la respuesta es 2xx, mostrar éxito igual
        if (
          error.response &&
          (error.response.status === 200 || error.response.status === 204)
        ) {
          this.closeEditModal();
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Usuario actualizado correctamente",
            timer: 1800,
            showConfirmButton: false,
          });
          await this.GET(this.$route.params.filter);
          return;
        }
        // Si es otro error, mostrar error real
        console.error("Error updating user:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al actualizar el usuario",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },

    async fetchAffiliatedTotal() {
      try {
        const { data } = await api.users.GET({
          filter: "affiliated",
          page: 1,
          limit: 1,
        });
        this.affiliatedTotal = data.total || 0;
      } catch (error) {
        this.affiliatedTotal = 0;
      }
    },

    getRankLabel(val) {
      if (val == "none") return "Ninguno";
      if (val == "active") return "ACTIVO";
      if (val == "star") return "BRONCE";
      if (val == "silver") return "PLATA";
      if (val == "ruby") return "RUBY";
      if (val == "gold") return "ORO";
      if (val == "emerald") return "ESMERALDA";
      return val;
    },

    getEffectiveRankLabel(user) {
      if (!user) return "-";

      // 1) Si existe rank_history, usar el último registro (más reciente).
      const rh = Array.isArray(user.rank_history) ? user.rank_history : [];
      if (rh.length) {
        const last = [...rh].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const r = last && last.rank ? String(last.rank).trim() : "";
        if (r) return r;
      }

      // 2) Fallback al campo rank “actual” (códigos internos).
      return this.getRankLabel(user.rank);
    },

    getPlanLabel(val) {
      if (val === "basic") return "EJECUTIVO";
      if (val === "standard") return "DISTRIBUIDOR";
      if (val === "master") return "EMPRESARIO";
      return val || "";
    },

    async deleteActivation(user) {
      const confirmed = await Swal.fire({
        title: "¿Eliminar activación?",
        text: `¿Seguro que deseas eliminar la activación de ${user.name} ${user.lastName}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!confirmed.isConfirmed) return;
      try {
        await api.users.POST({
          action: "delete_activation",
          id: user.id,
        });
        Swal.fire({
          icon: "success",
          title: "Activación eliminada",
          text: "La activación del usuario ha sido eliminada.",
          timer: 1800,
          showConfirmButton: false,
        });
        await this.GET(this.$route.params.filter);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la activación.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },
    async loadMasterPasswordStatus() {
      try {
        const { data } = await api.generalPassword.GET();
        if (data && !data.error) {
          this.masterPasswordStatus = data.data || { configured: false, updated_at: null };
        }
      } catch (err) {
        console.error("Error cargando status de master password", err);
      }
    },
    async openMasterPasswordModal() {
      this.masterPasswordForm = { newPassword: "", confirmPassword: "" };
      await this.loadMasterPasswordStatus();
      this.showMasterPasswordModal = true;
    },
    closeMasterPasswordModal() {
      this.masterPasswordForm = { newPassword: "", confirmPassword: "" };
      this.showMasterPasswordModal = false;
    },
    async saveMasterPassword() {
      if (!this.masterPasswordForm.newPassword) {
        return Swal.fire("Error", "Debes ingresar una contraseña", "error");
      }
      if (this.masterPasswordForm.newPassword !== this.masterPasswordForm.confirmPassword) {
        return Swal.fire("Error", "Las contraseñas no coinciden", "error");
      }
      
      this.loadingMasterPassword = true;
      try {
        const { data } = await api.generalPassword.POST({ newPassword: this.masterPasswordForm.newPassword });
        if (!data.error) {
          Swal.fire("Éxito", "Clave maestra actualizada correctamente", "success");
          this.masterPasswordForm = { newPassword: "", confirmPassword: "" };
          await this.loadMasterPasswordStatus();
        } else {
          Swal.fire("Error", data.msg || data.error || "No se pudo actualizar", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Error de conexión", "error");
      } finally {
        this.loadingMasterPassword = false;
      }
    }
  },
  watch: {
    showEditModal(val) {
      console.log("showEditModal changed:", val);
    },
  },
};
</script>

<style scoped>
.users-section {
  padding: 0;
}

/* Page Header */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  border-top: 4px solid #3b82f6;
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
}

/* Dark Mode Support */
.dark-mode .page-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.dark-mode .loading-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.dark-mode .loading-content p {
  color: #e2e8f0;
}

.user-modal-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.user-modal-tab {
  border: 1px solid #dfe3ea;
  background: #f8fafc;
  color: #334155;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.user-modal-tab.is-active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
}

.rank-history-panel {
  display: grid;
  grid-template-columns: minmax(240px, 280px) 1fr;
  gap: 16px;
}

.rank-history-table-wrap {
  overflow: auto;
}
</style>
