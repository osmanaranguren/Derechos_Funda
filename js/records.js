/**
 * GESTOR DE REGISTROS, REPORTES Y CERTIFICADOS SENA
 * Administra el panel de calificaciones por ficha, exportaciones y certificados imprimibles.
 */

class RecordsManager {
  constructor() {
    this.records = [];
    this.filteredRecords = [];
    this.currentFilterFicha = 'ALL';
    this.currentFilterSofia = 'ALL';
    this.currentSearch = '';
    this.currentSource = 'local';
  }

  async loadRecords() {
    const listElem = document.getElementById('records-table-body');
    const badgeElem = document.getElementById('records-source-badge');

    if (listElem) {
      listElem.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-8 text-slate-500">
            <div class="inline-flex items-center gap-2">
              <span class="animate-spin text-xl">⏳</span> Cargando evaluaciones...
            </div>
          </td>
        </tr>
      `;
    }

    try {
      const result = await window.SupabaseManager.fetchEvaluations();
      this.records = this.consolidateApprenticeRecords(result.records || []);
      this.currentSource = result.source;

      if (badgeElem) {
        if (this.currentSource === 'supabase') {
          badgeElem.innerHTML = '🟢 Conectado a Supabase (En la nube)';
          badgeElem.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5';
        } else {
          badgeElem.innerHTML = '💾 Modo Local (LocalStorage)';
          badgeElem.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5';
        }
      }

      this.populateFichaDropdown();
      this.applyFilters();
      this.updateStats();
    } catch (e) {
      console.error('Error cargando registros:', e);
    }
  }

  // Consolidar registros por aprendiz: eliminar duplicados, sólo publicar aprobados o resultados tras 2° intento
  consolidateApprenticeRecords(recordsList) {
    if (!Array.isArray(recordsList)) return [];

    const groups = new Map();

    for (const r of recordsList) {
      const cleanDoc = r.documento ? String(r.documento).replace(/\D/g, '') : '';
      const cleanName = (r.nombre || '').toLowerCase().trim();
      const cleanFicha = String(r.ficha || '').trim();
      const key = cleanDoc && cleanDoc.length >= 4 ? `doc_${cleanDoc}` : `name_${cleanName}_${cleanFicha}`;

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    const consolidated = [];
    const obsoleteIdsToDelete = [];

    for (const [key, attempts] of groups.entries()) {
      // Ordenar intentos por fecha descendente (más recientes primero)
      attempts.sort((a, b) => new Date(b.fechaISO || b.fecha || 0) - new Date(a.fechaISO || a.fecha || 0));

      const passedAttempt = attempts.find(a => a.aprobado);

      if (passedAttempt) {
        // Regla SENA: Si aprobó (sea en intento 1 o 2), SÓLO se publica el aprobado
        const cleanDoc = passedAttempt.documento ? String(passedAttempt.documento).replace(/\D/g, '') : '';
        const cleanNom = (passedAttempt.nombre || '').toLowerCase();
        const isSergio = cleanDoc === '1116642064' || cleanNom.includes('sergio andr');

        if (attempts.length > 1 || isSergio || Number(passedAttempt.intento) >= 2) {
          passedAttempt.intento = 2;
        }
        consolidated.push(passedAttempt);

        // Limpiar en base de datos cualquier intento reprobado previo de este aprendiz
        attempts.filter(a => !a.aprobado).forEach(a => {
          if (a.id && a.id !== passedAttempt.id) obsoleteIdsToDelete.push(a.id);
        });
      } else {
        // Si no aprobó: sólo se publica después de que pase el 2° intento
        if (attempts.length >= 2 || attempts.some(a => Number(a.intento) >= 2)) {
          const finalAttempt = attempts[0];
          finalAttempt.intento = 2;
          consolidated.push(finalAttempt);

          // Mantener sólo el intento definitivo
          attempts.slice(1).forEach(a => {
            if (a.id && a.id !== finalAttempt.id) obsoleteIdsToDelete.push(a.id);
          });
        }
        // Si sólo tiene 1 intento reprobado, aún no se publica hasta que complete su 2do intento
      }
    }

    // Limpieza automática en segundo plano de registros duplicados en Supabase y LocalStorage
    if (obsoleteIdsToDelete.length > 0 && window.SupabaseManager) {
      obsoleteIdsToDelete.forEach(id => {
        window.SupabaseManager.deleteEvaluation(id).catch(e => console.warn('Limpiando duplicado:', e));
      });
    }

    consolidated.sort((a, b) => new Date(b.fechaISO || b.fecha || 0) - new Date(a.fechaISO || a.fecha || 0));
    return consolidated;
  }

  populateFichaDropdown() {
    const select = document.getElementById('records-filter-ficha');
    if (!select) return;

    const fichas = Array.from(new Set(this.records.map(r => String(r.ficha).trim()).filter(Boolean)));
    fichas.sort();

    select.innerHTML = `
      <option value="ALL">Todas las Fichas (${this.records.length})</option>
      ${fichas.map(f => `<option value="${f}">Ficha: ${f}</option>`).join('')}
    `;

    if (fichas.includes(this.currentFilterFicha)) {
      select.value = this.currentFilterFicha;
    } else {
      this.currentFilterFicha = 'ALL';
      select.value = 'ALL';
    }
  }

  setFichaFilter(ficha) {
    this.currentFilterFicha = ficha;
    this.applyFilters();
  }

  setSofiaFilter(sofiaFilter) {
    this.currentFilterSofia = sofiaFilter || 'ALL';
    this.applyFilters();
  }

  setSearchFilter(term) {
    this.currentSearch = (term || '').toLowerCase().trim();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredRecords = this.records.filter(r => {
      const matchFicha = this.currentFilterFicha === 'ALL' || String(r.ficha).trim() === this.currentFilterFicha;
      const matchSearch = !this.currentSearch || 
        (r.nombre && r.nombre.toLowerCase().includes(this.currentSearch)) ||
        (r.documento && r.documento.toLowerCase().includes(this.currentSearch)) ||
        (r.ficha && String(r.ficha).includes(this.currentSearch));
      const matchSofia = this.currentFilterSofia === 'ALL' ||
        (this.currentFilterSofia === 'CALIFICADO' && !!r.calificado_sofia) ||
        (this.currentFilterSofia === 'PENDIENTE' && !r.calificado_sofia);

      return matchFicha && matchSearch && matchSofia;
    });

    this.renderTable();
    this.updateStats();
  }

  updateStats() {
    const totalElem = document.getElementById('stat-total-evaluaciones');
    const aprobadosElem = document.getElementById('stat-total-aprobados');
    const sofiaElem = document.getElementById('stat-total-sofia');
    const promedioElem = document.getElementById('stat-promedio-porcentaje');
    const tasaElem = document.getElementById('stat-tasa-aprobacion');

    const total = this.filteredRecords.length;
    const aprobados = this.filteredRecords.filter(r => r.aprobado).length;
    const totalSofia = this.filteredRecords.filter(r => r.calificado_sofia).length;
    const sumaPorcentajes = this.filteredRecords.reduce((acc, r) => acc + (Number(r.porcentaje) || 0), 0);
    const promedio = total > 0 ? Math.round(sumaPorcentajes / total) : 0;
    const tasa = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    if (totalElem) totalElem.textContent = total;
    if (aprobadosElem) aprobadosElem.textContent = `${aprobados} / ${total}`;
    if (sofiaElem) sofiaElem.textContent = `${totalSofia} / ${total}`;
    if (promedioElem) promedioElem.textContent = `${promedio}%`;
    if (tasaElem) tasaElem.textContent = `${tasa}%`;
  }

  renderTable() {
    const tbody = document.getElementById('records-table-body');
    if (!tbody) return;

    if (this.filteredRecords.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-12 text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-3xl">📋</span>
              <p class="font-medium text-sm">No se encontraron evaluaciones registradas con los filtros actuales.</p>
              <button onclick="window.app.navigateTo('quiz')" class="mt-2 text-xs font-bold text-emerald-600 hover:underline">
                Realizar una evaluación ahora →
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.filteredRecords.map((r, i) => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
        <td class="py-3.5 px-4 font-mono text-xs text-slate-400 font-medium">${i + 1}</td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-slate-800 dark:text-white text-sm">${r.nombre}</div>
          ${r.documento ? `<div class="text-xs text-slate-400 font-mono">ID: ${r.documento}</div>` : ''}
        </td>
        <td class="py-3.5 px-4">
          <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700">
            ${r.ficha}
          </span>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs">
            Intento ${r.intento || 1}/2
          </span>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="font-bold text-sm text-slate-700 dark:text-slate-300">${r.puntaje} / ${r.totalPreguntas || 10}</span>
          <div class="text-xs text-slate-400 font-medium">${r.porcentaje}%</div>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            r.aprobado 
              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
              : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
          }">
            <span>${r.aprobado ? '✓' : '✗'}</span> ${r.aprobado ? 'Aprobado' : 'No Aprobado'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
          <div>${r.fecha || 'Reciente'}</div>
          ${r.tiempo ? `<div class="text-slate-400 font-mono">⏱ ${r.tiempo}</div>` : ''}
        </td>
        <td class="py-3.5 px-4 text-center">
          <div class="inline-flex flex-col items-center justify-center gap-1">
            <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
              r.calificado_sofia 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }" title="${r.calificado_sofia ? `Calificado por: ${r.calificado_sofia_por || 'Instructor'}. Clic para desmarcar.` : 'Clic para marcar como calificado en SOFIA PLUS'}">
              <input 
                type="checkbox" 
                class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                ${r.calificado_sofia ? 'checked' : ''} 
                onchange="window.recordsManager.toggleSofiaStatus('${r.id}')"
              />
              <span>${r.calificado_sofia ? 'Calificado' : 'Sin calificar'}</span>
            </label>
            ${r.calificado_sofia && r.calificado_sofia_por ? `
              <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center leading-tight">
                <span>👤 ${r.calificado_sofia_por}</span>
                ${r.calificado_sofia_fecha ? `<div class="text-[9px] text-slate-400 font-mono">${r.calificado_sofia_fecha}</div>` : ''}
              </div>
            ` : ''}
          </div>
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="inline-flex items-center gap-1.5 justify-end">
            ${r.aprobado ? `
              <button 
                onclick="window.recordsManager.showCertificateById('${r.id}')"
                class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1"
                title="Ver Certificado"
              >
                <span>📜</span> <span>Certificado</span>
              </button>
            ` : `
              <span 
                class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed"
                title="Evaluación no aprobada (< 70%): No se genera certificado"
              >
                <span>🚫</span> <span class="hidden sm:inline">Sin Certificado</span>
              </span>
            `}
            <button 
              onclick="window.recordsManager.deleteRecord('${r.id}', '${(r.nombre || '').replace(/'/g, "\\'")}')"
              class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 hover:scale-105 active:scale-95"
              title="Eliminar Evaluación"
            >
              <span>🗑️</span> <span class="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Alternar estado de calificación en SOFIA PLUS (registrado por el instructor autenticado)
  async toggleSofiaStatus(id) {
    const record = this.records.find(r => String(r.id) === String(id));
    if (!record) return;

    // Verificar si el instructor está autenticado
    if (!window.authManager || !window.authManager.isAuthenticated()) {
      if (window.app && window.app.showToast) {
        window.app.showToast('🔒 Debes iniciar sesión como Instructor o Coordinador para calificar.', 'warning');
      }
      if (window.authManager) window.authManager.openAuthModal('records');
      this.renderTable();
      return;
    }

    const currentUser = window.authManager.getCurrentUser();
    const instructorName = currentUser ? (currentUser.role || 'Instructor del Área') : 'Instructor del Área';
    const fechaActual = new Date().toLocaleString('es-CO');

    const newStatus = !record.calificado_sofia;
    record.calificado_sofia = newStatus;
    record.calificado_sofia_por = newStatus ? instructorName : '';
    record.calificado_sofia_fecha = newStatus ? fechaActual : '';

    // Actualizar también en lista filtrada
    const filtered = this.filteredRecords.find(r => String(r.id) === String(id));
    if (filtered) {
      filtered.calificado_sofia = newStatus;
      filtered.calificado_sofia_por = record.calificado_sofia_por;
      filtered.calificado_sofia_fecha = record.calificado_sofia_fecha;
    }

    this.renderTable();
    this.updateStats();

    if (window.soundEngine) window.soundEngine.playClick();

    try {
      const res = await window.SupabaseManager.updateEvaluationSofiaStatus(id, newStatus, instructorName, fechaActual);
      if (window.app && window.app.showToast) {
        if (res && !res.success && res.error) {
          window.app.showToast(`⚠️ Guardado local. Supabase rechazó (falta política UPDATE): ${res.error}`, 'warning');
        } else if (newStatus) {
          window.app.showToast(`✅ ${record.nombre}: Guardado en Supabase (Calificado por ${instructorName})`, 'success');
        } else {
          window.app.showToast(`⏳ ${record.nombre}: Guardado en Supabase (Sin calificar)`, 'info');
        }
      }
    } catch (e) {
      console.error('Error al actualizar estado en SOFIA:', e);
    }
  }

  async deleteRecord(id, apprenticeName) {
    const cleanName = apprenticeName || 'este aprendiz';
    const confirmed = confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente la evaluación de:\n\n👤 ${cleanName}?\n\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      const deleteResult = await window.SupabaseManager.deleteEvaluation(id);

      if (deleteResult && !deleteResult.success && deleteResult.error) {
        alert(
          `⚠️ ATENCIÓN SUPABASE (RLS):\n\n` +
          `El registro se eliminó de tu vista local, pero Supabase rechazó la eliminación en la nube.\n\n` +
          `Error: ${deleteResult.error}\n\n` +
          `Causa común: Falta la política DELETE en Supabase.\n` +
          `Solución: En tu panel de Supabase > SQL Editor, ejecuta:\n\n` +
          `CREATE POLICY "Permitir eliminacion anonima" ON public.evaluaciones_sena FOR DELETE TO anon, authenticated USING (true);`
        );
      }

      // Actualizar listas locales en memoria
      this.records = this.records.filter(r => String(r.id) !== String(id));
      this.filteredRecords = this.filteredRecords.filter(r => String(r.id) !== String(id));

      this.populateFichaDropdown();
      this.renderTable();
      this.updateStats();

      if (window.app && window.app.showToast) {
        if (deleteResult && deleteResult.source === 'supabase' && deleteResult.success) {
          window.app.showToast(`🗑️ Registro de ${cleanName} eliminado permanentemente de Supabase.`, 'success');
        } else {
          window.app.showToast(`🗑️ Registro de ${cleanName} eliminado localmente.`, 'info');
        }
      }
      if (window.soundEngine) window.soundEngine.playClick();
    } catch (err) {
      console.error('Error al eliminar registro:', err);
      alert('Ocurrió un error al eliminar el registro: ' + err.message);
    }
  }

  showCertificateById(id) {
    const record = this.records.find(r => String(r.id) === String(id));
    if (record) {
      this.showCertificate(record);
    }
  }

  showCertificate(record) {
    if (!record) return;

    // Validación estricta: NO se genera certificado si no aprobó (>= 70%)
    if (!record.aprobado) {
      alert('⚠️ No es posible generar ni visualizar una constancia de aprobación para una evaluación no aprobada (calificación inferior al 70%).');
      return;
    }

    const modal = document.getElementById('certificate-modal');
    const certContent = document.getElementById('certificate-content');
    if (!modal || !certContent) return;

    const certDate = record.fecha || new Date().toLocaleDateString('es-CO');
    const certCode = 'SENA-DDHH-' + (record.id ? String(record.id).slice(-6).toUpperCase() : Math.floor(100000 + Math.random() * 900000));

    certContent.innerHTML = `
      <div id="printable-certificate" class="relative p-8 md:p-12 rounded-3xl bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-8 border-double border-emerald-600 dark:border-emerald-500 shadow-2xl text-center overflow-hidden">
        
        <!-- Marca de agua decorativa -->
        <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        <!-- Encabezado Institucional con Logo Oficial del SENA -->
        <div class="flex items-center justify-between gap-4 border-b-2 border-emerald-500/30 pb-6 mb-6">
          <div class="text-left flex items-center gap-3.5">
            <img src="sena-logo.png" alt="Logo SENA" class="w-14 h-14 object-contain bg-white rounded-xl p-1 shadow border border-emerald-500/20">
            <div>
              <span class="text-xs md:text-sm font-black tracking-widest text-emerald-800 dark:text-emerald-400 uppercase block">Servicio Nacional de Aprendizaje</span>
              <p class="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Regional Boyacá - Centro Industrial de Mantenimiento y Manufactura CIMM</p>
            </div>
          </div>
          <div class="text-right font-mono text-xs text-slate-500">
            <span class="block text-[10px] uppercase font-bold text-slate-400">Código de Verificación:</span>
            <span class="font-bold text-emerald-700 dark:text-emerald-400">${certCode}</span>
          </div>
        </div>

        <span class="inline-block px-5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-widest mb-4 border border-emerald-500/20 shadow-sm">
          CONSTANCIA DE CURSO
        </span>

        <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-2">
          DERECHOS FUNDAMENTALES EN EL TRABAJO
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-8">
          Competencia: <strong>210201501</strong> - Ejercer Derechos fundamentales en el marco de la Constitución política y los convenios internacionales.
        </p>

        <p class="text-sm text-slate-600 dark:text-slate-300 italic mb-2">
          Hace constar que el aprendiz(a):
        </p>

        <h2 class="text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-400 uppercase underline decoration-emerald-400 decoration-wavy underline-offset-8 mb-6">
          ${record.nombre}
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mb-6 text-xs">
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">No. de Ficha:</span>
            <strong class="text-slate-800 dark:text-white text-sm font-mono">${record.ficha}</strong>
          </div>
          ${record.documento ? `
            <div>
              <span class="text-slate-400 font-bold block uppercase text-[10px]">Documento:</span>
              <strong class="text-slate-800 dark:text-white text-sm font-mono">${record.documento}</strong>
            </div>
          ` : ''}
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">Intento:</span>
            <strong class="text-slate-800 dark:text-white text-sm font-mono">${record.intento || 1} de 2</strong>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">Calificación:</span>
            <strong class="text-emerald-600 dark:text-emerald-400 text-sm font-bold">${record.porcentaje}% (${record.puntaje}/${record.totalPreguntas || 10})</strong>
          </div>
        </div>

        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-6 border ${
          record.calificado_sofia 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
        }">
          <span>${record.calificado_sofia ? '✅' : '⏳'}</span>
          <span>SOFIA PLUS: <strong>${record.calificado_sofia ? 'Calificado en Sistema' : 'Pendiente de Registro'}</strong></span>
        </div>

        <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed mb-10">
          Aprobó satisfactoriamente la evaluación de conocimientos fundamentales sobre Derechos Humanos, Declaración Universal de 1948, Generaciones de Derechos y los Artículos 25 y 53 de la Constitución Política de Colombia.
        </p>

        <!-- Pie de Constancia (Limpio, sin mención de certificación de competencia laboral ni instructora) -->
        <div class="flex items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-left">
          <div class="w-1/3">
            <span class="text-[10px] text-slate-400 font-mono block">Documento de validación interna</span>
          </div>

          <div class="text-center w-1/3 flex justify-center">
            <div class="inline-flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-emerald-600 text-emerald-600 font-black text-[8px] rotate-[-8deg] tracking-tighter leading-none p-1 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm">
              <img src="sena-logo.png" alt="SENA" class="w-5 h-5 object-contain mb-0.5">
              <span>SENA</span>
              <span class="text-[7px] text-emerald-700 font-bold">APROBADO</span>
            </div>
          </div>

          <div class="text-right text-[10px] text-slate-500 w-1/3">
            <span class="block font-bold text-slate-700 dark:text-slate-300">Fecha de Emisión:</span>
            <span>${certDate}</span>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.soundEngine) window.soundEngine.playClick();
  }

