/**
 * MOTOR DE EVALUACIÓN INTERACTIVA SENA
 * Gestiona el cuestionario oficial de 10 preguntas, temporizador, retroalimentación formativa y guardado.
 */

class QuizEngine {
  constructor() {
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.apprentice = {
      nombre: '',
      documento: '',
      ficha: ''
    };
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isCompleted = false;
    this.questions = [];
  }

  getQuestionsList() {
    if (this.questions && this.questions.length > 0) {
      return this.questions;
    }
    if (typeof SENA_APP_DATA !== 'undefined' && Array.isArray(SENA_APP_DATA.preguntas) && SENA_APP_DATA.preguntas.length > 0) {
      this.questions = JSON.parse(JSON.stringify(SENA_APP_DATA.preguntas));
      return this.questions;
    }
    if (window.SENA_APP_DATA && Array.isArray(window.SENA_APP_DATA.preguntas) && window.SENA_APP_DATA.preguntas.length > 0) {
      this.questions = JSON.parse(JSON.stringify(window.SENA_APP_DATA.preguntas));
      return this.questions;
    }

    // Banco de respaldo directo integrado
    this.questions = [
      {
        id: 1,
        numero: 1,
        enunciado: "Dentro de las características esenciales de los Derechos Humanos, ¿cuál de ellas determina que estos son irrenunciables y que ningún individuo puede ser despojado de los mismos bajo ninguna circunstancia?",
        opciones: [
          { key: "A", texto: "Universales." },
          { key: "B", texto: "Inalienables." },
          { key: "C", texto: "Indivisibles." },
          { key: "D", texto: "Interdependientes." }
        ],
        respuestaCorrecta: "B",
        justificacion: "Bajo la doctrina universal de los derechos humanos, se establece que estos son inalienables, lo cual implica que son inherentes a la condición humana y no pueden ser objeto de transferencia, renuncia o despojo por parte de terceros ni del Estado."
      },
      {
        id: 2,
        numero: 2,
        enunciado: "Los derechos de Primera Generación, centrados en la dimensión civil y política del individuo (como el derecho al voto y la libre asociación), se fundamentan primordialmente en el ideal de:",
        opciones: [
          { key: "A", texto: "La igualdad." },
          { key: "B", texto: "La solidaridad." },
          { key: "C", texto: "La libertad." },
          { key: "D", texto: "La fraternidad." }
        ],
        respuestaCorrecta: "C",
        justificacion: "De conformidad con la clasificación histórica de los derechos, los de primera generación (civiles y políticos) surgieron para proteger la esfera de autonomía del individuo, teniendo como ideal supremo la libertad."
      },
      {
        id: 3,
        numero: 3,
        enunciado: "¿A qué clasificación pertenecen los derechos económicos, sociales y culturales, tales como la educación, la salud y la vivienda, cuyo eje rector es la búsqueda de la igualdad?",
        opciones: [
          { key: "A", texto: "Primera generación." },
          { key: "B", texto: "Segunda generación." },
          { key: "C", texto: "Tercera generación." },
          { key: "D", texto: "Cuarta generación." }
        ],
        respuestaCorrecta: "B",
        justificacion: "La clasificación técnica de los derechos de segunda generación agrupa los derechos económicos, sociales y culturales, cuyo objetivo es asegurar condiciones de vida dignas bajo el ideal de la igualdad material."
      },
      {
        id: 4,
        numero: 4,
        enunciado: "El derecho a gozar de un medio ambiente sano y el derecho a la paz son expresiones de los derechos de Tercera Generación. ¿Cuál es el valor ético y jurídico que los sustenta?",
        opciones: [
          { key: "A", texto: "La libertad individual." },
          { key: "B", texto: "El desarrollo económico." },
          { key: "C", texto: "La solidaridad." },
          { key: "D", texto: "La seguridad nacional." }
        ],
        respuestaCorrecta: "C",
        justificacion: "Los derechos de tercera generación, también conocidos como derechos de los pueblos, se enfocan en intereses colectivos como la paz y el medio ambiente, fundamentándose en el valor de la solidaridad entre naciones y generaciones."
      },
      {
        id: 5,
        numero: 5,
        enunciado: "Considerando la correlación ética entre derechos y deberes, si un ciudadano ejerce su derecho fundamental a expresar su opinión y a ser escuchado, ¿qué deber correlativo asume frente a la sociedad?",
        opciones: [
          { key: "A", texto: "Garantizar que su opinión prevalezca sobre las demás." },
          { key: "B", texto: "Respetar las opiniones y posturas de las demás personas." },
          { key: "C", texto: "Guardar silencio cuando otros disientan de su pensamiento." },
          { key: "D", texto: "Limitar su opinión a temas estrictamente laborales." }
        ],
        respuestaCorrecta: "B",
        justificacion: "La convivencia democrática se basa en la reciprocidad; por tanto, el derecho a la libre expresión conlleva el deber ético de respetar las opiniones ajenas, permitiendo un diálogo social armónico."
      },
      {
        id: 6,
        numero: 6,
        enunciado: "De acuerdo con el ordenamiento constitucional colombiano, el Artículo 25 define el trabajo bajo la siguiente naturaleza jurídica:",
        opciones: [
          { key: "A", texto: "Es un servicio privado regulado exclusivamente por el mercado." },
          { key: "B", texto: "Es un derecho fundamental y una obligación social que goza de la especial protección del Estado." },
          { key: "C", texto: "Es un derecho optativo supeditado a la existencia de contratos escritos." },
          { key: "D", texto: "Es una concesión del empleador basada en la autonomía de la voluntad." }
        ],
        respuestaCorrecta: "B",
        justificacion: "En virtud del Artículo 25 de la Constitución Política, el trabajo trasciende la esfera individual para convertirse en una obligación social, exigiendo del Estado una protección especial en todas sus modalidades."
      },
      {
        id: 7,
        numero: 7,
        enunciado: "El Artículo 53 de la Constitución Política de Colombia es el pilar de la legislación del trabajo porque impone al legislador la observancia de:",
        opciones: [
          { key: "A", texto: "Los reglamentos internos de trabajo de las multinacionales." },
          { key: "B", texto: "Los principios mínimos fundamentales, como la igualdad de oportunidades y la estabilidad laboral." },
          { key: "C", texto: "La primacía de los intereses económicos sobre los derechos sociales." },
          { key: "D", texto: "La flexibilidad total de la jornada laboral sin remuneración adicional." }
        ],
        respuestaCorrecta: "B",
        justificacion: "El Artículo 53 constitucional establece los principios mínimos fundamentales que deben regir toda relación laboral, destacando la igualdad de oportunidades, la remuneración mínima vital y la estabilidad en el empleo."
      },
      {
        id: 8,
        numero: 8,
        enunciado: "Dada la asimetría en las relaciones de poder dentro del ámbito productivo, el Derecho Laboral tiene como función primordial proteger a:",
        opciones: [
          { key: "A", texto: "La parte empleadora para asegurar la rentabilidad del capital." },
          { key: "B", texto: "El Estado para garantizar el orden público económico." },
          { key: "C", texto: "La parte más débil de la relación, representada por el trabajador." },
          { key: "D", texto: "Las organizaciones gremiales exclusivamente." }
        ],
        respuestaCorrecta: "C",
        justificacion: "La naturaleza protectora del Derecho Laboral reconoce que existe una desigualdad inherente en la relación contractual, por lo cual busca equilibrar la balanza protegiendo a la parte más débil, que es el trabajador."
      },
      {
        id: 9,
        numero: 9,
        enunciado: "Según las estadísticas oficiales del Ministerio de Trabajo, ¿cuál es el factor que origina más del 60% de los conflictos laborales en el territorio nacional?",
        opciones: [
          { key: "A", texto: "La obsolescencia tecnológica de los puestos de trabajo." },
          { key: "B", texto: "Incumplimientos de contrato o despidos sin justa causa." },
          { key: "C", texto: "El desconocimiento de la normativa tributaria por parte del empleado." },
          { key: "D", texto: "La falta de vocación de servicio de los aprendices." }
        ],
        respuestaCorrecta: "B",
        justificacion: "De acuerdo con los datos técnicos proporcionados por el Ministerio de Trabajo, la mayor parte de la litigiosidad laboral en Colombia se deriva de incumplimientos de contrato y la ruptura del vínculo laboral sin el cumplimiento de los requisitos legales o justa causa."
      },
      {
        id: 10,
        numero: 10,
        enunciado: "En el marco de los resultados de aprendizaje del SENA y el estudio de la fenomenología del trabajo, este se reconoce fundamentalmente como un factor de:",
        opciones: [
          { key: "A", texto: "Acumulación patrimonial sin impacto social." },
          { key: "B", texto: "Movilidad social y transformación vital del ser humano." },
          { key: "C", texto: "Generación de subordinación absoluta e incuestionable." },
          { key: "D", texto: "Competencia individualista desprovista de derechos." }
        ],
        respuestaCorrecta: "B",
        justificacion: "Según el diseño curricular y los resultados de aprendizaje del SENA, el trabajo debe valorarse a través de la fenomenología como una herramienta de movilidad social y de transformación vital, permitiendo al individuo integrarse plenamente en la ciudadanía laboral."
      }
    ];

    return this.questions;
  }

