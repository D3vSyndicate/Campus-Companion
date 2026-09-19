import { CAMPUSES, CATEGORIES, type CampusId, type CampusPlace } from '../../data/campus';
import type { MapTheme } from './types';

// The whole map is one self-contained HTML page (Leaflet + free OpenStreetMap-based tiles). It
// runs inside a WebView on phones and an iframe on the web. The React screen
// talks to it with small JSON commands, and it reports taps back the same way.
//
// Leaflet is loaded from unpkg with integrity hashes, so a tampered copy will not run.

const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';

// Safe to embed inside a <script> tag.
const embed = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\u003c')
    .replace(new RegExp('[\u2028\u2029]', 'g'), '');

const PAGE_SCRIPT = `
(function () {
  var DATA = __DATA__;

  function post(payload) {
    try {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      else if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ cc: true }, payload), '*');
    } catch (e) {}
  }

  if (typeof L === 'undefined') {
    document.getElementById('offline').style.display = 'flex';
    post({ type: 'status', value: 'offline' });
    return;
  }

  // Map pictures that need no key. To change provider, change this one line and the attribution.
  // (CARTO's free tiles now print "API KEY REQUIRED" across every tile, and OpenStreetMap's own
  // server blocks WebViews. This is the HOT style hosted by OpenStreetMap France: it shows
  // building outlines and footpaths up to zoom 18, which is what a first-year needs.)
  var TILE_URL = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
  var ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Tiles: <a href="https://www.hotosm.org/">HOT</a>, hosted by <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>';

  var map = L.map('map', { zoomControl: false, minZoom: 14, maxZoom: 19, zoomSnap: 0.5 });
  var tileLayer = null;
  var insets = { top: 0, bottom: 0 };
  var places = {};
  var markers = {};
  var selectedId = null;
  var visibleIds = null;
  var routeLayer = L.layerGroup().addTo(map);
  var campusId = DATA.campus;
  var userMoved = false;

  // One set of tiles for both themes: dark mode darkens them with a CSS filter (see the styles below).
  function applyTheme(theme) {
    document.body.className = theme;
    if (!tileLayer) {
      tileLayer = L.tileLayer(TILE_URL, { maxZoom: 19, maxNativeZoom: 18, subdomains: 'abc', attribution: ATTRIBUTION }).addTo(map);
    }
  }

  function pinElement(place, selected) {
    var meta = DATA.categories[place.category] || DATA.categories.building;
    var el = document.createElement('div');
    el.className = 'pin' + (selected ? ' selected' : '');
    el.style.background = meta.color;
    var text = document.createElement('span');
    text.textContent = place.number || place.symbol || '\\u2022';
    el.appendChild(text);
    if (selected) {
      var label = document.createElement('div');
      label.className = 'lbl';
      label.textContent = place.name;
      el.appendChild(label);
    }
    return el;
  }

  function iconFor(place, selected) {
    return L.divIcon({ className: 'pin-wrap', html: pinElement(place, selected), iconSize: [0, 0] });
  }

  function applyVisibility() {
    Object.keys(markers).forEach(function (id) {
      var show = !visibleIds || visibleIds[id] || id === selectedId;
      var on = map.hasLayer(markers[id]);
      if (show && !on) markers[id].addTo(map);
      if (!show && on) map.removeLayer(markers[id]);
    });
  }

  function buildMarkers(list) {
    Object.keys(markers).forEach(function (id) { map.removeLayer(markers[id]); });
    markers = {};
    places = {};
    list.forEach(function (place) {
      places[place.id] = place;
      var marker = L.marker([place.lat, place.lng], { icon: iconFor(place, false), keyboard: false });
      marker.on('click', function (e) {
        L.DomEvent.stopPropagation(e);
        select(place.id, true, true);
      });
      markers[place.id] = marker;
    });
    if (selectedId && !markers[selectedId]) selectedId = null;
    applyVisibility();
  }

  // Keeps the target clear of whatever the app draws over the map.
  function centerWithInsets(latlng, zoom) {
    var point = map.project(latlng, zoom).add([0, (insets.bottom - insets.top) / 2]);
    return map.unproject(point, zoom);
  }

  function resetSelected() {
    if (selectedId && markers[selectedId]) {
      markers[selectedId].setIcon(iconFor(places[selectedId], false));
      markers[selectedId].setZIndexOffset(0);
    }
  }

  function select(id, fly, notify) {
    resetSelected();
    selectedId = id;
    var marker = markers[id];
    if (!marker) return;
    marker.setIcon(iconFor(places[id], true));
    marker.setZIndexOffset(1000);
    applyVisibility();
    if (fly) {
      var zoom = Math.max(map.getZoom(), 18);
      map.flyTo(centerWithInsets(marker.getLatLng(), zoom), zoom, { duration: 0.7 });
    }
    if (notify) post({ type: 'select', id: id });
  }

  function clearSelection() {
    resetSelected();
    selectedId = null;
    applyVisibility();
  }

  function showRoute(coords) {
    routeLayer.clearLayers();
    if (!coords || coords.length < 2) return;
    var line = { lineCap: 'round', lineJoin: 'round' };
    L.polyline(coords, Object.assign({ color: '#ffffff', weight: 11, opacity: 0.95 }, line)).addTo(routeLayer);
    L.polyline(coords, Object.assign({ color: '#F8A705', weight: 6, opacity: 1 }, line)).addTo(routeLayer);
    L.circleMarker(coords[0], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#16A34A', fillOpacity: 1 }).addTo(routeLayer);
    L.circleMarker(coords[coords.length - 1], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#DC2626', fillOpacity: 1 }).addTo(routeLayer);
    map.flyToBounds(L.latLngBounds(coords), {
      paddingTopLeft: [28, insets.top + 24],
      paddingBottomRight: [28, insets.bottom + 24],
      maxZoom: 18,
      duration: 0.8
    });
  }

  window.__ccHandle = function (msg) {
    if (!msg || !msg.cmd) return;
    switch (msg.cmd) {
      case 'theme': applyTheme(msg.value); break;
      case 'campus':
        var campus = DATA.campuses[msg.id];
        campusId = msg.id;
        userMoved = false;
        if (campus) map.flyTo(centerWithInsets(campus.center, campus.zoom), campus.zoom, { duration: 0.8 });
        break;
      case 'focus': select(msg.id, true, false); break;
      case 'clear': clearSelection(); break;
      case 'places': buildMarkers(msg.places || []); break;
      case 'visible':
        visibleIds = null;
        if (msg.ids) { visibleIds = {}; msg.ids.forEach(function (id) { visibleIds[id] = true; }); }
        applyVisibility();
        break;
      case 'route': showRoute(msg.coords); break;
      case 'clearRoute': routeLayer.clearLayers(); break;
      case 'insets':
        insets = { top: msg.top || 0, bottom: msg.bottom || 0 };
        // Until the student moves the map, keep the campus centred in the space the overlays leave free.
        if (!selectedId && !routeLayer.getLayers().length && !userMoved) {
          var current = DATA.campuses[campusId];
          map.setView(centerWithInsets(current.center, current.zoom), current.zoom, { animate: false });
        }
        break;
      case 'zoom': map.setZoom(map.getZoom() + (msg.delta || 0)); break;
      case 'fitAll':
        var everywhere = Object.keys(places).map(function (id) { return [places[id].lat, places[id].lng]; });
        if (everywhere.length) {
          userMoved = true;
          map.flyToBounds(L.latLngBounds(everywhere), {
            paddingTopLeft: [24, insets.top + 24],
            paddingBottomRight: [24, insets.bottom + 24],
            maxZoom: 16,
            duration: 0.8
          });
        }
        break;
    }
  };

  // The web version receives commands as window messages.
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return; } }
    if (data && data.cc) window.__ccHandle(data);
  });

  map.on('click', function () { post({ type: 'blank' }); });
  map.on('dragstart', function () { userMoved = true; });

  // Smaller pins when zoomed out, so a crowded campus stays readable.
  function updateCompact() {
    map.getContainer().classList.toggle('compact', map.getZoom() < 17);
  }
  map.on('zoomend', updateCompact);

  var start = DATA.campuses[DATA.campus];
  map.setView(start.center, start.zoom);
  applyTheme(DATA.theme);
  buildMarkers(DATA.places);
  updateCompact();
  post({ type: 'ready' });
})();
`;

