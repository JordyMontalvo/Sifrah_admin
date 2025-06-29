<template>
  <Layout>
    <div class="banner-management">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando banners...</p>
      </div>

      <!-- Main Content -->
      <section v-else class="banner-section">
        <div class="header">
          <div class="header-content">
            <div class="title-section">
              <h1 class="title">Gestión de Banners</h1>
              <p class="subtitle"><br>
                Administra las imágenes de los banners de la plataforma
              </p>
            </div>
            <div class="header-actions">
              <button
                class="refresh-button"
                @click="refreshBanners"
                :disabled="refreshing"
                title="Actualizar banners"
              >
                <i
                  class="fas fa-sync-alt"
                  :class="{ 'fa-spin': refreshing }"
                ></i>
                <span v-if="!refreshing">Actualizar</span>
                <span v-else>Actualizando...</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Banner Cards -->
        <div class="banner-grid">
          <BannerCard
            v-for="(banner, index) in banners"
            :key="index"
            :banner="banner"
            :position="index + 1"
            :loading="sendingStates[index]"
            @file-selected="onFileSelected"
            @save="saveBanner"
            @error="showErrorMessage"
          />
        </div>
      </section>

      <!-- Toast Component -->
      <Toast ref="toast" />
    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout";
import BannerCard from "@/components/BannerCard.vue";
import Toast from "@/components/Toast.vue";
import api from "@/api";
import lib from "@/lib";

export default {
  name: "BannerManagement",
  components: {
    Layout,
    BannerCard,
    Toast,
  },

  data() {
    return {
      banner: null,
      loading: true,
      sendingStates: [false, false, false],
      refreshing: false,

      // File storage
      selectedFiles: {
        1: null,
        2: null,
        3: null,
      },
    };
  },

  computed: {
    banners() {
      if (!this.banner) return [];

      return [
        {
          id: this.banner.id,
          img: this.banner.img,
          title: "Banner 1",
          description: "Banner principal de la plataforma",
          dimensions: "1920 x 508 px",
        },
        {
          id: this.banner.id,
          img: this.banner.img2,
          title: "Banner 2",
          description: "Banner secundario de la plataforma",
          dimensions: "1920 x 508 px",
        },
        {
          id: this.banner.id,
          img: this.banner.img3,
          title: "Banner 2",
          description: "Banner terciario de la plataforma",
          dimensions: "1920 x 508 px",
        },
      ];
    },
  },

  created() {
    this.initializeSession();
    this.fetchBanners();
  },

  methods: {
    initializeSession() {
      try {
        const account = JSON.parse(localStorage.getItem("session"));
        this.$store.commit("SET_ACCOUNT", account);
      } catch (error) {
        console.error("Error parsing session:", error);
        this.showErrorMessage("Error al cargar la sesión");
      }
    },

    async fetchBanners() {
      try {
        this.loading = true;
        const { data } = await api.promos.GET();
        this.banner = data.banner;
      } catch (error) {
        console.error("Error fetching banners:", error);
        this.showErrorMessage("Error al cargar los banners");
      } finally {
        this.loading = false;
      }
    },

    onFileSelected({ position, file, preview }) {
      this.selectedFiles[position] = file;

      // Update preview in banner data
      const imgKey = position === 1 ? "img" : position === 2 ? "img2" : "img3";
      this.banner[imgKey] = preview;
    },

    async saveBanner(position) {
      const file = this.selectedFiles[position];

      if (!file) {
        this.showErrorMessage(
          "Por favor selecciona una imagen antes de guardar"
        );
        return;
      }

      try {
        this.sendingStates[position - 1] = true;

        const img = await lib.upload(file, file.name, "banner");

        await api.promos.POST({
          id: this.banner.id,
          img,
          pos: position,
        });

        this.showSuccessMessage(`Banner ${position} guardado exitosamente`);
        this.selectedFiles[position] = null; // Clear selected file
      } catch (error) {
        console.error(`Error saving banner ${position}:`, error);
        this.showErrorMessage(`Error al guardar el banner ${position}`);
      } finally {
        this.sendingStates[position - 1] = false;
      }
    },

    showSuccessMessage(message) {
      this.$refs.toast.success(message);
    },

    showErrorMessage(message) {
      this.$refs.toast.error(message);
    },

    async refreshBanners() {
      this.refreshing = true;
      try {
        await this.fetchBanners();
      } catch (error) {
        console.error("Error refreshing banners:", error);
        this.showErrorMessage("Error al actualizar los banners");
      } finally {
        this.refreshing = false;
      }
    },
  },
};
</script>

<style scoped>
.banner-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.banner-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  flex: 1;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 300;
}

.header-actions {
  display: flex;
  align-items: center;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.refresh-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-button i {
  font-size: 1rem;
}

.banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .banner-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .title {
    font-size: 2rem;
  }

  .banner-section {
    padding: 0 0.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .refresh-button {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
