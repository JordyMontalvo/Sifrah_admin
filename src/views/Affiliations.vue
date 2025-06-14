<template>
  <Layout>
    <i class="load" v-if="loading"></i>

    <section v-if="!loading">
      <div class="notification" style="margin-bottom: 0">
        <div class="container">
          <strong>{{ title }}</strong
          >&nbsp;&nbsp;&nbsp;<a @click="download">Descargar Reporte</a>
          <input
            class="input"
            placeholder="Buscar por nombre"
            v-model="search"
            @input="input"
          />
        </div>
      </div>

      <div class="container">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Oficina</th>
                <th>Plan</th>
                <th>Total</th>
                <th>Productos</th>
                <th>Medio de Pago</th>
                <th>Voucher</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(affiliation, i) in affiliations"
                v-show="affiliation.visible"
              >
                <th>{{ totalItems - (currentPage - 1) * itemsPerPage - i }}</th>
                <td>{{ affiliation.date | date }}</td>
                <td>
                  {{ affiliation.name }} {{ affiliation.lastName }} <br />
                  <a>{{ affiliation.dni }}</a> <br />
                  {{ affiliation.phone }}
                </td>
                <td>{{ affiliation.office }}</td>
                <td>
                  <span v-if="affiliation.plan && affiliation.plan.name">
                    {{ affiliation.plan.name }}
                  </span>
                  <br />
                  <span v-if="affiliation.plan && affiliation.plan.amount">
                    ${{ affiliation.plan.amount }}
                  </span>
                  <br />
                  <a
                    :href="`${INVOICE_ROOT}?id=${affiliation.id}`"
                    target="_blank"
                    style="color: gray"
                    v-if="affiliation.status == 'approved'"
                    >boleta</a
                  >
                </td>
                <td style="min-width: 180px">
                  s/. {{ affiliation.plan.amount }}

                  <small v-if="affiliation.remaining != null">
                    <br />
                    <span v-if="affiliation.amounts">
                      saldo: s/.{{ affiliation.amounts[0] }} <br />
                    </span>
                    ganancia: s/.{{ affiliation.plan.pay }} <br />
                    cobrar: s/.{{ Number(affiliation.remaining).toFixed(2) }}
                  </small>

                  <div
                    v-if="affiliation.amounts && affiliation.remaining == null"
                  >
                    <small>no disponible: ${{ affiliation.amounts[0] }}</small>
                    <br />
                    <small>disponible: ${{ affiliation.amounts[1] }}</small>
                    <br />
                    <small>cobrar: ${{ affiliation.amounts[2] }}</small> <br />
                  </div>
                </td>
                <td v-if="!affiliation.products">
                  Productos:
                  <div v-for="group in affiliation.plan.products">
                    <div v-for="product in group.list" v-if="product.total">
                      {{ product.total }} {{ product.name }}
                    </div>
                  </div>
                </td>
                <td v-if="affiliation.products">
                  Productos:
                  <p
                    v-for="product in affiliation.products"
                    v-if="product.total > 0"
                  >
                    {{ product.total }} {{ product.name }}
                  </p>
                </td>
                <td style="min-width: 200px">
                  <span v-if="affiliation.pay_method == 'cash'">Efectivo</span>
                  <div v-if="affiliation.pay_method == 'bank'">
                    <span>Banco</span> <br />
                    <small>Nombre: {{ affiliation.bank }}</small> <br />
                    <small>Fecha: {{ affiliation.voucher_date }}</small> <br />
                    <small>Núm: {{ affiliation.voucher_number }}</small>
                  </div>
                </td>
                <td>
                  <a :href="affiliation.voucher" target="_blank">
                    <img
                      :src="affiliation.voucher"
                      style="max-height: 80px; max-width: 80px"
                    />
                  </a>
                  <span v-if="!affiliation.editing">
                    <button @click="editVoucher(affiliation)">Editar</button>
                  </span>
                  <input
                    v-if="affiliation.editing"
                    v-model="affiliation.newVoucher"
                    placeholder="Nueva URL del voucher"
                  />
                  <button
                    v-if="affiliation.editing"
                    @click="saveVoucher(affiliation)"
                  >
                    Guardar
                  </button>
                </td>
                <td>
                  <span
                    class="has-text-success"
                    v-if="affiliation.status == 'approved'"
                  >
                    {{ affiliation.status | status }}
                  </span>
                  <span
                    class="has-text-danger"
                    v-if="affiliation.status == 'rejected'"
                  >
                    {{ affiliation.status | status }}
                  </span>

                  <i class="load" v-if="affiliation.sending"></i>

                  <div
                    class="buttons"
                    v-if="
                      affiliation.status == 'pending' &&
                      !affiliation.sending &&
                      !sending
                    "
                  >
                    <button
                      class="button is-primary"
                      @click="approve(affiliation)"
                    >
                      Aprobar
                    </button>
                    <button
                      class="button is-danger"
                      @click="reject(affiliation)"
                    >
                      Rechazar
                    </button>
                  </div>

                  <br />
                  <label style="cursor: pointer">
                    <small style="color: gray">entregado: </small>

                    <i
                      class="fa-regular fa-square"
                      style="color: gray"
                      v-if="!affiliation.delivered"
                      @click="check(affiliation)"
                    ></i>

                    <i
                      class="fa-regular fa-square-check"
                      style="color: gray"
                      v-if="affiliation.delivered"
                      @click="uncheck(affiliation)"
                    ></i>
                  </label>
                </td>

                <td
                  v-if="affiliation.status == 'approved' && !affiliation.closed"
                >
                  <i
                    class="fa-solid fa-xmark"
                    style="color: #ccc; cursor: pointer; margin-right: 8px"
                    @click="revert(affiliation)"
                  ></i>
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
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";

