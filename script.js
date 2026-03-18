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

  // Game state
  let planes = [];
  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  let level = 1;
  const spawnInterval = 8000; // milliseconds between new aircraft
  const maxPlanes = 5;

  // Airport database: one airport per Brazilian state plus the federal district.
  // Each object contains the state code, the airport’s common name and its IATA code.
  const airports = [
    { state: 'AC', name: 'Rio Branco International', iata: 'RBR', runway: 90 },
    { state: 'AL', name: 'Maceió/Zumbi dos Palmares', iata: 'MCZ', runway: 110 },
    { state: 'AP', name: 'Macapá/Alberto Alcolumbre', iata: 'MCP', runway: 90 },
    { state: 'AM', name: 'Manaus/Eduardo Gomes', iata: 'MAO', runway: 100 },
    { state: 'BA', name: 'Salvador Deputado Luís E. Magalhães', iata: 'SSA', runway: 90 },
    { state: 'CE', name: 'Fortaleza Pinto Martins', iata: 'FOR', runway: 100 },
    { state: 'DF', name: 'Brasília International', iata: 'BSB', runway: 110 },
    { state: 'ES', name: 'Vitória Eurico de Aguiar Salles', iata: 'VIX', runway: 100 },
    { state: 'GO', name: 'Goiânia Santa Genoveva', iata: 'GYN', runway: 110 },
    { state: 'MA', name: 'São Luís Marechal Cunha Machado', iata: 'SLZ', runway: 90 },
    { state: 'MT', name: 'Cuiabá Marechal Rondon', iata: 'CGB', runway: 90 },
    { state: 'MS', name: 'Campo Grande International', iata: 'CGR', runway: 110 },
    { state: 'MG', name: 'Belo Horizonte/Confins', iata: 'CNF', runway: 90 },
    { state: 'PA', name: 'Belém Val-de-Cans', iata: 'BEL', runway: 90 },
    { state: 'PB', name: 'João Pessoa Castro Pinto', iata: 'JPA', runway: 100 },
    { state: 'PR', name: 'Curitiba Afonso Pena', iata: 'CWB', runway: 110 },
    { state: 'PE', name: 'Recife/Guararapes', iata: 'REC', runway: 90 },
    { state: 'PI', name: 'Teresina Senador Petrônio Portella', iata: 'THE', runway: 110 },
    { state: 'RJ', name: 'Rio de Janeiro/Galeão', iata: 'GIG', runway: 100 },
    { state: 'RN', name: 'Natal Augusto Severo', iata: 'NAT', runway: 100 },
    { state: 'RS', name: 'Porto Alegre Salgado Filho', iata: 'POA', runway: 90 },
    { state: 'RO', name: 'Porto Velho Belmonte', iata: 'PVH', runway: 100 },
    { state: 'RR', name: 'Boa Vista International', iata: 'BVB', runway: 90 },
    { state: 'SC', name: 'Florianópolis Hercílio Luz', iata: 'FLN', runway: 110 },
    { state: 'SP', name: 'São Paulo/Guarulhos', iata: 'GRU', runway: 100 },
    { state: 'SE', name: 'Aracaju Santa Maria', iata: 'AJU', runway: 100 },
    { state: 'TO', name: 'Palmas Brigadeiro Lysias Rodrigues', iata: 'PMW', runway: 90 },
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
    constructor(type, callsign, x, y, heading, speed, altitude) {
      this.type = type; // 'H', 'M', 'L'
      this.callsign = callsign;
      this.x = x;
      this.y = y;
      this.heading = heading; // degrees
      this.speed = speed; // knots
      this.altitude = altitude; // feet
      this.targetAltitude = altitude;
      this.color = this.getColor();
      this.size = this.getSize();
      this.active = true;
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
      const speedFactor = 0.05; // adjust to control plane speed on screen
      const velocity = this.speed * speedFactor;
      const rad = (this.heading * Math.PI) / 180;
      this.x += Math.cos(rad) * velocity * dt;
      this.y += Math.sin(rad) * velocity * dt;
      // Smooth altitude change towards target
      const altDelta = this.targetAltitude - this.altitude;
      if (Math.abs(altDelta) > 10) {
        this.altitude += Math.sign(altDelta) * 100 * dt; // change 100 ft per second
      }
    }
    draw(ctx) {
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
      ctx.fillText(this.callsign, this.x, this.y - 10);
      ctx.fillText(
        `${Math.round(this.altitude).toLocaleString()}ft @ ${Math.round(
          this.speed
        )}kt`,
        this.x,
        this.y + 14
      );
    }
  }

  function spawnPlane() {
    if (planes.length >= maxPlanes) return;
    const types = ['H', 'M', 'L'];
    const type = types[Math.floor(Math.random() * types.length)];
    // Generate 3‑digit number
    const number = Math.floor(Math.random() * 900) + 100;
    const callsign = `${type}${number}`;
    // Random spawn on edges: choose one of four edges
    const edge = Math.floor(Math.random() * 4);
    let x, y, heading;
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
    const speed = 200 + Math.random() * 200; // 200–400 knots
    const altitude = 10000 + Math.random() * 10000; // 10,000–20,000 ft
    const plane = new Airplane(type, callsign, x, y, heading, speed, altitude);
    planes.push(plane);
    // Announce aircraft entry via pilot message
    logMessage(
      `${toPhonetic(callsign)} entering sector at ${Math.round(
        altitude / 1000
      )} thousand feet`,
      'pilot',
      true
    );
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
    // Update planes
    const deltaSeconds = dt / 1000;
    planes.forEach((plane) => plane.update(deltaSeconds));
    // Remove planes that leave the radar or reach the center
    planes = planes.filter((plane) => {
      // If plane close to center, treat as landing success
      const dx = plane.x - radarWidth / 2;
      const dy = plane.y - radarHeight / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const centerThreshold = 40;
      if (distance < centerThreshold) {
        score += 10;
        updateScoreboard();
        logMessage(
          `${toPhonetic(plane.callsign)} landed successfully`,
          'pilot',
          true
        );
        return false;
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
        logMessage(
          `${toPhonetic(plane.callsign)} left sector without clearance`,
          'pilot',
          true
        );
        return false;
      }
      return true;
    });
    // Collision detection: check each pair once
    for (let i = 0; i < planes.length; i++) {
      for (let j = i + 1; j < planes.length; j++) {
        const a = planes[i];
        const b = planes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const separation = Math.sqrt(dx * dx + dy * dy);
        const minSep = 20;
        if (separation < minSep) {
          score -= 10;
          updateScoreboard();
          logMessage(
            `Collision alert between ${toPhonetic(a.callsign)} and ${toPhonetic(
              b.callsign
            )}!`,
            'system',
            true
          );
        }
      }
    }
    // Clear and redraw
    drawRadarGrid();
    planes.forEach((plane) => plane.draw(ctx));
    requestAnimationFrame(update);
  }

  // Logging with typewriter effect
  const messageQueue = [];
  let isTyping = false;
  function logMessage(text, sender = 'system', speak = false) {
    messageQueue.push({ text, sender, speak });
    processQueue();
  }
  function processQueue() {
    if (isTyping || messageQueue.length === 0) return;
    const { text, sender, speak } = messageQueue.shift();
    isTyping = true;
    const p = document.createElement('p');
    p.classList.add('log-line');
    logContainer.appendChild(p);
    // Scroll to bottom
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
        if (speak) speakMessage(text, sender);
        processQueue();
      }
    }
    typeNext();
  }

  // Speech synthesis
  function speakMessage(text, sender) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    // Choose voice: prefer English voices
    const voices = window.speechSynthesis.getVoices();
    for (const v of voices) {
      if (v.lang.startsWith('en')) {
        utter.voice = v;
        break;
      }
    }
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
    const newLevel = 1 + Math.floor(score / 50);
    if (newLevel !== level) {
      level = newLevel;
      levelEl.textContent = level;
      logMessage(`Level up! You are now level ${level}`, 'system', true);
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

  // Update the page header with the selected airport
  function updateAirportHeader() {
    if (currentAirport) {
      headerTitle.textContent = `ATC Simulator – ${currentAirport.name} (${currentAirport.iata})`;
    }
  }

  // Reset the game when changing airports
  function resetGame() {
    planes = [];
    score = 0;
    level = 1;
    updateScoreboard();
    lastSpawn = performance.now();
    logMessage(`Scenario changed to ${currentAirport.name}`, 'system', true);
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
      logMessage(`Invalid command format: ${raw}`, 'system', true);
      return;
    }
    const callsign = parts[0].toUpperCase();
    const cmd = parts[1].toUpperCase();
    const targetPlane = planes.find((p) => p.callsign === callsign);
    if (!targetPlane) {
      logMessage(`No aircraft with callsign ${callsign}`, 'system', true);
      return;
    }
    let phrase = `${toPhonetic(callsign)}, `;
    switch (cmd) {
      case 'TL':
      case 'TR': {
        if (parts.length < 3) {
          logMessage('Heading not specified', 'system', true);
          return;
        }
        const heading = parseFloat(parts[2]);
        if (isNaN(heading)) {
          logMessage('Invalid heading', 'system', true);
          return;
        }
        // Adjust heading left or right relative to current heading
        const newHeading = heading;
        targetPlane.heading = ((newHeading % 360) + 360) % 360;
        phrase +=
          (cmd === 'TL' ? 'turn left' : 'turn right') +
          ` heading ${heading}`;
        // Optional speed specification
        if (parts.length >= 4) {
          const newSpeed = parseFloat(parts[3]);
          if (!isNaN(newSpeed)) {
            targetPlane.speed = newSpeed;
            phrase += ` at ${newSpeed} knots`;
          }
        }
        break;
      }
      case 'CL':
      case 'DS': {
        if (parts.length < 3) {
          logMessage('Altitude not specified', 'system', true);
          return;
        }
        const altitude = parseFloat(parts[2]);
        if (isNaN(altitude)) {
          logMessage('Invalid altitude', 'system', true);
          return;
        }
        targetPlane.targetAltitude = altitude;
        phrase +=
          (cmd === 'CL' ? 'climb' : 'descend') + ` to ${altitude} feet`;
        break;
      }
      case 'SPD': {
        if (parts.length < 3) {
          logMessage('Speed not specified', 'system', true);
          return;
        }
        const speed = parseFloat(parts[2]);
        if (isNaN(speed)) {
          logMessage('Invalid speed', 'system', true);
          return;
        }
        targetPlane.speed = speed;
        phrase += `maintain ${speed} knots`;
        break;
      }
      default:
        logMessage(`Unknown command: ${cmd}`, 'system', true);
        return;
    }
    // Controller issues command
    logMessage(phrase, 'controller', true);
    // Pilot acknowledges
    logMessage(`Roger, ${toPhonetic(callsign)}. ${phrase}`, 'pilot', true);
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
      logMessage('Listening for command…', 'system', false);
    } else {
      logMessage('Voice recognition not supported in this browser', 'system', true);
    }
  });

  // Handle airport selection changes
  airportSelect.addEventListener('change', () => {
    const idx = parseInt(airportSelect.value, 10);
    currentAirport = airports[idx];
    updateAirportHeader();
    resetGame();
  });

  // Kick off animation loop
  updateScoreboard();
  // Populate airports after DOM and scoreboard are ready
  populateAirports();
  requestAnimationFrame((time) => {
    lastTime = time;
    lastSpawn = time;
    update(time);
  });
})();