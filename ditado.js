// =====================================================================
// MAPA DE FREQUÊNCIAS E ALTURAS VISUAIS DINÂMICAS POR CLAVE
// =====================================================================
const FREQ_MAP = { 'DO': 261.63, 'RE': 293.66, 'MI': 329.63, 'FA': 349.23, 'SOL': 392.00, 'LA': 440.00, 'SI': 493.88 };

// Define a posição Y da nota no SVG dependendo da clave selecionada
const Y_MAP = {
    'sol': { 'DO':170, 'RE':160, 'MI':150, 'FA':140, 'SOL':130, 'LA':120, 'SI':110 }, // Dó na linha suplementar inferior
    'do':  { 'DO':110, 'RE':100, 'MI':150, 'FA':140, 'SOL':130, 'LA':120, 'SI':110 }, // Dó central na 3a linha
    'fa':  { 'DO':130, 'RE':120, 'MI':110, 'FA':100, 'SOL':90,  'LA':80,  'SI':70  }  // Fá na 4a linha
};

const SYMBOL_MAP = { 'sol': { sym: '𝄞', y: 145 }, 'do': { sym: '𝄡', y: 140 }, 'fa': { sym: '𝄢', y: 115 } };

// BANCO DE MELODIAS
const DITADOS_DB = {
    1: [
        { nome: "Exercício A", notas: [{p:'MI', d:1}, {p:'FA', d:1}, {p:'SOL', d:2}] },
        { nome: "Exercício B", notas: [{p:'SOL', d:1}, {p:'FA', d:1}, {p:'MI', d:2}] }
    ],
    2: [
        { nome: "Métrica Mista", notas: [{p:'DO', d:1}, {p:'MI', d:1}, {p:'SOL', d:1}, {p:'MI', d:1}] },
        { nome: "Graus Conjuntos", notas: [{p:'RE', d:1}, {p:'MI', d:1}, {p:'FA', d:1}, {p:'RE', d:1}] }
    ],
    3: [
        { nome: "Hino (Trecho)", notas: [{p:'MI', d:1}, {p:'MI', d:1}, {p:'FA', d:2}] },
        { nome: "Hino (Início)", notas: [{p:'SOL', d:1}, {p:'SOL', d:1}, {p:'LA', d:1}, {p:'SI', d:1}] }
    ]
};

let audioCtx = null;
function getCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }

function playTone(freq, duration) {
    try {
        const c = getCtx(), o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        o.connect(g).connect(c.destination);
        o.start(); o.stop(c.currentTime + duration);
    } catch(e) {}
}

// =====================================================================
// ESTADO DO JOGO
// =====================================================================
let claveAtual = 'sol';
let nivelAtual = 1;
let exercicioIndex = 0;
let melodiaAlvo = null;
let slotSelecionadoIndex = null;
let respostasUsuario = [];
let score = 0;
let tentativasRestantes = 1; // Dá 1 chance extra (2 tentativas no total)

function fecharTutorial() { document.getElementById('tutorial-modal').classList.remove('active'); }
function voltarMenu() { document.getElementById('screen-game').classList.remove('active'); document.getElementById('screen-summary').classList.remove('active'); document.getElementById('screen-select').classList.add('active'); }

