/*
  ATC Simulator JavaScript
  This script implements a simple but extensible air traffic control game in
  vanilla JavaScript. It sets up a radar display, spawns random aircraft with
  heavy (H), medium (M) and light (L) classifications, handles basic commands
  (turn left/right, climb/descend, change speed) issued via text or voice, and
  provides a transmission log with a typewriter effect. The design follows
  recommendations for a black radar display with vector arrows and labels
  describing callsign, altitude and speed【807708321175031†L41-L69】. Voice
  interaction uses the Web Speech API, reflecting voice‑recognition guidelines
  requiring English phraseology and push‑to‑talk behavior【802175147168733†L272-L317】.
*/

(function () {
  'use strict';

  // Canvas setup
  const canvas = document.getElementById('radar');
  const ctx = canvas.getContext('2d');
  const radarWidth = canvas.width;
  const radarHeight = canvas.height;

  // DOM references
  const logContainer = document.getElementById('log-messages');
  const commandInput = document.getElementById('commandInput');
  const sendBtn = document.getElementById('sendCommand');
  const voiceBtn = document.getElementById('voiceCommand');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const airportSelect = document.getElementById('airportSelect');
  const headerTitle = document.querySelector('header h1');
  // Lobby overlay elements
  const lobby = document.getElementById('lobby');
  const startBtn = document.getElementById('startButton');
  // Quick commands and install button
  const quickCommandsEl = document.getElementById('quick-commands');
  const installBtn = document.getElementById('installBtn');

  // Selected aircraft reference
  let selectedPlane = null;

  // PWA installation prompt
  let deferredPrompt;

  // Game state
  let planes = [];
  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  let level = 1;
  const spawnInterval = 8000; // milliseconds between new aircraft
  const maxPlanes = 5;

  // Build information string inserted into the footer.  The date and time
  // reflect when this version of the simulator was assembled.  Update this
  // value whenever releasing a new build.
  const buildInfo = 'v7 – 21/03/2026 16:35';

  // Probability that a spawned aircraft will be on the ground (requesting taxi).  This
  // introduces ground operations to the simulation.  Adjust value between 0 and 1.
  const groundSpawnProbability = 0.2;

  // Airport database: one airport per Brazilian state plus the federal district.
  // Each object contains the state code, the airport’s common name and its IATA code.
  const airports = [
    // Each airport entry includes a heading representing runway orientation in degrees.
    // The numbers displayed on either end of the runway line will be derived
    // from this orientation (e.g., 90° → runways 09/27, 100° → 10/28).  When
    // available, designations reflect the magnetic orientation reported by
    // official sources【85487694131555†L123-L138】.
    { state: 'AC', name: 'Rio Branco/Plácido de Castro', iata: 'RBR', runway: 60 },
    { state: 'AL', name: 'Maceió/Zumbi dos Palmares', iata: 'MCZ', runway: 110 },
    { state: 'AP', name: 'Macapá/Alberto Alcolumbre', iata: 'MCP', runway: 90 },
    { state: 'AM', name: 'Manaus/Eduardo Gomes', iata: 'MAO', runway: 100 },
    { state: 'BA', name: 'Salvador Dep. L. E. Magalhães', iata: 'SSA', runway: 90 },
    { state: 'CE', name: 'Fortaleza/Pinto Martins', iata: 'FOR', runway: 100 },
    { state: 'DF', name: 'Brasília International', iata: 'BSB', runway: 110 },
    { state: 'ES', name: 'Vitória/Eurico de Aguiar', iata: 'VIX', runway: 100 },
    { state: 'GO', name: 'Goiânia/Santa Genoveva', iata: 'GYN', runway: 110 },
    { state: 'MA', name: 'São Luís/Marechal Machado', iata: 'SLZ', runway: 90 },
    { state: 'MT', name: 'Cuiabá/Marechal Rondon', iata: 'CGB', runway: 90 },
    { state: 'MS', name: 'Campo Grande International', iata: 'CGR', runway: 110 },
    { state: 'MG', name: 'Belo Horizonte/Confins', iata: 'CNF', runway: 90 },
    { state: 'PA', name: 'Belém/Val‑de‑Cans', iata: 'BEL', runway: 80 },
    { state: 'PB', name: 'João Pessoa/Castro Pinto', iata: 'JPA', runway: 100 },
    { state: 'PR', name: 'Curitiba/Afonso Pena', iata: 'CWB', runway: 110 },
    { state: 'PE', name: 'Recife/Guararapes', iata: 'REC', runway: 90 },
    { state: 'PI', name: 'Teresina/Petrônio Portella', iata: 'THE', runway: 110 },
    { state: 'RJ', name: 'Rio de Janeiro/Galeão', iata: 'GIG', runway: 100 },
    { state: 'RN', name: 'Natal/Augusto Severo', iata: 'NAT', runway: 100 },
    { state: 'RS', name: 'Porto Alegre/Salgado Filho', iata: 'POA', runway: 110 },
    { state: 'RO', name: 'Porto Velho/Belmonte', iata: 'PVH', runway: 100 },
    { state: 'RR', name: 'Boa Vista International', iata: 'BVB', runway: 90 },
    { state: 'SC', name: 'Florianópolis/Hercílio Luz', iata: 'FLN', runway: 100 },
    { state: 'SP', name: 'São Paulo/Guarulhos', iata: 'GRU', runway: 100 },
    { state: 'SE', name: 'Aracaju/Santa Maria', iata: 'AJU', runway: 100 },
    { state: 'TO', name: 'Palmas/B. Lysias Rodrigues', iata: 'PMW', runway: 90 },
  ];

  // -----------------------------------------------------------------------------
  // Realistic aircraft data
  //
  // To make the simulation feel more authentic, we introduce a basic catalogue
  // of aircraft models grouped by weight class (H = heavy, M = medium, L = light)
  // and a list of major airlines with their ICAO prefixes.  When a new
  // aircraft spawns, we select a model appropriate to its weight class and
  // generate a callsign based on a real carrier if the aircraft is heavy or
  // medium.  Light aircraft spawn as private aircraft with Brazilian or
  // international registration prefixes.  This enhances immersion by replacing
  // the simple `H123`/`M123`/`L123` callsigns with identifiers like TAM317 or
  // PR‑ABC.

  const aircraftModels = {
    H: ['B747', 'B777', 'A380', 'A350', 'B787'],
    M: ['A320', 'B737', 'A319', 'E195', 'E190', 'ATR72'],
    L: ['C172', 'Citation', 'Learjet45', 'Piper28', 'CessnaMustang'],
  };

  const airlines = [
    { prefix: 'TAM', name: 'LATAM', types: ['H', 'M'] },
    { prefix: 'GLO', name: 'Gol', types: ['M'] },
    { prefix: 'AZU', name: 'Azul', types: ['M'] },
    { prefix: 'AVA', name: 'Avianca', types: ['M'] },
    { prefix: 'UAE', name: 'Emirates', types: ['H', 'M'] },
    { prefix: 'AFR', name: 'Air France', types: ['H', 'M'] },
    { prefix: 'KLM', name: 'KLM', types: ['H', 'M'] },
    { prefix: 'DLH', name: 'Lufthansa', types: ['H', 'M'] },
    { prefix: 'AAL', name: 'American', types: ['H', 'M'] },
    { prefix: 'DAL', name: 'Delta', types: ['H', 'M'] },
    { prefix: 'UAL', name: 'United', types: ['H', 'M'] },
    { prefix: 'BAW', name: 'British Airways', types: ['H', 'M'] },
  ];

  // Current airport selection; default to São Paulo/Guarulhos (GRU)
  let currentAirport;

  // Phonetic alphabet and numbers per ICAO standard【802175147168733†L334-L416】
  const phoneticLetters = {
    A: 'Alpha',
    B: 'Bravo',
    C: 'Charlie',
    D: 'Delta',
    E: 'Echo',
    F: 'Foxtrot',
    G: 'Golf',
    H: 'Hotel',
    I: 'India',
    J: 'Juliett',
    K: 'Kilo',
    L: 'Lima',
    M: 'Mike',
    N: 'November',
    O: 'Oscar',
    P: 'Papa',
    Q: 'Quebec',
    R: 'Romeo',
    S: 'Sierra',
    T: 'Tango',
    U: 'Uniform',
    V: 'Victor',
    W: 'Whiskey',
    X: 'X‑ray',
    Y: 'Yankee',
    Z: 'Zulu',
  };
  const phoneticNumbers = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Niner',
  };

  function toPhonetic(callsign) {
    // Convert callsign like 'H332' to spoken phrase 'Hotel Three Three Two'
    return callsign
      .toUpperCase()
      .split('')
      .map((ch) => {
        if (phoneticLetters[ch]) return phoneticLetters[ch];
        if (phoneticNumbers[ch]) return phoneticNumbers[ch];
        return ch;
      })
      .join(' ');
  }

  // Airplane class representing a single aircraft
  class Airplane {
    constructor(type, callsign, x, y, heading, speed, altitude, model = '', airline = '') {
      this.type = type; // 'H', 'M', 'L'
      this.callsign = callsign;
      this.model = model;
      this.airline = airline;
      this.x = x;
      this.y = y;
      this.heading = heading; // degrees
      this.speed = speed; // knots
      this.altitude = altitude; // feet
      this.targetAltitude = altitude;
      this.color = this.getColor();
      this.size = this.getSize();
      this.active = true;
      // Additional state for gameplay
      // Status can be: 'air', 'ground', 'taxi', 'takeoff_wait', 'taking_off', 'approach_requested', 'approach', 'taxi_in'
      this.status = 'air';
      // Timestamp for next event (approach request or taxi progress)
      this.nextEventTime = 0;
      // Track if approach has been requested
      this.approachRequested = false;
      // For ground operations: when taxi started
      this.taxiStartTime = 0;
      // Target coordinates for taxi‑in to gate after landing.  When an aircraft
      // transitions to the `taxi_in` status, these values are set to a
      // destination point on the radar (representing the terminal/gate).
      this.targetX = null;
      this.targetY = null;
      // Trail of past positions for drawing track lines.  Each element is
      // {x, y} representing a previous position.  We limit its length to
      // maintain performance while providing a visual history.
      this.trail = [];
    }
    getColor() {
      // Colors chosen per weight class: heavy = white, medium = yellow, light = green【807708321175031†L41-L55】
      switch (this.type) {
        case 'H':
          return '#ffffff';
        case 'M':
          return '#ffdd00';
        case 'L':
        default:
          return '#00ff66';
      }
    }
    getSize() {
      switch (this.type) {
        case 'H':
          return 6;
        case 'M':
          return 5;
        case 'L':
        default:
          return 4;
      }
    }
    update(dt) {
      // Convert speed (knots) to pixels per second using an arbitrary scale.
      // Convert knots to pixels per second.  Reduce this factor to slow
      // aircraft movement on screen.  Lowering it improves playability
      // because airplanes no longer rush across the radar too quickly.
      const speedFactor = 0.03;
      const velocity = this.speed * speedFactor;
      const rad = (this.heading * Math.PI) / 180;
      this.x += Math.cos(rad) * velocity * dt;
      this.y += Math.sin(rad) * velocity * dt;
      // Smooth altitude change towards target
      const altDelta = this.targetAltitude - this.altitude;
      if (Math.abs(altDelta) > 10) {
        this.altitude += Math.sign(altDelta) * 100 * dt; // change 100 ft per second
      }

      // Record current position into the trail for rendering track lines.  Push
      // after moving so that the most recent position is stored.  If the
      // trail exceeds 30 points, remove the oldest to keep the array small.
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 30) this.trail.shift();
    }
    draw(ctx) {
      // Draw track lines showing the recent path of the aircraft.  Use a
      // semi‑transparent stroke so the history is subtle.  We only draw
      // when there are at least two points in the trail.
      if (this.trail && this.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }
      // Draw vector arrow representing aircraft
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.heading * Math.PI) / 180);
      ctx.fillStyle = this.color;
      // Arrow body
      ctx.beginPath();
      ctx.moveTo(-this.size * 1.5, -this.size / 2);
      ctx.lineTo(this.size * 1.5, 0);
      ctx.lineTo(-this.size * 1.5, this.size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Labels: callsign above, altitude and speed below
      ctx.font = '12px Roboto Mono';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      // Callsign
      ctx.fillText(this.callsign, this.x, this.y - 14);
      // Model text in smaller font
      ctx.font = '10px Roboto Mono';
      ctx.fillText(this.model, this.x, this.y - 2);
      // Altitude and speed
      ctx.font = '12px Roboto Mono';
      ctx.fillText(
        `${Math.round(this.altitude).toLocaleString()}ft @ ${Math.round(this.speed)}kt`,
        this.x,
        this.y + 16
      );
      // Highlight selected plane
      if (this === selectedPlane) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function spawnPlane() {
    if (planes.length >= maxPlanes) return;
    const types = ['H', 'M', 'L'];
    const type = types[Math.floor(Math.random() * types.length)];
    // Select a model appropriate for the weight class
    const modelList = aircraftModels[type] || ['Generic'];
    const model = modelList[Math.floor(Math.random() * modelList.length)];
    let airlineName = '';
    let callsign = '';
    // For heavy and medium aircraft, choose a real airline and generate a
    // callsign using its ICAO prefix.  For light aircraft, generate a
    // registration number typical of private aviation.
    if (type === 'H' || type === 'M') {
      const eligible = airlines.filter((a) => a.types.includes(type));
      const selectedAir = eligible[Math.floor(Math.random() * eligible.length)];
      airlineName = selectedAir.name;
      const number = Math.floor(Math.random() * 900) + 100;
      callsign = `${selectedAir.prefix}${number}`;
    } else {
      // Light aircraft: Brazilian/US registration prefix followed by three letters
      const regPrefixes = ['PP', 'PR', 'PT', 'PU', 'PH', 'N'];
      const prefix = regPrefixes[Math.floor(Math.random() * regPrefixes.length)];
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let suffix = '';
      for (let i = 0; i < 3; i++) suffix += letters[Math.floor(Math.random() * letters.length)];
      callsign = `${prefix}${suffix}`;
      airlineName = 'Private';
    }
    // Determine whether this plane spawns on the ground or in the air
    const isGround = Math.random() < groundSpawnProbability;
    let x, y, heading, speed, altitude;
    if (isGround) {
      // Ground spawn starts near the terminal/gate.  Place towards the bottom right
      // of the radar.  Aircraft will taxi from the gate to the runway centre.
      x = radarWidth * 0.85;
      y = radarHeight * 0.85;
      // Initial heading toward the runway centre (rotate from gate to center)
      const dx = radarWidth / 2 - x;
      const dy = radarHeight / 2 - y;
      const angleRad = Math.atan2(dy, dx);
      heading = (angleRad * 180) / Math.PI + 90;
      speed = 0;
      altitude = 0;
    } else {
      // Spawn in the air on the edges
      const edge = Math.floor(Math.random() * 4);
      const margin = 20;
      switch (edge) {
        case 0: // top
          x = Math.random() * radarWidth;
          y = -margin;
          heading = 90 + Math.random() * 180 - 90; // aim downward but slightly left/right
          break;
        case 1: // right
          x = radarWidth + margin;
          y = Math.random() * radarHeight;
          heading = 180 + Math.random() * 180 - 90; // aim leftwards
          break;
        case 2: // bottom
          x = Math.random() * radarWidth;
          y = radarHeight + margin;
          heading = -90 + Math.random() * 180 - 90; // aim upward
          break;
        case 3: // left
        default:
          x = -margin;
          y = Math.random() * radarHeight;
          heading = 0 + Math.random() * 180 - 90; // aim rightwards
          break;
      }
      // Generate a slower initial speed.  This range (150–250 knots) makes aircraft
      // movement more manageable compared with the original 200–400 knots.
      speed = 150 + Math.random() * 100; // 150–250 knots
      altitude = 10000 + Math.random() * 10000; // 10,000–20,000 ft
    }
    const plane = new Airplane(type, callsign, x, y, heading, speed, altitude, model, airlineName);
    // Set status and schedule events
    if (isGround) {
      plane.status = 'ground';
      // Immediately queue taxi request from pilot
      logMessage(
        `${toPhonetic(callsign)} solicita táxi`,
        'pilot',
        true,
        `${toPhonetic(callsign)} requesting taxi`
      );
    } else {
      plane.status = 'air';
      // Schedule approach request after a random delay (15–30 seconds)
      const delay = 15000 + Math.random() * 15000;
      plane.nextEventTime = performance.now() + delay;
      // Announce aircraft entry via pilot message.  Display Portuguese text while
      // speaking the English phrase.  E.g., "Hotel Three Three Two entrou no setor a 10 mil pés".
      const level = Math.round(altitude / 1000);
      const englishEntry = `${toPhonetic(callsign)} entering sector at ${level} thousand feet`;
      const portugueseEntry = `${toPhonetic(callsign)} entrou no setor a ${level} mil pés`;
      logMessage(portugueseEntry, 'pilot', true, englishEntry);
    }
    planes.push(plane);
  }

  function drawRadarGrid() {
    // Clear background
    ctx.fillStyle = 'rgba(5, 22, 34, 1)';
    ctx.fillRect(0, 0, radarWidth, radarHeight);
    // Draw concentric circles (range rings)
    ctx.strokeStyle = '#1f3a5a';
    ctx.lineWidth = 1;
    const rings = 5;
    for (let i = 1; i <= rings; i++) {
      const radius = (Math.min(radarWidth, radarHeight) / 2 / rings) * i;
      ctx.beginPath();
      ctx.arc(radarWidth / 2, radarHeight / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Draw cross hairs (North/South, East/West)
    ctx.beginPath();
    ctx.moveTo(radarWidth / 2, 0);
    ctx.lineTo(radarWidth / 2, radarHeight);
    ctx.moveTo(0, radarHeight / 2);
    ctx.lineTo(radarWidth, radarHeight / 2);
    ctx.stroke();

    // Draw additional radial lines to enhance realism.  Divide the circle
    // into 8 segments (every 45°) emanating from the centre.  These lines
    // provide bearing references similar to professional radar scopes.
    const radialCount = 8;
    ctx.strokeStyle = '#1f3a5a';
    ctx.lineWidth = 1;
    for (let i = 0; i < radialCount; i++) {
      const angle = (Math.PI * 2 * i) / radialCount;
      const endX = radarWidth / 2 + Math.cos(angle) * (Math.min(radarWidth, radarHeight) / 2);
      const endY = radarHeight / 2 + Math.sin(angle) * (Math.min(radarWidth, radarHeight) / 2);
      ctx.beginPath();
      ctx.moveTo(radarWidth / 2, radarHeight / 2);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw runway line based on current airport orientation
    if (currentAirport) {
      const angleDeg = currentAirport.runway || 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const length = Math.min(radarWidth, radarHeight) / 3;
      const cx = radarWidth / 2;
      const cy = radarHeight / 2;
      const x1 = cx - Math.cos(angleRad) * length;
      const y1 = cy - Math.sin(angleRad) * length;
      const x2 = cx + Math.cos(angleRad) * length;
      const y2 = cy + Math.sin(angleRad) * length;
      ctx.strokeStyle = '#003f5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Draw IATA code at the centre
      ctx.font = '14px Orbitron';
      ctx.fillStyle = '#00aaff';
      ctx.textAlign = 'center';
      ctx.fillText(currentAirport.iata, cx, cy - 8);
      // Compute runway numbers for each end (rounded heading / 10).  The
      // orientation provided is a magnetic heading in degrees; dividing by
      // 10 and rounding yields the runway designators【85487694131555†L123-L138】.
      const heading1 = angleDeg % 360;
      const heading2 = (angleDeg + 180) % 360;
      const num1 = Math.round(heading1 / 10);
      const num2Raw = Math.round(heading2 / 10);
      const num2 = num2Raw > 36 ? num2Raw - 36 : num2Raw;
      const pad = (n) => (n < 10 ? '0' + n : String(n));
      const text1 = pad(num1);
      const text2 = pad(num2);
      ctx.font = '16px Orbitron';
      ctx.fillStyle = '#00ffcc';
      // Position the numbers slightly beyond the ends of the runway line
      const offset = 20;
      ctx.textAlign = 'center';
      ctx.fillText(text1, x1 - Math.cos(angleRad) * offset, y1 - Math.sin(angleRad) * offset);
      ctx.fillText(text2, x2 + Math.cos(angleRad) * offset, y2 + Math.sin(angleRad) * offset);
    }
  }

  function update(currentTime) {
    const dt = currentTime - lastTime;
    lastTime = currentTime;
    // Spawn new planes periodically
    if (currentTime - lastSpawn > spawnInterval) {
      spawnPlane();
      lastSpawn = currentTime;
    }
    const deltaSeconds = dt / 1000;
    // Process each plane's state before updating position
    planes.forEach((plane) => {
      // Handle taxi out to runway
      if (plane.status === 'taxi') {
        // After 5 seconds of taxiing, move to takeoff wait
        if (currentTime - plane.taxiStartTime > 5000) {
          plane.status = 'takeoff_wait';
          plane.speed = 0;
          logMessage(
            `${toPhonetic(plane.callsign)} pronto para decolagem`,
            'pilot',
            true,
            `${toPhonetic(plane.callsign)} ready for takeoff`
          );
        }
      } else if (plane.status === 'taking_off') {
        // Accelerate and climb gradually during takeoff roll
        plane.speed += 50 * deltaSeconds; // increase 50 knots per second
        plane.altitude += 500 * deltaSeconds; // climb rate 500 ft per second
        if (plane.altitude >= 1000) {
          plane.status = 'air';
          // Schedule next approach request after a random delay
          const delay = 15000 + Math.random() * 15000;
          plane.nextEventTime = performance.now() + delay;
          logMessage(
            `${toPhonetic(plane.callsign)} decolou`,
            'pilot',
            true,
            `${toPhonetic(plane.callsign)} is airborne`
          );
        }
      } else if (plane.status === 'air' || plane.status === 'approach') {
        // Check if it's time to request approach.  Only ask once per flight
        if (
          plane.status === 'air' &&
          !plane.approachRequested &&
          plane.nextEventTime > 0 &&
          currentTime >= plane.nextEventTime
        ) {
          plane.approachRequested = true;
          plane.status = 'approach_requested';
          logMessage(
            `${toPhonetic(plane.callsign)} solicita aproximação`,
            'pilot',
            true,
            `${toPhonetic(plane.callsign)} requesting approach`
          );
        }
      } else if (plane.status === 'taxi_in') {
        // Taxiing in to the gate after landing.  Adjust heading towards target and
        // maintain a slow taxi speed.  Once the aircraft reaches its target,
        // removal and scoring is handled in the filter below.
        if (plane.targetX !== null && plane.targetY !== null) {
          const dx = plane.targetX - plane.x;
          const dy = plane.targetY - plane.y;
          const angleRad = Math.atan2(dy, dx);
          plane.heading = (angleRad * 180) / Math.PI + 90;
          // Keep altitude at zero
          plane.altitude = 0;
          // Maintain a taxi speed of ~25 knots
          plane.speed = 25;
        }
      }
      // Update position based on current speed and heading
      plane.update(deltaSeconds);
    });
    // Remove planes that leave the radar or reach the center
    planes = planes.filter((plane) => {
      // If an aircraft is taxiing in to the gate, check if it has reached its destination
      if (plane.status === 'taxi_in' && plane.targetX !== null && plane.targetY !== null) {
        const gdx = plane.x - plane.targetX;
        const gdy = plane.y - plane.targetY;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
        const gateThreshold = 20;
        if (gdist < gateThreshold) {
          // Aircraft has arrived at the gate.  Award a small bonus and remove it.
          score += 5;
          updateScoreboard();
          const english = `${toPhonetic(plane.callsign)} reached the gate`;
          const portuguese = `${toPhonetic(plane.callsign)} chegou ao gate`;
          logMessage(portuguese, 'pilot', true, english);
          return false;
        }
      }
      // Landing detection: when an aircraft in the air reaches the center it is considered to have landed
      const dx = plane.x - radarWidth / 2;
      const dy = plane.y - radarHeight / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const centerThreshold = 40;
      if (
        distance < centerThreshold &&
        plane.altitude > 0 &&
        plane.status !== 'ground' &&
        plane.status !== 'taxi' &&
        plane.status !== 'takeoff_wait' &&
        plane.status !== 'taxi_in'
      ) {
        // Aircraft has touched down.  Transition to taxi‑in instead of removal.
        score += 10;
        updateScoreboard();
        // Set altitude to zero and assign taxi‑in status
        plane.altitude = 0;
        plane.status = 'taxi_in';
        // Determine a target gate position near the bottom right of the radar
        plane.targetX = radarWidth * 0.85;
        plane.targetY = radarHeight * 0.85;
        // Announce landing and taxi to gate
        const english = `${toPhonetic(plane.callsign)} landed successfully and taxiing to gate`;
        const portuguese = `${toPhonetic(plane.callsign)} pousou com sucesso e taxiando para o gate`;
        logMessage(portuguese, 'pilot', true, english);
        return true;
      }
      // Remove if far outside bounds
      const buffer = 50;
      if (
        plane.x < -buffer ||
        plane.x > radarWidth + buffer ||
        plane.y < -buffer ||
        plane.y > radarHeight + buffer
      ) {
        // Plane left sector without clearance
        score -= 5;
        updateScoreboard();
        const english = `${toPhonetic(plane.callsign)} left sector without clearance`;
        const portuguese = `${toPhonetic(plane.callsign)} saiu do setor sem autorização`;
        logMessage(portuguese, 'pilot', true, english);
        return false;
      }
      return true;
    });
    // Collision detection: check each pair once (only for aircraft in the air)
    for (let i = 0; i < planes.length; i++) {
      for (let j = i + 1; j < planes.length; j++) {
        const a = planes[i];
        const b = planes[j];
        // Only consider collision if both planes are airborne
        if (a.altitude > 0 && b.altitude > 0) {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const separation = Math.sqrt(dx * dx + dy * dy);
          const minSep = 20;
          if (separation < minSep) {
            score -= 10;
            updateScoreboard();
            const english = `Collision alert between ${toPhonetic(a.callsign)} and ${toPhonetic(
              b.callsign
            )}!`;
            const portuguese = `Alerta de colisão entre ${toPhonetic(a.callsign)} e ${toPhonetic(
              b.callsign
            )}!`;
            logMessage(portuguese, 'system', true, english);
          }
        }
      }
    }
    // If the selected aircraft was removed, clear the panel. Otherwise keep it updated.
    if (selectedPlane && !planes.includes(selectedPlane)) {
      selectedPlane = null;
    }
    updateSelectedInfo();
    // Clear and redraw
    drawRadarGrid();
    planes.forEach((plane) => plane.draw(ctx));
    requestAnimationFrame(update);
  }

  // Logging with typewriter effect
  // Messages can optionally specify a separate speech text via the
  // `speechOverride` field to allow Portuguese text to be displayed while
  // English is spoken.  If `speak` is true, the speech synthesizer will
  // pronounce the override; otherwise it reads the displayed text.
  const messageQueue = [];
  let isTyping = false;
  function logMessage(text, sender = 'system', speak = false, speechOverride) {
    messageQueue.push({ text, sender, speak, speechOverride });
    processQueue();
  }
  function processQueue() {
    if (isTyping || messageQueue.length === 0) return;
    const { text, sender, speak, speechOverride } = messageQueue.shift();
    isTyping = true;
    const p = document.createElement('p');
    p.classList.add('log-line');
    // Add a class based on sender for potential styling
    p.classList.add(`log-${sender}`);
    logContainer.appendChild(p);
    // Ensure the container scrolls with new content
    logContainer.scrollTop = logContainer.scrollHeight;
    let index = 0;
    function typeNext() {
      if (index <= text.length) {
        p.textContent = text.slice(0, index);
        index++;
        setTimeout(typeNext, 30);
      } else {
        isTyping = false;
        // Speak message when complete
        if (speak) {
          const utterance = speechOverride || text;
          speakMessage(utterance, sender);
        }
        processQueue();
      }
    }
    typeNext();
  }

  // Speech synthesis
  //
  // Assign distinct voices for the controller and pilots.  When voices load,
  // we choose the first two English voices available.  The first is used for
  // controller and system messages; the second for pilot messages.  If fewer
  // than two English voices exist, both roles fallback to whatever is
  // available.  Register an event handler to refresh voices when the list
  // changes (as occurs asynchronously in some browsers).
  let controllerVoice = null;
  let pilotVoice = null;
  function initVoices() {
    if (!('speechSynthesis' in window)) return;
    const allVoices = window.speechSynthesis.getVoices();
    const english = allVoices.filter((v) => v.lang && v.lang.startsWith('en'));
    controllerVoice = english[0] || allVoices[0] || null;
    pilotVoice = english[1] || english[0] || allVoices[1] || allVoices[0] || null;
  }
  if ('speechSynthesis' in window) {
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }
  function speakMessage(text, sender) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    // Choose appropriate voice based on sender
    if (sender === 'pilot' && pilotVoice) {
      utter.voice = pilotVoice;
    } else if ((sender === 'controller' || sender === 'system') && controllerVoice) {
      utter.voice = controllerVoice;
    }
    // Slightly different pitch to distinguish roles
    utter.pitch = sender === 'pilot' ? 1.0 : 0.9;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  // Speech recognition
  let recognition;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      commandInput.value = transcript;
      handleCommand();
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };
  }

  function updateScoreboard() {
    scoreEl.textContent = score;
    // Level could be based on total score
    let newLevel = 1 + Math.floor(score / 50);
    if (newLevel < 1) newLevel = 1;
    if (newLevel !== level) {
      level = newLevel;
      levelEl.textContent = level;
      // Notify level up in Portuguese and speak English
      const english = `Level up! You are now level ${level}`;
      const portuguese = `Você subiu de nível! Agora está no nível ${level}`;
      logMessage(portuguese, 'system', true, english);
    }
  }

  // Populate the airport selector with options for each state
  function populateAirports() {
    airportSelect.innerHTML = '';
    airports.forEach((apt, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = `${apt.state} – ${apt.name} (${apt.iata})`;
      airportSelect.appendChild(opt);
    });
    // Default to São Paulo/Guarulhos (GRU) if available
    const defaultIndex = airports.findIndex((a) => a.iata === 'GRU');
    airportSelect.value = defaultIndex >= 0 ? defaultIndex : 0;
    currentAirport = airports[airportSelect.value];
    updateAirportHeader();
  }

  /**
   * Translate internal aircraft status codes into human‑readable Portuguese.
   */
  function statusToPortuguese(status) {
    switch (status) {
      case 'ground':
        return 'em solo';
      case 'taxi':
        return 'taxiando';
      case 'takeoff_wait':
        return 'aguardando decolagem';
      case 'taking_off':
        return 'decolando';
      case 'air':
        return 'em voo';
      case 'approach_requested':
        return 'solicitou aproximação';
      case 'approach':
        return 'em aproximação';
      case 'taxi_in':
        return 'taxiando ao gate';
      default:
        return status;
    }
  }

  /**
   * Update the selected aircraft information panel.  Displays callsign, model,
   * altitude, speed and current status.  If no aircraft is selected, shows a
   * placeholder message.
   */
  function updateSelectedInfo() {
    const infoEl = document.getElementById('selected-info-content');
    if (!infoEl) return;
    if (!selectedPlane) {
      infoEl.textContent = 'Nenhuma aeronave selecionada.';
      return;
    }
    const alt = Math.round(selectedPlane.altitude);
    const spd = Math.round(selectedPlane.speed);
    const statusPt = statusToPortuguese(selectedPlane.status);
    infoEl.innerHTML = `<strong>${selectedPlane.callsign}</strong> (${selectedPlane.model})<br>` +
      `Alt: ${alt.toLocaleString()} ft<br>` +
      `Vel: ${spd} kt<br>` +
      `Estado: ${statusPt}`;
  }

  // Update the page header with the selected airport
  function updateAirportHeader() {
    if (currentAirport) {
      headerTitle.textContent = `Simulador ATC – ${currentAirport.name} (${currentAirport.iata})`;
    }
  }

  // Reset the game when changing airports
  function resetGame() {
    planes = [];
    score = 0;
    level = 1;
    updateScoreboard();
    lastSpawn = performance.now();
    // Scenario change message in Portuguese with English speech
    const english = `Scenario changed to ${currentAirport.name}`;
    const portuguese = `Cenário alterado para ${currentAirport.name}`;
    logMessage(portuguese, 'system', true, english);
  }

  // Command parsing and execution
  function handleCommand() {
    const raw = commandInput.value.trim();
    if (!raw) return;
    // Immediately clear input
    commandInput.value = '';
    // Split tokens by spaces
    const parts = raw.split(/\s+/);
    if (parts.length < 2) {
      const englishMsg = `Invalid command format: ${raw}`;
      const portugueseMsg = `Formato de comando inválido: ${raw}`;
      logMessage(portugueseMsg, 'system', true, englishMsg);
      return;
    }
    const callsign = parts[0].toUpperCase();
    const cmd = parts[1].toUpperCase();
    const targetPlane = planes.find((p) => p.callsign === callsign);
    if (!targetPlane) {
      const englishMsg = `No aircraft with callsign ${callsign}`;
      const portugueseMsg = `Nenhuma aeronave com o indicativo ${callsign}`;
      logMessage(portugueseMsg, 'system', true, englishMsg);
      return;
    }
    // Compose separate English and Portuguese phrases
    let phraseEn = `${toPhonetic(callsign)}, `;
    let phrasePt = `${toPhonetic(callsign)}, `;
    switch (cmd) {
      case 'TL':
      case 'TR': {
        if (parts.length < 3) {
          const en = 'Heading not specified';
          const pt = 'Rumo não especificado';
          logMessage(pt, 'system', true, en);
          return;
        }
        const heading = parseFloat(parts[2]);
        if (isNaN(heading)) {
          const en = 'Invalid heading';
          const pt = 'Rumo inválido';
          logMessage(pt, 'system', true, en);
          return;
        }
        // Adjust heading absolute
        const newHeading = heading;
        targetPlane.heading = ((newHeading % 360) + 360) % 360;
        const dirEn = cmd === 'TL' ? 'turn left' : 'turn right';
        const dirPt = cmd === 'TL' ? 'vire à esquerda' : 'vire à direita';
        phraseEn += `${dirEn} heading ${heading}`;
        phrasePt += `${dirPt} para rumo ${heading}`;
        // Optional speed specification
        if (parts.length >= 4) {
          const newSpeed = parseFloat(parts[3]);
          if (!isNaN(newSpeed)) {
            targetPlane.speed = newSpeed;
            phraseEn += ` at ${newSpeed} knots`;
            phrasePt += ` a ${newSpeed} nós`;
          }
        }
        break;
      }
      case 'CL':
      case 'DS': {
        if (parts.length < 3) {
          const en = 'Altitude not specified';
          const pt = 'Altitude não especificada';
          logMessage(pt, 'system', true, en);
          return;
        }
        const altitude = parseFloat(parts[2]);
        if (isNaN(altitude)) {
          const en = 'Invalid altitude';
          const pt = 'Altitude inválida';
          logMessage(pt, 'system', true, en);
          return;
        }
        targetPlane.targetAltitude = altitude;
        const dirEn = cmd === 'CL' ? 'climb' : 'descend';
        const dirPt = cmd === 'CL' ? 'suba' : 'desça';
        phraseEn += `${dirEn} to ${altitude} feet`;
        phrasePt += `${dirPt} para ${altitude} pés`;
        break;
      }
      case 'SPD': {
        if (parts.length < 3) {
          const en = 'Speed not specified';
          const pt = 'Velocidade não especificada';
          logMessage(pt, 'system', true, en);
          return;
        }
        const speed = parseFloat(parts[2]);
        if (isNaN(speed)) {
          const en = 'Invalid speed';
          const pt = 'Velocidade inválida';
          logMessage(pt, 'system', true, en);
          return;
        }
        targetPlane.speed = speed;
        phraseEn += `maintain ${speed} knots`;
        phrasePt += `mantenha ${speed} nós`;
        break;
      }
      default: {
        const en = `Unknown command: ${cmd}`;
        const pt = `Comando desconhecido: ${cmd}`;
        logMessage(pt, 'system', true, en);
        return;
      }
    }
    // Controller issues command: display Portuguese and speak English
    logMessage(phrasePt, 'controller', true, phraseEn);
    // Pilot acknowledges: Portuguese with English voice
    const pilotEn = `Roger, ${toPhonetic(callsign)}. ${phraseEn}`;
    const pilotPt = `Entendido, ${toPhonetic(callsign)}. ${phrasePt}`;
    logMessage(pilotPt, 'pilot', true, pilotEn);
    score += 1;
    updateScoreboard();
  }

  /**
   * Send a quick command to the currently selected aircraft.  Quick commands
   * provide one‑click actions for common instructions like approach (APP),
   * altitude adjustments (ALT+/ALT‑), speed adjustments (SPD+/SPD‑), 90° turns
   * (TL90/TR90), taxi clearance (TAXI) and takeoff clearance (TOF).  If no
   * aircraft is selected, the user is prompted to select one by clicking
   * on the radar.  Each command generates Portuguese text for the log while
   * synthesising the equivalent English phrase for audio.  Points are
   * awarded for issuing valid instructions.
   */
  function sendQuickCommand(action) {
    if (!selectedPlane) {
      logMessage(
        'Selecione uma aeronave clicando no radar antes de enviar o comando.',
        'system',
        true,
        'Select an aircraft on the radar before issuing a command.'
      );
      return;
    }
    const callsign = selectedPlane.callsign;
    let phrasePt = `${toPhonetic(callsign)}, `;
    let phraseEn = `${toPhonetic(callsign)}, `;
    let valid = true;
    switch (action) {
      case 'APP': {
        // Approach clearance: align with runway and descend to 3000 ft
        const runwayHeading = currentAirport ? currentAirport.runway || 90 : 90;
        selectedPlane.heading = runwayHeading;
        selectedPlane.targetAltitude = 3000;
        // ensure speed is not too low when beginning approach
        selectedPlane.speed = Math.max(selectedPlane.speed, 150);
        selectedPlane.status = 'approach';
        phrasePt += 'autorizado para aproximação. Alinhe com a pista e desça para 3 mil pés';
        phraseEn += 'cleared for approach. Align with the runway and descend to three thousand feet';
        break;
      }
      case 'ALT+': {
        const newAlt = selectedPlane.targetAltitude + 1000;
        selectedPlane.targetAltitude = newAlt;
        phrasePt += `suba para ${newAlt} pés`;
        phraseEn += `climb to ${newAlt} feet`;
        break;
      }
      case 'ALT-': {
        let newAlt = selectedPlane.targetAltitude - 1000;
        if (newAlt < 0) newAlt = 0;
        selectedPlane.targetAltitude = newAlt;
        phrasePt += `desça para ${newAlt} pés`;
        phraseEn += `descend to ${newAlt} feet`;
        break;
      }
      case 'SPD+': {
        selectedPlane.speed += 20;
        phrasePt += `aumente a velocidade para ${Math.round(selectedPlane.speed)} nós`;
        phraseEn += `increase speed to ${Math.round(selectedPlane.speed)} knots`;
        break;
      }
      case 'SPD-': {
        selectedPlane.speed = Math.max(40, selectedPlane.speed - 20);
        phrasePt += `reduza a velocidade para ${Math.round(selectedPlane.speed)} nós`;
        phraseEn += `reduce speed to ${Math.round(selectedPlane.speed)} knots`;
        break;
      }
      case 'TL90': {
        selectedPlane.heading = ((selectedPlane.heading - 90) % 360 + 360) % 360;
        phrasePt += 'vire 90 graus à esquerda';
        phraseEn += 'turn left ninety degrees';
        break;
      }
      case 'TR90': {
        selectedPlane.heading = ((selectedPlane.heading + 90) % 360 + 360) % 360;
        phrasePt += 'vire 90 graus à direita';
        phraseEn += 'turn right ninety degrees';
        break;
      }
      case 'START': {
        // Engine start clearance.  Only valid for aircraft on the ground that
        // have not yet begun taxi.  Do not change aircraft state but
        // acknowledge that engines may be started.
        if (selectedPlane.status === 'ground') {
          phrasePt += 'autorizado ligar motores. Aguarde pushback';
          phraseEn += 'start engines approved. Stand by for pushback';
        } else {
          valid = false;
        }
        break;
      }
      case 'PUSH': {
        // Pushback clearance.  Transition from ground to taxi.  Aircraft will
        // taxi out towards the runway at a slow speed.
        if (selectedPlane.status === 'ground') {
          selectedPlane.status = 'taxi';
          selectedPlane.taxiStartTime = performance.now();
          selectedPlane.speed = 30;
          phrasePt += 'autorizado pushback e táxi até a pista';
          phraseEn += 'pushback and taxi to the runway approved';
        } else {
          valid = false;
        }
        break;
      }
      case 'LUW': {
        // Line up and wait.  Aircraft must be taxiing towards the runway.
        if (selectedPlane.status === 'taxi') {
          selectedPlane.status = 'takeoff_wait';
          selectedPlane.speed = 0;
          phrasePt += 'autorizado alinhar e aguardar na pista';
          phraseEn += 'cleared to line up and wait';
        } else {
          valid = false;
        }
        break;
      }
      case 'FINAL': {
        // Final approach clearance.  Valid only for aircraft already on
        // approach.  Sets a lower target altitude and instructs to continue
        // descent.  We reuse the approach state rather than introducing a
        // separate state.
        if (selectedPlane.status === 'approach') {
          selectedPlane.targetAltitude = 1000;
          phrasePt += 'autorizado na final. Continue descendo para mil pés';
          phraseEn += 'cleared final. Continue descending to one thousand feet';
        } else {
          valid = false;
        }
        break;
      }
      case 'TAXI': {
        if (selectedPlane.status === 'ground') {
          selectedPlane.status = 'taxi';
          selectedPlane.taxiStartTime = performance.now();
          selectedPlane.speed = 40; // taxi speed in knots
          phrasePt += 'autorizado para táxi até a pista';
          phraseEn += 'cleared to taxi to the runway';
        } else {
          valid = false;
        }
        break;
      }
      case 'TOF': {
        if (selectedPlane.status === 'takeoff_wait') {
          selectedPlane.status = 'taking_off';
          selectedPlane.speed = Math.max(selectedPlane.speed, 100);
          phrasePt += 'autorizado para decolagem';
          phraseEn += 'cleared for takeoff';
        } else {
          valid = false;
        }
        break;
      }
      default: {
        valid = false;
        break;
      }
    }
    if (!valid) {
      logMessage(
        'Comando rápido inválido para o estado da aeronave.',
        'system',
        true,
        'Quick command not valid for the current aircraft state.'
      );
      return;
    }
    // Controller issues instruction
    logMessage(phrasePt, 'controller', true, phraseEn);
    // Pilot acknowledgement
    const ackPt = `Entendido, ${toPhonetic(callsign)}. ${phrasePt}`;
    const ackEn = `Roger, ${toPhonetic(callsign)}. ${phraseEn}`;
    logMessage(ackPt, 'pilot', true, ackEn);
    score += 1;
    updateScoreboard();
  }

  // Event listeners
  sendBtn.addEventListener('click', handleCommand);
  commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleCommand();
  });
  voiceBtn.addEventListener('click', () => {
    if (recognition) {
      recognition.start();
      // Inform the user in Portuguese without speech
      logMessage('Ouvindo comando…', 'system', false);
    } else {
      const en = 'Voice recognition not supported in this browser';
      const pt = 'Reconhecimento de voz não suportado neste navegador';
      logMessage(pt, 'system', true, en);
    }
  });

  // Handle clicks on quick command buttons
  if (quickCommandsEl) {
    quickCommandsEl.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('quick-btn')) {
        const action = target.dataset.action;
        if (action) {
          sendQuickCommand(action);
        }
      }
    });
  }

  // Allow selecting an aircraft by clicking on the radar.  When the user
  // clicks near an aircraft symbol, that plane becomes highlighted and its
  // callsign is pre‑filled in the command input for convenience.
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let closest = null;
    let minDist = Infinity;
    planes.forEach((plane) => {
      const dx = plane.x - x;
      const dy = plane.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist < plane.size * 3) {
        closest = plane;
        minDist = dist;
      }
    });
    if (closest) {
      selectedPlane = closest;
      // Pre‑fill the callsign in the command input for typing commands
      commandInput.value = `${closest.callsign} `;
      // Update selected aircraft panel
      updateSelectedInfo();
      // Notify user about selection (Portuguese text, English speech)
      logMessage(
        `${toPhonetic(closest.callsign)} selecionado`,
        'system',
        true,
        `${toPhonetic(closest.callsign)} selected`
      );
    }
  });

  // Handle airport selection changes
  airportSelect.addEventListener('change', () => {
    const idx = parseInt(airportSelect.value, 10);
    currentAirport = airports[idx];
    updateAirportHeader();
    resetGame();
  });

  // Kick off scoreboard and populate airports but do not start the simulation
  // until the user clicks the start button in the lobby.  The lobby overlay
  // hides the main interface; once dismissed, the main elements are revealed
  // and the radar update loop begins.
  updateScoreboard();
  populateAirports();

  // Register service worker for offline/PWA support only when served over HTTPS.
  // Service workers are not available on the file:// protocol, so wrap in a
  // protocol check to avoid runtime errors during local development.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
    navigator.serviceWorker.register('sw.js?v=2026-03-21-16-35-v7').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  }

  // Listen for the beforeinstallprompt event to show the Android install button.
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-block';
    }
  });
  // Handle install button click
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result && result.outcome === 'accepted') {
        logMessage('Aplicativo instalado.', 'system', true, 'App installed.');
      }
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  // Hide main content and header initially; they will be shown once the lobby is dismissed.
  const mainEl = document.querySelector('main');
  const footerEl = document.querySelector('footer');
  // Set the build/version information in the footer.  This makes the
  // version and timestamp visible to the player without requiring code
  // changes in the HTML.
  const buildEl = document.getElementById('build-info');
  if (buildEl) {
    buildEl.textContent = `Build ${buildInfo}`;
  }
  // main and footer are visible only after start
  mainEl.style.display = 'none';
  footerEl.style.display = 'none';

  // When the start button is clicked, hide the lobby, show the rest of the UI,
  // update the header visibility, and kick off the animation loop.
  /**
   * Start the simulation.  This function is exposed globally so that the
   * start button in the HTML can call it directly via onclick.  It hides
   * the lobby overlay, reveals the main interface and header, and kicks off
   * the animation loop for the radar.  If the game is restarted via a
   * scenario change, this function can be invoked again to resume play.
   */
  window.startSimulation = function () {
    lobby.style.display = 'none';
    document.querySelector('header').style.display = 'block';
    mainEl.style.display = 'flex';
    footerEl.style.display = 'block';
    // Start the animation loop
    requestAnimationFrame((time) => {
      lastTime = time;
      lastSpawn = time;
      update(time);
    });
  };
})();