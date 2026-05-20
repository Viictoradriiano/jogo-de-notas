// --- SISTEMA DE ÁUDIO & AFINAÇÃO ---
let audioCtx = null;
function getCtx() {
    if (!audioCtx) audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

const PITCH = { DO: 261.63, RE: 293.66, MI: 329.63, FA: 349.23, SOL: 392.00, LA: 440.00, SI: 493.88, DO_A: 523.25 };

function playClick(isFirst) {
    try { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = isFirst ? 1000 : 800; g.gain.setValueAtTime(0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.08); } catch(e) {}
}

let currentOscillator = null;
function playNoteTone(freq, durationInSeconds) {
    try { 
        if(currentOscillator) currentOscillator.stop(); 
        const c = getCtx();
        currentOscillator = c.createOscillator();
        const g = c.createGain(); 
        currentOscillator.type = 'triangle'; 
        currentOscillator.frequency.value = freq; 
        g.gain.setValueAtTime(0.2, c.currentTime); 
        g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + durationInSeconds); 
        currentOscillator.connect(g).connect(c.destination); 
        currentOscillator.start(); 
        currentOscillator.stop(c.currentTime + durationInSeconds); 
    } catch(e) {}
}

function sfxUp() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playNoteTone(f, 0.1), i * 80)); }

// --- MAPEAMENTO DOS HINOS COMPLETOS (Soprano - Primeira Estrofe) ---
const HINOS_CCB = [
    { 
        id: 1, titulo: "Hino 1 - Cristo meu Mestre", compasso: "4/4", bpm: 70, 
        seq: [
            {s:'𝅘𝅥', t:1, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:1, n:'FA', f:PITCH.FA}, {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'DO', f:PITCH.DO_A},
            {s:'𝅗𝅥', t:2, n:'SI', f:PITCH.SI}, {s:'𝅘𝅥', t:1, n:'LA', f:PITCH.LA}, {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL},
            {s:'𝅘𝅥', t:1, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:1, n:'FA', f:PITCH.FA}, {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'FA', f:PITCH.FA},
            {s:'𝅝', t:4, n:'MI', f:PITCH.MI}
        ] 
    },
    { 
        id: 15, titulo: "Hino 15 - Ó Senhor, Tu és a minha esperança", compasso: "4/4", bpm: 60, 
        seq: [
            {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'LA', f:PITCH.LA}, {s:'𝅘𝅥', t:1, n:'SI', f:PITCH.SI}, 
            {s:'𝅗𝅥', t:2, n:'DO', f:PITCH.DO_A}, {s:'𝅗𝅥', t:2, n:'DO', f:PITCH.DO_A},
            {s:'𝅘𝅥', t:1, n:'LA', f:PITCH.LA}, {s:'𝅘𝅥', t:1, n:'LA', f:PITCH.LA}, {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'FA', f:PITCH.FA},
            {s:'𝅝', t:4, n:'MI', f:PITCH.MI}
        ] 
    },
    { 
        id: 375, titulo: "Hino 375 - Grandioso é o nosso Deus", compasso: "6/8", bpm: 75, 
        seq: [
            {s:'𝅘𝅥', t:0.5, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:0.5, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:0.5, n:'SOL', f:PITCH.SOL}, 
            {s:'𝅘𝅥', t:1, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:0.5, n:'DO', f:PITCH.DO}, 
            {s:'𝅗𝅥', t:2, n:'RE', f:PITCH.RE}, {s:'𝅘𝅥', t:0.5, n:'FA', f:PITCH.FA}, {s:'𝅘𝅥', t:0.5, n:'FA', f:PITCH.FA},
            {s:'𝅘𝅥', t:1, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:0.5, n:'RE', f:PITCH.RE}, {s:'𝅗𝅥.', t:3, n:'DO', f:PITCH.DO}
        ] 
    },
    { 
        id: 454, titulo: "Hino 454 - Cidadão dos céus", compasso: "4/4", bpm: 60, 
        seq: [
            {s:'𝅘𝅥', t:1, n:'DO', f:PITCH.DO_A}, {s:'𝅘𝅥', t:0.25, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:0.25, n:'FA', f:PITCH.FA}, {s:'𝅘𝅥', t:0.5, n:'SOL', f:PITCH.SOL}, 
            {s:'𝅘𝅥', t:1, n:'LA', f:PITCH.LA}, {s:'𝅝', t:4, n:'SOL', f:PITCH.SOL},
            {s:'𝅘𝅥', t:1, n:'DO', f:PITCH.DO_A}, {s:'𝅘𝅥', t:0.25, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:0.25, n:'FA', f:PITCH.FA}, {s:'𝅘𝅥', t:0.5, n:'SOL', f:PITCH.SOL}, 
            {s:'𝅘𝅥', t:1, n:'FA', f:PITCH.FA}, {s:'𝅝', t:4, n:'MI', f:PITCH.MI}
        ] 
    },
    { 
        id: 39, titulo: "Hino 39 - Eu desejo, Senhor", compasso: "3/4", bpm: 65, 
        seq: [
            {s:'𝅘𝅥', t:1, n:'MI', f:PITCH.MI}, {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'DO', f:PITCH.DO_A},
            {s:'𝅗𝅥', t:2, n:'SI', f:PITCH.SI}, {s:'𝅘𝅥', t:1, n:'LA', f:PITCH.LA},
            {s:'𝅘𝅥', t:1, n:'SOL', f:PITCH.SOL}, {s:'𝅘𝅥', t:1, n:'FA', f:PITCH.FA}, {s:'𝅘𝅥', t:1, n:'MI', f:PITCH.MI},
            {s:'𝅗𝅥.', t:3, n:'RE', f:PITCH.RE}
        ] 
    }
];

