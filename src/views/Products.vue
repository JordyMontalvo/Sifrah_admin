<template>
  <Layout>
    <i class="load" v-if="loading"></i>

    <section v-if="!loading">
      <div class="notification" style="margin-bottom: 0">
        <div class="container">
          <strong>Productos</strong>
          <button
            class="button is-small is-info"
            style="float: right"
            @click="enableAllPlans"
          >
            Habilitar todos los planes
          </button>
        </div>
      </div>

      <div class="container">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Precios Compra</th>
                <th>Puntos</th>
                <th>Imágen</th>
                <th v-for="plan in plans" :key="plan.id">{{ plan.name }}</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, i) in products" :key="i">
                <th>{{ i + 1 }}</th>
                <!-- Código -->
                <td>
                  <span v-if="!product.edit">{{ product.code }}</span>
                  <input
                    class="input"
                    placeholder="Código"
                    style="max-width: 220px"
                    v-model="product._code"
                    v-if="product.edit"
                  />
                </td>
                <!-- Nombre Producto -->
                <td>
                  <span v-if="!product.edit">{{ product.name }}</span>
                  <input
                    class="input"
                    placeholder="Nombre"
                    style="max-width: 220px"
                    v-model="product._name"
                    v-if="product.edit"
                  />
                </td>
                <!-- Categoría Producto -->
                <td style="width: 200px">
                  <span v-if="!product.edit">{{ product.type }}</span>
                  <input
                    class="input"
                    placeholder="Categoría"
                    style="max-width: 220px"
                    v-model="product._type"
                    v-if="product.edit"
                  />
                </td>

                <td>
                  <span v-if="!product.edit">{{ product.description }}</span>
                  <textarea
                    class="textarea"
                    placeholder="Descripción"
                    style="max-width: 220px"
                    v-model="product._description"
                    v-if="product.edit"
                  ></textarea>
                </td>
                <!-- Precio Producto -->
                <td>
                  <span v-if="!product.edit">{{ product.price }}</span>
                  <div v-if="product.edit">
                    <input
                      class="input"
                      type="number"
                      style="max-width: 80px"
                      v-model.number="product._price"
                    />
                  </div>
                </td>
                <!-- Puntos Producto -->
                <td>
                  <span v-if="!product.edit">{{ product.points }}</span>
                  <div v-if="product.edit">
                    <input
                      class="input"
                      type="number"
                      style="max-width: 80px"
                      v-model.number="product._points"
                    />
                  </div>
                </td>
                <!-- Imágen Producto -->
                <td>
                  <!-- <small v-if="!product.edit">{{ product.img }}</small> -->
                  <small v-if="!product.edit"
                    ><a :href="product.img" target="_blank">link</a></small
                  >
                  <input
                    class="input"
                    placeholder="Imágen"
                    style="max-width: 220px"
                    v-model="product._img"
                    v-if="product.edit"
                  />
                </td>
                <!-- Plan Checkboxes -->
                <td v-for="plan in plans" :key="plan.id">
                  <input
                    type="checkbox"
                    v-model="product._plans[plan.id]"
                    v-if="product.edit"
                  />
                  <span v-else>{{
                    product.plans && product.plans[plan.id] ? "Sí" : "No"
                  }}</span>
                </td>
                <!-- Edit Options -->
                <td v-if="product.edit">
                  <button @click="remove(product)">Eliminar</button>
                  <br /><br />
                  <i
                    class="fa-solid fa-check"
                    style="color: #ccc; cursor: pointer; margin-right: 8px"
                    @click="save(product)"
                  ></i>
                  <i
                    class="fa-solid fa-xmark"
                    style="color: #ccc; cursor: pointer; margin-right: 8px"
                    @click="cancel(product)"
                  ></i>
                </td>
                <td>
                  <i
                    class="fa-regular fa-pen-to-square"
                    style="color: #ccc; cursor: pointer; margin-right: 8px"
                    v-if="!product.edit"
                    @click="edit(product)"
                  ></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br />

      <div class="notification" style="margin-bottom: 0">
        <div class="container">
          <strong>Nuevo producto</strong>
        </div>
      </div>

      <div class="container">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precios Compra</th>
                <th>Puntos</th>
                <th v-for="plan in plans" :key="plan.id">{{ plan.name }}</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <!-- Código Producto -->
                <td>
                  <input
                    class="input"
                    placeholder="Código"
                    style="max-width: 220px"
                    v-model="new_product.code"
                  />
                </td>
                <!-- Nombre Producto -->
                <td>
                  <input
                    class="input"
                    placeholder="Nombre"
                    style="max-width: 220px"
                    v-model="new_product.name"
                  />
                </td>
                <!-- Categoría -->
                <td>
                  <input
                    class="input"
                    placeholder="Categoría"
                    style="max-width: 220px"
                    v-model="new_product.type"
                  />
                </td>
                <!-- Precio Compra -->
                <td>
                  <input
                    class="input"
                    type="number"
                    style="max-width: 80px"
                    v-model.number="new_product.price"
                  />
                </td>
                <!-- Puntos -->
                <td>
                  <input
                    class="input"
                    type="number"
                    style="max-width: 80px"
                    v-model.number="new_product.points"
                  />
                </td>
                <!-- Plan Checkboxes for New Product -->
                <td v-for="plan in plans" :key="plan.id">
                  <input type="checkbox" v-model="new_product.plans[plan.id]" />
                </td>
                <!-- Add -->
                <td>
                  <button class="button is-primary" @click="add">
                    Agregar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br />
    </section>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import api from "@/api";