function selecionarClave(clave, btn) {
    claveAtual = clave;
    document.querySelectorAll('.clef-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function selecionarNivel(nv, btn) { 
    nivelAtual = nv; 
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected')); 
    btn.classList.add('selected'); 
}

function iniciarJogo() {
    exercicioIndex = 0; score = 0;
    document.getElementById('score').innerText = '0';
    document.getElementById('screen-select').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    
    // Atualiza o desenho da clave na pauta do jogo
    const svgSym = document.getElementById('clef-symbol-svg');
    svgSym.textContent = SYMBOL_MAP[claveAtual].sym;
    svgSym.setAttribute('y', SYMBOL_MAP[claveAtual].y);
    
    document.getElementById('badge-jogo').innerText = `Nível ${nivelAtual} · ${claveAtual.toUpperCase()}`;
    carregarExercicio();
}

function carregarExercicio() {
    const lista = DITADOS_DB[nivelAtual];
    melodiaAlvo = lista[exercicioIndex];
    tentativasRestantes = 1; // Reseta as tentativas
    
    document.getElementById('feedback').innerText = '';
    document.getElementById('btn-verify').innerText = 'Verificar Resposta ✓';
    
    slotSelecionadoIndex = 0; 
    respostasUsuario = melodiaAlvo.notas.map(() => ({ pitch: null, dur: 1 })); 
    
    renderizarSlotsPauta();
    ouvirMelodia();
}

// =====================================================================
// RENDERIZAÇÃO DA PAUTA
// =====================================================================
function renderizarSlotsPauta() {
    const group = document.getElementById('slots-group');
    group.innerHTML = '';
    
    const totalNotas = melodiaAlvo.notas.length;
    const larguraSlot = 70;
    const espacamento = 25;
    const startX = (520 - (totalNotas * (larguraSlot + espacamento) - espacamento)) / 2;

    respostasUsuario.forEach((resp, idx) => {
        const x = startX + idx * (larguraSlot + espacamento);
        
        // Caixa do Slot
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x); rect.setAttribute('y', '50');
        rect.setAttribute('width', larguraSlot); rect.setAttribute('height', '120');
        rect.setAttribute('class', idx === slotSelecionadoIndex ? 'slot-rect selected' : 'slot-rect');
        rect.setAttribute('id', `slot-rect-${idx}`);
        rect.onclick = () => selecionarSlot(idx);
        group.appendChild(rect);

        // Se preenchido, desenha a nota
        if (resp.pitch) {
            const yPos = Y_MAP[claveAtual][resp.pitch];
            
            // Linha suplementar para notas extremas (ex: Dó na Clave de Sol)
            if (yPos >= 170 || yPos <= 50) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x + 15); line.setAttribute('x2', x + 55);
                line.setAttribute('y1', yPos); line.setAttribute('y2', yPos);
                line.setAttribute('stroke', '#e8e6e1'); line.setAttribute('stroke-width', '2');
                group.appendChild(line);
            }

            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ellipse.setAttribute('cx', x + 35); ellipse.setAttribute('cy', yPos);
            ellipse.setAttribute('rx', '10'); ellipse.setAttribute('ry', '7');
            ellipse.setAttribute('fill', '#9b7ff0');
            group.appendChild(ellipse);

            const haste = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            haste.setAttribute('x1', x + 44); haste.setAttribute('y1', yPos);
            haste.setAttribute('x2', x + 44); haste.setAttribute('y2', yPos - 32);
            haste.setAttribute('stroke', '#9b7ff0'); haste.setAttribute('stroke-width', '2.5');
            group.appendChild(haste);

            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', x + 35); txt.setAttribute('y', '190');
            txt.setAttribute('fill', '#888'); txt.setAttribute('font-size', '12');
            txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('font-weight', 'bold');
            txt.textContent = `${resp.pitch} (${resp.dur}T)`;
            group.appendChild(txt);
        }
    });
}

function selecionarSlot(idx) {
    slotSelecionadoIndex = idx;
    document.querySelectorAll('.slot-rect').forEach((r, i) => r.classList.toggle('selected', i === idx));
}

document.querySelectorAll('#pitch-grid .pad-btn').forEach(btn => {
    btn.onclick = () => {
        if (slotSelecionadoIndex === null) return;
        const p = btn.getAttribute('data-pitch');
        respostasUsuario[slotSelecionadoIndex].pitch = p;
        playTone(FREQ_MAP[p], 0.4);
        renderizarSlotsPauta();
        if (slotSelecionadoIndex < melodiaAlvo.notas.length - 1) selecionarSlot(slotSelecionadoIndex + 1);
    };
});

document.querySelectorAll('#duration-grid .pad-btn').forEach(btn => {
    btn.onclick = () => {
        if (slotSelecionadoIndex === null) return;
        respostasUsuario[slotSelecionadoIndex].dur = parseInt(btn.getAttribute('data-dur'));
        renderizarSlotsPauta();
    };
});

