// =====================================================================
// DADOS DAS CLAVES E POSIÇÕES
// =====================================================================
const CLAVES = {
    sol: {
        nome: 'Clave de Sol', info: 'Sons agudos (2ª linha = Sol)',
        symbol: '𝄞', symY: 148, symX: 10,
        posToNote: {0:'LA', 1:'SOL', 2:'FA', 3:'MI', 4:'RE', 5:'DO', 6:'SI', 7:'LA', 8:'SOL', 9:'FA', 10:'MI', 11:'RE', 12:'DO'},
        fase1: ['DO','RE','MI','FA','SOL'],
        fase2: ['DO','RE','MI','FA','SOL','LA','SI'],
        fase3: ['MI','FA','SOL','LA','SI','DO','RE','MI','FA']
    },
    do: {
        nome: 'Clave de Dó', info: 'Sons médios (3ª linha = Dó)',
        symbol: '𝄡', symY: 140, symX: 10,
        posToNote: {0:'SI', 1:'LA', 2:'SOL', 3:'FA', 4:'MI', 5:'RE', 6:'DO', 7:'SI', 8:'LA', 9:'SOL', 10:'FA', 11:'MI', 12:'RE'},
        fase1: ['DO','RE','MI','FA','SOL'],
        fase2: ['SOL','LA','SI','DO','RE','MI'],
        fase3: ['RE','MI','FA','SOL','LA','SI','DO','RE','MI']
    },
    fa: {
        nome: 'Clave de Fá', info: 'Sons graves (4ª linha = Fá)',
        symbol: '𝄢', symY: 110, symX: 10,
        posToNote: {0:'DO', 1:'SI', 2:'LA', 3:'SOL', 4:'FA', 5:'MI', 6:'RE', 7:'DO', 8:'SI', 9:'LA', 10:'SOL', 11:'FA', 12:'MI'},
        fase1: ['DO','RE','MI','FA','SOL'],
        fase2: ['SOL','LA','SI','DO','RE'],
        fase3: ['SOL','LA','SI','DO','RE','MI','FA','SOL','LA']
    }
};

const NOTE_LABEL = {DO:'Dó', RE:'Ré', MI:'Mi', FA:'Fá', SOL:'Sol', LA:'Lá', SI:'Si'};

// Tradutor visual de posições para Feedback
function getNomePosicao(pos) {
    const desc = {
        0: 'linha suplementar superior', 1: 'espaço superior',
        2: '5ª linha', 3: '4º espaço', 4: '4ª linha', 5: '3º espaço',
        6: '3ª linha', 7: '2º espaço', 8: '2ª linha', 9: '1º espaço',
        10: '1ª linha', 11: 'espaço inferior', 12: 'linha suplementar inferior'
    };
    return desc[pos] || 'posição';
}

// =====================================================================
// ÁUDIO E SINTETIZADOR
// =====================================================================
let audioCtx = null;
function getCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }
const FREQ = { DO:261.63, RE:293.66, MI:329.63, FA:349.23, SOL:392.00, LA:440.00, SI:493.88 };

function playToneFreq(freq, dur=0.15) {
    try { const c=getCtx(),o=c.createOscillator(),g=c.createGain(); o.type='triangle'; o.frequency.value=freq; g.gain.setValueAtTime(0.2,c.currentTime); g.gain.exponentialRampToValueAtTime(0.01,c.currentTime+dur); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+dur); } catch(e) {}
}
function sfxUp()   { [523,659,784].forEach((f,i) => setTimeout(()=>playToneFreq(f,0.12), i*80)); }
function sfxDown() { [400,320].forEach((f,i) => setTimeout(()=>playToneFreq(f,0.18), i*120)); }
function ouvirNota() { playToneFreq(FREQ[notaAlvo] || 440, 1.2); }

// =====================================================================
// ESTADO DO JOGO E INICIALIZAÇÃO
// =====================================================================
let claveAtual = 'sol', faseAtual = 1, rodadaAtual = 0, totalRodadas = 8;
let notaAlvo = null, posAlvoPreferida = null, acertos = 0, erros = 0, score = 0, aguardando = true, sequencia = [];

