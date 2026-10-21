(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const TZ = 'Europe/Madrid';
  const WHATSAPP = '34619715885';
  const OPEN_DAYS = [0, 2, 3, 4, 5, 6]; // 0 = domingo; los lunes cerrado
  const OPEN_AT = 10 * 60;               // 10:00
  const CLOSE_AT = 60;                   // 01:00 del día siguiente
  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ——— Agenda semanal (para cambiar lo que sale cada día, editar aquí) ——— */
  const AGENDA = {
    1: {
      closed: true, title: 'Día de descanso',
      lead: 'Los lunes bajamos la persiana. Volvemos el martes a las 10:00.',
      items: []
    },
    2: {
      title: 'Vermut y tapas',
      lead: 'Arranca la semana en la Esquina: vermut, algo para picar y terraza.',
      items: [
        { icon: 'i-vermut', t: 'Vermut y tapas', d: 'Desde las 10:00, dentro o en la terraza.' },
        { icon: 'i-tv', t: 'Noche de Champions', d: 'Si hay partido, lo ponemos en pantalla.', tag: 'Fútbol' },
        { icon: 'i-billar', t: 'Billar y futbolín', d: 'Para la sobremesa o para la noche.' }
      ]
    },
    3: {
      title: 'Miércoles de cañitas', promo: '1 €',
      lead: 'La caña a un euro, todos los miércoles. Hoy toca brindar.',
      items: [
        { icon: 'i-beer', t: 'Cañitas a 1 €', d: 'La campaña de los miércoles.', tag: 'Promo' },
        { icon: 'i-vermut', t: 'Vermut y tapas', d: 'Desde las 10:00, como cada día.' },
        { icon: 'i-tv', t: 'Noche de Champions', d: 'Si hay partido, lo ponemos en pantalla.', tag: 'Fútbol' }
      ]
    },
    4: {
      title: 'Vermut y tapas',
      lead: 'Media semana hecha. Pasa a por un vermut o a echar una partida.',
      items: [
        { icon: 'i-vermut', t: 'Vermut y tapas', d: 'Desde las 10:00, dentro o en la terraza.' },
        { icon: 'i-billar', t: 'Billar y futbolín', d: 'Retos, piques y revanchas.' },
        { icon: 'i-tv', t: 'Fútbol', d: 'Si hay partido, se ve aquí.', tag: 'Fútbol' }
      ]
    },
    5: {
      title: 'Copas y buen rollo',
      lead: 'Empieza el fin de semana: vermut de tarde y copas de noche.',
      items: [
        { icon: 'i-vermut', t: 'Vermut de tarde', d: 'Para salir del trabajo y desconectar.' },
        { icon: 'i-glass', t: 'Copas', d: 'Hasta la 01:00, sin prisa.' },
        { icon: 'i-billar', t: 'Billar y futbolín', d: 'El que pierde, paga la siguiente.' }
      ]
    },
    6: {
      title: 'Vermut y fútbol',
      lead: 'Vermut de mediodía en la terraza y LaLiga en pantalla.',
      items: [
        { icon: 'i-vermut', t: 'La hora del vermut', d: 'A mediodía, con su aceituna.', tag: 'Mediodía' },
        { icon: 'i-tv', t: 'LaLiga en pantalla', d: 'Los partidos del fin de semana.', tag: 'Fútbol' },
        { icon: 'i-glass', t: 'Copas', d: 'Para alargar la noche.' }
      ]
    },
    0: {
      title: 'Vermut de domingo',
      lead: 'El vermut del domingo de toda la vida, y fútbol por la tarde.',
      items: [
        { icon: 'i-vermut', t: 'La hora del vermut', d: 'A mediodía, en la terraza.', tag: 'Mediodía' },
        { icon: 'i-tv', t: 'Fútbol', d: 'Los partidos del domingo.', tag: 'Fútbol' },
        { icon: 'i-billar', t: 'Billar y futbolín', d: 'Para cerrar bien la semana.' }
      ]
    }
  };

  /* ——— Hora de Lloret, sea cual sea la zona del visitante ——— */
  function madridNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
    const h = +get('hour') % 24;
    const min = +get('minute');
    return { day, mins: h * 60 + min, y: +get('year'), m: +get('month'), d: +get('day'), hh: get('hour').padStart(2, '0'), mm: get('minute') };
  }

  function getStatus(now) {
    const { day, mins } = now;
    const prev = (day + 6) % 7;
    let left = null;
    if (mins < CLOSE_AT && OPEN_DAYS.includes(prev)) left = CLOSE_AT - mins;
    else if (mins >= OPEN_AT && OPEN_DAYS.includes(day)) left = 24 * 60 + CLOSE_AT - mins;
    if (left !== null) return { open: true, soon: left <= 45 };

    if (mins < OPEN_AT && OPEN_DAYS.includes(day)) return { open: false, next: 'hoy a las 10:00' };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (OPEN_DAYS.includes(d)) return { open: false, next: (i === 1 ? 'mañana' : `el ${DAY_NAMES[d]}`) + ' a las 10:00' };
    }
  }

  function renderStatus(now) {
    const st = getStatus(now);
    const text = st.open
      ? (st.soon ? 'Cerramos pronto · a la 01:00' : 'Abierto ahora · hasta la 01:00')
      : `Cerrado · abrimos ${st.next}`;
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-closed', !st.open);
      el.classList.toggle('is-soon', !!st.soon);
      $('.status__text', el).textContent = text;
    });
  }

  const icon = id => `<svg class="ico" aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ——— Ticket "Hoy" ——— */
  function renderToday(now) {
    const a = AGENDA[now.day];
    $('#todayDate').textContent = `${DAY_NAMES[now.day]} ${now.d} de ${MONTHS[now.m - 1]}`;
    const body = $('#todayBody');
    if (a.closed) {
      body.innerHTML = `
        <h2 class="ticket__title">Hoy descansamos</h2>
        <p class="ticket__lead">${a.lead}</p>
        <ul class="ticket__list"><li>${icon('i-clock')}<span><strong>Martes a domingo</strong> de 10:00 a 01:00</span></li></ul>`;
      return;
    }
    body.innerHTML = `
      ${a.promo ? `<span class="stamp">${a.promo}</span>` : ''}
      <h2 class="ticket__title">${a.title}</h2>
      <p class="ticket__lead">${a.lead}</p>
      <ul class="ticket__list">${a.items.map(i => `<li>${icon(i.icon)}<span><strong>${i.t}.</strong> ${i.d}</span></li>`).join('')}</ul>`;
  }

  /* ——— Semana interactiva ——— */
  const keys = $$('.daykey');
  const panel = $('#weekPanel');
  let today = 0;

  function renderDay(day, focus) {
    keys.forEach(k => {
      const sel = +k.dataset.day === day;
      k.setAttribute('aria-selected', sel);
      k.tabIndex = sel ? 0 : -1;
      if (sel && focus) k.focus();
    });
    const a = AGENDA[day];
    const kicker = (day === today ? 'Hoy · ' : '') + cap(DAY_NAMES[day]);
    const list = a.closed
      ? `<div class="wp__closed"><div><strong>Persiana bajada</strong>Nos vemos el martes con el vermut a punto.</div></div>`
      : `<ul class="wp__list">${a.items.map(i => `
          <li><span class="wp__ico">${icon(i.icon)}</span>
            <div><strong>${i.t}${i.tag ? `<span class="tag${i.tag === 'Promo' ? ' tag--red' : ''}">${i.tag}</span>` : ''}</strong><p>${i.d}</p></div>
          </li>`).join('')}</ul>`;
    panel.innerHTML = `
      <div class="wp__head">
        ${a.promo ? `<span class="stamp">${a.promo}</span>` : ''}
        <p class="wp__kicker">${kicker}</p>
        <h3 class="wp__title">${a.title}</h3>
        <p class="wp__hours">${icon('i-clock')}${a.closed ? 'Cerrado' : '10:00 – 01:00'}</p>
        <p class="wp__lead">${a.lead}</p>
      </div>
      ${list}`;
    panel.classList.remove('swap');
    void panel.offsetWidth;
    panel.classList.add('swap');
  }

  keys.forEach((k, idx) => {
    const day = +k.dataset.day;
    if (AGENDA[day].closed) k.classList.add('is-closed');
    k.addEventListener('click', () => renderDay(day));
    k.addEventListener('keydown', e => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = keys[(idx + dir + keys.length) % keys.length];
      renderDay(+next.dataset.day, true);
    });
  });

  /* ——— Horario ——— */
  function renderHours(now) {
    $$('#hours tr').forEach(tr => {
      const d = +tr.dataset.day;
      tr.classList.toggle('is-today', d === now.day);
      tr.classList.toggle('is-closed', !OPEN_DAYS.includes(d));
    });
  }

  /* ——— ¿Cuándo es el próximo miércoles? ——— */
  function renderCanitas(now) {
    const el = $('#canitasWhen');
    const span = $('span', el);
    const wait = (3 - now.day + 7) % 7;
    if (wait === 0) {
      el.classList.add('is-today');
      span.textContent = '¡Hoy es miércoles! Hoy toca.';
      return;
    }
    el.classList.remove('is-today');
    const next = new Date(now.y, now.m - 1, now.d + wait);
    span.textContent = `Próximo miércoles: ${next.getDate()} de ${MONTHS[next.getMonth()]} · ${wait === 1 ? 'es mañana' : `faltan ${wait} días`}`;
  }

  function tick() {
    const now = madridNow();
    today = now.day;
    renderStatus(now);
    renderHours(now);
    renderCanitas(now);
    $('#boardClock').textContent = `${now.hh}:${now.mm}`;
    return now;
  }

  const now = tick();
  renderToday(now);
  renderDay(now.day);
  keys.forEach(k => k.classList.toggle('is-today', +k.dataset.day === now.day));
  setInterval(tick, 30000);

  /* ——— Tirar la caña ——— */
  (() => {
    const btn = $('#pourBtn'), reset = $('#pourReset'), msg = $('#pourMsg');
    const beer = $('#beer'), beerClip = $('#beerClip'), foam = $('#foam'), caps = $('#foamCaps');
    const stream = $('#stream'), handle = $('#tapHandle'), drips = $('#drips');
    const TOP = 112, BOTTOM = 326, H = BOTTOM - TOP, SPOUT = 64;
    const RATE = 0.36; // vaso por segundo
    let v = 0, pouring = false, done = false, last = 0, raf = 0;

    function draw() {
      const total = Math.min(v, 1);
      const foamF = Math.min(0.15, v * 0.17);
      const beerTop = BOTTOM - Math.max(0, total - foamF) * H;
      const foamTop = BOTTOM - total * H;
      beer.setAttribute('y', beerTop);
      beerClip.setAttribute('y', beerTop + 4);
      foam.setAttribute('y', foamTop);
      foam.setAttribute('height', Math.max(0, beerTop - foamTop + 2));
      caps.setAttribute('transform', `translate(0 ${foamTop + 2})`);
      caps.setAttribute('opacity', v > 0.02 ? 1 : 0);
      stream.setAttribute('height', pouring ? Math.max(0, foamTop - SPOUT) : 0);
      const over = Math.max(0, v - 1);
      drips.style.opacity = Math.min(1, over * 10);
      drips.style.transform = `scaleY(${Math.min(1, over * 7)})`;
    }

    function loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      v += dt * RATE;
      draw();
      if (v >= 1.15) return stop();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (pouring || done) return;
      pouring = true;
      btn.classList.add('is-pressed');
      handle.classList.add('is-open');
      msg.removeAttribute('data-result');
      msg.textContent = 'Tirando…';
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      if (!pouring) return;
      pouring = false;
      cancelAnimationFrame(raf);
      btn.classList.remove('is-pressed');
      handle.classList.remove('is-open');
      draw();
      judge();
    }

    function judge() {
      let text, result = '';
      if (v < 0.6) text = 'Eso es un culín. Mantén pulsado un poco más.';
      else if (v < 0.86) text = 'Casi… a esta caña le falta un dedo. Dale otro toque.';
      else if (v <= 1.0) { text = '¡Caña perfecta! Los miércoles, a 1 €.'; result = 'perfect'; }
      else { text = 'Se te ha ido la espuma. Mejor que te la tire el camarero.'; result = 'over'; }
      msg.textContent = text;
      if (result) {
        msg.dataset.result = result;
        done = true;
        btn.hidden = true;
        reset.hidden = false;
      }
    }

    btn.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      start();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('keydown', e => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); }
    });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
    btn.addEventListener('blur', stop);

    reset.addEventListener('click', () => {
      v = 0; done = false;
      draw();
      reset.hidden = true;
      btn.hidden = false;
      msg.removeAttribute('data-result');
      msg.textContent = 'Suelta cuando la espuma llegue al borde.';
      btn.focus();
    });
    draw();
  })();

  /* ——— Marcador ——— */
  (() => {
    const btn = $('#goalBtn'), digit = $('#goalsHome'), msg = $('#boardMsg');
    const lines = [
      'Aquí los goles se cantan el doble.',
      'Con caña en la mano sabe mejor.',
      'Ni el VAR lo anula.',
      'Tu sofá no lo celebra igual.',
      'La barra entera en pie.',
      'Esto en pantalla grande se vive de otra manera.'
    ];
    let goals = 1;
    btn.addEventListener('click', () => {
      goals = goals >= 9 ? 0 : goals + 1;
      digit.classList.remove('is-flipping');
      void digit.offsetWidth;
      digit.classList.add('is-flipping');
      setTimeout(() => { digit.textContent = goals; }, 190);
      msg.textContent = goals === 0 ? 'Empieza otro partido. ¿Lo vemos juntos?' : lines[(goals - 1) % lines.length];
    });
  })();

  /* ——— Ritual del vermut ——— */
  (() => {
    const svg = $('#ritualSvg'), cap = $('#ritualCap'), next = $('#ritualNext'), reset = $('#ritualReset');
    const steps = $$('.step');
    const captions = ['Empieza por el hielo.', 'Ahora, el vermut.', 'Un toque de naranja…', '…y su aceituna.', 'Para acabar, un chorrito de sifón.', '¡Salud! Y a la terraza.'];
    let stage = 0;

    function setStage(n) {
      stage = Math.max(0, Math.min(5, n));
      for (let i = 1; i <= 5; i++) svg.classList.toggle(`s${i}`, stage >= i);
      steps.forEach((s, i) => {
        s.classList.toggle('is-done', i < stage);
        s.classList.toggle('is-current', i === stage);
        s.setAttribute('aria-pressed', i < stage);
      });
      cap.textContent = captions[stage];
      next.disabled = stage >= 5;
    }

    steps.forEach(s => s.addEventListener('click', () => {
      const n = +s.dataset.step;
      setStage(n === stage ? n - 1 : n);
    }));
    next.addEventListener('click', () => setStage(stage + 1));
    reset.addEventListener('click', () => setStage(0));
    setStage(0);
  })();

  /* ——— WhatsApp ——— */
  const openWhatsApp = text => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

  function flagInvalid(input) {
    input.classList.remove('is-invalid');
    void input.offsetWidth;
    input.classList.add('is-invalid');
    input.focus();
    input.addEventListener('input', () => input.classList.remove('is-invalid'), { once: true });
  }

  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    const team = $('#askTeam');
    if (!team.value.trim()) return flagInvalid(team);
    openWhatsApp(`¡Hola, Esquina Habanera! ¿Vais a poner el partido «${team.value.trim()}» (${$('#askWhen').value})? ⚽`);
  });

  (() => {
    const form = $('#grupo'), name = $('#bName'), date = $('#bDate'), time = $('#bTime'), note = $('#bNote');
    const people = $('#bPeople'), warn = $('#bWarn');
    let count = 4;

    const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    date.min = iso(now.y, now.m, now.d);
    date.value = iso(now.y, now.m, now.d);

    $$('.stepper__btn', form).forEach(b => b.addEventListener('click', () => {
      count = Math.max(1, Math.min(40, count + +b.dataset.delta));
      people.textContent = count;
    }));

    function chosenDay() {
      if (!date.value) return null;
      const [y, m, d] = date.value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    function checkDay() {
      const d = chosenDay();
      const closed = d && !OPEN_DAYS.includes(d.getDay());
      warn.hidden = !closed;
      if (closed) warn.textContent = 'Los lunes cerramos. Elige otro día, de martes a domingo.';
      return !closed;
    }
    date.addEventListener('change', checkDay);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!name.value.trim()) return flagInvalid(name);
      if (!date.value) return flagInvalid(date);
      if (!checkDay()) return flagInvalid(date);
      const d = chosenDay();
      const reason = $('input[name="reason"]:checked', form).value;
      const lines = [
        '¡Hola, Esquina Habanera! Queremos ir en grupo:',
        `· Nombre: ${name.value.trim()}`,
        `· Personas: ${count}`,
        `· Día: ${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`,
        `· Hora: ${time.value || 'por confirmar'}`,
        `· Motivo: ${reason}`
      ];
      if (note.value.trim()) lines.push(`· Comentario: ${note.value.trim()}`);
      openWhatsApp(lines.join('\n'));
    });
  })();

  /* ——— Cabecera y menú ——— */
  const topbar = $('#topbar'), nav = $('#nav'), menuBtn = $('#menuBtn');
  const onScroll = () => topbar.classList.toggle('is-solid', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    topbar.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    $('use', menuBtn).setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Enlace activo según la sección visible
  const links = $$('.nav a[href^="#"]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ——— Aparición al hacer scroll ——— */
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      reveal.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach(el => reveal.observe(el));

  $('#year').textContent = now.y;
})();
