<template>
  <Layout>
    <i class="load" v-if="loading"></i>

    <section v-if="!loading">
      <div class="notification" style="margin-bottom: 0">
        <div class="container">
          <strong style="padding: 10px">{{ title }}</strong>
          <router-link to="/reports" class="button is-primary">
            <span class="icon">
              <i class="fas fa-chart-line"></i>
            </span>
            <span>Ver Analytics</span>
          </router-link>
          <button class="button is-info" @click="exportToExcel">
            Exportar a Excel
          </button>
          <input
            class="input"
            placeholder="Buscar por nombre"
            v-model="search"
            @input="debouncedInput"
          />
          <label for="itemsPerPage">Items por página:</label>
          <select v-model="itemsPerPage" @change="fetchUsers">
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
          <br /><br />

          <small
            >Total disponible: S/.
            {{ Number(totalBalance).toFixed(2) }} &nbsp;&nbsp; / &nbsp;&nbsp;
            Total no disponible:  S/.{{ totalVirtualBalance }}
          </small>
        </div>
      </div>

      <div class="container">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Registro</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Código</th>
                <th>Puntos</th>
                <th>
                  Saldo disponible
                  <input type="checkbox" v-model="check" @change="fetchUsers" />
                </th>
                <th>No Disponible</th>
                <th>Patrocinador</th>
                <th>País</th>
                <th>Ciudad</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(user, i) in sortedUsers"
                :key="user.id"
                v-show="user.visible"
              >
                <th>{{ totalItems - (currentPage - 1) * itemsPerPage - i }}</th>
                <td>{{ user.date | date }}</td>
                <td style="position: relative">
                  <span v-if="!user.edit"
                    >{{ user.name }} {{ user.lastName }}</span
                  >

                  <input
                    class="input"
                    v-model="user._name"
                    placeholder="Nombre"
                    style="max-width: 120px"
                    v-if="user.edit"
                  />
                  <input
                    class="input"
                    v-model="user._lastName"
                    placeholder="Apellido"
                    style="max-width: 120px"
                    v-if="user.edit"
                  />
                  <br />

                  <a v-if="!user.edit">{{ user.dni }}</a>

                  <input
                    class="input"
                    v-model="user._dni"
                    placeholder="Documento"
                    style="max-width: 120px"
                    v-if="user.edit"
                  />

                  <input
                    class="input"
                    v-model="user._password"
                    placeholder="Contraseña"
                    style="max-width: 240px"
                    v-if="user.edit"
                  /><br />

                  <select v-model="user._rank" v-if="user.edit">
                    <option value="none">Ninguno</option>
                    <option value="Bronce">Bronce</option>
                    <option value="Plata">Plata</option>
                    <option value="Oro">Oro</option>
                    <option value="Platino">Platino</option>
                    
                  </select>

                  <div style="position: absolute; top: 8px; right: -15px; gap: 10px; display: flex;flex-direction: column;">
                    <i
                      class="fa-regular fa-pen-to-square"
                      style="color: #ccc; cursor: pointer; margin-right: 8px"
                      v-if="!user.edit"
                      @click="edit(user)"
                    ></i>
                    <i
                      class="fa-solid fa-check"
                      style="color: #ccc; cursor: pointer; margin-right: 8px"
                      v-if="user.edit"
                      @click="save(user)"
                    ></i>
                    <i
                      class="fa-solid fa-xmark"
                      style="color: #ccc; cursor: pointer; margin-right: 8px"
                      v-if="user.edit"
                      @click="cancel(user)"
                    ></i>
                  </div>
                  <br />

                  <p v-if="user.rank">rango: {{ user.rank | _rank }}</p>
                  tel: {{ user.phone }} <br />
                </td>
                <td>
                  <span v-if="user.activated">Activado</span>
                  <span v-else-if="user.affiliated">Afiliado</span>
                  <span v-else>Registrado</span>
                </td>
                <td>{{ user.token }}</td>
                <td>
                  <p v-if="!user.edit">{{ user.points }}</p>

                  <input
                    class="input"
                    v-model="user._points"
                    placeholder="Puntos"
                    style="max-width: 120px"
                    v-if="user.edit"
                  />
                </td>
                <td>
                  <!-- <span v-if="user.balance != 0">
                    {{ user.balance | money }}
                  </span> -->
                  {{ user.balance | money }}
                </td>
                <td>
                  {{ user.virtualbalance | money }} <br />
                  <a v-if="user.virtualbalance > 0" @click="migrate(user)"
                    >migrar saldo</a
                  >
                </td>
                <td>
                  <div v-if="user.parent">
                    {{ user.parent.name }} {{ user.parent.lastName }} <br />

                    <a v-if="!user.edit">{{ user.parent.dni }}</a>

                    <input
                      class="input"
                      v-model="user._parent_dni"
                      placeholder="Documento"
                      style="max-width: 120px"
                      v-if="user.edit"
                    /><br />

                    {{ user.parent.phone }}
                  </div>
                </td>
                <td>{{ user.country }}</td>
                <td>{{ user.city }}</td>
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
          <span class="pagination-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
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

      <button class="scroll-to-top" v-if="showScrollToTop" @click="scrollToTop">
        <i class="fa-solid fa-arrow-up"></i>
      </button>
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import { debounce } from "lodash";