  closeCertificate() {
    const modal = document.getElementById('certificate-modal');
    if (modal) modal.classList.add('hidden');
  }

  printCertificate() {
    window.print();
  }

  // Exportar a Excel (CSV con UTF-8 BOM)
  exportToCSV() {
    if (this.records.length === 0) {
      alert('No hay evaluaciones disponibles para exportar.');
      return;
    }

    const headers = ['ID', 'Nombre Aprendiz', 'Documento', 'No. Ficha', 'Intento', 'Puntaje', 'Total Preguntas', 'Porcentaje', 'Estado', 'Calificado SOFIA PLUS', 'Calificado Por', 'Fecha Calificación SOFIA', 'Tiempo', 'Fecha'];
    const rows = this.filteredRecords.map(r => [
      `"${r.id || ''}"`,
      `"${(r.nombre || '').replace(/"/g, '""')}"`,
      `"${r.documento || ''}"`,
      `"${r.ficha || ''}"`,
      r.intento || 1,
      r.puntaje,
      r.totalPreguntas || 10,
      `${r.porcentaje}%`,
      r.aprobado ? 'Aprobado' : 'No Aprobado',
      r.calificado_sofia ? 'SÍ' : 'NO',
      `"${(r.calificado_sofia_por || '').replace(/"/g, '""')}"`,
      `"${r.calificado_sofia_fecha || ''}"`,
      `"${r.tiempo || ''}"`,
      `"${r.fecha || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `SENA_Evaluaciones_Ficha_${this.currentFilterFicha}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar a JSON
  exportToJSON() {
    if (this.records.length === 0) {
      alert('No hay evaluaciones disponibles para exportar.');
      return;
    }
    const blob = new Blob([JSON.stringify(this.filteredRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SENA_Evaluaciones_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.recordsManager = new RecordsManager();
