# Multas CDV

App móvil para llevar las multas del régimen interno 2026/27 del **CD Villamanta**: ranking de multados, multas en curso con cuenta atrás de 10 días, histórico de pagadas y bote total.

- **Web:** https://claudiusava.github.io/multas-cdv/
- **Datos:** hoja de Google "Multas CDV" en Drive (pestañas `Multas`, `Responsables`, `Config`).
- **Backend:** Google Apps Script (`apps-script/`) publicado como aplicación web.

## Quién puede hacer qué

- Cualquiera con el enlace: consulta ranking, multas, bote y normas.
- Responsables (máx. 4: 3 capitanes + entrenador): ponen, cobran y borran multas.
  Cada uno entra una vez en *Acceso* desde su móvil con el **código de invitación**
  (pestaña `Config` de la hoja). El móvil queda autorizado con un token propio.
  - Cambiar el código: edítalo en `Config`.
  - Quitar a un responsable o liberar su plaza: borra su fila en `Responsables`.

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200  (añade ?demo=1 para datos de prueba; código CDV-DEMO)
npm test
```

- Jugadores, apodos e infracciones: `src/app/core/catalogo.ts`.
- Backend: `cd apps-script && clasp push && clasp deploy -i <deploymentId>` (mantiene la misma URL).

Despliegue automático a GitHub Pages al hacer push a `main`.
