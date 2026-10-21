(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const TZ = 'Europe/Madrid';
  const WHATSAPP = '34619715885';
  const ADDRESS = 'Carrer de les Antilles, 15, 17310 Lloret de Mar';
  const MAPS = 'https://www.google.com/maps/dir/?api=1&destination=41.6966587,2.8316895';
  const OPEN_DAYS = [0, 2, 3, 4, 5, 6]; // 0 = domingo; los lunes cerrado
  const OPEN_AT = 10 * 60;               // 10:00
  const CLOSE_AT = 60;                   // 01:00 del día siguiente
  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ——— Lo de cada día de la semana (editar aquí) ——— */
  const AGENDA = {
    1: { closed: true, title: 'Descansamos',
      lead: 'Normalmente los lunes bajamos la persiana. En fechas especiales abrimos: lo avisamos en Instagram.', items: [] },
    2: { title: 'Vermut y tapas',
      lead: 'Arrancamos la semana a las 10:00 con vermut, tapas y terraza.',
      items: [
        { icon: 'i-vermut', t: 'Vermut y tapas', d: 'Desde las 10:00, dentro o en la terraza.' },
        { icon: 'i-billar', t: 'Billar y futbolín', d: 'Para la sobremesa o la noche.' }
      ] },
    3: { title: 'Miércoles de cañitas', promo: '1 €',
      lead: 'Durante todo el invierno, cada miércoles, la caña a 1 €.',
      items: [
        { icon: 'i-beer', t: 'Cañitas a 1 €', d: 'Todo el día, durante todo el invierno.', promo: true },
        { icon: 'i-vermut', t: 'Vermut y tapas', d: 'Desde las 10:00, como siempre.' }
      ] },
    4: { title: 'Vermut y tapas',
      lead: 'Media semana hecha: pasa a por un vermut o a echar una partida.',
      items: [
        { icon: 'i-vermut', t: 'Vermut y tapas', d: 'Desde las 10:00, dentro o en la terraza.' },
        { icon: 'i-billar', t: 'Billar y futbolín', d: 'Retos, piques y revanchas.' }
      ] },
    5: { title: 'Viernes de vinitos',
      lead: 'Es viernes y el cuerpo lo sabe. ¿Unos vinitos en la Esquina?',
      items: [
        { icon: 'i-wine', t: 'Vinos y vermut', d: 'Para empezar bien el fin de semana.' },
        { icon: 'i-vermut', t: 'Cócteles y copas', d: 'Hasta la 01:00, sin prisa.' }
      ] },
    6: { title: 'Vermut de mediodía',
      lead: 'Vermut en la terraza a mediodía y fútbol en directo.',
      items: [
        { icon: 'i-vermut', t: 'La hora del vermut', d: 'A mediodía, con algo para picar.' },
        { icon: 'i-tv', t: 'Fútbol en directo', d: 'Retransmitimos todos los partidos.' }
      ] },
    0: { title: 'Vermut de domingo',
      lead: 'El vermut del domingo de toda la vida, y fútbol por la tarde.',
      items: [
        { icon: 'i-vermut', t: 'La hora del vermut', d: 'A mediodía, en la terraza.' },
        { icon: 'i-tv', t: 'Fútbol en directo', d: 'Retransmitimos todos los partidos.' }
      ] }
  };

  /* ——— Próximos partidos (hora de España). Los que ya han acabado se ocultan solos. ——— */
  const PARTIDOS = [
    { fecha: '2026-10-21', hora: '21:00', comp: 'Champions League', local: 'Real Madrid', visitante: 'RB Leipzig' },
    { fecha: '2026-10-25', hora: '21:00', comp: 'LaLiga · El Clásico', local: 'FC Barcelona', visitante: 'Real Madrid', grande: true }
  ];

  /* La campaña de cañitas dura todo el invierno */
  const CANITAS_HASTA = '20270331';

  /* ——— Hora de Lloret, esté donde esté quien mira ——— */
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  function partsAt(ms) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    return {
      day: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday],
      y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute
    };
  }
  function madridNow() {
    const p = partsAt(Date.now());
    return { ...p, mins: p.h * 60 + p.min };
  }
  // Hora de Madrid → instante real
  function madridToDate(iso, hhmm) {
    const [y, m, d] = iso.split('-').map(Number);
    const [h, mi] = hhmm.split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, h, mi);
    const offset = ms => { const p = partsAt(ms); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - ms; };
    let t = guess - offset(guess);
    t = guess - offset(t);
    return new Date(t);
  }
  const pad = n => String(n).padStart(2, '0');
  const isoOf = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const dateOf = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const longDate = dt => `${DAY_NAMES[dt.getDay()]} ${dt.getDate()} de ${MONTHS[dt.getMonth()]}`;

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

  function renderHours(now) {
    $$('#hours tr').forEach(tr => {
      const d = +tr.dataset.day;
      tr.classList.toggle('is-today', d === now.day);
      tr.classList.toggle('is-closed', !OPEN_DAYS.includes(d));
    });
  }

  const icon = id => `<svg class="ico" aria-hidden="true"><use href="#${id}"/></svg>`;
  const upcoming = () => PARTIDOS
    .map(p => ({ ...p, start: madridToDate(p.fecha, p.hora) }))
    .filter(p => p.start.getTime() + 2 * 3600e3 > Date.now())
    .sort((a, b) => a.start - b.start);

  /* ——— Recordatorios de calendario ——— */
  const icsText = s => s.replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const utcStamp = dt => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  function calEvent(kind, match) {
    if (kind === 'canitas') {
      const now = madridNow();
      const today = new Date(now.y, now.m - 1, now.d);
      const first = new Date(now.y, now.m - 1, now.d + ((3 - today.getDay() + 7) % 7));
      const next = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 1);
      return {
        slug: 'canitas', title: 'Cañitas a 1 € · Esquina Habanera',
        details: 'Todos los miércoles, durante todo el invierno, la caña a 1 €.',
        allDay: true, start: isoOf(first).replace(/-/g, ''), end: isoOf(next).replace(/-/g, ''),
        rrule: `FREQ=WEEKLY;BYDAY=WE;UNTIL=${CANITAS_HASTA}`
      };
    }
    const end = new Date(match.start.getTime() + 2 * 3600e3);
    return {
      slug: 'partido', title: `${match.local} – ${match.visitante} en la Esquina`,
      details: `${match.comp}. Lo vemos en directo en Esquina Habanera.`,
      start: utcStamp(match.start), end: utcStamp(end), alarm: true
    };
  }

  function googleUrl(ev) {
    const q = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${ev.start}/${ev.end}`, details: ev.details, location: `Esquina Habanera, ${ADDRESS}`, ctz: TZ });
    if (ev.rrule) q.set('recur', `RRULE:${ev.rrule}`);
    return `https://calendar.google.com/calendar/render?${q}`;
  }

  function downloadIcs(ev) {
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Esquina Habanera//Web//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ev.slug}-${ev.start}@esquinahabanera`,
      `DTSTAMP:${utcStamp(new Date())}`,
      ev.allDay ? `DTSTART;VALUE=DATE:${ev.start}` : `DTSTART:${ev.start}`,
      ev.allDay ? `DTEND;VALUE=DATE:${ev.end}` : `DTEND:${ev.end}`,
      ...(ev.rrule ? [`RRULE:${ev.rrule}`] : []),
      `SUMMARY:${icsText(ev.title)}`,
      `DESCRIPTION:${icsText(ev.details)}`,
      `LOCATION:${icsText(`Esquina Habanera, ${ADDRESS}`)}`,
      ...(ev.alarm ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(ev.title)}`, 'TRIGGER:-PT1H', 'END:VALARM'] : []),
      'END:VEVENT', 'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `esquina-habanera-${ev.slug}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // Botón "Recordármelo" con su menú (Google Calendar o archivo para Apple/Outlook)
  function mountCal(box, ev) {
    box.innerHTML = `
      <button class="btn btn--ghost btn--sm cal__btn" type="button" aria-expanded="false">${icon('i-bell')}Recordármelo</button>
      <div class="cal__menu" role="menu" hidden>
        <a role="menuitem" href="${googleUrl(ev)}" target="_blank" rel="noopener">${icon('i-cal')}Google Calendar</a>
        <button role="menuitem" type="button" data-ics>${icon('i-cal')}iPhone, Outlook (.ics)</button>
      </div>`;
    const btn = $('.cal__btn', box), menu = $('.cal__menu', box);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.hidden;
      closeCals();
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open);
    });
    $('[data-ics]', box).addEventListener('click', () => { downloadIcs(ev); closeCals(); });
    $('a', menu).addEventListener('click', closeCals);
  }
  function closeCals() {
    $$('.cal__menu').forEach(m => { m.hidden = true; });
    $$('.cal__btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  document.addEventListener('click', e => { if (!e.target.closest('.cal')) closeCals(); });

  /* ——— WhatsApp ——— */
  const openWhatsApp = (text, to = WHATSAPP) => window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  function flagInvalid(input) {
    input.classList.remove('is-invalid');
    void input.offsetWidth;
    input.classList.add('is-invalid');
    input.focus();
    input.addEventListener('input', () => input.classList.remove('is-invalid'), { once: true });
  }

  /* ——— Hoy ——— */
  function renderToday(now) {
    const today = new Date(now.y, now.m - 1, now.d);
    const a = AGENDA[now.day];
    $('#todayDate').textContent = longDate(today);
    $('#todayTitle').innerHTML = a.closed ? 'Hoy descansamos' : `${a.title}${a.promo ? ` <span class="promo-tag">${a.promo}</span>` : ''}`;
    $('#todayLead').textContent = a.lead;

    const box = $('#todayMatch');
    const next = upcoming()[0];
    if (!next) {
      box.innerHTML = `
        <h2 class="today__title">Todos los partidos</h2>
        <p class="today__lead">Retransmitimos todos los partidos en directo. ¿Buscas uno en concreto? Pregúntanos.</p>
        <a class="btn btn--brown btn--sm" href="#futbol">${icon('i-tv')}Fútbol</a>`;
      return;
    }
    const isToday = next.fecha === isoOf(today);
    const when = isToday ? `Hoy a las ${next.hora}` : `${cap(longDate(dateOf(next.fecha)))} · ${next.hora}`;
    box.innerHTML = `
      <h2 class="today__title">${next.local} – ${next.visitante}</h2>
      <p class="today__lead">${when} · ${next.comp}</p>
      <a class="btn btn--brown btn--sm" href="#futbol">${icon('i-tv')}${isToday ? 'Reservar sitio' : 'Ver partidos'}</a>`;
  }

  /* ——— Los próximos 7 días ——— */
  const tabs = $('#dayTabs');
  const panel = $('#dayPanel');
  let days = [];

  function itemsFor(dt) {
    const iso = isoOf(dt);
    const a = AGENDA[dt.getDay()];
    const matches = upcoming().filter(p => p.fecha === iso).map(p => ({
      icon: 'i-tv', t: `${p.local} – ${p.visitante}`, d: `${p.comp} · ${p.hora} · En pantalla`, match: true
    }));
    return [...matches, ...a.items];
  }

  function renderDay(i, focus) {
    const dt = days[i];
    const a = AGENDA[dt.getDay()];
    $$('.day', tabs).forEach((b, j) => {
      b.setAttribute('aria-selected', j === i);
      b.tabIndex = j === i ? 0 : -1;
      if (j === i && focus) b.focus();
    });
    const items = itemsFor(dt);
    const kicker = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : cap(DAY_NAMES[dt.getDay()]);
    panel.innerHTML = `
      <div class="dp__head">
        <p class="label">${kicker}</p>
        <p class="dp__date">${cap(DAY_NAMES[dt.getDay()])} ${dt.getDate()}</p>
        <h3 class="dp__title">${a.title}${a.promo ? ` <span class="promo-tag">${a.promo}</span>` : ''}</h3>
        <p class="dp__hours">${icon('i-clock')}${a.closed ? 'Cerrado' : '10:00 – 01:00'}</p>
        <p class="dp__lead">${a.lead}</p>
      </div>
      ${a.closed && !items.length
        ? `<div class="dp__closed">Volvemos el martes a las 10:00.<br>Mientras, puedes <a href="#reservar">dejar tu reserva</a>.</div>`
        : `<ul class="dp__list">${items.map(it => `
            <li class="${it.match ? 'is-match' : it.promo ? 'is-promo' : ''}">
              <span class="dp__ico">${icon(it.icon)}</span>
              <div><strong>${it.t}</strong><p>${it.d}</p></div>
            </li>`).join('')}</ul>`}`;
    panel.classList.remove('swap');
    void panel.offsetWidth;
    panel.classList.add('swap');
  }

  function renderDays(now) {
    days = Array.from({ length: 7 }, (_, i) => new Date(now.y, now.m - 1, now.d + i));
    tabs.innerHTML = days.map((dt, i) => {
      const wd = dt.getDay();
      const cls = ['day',
        AGENDA[wd].closed ? 'is-closed' : '',
        AGENDA[wd].promo ? 'has-promo' : '',
        upcoming().some(p => p.fecha === isoOf(dt)) ? 'has-match' : ''].join(' ');
      return `<button class="${cls}" role="tab" aria-controls="dayPanel" aria-label="${longDate(dt)}">
        <span class="day__wd">${i === 0 ? 'Hoy' : DAY_SHORT[wd]}</span>
        <span class="day__n">${dt.getDate()}</span>
        <span class="day__dot"></span>
      </button>`;
    }).join('');
    $$('.day', tabs).forEach((b, i) => {
      b.addEventListener('click', () => renderDay(i));
      b.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        renderDay((i + dir + 7) % 7, true);
      });
    });
    renderDay(0);
  }

  /* ——— Partidos ——— */
  function renderMatches(now) {
    const list = $('#matches');
    const todayIso = `${now.y}-${pad(now.m)}-${pad(now.d)}`;
    const items = upcoming();
    if (!items.length) {
      list.innerHTML = `<li class="card matches__empty">Pronto anunciamos los próximos. Recuerda: retransmitimos todos los partidos en directo.</li>`;
      return;
    }
    list.innerHTML = items.map((p, i) => {
      const dt = dateOf(p.fecha);
      const live = Date.now() >= p.start.getTime();
      const when = p.fecha === todayIso ? `<span class="now">${live ? 'Jugándose ahora' : 'Hoy'}</span> · ${p.hora} h` : `${cap(DAY_NAMES[dt.getDay()])} · ${p.hora} h`;
      return `<li class="match card${p.grande ? ' match--big' : ''}">
        <div class="match__date"><span>${DAY_SHORT[dt.getDay()]}</span><b>${dt.getDate()}</b><span>${MONTHS_SHORT[dt.getMonth()]}</span></div>
        <div>
          <p class="match__comp">${p.comp}</p>
          <p class="match__teams">${p.local} – ${p.visitante}</p>
          <p class="match__time">${when}</p>
          <div class="match__actions">
            <button class="btn btn--cream btn--sm" type="button" data-reserve="${i}">${icon('i-wa')}Reservar sitio</button>
            <div class="cal" data-match="${i}"></div>
          </div>
        </div>
      </li>`;
    }).join('');
    $$('[data-reserve]', list).forEach(b => b.addEventListener('click', () => {
      const p = items[+b.dataset.reserve];
      openWhatsApp(`¡Hola, Esquina Habanera! Queremos venir a ver el ${p.local} – ${p.visitante} (${longDate(dateOf(p.fecha))}, ${p.hora}). ¿Nos guardáis sitio para ___ personas?`);
    }));
    $$('.cal[data-match]', list).forEach(box => mountCal(box, calEvent('match', items[+box.dataset.match])));
  }

  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    const team = $('#askTeam');
    if (!team.value.trim()) return flagInvalid(team);
    openWhatsApp(`¡Hola, Esquina Habanera! ¿Vais a poner el partido «${team.value.trim()}»? ⚽`);
  });

  /* ——— Reservar o invitar ——— */
  function mountBooking(now) {
    const form = $('#booking'), name = $('#bName'), date = $('#bDate'), time = $('#bTime'), note = $('#bNote');
    const people = $('#bPeople'), warn = $('#bWarn');
    let count = 4;
    date.min = `${now.y}-${pad(now.m)}-${pad(now.d)}`;
    // Por defecto: hoy si abrimos, si no el próximo día abierto
    let first = new Date(now.y, now.m - 1, now.d);
    while (!OPEN_DAYS.includes(first.getDay())) first = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 1);
    date.value = isoOf(first);

    $$('.stepper__btn', form).forEach(b => b.addEventListener('click', () => {
      count = Math.max(1, Math.min(40, count + +b.dataset.delta));
      people.textContent = count;
    }));

    const chosen = () => date.value ? dateOf(date.value) : null;
    function checkDay() {
      const d = chosen();
      const closed = d && !OPEN_DAYS.includes(d.getDay());
      warn.hidden = !closed;
      if (closed) warn.textContent = 'Los lunes normalmente cerramos. Elige otro día, de martes a domingo.';
      return !closed;
    }
    date.addEventListener('change', checkDay);
    const plan = () => $('input[name="plan"]:checked', form).value;

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!name.value.trim()) return flagInvalid(name);
      if (!date.value || !checkDay()) return flagInvalid(date);
      const lines = [
        '¡Hola, Esquina Habanera! Me gustaría reservar:',
        `· Nombre: ${name.value.trim()}`,
        `· Personas: ${count}`,
        `· Día: ${longDate(chosen())}`,
        `· Hora: ${time.value || 'por confirmar'}`,
        `· Plan: ${plan()}`
      ];
      if (note.value.trim()) lines.push(`· Comentario: ${note.value.trim()}`);
      openWhatsApp(lines.join('\n'));
    });

    $('#bShare').addEventListener('click', async () => {
      if (!date.value || !checkDay()) return flagInvalid(date);
      const what = { Vermut: 'Vermut', Partido: 'Partido', 'Cañitas': 'Cañitas', 'Cumpleaños': 'Cumple', Copas: 'Copas' }[plan()];
      const text = `¿Te vienes? ${what} en Esquina Habanera el ${longDate(chosen())}${time.value ? ` a las ${time.value}` : ''} 🍸\n📍 ${ADDRESS}\n${MAPS}`;
      if (navigator.share) {
        try { await navigator.share({ title: 'Esquina Habanera', text }); return; }
        catch (err) { if (err.name === 'AbortError') return; }
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  }

  /* ——— Arranque ——— */
  function tick() {
    const now = madridNow();
    renderStatus(now);
    renderHours(now);
    return now;
  }
  const now = tick();
  renderToday(now);
  renderDays(now);
  renderMatches(now);
  mountCal($('.cal[data-cal="canitas"]'), calEvent('canitas'));
  mountBooking(now);
  setInterval(tick, 30000);

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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeCals(); } });

  const links = $$('.nav a');
  const reveal = 'IntersectionObserver' in window;
  if (reveal) {
    const spy = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => spy.observe(s));

    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }), { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  $('#year').textContent = now.y;
})();
