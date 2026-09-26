# 60 años en Búzios 🎉

Web con la propuesta de viaje a Búzios, Brasil, para festejar los 60 años de Papá (24 al 31 de julio de 2027).

Es una web simple: solo **HTML, CSS y JavaScript** (sin frameworks ni instalaciones). Todo el contenido (viajeros, días, actividades, reservas, extras) se carga en vivo desde una base de datos en **Supabase**.

## Archivos

- `index.html` — estructura de la página
- `style.css` — estilos
- `script.js` — se conecta a Supabase y arma el contenido
- `config.js` — acá están la URL y la clave pública de Supabase

## Cómo cargar tus datos reales

Los datos de ejemplo (vuelos, alojamiento, restaurantes, etc.) están en las tablas de Supabase. Para reemplazarlos:

1. Entrá a tu proyecto en [supabase.com](https://supabase.com) → **Table Editor**.
2. Editá directamente las filas de las tablas `trip_info`, `travelers`, `days`, `activities`, `reservations` y `extras`.
3. Guardá los cambios: la web los va a mostrar automáticamente la próxima vez que se cargue (no hace falta tocar código).

## Cómo publicar en Vercel

1. Subí este repositorio a GitHub (si no lo está ya).
2. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con tu cuenta de GitHub.
3. Hacé clic en **Add New → Project** y elegí este repositorio.
4. Como es un sitio estático (sin build), dejá la configuración por defecto y hacé clic en **Deploy**.
5. En un par de minutos vas a tener una URL pública (por ejemplo `mi-web.vercel.app`) para compartir con la familia.

## Notas de seguridad

La clave que usa `config.js` es la **clave pública (anon/publishable key)** de Supabase. Está pensada para ser usada en el navegador y, gracias a las políticas de seguridad (Row Level Security) que configuramos en la base, solo permite **leer** los datos, nunca modificarlos ni borrarlos. Por eso no hay problema en que quede visible en el código de la web.