  normalizeDoc(doc) {
    return String(doc || '').replace(/[\s.\-_,]/g, '').trim();
  }

  normalizeText(txt) {
    return String(txt || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  init() {
    this.getQuestionsList();
    this.reset();
    this.setupRealtimeCheck();
  }

  setupRealtimeCheck() {
    const docInput = document.getElementById('quiz-input-doc');
    const nameInput = document.getElementById('quiz-input-name');
    const fichaInput = document.getElementById('quiz-input-ficha');
    const errorEl = document.getElementById('quiz-setup-error');
    const startBtn = document.getElementById('btn-start-quiz');

    let debounceTimer = null;

    const checkOnChange = async () => {
      const doc = docInput ? docInput.value.trim() : '';
      const name = nameInput ? nameInput.value.trim() : '';
      const ficha = fichaInput ? fichaInput.value.trim() : '';
      const cleanDoc = this.normalizeDoc(doc);

      if (cleanDoc && cleanDoc.length >= 4) {
        const status = await this.checkApprenticeStatus(doc, name, ficha);
        
        if (status.hasPassed || status.attemptsCount >= 2) {
          const lastRec = status.passedRecord || status.previousRecords[0];
          const isPassed = status.hasPassed;

          if (errorEl) {
            errorEl.innerHTML = `
              <div class="p-4 rounded-2xl ${
                isPassed 
                  ? 'bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-rose-500/10 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200'
              } text-left animate-fadeIn shadow-sm">
                <div class="flex items-center gap-2.5 mb-2">
                  <span class="text-2xl">${isPassed ? '🎓' : '🛑'}</span>
                  <div>
                    <h4 class="font-black text-sm text-slate-900 dark:text-white">${isPassed ? 'Evaluación Aprobada' : 'Intentos Agotados (2/2)'}</h4>
                    <p class="text-xs opacity-90">El documento <strong>${doc}</strong> ${isPassed ? 'ya aprobó la prueba reglamentaria.' : 'ya completó los 2 intentos reglamentarios.'}</p>
                  </div>
                </div>
                <p class="text-xs mb-3 leading-relaxed">
                  ${isPassed 
                    ? `Resultado: <strong class="text-emerald-600 dark:text-emerald-400">APROBADO con ${status.bestScore}%</strong>. Tu certificación oficial está disponible.`
                    : `Resultado definitivo: <strong>${lastRec ? lastRec.porcentaje : 0}% (No Aprobado)</strong>.`}
                </p>
                <div class="flex flex-wrap items-center gap-2">
                  ${isPassed ? `
                    <button type="button" onclick="window.recordsManager.showCertificate(window.quizEngine.lastPassedRecord || ${JSON.stringify(status.passedRecord).replace(/"/g, '&quot;')})" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer">
                      <span>📜</span> Ver Mi Certificado SENA
                    </button>
                  ` : ''}
                  <button type="button" onclick="window.app.navigateTo('slides')" class="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition">
                    <span>📖</span> Ver Material de Estudio
                  </button>
                </div>
              </div>
            `;
            errorEl.classList.remove('hidden');
          }

          if (startBtn) {
            startBtn.disabled = true;
            startBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
            startBtn.innerHTML = isPassed ? '<span>🎓 Prueba Aprobada</span>' : '<span>🛑 Intentos Agotados</span>';
          }
          return;
        } else if (status.attemptsCount === 1 && !status.hasPassed) {
          // El aprendiz reprobó el primer intento -> Tiene habilitado el 2° intento
          const prevRec = status.previousRecords[0];
          if (errorEl) {
            errorEl.innerHTML = `
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 text-left animate-fadeIn shadow-sm">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xl">⚠️</span>
                  <h4 class="font-bold text-xs text-slate-900 dark:text-white">Primer intento no aprobado (${prevRec ? prevRec.porcentaje : 0}%)</h4>
                </div>
                <p class="text-xs opacity-90">Tienes derecho a un <strong>2° y último intento</strong>. Repasa los conceptos antes de comenzar.</p>
              </div>
            `;
            errorEl.classList.remove('hidden');
          }

          if (startBtn) {
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
            startBtn.innerHTML = '<span>🚀 Iniciar Segundo Intento (2/2)</span>';
          }
          return;
        }
      }

      // Si no hay registro previo para este documento
      if (errorEl && errorEl.innerHTML.includes('documento')) {
        errorEl.classList.add('hidden');
        errorEl.innerHTML = '';
      }
      if (startBtn && startBtn.disabled) {
        startBtn.disabled = false;
        startBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
        startBtn.innerHTML = '<span>🚀 Iniciar Cuestionario Oficial</span>';
      }
    };

