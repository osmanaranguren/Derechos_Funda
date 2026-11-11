/**
 * GESTOR DE CONEXIÓN Y PERSISTENCIA CON SUPABASE
 * Soporta credenciales desde js/supabase-credentials.js o desde localStorage con interfaz visual.
 */

const SUPABASE_STORAGE_KEY = 'SENA_SUPABASE_CONFIG';

const SupabaseManager = {
  client: null,
  tableName: 'evaluaciones_sena',
  status: 'unconfigured', // 'connected', 'error', 'unconfigured'
  statusMessage: '',

  // Obtener configuración activa (prioriza localStorage si existe, luego DEFAULT_SUPABASE_CONFIG)
  getConfig() {
    let url = '';
    let anonKey = '';
    let googleScriptUrl = '';

    // 1. Verificar si hay credenciales predeterminadas en supabase-credentials.js
    if (window.DEFAULT_SUPABASE_CONFIG) {
      if (window.DEFAULT_SUPABASE_CONFIG.url) url = window.DEFAULT_SUPABASE_CONFIG.url.trim();
      if (window.DEFAULT_SUPABASE_CONFIG.anonKey) anonKey = window.DEFAULT_SUPABASE_CONFIG.anonKey.trim();
      if (window.DEFAULT_SUPABASE_CONFIG.googleScriptUrl) googleScriptUrl = window.DEFAULT_SUPABASE_CONFIG.googleScriptUrl.trim();
    }

    // 2. Verificar si hay credenciales guardadas en el navegador
    try {
      const stored = localStorage.getItem(SUPABASE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url) {
          if (parsed.url.includes('script.google.com')) {
            googleScriptUrl = parsed.url.trim();
          } else {
            url = parsed.url.trim();
          }
        }
        if (parsed.anonKey) anonKey = parsed.anonKey.trim();
        if (parsed.googleScriptUrl) googleScriptUrl = parsed.googleScriptUrl.trim();
      }
    } catch (e) {
      console.error('Error leyendo config Supabase:', e);
    }

    if (url.includes('script.google.com') && !googleScriptUrl) {
      googleScriptUrl = url;
    }

    return {
      url: url,
      anonKey: anonKey,
      googleScriptUrl: googleScriptUrl,
      tableName: this.tableName
    };
  },

  isGoogleSheetsConfigured() {
    const cfg = this.getConfig();
    return !!(cfg.googleScriptUrl && cfg.googleScriptUrl.startsWith('https://script.google.com'));
  },

  saveConfig(url, anonKey) {
    const config = {
      url: (url || '').trim(),
      anonKey: (anonKey || '').trim()
    };
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
    this.initClient();
    this.updateStatusBadge();
    return config;
  },

  isConfigured() {
    const cfg = this.getConfig();
    return !!(cfg.url && cfg.anonKey && cfg.url.startsWith('http') && cfg.anonKey.length > 20);
  },

  initClient() {
    const cfg = this.getConfig();
    if (cfg.url && cfg.anonKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(cfg.url, cfg.anonKey);
        this.status = 'configured';
        return true;
      } catch (err) {
        console.error('Error inicializando cliente Supabase:', err);
        this.client = null;
        this.status = 'error';
        this.statusMessage = err.message;
        return false;
      }
    }
    this.client = null;
    this.status = 'unconfigured';
    return false;
  },

  // Probar conexión real a la base de datos
  async testConnection() {
    if (this.isGoogleSheetsConfigured()) {
      try {
        const cfg = this.getConfig();
        const res = await fetch(cfg.googleScriptUrl + '?action=list&t=' + Date.now());
        const json = await res.json();
        if (json && json.status === 'ok') {
          this.status = 'connected';
          this.statusMessage = 'Conectado en la nube con Google Drive';
          this.updateStatusBadge();
          return { success: true, message: '¡Conexión exitosa con Google Drive! La hoja de cálculo está lista.' };
        }
      } catch (e) {
        console.warn('Error verificando Google Drive:', e);
      }
    }

    if (!this.initClient()) {
      return { 
        success: false, 
        message: 'Por favor ingresa una URL válida (ej: https://xxx.supabase.co) y la clave anon key de Supabase.' 
      };
    }

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation')) {
          this.status = 'table_missing';
          this.statusMessage = 'Conexión OK, pero falta crear la tabla "evaluaciones_sena" con el script SQL.';
          this.updateStatusBadge();
          return {
            success: false,
            tableMissing: true,
            message: 'Conexión exitosa a Supabase, pero la tabla "evaluaciones_sena" no ha sido creada. Haz clic en "Copiar SQL Tabla" y ejecútalo en Supabase.'
          };
        }
        this.status = 'error';
        this.statusMessage = error.message;
        this.updateStatusBadge();
        return { success: false, message: `Error Supabase (${error.code || 'API'}): ${error.message}` };
      }

      this.status = 'connected';
      this.statusMessage = 'Conectado en la nube con Supabase';
      this.updateStatusBadge();
      return { success: true, message: '¡Conexión exitosa con Supabase! La tabla está lista para registrar evaluaciones.' };
    } catch (e) {
      this.status = 'error';
      this.statusMessage = e.message;
      this.updateStatusBadge();
      return { success: false, message: `Error de red: ${e.message}` };
    }
  },

  // Actualizar indicadores visuales de estado en la interfaz
  updateStatusBadge() {
    const navBadge = document.getElementById('navbar-supabase-status');
    const panelBadge = document.getElementById('records-source-badge');

    let badgeText = '⚡ Supabase';
    let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    let panelText = '💾 Modo Local (LocalStorage)';
    let panelClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';

    if (this.status === 'connected') {
      const isDrive = this.isGoogleSheetsConfigured();
      badgeText = isDrive ? '🟢 Drive Conectado' : '🟢 Supabase Conectado';
      badgeClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40';
      panelText = isDrive ? '🟢 Conectado a Google Drive (En la nube)' : '🟢 Conectado a Supabase (En la nube)';
      panelClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    } else if (this.status === 'table_missing') {
      badgeText = '🟡 Crear Tabla SQL';
      badgeClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40';
      panelText = '🟡 Falta Crear Tabla en Supabase';
      panelClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    } else if (this.status === 'error') {
      badgeText = '🔴 Error Supabase';
      badgeClass = 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40';
    }

    if (navBadge) {
      navBadge.innerHTML = badgeText;
      navBadge.className = `px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${badgeClass}`;
    }
    if (panelBadge) {
      panelBadge.innerHTML = panelText;
      panelBadge.className = `px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${panelClass}`;
    }
  },

  // Guardar un resultado de evaluación (en Google Drive, Supabase y respaldo en LocalStorage)
  async saveEvaluation(record) {
    // 1. Siempre guardar una copia local inmediata
    this.saveLocalRecord(record);

    let payloadRespuestas = Array.isArray(record.respuestas) ? [...record.respuestas] : [];
    if (Array.isArray(payloadRespuestas)) {
      payloadRespuestas = payloadRespuestas.filter(x => !x || !x._intento);
      payloadRespuestas.unshift({ _intento: Number(record.intento || 1), _totalIntentos: 2 });
    }

    const payload = {
      id: record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'eval-' + Date.now()),
      created_at: record.fechaISO || new Date().toISOString(),
      nombre: record.nombre,
      documento: record.documento || '',
      ficha: String(record.ficha),
      intento: Number(record.intento || 1),
      puntaje: Number(record.puntaje),
      total_preguntas: Number(record.totalPreguntas),
      porcentaje: Number(record.porcentaje),
      aprobado: Boolean(record.aprobado),
      tiempo_empleado: record.tiempo || '',
      respuestas_detalle: payloadRespuestas,
      calificado_sofia: Boolean(record.calificado_sofia)
    };

    // 2. Si Google Drive (Apps Script) está configurado, guardar en Google Sheets
    if (this.isGoogleSheetsConfigured()) {
      try {
        const cfg = this.getConfig();
        const res = await fetch(cfg.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'insert', record: payload })
        });
        const json = await res.json();
        if (json && json.status === 'ok') {
          this.status = 'connected';
          this.updateStatusBadge();
          if (window.app && window.app.showToast) {
            window.app.showToast('✅ Evaluación registrada exitosamente en Google Drive', 'success');
          }
          return { synced: true, source: 'google_drive', data: [payload] };
        }
      } catch (err) {
        console.error('Error guardando en Google Drive:', err);
      }
    }

    // 3. Si Supabase está configurado, guardar en la nube
    if (this.isConfigured()) {
      this.initClient();
      if (this.client) {
        try {
          const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

          const supaPayload = { ...payload };
          if (!isUUID(record.id)) {
            delete supaPayload.id;
          }

          let { data, error } = await this.client
            .from(this.tableName)
            .insert([supaPayload])
            .select();

          // Resiliencia: Si la tabla de Supabase aún no tiene columnas añadidas (intento, calificado_sofia), reintentar
          if (error && (error.message.includes('intento') || error.message.includes('calificado_sofia') || error.code === '42703')) {
            const fallbackPayload = { ...payload };
            if (error.message.includes('intento') || error.code === '42703') delete fallbackPayload.intento;
            if (error.message.includes('calificado_sofia') || error.code === '42703') delete fallbackPayload.calificado_sofia;
            const retry = await this.client.from(this.tableName).insert([fallbackPayload]).select();
            data = retry.data;
            error = retry.error;
          }

          if (error) {
            console.error('Error al sincronizar con Supabase:', error);
            if (window.app && window.app.showToast) {
              window.app.showToast('⚠️ No se pudo guardar en Supabase: ' + (error.message || error.code), 'error');
            }
            return {
              synced: false,
              source: 'local',
              warning: 'Guardado localmente. Supabase reportó: ' + error.message
            };
          }

          this.status = 'connected';
          this.updateStatusBadge();
          if (window.app && window.app.showToast) {
            window.app.showToast('✅ Evaluación registrada exitosamente en Supabase (Nube)', 'success');
          }
          return { synced: true, source: 'supabase', data };
        } catch (err) {
          console.error('Fallo de red al enviar a Supabase:', err);
          return {
            synced: false,
            source: 'local',
            warning: 'Guardado localmente (sin conexión con Supabase)'
          };
        }
      }
    }

    return {
      synced: false,
      source: 'local',
      warning: 'Guardado localmente (Configura Supabase para guardar en la nube)'
    };
  },

  // Obtener todas las evaluaciones (de Google Drive, Supabase o CSV/LocalStorage)
  async fetchEvaluations() {
    if (this.isGoogleSheetsConfigured()) {
      try {
        const cfg = this.getConfig();
        const res = await fetch(cfg.googleScriptUrl + '?action=list&t=' + Date.now());
        const json = await res.json();
        if (json && json.status === 'ok' && Array.isArray(json.data)) {
          this.status = 'connected';
          this.updateStatusBadge();
          const sofiaMap = this.getSofiaStatusMap();
          const mapped = json.data.map(item => {
            let respuestasRaw = item.respuestas_detalle;
            if (typeof respuestasRaw === 'string') {
              try { respuestasRaw = JSON.parse(respuestasRaw); } catch (e) { respuestasRaw = []; }
            }
            let intentoNum = item.intento || 1;
            if ((!intentoNum || intentoNum === 1) && Array.isArray(respuestasRaw)) {
              const meta = respuestasRaw.find(x => x && x._intento);
              if (meta) intentoNum = meta._intento;
            }
            const cleanDoc = item.documento ? String(item.documento).replace(/\D/g, '') : '';
            const cleanNom = (item.nombre || '').toLowerCase();
            if (cleanDoc === '1116642064' || cleanNom.includes('sergio andr')) intentoNum = 2;

            const cleanRespuestas = Array.isArray(respuestasRaw)
              ? respuestasRaw.filter(x => !x || !x._intento)
              : respuestasRaw;

            const localSofia = sofiaMap[String(item.id)] || (cleanDoc ? sofiaMap[`doc_${cleanDoc}`] : null);
            const itemSofia = String(item.calificado_sofia).toLowerCase() === 'true' || item.calificado_sofia === true;
            const isCalificado = itemSofia || Boolean(localSofia && localSofia.calificado_sofia);
            const isoDate = item.created_at ? String(item.created_at).replace(' ', 'T') : new Date().toISOString();

            return {
              id: item.id,
              nombre: item.nombre,
              documento: String(item.documento || ''),
              ficha: String(item.ficha || ''),
              intento: Number(intentoNum) || 1,
              puntaje: Number(item.puntaje || 0),
              totalPreguntas: Number(item.total_preguntas || 10),
              porcentaje: Number(item.porcentaje || 0),
              aprobado: String(item.aprobado).toLowerCase() === 'true' || item.aprobado === true,
              tiempo: item.tiempo_empleado || '',
              fecha: new Date(isoDate).toLocaleString('es-CO'),
              fechaISO: isoDate,
              respuestas: cleanRespuestas,
              calificado_sofia: isCalificado,
              calificado_sofia_por: item.calificado_sofia_por || (localSofia ? localSofia.calificado_sofia_por : '') || '',
              calificado_sofia_fecha: item.calificado_sofia_fecha || (localSofia ? localSofia.calificado_sofia_fecha : '') || '',
              origen: 'google_drive'
            };
          });
          localStorage.setItem('SENA_EVALUACIONES_CACHE', JSON.stringify(mapped));
          return { records: mapped, source: 'supabase' };
        }
      } catch (err) {
        console.warn('Error consultando Google Drive, usando respaldo:', err);
      }
    }

    if (this.isConfigured()) {
      this.initClient();
      if (this.client) {
        try {
          const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            this.status = 'connected';
            this.updateStatusBadge();

            // Leer mapa persistente local de calificaciones SOFIA para no perder marcas locales al recargar
            const sofiaMap = this.getSofiaStatusMap();

            const mapped = data.map(item => {
              // Recuperar número de intento (de columna SQL, o de metadata JSONB respuestas_detalle)
              let intentoNum = item.intento;
              if ((!intentoNum || intentoNum === 1) && Array.isArray(item.respuestas_detalle)) {
                const meta = item.respuestas_detalle.find(x => x && x._intento);
                if (meta) intentoNum = meta._intento;
              }

              // Normalizar aprendiz para caso especial confirmado: Sergio Andrés Merchán Álvarez
              const cleanDoc = item.documento ? String(item.documento).replace(/\D/g, '') : '';
              const cleanNom = (item.nombre || '').toLowerCase();
              if (cleanDoc === '1116642064' || cleanNom.includes('sergio andr')) {
                intentoNum = 2;
              }

              // Limpiar metadata de preguntas para no alterar la visualización
              const cleanRespuestas = Array.isArray(item.respuestas_detalle) 
                ? item.respuestas_detalle.filter(x => !x || !x._intento) 
                : item.respuestas_detalle;

              const localSofia = sofiaMap[String(item.id)] || (cleanDoc ? sofiaMap[`doc_${cleanDoc}`] : null);
              const isCalificado = Boolean(item.calificado_sofia) || Boolean(localSofia && localSofia.calificado_sofia);

              return {
                id: item.id,
                nombre: item.nombre,
                documento: item.documento,
                ficha: item.ficha,
                intento: Number(intentoNum) || 1,
                puntaje: item.puntaje,
                totalPreguntas: item.total_preguntas || 10,
                porcentaje: Number(item.porcentaje),
                aprobado: item.aprobado,
                tiempo: item.tiempo_empleado,
                fecha: new Date(item.created_at).toLocaleString('es-CO'),
                fechaISO: item.created_at,
                respuestas: cleanRespuestas,
                calificado_sofia: isCalificado,
                calificado_sofia_por: item.calificado_sofia_por || (localSofia ? localSofia.calificado_sofia_por : '') || '',
                calificado_sofia_fecha: item.calificado_sofia_fecha || (localSofia ? localSofia.calificado_sofia_fecha : '') || '',
                origen: 'supabase'
              };
            });

            // Respaldar en caché
            localStorage.setItem('SENA_EVALUACIONES_CACHE', JSON.stringify(mapped));
            return { records: mapped, source: 'supabase' };
          } else if (error) {
            console.warn('Error consultando Supabase:', error);
          }
        } catch (e) {
          console.warn('Fallo consultando Supabase, cargando datos locales:', e);
        }
      }
    }

    // Si Supabase falla o está restringido, intentar cargar el respaldo base desde Derechos_fundamentales.csv
    await this.loadCsvBackupIfNeeded();

    // Retornar local storage (incluyendo la caché respaldada de Supabase y CSV)
    const local = this.getAllLocalAndCachedRecords();
    return { records: local, source: 'csv' };
  },

  parseCsvText(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(field);
          field = '';
        } else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field);
          field = '';
          if (row.length > 1 || row[0] !== '') rows.push(row);
          row = [];
        } else {
          field += c;
        }
      }
    }
    if (field || row.length > 0) {
      row.push(field);
      if (row.length > 1 || row[0] !== '') rows.push(row);
    }
    return rows;
  },

  async loadCsvBackupIfNeeded() {
    try {
      const response = await fetch('Derechos_fundamentales.csv?v=' + Date.now());
      if (!response.ok) return;
      const csvText = await response.text();
      const rows = this.parseCsvText(csvText);
      if (rows.length <= 1) return;

      const sofiaMap = this.getSofiaStatusMap();
      const deletedIds = this.getDeletedIdsSet();
      const mapped = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length < 10) continue;

        const id = cols[0];
        if (deletedIds.has(String(id))) continue;

        const createdAt = cols[1];
        const nombre = cols[2];
        const documento = cols[3];
        const ficha = cols[4];
        const puntaje = Number(cols[5] || 0);
        const totalPreguntas = Number(cols[6] || 10);
        const porcentaje = Number(cols[7] || 0);
        const aprobado = String(cols[8]).toLowerCase() === 'true';
        const tiempo = cols[9] || '';
        let respuestasRaw = [];
        try {
          if (cols[10]) respuestasRaw = JSON.parse(cols[10]);
        } catch (e) {
          respuestasRaw = [];
        }
        const csvSofia = String(cols[11] || '').trim().toLowerCase() === 'true';

        let intentoNum = 1;
        if (Array.isArray(respuestasRaw)) {
          const meta = respuestasRaw.find(x => x && x._intento);
          if (meta) intentoNum = meta._intento;
        }

        const cleanDoc = documento ? String(documento).replace(/\D/g, '') : '';
        const cleanNom = (nombre || '').toLowerCase();
        if (cleanDoc === '1116642064' || cleanNom.includes('sergio andr')) {
          intentoNum = 2;
        }

        const cleanRespuestas = Array.isArray(respuestasRaw)
          ? respuestasRaw.filter(x => !x || !x._intento)
          : respuestasRaw;

        const localSofia = sofiaMap[String(id)] || (cleanDoc ? sofiaMap[`doc_${cleanDoc}`] : null);
        const isCalificado = csvSofia || Boolean(localSofia && localSofia.calificado_sofia);
        const isoDate = createdAt ? createdAt.replace(' ', 'T') : new Date().toISOString();

        mapped.push({
          id: id,
          nombre: nombre,
          documento: documento,
          ficha: ficha,
          intento: Number(intentoNum) || 1,
          puntaje: puntaje,
          totalPreguntas: totalPreguntas,
          porcentaje: porcentaje,
          aprobado: aprobado,
          tiempo: tiempo,
          fecha: new Date(isoDate).toLocaleString('es-CO'),
          fechaISO: isoDate,
          respuestas: cleanRespuestas,
          calificado_sofia: isCalificado,
          calificado_sofia_por: localSofia ? (localSofia.calificado_sofia_por || '') : '',
          calificado_sofia_fecha: localSofia ? (localSofia.calificado_sofia_fecha || '') : '',
          origen: 'csv'
        });
      }

      if (mapped.length > 0) {
        localStorage.setItem('SENA_EVALUACIONES_CACHE', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('No se pudo cargar Derechos_fundamentales.csv:', err);
    }
  },

  // Eliminar una evaluación (de Supabase y de LocalStorage)
  async deleteEvaluation(recordId) {
    if (!recordId) return { success: false, message: 'ID no proporcionado' };

    // 1. Eliminar siempre de la persistencia local
    this.deleteLocalRecord(recordId);

    // 2. Si Google Drive está configurado, eliminar en la hoja
    if (this.isGoogleSheetsConfigured()) {
      try {
        const cfg = this.getConfig();
        const res = await fetch(cfg.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'delete', id: recordId })
        });
        const json = await res.json();
        if (json && json.status === 'ok') {
          return { success: true, source: 'google_drive' };
        }
      } catch (err) {
        console.warn('Error eliminando en Google Drive:', err);
      }
    }

    // 3. Si está conectado a Supabase, eliminar en la nube
    if (this.isConfigured()) {
      this.initClient();
      if (this.client) {
        try {
          const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', recordId);

          if (error) {
            console.warn('Error al eliminar registro en Supabase:', error);
            return { success: false, source: 'local_only', error: error.message };
          }

          return { success: true, source: 'supabase' };
        } catch (err) {
          console.warn('Fallo de red al eliminar en Supabase:', err);
          return { success: false, source: 'local_only', error: err.message };
        }
      }
    }

    return { success: true, source: 'local' };
  },

  // Actualizar estado de calificación en SOFIA PLUS (Supabase y LocalStorage con instructor que lo firma)
  async updateEvaluationSofiaStatus(recordId, isCalificado, instructorName = '', fecha = '') {
    if (!recordId) return { success: false, message: 'ID no proporcionado' };

    const author = isCalificado ? (instructorName || 'Instructor del Área') : '';
    const dateStr = isCalificado ? (fecha || new Date().toLocaleString('es-CO')) : '';

    // 1. Actualizar siempre en LocalStorage (datos primarios y caché)
    this.updateLocalRecordSofiaStatus(recordId, isCalificado, author, dateStr);

    // 2. Si Google Drive está configurado, actualizar en la hoja de cálculo
    if (this.isGoogleSheetsConfigured()) {
      try {
        const cfg = this.getConfig();
        const res = await fetch(cfg.googleScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'update_sofia',
            id: recordId,
            calificado_sofia: Boolean(isCalificado),
            calificado_sofia_por: author,
            calificado_sofia_fecha: dateStr
          })
        });
        const json = await res.json();
        if (json && json.status === 'ok') {
          return { success: true, source: 'google_drive' };
        }
      } catch (err) {
        console.warn('Error actualizando estado SOFIA en Google Drive:', err);
      }
    }

    // 3. Si Supabase está configurado, actualizar en la nube
    if (this.isConfigured()) {
      this.initClient();
      if (this.client) {
        try {
          const updatePayload = {
            calificado_sofia: Boolean(isCalificado)
          };

          let { error } = await this.client
            .from(this.tableName)
            .update(updatePayload)
            .eq('id', recordId);

          if (error) {
            console.warn('Advertencia al actualizar calificado_sofia en Supabase:', error);
            return { success: false, source: 'local_only', error: error.message };
          }

          return { success: true, source: 'supabase' };
        } catch (err) {
          console.warn('Fallo de red al actualizar calificado_sofia en Supabase:', err);
          return { success: false, source: 'local_only', error: err.message };
        }
      }
    }

    return { success: true, source: 'local' };
  },

  getSofiaStatusMap() {
    try {
      const raw = localStorage.getItem('SENA_SOFIA_STATUS_MAP');
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {
      console.error('Error leyendo SENA_SOFIA_STATUS_MAP:', e);
    }
    return {};
  },

  updateLocalRecordSofiaStatus(recordId, isCalificado, author = '', dateStr = '') {
    try {
      const sofiaMap = this.getSofiaStatusMap();
      let matchedDoc = '';

      // Actualizar datos locales primarios
      let list = this.getLocalRecords();
      list = list.map(r => {
        if (String(r.id) === String(recordId)) {
          r.calificado_sofia = Boolean(isCalificado);
          r.calificado_sofia_por = isCalificado ? author : '';
          r.calificado_sofia_fecha = isCalificado ? dateStr : '';
          if (r.documento) matchedDoc = String(r.documento).replace(/\D/g, '');
        }
        return r;
      });
      localStorage.setItem('SENA_EVALUACIONES_DATA', JSON.stringify(list));

      // Actualizar también en caché de Supabase
      const cacheRaw = localStorage.getItem('SENA_EVALUACIONES_CACHE');
      if (cacheRaw) {
        let cacheList = JSON.parse(cacheRaw);
        if (Array.isArray(cacheList)) {
          cacheList = cacheList.map(r => {
            if (String(r.id) === String(recordId)) {
              r.calificado_sofia = Boolean(isCalificado);
              r.calificado_sofia_por = isCalificado ? author : '';
              r.calificado_sofia_fecha = isCalificado ? dateStr : '';
              if (r.documento) matchedDoc = String(r.documento).replace(/\D/g, '');
            }
            return r;
          });
          localStorage.setItem('SENA_EVALUACIONES_CACHE', JSON.stringify(cacheList));
        }
      }

      // Persistir en mapa independiente para que nunca se sobrescriba al sincronizar con Supabase
      const entry = {
        calificado_sofia: Boolean(isCalificado),
        calificado_sofia_por: isCalificado ? author : '',
        calificado_sofia_fecha: isCalificado ? dateStr : ''
      };
      sofiaMap[String(recordId)] = entry;
      if (matchedDoc) {
        sofiaMap[`doc_${matchedDoc}`] = entry;
      }
      localStorage.setItem('SENA_SOFIA_STATUS_MAP', JSON.stringify(sofiaMap));
    } catch (e) {
      console.error('Error actualizando calificado_sofia en LocalStorage:', e);
    }
  },

  // Manejo de LocalStorage
  getLocalRecords() {
    try {
      const raw = localStorage.getItem('SENA_EVALUACIONES_DATA');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  getAllLocalAndCachedRecords() {
    const combined = [];
    const seenIds = new Set();
    const sofiaMap = this.getSofiaStatusMap();

    const applySofia = (item) => {
      if (!item) return item;
      const cleanDoc = item.documento ? String(item.documento).replace(/\D/g, '') : '';
      const localSofia = sofiaMap[String(item.id)] || (cleanDoc ? sofiaMap[`doc_${cleanDoc}`] : null);
      if (localSofia) {
        item.calificado_sofia = Boolean(item.calificado_sofia) || Boolean(localSofia.calificado_sofia);
        item.calificado_sofia_por = item.calificado_sofia_por || localSofia.calificado_sofia_por || '';
        item.calificado_sofia_fecha = item.calificado_sofia_fecha || localSofia.calificado_sofia_fecha || '';
      }
      return item;
    };

    try {
      const cacheRaw = localStorage.getItem('SENA_EVALUACIONES_CACHE');
      if (cacheRaw) {
        const cacheList = JSON.parse(cacheRaw);
        if (Array.isArray(cacheList)) {
          for (const item of cacheList) {
            const key = item.id || `${item.documento}_${item.ficha}_${item.fechaISO}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              combined.push(applySofia(item));
            }
          }
        }
      }
    } catch (e) {
      console.error('Error leyendo SENA_EVALUACIONES_CACHE:', e);
    }

    const localList = this.getLocalRecords();
    if (Array.isArray(localList)) {
      for (const item of localList) {
        const key = item.id || `${item.documento}_${item.ficha}_${item.fechaISO}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          combined.push(applySofia(item));
        }
      }
    }

    return combined;
  },

  saveLocalRecord(record) {
    const list = this.getLocalRecords();
    list.unshift(record);
    localStorage.setItem('SENA_EVALUACIONES_DATA', JSON.stringify(list));
  },

  getDeletedIdsSet() {
    try {
      const raw = localStorage.getItem('SENA_DELETED_IDS');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr.map(String));
      }
    } catch (e) {
      console.error('Error leyendo SENA_DELETED_IDS:', e);
    }
    return new Set();
  },

  deleteLocalRecord(recordId) {
    try {
      const deletedSet = this.getDeletedIdsSet();
      deletedSet.add(String(recordId));
      localStorage.setItem('SENA_DELETED_IDS', JSON.stringify(Array.from(deletedSet)));

      // Eliminar de datos locales primarios
      let list = this.getLocalRecords();
      list = list.filter(r => String(r.id) !== String(recordId));
      localStorage.setItem('SENA_EVALUACIONES_DATA', JSON.stringify(list));

      // Eliminar también de la caché de Supabase
      const cacheRaw = localStorage.getItem('SENA_EVALUACIONES_CACHE');
      if (cacheRaw) {
        let cacheList = JSON.parse(cacheRaw);
        if (Array.isArray(cacheList)) {
          cacheList = cacheList.filter(r => String(r.id) !== String(recordId));
          localStorage.setItem('SENA_EVALUACIONES_CACHE', JSON.stringify(cacheList));
        }
      }
    } catch (e) {
      console.error('Error eliminando de LocalStorage:', e);
    }
  },

  // Script SQL para copiar en Supabase
  getSqlScript() {
    return `-- ========================================================
-- SCRIPT DE INICIALIZACIÓN DE TABLA PARA SUPABASE
-- Plataforma de Evaluación SENA: Derechos Fundamentales
-- ========================================================

-- 1. Crear tabla de evaluaciones
CREATE TABLE IF NOT EXISTS public.evaluaciones_sena (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre TEXT NOT NULL,
    documento TEXT,
    ficha TEXT NOT NULL,
    intento INTEGER DEFAULT 1,
    puntaje INTEGER NOT NULL,
    total_preguntas INTEGER NOT NULL DEFAULT 10,
    porcentaje NUMERIC(5,2) NOT NULL,
    aprobado BOOLEAN NOT NULL,
    calificado_sofia BOOLEAN DEFAULT FALSE,
    tiempo_empleado TEXT,
    respuestas_detalle JSONB
);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.evaluaciones_sena ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir inserción anónima
CREATE POLICY "Permitir insercion anonima" 
ON public.evaluaciones_sena 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 4. Crear política para permitir lectura anónima
CREATE POLICY "Permitir lectura anonima" 
ON public.evaluaciones_sena 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5. Crear política para permitir eliminación
CREATE POLICY "Permitir eliminacion anonima" 
ON public.evaluaciones_sena 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- 6. Crear política para permitir actualización (ej: calificado_sofia)
CREATE POLICY "Permitir actualizacion anonima" 
ON public.evaluaciones_sena 
FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

-- 7. Crear índices para búsquedas rápidas por ficha y fecha
CREATE INDEX IF NOT EXISTS idx_evaluaciones_ficha ON public.evaluaciones_sena (ficha);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON public.evaluaciones_sena (created_at DESC);

-- 8. Migración para tablas existentes que no tengan la columna calificado_sofia o intento:
ALTER TABLE public.evaluaciones_sena ADD COLUMN IF NOT EXISTS intento INTEGER DEFAULT 1;
ALTER TABLE public.evaluaciones_sena ADD COLUMN IF NOT EXISTS calificado_sofia BOOLEAN DEFAULT FALSE;
`;
  }
};

window.SupabaseManager = SupabaseManager;
