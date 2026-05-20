/**
 * Configuração das Claves com as LINHAS SUPLEMENTARES.
 */
const CLEFS = {
    sol: {
        symbol: '𝄞', offsetTop: -30, fontSize: '90px',
        notas: [
            {nome: 'dó', y: -20}, {nome: 'ré', y: -10},
            {nome: 'mi', y: 0},  {nome: 'fá', y: 10}, {nome: 'sol', y: 20},
            {nome: 'lá', y: 30}, {nome: 'si', y: 40}, {nome: 'dó', y: 50},
            {nome: 'ré', y: 60}, {nome: 'mi', y: 70}, {nome: 'fá', y: 80},
            {nome: 'sol', y: 90},
            {nome: 'lá', y: 100}, {nome: 'si', y: 110}, {nome: 'dó', y: 120}
        ]
    },
    fa: {
        symbol: '𝄢', offsetTop: -24, fontSize: '75px',
        notas: [
            {nome: 'mi', y: -20}, {nome: 'fá', y: -10},
            {nome: 'sol', y: 0},  {nome: 'lá', y: 10}, {nome: 'si', y: 20},
            {nome: 'dó', y: 30}, {nome: 'ré', y: 40}, {nome: 'mi', y: 50},
            {nome: 'fá', y: 60}, {nome: 'sol', y: 70}, {nome: 'lá', y: 80},
            {nome: 'si', y: 90},
            {nome: 'dó', y: 100}, {nome: 'ré', y: 110}, {nome: 'mi', y: 120}
        ]
    },
    do: {
        symbol: '𝄡', offsetTop: -14, fontSize: '75px',
        notas: [
            {nome: 'ré', y: -20}, {nome: 'mi', y: -10},
            {nome: 'fá', y: 0},  {nome: 'sol', y: 10}, {nome: 'lá', y: 20},
            {nome: 'si', y: 30}, {nome: 'dó', y: 40}, {nome: 'ré', y: 50},
            {nome: 'mi', y: 60}, {nome: 'fá', y: 70}, {nome: 'sol', y: 80},
            {nome: 'lá', y: 90},
            {nome: 'si', y: 100}, {nome: 'dó', y: 110}, {nome: 'ré', y: 120}
        ]
    }
};

const GAME_LEVELS = [
    {id: 1, figuras: ['semibreve', 'minima'], compassos: ['2/4', '3/4', '4/4']},
    {id: 2, figuras: ['semibreve', 'minima', 'seminima'], compassos: ['2/4', '3/4', '4/4']},
    {id: 3, figuras: ['minima', 'seminima', 'pausa_minima', 'pausa_seminima'], compassos: ['2/4', '3/4', '4/4']},
    {id: 4, figuras: ['seminima', 'colcheia', 'pausa_seminima'], compassos: ['2/4', '3/4', '4/4']},
    {id: 5, figuras: ['seminima', 'colcheia', 'pausa_seminima', 'pausa_colcheia'], compassos: ['2/4', '3/4', '4/4']},
    {
        id: 6, 
        figuras: ['seminima', 'colcheia', 'semicolcheia', 'pausa_colcheia', 'pausa_semicolcheia'],
        compassos: ['2/4', '3/4', '4/4', '6/8', '9/8', '12/8'],
        mensagemFase: "⚠️ Atenção! Você chegou à Fase dos Compassos Compostos.\n\nA partir de agora, o valor das figuras muda dependendo do compasso.\n\nLembre-se: em compassos com denominador 8, a Colcheia passa a valer 1 movimento!"
    }
];

const PAUSE_SYMBOLS = {
    pausa_semibreve: '𝄻', pausa_minima: '𝄼', pausa_seminima: '𝄽', 
    pausa_colcheia: '𝄾', pausa_semicolcheia: '𝄿'
};

const NOTE_NAMES = {
    pausa_semibreve: 'Pausa Semibreve', pausa_minima: 'Pausa Mínima', 
    pausa_seminima: 'Pausa Semínima', pausa_colcheia: 'Pausa Colcheia', 
    pausa_semicolcheia: 'Pausa Semicolcheia',
    dó: 'Dó', ré: 'Ré', mi: 'Mi', fá: 'Fá', sol: 'Sol', lá: 'Lá', si: 'Si'
};

