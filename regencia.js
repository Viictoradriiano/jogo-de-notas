// --- MOTOR DE ÁUDIO E SINTETIZADOR ---
let audioCtx = null;
function getCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }

function playMetronomeClick(isFirstBeat) {
    try {
        const c = getCtx(), o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle';
        o.frequency.value = isFirstBeat ? 1200 : 800; // Tempo 1 é agudo
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
        o.connect(g).connect(c.destination);
        o.start(); o.stop(c.currentTime + 0.05);
    } catch(e) {}
}

function sfxUp()   { try { const c=getCtx(),o=c.createOscillator(),g=c.createGain(); o.frequency.value=659; g.gain.setValueAtTime(0.1,c.currentTime); g.gain.exponentialRampToValueAtTime(0.01,c.currentTime+0.1); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+0.1); } catch(e){} }
function sfxDown() { try { const c=getCtx(),o=c.createOscillator(),g=c.createGain(); o.frequency.value=220; g.gain.setValueAtTime(0.1,c.currentTime); g.gain.exponentialRampToValueAtTime(0.01,c.currentTime+0.1); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+0.1); } catch(e){} }

// --- PADRÕES DO MSA ---
const COMPASS_PATTERNS = {
    "4/4": { beats: 4, bpm: 60, sequence: ["down", "left", "right", "up"] }, 
    "3/4": { beats: 3, bpm: 65, sequence: ["down", "right", "up"] }, 
    "2/4": { beats: 2, bpm: 70, sequence: ["down", "up"] } 
};

let formulaAtual = "4/4";
let isPlaying = false;
let currentBeat = 0;
let totalMovimentos = 0;
let acertos = 0;
let erros = 0;
let score = 0;

let metronomeInterval = null;
let lastBeatTime = 0;
let msPerBeat = 0;
let gestoRealizadoNaRodada = false;

const btnAction = document.getElementById('btn-action');
const feedback = document.getElementById('feedback');
const centerBeat = document.getElementById('center-beat');

