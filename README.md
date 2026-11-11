# Multas CDV

App móvil para llevar las multas del régimen interno 2026/27 del **CD Villamanta**: ranking de multados, multas en curso con cuenta atrás de 10 días, histórico de pagadas y bote total.

- **Web:** https://claudiusava.github.io/multas-cdv/
- **Datos:** hoja de Google "Multas CDV" en Drive (pestañas `Multas` y `Responsables`).
- **Backend:** Google Apps Script (`apps-script/`) publicado como aplicación web.

## Quién puede hacer qué

- Cualquiera con el enlace: consulta ranking, multas, bote y normas.
- Responsables (Clau, David, Sergio y Gabi): ponen, cobran y borran multas.
  La primera vez que se abre la app en un móvil sale **¿Quién eres?**; al elegir
  tu nombre ese móvil queda autorizado. Cada nombre solo se puede reclamar una vez,
  y cuando están los cuatro ocupados la pantalla ya no aparece a nadie.
  - Cambiar de móvil: borra tu fila en la pestaña `Responsables` y entra en `#/acceso`.
  - Lista de responsables: `RESPONSABLES` en `apps-script/Code.js`.

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200  (añade ?demo=1 para datos de prueba)
npm test
```

- Jugadores, apodos e infracciones: `src/app/core/catalogo.ts`.
- Backend: `cd apps-script && clasp push && clasp deploy -i <deploymentId>` (mantiene la misma URL).

Despliegue automático a GitHub Pages al hacer push a `main`.