const HIT_ZONE_X = 80;        
const PIXELS_PER_BEAT = 160;  

let currentIndex = 0;
let currentHymn = null;
let isPlaying = false;
let startTime = 0;
let msPerBeat = 0;

// Variáveis de Estatística
let score = 0;
let totalHits = 0;
let totalMisses = 0;
let activeNotes = []; 
let currentHoldNote = null; 
let isPlayerHolding = false;
let metronomeInterval = null;
let animationFrameId;

const btnStart = document.getElementById('btn-start');
const btnTap = document.getElementById('btn-tap');
const feedbackArea = document.getElementById('feedback-area');
const trackArea = document.getElementById('track-area');
const hitZone = document.getElementById('hit-zone');

window.fecharTutorial = function() {
    document.getElementById('tutorial-modal').classList.remove('active');
    renderMenuLayout();
}

function renderMenuLayout() {
    currentHymn = HINOS_CCB[currentIndex];
    document.getElementById('level-display').innerText = `Hinário - ${currentHymn.compasso}`;
    document.getElementById('bpm-display').innerText = `BPM: ${currentHymn.bpm}`;
    feedbackArea.innerText = currentHymn.titulo;
    feedbackArea.style.color = "var(--color-warning)";
    trackArea.innerHTML = '';
}

window.iniciarRodada = function() {
    if (isPlaying) return;
    isPlaying = true;
    btnStart.disabled = true;
    btnStart.innerText = "Louvando...";
    
    totalHits = 0;
    totalMisses = 0;
    score = 0;
    document.getElementById('score').innerText = score;

    msPerBeat = (60 / currentHymn.bpm) * 1000;
    trackArea.innerHTML = '';
    activeNotes = [];
    
    // As notas começam 4 tempos à frente (para o player se preparar)
    let currentBeatTarget = 4; 
    
    currentHymn.seq.forEach((n) => {
        const el = document.createElement('div');
        el.className = 'note-container';
        
        const head = document.createElement('div');
        head.className = 'note-head';
        head.innerText = n.s;
        
        const nameLabel = document.createElement('div');
        nameLabel.className = 'note-name';
        nameLabel.innerText = n.n;

        el.appendChild(head);
        el.appendChild(nameLabel);
        
        if (n.t > 0.5) {
            const tail = document.createElement('div');
            tail.className = 'note-tail';
            tail.style.width = (n.t * PIXELS_PER_BEAT) + 'px';
            el.appendChild(tail);
        }
        
        trackArea.appendChild(el);
        activeNotes.push({ el: el, beatTarget: currentBeatTarget, duration: n.t, hit: false, missed: false, n: n.n, f: n.f });
        currentBeatTarget += n.t;
    });

    startTime = performance.now();
    gameLoop();
    
    let prepBeats = 0;
    playClick(true);
    feedbackArea.innerText = "Prepare-se...";
    
    let tempoBase = parseInt(currentHymn.compasso.split('/')[0]); // Se for 3/4 conta 3, se 4/4 conta 4
    if(currentHymn.compasso === "6/8") tempoBase = 2; // 6/8 binário composto (2 pulsações)

    metronomeInterval = setInterval(() => {
        prepBeats++;
        if (prepBeats < 4) {
            playClick(false);
        } else {
            playClick(false);
            feedbackArea.innerText = "SOLFEJE / TOQUE!";
            iniciarMetronomoHino(currentHymn.seq.reduce((acc, n) => acc + n.t, 0), tempoBase);
        }
    }, msPerBeat);
}

function iniciarMetronomoHino(totalBeats, tempoBase) {
    let currentHymnBeat = 0;
    let hymnMetronome = setInterval(() => {
        currentHymnBeat++;
        if (currentHymnBeat <= totalBeats && isPlaying) {
            playClick(currentHymnBeat % tempoBase === 0); 
        } else {
            clearInterval(hymnMetronome);
        }
    }, msPerBeat);
}

function gameLoop() {
    if (!isPlaying) return;
    
    let now = performance.now();
    let elapsedBeats = (now - startTime) / msPerBeat; 
    let finalizado = true;
    
    activeNotes.forEach(note => {
        let noteX = HIT_ZONE_X + ((note.beatTarget - elapsedBeats) * PIXELS_PER_BEAT);
        note.el.style.left = noteX + 'px';
        
        if (noteX < HIT_ZONE_X - 45 && !note.hit && !note.missed) {
            note.missed = true;
            totalMisses++;
            note.el.classList.add('miss');
        }
        
        if (currentHoldNote === note && isPlayerHolding) {
            note.el.classList.add('holding');
            score += 2; 
            document.getElementById('score').innerText = Math.floor(score);
        } else {
            note.el.classList.remove('holding');
        }
        
        if (noteX > -400) finalizado = false; 
    });
    
    if (finalizado) finalizarRodada();
    else animationFrameId = requestAnimationFrame(gameLoop);
}