window.onload = function() { gerarHitboxes(); };

window.selecionarClave = function(clave, btn) {
    claveAtual = clave;
    document.querySelectorAll('.clef-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('clef-info').innerText = CLAVES[clave].info;
};

window.selecionarFase = function(fase, btn) {
    faseAtual = fase;
    document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
};

window.fecharTutorial = function() { document.getElementById('tutorial-modal').classList.remove('active'); };
window.voltarMenu = function() { document.getElementById('screen-game').classList.remove('active'); document.getElementById('screen-summary').classList.remove('active'); document.getElementById('screen-select').classList.add('active'); };

window.iniciarJogo = function() {
    const clave = CLAVES[claveAtual];
    const notasFase = clave['fase'+faseAtual];
    acertos = 0; erros = 0; score = 0; rodadaAtual = 0;
    totalRodadas = faseAtual === 1 ? 8 : faseAtual === 2 ? 10 : 12;

    sequencia = [];
    for (let i = 0; i < totalRodadas; i++) {
        let n; do { n = notasFase[Math.floor(Math.random() * notasFase.length)]; } while (n === sequencia[sequencia.length - 1]);
        sequencia.push(n);
    }

    configurarPauta(claveAtual);
    document.getElementById('score').innerText = '0';
    document.getElementById('badge-jogo').innerText = `Fase ${faseAtual} · ${clave.nome.split(' ')[2]}`;
    document.getElementById('screen-select').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    proximaRodada();
};

// =====================================================================
// LÓGICA MATEMÁTICA DA PAUTA
// =====================================================================
function gerarHitboxes() {
    const group = document.getElementById('hitboxes-group');
    group.innerHTML = '';
    for(let i = 0; i <= 12; i++) {
        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '60');
        rect.setAttribute('y', 60 + (i * 10) - 5); 
        rect.setAttribute('width', '440');
        rect.setAttribute('height', '10');
        rect.setAttribute('class', 'slot-hit');
        rect.setAttribute('data-pos', i);
        rect.onclick = function() { clicarPos(this); };
        group.appendChild(rect);
    }
}

function configurarPauta(claveKey) {
    const c = CLAVES[claveKey];
    const sym = document.getElementById('clef-symbol');
    sym.textContent = c.symbol;
    sym.setAttribute('y', c.symY);
    sym.setAttribute('x', c.symX);
}

function proximaRodada() {
    if (rodadaAtual >= totalRodadas) { finalizarJogo(); return; }

    notaAlvo = sequencia[rodadaAtual];
    const mapa = CLAVES[claveAtual].posToNote;
    posAlvoPreferida = null;
    
    for (const [p, n] of Object.entries(mapa)) {
        if (n === notaAlvo) { posAlvoPreferida = parseInt(p); break; } // Pega a primeira ocorrência para usar como base se errar
    }
    
    aguardando = true;
    document.getElementById('user-note-group').setAttribute('opacity', '0');
    document.getElementById('correct-note-group').setAttribute('opacity', '0');

    document.getElementById('round-txt').innerText = `Rodada ${rodadaAtual+1} de ${totalRodadas}`;
    document.getElementById('prog-fill').style.width = ((rodadaAtual/totalRodadas)*100)+'%';
    document.getElementById('feedback').innerText = '';
    
    document.getElementById('target-note-name').innerText = NOTE_LABEL[notaAlvo];
    
    setTimeout(() => { ouvirNota(); }, 400);
}