export default {
  components: { Layout },
  data() {
    return {
      users: [],

      loading: true,

      title: null,

      search: null,
      check: false,

      show: false,

      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      totalPages: 0,
      searchTimeout: null,
      totalBalance: 0,
      totalVirtualBalance: 0,
      showScrollToTop: false,
      pageInput: 1,
    };
  },
  computed: {
    sortedUsers() {
      return this.users.sort((a, b) => new Date(b.date) - new Date(a.date)); // Asegúrate de que las fechas estén en un formato correcto
    },
    balance() {
      const ret = this.users.reduce((total, user) => total + user.balance, 0);
      return ret;
    },
    virtualBalance() {
      const ret = this.users.reduce((a, b) => a + Number(b.virtualbalance), 0);

      return ret;
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
    this.GET(to.params.filter);
    next();
  },
  created() {
    const account = JSON.parse(localStorage.getItem("session"));

    this.$store.commit("SET_ACCOUNT", account);

    this.GET(this.$route.params.filter);

    this.debouncedInput = debounce(this.input, 1500);
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async fetchUsers() {
      await this.GET(this.$route.params.filter); // Llama a GET para obtener usuarios
    },
    async GET(filter) {
      this.loading = true;

      // GET data
      const { data } = await api.users.GET({
        filter,
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.search || undefined,
        totalBalance: this.totalBalance,
        totalVirtualBalance: this.totalVirtualBalance,
        showAvailable: this.check,
      });
      console.log({ data });

      this.loading = false;
      // error
      if (data.error && data.msg == "invalid filter")
        this.$router.push("activations/all");

      // success
      this.users = data.users
        .map((i) => ({
          ...i,
          sending: false,
          visible: true,
          edit: false,
          _name: "",
          _lastName: "",
          _dni: "",
          _password: "",
          _parent_dni: "",
          _points: 0,
          _rank: "",
        }))
        .reverse();

      this.totalItems = data.total;
      this.totalPages = data.totalPages;
      this.totalBalance = data.totalBalance;
      this.totalVirtualBalance = data.totalVirtualBalance;
      this.showAvailable = data.showAvailable;

      if (filter == "all") this.title = "Todos los usuarios";
      if (filter == "affiliated") this.title = "Usuarios Afiliados";
      if (filter == "activated") this.title = "Usuarios Activados";
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
    async goToPage() {
      const page = Math.max(1, Math.min(this.pageInput, this.totalPages));
      this.currentPage = page;
      await this.GET(this.$route.params.filter);
    },
    async input() {
      this.GET(this.$route.params.filter);
    },
    input2() {
      console.log({ check });
    },
    async migrate(user) {
      console.log("migrate ..");
      console.log({ user });

      if (!confirm("Desea migrar el saldo no disponible?")) return;

      user.balance += user.virtualbalance;
      user.virtualbalance = 0;

      const { data } = await api.users.POST({ action: "migrate", id: user.id });
      console.log({ data });
    },
    edit(user) {
      user.edit = true;
      if (!user._name) user._name = user.name;
      if (!user._lastName) user._lastName = user.lastName;
      if (!user._dni) user._dni = user.dni;
      if (!user._points) user._points = user.points;

      if (!user._parent_dni) user._parent_dni = user.parent.dni;
      if (!user._rank) user._rank = user.rank;
    },
    async save(user) {
      // post new name
      const { data } = await api.users.POST({
        action: "name",
        id: user.id,
        data: {
          _name: user._name,
          _lastName: user._lastName,
          _dni: user._dni,
          _password: user._password,

          _parent_dni: user._parent_dni,
          _points: user._points,
          _rank: user._rank,
        },
      });

      user.name = user._name;
      user.lastName = user._lastName;
      user.dni = user._dni;
      user.points = user._points;
      user.rank = user._rank;

      user.parent.dni = user._parent_dni;

      user.edit = false;
    },
    cancel(user) {
      user.edit = false;
    },
    handleScroll() {
      this.showScrollToTop = window.scrollY >= document.body.offsetHeight / 2;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    async exportToExcel() {
      // Obtener todos los usuarios
      const { data } = await api.users.GET({
        filter: this.$route.params.filter,
        page: 1, // Puedes usar la página 1 para obtener todos los usuarios
        limit: 1000, // Asegúrate de que el límite sea suficiente para obtener todos los usuarios
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
          cuidad: user.city,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

      XLSX.writeFile(workbook, "usuarios.xlsx");
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
}
.scroll-to-top:hover {
  background-color: #0056b3;
}
.scroll-to-top i {
  font-size: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}
.pagination button {
  margin: 0 5px;
}
</style>