    if (docInput) {
      docInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(checkOnChange, 300);
      });
      docInput.addEventListener('blur', checkOnChange);
      docInput.addEventListener('change', checkOnChange);
    }
  }

  reset() {
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.timerSeconds = 0;
    this.isCompleted = false;
    this.timerInterval = null;
    // Conservar currentAttemptNumber si fue establecido en startQuiz
    if (!this.currentAttemptNumber) {
      this.currentAttemptNumber = 1;
    }
  }

  // Obtener historial de intentos del aprendiz
  async getApprenticeAttempts(documento, nombre, ficha) {
    const cleanDoc = this.normalizeDoc(documento);
    const cleanName = this.normalizeText(nombre);
    const cleanFicha = String(ficha || '').trim();

    let allRecords = [];
    if (window.recordsManager && Array.isArray(window.recordsManager.records) && window.recordsManager.records.length > 0) {
      allRecords = window.recordsManager.records;
    } else if (window.SupabaseManager) {
      const res = await window.SupabaseManager.fetchEvaluations();
      allRecords = (res && res.records) || [];
      if (window.recordsManager) {
        window.recordsManager.records = allRecords;
      }
    }

    return allRecords.filter(r => {
      const rDoc = this.normalizeDoc(r.documento);
      const rName = this.normalizeText(r.nombre);
      const rFicha = String(r.ficha || '').trim();

      // Coincidencia por documento si tiene al menos 4 dígitos
      if (cleanDoc && rDoc && cleanDoc.length >= 4 && cleanDoc === rDoc) return true;
      // Coincidencia por (nombre + ficha)
      if (cleanName && cleanFicha && cleanName.length >= 4 && cleanName === rName && cleanFicha === rFicha) return true;
      return false;
    });
  }

  async checkApprenticeStatus(documento, nombre, ficha) {
    const previous = await this.getApprenticeAttempts(documento, nombre, ficha);
    const count = previous.length;
    const passedRecord = previous.find(r => r.aprobado);
    const hasPassed = !!passedRecord;
    const bestScore = previous.reduce((max, r) => Math.max(max, Number(r.porcentaje) || 0), 0);

    return {
      attemptsCount: count,
      previousRecords: previous,
      hasPassed: hasPassed,
      passedRecord: passedRecord,
      bestScore: bestScore,
      canAttempt: !hasPassed && count < 2,
      nextAttemptNumber: count + 1
    };
  }

  async startQuiz(nombre, documento, ficha) {
    if (typeof nombre !== 'string' || !nombre.trim()) {
      const elName = document.getElementById('quiz-input-name');
      nombre = elName ? elName.value : '';
    }
    if (typeof documento !== 'string' || !documento.trim()) {
      const elDoc = document.getElementById('quiz-input-doc');
      documento = elDoc ? elDoc.value : '';
    }
    if (typeof ficha !== 'string' || !ficha.trim()) {
      const elFicha = document.getElementById('quiz-input-ficha');
      ficha = elFicha ? elFicha.value : '';
    }

    const errorEl = document.getElementById('quiz-setup-error');
    const startBtn = document.getElementById('btn-start-quiz');

    if (!nombre || !nombre.trim()) {
      if (errorEl) {
        errorEl.textContent = '⚠️ Por favor ingresa tu Nombre Completo para iniciar la evaluación.';
        errorEl.classList.remove('hidden');
      } else {
        alert('Por favor ingresa tu Nombre Completo para iniciar la evaluación.');
      }
      const elName = document.getElementById('quiz-input-name');
      if (elName) elName.focus();
      return false;
    }

    if (!ficha || !ficha.trim()) {
      if (errorEl) {
        errorEl.textContent = '⚠️ Por favor ingresa el Número de Ficha SENA.';
        errorEl.classList.remove('hidden');
      } else {
        alert('Por favor ingresa el Número de Ficha SENA.');
      }
      const elFicha = document.getElementById('quiz-input-ficha');
      if (elFicha) elFicha.focus();
      return false;
    }

    if (!documento || !documento.trim()) {
      if (errorEl) {
        errorEl.textContent = '⚠️ Por favor ingresa tu Número de Documento (identificación oficial del aprendiz).';
        errorEl.classList.remove('hidden');
      } else {
        alert('Por favor ingresa tu Número de Documento.');
      }
      const elDoc = document.getElementById('quiz-input-doc');
      if (elDoc) elDoc.focus();
      return false;
    }

    // Comprobación de estado previo del aprendiz
    const status = await this.checkApprenticeStatus(documento, nombre, ficha);

    if (status.hasPassed || status.attemptsCount >= 2) {
      const lastRec = status.passedRecord || status.previousRecords[0];
      const isPassed = status.hasPassed;

      if (errorEl) {
        errorEl.innerHTML = `
          <div class="p-4 rounded-2xl ${
            isPassed 
              ? 'bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200' 
              : 'bg-rose-500/10 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200'
          } text-left animate-fadeIn shadow-sm">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="text-2xl">${isPassed ? '🎓' : '🛑'}</span>
              <div>
                <h4 class="font-black text-sm text-slate-900 dark:text-white">${isPassed ? 'Evaluación Ya Aprobada' : 'Intentos Reglamentarios Agotados (2/2)'}</h4>
                <p class="text-xs opacity-90">El documento <strong>${documento}</strong> ${isPassed ? 'ya cuenta con aprobación oficial.' : 'ya completó los 2 intentos permitidos.'}</p>
              </div>
            </div>
            <p class="text-xs mb-3 leading-relaxed">
              ${isPassed 
                ? `Resultado: <strong class="text-emerald-600 dark:text-emerald-400">APROBADO con ${status.bestScore}%</strong>. Tu certificado está disponible.`
                : `Resultado definitivo: <strong>${lastRec ? lastRec.porcentaje : 0}% (No Aprobado)</strong>.`}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              ${isPassed ? `
                <button type="button" onclick="window.recordsManager.showCertificate(window.quizEngine.lastPassedRecord || ${JSON.stringify(status.passedRecord).replace(/"/g, '&quot;')})" class="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer">
                  <span>📜</span> Ver y Descargar Certificado SENA
                </button>
              ` : ''}
              <button type="button" onclick="window.app.navigateTo('slides')" class="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition">
                <span>📖</span> Ir a Diapositivas
              </button>
            </div>
          </div>
        `;
        errorEl.classList.remove('hidden');
      } else {
        alert(isPassed ? `Ya aprobaste la prueba oficial con ${status.bestScore}%.` : 'Ya has agotado tus 2 intentos permitidos.');
      }

      if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
        startBtn.innerHTML = isPassed ? '<span>🎓 Prueba Aprobada</span>' : '<span>🛑 Intentos Agotados</span>';
      }
      return false;
    }

    // Configurar número de intento actual (1 o 2)
    this.currentAttemptNumber = (status.attemptsCount === 1 && !status.hasPassed) ? 2 : 1;

    if (errorEl) errorEl.classList.add('hidden');

    this.apprentice = {
      nombre: nombre.trim(),
      documento: (documento || '').trim(),
      ficha: ficha.trim()
    };

    // Asegurar carga de preguntas
    this.getQuestionsList();

    this.reset();

    // Alternar vistas
    const setupView = document.getElementById('quiz-setup-view');
    const runningView = document.getElementById('quiz-running-view');
    const resultsView = document.getElementById('quiz-results-view');

    if (setupView) setupView.classList.add('hidden');
    if (resultsView) resultsView.classList.add('hidden');
    if (runningView) {
      runningView.classList.remove('hidden');
      runningView.classList.add('animate-fadeIn');
    }

    // Notificación visual de intento
    if (window.app && window.app.showToast) {
      window.app.showToast(`🎯 Iniciando Intento ${this.currentAttemptNumber} de 2`, 'info');
    }

    this.startTimer();
    this.renderQuestion();
    if (window.soundEngine) window.soundEngine.playClick();
    return true;
  }

  startTimer() {
    const timerElem = document.getElementById('quiz-timer-display');
    this.timerSeconds = 0;
    if (timerElem) timerElem.textContent = '00:00';

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
      const secs = String(this.timerSeconds % 60).padStart(2, '0');
      if (timerElem) {
        timerElem.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getFormattedTime() {
    const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const secs = String(this.timerSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  selectOption(questionId, selectedKey) {
    this.userAnswers[questionId] = selectedKey;
    if (window.soundEngine) window.soundEngine.playClick();
    this.renderQuestion();
    this.updateProgress();
  }

  nextQuestion() {
    const questions = this.getQuestionsList();
    if (this.currentQuestionIndex < questions.length - 1) {
      this.currentQuestionIndex++;
      if (window.soundEngine) window.soundEngine.playClick();
      this.renderQuestion();
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      if (window.soundEngine) window.soundEngine.playClick();
      this.renderQuestion();
    }
  }

  jumpToQuestion(index) {
    const questions = this.getQuestionsList();
    if (index >= 0 && index < questions.length) {
      this.currentQuestionIndex = index;
      if (window.soundEngine) window.soundEngine.playClick();
      this.renderQuestion();
    }
  }

  updateProgress() {
    const questions = this.getQuestionsList();
    const answeredCount = Object.keys(this.userAnswers).length;
    const total = questions.length;
    const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    const bar = document.getElementById('quiz-progress-bar');
    const text = document.getElementById('quiz-progress-text');

    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${answeredCount} de ${total} Respondidas (${percent}%)`;

    this.renderQuestionNavGrid();
  }

  renderQuestionNavGrid() {
    const grid = document.getElementById('quiz-nav-grid');
    if (!grid) return;

    const questions = this.getQuestionsList();
    grid.innerHTML = questions.map((q, idx) => {
      const isAnswered = !!this.userAnswers[q.id];
      const isCurrent = idx === this.currentQuestionIndex;
      return `
        <button 
          onclick="window.quizEngine.jumpToQuestion(${idx})"
          class="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all duration-200 ${
            isCurrent 
              ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 scale-110 shadow-lg' 
              : isAnswered 
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }"
          title="Pregunta ${idx + 1}"
        >
          ${idx + 1}
        </button>
      `;
    }).join('');
  }

  renderQuestion() {
    const container = document.getElementById('quiz-question-card');
    if (!container) return;

    const questions = this.getQuestionsList();
    if (!questions || questions.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-500">
          <p class="text-lg font-bold mb-2">Cargando cuestionario...</p>
          <button onclick="window.quizEngine.renderQuestion()" class="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs">
            Reintentar
          </button>
        </div>
      `;
      return;
    }

    const q = questions[this.currentQuestionIndex];
    if (!q) return;

    const currentSelected = this.userAnswers[q.id];
    const total = questions.length;

    container.innerHTML = `
      <div class="animate-fadeIn">
        <div class="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700/60">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-xs tracking-wider uppercase border border-emerald-500/20">
              Pregunta ${this.currentQuestionIndex + 1} de ${total}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500">Competencia 210201501</span>
          </div>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ${currentSelected ? '✅ Seleccionada' : '⏳ Pendiente'}
          </span>
        </div>

        <h3 class="text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-relaxed mb-6">
          ${q.enunciado}
        </h3>

        <div class="space-y-3 mb-8">
          ${q.opciones.map(opt => {
            const isSelected = currentSelected === opt.key;
            return `
              <div 
                onclick="window.quizEngine.selectOption(${q.id}, '${opt.key}')"
                class="group cursor-pointer flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-md shadow-emerald-500/10 scale-[1.01]' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }"
              >
                <div class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm transition-colors ${
                  isSelected 
                    ? 'bg-emerald-500 text-white shadow' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                }">
                  ${opt.key}
                </div>
                <div class="flex-1 text-sm md:text-base font-medium pt-1">
                  ${opt.texto}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Botones de Navegación de Preguntas -->
        <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/60">
          <button 
            onclick="window.quizEngine.prevQuestion()"
            ${this.currentQuestionIndex === 0 ? 'disabled' : ''}
            class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <span>←</span> Anterior
          </button>

          <div class="flex items-center gap-2">
            ${this.currentQuestionIndex < total - 1 ? `
              <button 
                onclick="window.quizEngine.nextQuestion()"
                class="px-5 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-sm flex items-center gap-2 transition shadow"
              >
                Siguiente <span>→</span>
              </button>
            ` : `
              <button 
                onclick="window.quizEngine.finishQuiz()"
                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 animate-pulse"
              >
                <span>Finalizar y Calificar</span> <span>🎯</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.updateProgress();
  }

  async finishQuiz() {
    const questions = this.getQuestionsList();
    const answeredCount = Object.keys(this.userAnswers).length;
    const total = questions.length;

    if (answeredCount < total) {
      const confirmIncomplete = confirm(
        `Has respondido ${answeredCount} de las ${total} preguntas.\n\n¿Estás seguro de que deseas finalizar la evaluación ahora? Las no respondidas contarán como incorrectas.`
      );
      if (!confirmIncomplete) return;
    }

    this.stopTimer();
    this.isCompleted = true;

    // Calcular puntaje
    let score = 0;
    const detalleRespuestas = questions.map(q => {
      const seleccionada = this.userAnswers[q.id] || null;
      const esCorrecta = seleccionada === q.respuestaCorrecta;
      if (esCorrecta) score++;

      return {
        id: q.id,
        numero: q.numero,
        enunciado: q.enunciado,
        seleccionada: seleccionada,
        respuestaCorrecta: q.respuestaCorrecta,
        esCorrecta: esCorrecta,
        justificacion: q.justificacion
      };
    });

    const porcentaje = Math.round((score / total) * 100);
    const aprobado = porcentaje >= 70; // Criterio SENA >= 70%
    const tiempoEmpleado = this.getFormattedTime();

    // Crear ID UUID estándar compatible con Supabase (columna UUID) y LocalStorage
    const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const intentoActual = this.currentAttemptNumber || 1;

    // Crear registro
    const evaluationRecord = {
      id: newId,
      nombre: this.apprentice.nombre,
      documento: this.apprentice.documento,
      ficha: this.apprentice.ficha,
      intento: intentoActual,
      totalIntentos: 2,
      puntaje: score,
      totalPreguntas: total,
      porcentaje: porcentaje,
      aprobado: aprobado,
      calificado_sofia: false,
      tiempo: tiempoEmpleado,
      fecha: new Date().toLocaleString('es-CO'),
      fechaISO: new Date().toISOString(),
      respuestas: detalleRespuestas
    };

    // Efectos de sonido y confeti
    if (aprobado) {
      if (window.soundEngine) window.soundEngine.playVictory();
      if (window.confettiEngine) window.confettiEngine.launch(150, 4000);
    } else {
      if (window.soundEngine) window.soundEngine.playWrong();
    }

    // Limpiar intentos previos de este aprendiz para mantener un único registro definitivo
    if (this.apprentice && this.apprentice.documento && window.SupabaseManager) {
      try {
        const prevStatus = await this.checkApprenticeStatus(this.apprentice.documento, this.apprentice.nombre, this.apprentice.ficha);
        if (prevStatus && prevStatus.previousRecords && prevStatus.previousRecords.length > 0) {
          for (const prevRec of prevStatus.previousRecords) {
            if (prevRec.id && prevRec.id !== newId) {
              await window.SupabaseManager.deleteEvaluation(prevRec.id).catch(e => console.warn('Limpiando intento previo:', e));
            }
          }
        }
      } catch (errPrev) {
        console.warn('Error verificando intentos previos en submitQuiz:', errPrev);
      }
    }

    // Guardar en Supabase y LocalStorage
    let saveResult = { synced: false, source: 'local' };
    if (window.SupabaseManager) {
      saveResult = await window.SupabaseManager.saveEvaluation(evaluationRecord);
    }

    // Guardar registro activo para constancia
    window.currentEvaluationResult = evaluationRecord;

    // Renderizar pantalla de resultados
    this.renderResults(evaluationRecord, saveResult);
  }

  renderResults(record, saveResult) {
    const setupView = document.getElementById('quiz-setup-view');
    const runningView = document.getElementById('quiz-running-view');
    const resultsView = document.getElementById('quiz-results-view');

    if (setupView) setupView.classList.add('hidden');
    if (runningView) runningView.classList.add('hidden');
    if (resultsView) resultsView.classList.remove('hidden');

    const resultCard = document.getElementById('quiz-result-summary-card');
    if (!resultCard) return;

    const isPassed = record.aprobado;
    const currentAttempt = record.intento || 1;
    const hasRemainingAttempt = currentAttempt < 2;

    resultCard.innerHTML = `
      <div class="text-center mb-8 animate-fadeIn">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${
          isPassed 
            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-4 border-emerald-400 animate-bounce' 
            : 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-4 border-rose-400'
        } mb-4">
          <span class="text-4xl">${isPassed ? '🏆' : '📚'}</span>
        </div>

        <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2">
          ${isPassed ? '¡FELICITACIONES, APROBASTE LA EVALUACIÓN!' : 'EVALUACIÓN NO APROBADA (POR MEJORAR)'}
        </h2>
        <p class="text-slate-600 dark:text-slate-300 max-w-lg mx-auto text-sm md:text-base">
          ${isPassed 
            ? `Has demostrado un excelente dominio de los Derechos Humanos y Fundamentales en el Trabajo según la competencia SENA 210201501. <strong>Aprobado en el Intento ${currentAttempt} de 2.</strong>` 
            : `Has completado el cuestionario (Intento ${currentAttempt} de 2), pero obtuviste un <strong>${record.porcentaje}%</strong> sin alcanzar el porcentaje mínimo aprobatorio del <strong>70%</strong>.`}
        </p>

        <!-- Mensaje de NO GENERACIÓN DE CERTIFICADO si no aprobó -->
        ${!isPassed ? `
          <div class="max-w-md mx-auto mt-4 p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-800 dark:text-rose-200 text-center">
            <span class="text-lg font-black block mb-1">🚫 No se genera certificado</span>
            <p class="text-xs leading-relaxed">
              El SENA expide constancias de aprobación únicamente para evaluaciones con calificación igual o superior al <strong>70% (7/10)</strong>.
            </p>
          </div>
        ` : ''}

        <!-- Indicador de Sincronización Supabase -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mt-4 ${
          saveResult.synced 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
        }">
          <span>${saveResult.synced ? '☁️ Sincronizado en Supabase' : '💾 Guardado en Almacenamiento Local'}</span>
        </div>
      </div>

      <!-- Tarjeta de Estadísticas de la Evaluación -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Puntaje</span>
          <p class="text-2xl md:text-3xl font-black ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} mt-1">
            ${record.puntaje} / ${record.totalPreguntas}
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Porcentaje</span>
          <p class="text-2xl md:text-3xl font-black ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} mt-1">
            ${record.porcentaje}%
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Intento</span>
          <p class="text-2xl md:text-3xl font-black text-slate-700 dark:text-slate-200 mt-1">
            ${currentAttempt} / 2
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ficha SENA</span>
          <p class="text-xl md:text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 font-mono">
            ${record.ficha}
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center col-span-2 md:col-span-1">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiempo</span>
          <p class="text-xl md:text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 font-mono">
            ${record.tiempo}
          </p>
        </div>
      </div>

      <!-- Datos del Aprendiz -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase">Aprendiz Registrado:</span>
          <p class="text-base font-bold text-slate-800 dark:text-white">${record.nombre}</p>
        </div>
        ${record.documento ? `
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase">Documento / ID:</span>
            <p class="text-base font-bold text-slate-800 dark:text-white font-mono">${record.documento}</p>
          </div>
        ` : ''}
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase">Fecha de Realización:</span>
          <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">${record.fecha}</p>
        </div>
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase">Estado en SOFIA PLUS:</span>
          <p class="text-sm font-semibold flex items-center gap-1.5 ${record.calificado_sofia ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
            <span>${record.calificado_sofia ? '✅ Calificado' : '⏳ Pendiente por Instructor'}</span>
          </p>
        </div>
      </div>

      <!-- Estado de Oportunidades e Intentos -->
      <div class="mb-8">
        ${isPassed ? `
          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-2xl">✅</span>
              <div>
                <strong class="text-sm block">¡Competencia Laboral Aprobada y Certificada!</strong>
                <span class="text-xs opacity-90">Has completado y superado satisfactoriamente la evaluación. Tu constancia oficial digital está lista para descargar e imprimir.</span>
              </div>
            </div>
            <button 
              onclick="window.recordsManager.showCertificate(window.currentEvaluationResult)"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition"
            >
              <span>📜</span> Ver Certificado
            </button>
          </div>
        ` : hasRemainingAttempt ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-2xl">⚠️</span>
              <div>
                <strong class="text-sm block">Te queda 1 oportunidad disponible (Intento 2 de 2)</strong>
                <span class="text-xs opacity-90">Puedes repasar las diapositivas y videos pedagógicos antes de presentar tu segundo intento.</span>
              </div>
            </div>
            <button 
              onclick="window.quizEngine.restartQuiz()" 
              class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/20 animate-pulse cursor-pointer"
            >
              🔄 Iniciar Segundo Intento (2/2)
            </button>
          </div>
        ` : `
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-center gap-3">
            <span class="text-2xl">⛔</span>
            <div>
              <strong class="text-sm block">Has agotado los 2 intentos permitidos sin aprobar</strong>
              <span class="text-xs opacity-90">No es posible realizar más intentos para este cuestionario ni se emite certificado. Consulta con tu coordinación académica.</span>
            </div>
          </div>
        `}
      </div>

      <!-- Botones de Acción (Condicionados a aprobación) -->
      <div class="flex flex-wrap items-center justify-center gap-4 mb-10">
        ${isPassed ? `
          <button 
            onclick="window.recordsManager.showCertificate(window.currentEvaluationResult)"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>📜</span> Ver y Descargar Certificado SENA
          </button>
        ` : ''}

        <button 
          onclick="window.app.navigateTo('slides')"
          class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-sm flex items-center gap-2 shadow transition"
        >
          <span>📖</span> Repasar Diapositivas
        </button>

        <button 
          onclick="window.app.navigateTo('videos')"
          class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-sm flex items-center gap-2 shadow transition"
        >
          <span>🎬</span> Repasar Videoteca
        </button>

        ${!isPassed && hasRemainingAttempt ? `
          <button 
            onclick="window.quizEngine.restartQuiz()"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm flex items-center gap-2 transition shadow-md shadow-amber-600/20"
          >
            <span>🔄</span> Realizar Segundo Intento (2/2)
          </button>
        ` : ''}
      </div>

      <!-- Desglose de Respuestas y Justificaciones Pedagógicas Oficiales -->
      <div class="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 class="text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span>📖</span> Retroalimentación y Justificaciones Oficiales SENA
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Revisa el análisis técnico y jurídico de cada pregunta según la clave del documento institucional:
        </p>

        <div class="space-y-4">
          ${record.respuestas.map((r, i) => `
            <div class="p-5 rounded-2xl border ${
              r.esCorrecta 
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60' 
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
            } transition">
              <div class="flex items-start justify-between gap-3 mb-2">
                <span class="font-bold text-xs px-2.5 py-1 rounded-md ${
                  r.esCorrecta 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-rose-500 text-white'
                }">
                  Pregunta ${r.numero} ${r.esCorrecta ? '✓ Correcta' : '✗ Incorrecta'}
                </span>
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tu respuesta: <strong class="${r.esCorrecta ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${r.seleccionada || 'Sin responder'}</strong> | Correcta: <strong class="text-emerald-600 dark:text-emerald-400">${r.respuestaCorrecta}</strong>
                </span>
              </div>

              <p class="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 mb-3">
                ${r.enunciado}
              </p>

              <div class="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong class="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">💡 Justificación Oficial:</strong>
                ${r.justificacion}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  restartQuiz() {
    this.reset();
    const setupView = document.getElementById('quiz-setup-view');
    const runningView = document.getElementById('quiz-running-view');
    const resultsView = document.getElementById('quiz-results-view');
    const errorEl = document.getElementById('quiz-setup-error');
    const startBtn = document.getElementById('btn-start-quiz');

    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.innerHTML = '';
    }
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
      startBtn.innerHTML = '<span>🚀 Iniciar Cuestionario Oficial</span>';
    }

    if (resultsView) resultsView.classList.add('hidden');
    if (runningView) runningView.classList.add('hidden');
    if (setupView) setupView.classList.remove('hidden');

    if (window.soundEngine) window.soundEngine.playClick();
  }
}

window.quizEngine = new QuizEngine();