function ouvirMelodia() {
    let tempoAcumulado = 0;
    melodiaAlvo.notas.forEach(nota => {
        setTimeout(() => { playTone(FREQ_MAP[nota.p], nota.d * 0.7); }, tempoAcumulado * 800);
        tempoAcumulado += nota.d;
    });
}

// =====================================================================
// AVALIAÇÃO COM SEGUNDA CHANCE (FEEDBACK DETALHADO)
// =====================================================================
function verificarDitado() {
    let tudoPreenchido = respostasUsuario.every(r => r.pitch !== null);
    if (!tudoPreenchido) {
        document.getElementById('feedback').innerText = "Preencha todos os compassos vazios!";
        return;
    }

    let acertosLocais = 0;
    let listaErros = []; // Array para guardar a explicação de cada erro

    melodiaAlvo.notas.forEach((alvo, idx) => {
        const user = respostasUsuario[idx];
        const rect = document.getElementById(`slot-rect-${idx}`);
        
        let erroNota = user.pitch !== alvo.p;
        let erroTempo = user.dur !== alvo.d;

        if (!erroNota && !erroTempo) {
            acertosLocais++;
            rect.classList.add('correct-eval');
            rect.classList.remove('error-eval');
        } else {
            rect.classList.add('error-eval');
            rect.classList.remove('correct-eval');
            
            // Registra qual foi o erro exatamente para mostrar ao usuário
            if (erroNota && erroTempo) listaErros.push(`Slot ${idx + 1}: Nota e Tempo errados`);
            else if (erroNota) listaErros.push(`Slot ${idx + 1}: Nota errada`);
            else if (erroTempo) listaErros.push(`Slot ${idx + 1}: Tempo errado`);
        }
    });

    const total = melodiaAlvo.notas.length;
    const fb = document.getElementById('feedback');

    // ACERTOU TUDO
    if (acertosLocais === total) {
        score += (tentativasRestantes === 1) ? 200 : 100; // Ganha mais pontos se acertar de primeira
        fb.innerHTML = "🏆 Perfeito! O seu ouvido interno está afiado!";
        fb.style.color = "var(--success)";
        document.getElementById('score').innerText = score;
        setTimeout(() => exibirResumo(acertosLocais, total), 2000);
        return;
    }

    // ERROU, MAS TEM UMA CHANCE EXTRA
    if (tentativasRestantes > 0) {
        tentativasRestantes--;
        fb.innerHTML = `<b>Quase lá! Corrige os seguintes erros:</b><br><span style="font-size:12px;color:#ccc;">${listaErros.join(' | ')}</span>`;
        fb.style.color = "var(--warn)";
        document.getElementById('btn-verify').innerText = 'Tentar Novamente 🔄';
    } 
    // ERROU PELA SEGUNDA VEZ (GAME OVER DA RODADA)
    else {
        fb.innerHTML = "As correções não bateram. Vamos analisar o resultado!";
        fb.style.color = "var(--error)";
        setTimeout(() => exibirResumo(acertosLocais, total), 2500);
    }
}

function exibirResumo(certas, total) {
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-summary').classList.add('active');
    
    let pct = Math.round((certas / total) * 100);
    document.getElementById('sum-pct').innerText = pct + '%';
    document.getElementById('sum-acertos').innerText = certas;
    document.getElementById('sum-erros').innerText = total - certas;

    let advice = "";
    if (pct === 100) {
        advice = "<b>Excelente percepção!</b> O MSA valoriza o aluno que consegue transcrever a melodia perfeitamente. Continue a praticar!";
    } else {
        advice = "<b>Dica de Estudo:</b> Se teve dificuldades, tente cantar as notas usando os nomes reais (Solfejo falado) enquanto ouve o áudio, antes de preencher a pauta.";
    }
    document.getElementById('sum-advice').innerHTML = advice;
}

function proximaMelodia() {
    exercicioIndex++;
    if (exercicioIndex >= DITADOS_DB[nivelAtual].length) exercicioIndex = 0;
    document.getElementById('screen-summary').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    carregarExercicio();
}