// Função que calcula dinamicamente o valor das figuras com base na fórmula de compasso
function calcularValorFigura(nomeFigura, formulaCompasso) {
    const denominador = parseInt(formulaCompasso.split('/')[1]);
    const equivalencia = {
        'semibreve': 1, 'pausa_semibreve': 1, 'minima': 2, 'pausa_minima': 2,
        'seminima': 4, 'pausa_seminima': 4, 'colcheia': 8, 'pausa_colcheia': 8,
        'semicolcheia': 16, 'pausa_semicolcheia': 16
    };
    
    let valorCalculado = denominador / equivalencia[nomeFigura];
    
    if (valorCalculado === 0.5) return '½t';
    if (valorCalculado === 0.25) return '¼t';
    if (valorCalculado === 1.5) return '1½t';
    return valorCalculado + 't';
}

// Variáveis de Jogo
let currentClef, currentLevel = 1, streak = 0, totalRight = 0, totalWrong = 0;
let currentSeq = [], ansPitch = [], ansTime = [];
let ansCompass = null, targetCompass = null;
let statusPitch = [], statusTime = [], evaluated = [], compassEvaluated = false;
let activeSlot = 0, activeInput = 'compass';
let nextTimer = null, isAnimating = false;

// Variáveis do Temporizador
let timeLeft = 30;
let matchTimer = null;

// Inicialização de Tema
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    let isDark = true;
    btn.onclick = () => {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        btn.innerHTML = isDark
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    };
}
initTheme();

// Lógica do Modal de Avisos
function openModal(msg) {
    const modalText = document.getElementById('modal-text');
    const modalWarning = document.getElementById('modal-warning');
    if (modalText && modalWarning) {
        modalText.innerText = msg;
        modalWarning.classList.add('active');
    }
}

function closeModal() {
    const modalWarning = document.getElementById('modal-warning');
    if (modalWarning) {
        modalWarning.classList.remove('active');
    }
    startTimer();
}

window.closeModal = closeModal; // Garante que o botão no HTML encontre a função

// Áudio Básico
let audioCtx = null;
function getCtx() {
    if (!audioCtx) audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
function tone(f, d, t = 'sine', v = 0.12) {
    try {
        const c = getCtx(), o = c.createOscillator(), g = c.createGain();
        o.type = t; 
        o.frequency.value = f;
        g.gain.setValueAtTime(v, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
        o.connect(g).connect(c.destination);
        o.start(); 
        o.stop(c.currentTime + d);
    } catch(e) {}
}

function sfxOk() { tone(523, 0.08); setTimeout(() => tone(659, 0.08), 80); setTimeout(() => tone(784, 0.18), 160); }
function sfxUp() { [523, 587, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'sine', 0.15), i * 90)); }
function sfxErr() { tone(220, 0.07, 'square', 0.08); setTimeout(() => tone(180, 0.15, 'square', 0.06), 90); }
function sfxClick() { tone(800, 0.05, 'sine', 0.05); }

// Renderização dos Teclados Dinâmicos
function renderKeys() {
    const nr = document.getElementById('notes-keyboard-row');
    const pr = document.getElementById('pauses-keyboard-row');
    const cr = document.getElementById('compass-keyboard-row');
    const tr = document.getElementById('time-keyboard-row');
    
    // As notas são estáticas, então só renderizamos na primeira vez
    if (nr.innerHTML === '') {
        ['dó', 'ré', 'mi', 'fá', 'sol', 'lá', 'si'].forEach(n => { 
            nr.innerHTML += `<button class="btn-key" onclick="handlePitch('${n}')">${n}</button>`; 
        });
        
        ['pausa_semibreve', 'pausa_minima', 'pausa_seminima', 'pausa_colcheia', 'pausa_semicolcheia'].forEach(p => { 
            pr.innerHTML += `<button class="btn-key btn-pause" onclick="handlePitch('${p}')">${NOTE_NAMES[p]}</button>`; 
        });
    }
    
    // Os botões de compasso mudam de acordo com o nível atual
    cr.innerHTML = '';
    const levelCompassos = GAME_LEVELS[currentLevel - 1].compassos;
    levelCompassos.forEach(c => {
        cr.innerHTML += `<button class="btn-key btn-compass-key" onclick="handleCompassAnswer('${c}')">${c}</button>`;
    });
    
    // Botões de tempo completos
    tr.innerHTML = '';
    ['4t', '3t', '2t', '1½t', '1t', '½t', '¼t'].forEach(t => { 
        tr.innerHTML += `<button class="btn-key btn-time-key" onclick="handleTime('${t}')">${t}</button>`; 
    });
}
renderKeys();

