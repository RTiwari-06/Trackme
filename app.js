// TrackMe - State Engine & GPS Simulation

// 1. Translations Dictionary (English & Hindi)
const translations = {
  en: {
    appName: "TrackMe",
    onboardingTitle: "Share Journeys safely",
    onboardingSub: "Automatic WhatsApp updates for parents. Complete control in your hands.",
    consentBgLocation: "Background Tracking",
    consentBgLocationDesc: "Sends location pings even when your phone is locked or app is in background.",
    consentDPDP: "DPDP Act Compliant",
    consentDPDPDesc: "Minimal data retention. Your history is deleted as soon as you arrive.",
    consentControl: "You are in Control",
    consentControlDesc: "Only you start and stop sharing. No always-on tracking, ever.",
    consentLegal: "By proceeding, you agree to our DPDP-compliant Privacy Policy and under-18 consent guidelines.",
    btnGetStarted: "Get Started",
    
    // Home Screen
    welcomeUser: "Welcome, {{userName}}",
    travelerSub: "Where are you heading today?",
    destLabel: "SELECT DESTINATION",
    destHome: "Home",
    destHomeAdd: "Connaught Place, New Delhi",
    destCollege: "College",
    destCollegeAdd: "North Campus, DU",
    btnSelectWatcher: "Choose Watcher",
    
    // Watcher Screen
    watcherLabel: "SHARE WITH WATCHER",
    cMom: "Mom",
    cMomSub: "+91 [REDACTED] (WhatsApp)",
    cDad: "Dad",
    cDadSub: "+91 [REDACTED] (SMS Fallback)",
    cBrother: "Rahul (Brother)",
    cBrotherSub: "+91 [REDACTED] (WhatsApp)",
    btnStartJourney: "Start Journey & Share Link",
    
    // Active Tracking
    activeTitle: "Sharing Location",
    activeETA: "ETA",
    activeSpeed: "SPEED",
    activeDistance: "DISTANCE",
    activeSharingWith: "Sharing live journey link with",
    btnStopSharing: "Stop Sharing (Revoke Link)",
    statusActive: "ACTIVE",
    statusOffline: "OFFLINE",
    
    // Arrived
    arrivedTitle: "Reached safely",
    arrivedSub: "Your watcher was notified and your tracking link has automatically expired.",
    arrivedLog: "WhatsApp sent: '✅ {{userName}} has reached safely at [TIME]. The link has expired.'",
    btnNewJourney: "Start New Journey",
    
    // Watcher View
    watcherHeadingActive: "is heading to",
    watcherHeadingArrived: "reached safely at",
    watcherLastUpdated: "Last updated: Just now",
    watcherOffline: "Device Offline. Showing last known location.",
    watcherDead: "Device Battery Dead. Sharing suspended.",
    watcherExpired: "This journey has ended. The tracking link has expired."
  },
  hi: {
    appName: "ट्रैकमी (TrackMe)",
    onboardingTitle: "सुरक्षित यात्रा साझा करें",
    onboardingSub: "अभिभावकों के लिए ऑटोमैटिक व्हाट्सएप अपडेट। पूरा नियंत्रण आपके हाथ में।",
    consentBgLocation: "बैकग्राउंड ट्रैकिंग",
    consentBgLocationDesc: "फोन लॉक होने या ऐप बंद होने पर भी लोकेशन अपडेट भेजता है।",
    consentDPDP: "DPDP एक्ट का पालन",
    consentDPDPDesc: "कम से कम डेटा स्टोरेज। आपके पहुँचने के तुरंत बाद पुराना डेटा डिलीट।",
    consentControl: "आपका पूर्ण नियंत्रण",
    consentControlDesc: "सिर्फ आप ही ट्रैकिंग शुरू या बंद कर सकते हैं। कभी भी गुप्त ट्रैकिंग नहीं।",
    consentLegal: "आगे बढ़कर, आप हमारी DPDP-अनुकूल गोपनीयता नीति और 18 से कम उम्र की सहमति के दिशानिर्देशों से सहमत हैं।",
    btnGetStarted: "शुरू करें",
    
    // Home Screen
    welcomeUser: "नमस्ते, राज",
    travelerSub: "आज आप कहाँ जा रहे हैं?",
    destLabel: "गंतव्य चुनें",
    destHome: "घर",
    destHomeAdd: "कनॉट प्लेस, नई दिल्ली",
    destCollege: "कॉलेज",
    destCollegeAdd: "नॉर्थ कैंपस, दिल्ली यूनिवर्सिटी",
    btnSelectWatcher: "वॉचर (अभिभावक) चुनें",
    
    // Watcher Screen
    watcherLabel: "वॉचर के साथ साझा करें",
    cMom: "माँ",
    cMomSub: "+91 98765 43210 (व्हाट्सएप)",
    cDad: "पिताजी",
    cDadSub: "+91 98765 43211 (एसएमएस फॉलबैक)",
    cBrother: "राहुल (भाई)",
    cBrotherSub: "+91 98765 43212 (व्हाट्सएप)",
    btnStartJourney: "यात्रा शुरू करें और लिंक साझा करें",
    
    // Active Tracking
    activeTitle: "लोकेशन शेयर हो रही है",
    activeETA: "पहुँचने का समय",
    activeSpeed: "रफ़्तार",
    activeDistance: "दूरी",
    activeSharingWith: "लाइव यात्रा लिंक इनके साथ साझा है:",
    btnStopSharing: "शेयरिंग रोकें (लिंक रद्द करें)",
    statusActive: "सक्रिय",
    statusOffline: "ऑफ़लाइन",
    
    // Arrived
    arrivedTitle: "सुरक्षित पहुँच गए",
    arrivedSub: "आपके अभिभावक को सूचित कर दिया गया है और ट्रैकिंग लिंक अपने आप समाप्त हो गया है।",
    arrivedLog: "व्हाट्सएप भेजा गया: '✅ राज [TIME] पर सुरक्षित पहुँच गए हैं। लिंक समाप्त हो गया है।'",
    btnNewJourney: "नई यात्रा शुरू करें",
    
    // Watcher View
    watcherHeadingActive: "जा रहे हैं",
    watcherHeadingArrived: "सुरक्षित पहुँच गए",
    watcherLastUpdated: "अभी-अभी अपडेट किया गया",
    watcherOffline: "डिवाइस ऑफ़लाइन। आखिरी ज्ञात लोकेशन दिखाई जा रही है।",
    watcherDead: "डिवाइस की बैटरी खत्म। ट्रैकिंग सस्पेंड कर दी गई है।",
    watcherExpired: "यह यात्रा समाप्त हो गई है। ट्रैकिंग लिंक एक्सपायर हो गया है।"
  }
};

