const CLAVE_GUARDADO = "calculadora-unas-v1";

// Uñas en orden: mano izquierda (meñique → pulgar) y mano derecha (pulgar → meñique)
const DEDOS = ["Meñique", "Anular", "Medio", "Índice", "Pulgar", "Pulgar", "Índice", "Medio", "Anular", "Meñique"];
const CLASES_DEDO = ["menique", "anular", "medio", "indice", "pulgar", "pulgar", "indice", "medio", "anular", "menique"];
const COLORES = ["#b784c9", "#e8a0bf", "#7fb3d5", "#f5c26b", "#8fcfb1", "#e38b8b", "#a3a0e8", "#d4a373", "#6fb7b7", "#f0a6ca", "#9bb56b", "#c49bd8"];

const $ = (sel) => document.querySelector(sel);
const clonar = (obj) => JSON.parse(JSON.stringify(obj));
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const buscar = (lista, id) => lista.find((x) => x.id === id);
const nuevoId = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const dinero = (n) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const textoUnas = (n) => `${n} ${n === 1 ? "uña" : "uñas"}`; // espacio que no se parte
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let datos = cargar();
let ultimoResultado = null;
let largoActual = null;
let unas = Array(10).fill("liso");

// ---------- Guardado ----------

// Actualiza datos guardados con versiones anteriores de la calculadora
function migrar(d) {
  if (d.negocio.nombre === "Mi Estudio de Uñas") d.negocio.nombre = DATOS_EJEMPLO.negocio.nombre;
  if ((d.version || 1) < 2) {
    d.largos = clonar(DATOS_EJEMPLO.largos);
    d.disenos = clonar(DATOS_EJEMPLO.disenos);
    d.servicios.forEach((s) => { if (s.usaDisenos === undefined) s.usaDisenos = s.id !== "retiro"; });
    d.version = 2;
  }
  return d;
}

function cargar() {
  try {
    const guardado = localStorage.getItem(CLAVE_GUARDADO);
    if (guardado) return migrar(JSON.parse(guardado));
  } catch (e) { /* sin almacenamiento: se usan los datos de ejemplo */ }
  return clonar(DATOS_EJEMPLO);
}

function guardar() {
  try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos)); } catch (e) { /* ignorar */ }
}

// ---------- Pestañas ----------

document.querySelectorAll(".tab").forEach((boton) => {
  boton.addEventListener("click", () => mostrarPestana(boton.dataset.tab));
});

function mostrarPestana(nombre) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("activo", b.dataset.tab === nombre));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("activo", p.id === "tab-" + nombre));
  if (nombre === "calcular") llenarCalculadora();
  if (nombre === "disenos") renderLista("disenos");
  if (nombre === "materiales") renderLista("materiales");
  if (nombre === "servicios") renderServicios();
  if (nombre === "ajustes") renderAjustes();
}

// ---------- Cálculo ----------

function costoMaterial(m) {
  return m && m.rinde > 0 ? m.precio / m.rinde : 0;
}

// Precio por uña que cubriría su tiempo y material, con el margen del negocio
function sugeridoDiseno(d) {
  return ((d.minutos / 60) * datos.tarifaHora + d.costo) * (1 + datos.margen / 100);
}

function colorDiseno(id) {
  const i = datos.disenos.findIndex((d) => d.id === id);
  return i < 0 || id === "liso" ? null : COLORES[i % COLORES.length];
}

