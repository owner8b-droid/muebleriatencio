/* ==========================================================
   Mueblería Tencio — interacción
   ========================================================== */

/* CONFIGURACIÓN — cambiá el número cuando esté confirmado.
   Formato internacional sin "+" ni espacios: 506XXXXXXXX */
const CONFIG = {
  whatsapp: '50600000000',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const waNumber = CONFIG.whatsapp.replace(/\D/g, '');
const waUrl = (text) => `https://wa.me/${waNumber}${text ? '?text=' + encodeURIComponent(text) : ''}`;

/* ---------- Links de WhatsApp ---------- */
document.querySelectorAll('[data-wa]').forEach((a) => {
  a.href = waUrl('Hola, quiero información sobre un proyecto con Mueblería Tencio.');
  a.target = '_blank';
  a.rel = 'noopener';
});

/* ---------- Año del footer ---------- */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------- 1. Navbar: transparente → blanca al hacer scroll ---------- */
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Menú móvil ---------- */
const burger = document.querySelector('.burger');
const mobileMenu = document.getElementById('mobile-menu');
const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
mobileMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); burger.focus(); } });
window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

/* ---------- Videos placeholder ----------
   Si el archivo de video todavía no existe, el <video> se queda
   mostrando su poster y se marca con .is-missing para no intentar reproducirlo. */
document.querySelectorAll('video').forEach((video) => {
  const sources = video.querySelectorAll('source');
  const last = sources[sources.length - 1];
  const markMissing = () => {
    video.classList.add('is-missing');
    video.dispatchEvent(new CustomEvent('videomissing'));
  };
  if (last) last.addEventListener('error', markMissing);
  video.addEventListener('error', markMissing);
});
const tryPlay = (video) => {
  if (!video || video.classList.contains('is-missing') || reduceMotion) return;
  const p = video.play();
  if (p && p.catch) p.catch(() => {});
};

/* ---------- 2 y 4. Slideshows con crossfade ---------- */
class Slideshow {
  constructor(root) {
    this.root = root;
    this.slides = [...root.querySelectorAll('.slide')];
    this.hold = Number(root.dataset.hold) || 2000;
    this.fade = Number(root.dataset.fade) || 1000;
    this.index = Math.max(0, this.slides.findIndex((s) => s.classList.contains('is-active')));
    this.timer = null;
    this.visible = true;

    this.buildDots();
    root.querySelector('.slideshow__arrow--prev')?.addEventListener('click', () => this.go(this.index - 1, true));
    root.querySelector('.slideshow__arrow--next')?.addEventListener('click', () => this.go(this.index + 1, true));

    // Pausar cuando el slideshow no está en pantalla o la pestaña está oculta
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.visible ? this.resume() : this.pause();
    }, { threshold: 0.15 }).observe(root);
    document.addEventListener('visibilitychange', () => (document.hidden ? this.pause() : this.resume()));

    this.go(this.index, false);
  }
  buildDots() {
    const wrap = this.root.querySelector('.slideshow__dots');
    if (!wrap) return;
    this.dots = this.slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slideshow__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
      b.addEventListener('click', () => this.go(i, true));
      wrap.appendChild(b);
      return b;
    });
  }
  go(i, user) {
    const n = this.slides.length;
    this.index = (i + n) % n;
    this.slides.forEach((s, k) => {
      const active = k === this.index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.querySelectorAll('a, button').forEach((el) => { el.tabIndex = active ? 0 : -1; });
      const v = s.querySelector('video');
      if (v) { active && this.visible ? tryPlay(v) : v.pause(); }
    });
    this.dots?.forEach((d, k) => d.setAttribute('aria-selected', String(k === this.index)));
    this.schedule();
  }
  holdFor(slide) {
    return Number(slide.dataset.hold) || this.hold;
  }
  schedule() {
    clearTimeout(this.timer);
    if (reduceMotion || !this.visible || document.hidden) return;
    const wait = this.holdFor(this.slides[this.index]) + this.fade;
    this.timer = setTimeout(() => this.go(this.index + 1, false), wait);
  }
  pause() {
    clearTimeout(this.timer);
    this.slides.forEach((s) => s.querySelector('video')?.pause());
  }
  resume() {
    if (!this.visible || document.hidden) return;
    tryPlay(this.slides[this.index].querySelector('video'));
    this.schedule();
  }
}
document.querySelectorAll('[data-slideshow]').forEach((el) => new Slideshow(el));