function fecharTutorial() { document.getElementById('tutorial-modal').classList.remove('active'); }
function voltarMenu() { pararMetronomo(); document.getElementById('screen-game').classList.remove('active'); document.getElementById('screen-summary').classList.remove('active'); document.getElementById('screen-select').classList.add('active'); }
function selecionarFormula(form, btn) { formulaAtual = form; document.querySelectorAll('.formula-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); }

function iniciarJogo() {
    acertos = 0; erros = 0; score = 0; currentBeat = 0; totalMovimentos = 0;
    document.getElementById('score').innerText = '0';
    document.getElementById('badge-jogo').innerText = `Compasso ${formulaAtual}`;
    document.getElementById('screen-select').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    
    esconderSetasNaoUsadas();
    feedback.innerText = "Toque em COMEÇAR e acompanhe!";
    btnAction.innerText = "Começar Metrônomo ⏱️";
    btnAction.className = "btn btn-primary";
}

function esconderSetasNaoUsadas() {
    document.getElementById('arrow-left').style.display = formulaAtual === "4/4" ? "flex" : "none";
    document.getElementById('arrow-right').style.display = formulaAtual === "2/4" ? "none" : "flex";
}

function acionarMetronomo() {
    if (isPlaying) {
        pararMetronomo();
    } else {
        isPlaying = true;
        btnAction.innerText = "Parar Sessão 🟥";
        btnAction.className = "btn btn-outline";
        
        const pattern = COMPASS_PATTERNS[formulaAtual];
        msPerBeat = (60 / pattern.bpm) * 1000;
        currentBeat = 0;
        
        lastBeatTime = performance.now();
        metronomeInterval = setInterval(processarBatidaMetronomo, msPerBeat);
        processarBatidaMetronomo(); 
    }
}

function pararMetronomo() {
    isPlaying = false;
    clearInterval(metronomeInterval);
    resetarSetas();
    centerBeat.innerText = "1";
    centerBeat.style.color = "var(--border)";
    btnAction.innerText = "Começar Metrônomo ⏱️";
    btnAction.className = "btn btn-primary";
}

function processarBatidaMetronomo() {
    if (!isPlaying) return;
    
    if (totalMovimentos > 0 && !gestoRealizadoNaRodada) {
        erros++;
        feedback.innerText = "Esqueceu do movimento!";
        feedback.style.color = "var(--error)";
        sfxDown();
    }

    currentBeat++;
    const pattern = COMPASS_PATTERNS[formulaAtual];
    if (currentBeat > pattern.beats) currentBeat = 1;
    
    totalMovimentos++;
    gestoRealizadoNaRodada = false;
    lastBeatTime = performance.now();
    
    playMetronomeClick(currentBeat === 1);
    
    resetarSetas();
    const direcaoEsperada = pattern.sequence[currentBeat - 1];
    document.getElementById(`arrow-${direcaoEsperada}`).classList.add('target');
    
    centerBeat.innerText = currentBeat;
    centerBeat.style.color = currentBeat === 1 ? "var(--primary)" : "#666";
    feedback.innerText = `Tempo ${currentBeat}`;
    feedback.style.color = "var(--text)";

    if (totalMovimentos >= 20) {
        setTimeout(finalizarJogo, msPerBeat - 50);
    }
}

function resetarSetas() {
    document.querySelectorAll('.arrow').forEach(a => {
        a.classList.remove('target', 'hit-success', 'hit-error');
        a.innerText = a.id.replace('arrow-', '') === 'up' ? '⬆️' : a.id.replace('arrow-', '') === 'down' ? '⬇️' : a.id.replace('arrow-', '') === 'left' ? '⬅️' : '➡️';
    });
}

// =====================================================================
// NÚCLEO DE VALIDAÇÃO (ACEITA TECLADO E CELULAR)
// =====================================================================
function validarMovimento(direcaoInput) {
    if (!isPlaying || gestoRealizadoNaRodada) return;
    
    gestoRealizadoNaRodada = true;
    let agora = performance.now();
    let diferencaTempo = agora - lastBeatTime;
    
    // Margem justa para teclado e celular
    let noTempoCerto = diferencaTempo <= 400 || diferencaTempo >= (msPerBeat - 150); 

    const pattern = COMPASS_PATTERNS[formulaAtual];
    const direcaoEsperada = pattern.sequence[currentBeat - 1];
    const setaEl = document.getElementById(`arrow-${direcaoInput}`);

    if (direcaoInput === direcaoEsperada) {
        if (noTempoCerto) {
            acertos++;
            score += 50;
            if(setaEl) {
                setaEl.classList.add('hit-success');
                setaEl.innerText = '✅';
            }
            feedback.innerText = "No Ritmo!";
            feedback.style.color = "var(--success)";
            sfxUp();
        } else {
            erros++;
            if(setaEl) setaEl.classList.add('hit-error');
            feedback.innerText = "Certo, mas fora do tempo!";
            feedback.style.color = "var(--warn)";
            sfxDown();
        }
    } else {
        erros++;
        if(setaEl) {
            setaEl.classList.add('hit-error');
            setaEl.innerText = '❌';
        }
        feedback.innerText = `Erro! O tempo ${currentBeat} é para ${direcaoEsperada==="up"?"Cima":direcaoEsperada==="down"?"Baixo":direcaoEsperada==="left"?"Esquerda":"Direita"}`;
        feedback.style.color = "var(--error)";
        sfxDown();
    }
    document.getElementById('score').innerText = score;
}

// --- EVENTOS DE TECLADO (Para o Computador) ---
document.addEventListener('keydown', (e) => {
    if (!isPlaying || gestoRealizadoNaRodada) return;
    
    let direcao = null;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') direcao = 'up';
    if (e.code === 'ArrowDown' || e.code === 'KeyS') direcao = 'down';
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') direcao = 'left';
    if (e.code === 'ArrowRight' || e.code === 'KeyD') direcao = 'right';
    
    if (direcao) {
        e.preventDefault();
        validarMovimento(direcao);
    }
});

// --- EVENTOS TOUCH (Para o Celular) ---
let startX = 0, startY = 0;
const gestureZone = document.getElementById('gesture-zone');

gestureZone.addEventListener('touchstart', e => { 
    startX = e.touches[0].clientX; 
    startY = e.touches[0].clientY; 
}, {passive: false});

gestureZone.addEventListener('touchend', e => { 
    if (!isPlaying || gestoRealizadoNaRodada) return;
    
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    let dx = endX - startX;
    let dy = endY - startY;
    let direcaoSwipe = null;
    
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
            direcaoSwipe = dx > 0 ? "right" : "left";
        } else {
            direcaoSwipe = dy > 0 ? "down" : "up";
        }
    }

    if (direcaoSwipe) {
        e.preventDefault();
        validarMovimento(direcaoSwipe);
    }
}, {passive: false});

// --- FINALIZAÇÃO ---
function finalizarJogo() {
    pararMetronomo();
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-summary').classList.add('active');
    
    let pct = totalMovimentos === 0 ? 0 : Math.round((acertos / totalMovimentos) * 100);
    document.getElementById('sum-pct').innerText = pct + '%';
    document.getElementById('sum-acertos').innerText = acertos;
    document.getElementById('sum-erros').innerText = erros;

    let advice = "";
    if (pct >= 90) {
        advice = "<b>Padrão Maestro Alcançado!</b> Você tem uma excelente coordenação motora. Seu movimento é claro e rítmico, ideal para passar no teste de solfejo.";
    } else if (pct >= 60) {
        advice = "<b>Bom aproveitamento!</b> Lembre-se: o tempo 1 é sempre para baixo (o apoio), e o último tempo é sempre subindo.";
    } else {
        advice = "<b>Treine mais.</b> A marcação do compasso é fundamental no MSA. Decore o formato: 4/4 é uma cruz, 3/4 é um triângulo.";
    }
    document.getElementById('sum-advice').innerHTML = advice;
}

window.jogarNovamente = function() { document.getElementById('screen-summary').classList.remove('active'); iniciarJogo(); };