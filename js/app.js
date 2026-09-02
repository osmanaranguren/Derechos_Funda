/**
 * CONTROLADOR PRINCIPAL DE LA APLICACIÓN (SENA DERECHOS FUNDAMENTALES)
 * Gestiona navegación, diapositivas interactivas, reproductor de video, temas y configuración.
 */

class AppController {
  constructor() {
    this.currentView = 'home';
    this.currentSlideIndex = 0;
    this.activeVideoId = 'vid1';
    this.darkMode = localStorage.getItem('sena_theme') !== 'light';
  }

  init() {
    this.applyTheme();
    this.renderRAPs();
    this.renderSlide(0);
    this.renderVideos();
    this.setupEventListeners();
    this.setupVideoListeners();
    this.updateQuizLockUI();
    this.initSupabaseModal();

    // Inicializar sub-motores
    if (window.quizEngine) window.quizEngine.init();
    if (window.SupabaseManager) {
      window.SupabaseManager.initClient();
      window.SupabaseManager.testConnection().catch(() => {});
    }

    // Cargar vista inicial
    this.navigateTo('home');
  }

  setupEventListeners() {
    // Teclado para navegar diapositivas
    window.addEventListener('keydown', (e) => {
      if (this.currentView === 'slides') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          this.nextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          this.prevSlide();
        }
      }
    });
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('sena_theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  applyTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (this.darkMode) {
      html.classList.add('dark');
      if (themeIcon) themeIcon.textContent = '☀️';
    } else {
      html.classList.remove('dark');
      if (themeIcon) themeIcon.textContent = '🌙';
    }
  }

  navigateTo(viewName) {
    // Protección de acceso a Fichas & Resultados con OTP de 4 dígitos
    if (viewName === 'records' && window.authManager && !window.authManager.isAuthenticated()) {
      window.authManager.openAuthModal('records');
      return;
    }

    // Protección pedagógica: Requerir visualización de los videos antes de la evaluación
    if (viewName === 'quiz' && !this.areAllVideosWatched()) {
      this.openVideoRequiredModal();
      return;
    }

    this.forceNavigateTo(viewName);
  }

  forceNavigateTo(viewName) {
    this.currentView = viewName;

    // Actualizar secciones
    const views = ['home', 'slides', 'videos', 'quiz', 'records'];
    views.forEach(v => {
      const section = document.getElementById(`view-${v}`);
      if (section) {
        if (v === viewName) {
          section.classList.remove('hidden');
          section.classList.add('animate-fadeIn');
        } else {
          section.classList.add('hidden');
          section.classList.remove('animate-fadeIn');
        }
      }
    });

    // Actualizar enlaces de navegación activa
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-view');
      if (target === viewName) {
        link.classList.add('nav-link-active');
      } else {
        link.classList.remove('nav-link-active');
      }
    });

    // Cargas específicas por vista
    if (viewName === 'records') {
      if (window.authManager) window.authManager.updateAuthBadge();
      if (window.recordsManager) window.recordsManager.loadRecords();
    }
    if (viewName === 'slides') {
      this.renderSlide(this.currentSlideIndex);
    }

    if (window.soundEngine) window.soundEngine.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // RENDERIZADOR DE RAPs EN INICIO
  renderRAPs() {
    const container = document.getElementById('home-raps-container');
    if (!container) return;

    container.innerHTML = SENA_APP_DATA.resultadosAprendizaje.map(rap => `
      <div class="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-emerald-500/50 transition duration-300 transform hover:-translate-y-1">
        <div class="flex items-center gap-3 mb-4">
          <span class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
            ${rap.icono}
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold font-mono">
            RAP ${rap.numero}
          </span>
        </div>
        <h4 class="font-bold text-slate-800 dark:text-white text-base mb-2">${rap.titulo}</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${rap.descripcion}</p>
      </div>
    `).join('');
  }

  // PRESENTADOR DE DIAPOSITIVAS INTERACTIVAS
  renderSlide(index) {
    const slides = SENA_APP_DATA.slides;
    if (index < 0 || index >= slides.length) return;

    this.currentSlideIndex = index;
    const slide = slides[index];
    const container = document.getElementById('slide-viewport');
    const indicator = document.getElementById('slide-indicator');
    const dotsContainer = document.getElementById('slide-dots');

    if (indicator) {
      indicator.textContent = `Diapositiva ${index + 1} de ${slides.length}`;
    }

    if (dotsContainer) {
      dotsContainer.innerHTML = slides.map((s, i) => `
        <button 
          onclick="window.app.renderSlide(${i})"
          class="h-2 rounded-full transition-all duration-300 ${
            i === index 
              ? 'w-8 bg-emerald-500' 
              : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
          }"
          title="${s.titulo}"
        ></button>
      `).join('');
    }

    if (!container) return;

    let contentHtml = '';

    if (slide.tipo === 'cover') {
      contentHtml = `
        <div class="text-center py-6 md:py-10 max-w-2xl mx-auto animate-fadeIn">
          <span class="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4 border border-emerald-500/20">
            ${slide.tag}
          </span>
          <h2 class="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-3">
            ${slide.titulo}
          </h2>
          <p class="text-emerald-700 dark:text-emerald-400 font-bold text-lg mb-6">
            ${slide.subtitulo}
          </p>
          <p class="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            ${slide.contenido.descripcion}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            ${slide.contenido.puntos.map(p => `
              <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <span class="text-emerald-500 font-bold">✓</span>
                <span class="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium">${p}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (slide.tipo === 'raps') {
      contentHtml = `
        <div class="animate-fadeIn">
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-3">
            ${slide.tag}
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
            ${slide.titulo}
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">${slide.contenido.descripcion}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${SENA_APP_DATA.resultadosAprendizaje.map(rap => `
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex gap-4 items-start">
                <div class="text-2xl">${rap.icono}</div>
                <div>
                  <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">RAP ${rap.numero}</span>
                  <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-1">${rap.titulo}</h4>
                  <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${rap.descripcion}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (slide.tipo === 'articles_dudh') {
      contentHtml = `
        <div class="animate-fadeIn">
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-3">
            ${slide.tag}
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
            ${slide.titulo}
          </h2>
          <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">${slide.contenido.intro}</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            ${slide.contenido.grupos.map(g => `
              <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div class="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-white mb-3">
                  <span>${g.icono}</span>
                  <h4>${g.nombre}</h4>
                </div>
                <div class="space-y-2">
                  ${g.articulos.map(a => `
                    <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${a.num}:</strong>
                      <span class="text-slate-700 dark:text-slate-300 font-medium">${a.desc}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Características Esenciales</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${slide.contenido.caracteristicas.map(c => `
              <div class="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-center">
                <strong class="block text-xs font-black text-emerald-700 dark:text-emerald-400">${c.nombre}</strong>
                <span class="text-[11px] text-slate-600 dark:text-slate-400 leading-tight block mt-1">${c.detalle}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (slide.tipo === 'generations') {
      contentHtml = `
        <div class="animate-fadeIn">
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-3">
            ${slide.tag}
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
            ${slide.titulo}
          </h2>
          <p class="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-6">${slide.subtitulo}</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${slide.contenido.generaciones.map((gen, i) => `
              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 ${
                i === 0 ? 'border-blue-400 dark:border-blue-700' :
                i === 1 ? 'border-emerald-400 dark:border-emerald-700' :
                'border-purple-400 dark:border-purple-700'
              } flex flex-col justify-between">
                <div>
                  <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-black uppercase mb-2 ${
                    i === 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                    i === 1 ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' :
                    'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                  }">${gen.gen} • ${gen.eje}</span>
                  <h4 class="font-bold text-base text-slate-800 dark:text-white mb-1">${gen.tipo}</h4>
                  <p class="text-[11px] text-slate-500 mb-3 font-semibold">${gen.epoca}</p>
                  
                  <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 mb-3">
                    <strong class="text-slate-900 dark:text-white block mb-1">Ejemplos:</strong>
                    ${gen.ejemplos}
                  </div>
                </div>

                <div class="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  <strong>Rol del Estado:</strong> ${gen.deber}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (slide.tipo === 'constitution') {
      contentHtml = `
        <div class="animate-fadeIn">
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-3">
            ${slide.tag}
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
            ${slide.titulo}
          </h2>
          <p class="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-6">${slide.subtitulo}</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${slide.contenido.articulos.map(art => `
              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span class="px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs">
                  ${art.art}
                </span>
                <h4 class="font-bold text-base text-slate-800 dark:text-white mt-3 mb-3">${art.titulo}</h4>
                <blockquote class="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-amber-500 text-xs text-slate-700 dark:text-slate-300 italic mb-4 leading-relaxed font-serif">
                  ${art.texto}
                </blockquote>
                <div class="text-xs text-slate-600 dark:text-slate-400">
                  <strong class="text-emerald-700 dark:text-emerald-400 block mb-1">⚖️ Sentido Jurídico:</strong>
                  ${art.analisis}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (slide.tipo === 'conflict_stats') {
      contentHtml = `
        <div class="animate-fadeIn">
          <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-3">
            ${slide.tag}
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
            ${slide.titulo}
          </h2>
          <p class="text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-6">${slide.subtitulo}</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-center">
              <span class="text-3xl mb-2 block">⚖️</span>
              <h4 class="font-bold text-sm text-emerald-800 dark:text-emerald-300 mb-2">Función Protectora</h4>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${slide.contenido.asimetria}</p>
            </div>

            <div class="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-center">
              <span class="text-3xl mb-2 block">📊</span>
              <h4 class="font-bold text-sm text-amber-800 dark:text-amber-300 mb-2">Causa de Conflictos</h4>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${slide.contenido.estadistica}</p>
            </div>

            <div class="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800 text-center">
              <span class="text-3xl mb-2 block">🚀</span>
              <h4 class="font-bold text-sm text-blue-800 dark:text-blue-300 mb-2">Movilidad Social</h4>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${slide.contenido.movilidad}</p>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = contentHtml;
  }

  nextSlide() {
    if (this.currentSlideIndex < SENA_APP_DATA.slides.length - 1) {
      this.renderSlide(this.currentSlideIndex + 1);
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.renderSlide(this.currentSlideIndex - 1);
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  // =========================================================
  // GESTIÓN DE PROGRESO DE VIDEOS Y DESBLOQUEO DE EVALUACIÓN
  // =========================================================

  getWatchedVideos() {
    try {
      const saved = localStorage.getItem('sena_videos_watched');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  areAllVideosWatched() {
    const watched = this.getWatchedVideos();
    const allVideos = (typeof SENA_APP_DATA !== 'undefined' && Array.isArray(SENA_APP_DATA.videos)) ? SENA_APP_DATA.videos : [];
    if (allVideos.length === 0) return true;
    return allVideos.every(v => watched.includes(v.id));
  }

  getVideosProgress() {
    const watched = this.getWatchedVideos();
    const allVideos = (typeof SENA_APP_DATA !== 'undefined' && Array.isArray(SENA_APP_DATA.videos)) ? SENA_APP_DATA.videos : [];
    const total = allVideos.length || 1;
    const watchedCount = allVideos.filter(v => watched.includes(v.id)).length;
    const percentage = Math.round((watchedCount / total) * 100);
    return {
      watched,
      watchedCount,
      total,
      percentage,
      isComplete: watchedCount >= total
    };
  }

  markVideoAsWatched(vidId) {
    if (!vidId) return;
    let watched = this.getWatchedVideos();
    if (!watched.includes(vidId)) {
      watched.push(vidId);
      localStorage.setItem('sena_videos_watched', JSON.stringify(watched));
      
      this.renderVideos();
      this.updateQuizLockUI();

      if (this.areAllVideosWatched()) {
        if (window.confetti) {
          window.confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }
        if (window.soundEngine && window.soundEngine.playVictory) {
          window.soundEngine.playVictory();
        }
        this.showToast('🎉 ¡Felicitaciones! Has completado todos los videos pedagógicos. La Evaluación Oficial ya está desbloqueada.', 'success');
      } else {
        if (window.soundEngine && window.soundEngine.playCorrect) {
          window.soundEngine.playCorrect();
        }
        this.showToast('✅ ¡Video completado con éxito! Continúa con el siguiente video para desbloquear la evaluación.', 'info');
      }
    }
  }

  resetVideoProgress() {
    if (confirm('¿Deseas reiniciar el progreso de visualización de los videos pedagógicos?')) {
      localStorage.removeItem('sena_videos_watched');
      this.renderVideos();
      this.updateQuizLockUI();
      this.showToast('🔄 Progreso de videos reiniciado. La evaluación ha sido bloqueada nuevamente.', 'info');
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  bypassVideoLock() {
    const allVideos = (typeof SENA_APP_DATA !== 'undefined' && Array.isArray(SENA_APP_DATA.videos)) ? SENA_APP_DATA.videos : [];
    const allIds = allVideos.map(v => v.id);
    localStorage.setItem('sena_videos_watched', JSON.stringify(allIds));
    this.closeVideoRequiredModal();
    this.renderVideos();
    this.updateQuizLockUI();
    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
    this.showToast('🔓 Desbloqueo rápido activado. ¡Evaluación habilitada!', 'success');
    this.forceNavigateTo('quiz');
  }

  setupVideoListeners() {
    const player = document.getElementById('main-video-element');
    if (!player) return;

    // Detectar cuando el video llega al 85% o termina
    player.addEventListener('timeupdate', () => {
      if (player.duration > 0 && (player.currentTime / player.duration >= 0.85)) {
        this.markVideoAsWatched(this.activeVideoId);
      }
    });

    player.addEventListener('ended', () => {
      this.markVideoAsWatched(this.activeVideoId);
    });
  }

  updateQuizLockUI() {
    const progress = this.getVideosProgress();
    const isUnlocked = progress.isComplete;

    // Actualizar indicador en Navbar
    const navLockIcon = document.getElementById('nav-quiz-lock-icon');
    const navQuizBadge = document.getElementById('nav-quiz-badge');
    const navVideosBadge = document.getElementById('nav-videos-badge');
    const mobileLockIcon = document.getElementById('mobile-quiz-lock-icon');

    if (navLockIcon) navLockIcon.textContent = isUnlocked ? '🎯' : '🔒';
    if (mobileLockIcon) mobileLockIcon.textContent = isUnlocked ? '🎯' : '🔒';

    if (navQuizBadge) {
      if (isUnlocked) {
        navQuizBadge.className = 'px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold';
        navQuizBadge.textContent = '10 Q';
      } else {
        navQuizBadge.className = 'px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold font-mono';
        navQuizBadge.textContent = '🔒';
      }
    }

    if (navVideosBadge) {
      navVideosBadge.textContent = `${progress.watchedCount}/${progress.total}`;
      navVideosBadge.className = isUnlocked 
        ? 'px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono'
        : 'px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold font-mono';
    }

    // Actualizar Botón en Hero de Inicio
    const heroBtn = document.getElementById('hero-quiz-btn');
    const heroIcon = document.getElementById('hero-quiz-icon');
    const heroText = document.getElementById('hero-quiz-text');

    if (heroBtn && heroIcon && heroText) {
      if (isUnlocked) {
        heroIcon.textContent = '🎯';
        heroText.textContent = 'Presentar Evaluación Oficial';
        heroBtn.className = 'px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5 flex items-center gap-2';
      } else {
        heroIcon.textContent = '🔒';
        heroText.textContent = 'Presentar Evaluación (Requiere Videos)';
        heroBtn.className = 'px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-700 transition transform hover:-translate-y-0.5 flex items-center gap-2';
      }
    }

    // Actualizar Tarjeta del Módulo en Inicio
    const moduleBadge = document.getElementById('module-quiz-badge');
    const moduleFooter = document.getElementById('module-quiz-footer-text');
    const moduleVideosBadge = document.getElementById('module-videos-badge');

    if (moduleVideosBadge) {
      moduleVideosBadge.textContent = `${progress.watchedCount}/${progress.total}`;
    }

    if (moduleBadge && moduleFooter) {
      if (isUnlocked) {
        moduleBadge.className = 'absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1';
        moduleBadge.innerHTML = '<span>🔓</span> <span>Habilitado</span>';

        moduleFooter.className = 'text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1';
        moduleFooter.innerHTML = '<span>Iniciar cuestionario →</span>';
      } else {
        moduleBadge.className = 'absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1';
        moduleBadge.innerHTML = '<span>🔒</span> <span>Bloqueado</span>';

        moduleFooter.className = 'text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1';
        moduleFooter.innerHTML = `<span>🔒</span> <span>Requiere ver videos (${progress.watchedCount}/${progress.total}) →</span>`;
      }
    }

    // Actualizar Banner en Videoteca
    const videoBadgeStatus = document.getElementById('videoteca-badge-status');
    const videoProgressText = document.getElementById('videoteca-progress-text');
    const videoProgressFill = document.getElementById('videoteca-progress-fill');
    const videoCtaBtn = document.getElementById('videoteca-quiz-cta-btn');
    const playlistCounter = document.getElementById('videoteca-playlist-counter');

    if (videoBadgeStatus) {
      videoBadgeStatus.textContent = isUnlocked 
        ? `✅ ¡Ruta Completa (${progress.watchedCount}/${progress.total} videos)!` 
        : `🔒 ${progress.watchedCount} de ${progress.total} Videos Vistos`;
    }

    if (videoProgressText) videoProgressText.textContent = `${progress.percentage}%`;
    if (videoProgressFill) videoProgressFill.style.width = `${progress.percentage}%`;

    if (playlistCounter) {
      playlistCounter.textContent = `${progress.watchedCount}/${progress.total} Vistos`;
    }

    if (videoCtaBtn) {
      if (isUnlocked) {
        videoCtaBtn.className = 'w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5 cursor-pointer';
        videoCtaBtn.innerHTML = '<span>🎯</span> <span>¡Desbloqueado! Ir a la Evaluación ➡️</span>';
      } else {
        videoCtaBtn.className = 'w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer hover:bg-slate-700 hover:text-slate-200';
        videoCtaBtn.innerHTML = `<span>🔒</span> <span>Evaluación Bloqueada (${progress.watchedCount}/${progress.total})</span>`;
      }
    }
  }

  openVideoRequiredModal() {
    const modal = document.getElementById('video-required-modal');
    const listContainer = document.getElementById('video-requirement-status-list');
    if (!modal) return;

    const watched = this.getWatchedVideos();
    const allVideos = (typeof SENA_APP_DATA !== 'undefined' && Array.isArray(SENA_APP_DATA.videos)) ? SENA_APP_DATA.videos : [];

    if (listContainer) {
      listContainer.innerHTML = allVideos.map((v, idx) => {
        const isWatched = watched.includes(v.id);
        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl ${
            isWatched 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300'
          }">
            <div class="flex items-center gap-2">
              <span class="text-base">${isWatched ? '✅' : '⏳'}</span>
              <div>
                <strong class="block font-bold text-xs">Video ${idx + 1}: ${v.titulo}</strong>
                <span class="text-[10px] opacity-80">Duración: ${v.duracionEstimada}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
              isWatched ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'
            }">
              ${isWatched ? 'VISTO' : 'PENDIENTE'}
            </span>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
    if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
  }

  closeVideoRequiredModal() {
    const modal = document.getElementById('video-required-modal');
    if (modal) modal.classList.add('hidden');
  }

  goToUnwatchedVideo() {
    this.closeVideoRequiredModal();
    this.forceNavigateTo('videos');

    const watched = this.getWatchedVideos();
    const allVideos = (typeof SENA_APP_DATA !== 'undefined' && Array.isArray(SENA_APP_DATA.videos)) ? SENA_APP_DATA.videos : [];
    const firstUnwatched = allVideos.find(v => !watched.includes(v.id));

    if (firstUnwatched) {
      this.selectVideo(firstUnwatched.id);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('app-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' 
      ? 'bg-emerald-600 text-white' 
      : type === 'error' 
        ? 'bg-red-600 text-white' 
        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-700';

    toast.className = `p-4 rounded-2xl text-xs font-bold shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-3 ${bgClass} pointer-events-auto`;
    toast.innerHTML = `
      <span class="text-base">${type === 'success' ? '🎉' : type === 'error' ? '⚠️' : '💡'}</span>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto-eliminar a los 4.5 segundos
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 350);
    }, 4500);
  }

  // VIDEOTECA EDUCATIVA
  renderVideos() {
    const list = document.getElementById('video-selection-list');
    if (!list) return;

    const watched = this.getWatchedVideos();

    list.innerHTML = SENA_APP_DATA.videos.map(v => {
      const isWatched = watched.includes(v.id);
      return `
        <div 
          onclick="window.app.selectVideo('${v.id}')"
          class="cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
            this.activeVideoId === v.id 
              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30' 
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
          }"
        >
          <div class="flex items-center justify-between gap-3 mb-2">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${v.icono}</span>
              <div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-white">${v.titulo}</h4>
                <span class="text-xs text-slate-400 font-mono">⏱ ${v.duracionEstimada}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1 ${
              isWatched 
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
            }">
              <span>${isWatched ? '✅ Visto' : '⏳ Pendiente'}</span>
            </span>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-400 mb-3">${v.subtitulo}</p>
          <div class="flex flex-wrap gap-1">
            ${v.temasClave.slice(0, 2).map(t => `
              <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                ${t}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    this.updateVideoPlayer();
    this.updateQuizLockUI();
  }

  selectVideo(vidId) {
    this.activeVideoId = vidId;
    this.renderVideos();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  updateVideoPlayer() {
    const video = SENA_APP_DATA.videos.find(v => v.id === this.activeVideoId);
    if (!video) return;

    const player = document.getElementById('main-video-element');
    const titleElem = document.getElementById('active-video-title');
    const descElem = document.getElementById('active-video-desc');
    const topicsElem = document.getElementById('active-video-topics');
    const watchedBadge = document.getElementById('video-player-watched-badge');

    if (player) {
      // Usar ruta directa del archivo si difiere
      const currentSrc = decodeURIComponent(player.src || '');
      if (!currentSrc.endsWith(video.archivo)) {
        player.src = video.archivo;
        player.load();
      }
    }

    const watched = this.getWatchedVideos();
    const isWatched = watched.includes(video.id);
    if (watchedBadge) {
      if (isWatched) {
        watchedBadge.classList.remove('hidden');
      } else {
        watchedBadge.classList.add('hidden');
      }
    }

    if (titleElem) titleElem.textContent = video.titulo;
    if (descElem) descElem.textContent = video.subtitulo;

    if (topicsElem) {
      topicsElem.innerHTML = video.temasClave.map(t => `
        <li class="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span class="text-emerald-500 font-bold">✓</span>
          <span>${t}</span>
        </li>
      `).join('');
    }
  }

  setVideoSpeed(speed) {
    const player = document.getElementById('main-video-element');
    if (player) {
      player.playbackRate = speed;
    }
  }

  // MODAL DE CONFIGURACIÓN SUPABASE
  initSupabaseModal() {
    const cfg = window.SupabaseManager.getConfig();
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');

    if (urlInput) urlInput.value = cfg.url || '';
    if (keyInput) keyInput.value = cfg.anonKey || '';
  }

  openSupabaseModal() {
    const modal = document.getElementById('supabase-modal');
    if (modal) modal.classList.remove('hidden');
    this.initSupabaseModal();
    if (window.soundEngine) window.soundEngine.playClick();
  }

  closeSupabaseModal() {
    const modal = document.getElementById('supabase-modal');
    if (modal) modal.classList.add('hidden');
  }

  async saveSupabaseConfig() {
    const url = document.getElementById('supabase-url-input').value;
    const key = document.getElementById('supabase-key-input').value;

    window.SupabaseManager.saveConfig(url, key);
    const statusElem = document.getElementById('supabase-test-status');

    if (statusElem) {
      statusElem.innerHTML = '🔄 Probando conexión con Supabase...';
      statusElem.className = 'text-xs font-semibold text-blue-500';
    }

    const test = await window.SupabaseManager.testConnection();
    if (statusElem) {
      if (test.success) {
        statusElem.innerHTML = '✅ ' + test.message;
        statusElem.className = 'text-xs font-semibold text-emerald-600 dark:text-emerald-400';
        setTimeout(() => {
          this.closeSupabaseModal();
          if (this.currentView === 'records') window.recordsManager.loadRecords();
        }, 1200);
      } else {
        statusElem.innerHTML = '⚠️ ' + test.message;
        statusElem.className = 'text-xs font-semibold text-amber-600 dark:text-amber-400';
      }
    }
  }

  copySupabaseSql() {
    const sql = window.SupabaseManager.getSqlScript();
    navigator.clipboard.writeText(sql).then(() => {
      alert('¡Script SQL copiado al portapapeles!\nPégalo en el SQL Editor de tu proyecto en Supabase para crear la tabla.');
    });
  }
}

window.app = new AppController();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
