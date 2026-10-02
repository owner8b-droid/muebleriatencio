# Mueblería Tencio — sitio estático

Reestructurado sobre el sistema de componentes analizado en ebanostudio.co.
HTML/CSS/JS sin dependencias, listo para GitHub Pages.

## Estructura
- `index.html` — 11 componentes en orden: navbar, hero slideshow, banda de cita, slideshow editorial, proyectos (intro asimétrica + tarjetas), catálogo (carrusel), servicios (tarjetas foto→video), bloque de video, nosotros, contacto, footer.
- `css/styles.css` — tokens en `:root` (color, tipografía, radios, movimiento).
- `js/main.js` — `CONFIG.whatsapp` arriba del archivo: poné ahí el número real.
- `assets/fonts/` — Wix Madefor Display y Text (OFL), autoalojadas.
- `assets/video/` — ver `LEEME.txt` para nombres y formato de los videos.

## Pendientes
- Número de WhatsApp (`js/main.js`), dirección, correo y horarios (`#contacto`).
- Iframe de Google Maps en `.map-slot`.
- Videos `hero.mp4` y `slideshow.mp4` (y opcionales).
