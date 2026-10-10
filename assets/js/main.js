/* Astroturismo Cielo Sur — interacciones de la página.
   La página funciona sin este archivo; esto solo suma detalles. */

(function () {
  var portada = document.querySelector('.portada');
  // El botón flotante se esconde mientras se ve el formulario de reserva, para no tapar sus campos
  var botonCierre = document.getElementById('formulario-reserva');
  var flotante = document.querySelector('.whatsapp-flotante');

  if (!('IntersectionObserver' in window)) {
    document.body.classList.add('paso-portada');
    if (flotante) flotante.classList.add('visible');
    return;
  }

  var pasoPortada = false;
  var cierreVisible = false;

  /* La barra superior y el botón flotante de WhatsApp aparecen al pasar la portada.
     El flotante se oculta cuando se ve el formulario de reserva. */
  function actualizar() {
    document.body.classList.toggle('paso-portada', pasoPortada);
    if (flotante) flotante.classList.toggle('visible', pasoPortada && !cierreVisible);
  }

  new IntersectionObserver(function (entradas) {
    pasoPortada = !entradas[0].isIntersecting;
    actualizar();
  }, { threshold: 0.15 }).observe(portada);

  if (botonCierre) {
    new IntersectionObserver(function (entradas) {
      cierreVisible = entradas[0].isIntersecting;
      actualizar();
    }).observe(botonCierre);
  }
})();

/* 4. Enlaces con datos pendientes: no llevan a ninguna parte todavía */
document.querySelectorAll('[data-pendiente]').forEach(function (a) {
  a.addEventListener('click', function (e) { e.preventDefault(); });
});

/* 5. Formulario de reserva: arma el mensaje y abre WhatsApp (o el correo, como plan B) */
(function () {
  /* ---- DATOS QUE SE CAMBIAN AQUÍ ---- */
  var WHATSAPP = '56971387080';              // WhatsApp de Mako
  var CORREO = '[CORREO DEL CLIENTE]';       // cambiar por el correo (ej.: reservas@cielosur.cl)
  var PRECIO_ADULTO = 15000;                 // PENDIENTE: precios de 2024 (La Tercera); Mako confirma los actuales
  var PRECIO_NINO = 13000;
  var MAXIMO = 9;                            // tamaño máximo del grupo (página antigua de Mako)
  /* ----------------------------------- */

  var form = document.getElementById('formulario-reserva');
  if (!form || form.tagName !== 'FORM') return;
  var fecha = form.querySelector('#r-fecha');
  var adultos = form.querySelector('#r-adultos');
  var ninos = form.querySelector('#r-ninos');
  var nombre = form.querySelector('#r-nombre');
  var total = form.querySelector('#r-total');

  // No se pueden elegir fechas pasadas
  var hoy = new Date();
  fecha.min = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  var pesos = function (n) { return '$' + n.toLocaleString('es-CL'); };
  var numero = function (input) { var n = parseInt(input.value, 10); return isNaN(n) || n < 0 ? 0 : n; };

  function actualizarTotal() {
    total.textContent = pesos(numero(adultos) * PRECIO_ADULTO + numero(ninos) * PRECIO_NINO);
  }

  // Botones + y −
  form.querySelectorAll('[data-cambiar]').forEach(function (boton) {
    boton.addEventListener('click', function () {
      var input = form.querySelector('#' + boton.getAttribute('data-cambiar'));
      var nuevo = Math.min(MAXIMO, Math.max(0, numero(input) + parseInt(boton.getAttribute('data-paso'), 10)));
      input.value = nuevo;
      actualizarTotal();
    });
  });
  [adultos, ninos].forEach(function (i) { i.addEventListener('input', actualizarTotal); });
  actualizarTotal();

  function marcar(campo, ok) {
    var error = campo.querySelector('.reserva__error');
    if (error) error.hidden = ok;
    campo.classList.toggle('reserva__campo--error', !ok);
    return ok;
  }

  function revisar() {
    var primero = null;
    var okFecha = marcar(fecha.closest('.reserva__campo'), !!fecha.value);
    if (!okFecha) primero = fecha;
    var personas = numero(adultos) + numero(ninos);
    var okPersonas = marcar(adultos.closest('.reserva__campo'), personas >= 1 && personas <= MAXIMO);
    if (!okPersonas && !primero) primero = adultos;
    var okNombre = marcar(nombre.closest('.reserva__campo'), nombre.value.trim() !== '');
    if (!okNombre && !primero) primero = nombre;
    if (primero) primero.focus();
    return !primero;
  }

  function mensaje() {
    var f = new Date(fecha.value + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    if (form.flexible.checked) f += ' (con flexibilidad de fechas)';
    var a = numero(adultos), n = numero(ninos);
    var personas = a + (a === 1 ? ' adulto' : ' adultos') + (n ? ' y ' + n + (n === 1 ? ' niño' : ' niños') : '');
    var idioma = form.querySelector('input[name="idioma"]:checked').value;
    var lineas = [
      'Hola Mako, quiero reservar un tour de observación.',
      'Nombre: ' + nombre.value.trim(),
      'Fecha: ' + f,
      'Personas: ' + personas,
      'Idioma: ' + idioma,
      'Total referencial: ' + total.textContent
    ];
    var nota = form.nota.value.trim();
    if (nota) lineas.push('Comentario: ' + nota);
    return lineas.join('\n');
  }

  // Enviar por WhatsApp
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!revisar()) return;
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensaje()), '_blank', 'noopener');
  });

  // Plan B: abre el correo de la persona con el mensaje ya escrito
  form.querySelector('#r-correo').addEventListener('click', function () {
    if (!revisar()) return;
    location.href = 'mailto:' + CORREO + '?subject=' + encodeURIComponent('Reserva tour de observación') + '&body=' + encodeURIComponent(mensaje());
  });
})();

/* 6. Años de trayectoria: se calculan solos desde el año de inicio (así no queda desactualizado) */
document.querySelectorAll('[data-anios-desde]').forEach(function (el) {
  var desde = parseInt(el.getAttribute('data-anios-desde'), 10);
  var anios = new Date().getFullYear() - desde;
  if (anios > 0) el.textContent = anios;
});