// 2. Mock GPS Routes (Interpolated paths between Delhi University & Connaught Place)
// Coordinates in [lat, lng] format
const routes = {
  // College to Home (Delhi University North Campus -> Connaught Place)
  home: [
    [28.6904, 77.2066], // DU North Campus (Start)
    [28.6872, 77.2085],
    [28.6825, 77.2104],
    [28.6775, 77.2120],
    [28.6720, 77.2115], // Near GTB Nagar
    [28.6655, 77.2108], // Civil Lines Area
    [28.6582, 77.2110], // Near ISBT Kashmere Gate
    [28.6531, 77.2125],
    [28.6480, 77.2135], // Red Fort Outer Ring
    [28.6435, 77.2110], // Near Delhi Junction
    [28.6385, 77.2085], // Ajmeri Gate
    [28.6350, 77.2120], // Minto Road
    [28.6304, 77.2177]  // Connaught Place Inner Circle (Arrival Destination)
  ],
  // Home to College (Connaught Place -> Delhi University North Campus)
  college: [
    [28.6304, 77.2177], // Connaught Place (Start)
    [28.6350, 77.2120],
    [28.6385, 77.2085],
    [28.6435, 77.2110],
    [28.6480, 77.2135],
    [28.6531, 77.2125],
    [28.6582, 77.2110],
    [28.6655, 77.2108],
    [28.6720, 77.2115],
    [28.6775, 77.2120],
    [28.6825, 77.2104],
    [28.6872, 77.2085],
    [28.6904, 77.2066]  // DU North Campus (Arrival Destination)
  ]
};

