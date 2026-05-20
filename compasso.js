// --- SISTEMA DE ÁUDIO ---
let audioCtx = null;
function getCtx() {
    if (!audioCtx) audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
function tone(f, d, t = 'sine', v = 0.12) {
    try { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.type = t; o.frequency.value = f; g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + d); } catch(e) {}
}
function sfxOk() { tone(523, 0.08); setTimeout(() => tone(659, 0.08), 80); setTimeout(() => tone(784, 0.18), 160); }
function sfxUp() { [523, 587, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'sine', 0.15), i * 90)); }
function sfxErr() { tone(220, 0.07, 'square', 0.08); setTimeout(() => tone(180, 0.15, 'square', 0.06), 90); }
function sfxClick() { tone(800, 0.05, 'sine', 0.05); }

// --- LÓGICA DO JOGO ---
const NOTES = [
    { id: 'semibreve', symbol: '𝅝', ticks: 16 },
    { id: 'minima', symbol: '𝅗𝅥', ticks: 8 }, // Corrigido os símbolos unicode
    { id: 'seminima', symbol: '𝅘𝅥', ticks: 4 },
    { id: 'colcheia', symbol: '𝅘𝅥𝅮', ticks: 2 },
    { id: 'semicolcheia', symbol: '𝅘𝅥𝅯', ticks: 1 }
];

const TIME_SIGNATURES = [
    { formula: '2/4', ticksTarget: 8 }, { formula: '3/4', ticksTarget: 12 },
    { formula: '4/4', ticksTarget: 16 }, { formula: '6/8', ticksTarget: 12 },
    { formula: '9/8', ticksTarget: 18 }
];

let currentTarget = null;
let currentMeasure = []; 

// Estatísticas da Sessão
let level = 1;
let score = 0;
let streak = 0; // Bolinhas de progresso
let erros = 0;
let errosPorCompasso = { '2/4': 0, '3/4': 0, '4/4': 0, '6/8': 0, '9/8': 0 };

// Variáveis de Controle e Temporizador
let timerInterval = null;
let timeLeft = 30;
let isTransitioning = false; // Trava de segurança

function initGame() {
    renderBank();
    novaRodada();
}

function renderBank() {
    const bank = document.getElementById('notes-bank');
    bank.innerHTML = '';
    NOTES.forEach(note => {
        const btn = document.createElement('button');
        btn.className = 'btn-note';
        btn.innerHTML = note.symbol;
        btn.onclick = () => addNote(note);
        bank.appendChild(btn);
    });
}

function updateStatsUI() {
    document.getElementById('level-badge').innerText = `Nível ${level}`;
    
    // Atualiza as bolinhas de progresso (0 a 3)
    for (let i = 0; i < 3; i++) {
        const pip = document.getElementById('pip' + i);
        if (pip) {
            if (i < streak) pip.classList.add('filled');
            else pip.classList.remove('filled');
        }
    }
}

function novaRodada() {
    isTransitioning = false; 
    
    currentTarget = TIME_SIGNATURES[Math.floor(Math.random() * TIME_SIGNATURES.length)];
    const top = currentTarget.formula.split('/')[0];
    const bottom = currentTarget.formula.split('/')[1];
    
    document.getElementById('target-signature').innerHTML = `<span>${top}</span><span>${bottom}</span>`;
    
    updateStatsUI();
    limparCompasso(false); 
    document.getElementById('message-area').innerHTML = '';

    // Lida com o temporizador (Aparece após o Nível 3)
    clearInterval(timerInterval);
    const timerContainer = document.getElementById('timer-container');
    if (level > 3) {
        if (timerContainer) timerContainer.style.display = 'flex';
        iniciarTemporizador();
    } else {
        if (timerContainer) timerContainer.style.display = 'none';
    }
}

function iniciarTemporizador() {
    clearInterval(timerInterval);
    timeLeft = 30;
    
    const bar = document.getElementById('timer-bar-fill');
    const txt = document.getElementById('timer-text');
    
    if (bar) bar.style.width = '100%';
    if (txt) {
        txt.innerText = '30s';
        txt.style.color = 'var(--color-error)';
    }
    
    timerInterval = setInterval(() => {
        if (isTransitioning) return; 
        
        timeLeft--;
        if (bar) bar.style.width = (timeLeft / 30 * 100) + '%';
        if (txt) txt.innerText = timeLeft + 's';
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            sfxErr();
            endSession(true); 
        }
    }, 1000);
}

function addNote(note) { 
    if (isTransitioning) return; 
    sfxClick();
    currentMeasure.push(note); 
    renderMeasure(); 
}

function removeNote(index) { 
    if (isTransitioning) return;
    sfxClick(); 
    currentMeasure.splice(index, 1); 
    renderMeasure(); 
}

function renderMeasure() {
    const container = document.getElementById('measure-slots');
    container.innerHTML = '';
    currentMeasure.forEach((note, index) => {
        const slot = document.createElement('div');
        slot.className = 'note-slot';
        slot.innerHTML = note.symbol;
        slot.onclick = () => removeNote(index);
        container.appendChild(slot);
    });
}