const STYLES = `
html, body, #map { height: 100%; margin: 0; padding: 0; }
body { background: #e5e7eb; -webkit-tap-highlight-color: transparent; }
body.dark, body.dark #map { background: #0b1220; }
body.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9) saturate(0.6); }
.pin-wrap { background: none; border: none; }
.pin {
  position: absolute; transform: translate(-50%, -50%);
  min-width: 26px; height: 26px; padding: 0 7px; box-sizing: border-box;
  border-radius: 13px; border: 2px solid #ffffff; color: #ffffff;
  font: 700 11px/22px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  text-align: center; white-space: nowrap; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
body.dark .pin { border-color: #0b1220; }
.compact .pin { min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; font-size: 9px; line-height: 16px; }
.pin.selected {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 0 0 4px rgba(248, 167, 5, 0.6), 0 3px 10px rgba(0, 0, 0, 0.4);
}
.pin .lbl {
  position: absolute; left: 50%; bottom: calc(100% + 9px); transform: translateX(-50%);
  background: #071b2c; color: #ffffff; padding: 5px 9px; border-radius: 8px;
  font: 600 12px/1.25 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  width: max-content; max-width: 170px; white-space: normal; text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.pin .lbl::after {
  content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px;
  border: 5px solid transparent; border-top-color: #071b2c;
}
.leaflet-control-attribution { font-size: 10px; }
#offline {
  display: none; position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000;
  align-items: center; justify-content: center; text-align: center; padding: 28px;
  background: #f1f5f9; color: #334155;
  font: 600 14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
`;

export function buildMapHtml(options: { places: CampusPlace[]; theme: MapTheme; campus: CampusId }) {
  const data = {
    places: options.places,
    theme: options.theme,
    campus: options.campus,
    campuses: CAMPUSES,
    categories: CATEGORIES,
  };

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="${LEAFLET_CSS_SRI}" crossorigin="" />
<style>${STYLES}</style>
</head>
<body class="${options.theme}">
<div id="map"></div>
<div id="offline">The map needs an internet connection to load. You can still search buildings and see their numbers in the list below.</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="${LEAFLET_JS_SRI}" crossorigin=""></script>
<script>${PAGE_SCRIPT.replace('__DATA__', () => embed(data))}</script>
</body>
</html>`;
}