// 3. State Management
let state = {
  lang: 'en',
  screen: 'onboarding', // onboarding -> home -> picker -> active -> arrived
  destination: 'home', // home | college
  watcher: 'Mom', // Mom | Dad | Rahul
  channel: 'whatsapp', // whatsapp | sms
  
  // Simulation Variables
  activeRoute: [],
  routeIndex: 0,
  isOffline: false,
  isDeadBattery: false,
  shareToken: '',
  timerId: null,
  
  // Telemetry
  speed: 0,
  eta: 25, // minutes
  distanceLeft: 6.2, // km
  lastSeenTime: null,
  
  // Logs
  logs: []
};

// 4. Map Variables
let travelerMap, watcherMap;
let travelerMarker, watcherMarker;
let travelerRouteLine, watcherRouteLine;
let travelerDestMarker, watcherDestMarker;

// Standard Leaflet Icon Helper
function getPulsingMarkerHTML() {
  return `
    <div class="gps-marker-container">
      <div class="gps-ripple"></div>
      <div class="gps-dot"></div>
    </div>
  `;
}

function getDestMarkerHTML(iconName) {
  return `
    <div class="destination-marker-container">
      <i class="fas ${iconName}"></i>
    </div>
  `;
}

// Initialize Leaflet Maps
function initMaps() {
  const mapStyleUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const attribution = '&copy; OpenStreetMap & CARTO';

  // Delhi DU Coordinates central point default
  const defaultCenter = [28.66, 77.21];

  // Traveler Map
  travelerMap = L.map('travelerMap', {
    zoomControl: false,
    attributionControl: false
  }).setView(defaultCenter, 12);
  L.tileLayer(mapStyleUrl, { attribution }).addTo(travelerMap);

  // Watcher Map
  watcherMap = L.map('watcherMap', {
    zoomControl: true,
    attributionControl: true
  }).setView(defaultCenter, 12);
  L.tileLayer(mapStyleUrl, { attribution }).addTo(watcherMap);
}

// 5. Navigation & Screen Rendering
function changeScreen(newScreen) {
  state.screen = newScreen;
  
  // Hide all screens, show active
  document.querySelectorAll('.phone-content .app-screen').forEach(scr => {
    scr.classList.remove('active-screen');
  });
  
  const targetScreen = document.getElementById(`${newScreen}Screen`);
  if (targetScreen) {
    targetScreen.classList.add('active-screen');
  }

  // Hook-specific screen setup
  if (newScreen === 'active') {
    // Invalidate map size to fix grey grid issues in Leaflet when rendering hidden divs
    setTimeout(() => {
      travelerMap.invalidateSize();
      setupActiveJourneyMap();
    }, 100);
  }
  
  renderLanguageStrings();
}

function selectDestination(dest) {
  state.destination = dest;
  document.querySelectorAll('.dest-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.getElementById(`dest-${dest}`).classList.add('selected');
}

function selectContact(contact, channel) {
  state.watcher = contact;
  state.channel = channel;
  document.querySelectorAll('.contact-row').forEach(row => {
    row.classList.remove('selected');
  });
  document.getElementById(`contact-${contact.toLowerCase()}`).classList.add('selected');
}

// Render dynamic strings on all pages based on state.lang
function renderLanguageStrings() {
  const dict = translations[state.lang];
  
  // Attribute translations to all nodes with `data-i18n` attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else {
        el.innerHTML = dict[key];
      }
    }
  });

  // Watcher Specific dynamic updating
  updateWatcherUI();
}

// 6. Simulation Actions
function toggleLanguage() {
  state.lang = state.lang === 'en' ? 'hi' : 'en';
  document.getElementById('langSelect').value = state.lang;
  renderLanguageStrings();
}