function limparCompasso(viaBotao = true) {
    if (isTransitioning) return;
    if (viaBotao && currentMeasure.length > 0) sfxClick();
    currentMeasure = [];
    renderMeasure();
}

function verificarCompasso() {
    if (isTransitioning) return; 
    
    if (currentMeasure.length === 0) { 
        showMessage('Coloque notas na pauta primeiro!', 'error'); 
        return; 
    }

    const somaTotal = currentMeasure.reduce((acc, note) => acc + note.ticks, 0);
    const num = parseInt(currentTarget.formula.split('/')[0]);
    const den = parseInt(currentTarget.formula.split('/')[1]);

    if (somaTotal === currentTarget.ticksTarget) {
        isTransitioning = true; 
        clearInterval(timerInterval); 
        
        score++;
        streak++;
        let msgAcerto = '🎉 Perfeito! O compasso está correto.';

        // Lógica de subir de nível
        if (streak >= 3) {
            level++;
            streak = 0;
            msgAcerto = `🚀 Avançou para o Nível ${level}!`;
            sfxUp();
        } else {
            sfxOk();
        }

        confetti(); 
        updateStatsUI();
        showMessage(msgAcerto, 'success');
        
        // Aguarda 2.5s para apreciar os confetes e vai pra próxima
        setTimeout(() => {
            novaRodada();
        }, 2500); 
        
    } else {
        sfxErr();
        erros++;
        streak = 0; // Zera a sequência de acertos
        updateStatsUI();
        
        errosPorCompasso[currentTarget.formula]++; 

        let figRef = den === 4 ? "Semínima" : (den === 8 ? "Colcheia" : "Figura");
        let tipoUnd = den === 8 ? "movimentos" : "tempos";
        let ticksUnd = den === 4 ? 4 : (den === 8 ? 2 : 1);
        let quant = (somaTotal / ticksUnd);
        let txtQuant = Number.isInteger(quant) ? quant : quant.toFixed(1).replace('.', ',');

        let msgErro = `❌ Errado.<br><small><b>Explicação MSA:</b> No compasso <b>${currentTarget.formula}</b>, a <b>${figRef}</b> vale 1 ${tipoUnd.slice(0,-1)}. Exige-se <b>${num} ${tipoUnd}</b>, mas você colocou <b>${txtQuant}</b>.</small>`;
        showMessage(msgErro, 'error');
    }
}

function showMessage(text, type) {
    document.getElementById('message-area').innerHTML = `<div class="msg-${type}">${text}</div>`;
}

// --- FINALIZAÇÃO E ANÁLISE ---
// Mudado o nome para endSession() para bater com o botão do seu HTML
window.endSession = function(timeout = false) {
    clearInterval(timerInterval);
    
    // Esconde a tela de jogo e mostra a de resumo
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-summary').classList.add('active');

    let total = score + erros;
    
    // Encontra onde o aluno mais errou
    let piorCompasso = null;
    let maxErros = 0;
    for (const [compasso, qtdErros] of Object.entries(errosPorCompasso)) {
        if (qtdErros > maxErros) { maxErros = qtdErros; piorCompasso = compasso; }
    }

    // Gera recomendação baseada no MSA
    let advice = "<strong style='color: var(--color-success); font-size: 18px;'>Você foi excelente, continue praticando!</strong>";
    if (total === 0) {
        advice = "Você nem tentou! Jogue algumas rodadas para testar seu conhecimento.";
    } else if (maxErros > 0) {
        let den = parseInt(piorCompasso.split('/')[1]);
        if (den === 8) {
            advice = `Sua maior dificuldade está nos <strong style='color: var(--color-error);'>Compassos Compostos (${piorCompasso})</strong>.<br><br>👉 <b>Recomendação:</b> Revise a Fase 11 do MSA. Lembre-se que em compassos com denominador 8, a Colcheia é a Unidade de Movimento (vale 1 pulso).`;
        } else {
            advice = `Você teve dúvidas nos <strong style='color: var(--color-error);'>Compassos Simples (${piorCompasso})</strong>.<br><br>👉 <b>Recomendação:</b> Revise as Fases 2 e 3 do MSA. Foque em memorizar a equivalência das figuras em relação à Semínima.`;
        }
    }
    
    if (timeout) {
        advice = "<strong style='color: var(--color-error);'>⏰ O tempo esgotou!</strong><br><br>" + advice;
    }

    // Preenche os dados no HTML final
    document.getElementById('stat-acertos').innerText = score;
    document.getElementById('stat-erros').innerText = erros;
    document.getElementById('feedback-msa').innerHTML = advice;

    if (score > erros && score > 0) setTimeout(sfxUp, 500);
    else setTimeout(sfxErr, 500);
}

// --- EFEITO VISUAL ---
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

window.onload = initGame;