/* ---------- 5. Tarjetas de proyecto: altura visible del título ---------- */
const measureProjectCards = () => {
  document.querySelectorAll('.project-card').forEach((card) => {
    const body = card.querySelector('.project-card__body');
    const title = card.querySelector('.project-card__title');
    const cs = getComputedStyle(body);
    const h = title.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    card.style.setProperty('--title-h', `${h}px`);
  });
};
measureProjectCards();
window.addEventListener('resize', measureProjectCards);
document.fonts?.ready.then(measureProjectCards);

/* ---------- 6. Carrusel: una tarjeta por clic, 600ms ---------- */
// cubic-bezier(.32, 0, .32, 1.01)
const bezier = (p1x, p1y, p2x, p2y) => {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
};
const carouselEase = bezier(0.32, 0, 0.32, 1.01);

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel__track');
  const [prev, next] = carousel.querySelectorAll('.carousel__arrow');
  let anim = null;

  const step = () => {
    const card = track.querySelector('.carousel__card');
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20);
  };
  const update = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const animateTo = (target) => {
    cancelAnimationFrame(anim);
    const start = track.scrollLeft;
    const max = track.scrollWidth - track.clientWidth;
    const end = Math.max(0, Math.min(max, target));
    if (reduceMotion) { track.scrollLeft = end; return; }
    const t0 = performance.now();
    track.style.scrollSnapType = 'none';
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 600);
      track.scrollLeft = start + (end - start) * carouselEase(p);
      if (p < 1) anim = requestAnimationFrame(tick);
      else track.style.scrollSnapType = '';
    };
    anim = requestAnimationFrame(tick);
  };
  carousel.querySelectorAll('.carousel__arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = step();
      const current = Math.round(track.scrollLeft / s);
      animateTo((current + Number(btn.dataset.dir)) * s);
    });
  });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
  });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
});

/* ---------- 7. Tarjetas de servicio: foto → video al hover ---------- */
document.querySelectorAll('[data-hover-video]').forEach((card) => {
  const video = card.querySelector('video');
  const on = () => { card.classList.add('is-hover'); tryPlay(video); };
  const off = () => {
    card.classList.remove('is-hover');
    if (video && !video.classList.contains('is-missing')) { video.pause(); }
  };
  card.addEventListener('mouseenter', on);
  card.addEventListener('mouseleave', off);
  card.addEventListener('focusin', on);
  card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) off(); });
});

/* ---------- 8. Bloque de video ---------- */
document.querySelectorAll('.video-block').forEach((block) => {
  const video = block.querySelector('video');
  const play = block.querySelector('.video-block__play');
  const hideIfMissing = () => block.classList.add('no-video');
  video.addEventListener('videomissing', hideIfMissing);
  if (video.classList.contains('is-missing')) hideIfMissing();
  play.addEventListener('click', () => {
    video.controls = true;
    video.muted = false;
    const p = video.play();
    if (p && p.catch) p.catch(hideIfMissing);
    block.classList.add('is-playing');
  });
  video.addEventListener('ended', () => { block.classList.remove('is-playing'); video.controls = false; });
});
// Con preload="none" el navegador no pide el archivo hasta reproducir;
// hacemos una verificación liviana para ocultar el botón si no existe.
document.querySelectorAll('.video-block source').forEach((src) => {
  if (location.protocol === 'file:') return; // fetch no funciona en file://
  fetch(src.getAttribute('src'), { method: 'HEAD' })
    .then((r) => { if (!r.ok) src.closest('.video-block').classList.add('no-video'); })
    .catch(() => {});
});

/* ---------- 10. Formulario → WhatsApp ---------- */
const form = document.getElementById('quote-form');
const tipoSelect = document.getElementById('f-tipo');

// Los botones "Cotizar" preseleccionan el tipo de proyecto
document.querySelectorAll('[data-tipo]').forEach((a) => {
  a.addEventListener('click', () => { tipoSelect.value = a.dataset.tipo; });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const error = form.querySelector('.quote-form__error');
  const required = [...form.querySelectorAll('[required]')];
  const empty = required.filter((f) => !f.value.trim());
  required.forEach((f) => f.setAttribute('aria-invalid', String(empty.includes(f))));
  if (empty.length) {
    error.textContent = 'Completá tu nombre y un número de WhatsApp o teléfono para poder responderte.';
    error.hidden = false;
    empty[0].focus();
    return;
  }
  error.hidden = true;
  const d = Object.fromEntries(new FormData(form));
  const text = [
    'Hola, quiero una cotización con Mueblería Tencio.',
    `Nombre: ${d.nombre}`,
    `Teléfono: ${d.telefono}`,
    `Tipo de proyecto: ${d.tipo}`,
    d.mensaje ? `Detalles: ${d.mensaje}` : '',
  ].filter(Boolean).join('\n');
  window.open(waUrl(text), '_blank', 'noopener');
});