import lib from "@/lib";

export default {
  components: { Layout },
  data() {
    return {
      loading: false,
      products: [],
      plans: [],
      new_product: {
        price: [],
        aff_price: [],
        plans: {},
      },
    };
  },
  filters: {
    date(val) {
      return new Date(val).toLocaleDateString();
    },
  },
  async created() {
    const account = JSON.parse(localStorage.getItem("session"));
    this.$store.commit("SET_ACCOUNT", account);
    await this.GET();
  },

  methods: {
    async GET() {
      this.loading = true;

      try {
        // GET data
        const { data } = await api.products.GET();
        const plansData = await api.plans.GET();

        this.loading = false;

        this.plans = plansData.data.plans || [];

        // Inicializar los planes del nuevo producto como false
        this.new_product.plans = {};
        this.plans.forEach((plan) => {
          this.new_product.plans[plan.id] = false;
        });

        this.products = data.products.map((el) => (el.code = el.id));

        this.products = data.products.map((p) => ({
          ...p,
          sending: false,
          edit: false,
          _code: "",
          _name: "",
          _type: "",
          _description: "",
          _price: 0,
          _points: 0,
          _img: "",
          _plans: {},
        }));
      } catch (error) {
        console.error("Error loading data:", error);
        this.loading = false;
        this.plans = [];
        this.products = [];
      }
    },

    async remove(product) {
      if (!confirm("¿Está seguro de eliminar este producto?")) {
        return;
      }
      await api.products.POST({
        action: "delete",
        id: product.id,
      });

      location.reload();
    },

    edit(product) {
      product.edit = true;

      product._code = product.code;
      product._name = product.name;
      product._type = product.type;
      product._description = product.description;
      product._price = product.price;
      product._points = product.points;
      product._img = product.img;

      // Initialize _plans with all available plans
      this.plans.forEach((plan) => {
        product._plans[plan.id] =
          (product.plans && product.plans[plan.id]) || false;
      });
    },

    async save(product) {
      await api.products.POST({
        action: "edit",
        id: product.id,
        data: {
          _code: product._code,
          _name: product._name,
          _type: product._type,
          _description: product._description,
          _price: product._price,
          _points: product._points,
          _img: product._img,
          _plans: product._plans,
        },
      });

      product.code = product._code;
      product.name = product._name;
      product.type = product._type;
      product.description = product._description;
      product.price = product._price;
      product.points = product._points;
      product.img = product._img;
      product.plans = { ...product._plans };

      product.edit = false;
    },

    cancel(product) {
      product.edit = false;
    },

    async add() {
      const { code, name, type, price, points, description, plans } =
        this.new_product;

      // Solo enviar los planes que están marcados como true
      const selectedPlans = {};
      this.plans.forEach((plan) => {
        selectedPlans[plan.id] = plans[plan.id] === true;
      });

      await api.products.POST({
        action: "add",
        data: {
          code,
          name,
          type,
          price,
          points,
          description,
          plans: selectedPlans,
        },
      });

      // Reiniciar el formulario
      this.new_product = {
        code: "",
        name: "",
        type: "",
        price: 0,
        points: 0,
        description: "",
        plans: {},
      };
      // Reinicializar los planes como false
      this.plans.forEach((plan) => {
        this.new_product.plans[plan.id] = false;
      });

      location.reload();
    },

    async enableAllPlans() {
      if (
        !confirm(
          "¿Está seguro de habilitar todos los planes para todos los productos?"
        )
      ) {
        return;
      }
      await api.products.POST({
        action: "enable_all_plans",
      });
      location.reload();
    },
  },
};
</script>
