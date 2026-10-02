<template>
  <Layout>
    <div class="university-page">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando Universidad SIFRAH...</p>
      </div>

      <div v-else class="content-container">
        <!-- Top Header -->
        <header class="page-header">
          <div class="header-main">
            <div>
              <div class="tag is-primary is-light mb-2">
                <i class="fas fa-graduation-cap mr-2"></i> Formación & Capacitación
              </div>
              <h1 class="title is-3 has-text-weight-bold mb-1">Universidad SIFRAH</h1>
              <p class="subtitle is-6 has-text-grey">
                Administra los módulos, clases/videos, miniaturas y materiales educativos para los socios.
              </p>
            </div>
            <div class="header-actions">
              <button class="button is-light" @click="fetchModules" :disabled="refreshing" title="Recargar">
                <span class="icon">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
                </span>
              </button>
              <button class="button is-outlined is-info" @click="seedDefaults" :disabled="saving">
                <span class="icon"><i class="fas fa-magic"></i></span>
                <span>Restablecer Predeterminados</span>
              </button>
              <button class="button is-primary" @click="openModuleModal('create')">
                <span class="icon"><i class="fas fa-folder-plus"></i></span>
                <span>Nuevo Módulo</span>
              </button>
            </div>
          </div>

          <!-- Stats Strip -->
          <div class="stats-strip">
            <div class="stat-item">
              <span class="stat-number">{{ modules.length }}</span>
              <span class="stat-label">Módulos</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">{{ totalVideos }}</span>
              <span class="stat-label">Clases / Videos</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number has-text-success">{{ readyVideosCount }}</span>
              <span class="stat-label">Con Video Listo</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">{{ totalMaterials }}</span>
              <span class="stat-label">Archivos Complementarios</span>
            </div>
          </div>
        </header>

        <!-- Two Column Manager Layout (Inspired by web-cursos) -->
        <div class="manager-layout">
          <!-- Left: Module Sidebar Selector -->
          <aside class="module-sidebar">
            <div class="sidebar-header">
              <h3 class="has-text-weight-bold is-size-6">Módulos del Curso</h3>
              <span class="tag is-rounded is-small">{{ modules.length }}</span>
            </div>

            <div class="module-nav-list">
              <div
                v-for="(mod, idx) in sortedModules"
                :key="mod._id || mod.badge || idx"
                class="module-nav-item"
                :class="{ active: selectedModule && (selectedModule._id === mod._id || selectedModule.badge === mod.badge) }"
                @click="selectModule(mod)"
              >
                <div class="module-theme-indicator" :class="'theme-' + (mod.theme || 'sunset')"></div>
                <div class="module-nav-info">
                  <span class="module-badge-tag">{{ mod.badge }}</span>
                  <strong class="module-nav-title">{{ mod.title }}</strong>
                  <span class="module-nav-meta">
                    {{ (mod.videos || []).length }} clases · {{ (mod.files || []).length }} archivos
                  </span>
                </div>
                <div class="module-nav-actions" @click.stop>
                  <button class="button is-small is-ghost" @click="openModuleModal('edit', mod)" title="Editar Módulo">
                    <i class="fas fa-pen is-size-7"></i>
                  </button>
                  <button class="button is-small is-ghost has-text-danger" @click="confirmDeleteModule(mod)" title="Eliminar Módulo">
                    <i class="fas fa-trash-alt is-size-7"></i>
                  </button>
                </div>
              </div>

              <div v-if="modules.length === 0" class="empty-modules p-4 has-text-centered has-text-grey">
                <i class="fas fa-folder-open is-size-3 mb-2"></i>
                <p>No hay módulos creados aún.</p>
                <button class="button is-small is-primary mt-2" @click="openModuleModal('create')">
                  Crear primer módulo
                </button>
              </div>
            </div>
          </aside>

          <!-- Right: Module Detail & Classes Content -->
          <main class="module-content" v-if="selectedModule">
            <!-- Module Top Banner -->
            <div class="module-hero-card" :class="'theme-' + (selectedModule.theme || 'sunset')">
              <div class="hero-left">
                <span class="hero-badge">{{ selectedModule.badge }}</span>
                <h2 class="hero-title">{{ selectedModule.title }}</h2>
                <p class="hero-lead">{{ selectedModule.lead || 'Sin descripción del módulo.' }}</p>
              </div>
              <div class="hero-right">
                <button class="button is-white is-outlined is-small" @click="openModuleModal('edit', selectedModule)">
                  <span class="icon"><i class="fas fa-edit"></i></span>
                  <span>Editar Info</span>
                </button>
              </div>
            </div>

            <!-- Tabs: Videos vs Materials -->
            <div class="tabs is-boxed mb-4">
              <ul>
                <li :class="{ 'is-active': activeTab === 'videos' }">
                  <a @click="activeTab = 'videos'">
                    <span class="icon is-small"><i class="fas fa-play-circle"></i></span>
                    <span>Clases y Videos ({{ (selectedModule.videos || []).length }})</span>
                  </a>
                </li>
                <li :class="{ 'is-active': activeTab === 'files' }">
                  <a @click="activeTab = 'files'">
                    <span class="icon is-small"><i class="fas fa-file-alt"></i></span>
                    <span>Material Complementario ({{ (selectedModule.files || []).length }})</span>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Tab 1: Clases / Videos -->
            <div v-if="activeTab === 'videos'" class="tab-pane">
              <div class="section-toolbar mb-4">
                <div>
                  <h3 class="title is-5 mb-1">Clases del Módulo</h3>
                  <p class="subtitle is-7 has-text-grey">Configura el video, miniatura, título y duración de cada clase.</p>
                </div>
                <button class="button is-primary" @click="openVideoModal('create')">
                  <span class="icon"><i class="fas fa-plus"></i></span>
                  <span>Añadir Clase / Video</span>
                </button>
              </div>

              <!-- Video List -->
              <div v-if="selectedModule.videos && selectedModule.videos.length > 0" class="videos-grid">
                <div
                  v-for="(vid, vIdx) in selectedModule.videos"
                  :key="vid.id || vid._id || vIdx"
                  class="video-card"
                >
                  <div class="video-thumb-container" :class="'theme-' + (vid.theme || selectedModule.theme || 'sunset')">
                    <img v-if="vid.thumbnail" :src="vid.thumbnail" class="video-thumb-img" alt="miniatura" />
                    <div class="video-thumb-overlay">
                      <button
                        v-if="vid.videoUrl"
                        class="play-circle-btn"
                        @click="previewVideo(vid)"
                        title="Ver video"
                      >
                        <i class="fas fa-play"></i>
                      </button>
                      <span v-else class="no-video-badge">Sin video cargado</span>
                      <span class="video-duration-pill">{{ vid.duration || '--:--' }}</span>
                    </div>
                  </div>

                  <div class="video-card-body">
                    <div class="video-index-badge">Clase {{ vIdx + 1 }}</div>
                    <h4 class="video-card-title">{{ vid.title }}</h4>
                    <p class="video-card-desc">{{ vid.desc || 'Sin descripción específica.' }}</p>

                    <div class="video-status-row">
                      <span v-if="vid.videoUrl" class="tag is-success is-light is-small" title="URL disponible">
                        <i class="fas fa-check-circle mr-1"></i> Video asignado
                      </span>
                      <span v-else class="tag is-warning is-light is-small">
                        <i class="fas fa-exclamation-triangle mr-1"></i> Falta video
                      </span>
                      <span v-if="vid.thumbnail" class="tag is-info is-light is-small" title="Miniatura lista">
                        <i class="fas fa-image mr-1"></i> Miniatura
                      </span>
                    </div>
                  </div>

                  <div class="video-card-footer">
                    <button class="button is-small is-light" @click="previewVideo(vid)" :disabled="!vid.videoUrl">
                      <i class="fas fa-eye mr-1"></i> Ver
                    </button>
                    <button class="button is-small is-primary is-light" @click="openVideoModal('edit', vid)">
                      <i class="fas fa-edit mr-1"></i> Editar
                    </button>
                    <button class="button is-small is-danger is-light" @click="confirmDeleteVideo(vid)">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state-box">
                <i class="fas fa-video-slash is-size-1 has-text-grey-light mb-3"></i>
                <p class="has-text-weight-bold">No hay clases registradas en este módulo</p>
                <p class="is-size-7 has-text-grey mb-3">Añade la primera clase configurando su video y miniatura.</p>
                <button class="button is-primary is-small" @click="openVideoModal('create')">
                  <i class="fas fa-plus mr-1"></i> Añadir Primera Clase
                </button>
              </div>
            </div>

            <!-- Tab 2: Materiales Complementarios -->
            <div v-if="activeTab === 'files'" class="tab-pane">
              <div class="section-toolbar mb-4">
                <div>
                  <h3 class="title is-5 mb-1">Material Complementario</h3>
                  <p class="subtitle is-7 has-text-grey">Guías en PDF, hojas de trabajo o documentos para este módulo.</p>
                </div>
                <button class="button is-primary" @click="openFileModal('create')">
                  <span class="icon"><i class="fas fa-plus"></i></span>
                  <span>Añadir Material</span>
                </button>
              </div>

              <div v-if="selectedModule.files && selectedModule.files.length > 0" class="files-list">
                <div v-for="(file, fIdx) in selectedModule.files" :key="file.id || fIdx" class="file-card-row">
                  <div class="file-icon-box">
                    <i class="fas fa-file-pdf"></i>
                  </div>
                  <div class="file-info-box">
                    <strong class="file-name">{{ file.name }}</strong>
                    <span class="file-meta">{{ file.meta || 'Documento' }}</span>
                  </div>
                  <div class="file-actions-box">
                    <a v-if="file.url" :href="file.url" target="_blank" class="button is-small is-light" title="Descargar / Ver">
                      <i class="fas fa-external-link-alt mr-1"></i> Abrir
                    </a>
                    <button class="button is-small is-light" @click="openFileModal('edit', file)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="button is-small is-danger is-light" @click="confirmDeleteFile(file)">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state-box">
                <i class="fas fa-file-excel is-size-1 has-text-grey-light mb-3"></i>
                <p class="has-text-weight-bold">Sin materiales complementarios</p>
                <p class="is-size-7 has-text-grey mb-3">Sube hojas de trabajo, PDFs o manuales del módulo.</p>
                <button class="button is-primary is-small" @click="openFileModal('create')">
                  <i class="fas fa-plus mr-1"></i> Añadir Material
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- MODAL: GESTIÓN DE CLASE / VIDEO               -->
      <!-- ============================================== -->
      <div v-if="videoModal.active" class="modal-overlay" @click.self="closeVideoModal">
        <div class="modal-dialog is-large">
          <header class="modal-header">
            <h3>{{ videoModal.mode === 'create' ? 'Nueva Clase / Video' : 'Editar Clase / Video' }}</h3>
            <button class="close-btn" @click="closeVideoModal"><i class="fas fa-times"></i></button>
          </header>

          <section class="modal-body">
            <!-- Título y Duración -->
            <div class="columns is-multiline">
              <div class="column is-8">
                <div class="form-group">
                  <label>Título de la Clase *</label>
                  <input
                    type="text"
                    v-model="videoForm.title"
                    class="custom-input"
                    placeholder="Ej: Bienvenido a SIFRAH"
                    required
                  />
                </div>
              </div>
              <div class="column is-4">
                <div class="form-group">
                  <label>Duración (mm:ss)</label>
                  <div class="has-icons-left-input">
                    <input
                      type="text"
                      v-model="videoForm.duration"
                      class="custom-input"
                      placeholder="10:25"
                    />
                    <i class="fas fa-clock icon-input"></i>
                  </div>
                </div>
              </div>

              <div class="column is-12">
                <div class="form-group">
                  <label>Descripción / Resumen de la clase</label>
                  <textarea
                    v-model="videoForm.desc"
                    class="custom-input textarea-input"
                    rows="2"
                    placeholder="Breve explicación de los temas tratados en esta sesión..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: ALOJAMIENTO DEL VIDEO -->
            <div class="content-box-config mb-4">
              <h4 class="config-subtitle">
                <i class="fas fa-film mr-2 has-text-primary"></i> Alojamiento del Video
              </h4>

              <div class="tabs is-toggle is-small mb-3">
                <ul>
                  <li :class="{ 'is-active': videoUploadType === 'upload' }">
                    <a @click="videoUploadType = 'upload'">
                      <i class="fas fa-cloud-upload-alt mr-1"></i> Subir Archivo de Video (MP4)
                    </a>
                  </li>
                  <li :class="{ 'is-active': videoUploadType === 'url' }">
                    <a @click="videoUploadType = 'url'">
                      <i class="fas fa-link mr-1"></i> Pegar URL Directa / CDN / Vimeo / YouTube
                    </a>
                  </li>
                </ul>
              </div>

              <!-- Opción A: Subir Archivo -->
              <div v-if="videoUploadType === 'upload'" class="upload-dropzone">
                <div v-if="uploadingVideo" class="uploading-state">
                  <div class="loading-spinner mb-2"></div>
                  <strong>Subiendo video a Bunny Storage CDN...</strong>
                  <p class="is-size-7 has-text-grey">Por favor espera mientras se procesa y transfiere el archivo.</p>
                </div>
                <div v-else>
                  <label class="dropzone-label">
                    <i class="fas fa-video fa-2x mb-2 has-text-primary"></i>
                    <span>Haz clic para seleccionar o arrastra un video MP4 / WebM</span>
                    <span class="is-size-7 has-text-grey">Recomendado: Formato MP4 H.264 para máxima compatibilidad web/móvil</span>
                    <input type="file" accept="video/mp4,video/webm,video/*" @change="handleVideoFileSelect" hidden />
                  </label>
                  <div v-if="videoForm.videoUrl" class="current-file-preview mt-2">
                    <i class="fas fa-check-circle has-text-success mr-2"></i>
                    <span class="truncate">{{ videoForm.videoUrl }}</span>
                  </div>
                </div>
              </div>

              <!-- Opción B: URL Directa -->
              <div v-else class="form-group">
                <label class="is-size-7">URL del video (https://...)</label>
                <input
                  type="text"
                  v-model="videoForm.videoUrl"
                  class="custom-input"
                  placeholder="https://sifraht.b-cdn.net/university_videos/... o enlace de YouTube/Vimeo"
                  @change="onVideoUrlChange"
                />
              </div>

              <!-- Vista previa inmediata si hay videoUrl -->
              <div v-if="videoForm.videoUrl" class="video-preview-embed mt-3">
                <label class="is-size-7 has-text-weight-bold mb-1 block">Vista Previa de Reproducción:</label>
                <video
                  v-if="isDirectVideo(videoForm.videoUrl)"
                  :src="videoForm.videoUrl"
                  controls
                  class="video-preview-player"
                  @loadedmetadata="onVideoMetadata"
                ></video>
                <iframe
                  v-else-if="videoForm.videoUrl"
                  :src="getEmbedUrl(videoForm.videoUrl)"
                  class="video-preview-player"
                  frameborder="0"
                  allowfullscreen
                ></iframe>
              </div>
            </div>

            <!-- SECCIÓN: MINIATURA (THUMBNAIL) -->
            <div class="content-box-config">
              <h4 class="config-subtitle">
                <i class="fas fa-image mr-2 has-text-primary"></i> Miniatura de la Clase (Portada)
              </h4>

              <div class="tabs is-toggle is-small mb-3">
                <ul>
                  <li :class="{ 'is-active': thumbUploadType === 'upload' }">
                    <a @click="thumbUploadType = 'upload'">
                      <i class="fas fa-upload mr-1"></i> Subir Imagen
                    </a>
                  </li>
                  <li :class="{ 'is-active': thumbUploadType === 'url' }">
                    <a @click="thumbUploadType = 'url'">
                      <i class="fas fa-link mr-1"></i> URL de Imagen
                    </a>
                  </li>
                </ul>
              </div>

              <div class="thumb-upload-flex">
                <!-- Dropzone / Input -->
                <div class="thumb-input-area">
                  <div v-if="thumbUploadType === 'upload'" class="upload-dropzone is-compact">
                    <div v-if="uploadingThumb" class="uploading-state">
                      <div class="loading-spinner-small"></div>
                      <span class="is-size-7">Subiendo miniatura...</span>
                    </div>
                    <label v-else class="dropzone-label">
                      <i class="fas fa-cloud-upload-alt mr-2"></i>
                      <span>Seleccionar imagen (JPG, PNG, WebP)</span>
                      <input type="file" accept="image/*" @change="handleThumbFileSelect" hidden />
                    </label>
                  </div>
                  <div v-else class="form-group">
                    <input
                      type="text"
                      v-model="videoForm.thumbnail"
                      class="custom-input"
                      placeholder="https://.../miniatura.jpg"
                    />
                  </div>
                  <p class="is-size-7 has-text-grey mt-1">
                    Dimensión recomendada: 1280x720 px (16:9). Si se omite, se usará el gradiente temático del módulo.
                  </p>
                </div>

                <!-- Preview Thumbnail Box -->
                <div class="thumb-preview-box">
                  <div v-if="videoForm.thumbnail" class="thumb-img-wrapper">
                    <img :src="videoForm.thumbnail" alt="Preview Miniatura" />
                    <button class="button is-small is-danger thumb-remove-btn" @click="videoForm.thumbnail = ''" title="Quitar">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div v-else class="thumb-placeholder-box" :class="'theme-' + (selectedModule.theme || 'sunset')">
                    <i class="fas fa-image"></i>
                    <span>Sin miniatura</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer class="modal-footer">
            <button class="button is-light" @click="closeVideoModal" :disabled="saving">Cancelar</button>
            <button
              class="button is-primary"
              :class="{ 'is-loading': saving }"
              :disabled="saving || !videoForm.title"
              @click="saveVideo"
            >
              <i class="fas fa-save mr-1"></i>
              <span>{{ videoModal.mode === 'create' ? 'Guardar Clase' : 'Actualizar Clase' }}</span>
            </button>
          </footer>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- MODAL: GESTIÓN DE MÓDULO                      -->
      <!-- ============================================== -->
      <div v-if="moduleModal.active" class="modal-overlay" @click.self="closeModuleModal">
        <div class="modal-dialog">
          <header class="modal-header">
            <h3>{{ moduleModal.mode === 'create' ? 'Nuevo Módulo' : 'Editar Módulo' }}</h3>
            <button class="close-btn" @click="closeModuleModal"><i class="fas fa-times"></i></button>
          </header>

          <section class="modal-body">
            <div class="columns is-multiline">
              <div class="column is-4">
                <div class="form-group">
                  <label>Insignia / Badge *</label>
                  <input type="text" v-model="moduleForm.badge" class="custom-input" placeholder="Ej: Módulo 1" />
                </div>
              </div>
              <div class="column is-8">
                <div class="form-group">
                  <label>Título del Módulo *</label>
                  <input type="text" v-model="moduleForm.title" class="custom-input" placeholder="Ej: Conoce la industria" />
                </div>
              </div>
              <div class="column is-12">
                <div class="form-group">
                  <label>Subtítulo / Lead</label>
                  <textarea v-model="moduleForm.lead" class="custom-input textarea-input" rows="2" placeholder="Breve introducción del objetivo del módulo"></textarea>
                </div>
              </div>
              <div class="column is-6">
                <div class="form-group">
                  <label>Tema de Color / Gradiente</label>
                  <div class="select is-fullwidth">
                    <select v-model="moduleForm.theme">
                      <option value="sunset">Sunset (Naranja / Rosado)</option>
                      <option value="city">City (Azul / Cian)</option>
                      <option value="products">Products (Esmeralda / Verde)</option>
                      <option value="chart">Chart (Índigo / Violeta)</option>
                      <option value="handshake">Handshake (Ámbar / Dorado)</option>
                      <option value="notes">Notes (Púrpura / Lila)</option>
                      <option value="laptop">Laptop (Azul Medianoche)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="column is-3">
                <div class="form-group">
                  <label>Orden</label>
                  <input type="number" v-model.number="moduleForm.order" class="custom-input" min="0" />
                </div>
              </div>
              <div class="column is-3">
                <div class="form-group pt-4">
                  <label class="checkbox">
                    <input type="checkbox" v-model="moduleForm.active" />
                    <span class="ml-2">Módulo Activo</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <footer class="modal-footer">
            <button class="button is-light" @click="closeModuleModal" :disabled="saving">Cancelar</button>
            <button class="button is-primary" :class="{ 'is-loading': saving }" :disabled="saving || !moduleForm.title" @click="saveModule">
              <i class="fas fa-check mr-1"></i>
              <span>{{ moduleModal.mode === 'create' ? 'Crear Módulo' : 'Guardar Cambios' }}</span>
            </button>
          </footer>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- MODAL: GESTIÓN DE MATERIAL COMPLEMENTARIO     -->
      <!-- ============================================== -->
      <div v-if="fileModal.active" class="modal-overlay" @click.self="closeFileModal">
        <div class="modal-dialog">
          <header class="modal-header">
            <h3>{{ fileModal.mode === 'create' ? 'Añadir Material' : 'Editar Material' }}</h3>
            <button class="close-btn" @click="closeFileModal"><i class="fas fa-times"></i></button>
          </header>

          <section class="modal-body">
            <div class="form-group mb-3">
              <label>Nombre del Material *</label>
              <input type="text" v-model="fileForm.name" class="custom-input" placeholder="Ej: Guía de bienvenida en PDF" />
            </div>

            <div class="form-group mb-3">
              <label>Metadatos / Formato</label>
              <input type="text" v-model="fileForm.meta" class="custom-input" placeholder="Ej: PDF · 4.2 MB" />
            </div>

            <div class="form-group mb-3">
              <label>Archivo o Enlace</label>
              <div class="upload-dropzone is-compact mb-2">
                <div v-if="uploadingFile" class="uploading-state">
                  <div class="loading-spinner-small"></div>
                  <span class="is-size-7">Subiendo archivo...</span>
                </div>
                <label v-else class="dropzone-label">
                  <i class="fas fa-file-upload mr-2"></i>
                  <span>Subir PDF / Documento</span>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" @change="handleMaterialFileSelect" hidden />
                </label>
              </div>
              <input type="text" v-model="fileForm.url" class="custom-input" placeholder="https://..." />
            </div>
          </section>

          <footer class="modal-footer">
            <button class="button is-light" @click="closeFileModal" :disabled="saving">Cancelar</button>
            <button class="button is-primary" :class="{ 'is-loading': saving }" :disabled="saving || !fileForm.name" @click="saveFile">
              <span>Guardar Material</span>
            </button>
          </footer>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- MODAL: REPRODUCTOR DE VIDEO (PREVIEW)         -->
      <!-- ============================================== -->
      <div v-if="previewModal.active" class="modal-overlay" @click.self="closePreview">
        <div class="modal-dialog is-video-player">
          <header class="modal-header video-player-header">
            <div>
              <span class="tag is-primary is-light is-small">{{ previewModal.video.duration || 'Clase' }}</span>
              <strong class="ml-2 has-text-white">{{ previewModal.video.title }}</strong>
            </div>
            <button class="close-btn is-white" @click="closePreview"><i class="fas fa-times"></i></button>
          </header>
          <div class="video-player-container">
            <video
              v-if="isDirectVideo(previewModal.video.videoUrl)"
              :src="previewModal.video.videoUrl"
              :poster="previewModal.video.thumbnail"
              controls
              autoplay
              class="full-video-player"
            ></video>
            <iframe
              v-else
              :src="getEmbedUrl(previewModal.video.videoUrl)"
              frameborder="0"
              allowfullscreen
              class="full-video-player"
            ></iframe>
          </div>
          <div class="video-player-meta p-4 has-background-white">
            <p class="has-text-grey is-size-7">{{ previewModal.video.desc || 'Clase de Universidad SIFRAH' }}</p>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <Toast ref="toast" />
    </div>
  </Layout>
</template>

<script>
import Layout from "./Layout.vue";
import Toast from "@/components/Toast.vue";
import api from "@/api";
import lib from "@/lib";

export default {
  name: "University",
  components: { Layout, Toast },
  data() {
    return {
      loading: true,
      refreshing: false,
      saving: false,
      modules: [],
      selectedModule: null,
      activeTab: "videos",

      // Subida de archivos
      uploadingVideo: false,
      uploadingThumb: false,
      uploadingFile: false,
      videoUploadType: "upload",
      thumbUploadType: "upload",

      // Modal Módulo
      moduleModal: {
        active: false,
        mode: "create",
      },
      moduleForm: {
        _id: null,
        badge: "Módulo 0",
        title: "",
        lead: "",
        theme: "sunset",
        order: 0,
        active: true,
      },

      // Modal Video
      videoModal: {
        active: false,
        mode: "create",
      },
      videoForm: {
        id: null,
        title: "",
        desc: "",
        videoUrl: "",
        thumbnail: "",
        duration: "00:00",
        order: 0,
      },

      // Modal File
      fileModal: {
        active: false,
        mode: "create",
      },
      fileForm: {
        id: null,
        name: "",
        meta: "",
        url: "",
      },

      // Preview Modal
      previewModal: {
        active: false,
        video: null,
      },
    };
  },
  computed: {
    sortedModules() {
      return [...this.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    totalVideos() {
      return this.modules.reduce((acc, m) => acc + ((m.videos || []).length), 0);
    },
    readyVideosCount() {
      return this.modules.reduce(
        (acc, m) => acc + (m.videos || []).filter((v) => !!v.videoUrl).length,
        0
      );
    },
    totalMaterials() {
      return this.modules.reduce((acc, m) => acc + ((m.files || []).length), 0);
    },
  },
  async mounted() {
    await this.fetchModules();
  },
  methods: {
    async fetchModules() {
      this.refreshing = true;
      try {
        const res = await api.university.GET();
        if (res.data && res.data.modules) {
          this.modules = res.data.modules;
          if (this.modules.length > 0) {
            // Mantener el módulo seleccionado o seleccionar el primero
            if (this.selectedModule) {
              const found = this.modules.find(
                (m) =>
                  (m._id && m._id === this.selectedModule._id) ||
                  m.badge === this.selectedModule.badge
              );
              this.selectedModule = found || this.modules[0];
            } else {
              this.selectedModule = this.modules[0];
            }
          } else {
            this.selectedModule = null;
          }
        }
      } catch (err) {
        console.error("Error cargando módulos de universidad:", err);
        if (this.$refs.toast) this.$refs.toast.error("Error al cargar los módulos");
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },

    selectModule(mod) {
      this.selectedModule = mod;
    },

    async seedDefaults() {
      if (!confirm("¿Deseas sincronizar los módulos predeterminados de la Universidad SIFRAH?")) return;
      this.saving = true;
      try {
        const res = await api.university.POST({ action: "seed-defaults" });
        if (res.data && res.data.modules) {
          this.modules = res.data.modules;
          this.selectedModule = this.modules[0];
          this.$refs.toast.success("Módulos sincronizados con éxito");
        }
      } catch (err) {
        this.$refs.toast.error("Error al sincronizar módulos");
      } finally {
        this.saving = false;
      }
    },

    // --- MÓDULOS ---
    openModuleModal(mode, mod = null) {
      this.moduleModal.mode = mode;
      if (mode === "edit" && mod) {
        this.moduleForm = {
          _id: mod._id,
          badge: mod.badge,
          title: mod.title,
          lead: mod.lead || "",
          theme: mod.theme || "sunset",
          order: mod.order || 0,
          active: mod.active !== false,
        };
      } else {
        const count = this.modules.length;
        this.moduleForm = {
          _id: null,
          badge: `Módulo ${count}`,
          title: "",
          lead: "",
          theme: "sunset",
          order: count,
          active: true,
        };
      }
      this.moduleModal.active = true;
    },
    closeModuleModal() {
      this.moduleModal.active = false;
    },
    async saveModule() {
      if (!this.moduleForm.title) {
        this.$refs.toast.error("El título es obligatorio");
        return;
      }
      this.saving = true;
      try {
        const action = this.moduleModal.mode === "create" ? "create-module" : "update-module";
        const id = this.moduleForm._id;
        await api.university.POST({
          action,
          id,
          data: this.moduleForm,
        });
        this.$refs.toast.success(
          this.moduleModal.mode === "create" ? "Módulo creado" : "Módulo actualizado"
        );
        this.closeModuleModal();
        await this.fetchModules();
      } catch (err) {
        this.$refs.toast.error("Error al guardar módulo: " + (err.message || ""));
      } finally {
        this.saving = false;
      }
    },
    async confirmDeleteModule(mod) {
      if (!confirm(`¿Eliminar el "${mod.badge} - ${mod.title}" y todas sus clases?`)) return;
      try {
        await api.university.POST({
          action: "delete-module",
          id: mod._id,
        });
        this.$refs.toast.success("Módulo eliminado");
        await this.fetchModules();
      } catch (err) {
        this.$refs.toast.error("Error al eliminar módulo");
      }
    },

    // --- CLASES / VIDEOS ---
    openVideoModal(mode, vid = null) {
      this.videoModal.mode = mode;
      this.videoUploadType = vid && vid.videoUrl && !vid.videoUrl.includes("sifraht.b-cdn.net") ? "url" : "upload";
      this.thumbUploadType = vid && vid.thumbnail && !vid.thumbnail.includes("sifraht.b-cdn.net") ? "url" : "upload";

      if (mode === "edit" && vid) {
        this.videoForm = {
          id: vid.id || vid._id,
          title: vid.title,
          desc: vid.desc || "",
          videoUrl: vid.videoUrl || "",
          thumbnail: vid.thumbnail || "",
          duration: vid.duration || "00:00",
          order: typeof vid.order === "number" ? vid.order : 0,
        };
      } else {
        const currentCount = (this.selectedModule.videos || []).length;
        this.videoForm = {
          id: null,
          title: "",
          desc: "",
          videoUrl: "",
          thumbnail: "",
          duration: "00:00",
          order: currentCount,
        };
      }
      this.videoModal.active = true;
    },
    closeVideoModal() {
      this.videoModal.active = false;
    },

    async handleVideoFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name;
      const mimeType = file.type || "video/mp4";
      const blobUrl = URL.createObjectURL(file);

      // Auto-detectar duración del archivo local
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.src = blobUrl;
      tempVideo.onloadedmetadata = () => {
        const sec = Math.floor(tempVideo.duration);
        const mm = Math.floor(sec / 60).toString().padStart(2, "0");
        const ss = (sec % 60).toString().padStart(2, "0");
        this.videoForm.duration = `${mm}:${ss}`;
      };

      try {
        this.uploadingVideo = true;
        const resp = await fetch(blobUrl);
        const buffer = await resp.arrayBuffer();
        const uploadedUrl = await lib.uploadBuffer(buffer, fileName, mimeType, "university_videos");
        this.videoForm.videoUrl = uploadedUrl;
        this.$refs.toast.success("Video subido exitosamente a Bunny CDN");
      } catch (err) {
        console.error("Error subiendo video:", err);
        this.$refs.toast.error("Error al subir video: " + (err.message || ""));
      } finally {
        this.uploadingVideo = false;
        URL.revokeObjectURL(blobUrl);
      }
    },

    async handleThumbFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name;
      const mimeType = file.type || "image/jpeg";
      const blobUrl = URL.createObjectURL(file);

      try {
        this.uploadingThumb = true;
        const resp = await fetch(blobUrl);
        const buffer = await resp.arrayBuffer();
        const uploadedUrl = await lib.uploadBuffer(buffer, fileName, mimeType, "university_thumbs");
        this.videoForm.thumbnail = uploadedUrl;
        this.$refs.toast.success("Miniatura subida exitosamente");
      } catch (err) {
        console.error("Error subiendo miniatura:", err);
        this.$refs.toast.error("Error al subir miniatura: " + (err.message || ""));
      } finally {
        this.uploadingThumb = false;
        URL.revokeObjectURL(blobUrl);
      }
    },

    onVideoUrlChange() {
      if (this.videoForm.videoUrl && this.isDirectVideo(this.videoForm.videoUrl)) {
        const temp = document.createElement("video");
        temp.src = this.videoForm.videoUrl;
        temp.onloadedmetadata = () => {
          const sec = Math.floor(temp.duration);
          const mm = Math.floor(sec / 60).toString().padStart(2, "0");
          const ss = (sec % 60).toString().padStart(2, "0");
          this.videoForm.duration = `${mm}:${ss}`;
        };
      }
    },
    onVideoMetadata(e) {
      const sec = Math.floor(e.target.duration);
      if (!isNaN(sec) && sec > 0) {
        const mm = Math.floor(sec / 60).toString().padStart(2, "0");
        const ss = (sec % 60).toString().padStart(2, "0");
        this.videoForm.duration = `${mm}:${ss}`;
      }
    },

    async saveVideo() {
      if (!this.videoForm.title) {
        this.$refs.toast.error("El título de la clase es obligatorio");
        return;
      }
      this.saving = true;
      try {
        await api.university.POST({
          action: "save-video",
          moduleId: this.selectedModule._id,
          data: this.videoForm,
        });
        this.$refs.toast.success("Clase guardada exitrosumante");
        this.closeVideoModal();
        await this.fetchModules();
      } catch (err) {
        this.$refs.toast.error("Error al guardar clase: " + (err.message || ""));
      } finally {
        this.saving = false;
      }
    },

    async confirmDeleteVideo(vid) {
      if (!confirm(`¿Eliminar la clase "${vid.title}"?`)) return;
      try {
        await api.university.POST({
          action: "delete-video",
          moduleId: this.selectedModule._id,
          data: { videoId: vid.id || vid._id },
        });
        this.$refs.toast.success("Clase eliminada");
        await this.fetchModules();
      } catch (err) {
        this.$refs.toast.error("Error al eliminar clase");
      }
    },

    // --- MATERIALES ---
    openFileModal(mode, file = null) {
      this.fileModal.mode = mode;
      if (mode === "edit" && file) {
        this.fileForm = {
          id: file.id || file._id,
          name: file.name,
          meta: file.meta || "PDF",
          url: file.url || "",
        };
      } else {
        this.fileForm = {
          id: null,
          name: "",
          meta: "PDF",
          url: "",
        };
      }
      this.fileModal.active = true;
    },
    closeFileModal() {
      this.fileModal.active = false;
    },
    async handleMaterialFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = file.name;
      const mimeType = file.type || "application/pdf";
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const ext = fileName.split(".").pop().toUpperCase();
      this.fileForm.meta = `${ext} · ${sizeMB} MB`;
      if (!this.fileForm.name) this.fileForm.name = fileName.replace(/\.[^/.]+$/, "");

      const blobUrl = URL.createObjectURL(file);
      try {
        this.uploadingFile = true;
        const resp = await fetch(blobUrl);
        const buffer = await resp.arrayBuffer();
        const uploadedUrl = await lib.uploadBuffer(buffer, fileName, mimeType, "university_materials");
        this.fileForm.url = uploadedUrl;
        this.$refs.toast.success("Archivo subido con éxito");
      } catch (err) {
        this.$refs.toast.error("Error al subir archivo: " + (err.message || ""));
      } finally {
        this.uploadingFile = false;
        URL.revokeObjectURL(blobUrl);
      }
    },
    async saveFile() {
      if (!this.fileForm.name) {
        this.$refs.toast.error("El nombre del archivo es requerido");
        return;
      }
      this.saving = true;
      try {
        await api.university.POST({
          action: "save-file",
          moduleId: this.selectedModule._id,
          data: this.fileForm,
        });
        this.$refs.toast.success("Material guardado");
        this.closeFileModal();
        await this.fetchModules();
      } catch (err) {
        this.$refs.toast.error("Error al guardar material");
      } finally {
        this.saving = false;
      }
    },
    async confirmDeleteFile(file) {
      if (!confirm(`¿Eliminar "${file.name}"?`)) return;
      try {
        await api.university.POST({
          action: "delete-file",
          moduleId: this.selectedModule._id,
          data: { fileId: file.id || file._id },
        });
        this.$refs.toast.success("Material eliminado");
        await this.fetchModules();
      } catch (err) {
        this.$refs.toast.error("Error al eliminar material");
      }
    },

    // --- REPRODUCTOR / HELPERS ---
    previewVideo(vid) {
      this.previewModal.video = vid;
      this.previewModal.active = true;
    },
    closePreview() {
      this.previewModal.active = false;
      this.previewModal.video = null;
    },
    isDirectVideo(url) {
      if (!url) return false;
      return (
        url.endsWith(".mp4") ||
        url.endsWith(".webm") ||
        url.endsWith(".m4v") ||
        url.includes("b-cdn.net") ||
        url.includes("storage.bunnycdn.com")
      );
    },
    getEmbedUrl(url) {
      if (!url) return "";
      // YouTube
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
      }
      // Vimeo
      const vmMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
      if (vmMatch) {
        return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`;
      }
      return url;
    },
  },
};
</script>

<style scoped>
.university-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 1.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}
.loading-spinner-small {
  width: 22px;
  height: 22px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.page-header {
  background: white;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  margin-bottom: 1.5rem;
}
.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stats-strip {
  display: flex;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
  gap: 1.5rem;
  overflow-x: auto;
}
.stat-item {
  display: flex;
  flex-direction: column;
}
.stat-number {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.1;
}
.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: #e2e8f0;
}

/* Two-column layout */
.manager-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 960px) {
  .manager-layout {
    grid-template-columns: 1fr;
  }
}

/* Sidebar Module Selector */
.module-sidebar {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  overflow: hidden;
}
.sidebar-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.module-nav-list {
  padding: 0.5rem;
  max-height: 75vh;
  overflow-y: auto;
}
.module-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.4rem;
  background: #f8fafc;
  border: 1px solid transparent;
}
.module-nav-item:hover {
  background: #f1f5f9;
  transform: translateX(2px);
}
.module-nav-item.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}
.module-theme-indicator {
  width: 8px;
  height: 38px;
  border-radius: 4px;
  margin-right: 0.85rem;
  flex-shrink: 0;
}
.module-nav-info {
  flex: 1;
  min-width: 0;
}
.module-badge-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  display: block;
}
.module-nav-title {
  font-size: 0.9rem;
  color: #1e293b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.module-nav-meta {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
}
.module-nav-actions {
  display: flex;
  opacity: 0.7;
}
.module-nav-item:hover .module-nav-actions {
  opacity: 1;
}

/* Module Content Area */
.module-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  padding: 1.75rem;
}

/* Hero Card */
.module-hero-card {
  padding: 1.5rem 1.75rem;
  border-radius: 14px;
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.hero-badge {
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(4px);
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-block;
  margin-bottom: 0.4rem;
}
.hero-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 0.3rem;
  color: white;
}
.hero-lead {
  font-size: 0.9rem;
  opacity: 0.92;
  max-width: 600px;
}

/* Themes colors matching app Tools.vue */
.theme-sunset { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); }
.theme-city { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); }
.theme-products { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.theme-chart { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
.theme-handshake { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.theme-notes { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); }
.theme-laptop { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); }

.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Video Grid */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}
.video-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}
.video-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
}
.video-thumb-container {
  height: 150px;
  position: relative;
  background: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.video-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.play-circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  border: none;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
  padding-left: 3px;
}
.play-circle-btn:hover {
  transform: scale(1.1);
  background: white;
}
.no-video-badge {
  background: rgba(0,0,0,0.7);
  color: #cbd5e1;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
}
.video-duration-pill {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.75);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.video-card-body {
  padding: 1rem;
  flex: 1;
}
.video-index-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: #6366f1;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.video-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
  margin-bottom: 0.4rem;
}
.video-card-desc {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.video-status-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.video-card-footer {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Material Files List */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.file-card-row {
  display: flex;
  align-items: center;
  padding: 0.85rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  gap: 1rem;
}
.file-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.file-info-box {
  flex: 1;
  min-width: 0;
}
.file-name {
  display: block;
  font-size: 0.95rem;
  color: #1e293b;
}
.file-meta {
  font-size: 0.75rem;
  color: #64748b;
}
.file-actions-box {
  display: flex;
  gap: 0.5rem;
}

/* Empty State Box */
.empty-state-box {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
}

/* Modal Overlay & Card */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
}
.modal-dialog {
  background: white;
  width: 100%;
  max-width: 580px;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-dialog.is-large { max-width: 740px; }
.modal-dialog.is-video-player {
  max-width: 860px;
  background: #0f172a;
}
.modal-header {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}
.close-btn:hover { color: #1e293b; }
.close-btn.is-white { color: #94a3b8; }
.close-btn.is-white:hover { color: white; }
.video-player-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Forms styling */
.form-group label {
  display: block;
  font-weight: 700;
  font-size: 0.85rem;
  color: #334155;
  margin-bottom: 0.35rem;
}
.custom-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.custom-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.textarea-input { resize: vertical; }
.has-icons-left-input {
  position: relative;
}
.has-icons-left-input input { padding-left: 2.2rem; }
.icon-input {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.content-box-config {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}
.config-subtitle {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

/* Upload Dropzone */
.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  background: white;
  padding: 1.25rem;
  text-align: center;
}
.upload-dropzone.is-compact {
  padding: 0.75rem;
}
.dropzone-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #475569;
  font-weight: 600;
}
.dropzone-label:hover { color: #6366f1; }
.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
}
.current-file-preview {
  display: flex;
  align-items: center;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #065f46;
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumb-upload-flex {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 1rem;
  align-items: start;
}
.thumb-preview-box {
  width: 140px;
  height: 85px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}
.thumb-img-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
.thumb-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 50%;
}
.thumb-placeholder-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
}

.video-preview-embed {
  background: #0f172a;
  border-radius: 10px;
  padding: 0.5rem;
}
.video-preview-player {
  width: 100%;
  max-height: 220px;
  border-radius: 6px;
  background: black;
}
.video-player-container {
  background: black;
  width: 100%;
  height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.full-video-player {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