// Eventos de Navegação
document.getElementById('btn-clef-sol').onclick = () => startGame('sol');
document.getElementById('btn-clef-fa').onclick = () => startGame('fa');
document.getElementById('btn-clef-do').onclick = () => startGame('do');
document.getElementById('btn-back-menu').onclick = () => showScreen('screen-menu');
document.getElementById('btn-return-menu').onclick = () => showScreen('screen-menu');
document.getElementById('btn-end-session').onclick = () => endSession();
document.getElementById('btn-verify-answers').onclick = verify;

function showScreen(id) {
    clearInterval(matchTimer);
    clearTimeout(nextTimer);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// LÓGICA DO TEMPORIZADOR
function startTimer() {
    clearInterval(matchTimer);
    timeLeft = 30;
    updateTimerUI();
    
    matchTimer = setInterval(() => {
        // Se estiver animando ou com o modal aberto, o tempo pausa
        const modalWarning = document.getElementById('modal-warning');
        if (isAnimating || (modalWarning && modalWarning.classList.contains('active'))) return; 
        
        timeLeft--;
        updateTimerUI();
        
        if (timeLeft <= 0) {
            clearInterval(matchTimer);
            sfxErr();
            setInteraction(false);
            document.getElementById('message-area').innerHTML = '<div class="msg-warning">⏰ O tempo esgotou!</div>';
            setTimeout(() => { endSession(); }, 1500);
        }
    }, 1000);
}

function updateTimerUI() {
    const timerBar = document.getElementById('timer-bar-fill');
    const timerText = document.getElementById('timer-text');
    timerBar.style.width = (timeLeft / 30 * 100) + '%';
    timerText.textContent = timeLeft + 's';
    
    if (timeLeft <= 10) {
        timerText.style.color = 'var(--color-error)';
        timerBar.style.background = 'var(--color-error)';
    } else {
        timerText.style.color = 'var(--color-text)';
        timerBar.style.background = 'var(--color-primary)';
    }
}

function setInteraction(en) {
    isAnimating = !en;
    document.querySelectorAll('button').forEach(b => {
        if (!['theme-toggle', 'btn-back-menu', 'btn-return-menu'].includes(b.id) && !b.closest('#modal-warning')) {
            b.disabled = !en;
        }
    });
}

function startGame(clef) {
    currentClef = clef; 
    currentLevel = 1; 
    streak = 0; 
    totalRight = 0; 
    totalWrong = 0;
    
    const el = document.getElementById('clave-symbol');
    el.textContent = CLEFS[clef].symbol;
    el.style.top = CLEFS[clef].offsetTop + 'px';
    el.style.fontSize = CLEFS[clef].fontSize;
    
    updateStats();
    showScreen('screen-game');
    genSeq();
}

function updateStats() {
    document.getElementById('level-badge').textContent = 'Nível ' + currentLevel;
    document.getElementById('session-stats').textContent = `${totalRight} ✓ · ${totalWrong} ✗`;
    for (let i = 0; i < 3; i++) {
        document.getElementById('pip' + i).classList.toggle('filled', i < streak);
    }
    document.getElementById('level-progress-fill').style.width = ((currentLevel - 1) / 6 * 100) + '%';
}

function getTicks(f) {
    return {
        'semibreve': 16, 'pausa_semibreve': 16, 
        'minima': 8, 'pausa_minima': 8, 
        'seminima': 4, 'pausa_seminima': 4, 
        'colcheia': 2, 'pausa_colcheia': 2, 
        'semicolcheia': 1, 'pausa_semicolcheia': 1
    }[f] || 4;
}

function genSeq() {
    clearTimeout(nextTimer);
    setInteraction(true);
    renderKeys(); // Atualiza os botões dinâmicos dependendo do nível
    startTimer();
    
    document.getElementById('message-area').innerHTML = '';
    document.querySelectorAll('.nota-wrapper, .pausa-texto, .linha-suplementar').forEach(e => e.remove());

    // Sorteia Compasso de acordo com o nível atual
    const compassosPossiveis = GAME_LEVELS[currentLevel - 1].compassos;
    targetCompass = compassosPossiveis[Math.floor(Math.random() * compassosPossiveis.length)];
    
    // Calcula os Ticks dinâmicos do Compasso
    const num = parseInt(targetCompass.split('/')[0]);
    const den = parseInt(targetCompass.split('/')[1]);
    let rem = num * (16 / den);

    const allowed = GAME_LEVELS[currentLevel - 1].figuras;
    const figs = [];
    
    while (rem > 0) {
        let min = 1; 
        if (figs.length >= 6) min = rem;
        
        let opts = allowed.filter(f => getTicks(f) <= rem && getTicks(f) >= min);
        
        if (!opts.length) {
            opts = ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia', 'pausa_semibreve', 'pausa_minima', 'pausa_seminima']
                   .filter(f => getTicks(f) === rem);
        }
        
        if (!opts.length) break;
        
        const sel = opts[Math.floor(Math.random() * opts.length)];
        figs.push(sel);
        rem -= getTicks(sel);
    }

    const startX = 32, endX = 94, step = figs.length > 1 ? (endX - startX) / (figs.length - 1) : 0;
    currentSeq = [];
    const staff = document.getElementById('pentagrama');
    
    // Esconde os números do compasso
    document.getElementById('ts-top').textContent = '?';
    document.getElementById('ts-bottom').textContent = '?';

    for (let i = 0; i < figs.length; i++) {
        const fig = figs[i];
        const xPct = figs.length === 1 ? ((startX + endX) / 2) + '%' : (startX + step * i) + '%';
        const isP = fig.includes('pausa');
        let note = null;
        
        if (!isP) {
            const arr = CLEFS[currentClef].notas;
            note = arr[Math.floor(Math.random() * arr.length)];
        }
        
        currentSeq.push({
            figura: fig, 
            pitch: note, 
            ansPitch: isP ? fig : note.nome, 
            ansTime: calcularValorFigura(fig, targetCompass) // <-- Aplica o cálculo matemático
        });

        if (isP) {
            const el = document.createElement('div');
            el.className = 'pausa-texto'; 
            el.style.left = xPct; 
            el.style.bottom = '40px';
            el.innerHTML = PAUSE_SYMBOLS[fig]; 
            staff.appendChild(el);
        } else {
            const w = document.createElement('div');
            w.className = 'nota-wrapper'; 
            w.style.left = xPct; 
            w.style.bottom = note.y + 'px';
            
            const h = document.createElement('div');
            h.className = fig === 'semibreve' ? 'head-semibreve' : fig === 'minima' ? 'head-minima' : 'head-preta';
            w.appendChild(h);

            if (fig !== 'semibreve') {
                // REGRA DO MSA: Se y < 40 (Abaixo da 3ª linha) a haste é para cima
                const isUp = note.y < 40;
                
                const st = document.createElement('div');
                st.className = isUp ? 'stem-up' : 'stem-down'; 
                w.appendChild(st);
                
                if (fig === 'colcheia' || fig === 'semicolcheia') {
                    const fl = document.createElement('div');
                    fl.className = isUp ? 'flag-colcheia-up' : 'flag-colcheia-down'; 
                    w.appendChild(fl);
                    
                    if (fig === 'semicolcheia') {
                        const fl2 = document.createElement('div');
                        fl2.className = isUp ? 'flag-semi-up' : 'flag-semi-down'; 
                        w.appendChild(fl2);
                    }
                }
            }
            staff.appendChild(w);
            drawLines(note.y, xPct);
        }
    }
    
    // Reseta estado dos inputs
    ansCompass = null;
    compassEvaluated = false;
    ansPitch = new Array(currentSeq.length).fill(null);
    ansTime = new Array(currentSeq.length).fill(null);
    statusPitch = new Array(currentSeq.length).fill('');
    statusTime = new Array(currentSeq.length).fill('');
    evaluated = new Array(currentSeq.length).fill(false);
    
    activeSlot = 0; 
    activeInput = 'compass';
    
    renderSlots();
}

function drawLines(y, x) {
    const s = document.getElementById('pentagrama');
    const add = (yy) => {
        const l = document.createElement('div');
        l.className = 'linha-suplementar'; 
        l.style.bottom = yy + 'px'; 
        l.style.left = x;
        s.appendChild(l);
    };
    
    // Linhas Superiores
    if (y >= 100) add(100); 
    if (y >= 120) add(120); 
    if (y >= 140) add(140);
    
    // Linhas Inferiores
    if (y <= -20) add(-20); 
    if (y <= -40) add(-40);
}

function renderSlots() {
    const c = document.getElementById('slots-container'); 
    c.innerHTML = '';
    
    for (let i = 0; i < currentSeq.length; i++) {
        const col = document.createElement('div'); 
        col.className = 'slot-col';
        
        const sp = document.createElement('div'); 
        sp.className = 'slot slot-pitch'; 
        sp.id = 'slot-p-' + i; 
        sp.onclick = () => handleSlotSelection(i, 'pitch');
        
        const st = document.createElement('div'); 
        st.className = 'slot slot-time'; 
        st.id = 'slot-t-' + i; 
        st.onclick = () => handleSlotSelection(i, 'time');
        
        col.appendChild(sp); 
        col.appendChild(st); 
        c.appendChild(col);
    }
    updateSlots();
}

window.handleSlotSelection = function(i, type) {
    if (isAnimating) return;
    activeInput = type;
    
    if (type === 'compass') {
        ansCompass = null;
    } else {
        activeSlot = i;
        if (type === 'pitch') { ansPitch[i] = null; statusPitch[i] = ''; }
        else { ansTime[i] = null; statusTime[i] = ''; }
    }
    
    document.getElementById('message-area').innerHTML = '';
    updateSlots(); 
    sfxClick();
}

window.handleCompassAnswer = function(v) {
    if (isAnimating) return;
    sfxClick();
    ansCompass = v;
    
    const el = document.getElementById('slot-compass');
    el.classList.add('pop'); 
    setTimeout(() => el.classList.remove('pop'), 300);
    
    activeInput = 'pitch'; 
    activeSlot = 0;
    document.getElementById('message-area').innerHTML = '';
    updateSlots();
}

window.handlePitch = function(v) {
    if (isAnimating) return; 
    sfxClick();
    
    ansPitch[activeSlot] = v; 
    statusPitch[activeSlot] = '';
    
    const el = document.getElementById('slot-p-' + activeSlot);
    el.classList.add('pop'); 
    setTimeout(() => el.classList.remove('pop'), 300);
    
    activeInput = 'time';
    document.getElementById('message-area').innerHTML = '';
    updateSlots();
}

window.handleTime = function(v) {
    if (isAnimating) return; 
    sfxClick();
    
    ansTime[activeSlot] = v; 
    statusTime[activeSlot] = '';
    
    const el = document.getElementById('slot-t-' + activeSlot);
    el.classList.add('pop'); 
    setTimeout(() => el.classList.remove('pop'), 300);
    
    if (activeSlot < currentSeq.length - 1) { 
        activeSlot++; 
        activeInput = 'pitch'; 
    }
    
    document.getElementById('message-area').innerHTML = '';
    updateSlots();
}

function updateSlots() {
    const sc = document.getElementById('slot-compass');
    sc.textContent = ansCompass || '? / ?';
    sc.className = 'slot slot-compass';
    if (activeInput === 'compass') sc.classList.add('active');

    for (let i = 0; i < currentSeq.length; i++) {
        const sp = document.getElementById('slot-p-' + i);
        const p = ansPitch[i];
        
        sp.innerHTML = p ? (p.includes('pausa') ? `<span style="font-family:'Noto Music';font-size:26px;transform:translateY(-2px);display:inline-block">${PAUSE_SYMBOLS[p]}</span>` : `<span>${p.toUpperCase()}</span>`) : '';
        sp.className = 'slot slot-pitch';
        
        if (i === activeSlot && activeInput === 'pitch') sp.classList.add('active');
        if (statusPitch[i]) sp.classList.add(statusPitch[i]);

        const st = document.getElementById('slot-t-' + i);
        const t = ansTime[i];
        
        st.innerHTML = t ? `<span>${t}</span>` : '';
        st.className = 'slot slot-time';
        
        if (i === activeSlot && activeInput === 'time') st.classList.add('active');
        if (statusTime[i]) st.classList.add(statusTime[i]);
    }
}

function verify() {
    if (isAnimating) return;
    clearInterval(matchTimer);

    if (!ansCompass || ansPitch.includes(null) || ansTime.includes(null)) {
        document.getElementById('message-area').innerHTML = '<div class="msg-warning">Preencha o Compasso e todas as notas!</div>';
        startTimer(); // Retoma o tempo
        return;
    }
    
    let allOk = true;
    let errHTML = '';

    // Avalia Compasso
    const sc = document.getElementById('slot-compass');
    let isCompassCorrect = false;

    // Regra: Aceita compostos ou simples equivalentes se tiverem o mesmo número de ticks totais
    if (ansCompass === targetCompass) {
        isCompassCorrect = true;
    } else if ((ansCompass === '3/4' || ansCompass === '6/8') && (targetCompass === '3/4' || targetCompass === '6/8')) {
        isCompassCorrect = true;
    }

    if (isCompassCorrect) {
        sc.classList.add('correct');
        document.getElementById('ts-top').textContent = ansCompass.split('/')[0];
        document.getElementById('ts-bottom').textContent = ansCompass.split('/')[1];
        if (!compassEvaluated) { totalRight++; compassEvaluated = true; }
    } else {
        allOk = false; 
        sc.classList.add('wrong');
        document.getElementById('ts-top').textContent = targetCompass.split('/')[0];
        document.getElementById('ts-bottom').textContent = targetCompass.split('/')[1];
        if (!compassEvaluated) { totalWrong++; compassEvaluated = true; }
        errHTML += `<div class="msg-error-item">❌ <b>Compasso:</b> Era <b>${targetCompass}</b>. A soma revela a fórmula correta.</div>`;
    }

    // Avalia Notas e Tempos com Explicações Pedagógicas
    for (let i = 0; i < currentSeq.length; i++) {
        let okP = ansPitch[i] === currentSeq[i].ansPitch;
        let okT = ansTime[i] === currentSeq[i].ansTime;
        
        statusPitch[i] = okP ? 'correct' : 'wrong'; 
        statusTime[i] = okT ? 'correct' : 'wrong';
        
        if (okP && okT) {
            if (!evaluated[i]) { totalRight++; evaluated[i] = true; }
        } else {
            allOk = false;
            if (!evaluated[i]) { totalWrong++; evaluated[i] = true; }
            
            let noteName = NOTE_NAMES[currentSeq[i].ansPitch] || currentSeq[i].ansPitch;
            let figName = currentSeq[i].figura.replace('pausa_', 'Pausa de ');
            figName = figName.charAt(0).toUpperCase() + figName.slice(1);
            
            if (!okP && !okT) {
                errHTML += `<div class="msg-error-item">❌ Caixa ${i + 1}: Era <b>${noteName}</b> valendo <b>${currentSeq[i].ansTime}</b>.<small>Com o denominador ${targetCompass.split('/')[1]}, a figura ${figName} passa a valer ${currentSeq[i].ansTime}.</small></div>`;
            } else if (!okP) {
                errHTML += `<div class="msg-error-item">❌ Caixa ${i + 1}: Nota errada. Era <b>${noteName}</b>.</div>`;
            } else if (!okT) {
                errHTML += `<div class="msg-error-item">❌ Caixa ${i + 1}: Tempo errado. Era <b>${currentSeq[i].ansTime}</b>.<small>Atenção ao compasso (${targetCompass}). A figura ${figName} recebe o valor de ${currentSeq[i].ansTime}.</small></div>`;
            }
        }
    }
    
    updateSlots(); 
    updateStats();

    if (allOk) {
        setInteraction(false);
        streak++; 
        sfxOk(); 
        updateStats();
        
        let msg = '<div class="msg-success">🎉 Perfeito! Acertou compasso e notas!</div>';
        
        if (streak >= 3 && currentLevel < 6) {
            currentLevel++; 
            streak = 0; 
            sfxUp(); 
            updateStats();
            msg += `<div class="msg-level-up">🚀 Avançou para o Nível ${currentLevel}!</div>`;
            confetti();
            
            // Verifica se o novo nível precisa abrir o aviso (Nível 6)
            const levelData = GAME_LEVELS.find(l => l.id === currentLevel);
            if (levelData && levelData.mensagemFase) {
                clearInterval(matchTimer); // Pausa pra dar tempo de abrir
                setTimeout(() => { openModal(levelData.mensagemFase); }, 1500); 
            }
        } else if (currentLevel === 6 && streak >= 3) {
            streak = 0; 
            sfxUp(); 
            updateStats();
            msg += `<div class="msg-level-up">🏆 Mestre! Dominou tudo!</div>`;
            confetti();
        }
        
        document.getElementById('message-area').innerHTML = msg;
        nextTimer = setTimeout(genSeq, 2500);
    } else {
        streak = 0; 
        updateStats(); 
        sfxErr();
        document.getElementById('message-area').innerHTML = '<div class="msg-errors-list">' + errHTML + '</div>';
        startTimer(); // Retoma o tempo para dar oportunidade de corrigir os erros
    }
}

function endSession() {
    clearInterval(matchTimer);
    clearTimeout(nextTimer);
    setInteraction(true);
    
    let total = totalRight + totalWrong;
    if (total === 0) return showScreen('screen-summary');
    
    let pct = Math.round(totalRight / total * 100), emoji, title, sub;
    
    if (pct >= 90) { emoji = '🏆'; title = 'Excelente!'; sub = 'Dominando a leitura musical.'; }
    else if (pct >= 70) { emoji = '🎵'; title = 'Muito bem!'; sub = 'A fluência está muito perto.'; }
    else if (pct >= 50) { emoji = '📚'; title = 'Bom esforço!'; sub = 'Revise as figuras com mais erros e tente novamente.'; }
    else { emoji = '💪'; title = 'Continue estudando!'; sub = 'Prática diária vai fazer uma grande diferença.'; }
    
    document.getElementById('summary-emoji').textContent = emoji;
    document.getElementById('summary-title').textContent = title;
    document.getElementById('summary-sub').textContent = sub;
    document.getElementById('stat-acertos').textContent = totalRight;
    document.getElementById('stat-erros').textContent = totalWrong;
    document.getElementById('stat-pct-a').textContent = pct + '%';
    document.getElementById('stat-pct-e').textContent = (100 - pct) + '%';
    
    showScreen('screen-summary');
    setTimeout(() => { document.getElementById('summary-bar').style.width = pct + '%' }, 100);
    if (pct >= 70) sfxUp();
}

function confetti() {
    const colors = ['#9b7ff0', '#e08a4a', '#5baa6e', '#e5696f', '#e8a633', '#60a5fa'];
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'confetti-piece';
            p.style.left = (Math.random() * 100) + 'vw';
            p.style.top = '-10px';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDuration = (1 + Math.random() * 0.8) + 's';
            p.style.animationDelay = (Math.random() * 0.4) + 's';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 2500);
        }, i * 28);
    }
}