function generateShareLink() {
  state.shareToken = 't_' + Math.random().toString(36).substring(2, 10);
  const fullLink = `https://trackme.live/watch/${state.shareToken}`;
  
  // Render details inside traveler share sheet
  const displayToken = document.getElementById('generatedLinkText');
  if (displayToken) {
    displayToken.innerHTML = `Hi! Watch my journey live on TrackMe: <span class="wa-link">${fullLink}</span>`;
  }
  
  // Set browser address bar
  document.getElementById('browserAddress').innerText = fullLink;
}

function triggerShareSheet(open) {
  const overlay = document.getElementById('shareOverlay');
  if (open) {
    generateShareLink();
    overlay.classList.add('open');
  } else {
    overlay.classList.remove('open');
  }
}

function confirmShareAndStart() {
  triggerShareSheet(false);
  
  // Set initial coordinates
  state.activeRoute = routes[state.destination];
  state.routeIndex = 0;
  state.speed = 42; 
  state.eta = Math.round(state.activeRoute.length * 2.2);
  state.distanceLeft = (state.activeRoute.length * 0.5).toFixed(1);
  state.isOffline = false;
  state.isDeadBattery = false;
  
  changeScreen('active');
  
  // Update status bars
  document.getElementById('signalToggle').classList.remove('active');
  document.getElementById('batteryToggle').classList.remove('active');
  
  // Clear any existing intervals
  if (state.timerId) clearInterval(state.timerId);
  
  // Start simulation clock
  state.timerId = setInterval(simulateStep, 2000);
  
  // Initialize Watcher Map and Interface
  setTimeout(() => {
    watcherMap.invalidateSize();
    setupWatcherMap();
  }, 100);
}

function stopJourney() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  changeScreen('home');
  resetSimulationBanners();
}

function resetSimulationBanners() {
  // Clear alerts
  document.getElementById('travelerAlertBanner').style.display = 'none';
  document.getElementById('watcherAlertBanner').style.display = 'none';
  document.getElementById('browserAddress').innerText = 'https://trackme.live';
  
  // Reset maps markers
  if (travelerMarker) travelerMap.removeLayer(travelerMarker);
  if (travelerRouteLine) travelerMap.removeLayer(travelerRouteLine);
  if (travelerDestMarker) travelerMap.removeLayer(travelerDestMarker);
  if (watcherMarker) watcherMap.removeLayer(watcherMarker);
  if (watcherRouteLine) watcherMap.removeLayer(watcherRouteLine);
  if (watcherDestMarker) watcherMap.removeLayer(watcherDestMarker);
}

// 7. Simulating GPS Tick
function simulateStep() {
  if (state.isDeadBattery) return; // Battery dead halts processing completely

  // If offline, traveler app updates location locally but watcher does NOT receive live ticks.
  if (!state.isOffline) {
    state.lastSeenTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Advance on route
  if (state.routeIndex < state.activeRoute.length - 1) {
    state.routeIndex++;
    
    // Vary speed slightly
    state.speed = Math.round(35 + Math.random() * 15);
    state.eta = Math.max(1, Math.round((state.activeRoute.length - state.routeIndex) * 2));
    state.distanceLeft = Math.max(0, ((state.activeRoute.length - state.routeIndex) * 0.5)).toFixed(1);
    
    updateTravelerMapMarker();
    
    if (!state.isOffline) {
      updateWatcherMapMarker();
    }
    
    updateActiveStatsUI();
  } else {
    // Arrival! Trigger geofence
    triggerArrival();
  }
}

function triggerArrival() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  
  changeScreen('arrived');
  
  // Format log entry
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logStr = translations[state.lang].arrivedLog.replace('[TIME]', nowStr);
  document.getElementById('whatsappLog').innerText = logStr;
  
  // Lock Watcher page into safe state
  updateWatcherUIArrived(nowStr);
}

