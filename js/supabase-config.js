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

    // 1. Verificar si hay credenciales predeterminadas en supabase-credentials.js
    if (window.DEFAULT_SUPABASE_CONFIG) {
      if (window.DEFAULT_SUPABASE_CONFIG.url) url = window.DEFAULT_SUPABASE_CONFIG.url.trim();
      if (window.DEFAULT_SUPABASE_CONFIG.anonKey) anonKey = window.DEFAULT_SUPABASE_CONFIG.anonKey.trim();
    }

    // 2. Verificar si hay credenciales guardadas en el navegador
    try {
      const stored = localStorage.getItem(SUPABASE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url) url = parsed.url.trim();
        if (parsed.anonKey) anonKey = parsed.anonKey.trim();
      }
    } catch (e) {
      console.error('Error leyendo config Supabase:', e);
    }

    return {
      url: url,
      anonKey: anonKey,
      tableName: this.tableName
    };
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
      badgeText = '🟢 Supabase Conectado';
      badgeClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40';
      panelText = '🟢 Conectado a Supabase (En la nube)';
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

  // Guardar un resultado de evaluación (en Supabase y respaldo en LocalStorage)
  async saveEvaluation(record) {
    // 1. Siempre guardar una copia local inmediata
    this.saveLocalRecord(record);

    // 2. Si Supabase está configurado, guardar en la nube
    if (this.isConfigured()) {
      this.initClient();
      if (this.client) {
        try {
          const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

          // Asegurar preservación de metadato de intento en respuestas_detalle (compatible con Supabase JSONB)
          let payloadRespuestas = Array.isArray(record.respuestas) ? [...record.respuestas] : [];
          if (Array.isArray(payloadRespuestas)) {
            payloadRespuestas = payloadRespuestas.filter(x => !x || !x._intento);
            payloadRespuestas.unshift({ _intento: Number(record.intento || 1), _totalIntentos: 2 });
          }

          const payload = {
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

          // Solo enviar id si es un UUID válido de Postgres; de lo contrario gen_random_uuid() lo genera
          if (isUUID(record.id)) {
            payload.id = record.id;
          }

          let { data, error } = await this.client
            .from(this.tableName)
            .insert([payload])
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

  // Obtener todas las evaluaciones (de Supabase si está disponible, o de LocalStorage)
  async fetchEvaluations() {
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
                calificado_sofia: Boolean(item.calificado_sofia),
                calificado_sofia_por: item.calificado_sofia_por || '',
                calificado_sofia_fecha: item.calificado_sofia_fecha || '',
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

    // Retornar local storage
    const local = this.getLocalRecords();
    return { records: local, source: 'local' };
  },

  // Eliminar una evaluación (de Supabase y de LocalStorage)
  async deleteEvaluation(recordId) {
    if (!recordId) return { success: false, message: 'ID no proporcionado' };

    // 1. Eliminar siempre de la persistencia local
    this.deleteLocalRecord(recordId);

    // 2. Si está conectado a Supabase, eliminar en la nube
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

    // 2. Si Supabase está configurado, actualizar en la nube
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

  updateLocalRecordSofiaStatus(recordId, isCalificado, author = '', dateStr = '') {
    try {
      // Actualizar datos locales primarios
      let list = this.getLocalRecords();
      list = list.map(r => {
        if (String(r.id) === String(recordId)) {
          r.calificado_sofia = Boolean(isCalificado);
          r.calificado_sofia_por = isCalificado ? author : '';
          r.calificado_sofia_fecha = isCalificado ? dateStr : '';
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
            }
            return r;
          });
          localStorage.setItem('SENA_EVALUACIONES_CACHE', JSON.stringify(cacheList));
        }
      }
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

  saveLocalRecord(record) {
    const list = this.getLocalRecords();
    list.unshift(record);
    localStorage.setItem('SENA_EVALUACIONES_DATA', JSON.stringify(list));
  },

  deleteLocalRecord(recordId) {
    try {
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
