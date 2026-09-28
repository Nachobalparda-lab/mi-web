// ===== Conexión a Supabase =====
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Helpers =====
function formatDate(dateStr, options) {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("es-AR", { ...options, timeZone: "UTC" });
}

function formatDayLabel(dateStr) {
  // Ej: "sábado 24 de julio"
  return formatDate(dateStr, { weekday: "long", day: "numeric", month: "long" });
}

function formatShortDate(dateStr) {
  // Ej: "24/07"
  return formatDate(dateStr, { day: "2-digit", month: "2-digit" });
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function showError(container, message) {
  container.innerHTML = `<p class="error-message">${message}</p>`;
}

const CATEGORY_LABELS = {
  vuelo: "✈️ Vuelos",
  traslado: "🚐 Traslados",
  alojamiento: "🏡 Alojamiento",
  restaurante: "🍽️ Restaurantes",
};

const EXTRA_CATEGORY_LABELS = {
  restaurante_alt: "🍴 Restaurantes alternativos",
  playa: "🏖️ Playas imperdibles",
  tip: "💡 Tips prácticos",
};

// Bandera de Brasil en SVG (no un emoji, para que se vea igual en todos los sistemas).
const BRAZIL_FLAG_SVG = `
  <svg class="brazil-flag" viewBox="0 0 30 21" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bandera de Brasil">
    <rect width="30" height="21" fill="#009c3b"/>
    <polygon points="15,2.5 28,10.5 15,18.5 2,10.5" fill="#ffdf00"/>
    <circle cx="15" cy="10.5" r="5" fill="#002776"/>
  </svg>
`;

// ===== Render: Portada =====
function renderHero(trip) {
  const container = document.getElementById("hero-content");

  container.innerHTML = `
    <p class="hero-eyebrow">${trip.destination || ""}</p>
    <h1 class="hero-title">${trip.title} ${BRAZIL_FLAG_SVG}</h1>
    <p class="hero-subtitle">${trip.subtitle || ""}</p>
    <div class="hero-dates">
      📅 ${capitalize(formatDayLabel(trip.start_date))} → ${capitalize(formatDayLabel(trip.end_date))}
    </div>
  `;
}

// ===== Render: Resumen (tarjetas por día) =====
function renderSummary(days) {
  const container = document.getElementById("summary-cards");

  container.innerHTML = days
    .map(
      (day) => `
      <div class="day-card ${day.is_birthday ? "is-birthday" : ""}">
        ${day.photo_url ? `<img class="day-card-photo" src="${day.photo_url}" alt="${day.title}" loading="lazy" />` : ""}
        <div class="day-card-body">
          <div class="day-card-number">Día ${day.day_number}</div>
          <div class="day-card-date">${capitalize(formatDayLabel(day.date))}</div>
          <h3 class="day-card-title">${day.title}</h3>
          <p class="day-card-places">${day.main_places || ""}</p>
          ${day.is_birthday ? '<span class="day-card-badge">🎂 Cumpleaños</span>' : ""}
        </div>
      </div>
    `
    )
    .join("");
}

// ===== Render: Destaque de cumpleaños =====
function renderBirthdayHighlight(days, activitiesByDay) {
  const container = document.getElementById("birthday-highlight");
  const birthdayDay = days.find((d) => d.is_birthday);

  if (!birthdayDay) {
    container.innerHTML = "";
    return;
  }

  const activities = activitiesByDay[birthdayDay.id] || [];
  const dinner = activities.find((a) => a.is_highlight) || activities[activities.length - 1];

  container.innerHTML = `
    <div class="birthday-box">
      <span class="birthday-eyebrow">Día especial</span>
      <h3>🎂 ¡Feliz cumpleaños, Papá!</h3>
      <p>${capitalize(formatDayLabel(birthdayDay.date))} — ${birthdayDay.main_places || ""}</p>
      ${
        dinner
          ? `<div class="birthday-dinner">
              <div class="birthday-dinner-title">${dinner.title}</div>
              <div class="birthday-dinner-time">${dinner.time ? dinner.time + " · " : ""}${dinner.description || ""}</div>
            </div>`
          : ""
      }
    </div>
  `;
}

// ===== Render: Día a día (detalle) =====
function renderDaysDetail(days, activitiesByDay) {
  const container = document.getElementById("days-detail");

  container.innerHTML = days
    .map((day) => {
      const activities = activitiesByDay[day.id] || [];

      const activitiesHtml = activities
        .map(
          (a) => `
          <div class="activity ${a.is_highlight ? "is-highlight" : ""}">
            <div class="activity-time">${a.time || ""}</div>
            <div class="activity-body">
              <h4>${a.title}</h4>
              <p>${a.description || ""}</p>
              ${
                a.maps_link
                  ? `<a class="maps-link" href="${a.maps_link}" target="_blank" rel="noopener">📍 Ver en Google Maps</a>`
                  : ""
              }
            </div>
          </div>
        `
        )
        .join("");

      return `
        <div class="day-block ${day.is_birthday ? "is-birthday" : ""}">
          <div class="day-block-header">
            <h3>Día ${day.day_number} · ${day.title}</h3>
            <span>${capitalize(formatDayLabel(day.date))}</span>
          </div>
          <div class="activity-list">
            ${activitiesHtml || "<p>Sin actividades cargadas todavía.</p>"}
          </div>
        </div>
      `;
    })
    .join("");
}

const ACTION_BUTTON_LABELS = {
  vuelo: "Check-in",
  alojamiento: "Ver reserva",
};

function renderActionButton(r) {
  const label = ACTION_BUTTON_LABELS[r.category];
  if (!label) return "";
  if (r.action_url) {
    return `<a class="action-btn" href="${r.action_url}" target="_blank" rel="noopener">${label}</a>`;
  }
  return `<span class="action-btn action-btn-disabled">Próximamente</span>`;
}

// ===== Render: Reservas =====
function renderReservations(reservations) {
  const container = document.getElementById("reservations-content");

  const order = ["vuelo", "traslado", "alojamiento", "restaurante"];
  const grouped = {};
  reservations.forEach((r) => {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  });

  container.innerHTML = order
    .filter((cat) => grouped[cat] && grouped[cat].length)
    .map((cat) => {
      const cards = grouped[cat]
        .map(
          (r) => `
          <div class="reservation-card">
            ${r.date ? `<div class="reservation-meta">${formatShortDate(r.date)}${r.time ? " · " + r.time : ""}</div>` : ""}
            <h4>${r.title}</h4>
            ${r.location ? `<p>📍 ${r.location}</p>` : ""}
            ${r.details ? `<p>${r.details}</p>` : ""}
            ${r.link ? `<a class="maps-link" href="${r.link}" target="_blank" rel="noopener">Ver más</a>` : ""}
            ${r.confirmation_number ? `<div class="reservation-code">Cód: ${r.confirmation_number}</div>` : ""}
            ${renderActionButton(r)}
          </div>
        `
        )
        .join("");

      return `
        <div class="reservation-group">
          <h3>${CATEGORY_LABELS[cat] || capitalize(cat)}</h3>
          <div class="reservation-cards">${cards}</div>
        </div>
      `;
    })
    .join("");
}

// ===== Render: Extras =====
function renderExtras(extras) {
  const container = document.getElementById("extras-content");

  const order = ["playa", "restaurante_alt", "tip"];
  const grouped = {};
  extras.forEach((e) => {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  });

  container.innerHTML = `
    <div class="extras-grid">
      ${order
        .filter((cat) => grouped[cat] && grouped[cat].length)
        .map(
          (cat) => `
          <div class="extras-col">
            <h3>${EXTRA_CATEGORY_LABELS[cat] || capitalize(cat)}</h3>
            ${grouped[cat]
              .map(
                (e) => `
                <div class="extra-item">
                  <h4>${e.title}</h4>
                  <p>${e.description || ""}</p>
                  ${e.link ? `<a class="maps-link" href="${e.link}" target="_blank" rel="noopener">📍 Ver en Google Maps</a>` : ""}
                </div>
              `
              )
              .join("")}
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

// ===== Render: Mapa =====
function renderMap(extras, reservations) {
  const mapContainer = document.getElementById("trip-map");
  if (typeof L === "undefined") {
    mapContainer.innerHTML = '<p class="error-message">No se pudo cargar el mapa (Leaflet no disponible).</p>';
    return;
  }

  const points = [
    ...extras.filter((e) => e.lat && e.lng).map((e) => ({ name: e.title, lat: e.lat, lng: e.lng })),
    ...reservations.filter((r) => r.lat && r.lng).map((r) => ({ name: r.title, lat: r.lat, lng: r.lng })),
  ];

  const center = points.length ? [points[0].lat, points[0].lng] : [-22.7469, -41.8817];
  const map = L.map("trip-map").setView(center, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  points.forEach((p) => {
    L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.name);
  });
}

// ===== Carga de datos e inicialización =====
async function init() {
  try {
    const [tripRes, daysRes, activitiesRes, reservationsRes, extrasRes] = await Promise.all([
      client.from("trip_info").select("*").limit(1).single(),
      client.from("days").select("*").order("day_number"),
      client.from("activities").select("*").order("order_index"),
      client.from("reservations").select("*").order("order_index"),
      client.from("extras").select("*").order("order_index"),
    ]);

    const firstError = tripRes.error || daysRes.error || activitiesRes.error || reservationsRes.error || extrasRes.error;

    if (firstError) {
      throw firstError;
    }

    const trip = tripRes.data;
    const days = daysRes.data || [];
    const activities = activitiesRes.data || [];
    const reservations = reservationsRes.data || [];
    const extras = extrasRes.data || [];

    const activitiesByDay = {};
    activities.forEach((a) => {
      if (!activitiesByDay[a.day_id]) activitiesByDay[a.day_id] = [];
      activitiesByDay[a.day_id].push(a);
    });

    renderHero(trip);
    renderMap(extras, reservations);
    renderSummary(days);
    renderBirthdayHighlight(days, activitiesByDay);
    renderDaysDetail(days, activitiesByDay);
    renderReservations(reservations);
    renderExtras(extras);
  } catch (err) {
    console.error("Error cargando datos de Supabase:", err);
    showError(
      document.getElementById("hero-content"),
      "No se pudo cargar la información del viaje. Revisá la configuración de Supabase en config.js."
    );
  }
}

init();