// =====================================================================
// INTERAÇÃO E VALIDAÇÃO DE CLIQUE
// =====================================================================
window.clicarPos = function(slot) {
    if (!aguardando) return;
    aguardando = false;
    
    const posClicada = parseInt(slot.getAttribute('data-pos'));
    const yClicada = 60 + (posClicada * 10);
    const notaClicada = CLAVES[claveAtual].posToNote[posClicada] || '?';
    
    // NOVO: Acerta se a nota for igual, independentemente da oitava (posição)!
    const acertou = (notaClicada === notaAlvo);

    renderizarNota('user', 200, yClicada, notaClicada);

    if (acertou) {
        acertos++;
        score += 100;
        document.getElementById('feedback').innerHTML = "✓ Brilhante!";
        document.getElementById('feedback').style.color = "var(--success)";
        sfxUp();
        rodadaAtual++;
        setTimeout(proximaRodada, 1200);
    } else {
        erros++;
        score = Math.max(0, score - 30);
        
        const yCorreta = 60 + (posAlvoPreferida * 10);
        renderizarNota('correct', 320, yCorreta, notaAlvo);
        
        // NOVO: Explicação Pedagógica
        let msgErro = `✗ Você clicou na ${getNomePosicao(posClicada)} (${NOTE_LABEL[notaClicada]}).<br>`;
        msgErro += `<small style="color: #888; font-size: 14px;">A nota ${NOTE_LABEL[notaAlvo]} fica na ${getNomePosicao(posAlvoPreferida)}.</small>`;
        
        document.getElementById('feedback').innerHTML = msgErro;
        document.getElementById('feedback').style.color = "var(--error)";
        sfxDown();
        playToneFreq(FREQ[notaClicada], 0.3);
        setTimeout(() => playToneFreq(FREQ[notaAlvo], 0.8), 500);
        rodadaAtual++;
        setTimeout(proximaRodada, 3000);
    }
    document.getElementById('score').innerText = score;
};

function renderizarNota(tipo, x, y, nomeNota) {
    const group = document.getElementById(`${tipo}-note-group`);
    const ellipse = document.getElementById(`note-${tipo}`);
    const lbl = document.getElementById(`note-${tipo}-lbl`);
    const ledger = document.getElementById(`${tipo}-ledger`);
    
    group.setAttribute('opacity', '1');
    ellipse.setAttribute('cx', x);
    ellipse.setAttribute('cy', y);
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', y);
    lbl.textContent = nomeNota; 

    if (y <= 60 || y >= 180) { // Desenha linha suplementar se necessário
        ledger.setAttribute('opacity', '1');
        ledger.setAttribute('x1', x - 20);
        ledger.setAttribute('x2', x + 20);
        ledger.setAttribute('y1', y);
        ledger.setAttribute('y2', y);
    } else {
        ledger.setAttribute('opacity', '0');
    }
}

// =====================================================================
// FINALIZAÇÃO
// =====================================================================
function finalizarJogo() {
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-summary').classList.add('active');

    const pct = Math.round((acertos/totalRodadas)*100);
    document.getElementById('sum-pct').innerText = pct + '%';
    document.getElementById('sum-acertos').innerText = acertos;
    document.getElementById('sum-erros').innerText = erros;

    const emoji = document.getElementById('sum-emoji');
    if (pct >= 90) { emoji.innerText = '🏆'; sfxUp(); } else if (pct >= 60) { emoji.innerText = '🎵'; } else { emoji.innerText = '📚'; }

    const dicas = {
        sol: ['A Clave de Sol dita a 2ª linha. Treine Dó-Ré-Mi subindo e descendo mentalmente.', 'Saltos melódicos exigem que ouça a nota mentalmente antes de solfejá-la no Hino.', 'Parabéns! Leitura fluente na clave de Sol é essencial para sopranos e contraltos.'],
        do: ['O Dó central fica na 3ª linha. Use isso como âncora visual e conte a partir daí.', 'Em claves de Dó, o mesmo salto soa igual à clave de Sol, mas visualmente está noutra posição.', 'Excelente! O MSA aconselha estudar várias claves para ampliar a destreza musical.'],
        fa: ['O Fá3 fica na 4ª linha. Memorize que o Dó central fica na linha suplementar superior!', 'Nos hinos, o baixo dita a harmonia. Treine saltos largos.', 'Perfeito! Está preparado para solfejar as partes de baixo dos hinos da CCB.']
    };
    document.getElementById('sum-advice').innerText = dicas[claveAtual][faseAtual-1];
}

window.jogarNovamente = function() { document.getElementById('screen-summary').classList.remove('active'); iniciarJogo(); };