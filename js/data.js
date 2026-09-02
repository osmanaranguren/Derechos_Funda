/**
 * BANCO DE CONTENIDOS Y PREGUNTAS OFICIALES SENA
 * Competencia: 210201501 - Ejercer Derechos fundamentales en el marco de la Constitución política y los convenios internacionales.
 */

const SENA_APP_DATA = {
  info: {
    competencia: "210201501",
    tituloCompetencia: "Ejercer Derechos fundamentales en el marco de la Constitución política y los convenios internacionales.",
    entidad: "Servicio Nacional de Aprendizaje - SENA",
    programa: "Ciudadanía Laboral y Derechos Fundamentales",
    ano: 2026
  },

  // Resultados de Aprendizaje
  resultadosAprendizaje: [
    {
      id: "RAP1",
      numero: "01",
      titulo: "Valoración de la Ciudadanía Laboral",
      descripcion: "Valorar la importancia de la ciudadanía laboral con base en el estudio de los derechos humanos y fundamentales en el trabajo.",
      icono: "🛡️",
      color: "emerald"
    },
    {
      id: "RAP2",
      numero: "02",
      titulo: "El Trabajo como Movilidad Social",
      descripcion: "Reconocer el trabajo como factor de movilidad social y transformación vital con referencia a la fenomenología y a los derechos fundamentales en el trabajo.",
      icono: "📈",
      color: "blue"
    },
    {
      id: "RAP3",
      numero: "03",
      titulo: "Práctica de Derechos Fundamentales",
      descripcion: "Practicar los derechos fundamentales en el trabajo de acuerdo con la Constitución Política y los convenios internacionales.",
      icono: "⚖️",
      color: "amber"
    },
    {
      id: "RAP4",
      numero: "04",
      titulo: "Acciones Solidarias y de los Pueblos",
      descripcion: "Participar en acciones solidarias teniendo en cuenta el ejercicio de los derechos humanos, de los pueblos y de la naturaleza.",
      icono: "🤝",
      color: "purple"
    }
  ],

  // Diapositivas interactivas
  slides: [
    {
      id: 1,
      tag: "Enfoque Curricular",
      titulo: "Derechos Fundamentales en el Trabajo",
      subtitulo: "Ciudadanía Laboral y Protección de la Dignidad Humana",
      tipo: "cover",
      contenido: {
        destacado: "Competencia 210201501",
        descripcion: "Plataforma interactiva para aprendices SENA que analiza los derechos humanos desde su génesis universal hasta el marco constitucional colombiano y el rol protector del Derecho Laboral.",
        puntos: [
          "Fundamentación ética y filosófica de la dignidad humana",
          "Declaración Universal de los Derechos Humanos (1948)",
          "Constitución Política de Colombia de 1991 (Arts. 25 y 53)",
          "El trabajo como principio, derecho y deber social"
        ]
      }
    },
    {
      id: 2,
      tag: "Estructura Formativa",
      titulo: "Resultados de Aprendizaje SENA",
      subtitulo: "Los 4 Ejes del Aprendiz Integral",
      tipo: "raps",
      contenido: {
        descripcion: "El programa orienta el desarrollo de competencias ciudadanas y laborales que permitan al futuro profesional integrarse al sector productivo con ética, conciencia social y pleno conocimiento de sus garantías legales."
      }
    },
    {
      id: 3,
      tag: "Génesis Universal",
      titulo: "Declaración Universal de los DD.HH. (1948)",
      subtitulo: "Consenso Global por la Dignidad Humana",
      tipo: "articles_dudh",
      contenido: {
        intro: "Adoptada por la Asamblea General de las Naciones Unidas en 1948, consagra 30 artículos esenciales estructurados en principios y garantías:",
        grupos: [
          {
            nombre: "Grupo 1: Principios Fundamentales",
            icono: "🌟",
            articulos: [
              { num: "Art. 1", desc: "Todos los seres humanos nacen libres e iguales en dignidad y derechos." },
              { num: "Art. 2", desc: "Principio universal de no discriminación (por raza, sexo, religión o pensamiento)." }
            ]
          },
          {
            nombre: "Grupo 2: Derechos de Protección",
            icono: "🛡️",
            articulos: [
              { num: "Art. 3", desc: "Derecho primordial a la vida, a la libertad y a la seguridad de la persona." },
              { num: "Art. 4", desc: "Prohibición categórica de la esclavitud y de toda forma de servidumbre." },
              { num: "Art. 5", desc: "Prohibición de la tortura y de tratos crueles, inhumanos o degradantes." }
            ]
          }
        ],
        caracteristicas: [
          { nombre: "Inalienables", detalle: "No pueden cederse, transferirse ni renunciarse bajo ninguna circunstancia." },
          { nombre: "Universales", detalle: "Pertenecen a todos los seres humanos en todo momento y lugar." },
          { nombre: "Indivisibles", detalle: "Todos los derechos tienen la misma jerarquía e importancia." },
          { nombre: "Interdependientes", detalle: "El goce de un derecho está estrechamente vinculado al de los demás." }
        ]
      }
    },
    {
      id: 4,
      tag: "Evolución Histórica",
      titulo: "Las Tres Generaciones de Derechos",
      subtitulo: "Evolución de las Conquistas Sociales y Humanas",
      tipo: "generations",
      contenido: {
        generaciones: [
          {
            gen: "1ª Generación",
            eje: "La Libertad",
            tipo: "Civiles y Políticos",
            epoca: "Siglos XVIII - XIX (Revolución Francesa)",
            ejemplos: "Vida, voto, libertad de expresión, igualdad ante la ley y asociación.",
            deber: "El Estado se abstiene de intervenir arbitrariamente en la libertad individual (obligación de no hacer)."
          },
          {
            gen: "2ª Generación",
            eje: "La Igualdad",
            tipo: "Económicos, Sociales y Culturales (DESC)",
            epoca: "Siglos XIX - XX (Movimientos Obreros)",
            ejemplos: "Trabajo digno, salario justo, salud, educación, huelga y vivienda.",
            deber: "El Estado asume un rol activo para proveer y garantizar condiciones de vida digna (obligación de hacer)."
          },
          {
            gen: "3ª Generación",
            eje: "La Solidaridad",
            tipo: "Derechos Colectivos y de los Pueblos",
            epoca: "Siglos XX - XXI (Posguerra y Globalización)",
            ejemplos: "Medio ambiente sano, paz, desarrollo sostenible y patrimonio común.",
            deber: "Cooperación y corresponsabilidad solidaria entre ciudadanos, naciones y generaciones futuras."
          }
        ]
      }
    },
    {
      id: 5,
      tag: "Constitución de 1991",
      titulo: "Marco Constitucional Colombiano",
      subtitulo: "El Trabajo en el Estado Social de Derecho",
      tipo: "constitution",
      contenido: {
        articulos: [
          {
            art: "Artículo 25 C.P.",
            titulo: "El Trabajo como Derecho y Obligación Social",
            texto: "«El trabajo es un derecho y una obligación social y goza, en todas sus modalidades, de la especial protección del Estado. Toda persona tiene derecho a un trabajo en condiciones dignas y justas.»",
            analisis: "Trasciende el mero acuerdo mercantil: es un principio fundante del Estado colombiano que exige salvaguardar la dignidad del trabajador en cualquier modalidad."
          },
          {
            art: "Artículo 53 C.P.",
            titulo: "Principios Mínimos Fundamentales del Trabajo",
            texto: "«El Congreso expedirá el estatuto del trabajo... Principios mínimos: Igualdad de oportunidades; remuneración mínima, vital y móvil; estabilidad en el empleo; irrenunciabilidad a beneficios mínimos; primacía de la realidad sobre las formas.»",
            analisis: "Establece los límites infranqueables que ningún contrato, reglamento interno o empleador puede desmejorar."
          }
        ]
      }
    },
    {
      id: 6,
      tag: "Dimensión Sociolaboral",
      titulo: "Fenomenología y Litigiosidad Laboral",
      subtitulo: "Protección a la Parte Más Débil y Realidad en Colombia",
      tipo: "conflict_stats",
      contenido: {
        asimetria: "Dada la asimetría natural en las relaciones laborales, el Derecho del Trabajo tiene una función protectora (tuitiva) para salvaguardar la parte más vulnerable: el trabajador.",
        estadistica: "Según el Ministerio de Trabajo, más del 60% de los conflictos y demandas laborales en Colombia surgen por despidos sin justa causa o incumplimientos en la liquidación y contratos.",
        movilidad: "Para el SENA, el trabajo no es solo sustento material, sino la principal herramienta de movilidad social, realización personal y ejercicio pleno de la ciudadanía democrática."
      }
    }
  ],

  // Videos integrados
  videos: [
    {
      id: "vid1",
      titulo: "¿Qué son los Derechos Humanos? (Características y Clasificación)",
      subtitulo: "Video pedagógico ilustrativo sobre el origen, características y generaciones",
      archivo: "¿Qué son los derechos humanos_ [Características y clasificación] Video educativo para niños..mp4",
      archivoEncoded: "%C2%BFQu%C3%A9%20son%20los%20derechos%20humanos_%20%5BCaracter%C3%ADsticas%20y%20clasificaci%C3%B3n%5D%20Video%20educativo%20para%20ni%C3%B1os..mp4",
      duracionEstimada: "4:15 min",
      temasClave: [
        "Definición y origen de los Derechos Humanos",
        "Características: Inalienables, Universales, Indivisibles e Interdependientes",
        "Evolución y clasificación en tres generaciones",
        "Correlación ética entre el ejercicio de derechos y el respeto de los deberes"
      ],
      icono: "🎬"
    },
    {
      id: "vid2",
      titulo: "Derecho Laboral en Colombia",
      subtitulo: "Fundamentos constitucionales, principios mínimos y protección del trabajador",
      archivo: "💼⚖️ DERECHO LABORAL EN COLOMBIA.mp4",
      archivoEncoded: "%F0%9F%92%BC%E2%9A%96%EF%B8%8F%20DERECHO%20LABORAL%20EN%20COLOMBIA.mp4",
      duracionEstimada: "3:40 min",
      temasClave: [
        "Artículos 25 y 53 de la Constitución Política de 1991",
        "El contrato laboral y el principio de primacía de la realidad",
        "Principios protectores del trabajador frente al poder patronal",
        "Causales frecuentes de conflictos laborales y vías de reclamación"
      ],
      icono: "💼"
    }
  ],

  // Cuestionario Oficial de 10 Preguntas
  preguntas: [
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
  ]
};

window.SENA_APP_DATA = SENA_APP_DATA;