const INVOICE_ROOT = process.env.VUE_APP_INVOICE_ROOT;
console.log({ INVOICE_ROOT });

export default {
  components: { Layout },
  data() {
    return {
      affiliations: [],
      loading: true,
      sending: false,
      title: null,
      search: null,
      INVOICE_ROOT,
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      totalPages: 0,
      pageInput: 1,
      showScrollToTop: false,
      searchTimeout: null,
      accounts: [],
    };
  },
  computed: {
    account() {
      return this.$store.state.account;
    },
  },
  filters: {
    status(val) {
      if (val == "approved") return "Aprobada";
      if (val == "pending") return "Pendiente";
      if (val == "rejected") return "Rechazada";
    },
    branch(val) {
      if (val == -1) return "Automático";
      if (val == 0) return "1";
      if (val == 1) return "2";
      if (val == 2) return "3";
    },
    date(val) {
      return new Date(val).toLocaleDateString();
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.GET(to.params.filter);
    next();
  },
  created() {
    const account = JSON.parse(localStorage.getItem("session"));

    this.$store.commit("SET_ACCOUNT", account);

    this.GET(this.$route.params.filter);
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async GET(filter) {
      this.loading = true;

      const data2 = await api.offices.GET();
      console.log({ data2 });
      this.accounts = data2.data.offices;

      const { data } = await api.affiliations.GET({
        filter,
        account: this.account.id,
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.search || undefined,
      });
      console.log({ data });

      this.loading = false;

      if (data.error && data.msg == "invalid filter")
        this.$router.push("affiliations/all");

      this.affiliations = data.affiliations.map((i) => ({
        ...i,
        sending: false,
        visible: true,
        editing: false,
        newVoucher: "",
      }));

      this.totalItems = data.total;
      this.totalPages = data.totalPages;

      this.affiliations.forEach((affiliation) => {
        const office = this.accounts.find((x) => x.id == affiliation.office);
        affiliation.office = office ? office.name : "";
      });

      if (filter == "all") this.title = "Todas las Afiliaciones";
      if (filter == "pending") this.title = "Afiliaciones Pendientes";
    },

    async changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        await this.GET(this.$route.params.filter);
      }
    },

    async nextPage() {
      await this.changePage(this.currentPage + 1);
    },

    async previousPage() {
      await this.changePage(this.currentPage - 1);
    },

    async approve(affiliation) {
      if (!confirm("Desea aprovar la afiliación?")) return;

      this.sending = true;
      affiliation.sending = true;

      let { data } = await api.affiliations.POST({
        action: "approve",
        id: affiliation.id,
      });
      console.log({ data });

      affiliation.sending = false;
      this.sending = false;

      if (data.error && data.msg == "already approved")
        return (affiliation.status = "approved");
      if (data.error && data.msg == "already rejected")
        return (affiliation.status = "rejected");
      if (data.error && data.msg == "token unavailable")
        return alert("No hay tokens disponibles");

      affiliation.status = "approved";
    },
    async reject(affiliation) {
      if (!confirm("Desea rechazar la afiliación?")) return;

      this.sending = true;
      affiliation.sending = true;

      const { data } = await api.affiliations.POST({
        action: "reject",
        id: affiliation.id,
      });
      console.log({ data });

      affiliation.sending = false;
      this.sending = false;

      if (data.error && data.msg == "already approved")
        return (affiliation.status = "approved");
      if (data.error && data.msg == "already rejected")
        return (affiliation.status = "rejected");

      affiliation.status = "rejected";
    },
    input() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(async () => {
        this.currentPage = 1;
        await this.GET(this.$route.params.filter);
      }, 1500);
    },

    async check(affiliation) {
      if (
        !confirm("Seguro que desea marcar entregado? esto no se puede revertir")
      )
        return;
      affiliation.delivered = true;

      const { data } = await api.affiliations.POST({
        action: "check",
        id: affiliation.id,
      });
    },
    async uncheck(affiliation) {
      if (affiliation.delivered) return;
      affiliation.delivered = false;

      const { data } = await api.affiliations.POST({
        action: "uncheck",
        id: affiliation.id,
      });
    },

    async revert(affiliation) {
      if (!confirm("Desea revertir la afiliación?")) return;

      console.log("revert ...");

      const { data } = await api.affiliations.POST({
        action: "revert",
        id: affiliation.id,
      });
      location.reload();
    },

    async download() {
      // Obtener todas las afiliaciones
      const { data } = await api.affiliations.GET({
        filter: this.$route.params.filter,
        page: 1, // Puedes usar la página 1 para obtener todas las afiliaciones
        limit: 1000, // Asegúrate de que el límite sea suficiente para obtener todas las afiliaciones
        search: this.search || undefined,
      });

      let data_xls = [];

      data.affiliations.forEach((a) => {
        let disponible = 0,
          no_disponible = 0;

        if (a.amounts) {
          if (a.remaining == null) {
            no_disponible = a.amounts[0];
            disponible = a.amounts[1];
          } else {
            disponible = a.amounts[0];
          }
        }

        let cash = disponible + no_disponible;

        let pay = 0;

        if (a.amounts) {
          if (a.remaining == null) {
            pay = a.amounts[2];
          } else {
            pay = a.remaining;
          }
        } else {
          pay = a.price;
        }

        let efectivo = 0,
          banco = 0;

        if (!a.pay_method) efectivo = pay;
        if (a.pay_method == "cash") efectivo = pay;
        if (a.pay_method == "bank") banco = pay;

        if (!a.products) {
          data_xls.push({
            ID: a.id,
            "USUARIO (NO. DE CÉDULA)": a.dni,
            "NOMBRES COMPLETOS": a.name + " " + a.lastName,
            "FECHA DE AFILIACIÓN": new Date(a.date).toLocaleDateString(),
            PLAN: a.plan.name,
            "VALOR DEL PLAN": a.plan.amount,
            KASH: cash,
            "SALDO DISPONIBLE DE CASH": disponible,
            "SALDO NO DISPONIBLE DE CASH": no_disponible,
            EFECTIVO: efectivo,
            "FECHA EFECTIVO": new Date(a.date).toLocaleDateString(),
            BANCO: banco,
            "NOMBRE BANCO": a.bank,
            "FECHA VOUCHER ": a.voucher_date
              ? new Date(a.voucher_date).toLocaleDateString()
              : "",
            "NUMERO DE VOUCHER ": a.voucher_number,
            VOUCHER: a.voucher,
            "TOTAL APORTE": cash + pay,
            PRODUCTO: "",
            PRECIO: "",
            ESTATUS: a.status,
            OFICINA: a.office,
            "ENTREGA DE PRODUCTOS": a.delivered,
          });
        } else {
          for (let p of a.products) {
            if (p.total) {
              data_xls.push({
                ID: a.id,
                "USUARIO (NO. DE CÉDULA)": a.dni,
                "NOMBRES COMPLETOS": a.name + " " + a.lastName,
                "FECHA DE AFILIACIÓN": new Date(a.date).toLocaleDateString(),
                PLAN: a.plan.name,
                "VALOR DEL PLAN": a.plan.amount,
                KASH: cash,
                "SALDO DISPONIBLE DE CASH": disponible,
                "SALDO NO DISPONIBLE DE CASH": no_disponible,
                EFECTIVO: efectivo,
                "FECHA EFECTIVO": new Date(a.date).toLocaleDateString(),
                BANCO: banco,
                "NOMBRE BANCO": a.bank,
                "FECHA VOUCHER ": a.voucher_date
                  ? new Date(a.voucher_date).toLocaleDateString()
                  : "",
                "NUMERO DE VOUCHER ": a.voucher_number,
                VOUCHER: a.voucher,
                "TOTAL APORTE": cash + pay,
                PRODUCTO: p.name,
                PRECIO: p.price,
                ESTATUS: a.status,
                OFICINA: a.office,
                "ENTREGA DE PRODUCTOS": a.delivered ? "Entregado" : "Pendiente",
              });
            }
          }
        }
      });

      // Crear la hoja de Excel
      const worksheet = XLSX.utils.json_to_sheet(data_xls);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Afiliaciones");

      // Descargar el archivo
      XLSX.writeFile(workbook, "afiliaciones.xlsx");
    },

    editVoucher(affiliation) {
      console.log("Editando voucher para:", affiliation);
      affiliation.editing = true;
      affiliation.newVoucher = affiliation.voucher;
    },

    async saveVoucher(affiliation) {
      if (!affiliation.newVoucher) return;

      const data = await api.affiliations.POST({
        action: "updateVoucher",
        id: affiliation.id,
        voucher: affiliation.newVoucher,
      });

      if (!data.error) {
        affiliation.voucher = affiliation.newVoucher;
        affiliation.editing = false;
      } else {
        alert("Error al actualizar el voucher");
      }
    },
    handleScroll() {
      this.showScrollToTop = window.scrollY >= document.body.offsetHeight / 2;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    async goToPage() {
      const page = Math.max(1, Math.min(this.pageInput, this.totalPages));
      this.currentPage = page;
      await this.GET(this.$route.params.filter);
    },
  },
};
</script>

<style>
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
</style>
