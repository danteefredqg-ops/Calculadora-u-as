// Valores de EJEMPLO en pesos mexicanos (MXN).
// Se usan solo la primera vez que se abre la página o al presionar "Restaurar ejemplo".
// Todo se puede cambiar desde las pestañas Materiales, Servicios y Ajustes; los cambios
// se guardan en el navegador del dispositivo.

const DATOS_EJEMPLO = {
  version: 2,

  negocio: {
    nombre: "Bloom Studio",
    whatsapp: "",
  },

  // Lo que ella quiere ganar por cada hora de trabajo (su "sueldo").
  tarifaHora: 80,
  // Ganancia extra del negocio sobre el costo, en %. Sirve para reinvertir.
  margen: 15,
  // El precio sugerido se redondea hacia arriba a múltiplos de esta cantidad.
  redondeo: 10,

  // Cuántos servicios calcula hacer al mes (para repartir los gastos fijos).
  serviciosMes: 20,
  gastosFijos: [
    { id: "g1", nombre: "Luz (lámpara UV/LED y focos)", monto: 150 },
    { id: "g2", nombre: "Internet / celular (parte del negocio)", monto: 150 },
    { id: "g3", nombre: "Reposición de herramientas (lámpara, pinzas, tijeras)", monto: 200 },
    { id: "g4", nombre: "Transporte para comprar material", monto: 100 },
    { id: "g5", nombre: "Publicidad / redes sociales", monto: 0 },
  ],

  // precio: lo que costó el envase o paquete.
  // rinde: cuántos servicios completos alcanza a hacer con él (en largo 1).
  materiales: [
    { id: "deshidratador", nombre: "Deshidratador (15 ml)", precio: 90, rinde: 60 },
    { id: "primer", nombre: "Primer sin ácido (15 ml)", precio: 90, rinde: 60 },
    { id: "tips", nombre: "Tips (caja de 500)", precio: 150, rinde: 45 },
    { id: "pegamento", nombre: "Pegamento para tips", precio: 35, rinde: 25 },
    { id: "monomero", nombre: "Monómero (120 ml)", precio: 280, rinde: 25 },
    { id: "polvo", nombre: "Polvo acrílico (30 g)", precio: 150, rinde: 12 },
    { id: "basegel", nombre: "Base gel (15 ml)", precio: 150, rinde: 40 },
    { id: "colorgel", nombre: "Esmalte semipermanente color (15 ml)", precio: 90, rinde: 35 },
    { id: "topgel", nombre: "Top coat gel (15 ml)", precio: 150, rinde: 40 },
    { id: "rubber", nombre: "Rubber base (15 ml)", precio: 220, rinde: 25 },
    { id: "lima", nombre: "Limas 100/180 (paquete de 10)", precio: 70, rinde: 20 },
    { id: "pulidor", nombre: "Bloque pulidor (paquete de 10)", precio: 60, rinde: 20 },
    { id: "alcohol", nombre: "Alcohol isopropílico (1 L)", precio: 120, rinde: 100 },
    { id: "acetona", nombre: "Acetona pura (1 L)", precio: 90, rinde: 15 },
    { id: "algodon", nombre: "Algodón / toallitas sin pelusa", precio: 60, rinde: 40 },
    { id: "aluminio", nombre: "Papel aluminio", precio: 35, rinde: 25 },
    { id: "guantes", nombre: "Guantes (caja de 100)", precio: 160, rinde: 50 },
    { id: "desechables", nombre: "Toallas desechables / campo", precio: 80, rinde: 40 },
  ],

  // minutos: duración en largo 1 y sin diseño.
  // usaLargo: si el largo cambia el material y el tiempo. usaDisenos: si lleva diseños por uña.
  // materiales: qué usa y cuánto (uso 1 = una porción normal, 0.5 = la mitad).
  servicios: [
    {
      id: "acrilico", nombre: "Uñas acrílicas (set completo)", minutos: 120, usaLargo: true, usaDisenos: true,
      materiales: [
        { id: "deshidratador", uso: 1 }, { id: "primer", uso: 1 }, { id: "tips", uso: 1 },
        { id: "pegamento", uso: 1 }, { id: "monomero", uso: 1 }, { id: "polvo", uso: 1 },
        { id: "topgel", uso: 1 }, { id: "lima", uso: 1 }, { id: "pulidor", uso: 1 },
        { id: "alcohol", uso: 1 }, { id: "guantes", uso: 1 }, { id: "desechables", uso: 1 },
      ],
    },
    {
      id: "semipermanente", nombre: "Esmaltado semipermanente", minutos: 60, usaLargo: true, usaDisenos: true,
      materiales: [
        { id: "deshidratador", uso: 1 }, { id: "primer", uso: 1 }, { id: "basegel", uso: 1 },
        { id: "colorgel", uso: 1 }, { id: "topgel", uso: 1 }, { id: "lima", uso: 1 },
        { id: "pulidor", uso: 1 }, { id: "alcohol", uso: 1 }, { id: "algodon", uso: 1 },
        { id: "guantes", uso: 1 }, { id: "desechables", uso: 1 },
      ],
    },
    {
      id: "rubber", nombre: "Rubber base", minutos: 75, usaLargo: true, usaDisenos: true,
      materiales: [
        { id: "deshidratador", uso: 1 }, { id: "primer", uso: 1 }, { id: "rubber", uso: 1 },
        { id: "colorgel", uso: 1 }, { id: "topgel", uso: 1 }, { id: "lima", uso: 1 },
        { id: "pulidor", uso: 1 }, { id: "alcohol", uso: 1 }, { id: "algodon", uso: 1 },
        { id: "guantes", uso: 1 }, { id: "desechables", uso: 1 },
      ],
    },
    {
      id: "retiro", nombre: "Retiro", minutos: 40, usaLargo: false, usaDisenos: false,
      materiales: [
        { id: "acetona", uso: 1 }, { id: "algodon", uso: 1 }, { id: "aluminio", uso: 1 },
        { id: "lima", uso: 1 }, { id: "pulidor", uso: 1 }, { id: "guantes", uso: 1 },
        { id: "desechables", uso: 1 },
      ],
    },
    {
      id: "relleno", nombre: "Relleno acrílico", minutos: 90, usaLargo: true, usaDisenos: true,
      materiales: [
        { id: "deshidratador", uso: 1 }, { id: "primer", uso: 1 }, { id: "monomero", uso: 0.6 },
        { id: "polvo", uso: 0.6 }, { id: "topgel", uso: 1 }, { id: "lima", uso: 1 },
        { id: "pulidor", uso: 1 }, { id: "alcohol", uso: 1 }, { id: "guantes", uso: 1 },
        { id: "desechables", uso: 1 },
      ],
    },
  ],

  // Largo 1 (el más corto) al 9 (el más largo).
  // factor: cuánto más material se gasta (1.2 = 20% más que el largo 1). minutosExtra: tiempo adicional.
  largos: [
    { id: "l1", nombre: "1", factor: 1, minutosExtra: 0 },
    { id: "l2", nombre: "2", factor: 1.1, minutosExtra: 5 },
    { id: "l3", nombre: "3", factor: 1.2, minutosExtra: 10 },
    { id: "l4", nombre: "4", factor: 1.3, minutosExtra: 15 },
    { id: "l5", nombre: "5", factor: 1.4, minutosExtra: 20 },
    { id: "l6", nombre: "6", factor: 1.5, minutosExtra: 25 },
    { id: "l7", nombre: "7", factor: 1.6, minutosExtra: 30 },
    { id: "l8", nombre: "8", factor: 1.7, minutosExtra: 35 },
    { id: "l9", nombre: "9", factor: 1.8, minutosExtra: 40 },
  ],

  // Catálogo de diseños. Se cobran POR UÑA.
  // precio: lo que cobra por cada uña con ese diseño.
  // minutos y costo: tiempo y material extra por uña (para saber si le conviene ese precio).
  // "liso" es la uña sin diseño (solo el color del servicio).
  disenos: [
    { id: "liso", nombre: "Liso (sin diseño)", precio: 0, minutos: 0, costo: 0 },
    { id: "frances", nombre: "Francés", precio: 10, minutos: 4, costo: 0.5 },
    { id: "babyboomer", nombre: "Baby boomer / degradado", precio: 15, minutos: 5, costo: 1 },
    { id: "cromo", nombre: "Efecto espejo / cromo", precio: 10, minutos: 3, costo: 2 },
    { id: "aurora", nombre: "Efecto aurora / perla", precio: 10, minutos: 3, costo: 2 },
    { id: "ojogato", nombre: "Ojo de gato", precio: 10, minutos: 3, costo: 1 },
    { id: "glitter", nombre: "Glitter / brillos", precio: 8, minutos: 3, costo: 1 },
    { id: "foil", nombre: "Foil / papel transfer", precio: 10, minutos: 3, costo: 1 },
    { id: "sticker", nombre: "Calcomanía / sticker", precio: 8, minutos: 2, costo: 1.5 },
    { id: "lineas", nombre: "Líneas / minimalista", precio: 10, minutos: 5, costo: 0.5 },
    { id: "marmol", nombre: "Marmoleado", precio: 15, minutos: 6, costo: 1 },
    { id: "animal", nombre: "Animal print", precio: 15, minutos: 7, costo: 0.5 },
    { id: "encapsulado", nombre: "Encapsulado (flores secas, glitter)", precio: 25, minutos: 8, costo: 3 },
    { id: "manosencillo", nombre: "Pintado a mano sencillo", precio: 15, minutos: 8, costo: 0.5 },
    { id: "manodetallado", nombre: "Pintado a mano detallado", precio: 30, minutos: 15, costo: 1 },
    { id: "relieve3d", nombre: "Relieve 3D", precio: 35, minutos: 15, costo: 3 },
    { id: "flor3d", nombre: "Flor 3D acrílica", precio: 40, minutos: 18, costo: 3 },
  ],

  // Las piedras se cobran aparte, por pieza.
  piedra: { costo: 1, precio: 5 },
};
