<template>
  <Layout>
    <i class="load" v-if="loading"></i>

    <section v-if="!loading">
      <div class="notification" style="margin-bottom: 0">
        <div class="container">
          <strong>{{ title }}</strong
          >&nbsp;&nbsp;&nbsp;
          <a @click="download" class="button is-small">Descargar Reporte</a>
          <input
            ref="searchInput"
            class="input"
            placeholder="Buscar por nombre, ID o afiliación"
            v-model="search"
            @input="handleSearch"
          />
        </div>
      </div>

      <div class="container">
        <div class="table-container">
          <table class="table is-fullwidth">
            <thead>
              <tr>
                <th>#</th>
                <th>ID Transacción</th>
                <th>Fecha</th>
                <th>Usuario Destino</th>
                <th>Usuario Origen</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Concepto</th>
                <th>ID Afiliación</th>
                <th>Virtual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(transaction, i) in transactions"
                :key="transaction.id"
              >
                <th>{{ totalItems - (currentPage - 1) * itemsPerPage - i }}</th>
                <td>{{ transaction.id }}</td>
                <td>{{ formatDate(transaction.date) }}</td>
                <td>
                  {{ transaction.user_info.name || "" }}
                  {{ transaction.user_info.lastName || "" }}
                  <small class="has-text-grey"
                    >({{ transaction.user_id }})</small
                  >
                </td>
                <td>
                  {{ transaction._user_info.name || "" }}
                  {{ transaction._user_info.lastName || "" }}
                  <small class="has-text-grey"
                    >({{ transaction._user_id }})</small
                  >
                </td>
                <td>
                  <span class="tag is-success" v-if="transaction.type === 'in'">
                    <i class="fas fa-arrow-down mr-1"></i>
                    Ingreso
                  </span>
                  <span
                    class="tag is-danger"
                    v-else-if="transaction.type === 'out'"
                  >
                    <i class="fas fa-arrow-up mr-1"></i>
                    Egreso
                  </span>
                  <span class="tag" v-else>
                    {{ getTransactionTypeName(transaction.type) }}
                  </span>
                  <div class="is-size-7 has-text-grey mt-1">
                    {{ getTransactionTypeName(transaction.name) }}
                  </div>
                </td>
                <td>
                  <span
                    :class="{
                      'has-text-success': transaction.type === 'in',
                      'has-text-danger': transaction.type === 'out',
                    }"
                  >
                    {{ transaction.type === "in" ? "+" : "-" }} s/.
                    {{ parseFloat(transaction.value).toFixed(2) }}
                  </span>
                </td>
                <td>{{ getTransactionTypeName(transaction.name) }}</td>
                <td>{{ transaction.affiliation_id || "-" }}</td>
                <td>{{ transaction.virtual ? "Sí" : "No" }}</td>
                <td>
                  <div class="buttons are-small">
                    <button
                      class="button is-info"
                      @click="openEditModal(transaction)"
                      title="Editar"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="button is-danger"
                      @click="confirmDelete(transaction)"
                      title="Eliminar"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" v-if="!loading">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="pagination-button"
          >
            Anterior
          </button>
          <span class="pagination-info"
            >Página {{ currentPage }} de {{ totalPages }}</span
          >
          <input
            type="number"
            v-model="pageInput"
            @keyup.enter="goToPage"
            min="1"
            :max="totalPages"
            class="pagination-input"
          />
          <button @click="goToPage" class="pagination-button">Ir</button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="pagination-button"
          >
            Siguiente
          </button>
        </div>
      </div>

      <button v-if="showScrollToTop" @click="scrollToTop" class="scroll-to-top">
        <i class="fa-solid fa-arrow-up"></i>
      </button>
    </section>

    <!-- Modal de edición -->
    <div class="modal" :class="{ 'is-active': showEditModal }">
      <div class="modal-background" @click="closeEditModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Editar Transacción</p>
          <button
            class="delete"
            aria-label="close"
            @click="closeEditModal"
          ></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Tipo</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="editingTransaction.type">
                  <option value="in">Ingreso</option>
                  <option value="out">Egreso</option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">Monto</label>
            <div class="control">
              <input
                class="input"
                type="number"
                step="0.01"
                min="0"
                v-model.number="editingTransaction.value"
                placeholder="Ingrese el monto"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">Nombre</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="editingTransaction.name">
                  <option
                    v-for="(label, value) in transactionTypes"
                    :key="value"
                    :value="value"
                  >
                    {{ label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" @click="saveTransaction">
            Guardar
          </button>
          <button class="button" @click="closeEditModal">Cancelar</button>
        </footer>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import XLSX from "xlsx";

export default {
  name: "Transactions",
  components: { Layout },
  data() {
    return {
      title: "Transacciones",
      loading: true,
      transactions: [],
      search: "",
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      totalPages: 1,
      pageInput: 1,
      showScrollToTop: false,
      searchTimeout: null,
      showEditModal: false,
      editingTransaction: {
        id: "",
        type: "",
        value: 0,
        name: "",
      },
      transactionTypes: {
        "standard-register": "Bono Registro Emprendedor",
        "business-register": "Bono Registro Ejecutivo",
        "business-vip-register": "Bono Registro Empresarial",
        collect: "Retiro",
        residual: "Bono Residual",
        objetive: "Bono Logro",
        points: "Bono Compras",
        affiliation: "Afiliación con saldo",
        activation: "Compra con saldo",
        "affiliation bonus": "Bono por afiliación",
        "migration bonus": "Bono por migración",
        "wallet transfer": "Monedero brillante",
        remaining: "Pago Ganancia",
        "closed bonus": "Bono cierre",
        "activation bonnus promo": "Bono compra promoción",
        "closed reset": "Descuento por cierre",
      },
    };
  },
  created() {
    const account = JSON.parse(localStorage.getItem("session"));
    this.$store.commit("SET_ACCOUNT", account);
    this.GET();
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async GET() {
      this.loading = true;

      try {
        // GET data con parámetros de paginación y búsqueda
        const { data } = await api.transaction.GET(
          "all", // filter
          this.$store.state.account, // account
          this.currentPage,
          this.itemsPerPage,
          this.search
        );
        console.log("API Response:", data);

        if (data.error) {
          console.error("API Error:", data.error);
          return;
        }

        this.loading = false;

        // Actualizar datos de paginación
        this.totalItems = data.totalItems;
        this.totalPages = data.totalPages;
        this.currentPage = data.currentPage;
        this.pageInput = data.currentPage;

        // Actualizar transacciones
        this.transactions = data.transactions || [];
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.transactions = [];
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        this.currentPage = 1;
        await this.GET();
        // Mantener el foco en el campo de búsqueda después de la actualización
        this.$nextTick(() => {
          this.$refs.searchInput.focus();
        });
      }, 300);
    },
    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    async previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        await this.GET();
      }
    },
    async nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        await this.GET();
      }
    },
    async goToPage() {
      const page = Math.max(1, Math.min(this.pageInput, this.totalPages));
      this.currentPage = page;
      await this.GET();
    },
    handleScroll() {
      this.showScrollToTop = window.scrollY >= document.body.offsetHeight / 2;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    async download() {
      try {
        const { data } = await api.transaction.GET();

        // Crear el contenido del Excel
        const worksheet = XLSX.utils.json_to_sheet(data.Transactions || []);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

        // Descargar el archivo
        XLSX.writeFile(workbook, "transacciones.xlsx");
      } catch (error) {
        console.error("Error downloading report:", error);
      }
    },
    // Crear nueva transacción
    async createTransaction(transactionData) {
      try {
        await api.transaction.POST({
          action: "add",
          data: transactionData,
        });
        await this.GET(); // Recargar la lista
        return true;
      } catch (error) {
        console.error("Error creating transaction:", error);
        return false;
      }
    },
    // Actualizar transacción existente
    async updateTransaction(id, transactionData) {
      try {
        await api.transaction.POST({
          action: "edit",
          id,
          data: transactionData,
        });
        await this.GET(); // Recargar la lista
        return true;
      } catch (error) {
        console.error("Error updating transaction:", error);
        return false;
      }
    },
    // Eliminar transacción
    async deleteTransaction(id) {
      if (!confirm("¿Estás seguro de que deseas eliminar esta transacción?")) {
        return false;
      }

      try {
        await api.transaction.POST({
          action: "delete",
          id,
        });
        await this.GET(); // Recargar la lista
        return true;
      } catch (error) {
        console.error("Error deleting transaction:", error);
        return false;
      }
    },
    getTransactionTypeName(type) {
      return this.transactionTypes[type] || type;
    },
    openEditModal(transaction) {
      this.editingTransaction = {
        id: transaction.id,
        type: transaction.type,
        value: transaction.value,
        name: transaction.name,
      };
      this.showEditModal = true;
    },
    closeEditModal() {
      this.showEditModal = false;
      this.editingTransaction = {
        id: "",
        type: "",
        value: 0,
        name: "",
      };
    },
    async saveTransaction() {
      try {
        // Asegurar que el valor sea un número decimal
        const value = parseFloat(this.editingTransaction.value);
        if (isNaN(value)) {
          alert("Por favor ingrese un valor numérico válido");
          return;
        }

        // Crear objeto de actualización con los campos modificados
        const updateData = {
          _type: this.editingTransaction.type,
          _value: value, // Enviar como double
          _name: this.editingTransaction.name,
        };

        // Llamar a la API para actualizar
        const response = await api.transaction.POST({
          action: "edit",
          id: this.editingTransaction.id,
          data: updateData,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        this.closeEditModal();
        await this.GET(); // Recargar la lista
      } catch (error) {
        console.error("Error al guardar la transacción:", error);
        alert(
          "Error al guardar la transacción. Por favor, intente nuevamente."
        );
      }
    },
    async confirmDelete(transaction) {
      if (
        confirm(
          `¿Está seguro que desea eliminar la transacción ${transaction.id}?`
        )
      ) {
        try {
          await this.deleteTransaction(transaction.id);
          this.$toast.success("Transacción eliminada correctamente");
        } catch (error) {
          this.$toast.error("Error al eliminar la transacción");
        }
      }
    },
  },
};
</script>

<style scoped>
.table-container {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.pagination-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  margin: 0 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pagination-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-info {
  margin: 0 10px;
  font-weight: bold;
}

.pagination-input {
  width: 50px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 0 5px;
  text-align: center;
}

.scroll-to-top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: inline-block;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
}

.scroll-to-top:hover {
  background-color: #0056b3;
}

.load {
  display: block;
  width: 50px;
  height: 50px;
  margin: 20px auto;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.modal-card {
  max-width: 500px;
  margin: 0 auto;
}

.field {
  margin-bottom: 1rem;
}
</style>