// 8. Toggling Edge Cases
function toggleOfflineSim() {
  if (state.screen !== 'active') return;
  state.isOffline = !state.isOffline;
  
  const btn = document.getElementById('signalToggle');
  const tBanner = document.getElementById('travelerAlertBanner');
  const wBanner = document.getElementById('watcherAlertBanner');
  
  if (state.isOffline) {
    btn.classList.add('active');
    tBanner.innerText = state.lang === 'en' ? "⚠️ Low Signal: Queueing location pings locally" : "⚠️ कमजोर सिग्नल: लोकेशन पिंग्स लोकल कतार में हैं";
    tBanner.className = "system-warning-banner warning-mode";
    tBanner.style.display = "flex";
    
    // Watcher sees device offline warning
    wBanner.innerText = translations[state.lang].watcherOffline;
    wBanner.className = "system-warning-banner warning-mode";
    wBanner.style.display = "flex";
    
    // Update active UI status badge
    document.getElementById('travelerStatusPill').className = "status-pill offline";
    document.getElementById('travelerStatusText').innerText = translations[state.lang].statusOffline;
  } else {
    btn.classList.remove('active');
    tBanner.style.display = "none";
    wBanner.style.display = "none";
    
    document.getElementById('travelerStatusPill').className = "status-pill";
    document.getElementById('travelerStatusText').innerText = translations[state.lang].statusActive;
    
    // Immediate catchup on reconnect
    simulateStep();
  }
}

function toggleBatterySim() {
  if (state.screen !== 'active') return;
  state.isDeadBattery = !state.isDeadBattery;
  
  const btn = document.getElementById('batteryToggle');
  const tBanner = document.getElementById('travelerAlertBanner');
  const wBanner = document.getElementById('watcherAlertBanner');
  
  if (state.isDeadBattery) {
    btn.classList.add('active');
    tBanner.innerText = state.lang === 'en' ? "❌ Phone Dead: Tracking suspended" : "❌ फोन बंद: ट्रैकिंग निलंबित";
    tBanner.className = "system-warning-banner";
    tBanner.style.display = "flex";
    
    wBanner.innerText = translations[state.lang].watcherDead;
    wBanner.className = "system-warning-banner";
    wBanner.style.display = "flex";
  } else {
    btn.classList.remove('active');
    tBanner.style.display = "none";
    wBanner.style.display = "none";
    
    simulateStep();
  }
}

// 9. Map Telemetry Drawing Details
function setupActiveJourneyMap() {
  const routeCoords = routes[state.destination];
  const startPt = routeCoords[0];
  const endPt = routeCoords[routeCoords.length - 1];

  // Center Map
  travelerMap.setView(startPt, 14);

  // Add Route Line
  if (travelerRouteLine) travelerMap.removeLayer(travelerRouteLine);
  travelerRouteLine = L.polyline(routeCoords, {
    color: '#3b82f6',
    weight: 4,
    opacity: 0.8,
    dashArray: '5, 8'
  }).addTo(travelerMap);

  // Add Destination Home/College Marker
  const destIconName = state.destination === 'home' ? 'fa-home' : 'fa-graduation-cap';
  const destIcon = L.divIcon({
    html: getDestMarkerHTML(destIconName),
    className: 'custom-leaflet-marker',
    iconSize: [32, 32]
  });

  if (travelerDestMarker) travelerMap.removeLayer(travelerDestMarker);
  travelerDestMarker = L.marker(endPt, { icon: destIcon }).addTo(travelerMap);

  // Add Pulse Marker
  const gpsIcon = L.divIcon({
    html: getPulsingMarkerHTML(),
    className: 'custom-leaflet-marker',
    iconSize: [20, 20]
  });

  if (travelerMarker) travelerMap.removeLayer(travelerMarker);
  travelerMarker = L.marker(startPt, { icon: gpsIcon }).addTo(travelerMap);
}

function updateTravelerMapMarker() {
  const currentPt = state.activeRoute[state.routeIndex];
  if (travelerMarker) {
    travelerMarker.setLatLng(currentPt);
    travelerMap.panTo(currentPt);
  }
}