function pressTap() {
    if (!isPlaying) return;
    isPlayerHolding = true;
    hitZone.classList.add('active');
    btnTap.classList.add('holding');
    
    let now = performance.now();
    let elapsedBeats = (now - startTime) / msPerBeat;
    
    let notaAlvo = null;
    let margemTolerancia = 0.35; // Margem generosa para o acerto inicial
    
    activeNotes.forEach(note => {
        if (!note.hit && !note.missed) {
            let diferenca = Math.abs(note.beatTarget - elapsedBeats);
            if (diferenca < margemTolerancia) notaAlvo = note;
        }
    });
    
    if (notaAlvo) {
        notaAlvo.hit = true;
        totalHits++;
        notaAlvo.el.classList.add('hit');
        score += 50;
        
        let durationInSeconds = (notaAlvo.duration * msPerBeat) / 1000;
        playNoteTone(notaAlvo.f, durationInSeconds);
        
        let textFeedback = notaAlvo.n;
        if (notaAlvo.duration > 0.5) {
            currentHoldNote = notaAlvo;
            let vogal = notaAlvo.n.slice(-1); 
            textFeedback += vogal.repeat(4) + "!"; 
            feedbackArea.style.color = "var(--color-primary)";
        } else {
            textFeedback += "!";
            feedbackArea.style.color = "var(--color-success)";
        }
        feedbackArea.innerText = textFeedback;

    } else {
        totalMisses++;
        score = Math.max(0, score - 15);
        feedbackArea.innerText = "X";
        feedbackArea.style.color = "var(--color-error)";
    }
    document.getElementById('score').innerText = Math.floor(score);
}

function releaseTap() {
    isPlayerHolding = false;
    hitZone.classList.remove('active');
    btnTap.classList.remove('holding');
    
    if (currentHoldNote) {
        if(currentOscillator) currentOscillator.stop(); 
        currentHoldNote = null;
        feedbackArea.innerText = "Soltou antes da hora!";
        feedbackArea.style.color = "var(--color-warning)";
    }
}

btnTap.addEventListener('pointerdown', (e) => { e.preventDefault(); pressTap(); });
btnTap.addEventListener('pointerup', (e) => { e.preventDefault(); releaseTap(); });
btnTap.addEventListener('pointerleave', (e) => { e.preventDefault(); releaseTap(); });
document.addEventListener('keydown', (e) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); pressTap(); } });
document.addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); releaseTap(); } });

// --- GERAÇÃO DE FEEDBACK E RESUMO ---
function gerarDicaMSA(compasso, pct) {
    if (pct < 50) return "Sua métrica oscilou muito. No MSA, recomendamos treinar primeiro a Linguagem Rítmica batendo a mão (movimento de baixo para cima) antes de tentar executar o hino.";
    
    if (compasso === "6/8" || compasso === "9/8") {
        return "Neste hino de compasso composto, a subdivisão é feita em 3 movimentos por tempo (Ta-te-ti). Cuidado para não transformar as colcheias em notas duras de compasso simples!";
    }
    if (compasso === "3/4") {
        return "Compasso ternário. Lembre-se que o primeiro tempo (apoio) é forte, e os tempos 2 e 3 são fracos. Segure bem as notas pontuadas para preencher o compasso.";
    }
    return "Compasso quaternário simples. Você foi bem! Mantenha sempre a pulsação da semínima (TÁ) constante na sua mente para não acelerar o andamento do hino.";
}

function finalizarRodada() {
    isPlaying = false;
    clearInterval(metronomeInterval);
    cancelAnimationFrame(animationFrameId);
    
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-summary').classList.add('active');
    
    let totalNotas = activeNotes.length;
    let pct = Math.round((totalHits / totalNotas) * 100);
    
    document.getElementById('final-pct').innerText = pct + '%';
    document.getElementById('stat-acertos').innerText = totalHits;
    document.getElementById('stat-erros').innerText = totalMisses;
    
    // Mensagem de Acordo com Desempenho
    const emoji = document.getElementById('summary-emoji');
    if (pct >= 90) { emoji.innerText = "🏆"; sfxUp(); }
    else if (pct >= 60) { emoji.innerText = "🎵"; }
    else { emoji.innerText = "📚"; }
    
    // Dica MSA baseada no compasso do Hino Jogado
    document.getElementById('final-advice').innerText = gerarDicaMSA(currentHymn.compasso, pct);
}

window.proximoHino = function() {
    currentIndex++;
    if (currentIndex >= HINOS_CCB.length) currentIndex = 0; // Volta para o início se acabar
    
    document.getElementById('screen-summary').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    
    btnStart.disabled = false;
    btnStart.innerText = "Começar ▶️";
    document.getElementById('score').innerText = "0";
    
    renderMenuLayout();
}

window.onload = renderMenuLayout;