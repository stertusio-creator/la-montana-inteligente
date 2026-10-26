export type Gender = "mujer" | "hombre";

export const ACCESS_CODE = "25846";
export const AMAZON_URL = "https://a.co/d/03D16JnT";
export const WHATSAPP_DISPLAY = "+507 6614-6577";
const WHATSAPP_PHONE = "50766146577";

export function whatsAppLink(name: string, intent: "code" | "book") {
  const who = name.trim() || "un lector";
  const text =
    intent === "code"
      ? `Hola Sergio, soy ${who}. Necesito el código de 5 dígitos para entrar a la cueva 5 de La Montaña Inteligente, del libro Inteligencia Artificial y Activos Digitales.`
      : `Hola Sergio, soy ${who}. Quiero el libro Inteligencia Artificial y Activos Digitales.`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

export function bienvenida(gender: Gender) {
  return gender === "mujer" ? "Bienvenida" : "Bienvenido";
}

export type Nearby =
  | { kind: "cave"; n: number }
  | { kind: "false"; n: number }
  | { kind: "code" }
  | { kind: "locked"; n: number }
  | { kind: "summit" };

export type Chapter = {
  n: number;
  title: string;
  subtitle: string;
  importance: string;
  benefits: string[];
  book: string;
  ideas: string[];
  question: string;
  clue: string;
  falseSign: string;
  falseTitle: string;
  falseLesson: string;
};

export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    title: "Dos revoluciones, una sola transformación",
    subtitle: "Cuando el conocimiento y el valor comienzan a encontrarse",
    importance:
      "La inteligencia artificial cambia la forma de decidir. Los activos digitales cambian la forma de poseer, dividir y transferir valor. Por separado parecen dos conversaciones. Juntas son una sola transformación económica.",
    benefits: [
      "Ver el circuito completo: analizar, representar, ejecutar, registrar y supervisar.",
      "Evitar dos errores: creer que todo cambia mañana, o creer que se puede ignorar.",
      "Distinguir digitalizar un archivo de transformar un derecho.",
    ],
    book: "El capítulo 1 abre el libro con un lenguaje claro para quien no quiere quedarse afuera. Ahí está el mapa de la convergencia, antes de cualquier moda o promesa técnica.",
    ideas: [
      "La inteligencia artificial transforma la forma de decidir.",
      "Los activos digitales transforman la forma de representar y transferir valor.",
      "Lo relevante no es la pieza aislada, sino el circuito completo.",
    ],
    question: "¿Dónde existe más fricción en su trabajo: en decidir, en registrar, en transferir o en verificar?",
    clue: "Conocimiento y valor, juntos",
    falseSign: "Solo es una moda pasajera",
    falseTitle: "Este atajo trata el cambio como una moda",
    falseLesson:
      "Que la economía no cambie de un día para otro no significa que se pueda ignorar. Muchas transformaciones se consolidan de forma gradual hasta que parecen inevitables. Quien se prepara con anticipación entiende antes. Este sendero no lleva a la siguiente cueva.",
  },
  {
    n: 2,
    title: "La inteligencia que decide",
    subtitle: "De los modelos predictivos a los agentes autónomos",
    importance:
      "En la economía, la inteligencia artificial no se reduce a producir textos. Su fuerza está en leer grandes volúmenes de información, ver patrones, anticipar escenarios y preparar decisiones. Puede recomendar. También puede empezar a ejecutar.",
    benefits: [
      "Ordenar flujos, riesgos, presupuestos y señales que hoy están dispersos.",
      "Llegar a la reunión con escenarios ya comparados, no solo con datos crudos.",
      "Poner límites antes de que una recomendación se vuelva una acción automática.",
    ],
    book: "El libro baja esta idea a una política mínima: qué usos se permiten, qué datos no se cargan, quién valida y qué decisiones siguen siendo humanas. Esa página ahorra un problema grande.",
    ideas: [
      "La IA identifica patrones, pero no reemplaza el juicio humano.",
      "Un agente puede pasar de responder a ejecutar.",
      "La autonomía exige límites claros.",
    ],
    question: "¿Qué decisiones de su organización ya están siendo influenciadas por un algoritmo, y quién las revisa?",
    clue: "Patrones sí, juicio también",
    falseSign: "La máquina ya puede decidir sola",
    falseTitle: "Este atajo entrega la decisión",
    falseLesson:
      "Que un sistema proponga una ruta no significa que la organización deba obedecerla. Aceptar una recomendación sin mirar los datos, el contexto y el daño posible es una forma de dejar de pensar. La tecnología puede ayudar a decidir. No debe convertirse en excusa. Vuelva al cruce.",
  },
  {
    n: 3,
    title: "Activos digitales y activos virtuales",
    subtitle: "La importancia de llamar correctamente a las cosas",
    importance:
      "Activo digital no es sinónimo de criptomoneda. Puede ser un token que representa un derecho, una moneda digital, una stablecoin, un instrumento financiero, una credencial o una participación. Si el nombre es confuso, la decisión también lo será.",
    benefits: [
      "Clasificar antes de invertir, regular, contabilizar o auditar.",
      "Separar el objeto tecnológico del derecho que dice representar.",
      "Armar una ficha mínima: emisor, función, custodia, riesgos y norma aplicable.",
    ],
    book: "El capítulo 3 enseña a nombrar con precisión, con ejemplos concretos, para que un contador, un abogado o un director no compre una palabra cuando necesitaba entender un derecho.",
    ideas: [
      "Activo digital no es sinónimo de criptomoneda.",
      "La función económica importa más que el nombre comercial.",
      "La tecnología no reemplaza la claridad jurídica.",
    ],
    question: "¿Qué diferencia hay entre poseer un token y tener un derecho exigible?",
    clue: "La función importa más que el nombre",
    falseSign: "Todo activo digital es criptomoneda",
    falseTitle: "Este atajo confunde el nombre con la cosa",
    falseLesson:
      "Llamar cripto a todo lo digital es una forma rápida de entender mal. Una representación de un inmueble, un medio de pago con reserva y un criptoactivo especulativo no plantean los mismos derechos ni los mismos riesgos. Si no puede completar una ficha básica del activo, todavía no lo comprende. Este camino se cierra aquí.",
  },
  {
    n: 4,
    title: "Blockchain y la infraestructura de confianza",
    subtitle: "Registrar, verificar y transferir",
    importance:
      "Blockchain no elimina la confianza. Cambia la forma de registrarla y verificarla. Puede dejar constancia de una operación y hacerla difícil de alterar. No convierte en verdadero un dato que entró mal.",
    benefits: [
      "Pensar la cadena como infraestructura, no como un acto de fe.",
      "Entender que una billetera administra claves, no guarda monedas físicas.",
      "Ver el contrato inteligente como ejecución de instrucciones, no como juicio jurídico.",
    ],
    book: "En el libro, esta cueva se recorre con calma: qué conviene registrar, qué debe seguir siendo privado, quién valida lo que entra y qué pasa si el contrato tiene un error.",
    ideas: [
      "Blockchain es infraestructura de registro y verificación.",
      "La inmutabilidad no garantiza que la información sea verdadera.",
      "La confianza digital exige tecnología, controles y gobernanza.",
    ],
    question: "Si un contrato inteligente contiene un error, ¿quién puede detenerlo y quién responde?",
    clue: "Registrar no es lo mismo que creer",
    falseSign: "Si está en blockchain, es verdad",
    falseTitle: "Este atajo confunde registro con verdad",
    falseLesson:
      "Una cadena puede conservar para siempre un dato falso, un derecho mal descrito o una promesa sin respaldo. Inmutable no significa correcto. La confianza aparece cuando la tecnología se encuentra con controles, identidad y alguien que responde. Regrese al cruce: el sendero bueno no exagera la herramienta.",
  },
  {
    n: 5,
    title: "Agentes con capacidad económica",
    subtitle: "Nuevos participantes en la decisión y la ejecución",
    importance:
      "Un agente de inteligencia artificial ya no solo conversa. Puede comparar opciones, proponer una operación y, si nadie le puso límite, ejecutarla. Entra así un participante nuevo en procesos que antes eran solo humanos.",
    benefits: [
      "Nombrar qué puede recomendar un agente y qué no puede ejecutar solo.",
      "Proporcionar la autonomía al riesgo de la decisión.",
      "Dejar escrita la responsabilidad: sigue siendo de personas y organizaciones.",
    ],
    book: "El capítulo 5 es de los que una junta directiva debería leer despacio. El libro no se entusiasma con el agente: pregunta quién lo identifica, quién lo audita y quién paga el error.",
    ideas: [
      "Un agente puede pasar de recomendar a ejecutar.",
      "La autonomía debe ser proporcional al riesgo.",
      "La responsabilidad sigue perteneciendo a personas y organizaciones.",
    ],
    question: "Si un agente ejecuta una mala orden esta noche, ¿quién responde mañana por la mañana?",
    clue: "Puede ejecutar. Usted responde.",
    falseSign: "Si falla, responde el agente",
    falseTitle: "Este atajo esconde al responsable",
    falseLesson:
      "Un sistema no es un sujeto al que se le pueda pedir cuentas como a una persona. Detrás hay quien lo diseñó, quien lo entrenó, quien lo autorizó y quien decidió no supervisarlo. La economía de agentes exige gobernanza antes que entusiasmo. Este sendero no sigue.",
  },
  {
    n: 6,
    title: "Tokenización",
    subtitle: "Cuando el valor se representa en unidades digitales",
    importance:
      "Tokenizar no es escanear un documento. Es representar un activo o un derecho en una unidad digital que puede registrarse, transferirse, fraccionarse y, a veces, programarse. Cambia la forma de organizar propiedad, inversión y financiamiento.",
    benefits: [
      "Imaginar participaciones más divisibles y mercados más trazables.",
      "Separar el token del contrato, del activo y de la promesa que lo sostiene.",
      "Preguntar si existe un derecho real y un mercado real antes de emitir.",
    ],
    book: "El capítulo 6 es la puerta de la segunda parte del libro. Sin esa distinción, todo proyecto de tokenización se parece a una demostración técnica. Con ella, se puede conversar en serio.",
    ideas: [
      "Tokenizar es representar digitalmente valor o derechos.",
      "El token no sustituye la estructura jurídica.",
      "Sin derecho claro, el token es solo un archivo con precio.",
    ],
    question: "¿Qué derecho, de qué activo y frente a quién representaría el token que le están ofreciendo?",
    clue: "Se representa el derecho",
    falseSign: "Tokenizar es escanear el PDF",
    falseTitle: "Este atajo confunde digitalizar con tokenizar",
    falseLesson:
      "Pasar un título a PDF facilita el archivo. No crea una unidad que pueda circular, fraccionarse y ejecutarse dentro de una infraestructura. Tokenizar sin definir el derecho, la custodia y la salida del inversionista es ponerle tecnología a una ambigüedad. Vuelva al cruce.",
  },
  {
    n: 7,
    title: "Tokenización inmobiliaria",
    subtitle: "Del ladrillo al activo programable",
    importance:
      "El inmueble es el caso que mejor explica la nueva economía del valor, porque todo el mundo entiende un edificio: es difícil de dividir, lento de vender y cargado de papeles. La tokenización promete acceso, financiamiento y trazabilidad. No borra el riesgo del ladrillo.",
    benefits: [
      "Explicar la convergencia con un activo que cualquier director ya comprende.",
      "Ver liquidez, fraccionamiento y rendimientos sin olvidar la obra real.",
      "Preparar preguntas de custodia, salida, información y protección del participante.",
    ],
    book: "Por esto el libro se detiene aquí más que en ningún otro caso, y el apéndice trae una lista de chequeo para no lanzar un proyecto inmobiliario tokenizado a ciegas. La cueva muestra el mapa. El libro trae la lista.",
    ideas: [
      "Puede ampliar el acceso, pero no elimina el riesgo inmobiliario.",
      "El edificio, los contratos y los flujos siguen existiendo fuera de la cadena.",
      "Sin mercado de salida, la fracción digital también puede quedar quieta.",
    ],
    question: "Si nadie quiere comprar la fracción, ¿el participante entiende que puede no salir?",
    clue: "El ladrillo sigue ahí",
    falseSign: "Fraccionar elimina el riesgo",
    falseTitle: "Este atajo cree que el token disuelve el inmueble",
    falseLesson:
      "Dividir un edificio en unidades digitales no lo vuelve líquido por arte de magia, ni convierte un mal proyecto en uno bueno. Siguen la obra, el flujo, la demanda, la norma y la confianza de quien administra. La tokenización inmobiliaria solo es sostenible si se lee junto con riesgo, cumplimiento y cuentas. Este callejón termina en la roca.",
  },
  {
    n: 8,
    title: "Dinero inteligente y sistema financiero",
    subtitle: "Pagos, banca y mercados programables",
    importance:
      "El dinero es infraestructura. Cuando un pago puede llevar reglas —liberarse si se cumple una condición, detenerse si falta un control— cambia la banca, la liquidación y los mercados. También aparecen nuevos límites que hay que diseñar a propósito.",
    benefits: [
      "Imaginar pagos y contratos más exactos, con menos fricción inútil.",
      "Preguntar qué papel conserva el banco si el dinero se programa.",
      "Poner protección del usuario al lado de la eficiencia, no después.",
    ],
    book: "El capítulo 8 evita el anuncio fácil de que la banca desaparece. Muestra una transición híbrida: instituciones, dinero programable y supervisión tendrán que caber en el mismo sistema.",
    ideas: [
      "El dinero es infraestructura económica.",
      "El dinero programable permite pagos sujetos a reglas.",
      "La eficiencia sin revisión también puede programar un daño.",
    ],
    question: "¿Qué papel quiere jugar su institución: observadora, usuaria, proveedora o supervisora?",
    clue: "El pago puede llevar reglas",
    falseSign: "Si el pago es automático, sobra el banco",
    falseTitle: "Este atajo declara cerrada la banca",
    falseLesson:
      "Automatizar una liquidación no resuelve la custodia, el crédito, la identidad, el fraude ni la confianza del público. El futuro que describe el libro no es la desaparición de toda institución: es un sistema híbrido. Quien entienda esa transición llega antes. Regrese y tome el otro sendero.",
  },
  {
    n: 9,
    title: "Empresas, trabajo y sociedad",
    subtitle: "Conocimiento, propiedad y capacidades",
    importance:
      "Estas herramientas no se quedan en el departamento de tecnología. Llegan a bancos, universidades, estudios jurídicos, gobiernos, familias y aulas. Cambian tareas, reparten de otro modo el conocimiento y pueden ampliar o agrandar las brechas.",
    benefits: [
      "Mirar el trabajo que sí cambia, sin anunciar el fin de la profesión.",
      "Preguntar quién queda fuera si el acceso es solo para quien ya entiende.",
      "Pensar la educación como criterio, no como una lista de herramientas.",
    ],
    book: "El capítulo 9 es el recordatorio humano del libro: la tecnología tiene sentido cuando sirve a la vida, a la dignidad y a la decisión de las personas. No cuando solo acelera.",
    ideas: [
      "La tecnología cambia tareas antes que profesiones completas.",
      "La educación tiene que formar criterio, no solo usuarios.",
      "Una innovación que reduce la dignidad todavía no es una buena innovación.",
    ],
    question: "¿Qué debe enseñar hoy una universidad, o una empresa, para no formar gente que solo obedece pantallas?",
    clue: "Cambian las tareas, no la persona",
    falseSign: "La profesión desaparece mañana",
    falseTitle: "Este atajo asusta o exagera",
    falseLesson:
      "Anunciar que una profesión entera desaparece es tan poco útil como fingir que nada cambia. Lo que suele transformarse primero es la tarea: recopilar, cotejar, redactar el primer borrador, vigilar una anomalía. El criterio, la responsabilidad y el trato siguen siendo humanos. Este camino no sube.",
  },
  {
    n: 10,
    title: "Los riesgos de la economía autónoma",
    subtitle: "Cuando el error puede decidir y ejecutarse",
    importance:
      "Una economía más inteligente no elimina los riesgos. Los transforma y, a veces, los acelera. Un error que antes pasaba por varias manos puede ahora decidirse y ejecutarse en segundos. La velocidad amplifica. La opacidad impide responder.",
    benefits: [
      "Ver el riesgo de automatizar sin frenos, sin bitácora y sin botón de pausa.",
      "Exigir que el usuario entienda qué puede pasar con su ahorro o sus datos.",
      "Diseñar la detención de una operación equivocada antes de lanzarla.",
    ],
    book: "El libro pide no saltarse este capítulo aunque el proyecto emocione. La tokenización, los agentes y el dinero programable solo se sostienen si el riesgo se puede explicar en voz alta.",
    ideas: [
      "La velocidad puede amplificar errores.",
      "La opacidad dificulta la responsabilidad y la auditoría.",
      "Un riesgo que no se puede detener no está gobernado.",
    ],
    question: "¿Cómo se detiene, hoy, una operación equivocada que ya empezó a ejecutarse sola?",
    clue: "La prisa amplifica el error",
    falseSign: "Más rápido es más seguro",
    falseTitle: "Este atajo confunde velocidad con control",
    falseLesson:
      "Ir más rápido no es lo mismo que ir mejor. Si nadie entiende el modelo, nadie puede explicar el daño, y nadie tiene autoridad para parar, la organización no ganó eficiencia: perdió gobierno. Las preguntas incómodas valen más que una demostración brillante. Vuelva al cruce.",
  },
  {
    n: 11,
    title: "Integridad financiera y supervisión inteligente",
    subtitle: "Cumplimiento, trazabilidad y prevención",
    importance:
      "Sin integridad no hay confianza, y sin confianza no hay mercado que dure. Conocer al cliente, conocer al proveedor, seguir el origen de los fondos y monitorear operaciones tokenizadas sigue siendo necesario cuando el activo cambia de forma.",
    benefits: [
      "Adaptar KYC y KYB a identidades, billeteras y participantes digitales.",
      "Usar la misma tecnología para ver mejor, no para cumplir de adorno.",
      "Cuidar que el cumplimiento automático no se vuelva opaco o injusto.",
    ],
    book: "El capítulo 11 está escrito para oficiales de cumplimiento, reguladores y directores que necesitan un lenguaje común: trazabilidad sí, vigilancia ciega no.",
    ideas: [
      "La integridad financiera es condición de confianza.",
      "KYC y KYB tienen que alcanzar también al entorno digital.",
      "Supervisar no es frenar la innovación: es hacerla sostenible.",
    ],
    question: "¿Su cumplimiento alcanzaría a una operación tokenizada, o solo al mundo que ya conocía?",
    clue: "Sin integridad no hay confianza",
    falseSign: "El código vigila solo",
    falseTitle: "Este atajo apaga la supervisión",
    falseLesson:
      "Un monitoreo automático puede ayudar a ver patrones. No sustituye el criterio de quien investiga, ni la proporcionalidad, ni el derecho de una persona a no ser excluida por un modelo opaco. La integridad se diseña. No aparece porque exista un software. Este sendero no continúa.",
  },
  {
    n: 12,
    title: "Contabilidad, auditoría y rendición de cuentas",
    subtitle: "Medir, verificar y explicar",
    importance:
      "Lo que no se puede medir, verificar y explicar no está realmente gobernado. Un token exige preguntar por su sustancia económica: qué derecho es, quién lo custodia, cómo se valora y qué evidencia deja una operación registrada en cadena.",
    benefits: [
      "Traducir la novedad tecnológica al lenguaje de los estados y de la evidencia.",
      "Separar la custodia de las claves de la apariencia de tener un activo.",
      "Preparar a la auditoría para sistemas que ejecutan y registran solos.",
    ],
    book: "Este es uno de los capítulos de oficio del libro. Contadores y auditores encuentran aquí cómo no perderse cuando el valor se programa: sustancia, evidencia, custodia y responsabilidad.",
    ideas: [
      "La contabilidad mira la sustancia económica del token, no solo su nombre.",
      "La custodia digital exige control de claves y de accesos.",
      "Rendir cuentas es poder explicar, no solo mostrar una pantalla.",
    ],
    question: "¿Cómo auditaría una operación registrada en blockchain, y cómo revisaría una estimación hecha con IA?",
    clue: "Mida la sustancia del token",
    falseSign: "Si no está en el balance, no existe",
    falseTitle: "Este atajo deja el valor fuera de las cuentas",
    falseLesson:
      "Que un activo no quepa todavía con facilidad en el formato de siempre no significa que no exista, ni que se pueda omitir. Tampoco basta copiar el precio de una pantalla. Hay que entender el derecho, la custodia y la evidencia. El libro se escribió, en buena parte, para esa conversación. Regrese al sendero que sí sube.",
  },
  {
    n: 13,
    title: "Gobernar la economía inteligente",
    subtitle: "Ética, regulación y estrategia",
    importance:
      "Gobernar no es detener la innovación. Es orientarla. La pregunta ya no es si la inteligencia artificial y los activos digitales van a encontrarse, sino con qué reglas, qué instituciones y qué límites humanos van a producir valor sin sacrificar derechos.",
    benefits: [
      "Llevar la ética al diseño, no al comunicado posterior.",
      "Equilibrar una regulación que entiende con una innovación que se deja mirar.",
      "Armar una agenda de directorio, de país y de formación, no solo de herramientas.",
    ],
    book: "El capítulo 13 y la reflexión final cierran la obra con un manifiesto: inteligencia, valor y confianza al servicio de las personas. El apéndice, además, deja plan de 90 días, preguntas para la junta y una rúbrica de madurez.",
    ideas: [
      "Gobernar no es detener. Es orientar.",
      "La ética se incorpora desde el diseño.",
      "La tecnología sigue estando al servicio de la vida y de la dignidad.",
    ],
    question: "¿Qué está dispuesta a asumir su organización, con nombre y apellido, si el sistema se equivoca?",
    clue: "Gobernar es orientar",
    falseSign: "O se prohíbe todo o se deja libre",
    falseTitle: "Este atajo solo ofrece extremos",
    falseLesson:
      "Prohibir por desconocimiento y soltar por entusiasmo producen el mismo daño: una sociedad que no entiende lo que está adoptando. El equilibrio es difícil y es exactamente el trabajo. La cumbre no está en ninguno de los dos gritos. Está en el sendero que vuelve a la persona al centro.",
  },
];

export function chapter(n: number) {
  const found = CHAPTERS.find((c) => c.n === n);
  if (!found) throw new Error("capítulo " + n);
  return found;
}