function setupWatcherMap() {
  const routeCoords = routes[state.destination];
  const startPt = routeCoords[0];
  const endPt = routeCoords[routeCoords.length - 1];

  watcherMap.setView(startPt, 14);

  if (watcherRouteLine) watcherMap.removeLayer(watcherRouteLine);
  watcherRouteLine = L.polyline(routeCoords, {
    color: '#3b82f6',
    weight: 4,
    opacity: 0.8,
    dashArray: '5, 8'
  }).addTo(watcherMap);

  const destIconName = state.destination === 'home' ? 'fa-home' : 'fa-graduation-cap';
  const destIcon = L.divIcon({
    html: getDestMarkerHTML(destIconName),
    className: 'custom-leaflet-marker',
    iconSize: [32, 32]
  });

  if (watcherDestMarker) watcherMap.removeLayer(watcherDestMarker);
  watcherDestMarker = L.marker(endPt, { icon: destIcon }).addTo(watcherMap);

  const gpsIcon = L.divIcon({
    html: getPulsingMarkerHTML(),
    className: 'custom-leaflet-marker',
    iconSize: [20, 20]
  });

  if (watcherMarker) watcherMap.removeLayer(watcherMarker);
  watcherMarker = L.marker(startPt, { icon: gpsIcon }).addTo(watcherMap);
}

function updateWatcherMapMarker() {
  const currentPt = state.activeRoute[state.routeIndex];
  if (watcherMarker) {
    watcherMarker.setLatLng(currentPt);
    watcherMap.panTo(currentPt);
  }
}

// 10. Update UI Texts
function updateActiveStatsUI() {
  const dict = translations[state.lang];
  document.getElementById('statETA').innerText = `${state.eta} m`;
  document.getElementById('statSpeed').innerText = `${state.speed} km/h`;
  document.getElementById('statDistance').innerText = `${state.distanceLeft} km`;
  
  // Watcher stats sync
  document.getElementById('watcherETA').innerText = `${state.eta} mins`;
  document.getElementById('watcherSpeed').innerText = `${state.speed} km/h`;
  document.getElementById('watcherDistance').innerText = `${state.distanceLeft} km`;
  document.getElementById('watcherLastUpdatedText').innerText = dict.watcherLastUpdated;
}

function updateWatcherUI() {
  const dict = translations[state.lang];
  const isArrived = state.screen === 'arrived';
  
  // Update header text based on screen state
  const nameSpan = document.getElementById('watcherTravelerName');
  const detailsSpan = document.getElementById('watcherHeadingDetail');
  
  if (isArrived) {
    nameSpan.innerText = (window.__TRACKME_USER_NAME__ || 'Traveler');
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    detailsSpan.innerText = `${dict.watcherHeadingArrived} ${nowStr}`;
  } else {
    nameSpan.innerText = (window.__TRACKME_USER_NAME__ || 'Traveler');
    const destName = state.destination === 'home' ? dict.destHome : dict.destCollege;
    detailsSpan.innerText = `${dict.watcherHeadingActive} ${destName}`;
  }
}

function updateWatcherUIArrived(timeStr) {
  const dict = translations[state.lang];
  
  // Freeze watcher view styling to reassuring safe green
  const hud = document.getElementById('watcherHUD');
  hud.classList.add('hud-arrived');
  
  document.getElementById('watcherTravelerName').innerText = (window.__TRACKME_USER_NAME__ || 'Traveler');
  document.getElementById('watcherHeadingDetail').innerText = `${dict.watcherHeadingArrived} ${timeStr}`;
  
  // Set expired overlay HUD metrics
  document.getElementById('watcherETA').className = "value highlight-green";
  document.getElementById('watcherETA').innerText = "Arrived";
  document.getElementById('watcherDistance').innerText = "0.0 km";
  
  // Update trust signal as Link Expired
  const trustSignal = document.getElementById('watcherTrustSignal');
  trustSignal.className = "hud-trust-signal orange";
  trustSignal.innerHTML = `<i class="fas fa-history"></i> <span data-i18n="watcherExpired">${dict.watcherExpired}</span>`;
  
  // Show Warning Banner in browser view
  const banner = document.getElementById('watcherAlertBanner');
  banner.innerText = dict.watcherExpired;
  banner.className = "system-warning-banner warning-mode";
  banner.style.display = "flex";
}

// On Initial Load
window.addEventListener('DOMContentLoaded', () => {
  initMaps();
  renderLanguageStrings();
  
  // Set Default State triggers
  selectDestination('home');
  selectContact('Mom', 'whatsapp');
});