function formatoMinutos(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h${m ? " " + m + " min" : ""}` : `${m} min`;
}

function calcularServicio(servicio, largo, idsUnas, piedras) {
  const aplicaLargo = servicio.usaLargo && largo;
  const factor = aplicaLargo ? largo.factor : 1;

  const detalle = servicio.materiales
    .map((u) => {
      const m = buscar(datos.materiales, u.id);
      return m ? { nombre: m.nombre, costo: costoMaterial(m) * u.uso * factor } : null;
    })
    .filter(Boolean);

  const materiales = detalle.reduce((t, d) => t + d.costo, 0);
  const minutosBase = servicio.minutos + (aplicaLargo ? largo.minutosExtra : 0);
  const tiempo = (minutosBase / 60) * datos.tarifaHora;
  const totalFijos = datos.gastosFijos.reduce((t, g) => t + g.monto, 0);
  const fijos = datos.serviciosMes > 0 ? totalFijos / datos.serviciosMes : 0;
  const margen = (materiales + tiempo + fijos) * (datos.margen / 100);
  const base = materiales + tiempo + fijos + margen;

  // Agrupa las uñas por diseño: [{ diseno, n }]
  const grupos = [];
  if (servicio.usaDisenos) {
    idsUnas.forEach((id) => {
      const diseno = buscar(datos.disenos, id);
      if (!diseno || diseno.id === "liso") return;
      let g = grupos.find((x) => x.diseno === diseno);
      if (!g) grupos.push((g = { diseno, n: 0 }));
      g.n++;
    });
  }
  const cobroDisenos = grupos.reduce((t, g) => t + g.diseno.precio * g.n, 0);
  const costoDisenos = grupos.reduce((t, g) => t + g.diseno.costo * g.n, 0);
  const minutosDisenos = grupos.reduce((t, g) => t + g.diseno.minutos * g.n, 0);

  const costoPiedras = piedras * datos.piedra.costo;
  const cobroPiedras = piedras * datos.piedra.precio;

  const subtotal = base + cobroDisenos + cobroPiedras;
  const precio = datos.redondeo > 0 ? Math.ceil(subtotal / datos.redondeo - 1e-9) * datos.redondeo : subtotal;

  return {
    servicio: servicio.nombre,
    largo: aplicaLargo ? largo.nombre : "",
    usaDisenos: !!servicio.usaDisenos,
    detalle, materiales, minutosBase, tiempo, fijos, margen, base,
    grupos, cobroDisenos, costoDisenos,
    piedras, costoPiedras, cobroPiedras,
    subtotal, precio,
    minutos: minutosBase + minutosDisenos,
  };
}

// Lo que le queda a ella (su pago + ganancia) después de pagar materiales, piedras y gastos fijos
function teQueda(precio, r) {
  const monto = precio - r.materiales - r.costoDisenos - r.costoPiedras - r.fijos;
  const porHora = r.minutos > 0 ? monto / (r.minutos / 60) : 0;
  return { monto, porHora };
}

// ---------- Pestaña Calcular ----------

function llenarCalculadora() {
  $("#nombre-negocio").textContent = datos.negocio.nombre || "Bloom Studio";

  const selServicio = $("#c-servicio");
  const servicioActual = selServicio.value;
  selServicio.innerHTML = datos.servicios.map((s) => `<option value="${esc(s.id)}">${esc(s.nombre)}</option>`).join("");
  if (buscar(datos.servicios, servicioActual)) selServicio.value = servicioActual;

  const selDiseno = $("#c-diseno");
  const disenoActual = selDiseno.value;
  selDiseno.innerHTML = datos.disenos
    .map((d) => `<option value="${esc(d.id)}">${esc(d.nombre)}${d.precio > 0 ? " — " + dinero(d.precio) + " c/u" : ""}</option>`)
    .join("");
  const primero = datos.disenos.find((d) => d.id !== "liso");
  if (buscar(datos.disenos, disenoActual)) selDiseno.value = disenoActual;
  else if (primero) selDiseno.value = primero.id;

  if (!buscar(datos.largos, largoActual)) largoActual = datos.largos.length ? datos.largos[0].id : null;
  calcular();
}

function renderLargos(habilitado) {
  $("#c-largo").innerHTML = datos.largos
    .map((l) => `<button type="button" class="chip ${l.id === largoActual ? "activo" : ""}" data-largo="${esc(l.id)}" ${habilitado ? "" : "disabled"}>${esc(l.nombre)}</button>`)
    .join("");
  $("#bloque-largo").classList.toggle("deshabilitado", !habilitado);
}

function renderUnas() {
  const mano = (desde) => [0, 1, 2, 3, 4].map((k) => {
    const i = desde + k;
    const diseno = buscar(datos.disenos, unas[i]);
    const nombre = diseno && diseno.id !== "liso" ? diseno.nombre : "Liso";
    const color = colorDiseno(unas[i]);
    return `
      <button type="button" class="una dedo-${CLASES_DEDO[i]}" data-una="${i}" title="${esc(DEDOS[i])}: ${esc(nombre)}">
        <span class="una-forma" ${color ? `style="--color:${color}"` : ""}></span>
        <span class="una-dedo">${DEDOS[i]}</span>
        <span class="una-diseno">${esc(nombre)}</span>
      </button>`;
  }).join("");
  $("#mano-izq").innerHTML = mano(0);
  $("#mano-der").innerHTML = mano(5);
}

function calcular() {
  const servicio = buscar(datos.servicios, $("#c-servicio").value);
  if (!servicio) {
    $("#r-precio").textContent = "—";
    $("#r-queda").textContent = "Agrega un servicio en la pestaña Servicios.";
    $("#r-tiempo").textContent = "";
    $("#r-desglose").innerHTML = "";
    ultimoResultado = null;
    return;
  }

  renderLargos(servicio.usaLargo);
  $("#bloque-disenos").hidden = !servicio.usaDisenos;
  renderUnas();

  const r = calcularServicio(
    servicio,
    buscar(datos.largos, largoActual),
    unas,
    Math.max(0, Math.round(num($("#c-piedras").value)))
  );
  ultimoResultado = r;

  const queda = teQueda(r.precio, r);
  $("#r-precio").textContent = dinero(r.precio);
  $("#r-queda").textContent = `Te quedan ${dinero(queda.monto)} (≈ ${dinero(queda.porHora)} por hora)`;
  $("#r-tiempo").textContent = `Tiempo total estimado: ${formatoMinutos(r.minutos)}`;

  const filas = [
    ["Materiales del servicio", r.materiales],
    [`Tu tiempo (${formatoMinutos(r.minutosBase)} × ${dinero(datos.tarifaHora)}/h)`, r.tiempo],
    ["Gastos fijos (parte de este servicio)", r.fijos],
    [`Margen del negocio (${datos.margen}%)`, r.margen],
    ["Servicio base", r.base, "subtotal"],
  ];
  r.grupos.forEach((g) => filas.push([`${g.diseno.nombre} (${g.n} ${g.n === 1 ? "uña" : "uñas"} × ${dinero(g.diseno.precio)})`, g.diseno.precio * g.n]));
  if (r.piedras > 0) filas.push([`Piedras (${r.piedras} × ${dinero(datos.piedra.precio)})`, r.cobroPiedras]);
  if (r.precio - r.subtotal > 0.005) filas.push(["Redondeo", r.precio - r.subtotal]);
  filas.push(["Total", r.precio, "total"]);

  $("#r-desglose").innerHTML = filas
    .map(([nombre, valor, clase]) => `<div class="${clase || ""}"><dt>${esc(nombre)}</dt><dd>${dinero(valor)}</dd></div>`)
    .join("");

  $("#r-materiales").innerHTML = r.detalle
    .map((d) => `<li><span>${esc(d.nombre)}</span><span>${dinero(d.costo)}</span></li>`)
    .join("") || "<li>Este servicio no tiene materiales asignados.</li>";
  if (r.costoDisenos > 0) $("#r-materiales").innerHTML += `<li><span>Material de diseños</span><span>${dinero(r.costoDisenos)}</span></li>`;
  if (r.costoPiedras > 0) $("#r-materiales").innerHTML += `<li><span>Piedras (${r.piedras})</span><span>${dinero(r.costoPiedras)}</span></li>`;

  const lisas = unas.filter((id) => !buscar(datos.disenos, id) || id === "liso").length;
  $("#r-disenos").innerHTML = r.grupos
    .map((g) => `<li><span class="muestra" style="--color:${colorDiseno(g.diseno.id)}"></span>${esc(g.diseno.nombre)}: ${g.n} ${g.n === 1 ? "uña" : "uñas"} → ${dinero(g.diseno.precio * g.n)}</li>`)
    .join("") + (lisas ? `<li><span class="muestra"></span>Lisas: ${lisas}</li>` : "");

  compararPrecio();
}

function compararPrecio() {
  const salida = $("#r-comparar");
  const miPrecio = num($("#c-mi-precio").value);
  const r = ultimoResultado;
  if (!r || miPrecio <= 0) { salida.textContent = ""; salida.className = "comparar"; return; }

  const queda = teQueda(miPrecio, r);
  let mensaje = `Con ${dinero(miPrecio)} te quedan ${dinero(queda.monto)} (≈ ${dinero(queda.porHora)} por hora). `;
  let estado;
  if (queda.monto <= 0) {
    mensaje += "Estás perdiendo dinero: no alcanzas a cubrir material y gastos.";
    estado = "mal";
  } else if (miPrecio < r.precio) {
    mensaje += `Cubres tus costos, pero estás ${dinero(r.precio - miPrecio)} abajo del precio sugerido.`;
    estado = "regular";
  } else {
    mensaje += "¡Bien! Tu precio cubre todo y deja ganancia.";
    estado = "bien";
  }
  salida.textContent = mensaje;
  salida.className = "comparar " + estado;
}

$("#c-servicio").addEventListener("input", calcular);
$("#c-piedras").addEventListener("input", calcular);
$("#c-mi-precio").addEventListener("input", compararPrecio);

// ---------- WhatsApp ----------

function numeroWhatsApp(texto) {
  const digitos = String(texto || "").replace(/\D/g, "");
  return digitos.length === 10 ? "52" + digitos : digitos; // México: agrega lada del país
}

function abrirChat(texto) {
  const numero = numeroWhatsApp($("#w-numero").value || datos.negocio.whatsapp);
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank");
}

$("#btn-whatsapp").addEventListener("click", () => {
  const r = ultimoResultado;
  if (!r) return;
  if ($("#w-tipo").value === "clienta") {
    crearCotizacion();
    return;
  }

  // Desglose en texto, para ella
  const queda = teQueda(r.precio, r);
  const lineas = [
    `*${datos.negocio.nombre} · Desglose*`,
    "",
    `*${r.servicio}*${r.largo ? " · largo " + r.largo : ""}`,
    `Materiales: ${dinero(r.materiales)}`,
    `Tiempo (${formatoMinutos(r.minutosBase)}): ${dinero(r.tiempo)}`,
    `Gastos fijos: ${dinero(r.fijos)}`,
    `Margen: ${dinero(r.margen)}`,
    `Servicio base: ${dinero(r.base)}`,
  ];
  if (r.grupos.length) {
    lineas.push("", "*Diseños*");
    r.grupos.forEach((g) => lineas.push(`${g.diseno.nombre} (${textoUnas(g.n)}): ${dinero(g.diseno.precio * g.n)}`));
  }
  if (r.piedras) lineas.push(`Piedras (${r.piedras}): ${dinero(r.cobroPiedras)}`);
  lineas.push(
    "",
    `*Precio sugerido: ${dinero(r.precio)}*`,
    `Tiempo total: ${formatoMinutos(r.minutos)}`,
    `Me quedan: ${dinero(queda.monto)} (≈ ${dinero(queda.porHora)}/h)`
  );
  abrirChat(lineas.join("\n"));
});

// ---------- Cotización en imagen ----------

const MARCA = { morado: "#7a3e8e", moradoOscuro: "#56236a", lila: "#efe6f5", texto: "#2e2533", suave: "#7d7085", borde: "#e6dcee" };
let cotizacionBlob = null;

function aBlob(canvas) {
  return new Promise((ok, falla) => {
    try { canvas.toBlob((b) => (b ? ok(b) : falla(new Error("sin imagen"))), "image/png"); } catch (e) { falla(e); }
  });
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function recortar(ctx, texto, ancho) {
  if (ctx.measureText(texto).width <= ancho) return texto;
  while (texto.length > 1 && ctx.measureText(texto + "…").width > ancho) texto = texto.slice(0, -1);
  return texto + "…";
}

// Renglones de la cotización; el renglón del servicio absorbe el redondeo para que todo sume el total
function filasCotizacion(r) {
  const filas = [{ nombre: r.servicio, detalle: r.largo ? `Largo ${r.largo}` : "", monto: r.precio - r.cobroDisenos - r.cobroPiedras }];
  r.grupos.forEach((g) => filas.push({
    nombre: g.diseno.nombre,
    detalle: `${textoUnas(g.n)} × ${dinero(g.diseno.precio)}`,
    monto: g.diseno.precio * g.n,
    color: colorDiseno(g.diseno.id),
  }));
  if (r.piedras) filas.push({ nombre: "Piedras", detalle: `${r.piedras} × ${dinero(datos.piedra.precio)}`, monto: r.cobroPiedras });
  return filas;
}

// Hoja sencilla: nombre del negocio, renglones de precio, total y agradecimiento
function dibujarCotizacion(r) {
  const W = 1080, M = 50, P = 80;
  const izq = M + P, der = W - M - P, cx = W / 2;
  const filas = filasCotizacion(r);
  const alto = M + 50 + 160 + 120 + 50 + filas.reduce((t, f) => t + (f.detalle ? 128 : 90), 0) + 230 + 110 + M;

  const lienzo = document.createElement("canvas");
  lienzo.width = W;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");

  // Fondo lila y tarjeta blanca
  ctx.fillStyle = MARCA.lila;
  ctx.fillRect(0, 0, W, alto);
  ctx.save();
  ctx.shadowColor = "rgba(86, 35, 106, 0.15)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  rectRedondo(ctx, M, M, W - 2 * M, alto - 2 * M, 40);
  ctx.fill();
  ctx.restore();

  let y = M + 50;

  // Nombre del negocio, "COTIZACIÓN" y fecha
  ctx.textAlign = "center";
  ctx.fillStyle = MARCA.texto;
  ctx.font = '120px "Great Vibes"';
  ctx.fillText(recortar(ctx, datos.negocio.nombre, der - izq), cx, y + 110);
  y += 160;

  ctx.fillStyle = MARCA.morado;
  ctx.font = "600 32px Poppins";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "8px";
  ctx.fillText("COTIZACIÓN", cx, y + 30);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.fillStyle = MARCA.suave;
  ctx.font = "28px Poppins";
  ctx.fillText(new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }), cx, y + 76);
  y += 120;

  ctx.fillStyle = MARCA.borde;
  ctx.fillRect(izq, y, der - izq, 2);
  y += 50;

  filas.forEach((f, i) => {
    if (i > 0) {
      ctx.fillStyle = MARCA.borde;
      ctx.fillRect(izq, y - 26, der - izq, 1);
    }
    let x = izq;
    if (f.color) {
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(x + 13, y + 22, 13, 0, Math.PI * 2);
      ctx.fill();
      x += 44;
    }
    ctx.textAlign = "right";
    ctx.fillStyle = MARCA.texto;
    ctx.font = "600 38px Poppins";
    ctx.fillText(dinero(f.monto), der, y + 36);
    const anchoMonto = ctx.measureText(dinero(f.monto)).width;

    ctx.textAlign = "left";
    ctx.font = "500 38px Poppins";
    ctx.fillText(recortar(ctx, f.nombre, der - x - anchoMonto - 30), x, y + 36);
    if (f.detalle) {
      ctx.fillStyle = MARCA.suave;
      ctx.font = "28px Poppins";
      ctx.fillText(f.detalle, x, y + 80);
    }
    y += f.detalle ? 128 : 90;
  });

  // Total
  ctx.fillStyle = MARCA.morado;
  rectRedondo(ctx, izq - 20, y, der - izq + 40, 150, 30);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = "500 38px Poppins";
  ctx.fillText("Total", izq + 16, y + 90);
  ctx.textAlign = "right";
  ctx.font = "700 68px Poppins";
  ctx.fillText(dinero(r.precio), der - 16, y + 100);
  y += 150 + 80;

  ctx.textAlign = "center";
  ctx.fillStyle = MARCA.moradoOscuro;
  ctx.font = '64px "Great Vibes"';
  ctx.fillText("¡Gracias por tu preferencia!", cx, y + 20);
  return lienzo;
}

async function crearCotizacion() {
  const r = ultimoResultado;
  if (!r) return;
  const fuentes = ["400 28px Poppins", "500 38px Poppins", "600 38px Poppins", "700 68px Poppins", '120px "Great Vibes"'];
  await Promise.all(fuentes.map((f) => document.fonts.load(f))).catch(() => {});
  cotizacionBlob = await aBlob(dibujarCotizacion(r));

  const img = $("#img-cotizacion");
  if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(cotizacionBlob);

  const puedeCompartir = !!(navigator.canShare && navigator.canShare({ files: [archivoCotizacion()] }));
  $("#btn-compartir").hidden = !puedeCompartir;
  $("#btn-copiar").hidden = !(navigator.clipboard && window.ClipboardItem);
  $("#btn-copiar").textContent = "Copiar imagen";
  $("#dlg-nota").textContent = puedeCompartir
    ? "Toca «Compartir» y elige WhatsApp."
    : "Descarga o copia la imagen, abre el chat y pégala (Ctrl + V) o adjúntala.";
  $("#dlg-cotizacion").showModal();
}

function archivoCotizacion() {
  const fecha = new Date().toISOString().slice(0, 10);
  return new File([cotizacionBlob || ""], `cotizacion-${fecha}.png`, { type: "image/png" });
}

$("#btn-compartir").addEventListener("click", async () => {
  try {
    await navigator.share({ files: [archivoCotizacion()], title: "Cotización", text: `Tu cotización de ${datos.negocio.nombre} 💅` });
  } catch (e) { /* compartir cancelado */ }
});

$("#btn-descargar").addEventListener("click", () => {
  const enlace = document.createElement("a");
  enlace.href = $("#img-cotizacion").src;
  enlace.download = archivoCotizacion().name;
  enlace.click();
});

$("#btn-copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": cotizacionBlob })]);
    $("#btn-copiar").textContent = "¡Copiada!";
  } catch (e) {
    $("#btn-copiar").textContent = "No se pudo copiar";
  }
});

$("#btn-abrir-chat").addEventListener("click", () => abrirChat(`¡Hola! Te comparto tu cotización de ${datos.negocio.nombre} 💅`));
$("#btn-cerrar").addEventListener("click", () => $("#dlg-cotizacion").close());

// ---------- Listas editables (diseños, materiales, gastos, largos) ----------

const CAMPOS = {
  disenos: [["nombre", "text", "Diseño"], ["precio", "number", "Cobro por uña $"], ["minutos", "number", "Min. por uña"], ["costo", "number", "Material por uña $"]],
  materiales: [["nombre", "text", "Material"], ["precio", "number", "Precio $"], ["rinde", "number", "Rinde (servicios)"]],
  gastosFijos: [["nombre", "text", "Gasto"], ["monto", "number", "$ al mes"]],
  largos: [["nombre", "text", "Largo"], ["factor", "number", "×Material"], ["minutosExtra", "number", "Min. extra"]],
};

const NUEVOS = {
  disenos: () => ({ nombre: "Nuevo diseño", precio: 0, minutos: 0, costo: 0 }),
  materiales: () => ({ nombre: "Nuevo material", precio: 0, rinde: 1 }),
  gastosFijos: () => ({ nombre: "Nuevo gasto", monto: 0 }),
  largos: () => ({ nombre: String(datos.largos.length + 1), factor: 1, minutosExtra: 0 }),
};

// Texto calculado que acompaña a cada fila (se actualiza al escribir)
const EXTRAS = {
  materiales: (m) => `${dinero(costoMaterial(m))} por servicio`,
  disenos: (d) => `Sugerido: ${dinero(sugeridoDiseno(d))} por uña`,
};

function renderLista(lista) {
  const enTarjeta = lista === "materiales" || lista === "disenos";
  $("#lista-" + lista).innerHTML = datos[lista].map((item, i) => `
    <div class="fila-edit ${enTarjeta ? "tarjeta" : ""}">
      ${CAMPOS[lista].map(([campo, tipo, etiqueta]) => `
        <label class="${tipo === "text" ? "campo-nombre" : ""}">${etiqueta}
          <input type="${tipo}" ${tipo === "number" ? 'min="0" step="any" inputmode="decimal"' : ""}
            data-lista="${lista}" data-i="${i}" data-campo="${campo}" value="${esc(item[campo])}">
        </label>`).join("")}
      ${EXTRAS[lista] ? `<span class="extra">${EXTRAS[lista](item)}</span>` : ""}
      <button class="btn-borrar" data-borrar="${lista}" data-i="${i}" aria-label="Eliminar">✕</button>
    </div>`).join("");
  if (lista === "gastosFijos") actualizarFijos();
}

function actualizarFijos() {
  const total = datos.gastosFijos.reduce((t, g) => t + g.monto, 0);
  const porServicio = datos.serviciosMes > 0 ? total / datos.serviciosMes : 0;
  $("#r-fijos").textContent = `Total al mes: ${dinero(total)} → ${dinero(porServicio)} por servicio.`;
}

// ---------- Servicios ----------

function renderServicios() {
  $("#lista-servicios").innerHTML = datos.servicios.map((s, i) => {
    const materiales = datos.materiales.map((m) => {
      const uso = s.materiales.find((u) => u.id === m.id);
      return `
        <div class="mat-check">
          <label><input type="checkbox" data-serv="${i}" data-mat="${esc(m.id)}" ${uso ? "checked" : ""}> ${esc(m.nombre)}</label>
          ${uso ? `<input type="number" min="0" step="any" inputmode="decimal" class="uso" data-serv-uso="${i}" data-mat="${esc(m.id)}" value="${uso.uso}" aria-label="Uso">` : ""}
        </div>`;
    }).join("");
    return `
      <div class="tarjeta servicio">
        <div class="fila-edit">
          <label class="campo-nombre">Servicio
            <input type="text" data-lista="servicios" data-i="${i}" data-campo="nombre" value="${esc(s.nombre)}">
          </label>
          <label>Minutos
            <input type="number" min="0" step="1" inputmode="numeric" data-lista="servicios" data-i="${i}" data-campo="minutos" value="${s.minutos}">
          </label>
          <button class="btn-borrar" data-borrar="servicios" data-i="${i}" aria-label="Eliminar">✕</button>
        </div>
        <label class="check-largo"><input type="checkbox" data-lista="servicios" data-i="${i}" data-campo="usaLargo" ${s.usaLargo ? "checked" : ""}> El largo cambia el precio</label>
        <label class="check-largo"><input type="checkbox" data-lista="servicios" data-i="${i}" data-campo="usaDisenos" ${s.usaDisenos ? "checked" : ""}> Lleva diseños por uña</label>
        <details>
          <summary>Materiales que usa (${s.materiales.length})</summary>
          <div class="mat-grid">${materiales}</div>
        </details>
      </div>`;
  }).join("");
}

$("#btn-agregar-servicio").addEventListener("click", () => {
  datos.servicios.push({ id: nuevoId(), nombre: "Nuevo servicio", minutos: 60, usaLargo: true, usaDisenos: true, materiales: [] });
  guardar();
  renderServicios();
});

// ---------- Ajustes ----------

function leerRuta(ruta) {
  return ruta.split(".").reduce((o, k) => o[k], datos);
}

function escribirRuta(ruta, valor) {
  const partes = ruta.split(".");
  const ultima = partes.pop();
  partes.reduce((o, k) => o[k], datos)[ultima] = valor;
}

function renderAjustes() {
  document.querySelectorAll("[data-ruta]").forEach((el) => { el.value = leerRuta(el.dataset.ruta); });
  ["gastosFijos", "largos"].forEach(renderLista);
}

// ---------- Eventos de edición (delegados) ----------

document.addEventListener("input", (e) => {
  const el = e.target;

  if (el.dataset.ruta) {
    escribirRuta(el.dataset.ruta, el.type === "number" ? num(el.value) : el.value);
    if (el.dataset.ruta === "serviciosMes") actualizarFijos();
  } else if (el.dataset.lista) {
    const lista = el.dataset.lista;
    const item = datos[lista][el.dataset.i];
    item[el.dataset.campo] = el.type === "checkbox" ? el.checked : el.type === "number" ? num(el.value) : el.value;
    if (EXTRAS[lista]) el.closest(".fila-edit").querySelector(".extra").textContent = EXTRAS[lista](item);
    if (lista === "gastosFijos") actualizarFijos();
  } else if (el.dataset.servUso !== undefined) {
    const uso = datos.servicios[el.dataset.servUso].materiales.find((u) => u.id === el.dataset.mat);
    if (uso) uso.uso = num(el.value);
  } else if (el.dataset.serv !== undefined) {
    const servicio = datos.servicios[el.dataset.serv];
    servicio.materiales = servicio.materiales.filter((u) => u.id !== el.dataset.mat);
    if (el.checked) servicio.materiales.push({ id: el.dataset.mat, uso: 1 });
    renderServicios();
    // Mantener abierta la lista de materiales del servicio que se estaba editando
    document.querySelectorAll("#lista-servicios details")[el.dataset.serv].open = true;
  } else {
    return;
  }
  guardar();
});

document.addEventListener("click", (e) => {
  const una = e.target.closest("[data-una]");
  const aplicar = e.target.closest("[data-aplicar]");
  const largo = e.target.closest("[data-largo]");
  const borrar = e.target.closest("[data-borrar]");
  const agregar = e.target.closest("[data-agregar]");
  const disenoElegido = $("#c-diseno").value;

  if (una) {
    const i = Number(una.dataset.una);
    unas[i] = unas[i] === disenoElegido ? "liso" : disenoElegido;
    calcular();
  } else if (aplicar) {
    const rango = { todas: [0, 10], izq: [0, 5], der: [5, 10], limpiar: [0, 10] }[aplicar.dataset.aplicar];
    const valor = aplicar.dataset.aplicar === "limpiar" ? "liso" : disenoElegido;
    for (let i = rango[0]; i < rango[1]; i++) unas[i] = valor;
    calcular();
  } else if (largo) {
    largoActual = largo.dataset.largo;
    calcular();
  } else if (borrar) {
    const lista = borrar.dataset.borrar;
    const item = datos[lista][borrar.dataset.i];
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    datos[lista].splice(borrar.dataset.i, 1);
    if (lista === "materiales") {
      datos.servicios.forEach((s) => { s.materiales = s.materiales.filter((u) => u.id !== item.id); });
    }
    if (lista === "disenos") unas = unas.map((id) => (id === item.id ? "liso" : id));
    guardar();
    lista === "servicios" ? renderServicios() : renderLista(lista);
  } else if (agregar) {
    const lista = agregar.dataset.agregar;
    datos[lista].push({ id: nuevoId(), ...NUEVOS[lista]() });
    guardar();
    renderLista(lista);
  }
});

// ---------- Respaldo ----------

$("#btn-exportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `respaldo-calculadora-${new Date().toISOString().slice(0, 10)}.json`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
});

$("#archivo-importar").addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const importado = JSON.parse(lector.result);
      if (!Array.isArray(importado.servicios) || !Array.isArray(importado.materiales)) throw new Error();
      datos = migrar(importado);
      guardar();
      renderAjustes();
      alert("Respaldo cargado correctamente.");
    } catch (err) {
      alert("Ese archivo no es un respaldo válido de la calculadora.");
    }
  };
  lector.readAsText(archivo);
  e.target.value = "";
});

$("#btn-restaurar").addEventListener("click", () => {
  if (!confirm("Esto borrará todos tus cambios y pondrá los datos de ejemplo. ¿Continuar?")) return;
  datos = clonar(DATOS_EJEMPLO);
  guardar();
  renderAjustes();
});

// ---------- Inicio ----------

llenarCalculadora();
