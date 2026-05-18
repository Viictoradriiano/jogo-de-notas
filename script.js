const CLEFS = {
    sol: {
        symbol:'𝄞', offsetTop:-30, fontSize:'90px',
        notas:[
            {nome:'mi', y:0},  {nome:'fá', y:10}, {nome:'sol',y:20},
            {nome:'lá', y:30}, {nome:'si', y:40}, {nome:'dó', y:50},
            {nome:'ré', y:60}, {nome:'mi', y:70}, {nome:'fá', y:80},
            {nome:'sol',y:90}
        ]
    },
    fa: {
        symbol:'𝄢', offsetTop:-24, fontSize:'75px',
        notas:[
            {nome:'sol',y:0},  {nome:'lá', y:10}, {nome:'si', y:20},
            {nome:'dó', y:30}, {nome:'ré', y:40}, {nome:'mi', y:50},
            {nome:'fá', y:60}, {nome:'sol',y:70}, {nome:'lá', y:80},
            {nome:'si', y:90}
        ]
    },
    do: {
        symbol:'𝄡', offsetTop:-14, fontSize:'75px',
        notas:[
            {nome:'fá', y:0},  {nome:'sol',y:10}, {nome:'lá', y:20},
            {nome:'si', y:30}, {nome:'dó', y:40}, {nome:'ré', y:50},
            {nome:'mi', y:60}, {nome:'fá', y:70}, {nome:'sol',y:80},
            {nome:'lá', y:90}
        ]
    }
};

const TICK_MAX = 16; 

const LEVELS = [
    { id:1, figuras:['semibreve','minima'] },
    { id:2, figuras:['semibreve','minima','seminima'] },
    { id:3, figuras:['minima','seminima','pausa_minima','pausa_seminima'] },
    { id:4, figuras:['seminima','colcheia','pausa_seminima'] },
    { id:5, figuras:['seminima','colcheia','pausa_seminima','pausa_colcheia'] },
    { id:6, figuras:['seminima','colcheia','semicolcheia','pausa_colcheia','pausa_semicolcheia'] }
];

const PAUSE_SYMS = {
    pausa_semibreve:'𝄻', pausa_minima:'𝄼',
    pausa_seminima:'𝄽',  pausa_colcheia:'𝄾', pausa_semicolcheia:'𝄿'
};
const NAMES = {
    pausa_semibreve:'Pausa Semibreve', pausa_minima:'Pausa Mínima',
    pausa_seminima:'Pausa Semínima',   pausa_colcheia:'Pausa Colcheia',
    pausa_semicolcheia:'Pausa Semicolcheia',
    dó:'Dó',ré:'Ré',mi:'Mi',fá:'Fá',sol:'Sol',lá:'Lá',si:'Si'
};

const TIMES_STR = {
    'semibreve': '4t', 'pausa_semibreve': '4t',
    'minima': '2t', 'pausa_minima': '2t',
    'seminima': '1t', 'pausa_seminima': '1t',
    'colcheia': '½t', 'pausa_colcheia': '½t',
    'semicolcheia': '¼t', 'pausa_semicolcheia': '¼t'
};

let clef, level, streak, totalRight, totalWrong;
let sequence, answersPitch, answersTime;
let slotStatusPitch, slotStatusTime, slotEvaluated;
let activeIndex = 0;
let activeType = 'pitch'; 
let nextTimer = null;
let isAnimating = false; 

(function() {
    const btn = document.getElementById('theme-toggle'), html = document.documentElement;
    let th = 'dark'; html.setAttribute('data-theme', th); upIcon();
    btn.addEventListener('click', () => { th = th === 'dark' ? 'light' : 'dark'; html.setAttribute('data-theme', th); upIcon(); });
    function upIcon() {
        btn.innerHTML = th === 'dark' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' 
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
})();

let audioCtx = null;
function getAC(){
    if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
function tone(freq,dur,type='sine',vol=0.12){
    try{const c=getAC(),o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur)}catch(e){}
}
function sfxOk(){tone(523,.08);setTimeout(()=>tone(659,.08),80);setTimeout(()=>tone(784,.18),160)}
function sfxUp(){[523,587,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.12,'sine',.15),i*90))}
function sfxErr(){tone(220,.07,'square',.08);setTimeout(()=>tone(180,.15,'square',.06),90)}
function sfxClick(){tone(800,.05,'sine',.05)}

document.addEventListener('DOMContentLoaded', () => {
    renderKeyboardLayouts();
    document.getElementById('btn-clef-sol').onclick = () => startGame('sol');
    document.getElementById('btn-clef-fa').onclick = () => startGame('fa');
    document.getElementById('btn-clef-do').onclick = () => startGame('do');
    document.getElementById('btn-back-menu').onclick = () => goMenu();
    document.getElementById('btn-return-menu').onclick = () => goMenu();
    document.getElementById('btn-end-session').onclick = () => endSession();
    document.getElementById('btn-verify-answers').onclick = () => verify();
});

function renderKeyboardLayouts() {
    const notesRow = document.getElementById('notes-keyboard-row');
    const pausesRow = document.getElementById('pauses-keyboard-row');
    const timeRow = document.getElementById('time-keyboard-row');
    
    const notes = ['dó', 'ré', 'mi', 'fá', 'sol', 'lá', 'si'];
    const pausas = ['pausa_semibreve', 'pausa_minima', 'pausa_seminima', 'pausa_colcheia', 'pausa_semicolcheia'];
    const tempos = ['4t', '2t', '1t', '½t', '¼t'];
    
    notes.forEach(n => { notesRow.innerHTML += `<button class="btn-key" onclick="answerPitch('${n}')">${n}</button>`; });
    pausas.forEach(p => { pausesRow.innerHTML += `<button class="btn-key btn-pause" onclick="answerPitch('${p}')">${NAMES[p]}</button>`; });
    tempos.forEach(t => { timeRow.innerHTML += `<button class="btn-key btn-time-key" onclick="answerTime('${t}')">${t}</button>`; });
}

function showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function setInteractionState(enabled) {
    isAnimating = !enabled;
    document.querySelectorAll('.btn-key, .btn-verify, .btn-end').forEach(b => b.disabled = !enabled);
}

function goMenu(){
    clearTimeout(nextTimer);
    setInteractionState(true);
    showScreen('screen-menu');
}

function startGame(c){
    clef=c; level=1; streak=0; totalRight=0; totalWrong=0;
    const el=document.getElementById('clave-symbol');
    el.textContent=CLEFS[c].symbol;
    el.style.top=CLEFS[c].offsetTop+'px';
    el.style.fontSize=CLEFS[c].fontSize;
    updateHeader();
    showScreen('screen-game');
    generateSeq();
}

function updateHeader(){
    document.getElementById('level-badge').textContent='Nível '+level;
    document.getElementById('session-stats').textContent=totalRight+' ✓ · '+totalWrong+' ✗';
    for(let i=0;i<3;i++) document.getElementById('pip'+i).classList.toggle('filled',i<streak);
    document.getElementById('level-progress-fill').style.width=((level-1)/6*100)+'%';
}

function getTicks(f){
    switch(f) {
        case 'semibreve': case 'pausa_semibreve': return 16;
        case 'minima': case 'pausa_minima': return 8;
        case 'seminima': case 'pausa_seminima': return 4;
        case 'colcheia': case 'pausa_colcheia': return 2;
        case 'semicolcheia': case 'pausa_semicolcheia': return 1;
        default: return 4;
    }
}

function generateSeq(){
    clearTimeout(nextTimer);
    setInteractionState(true);
    document.getElementById('message-area').innerHTML='';
    document.querySelectorAll('.nota-wrapper,.pausa-texto,.linha-suplementar').forEach(e=>e.remove());

    const allowed = LEVELS[level-1].figuras;
    let rem = TICK_MAX;
    const figs = [];

    while(rem > 0){
        let minTick = 1;
        if(figs.length >= 6) { minTick = rem; }
        
        let opts = allowed.filter(f => getTicks(f) <= rem && getTicks(f) >= minTick);
        
        if(!opts.length) {
            const fallback = ['semibreve','minima','seminima','colcheia','semicolcheia', 'pausa_semibreve', 'pausa_minima', 'pausa_seminima'];
            opts = fallback.filter(f => getTicks(f) === rem);
            if(!opts.length) break;
        }
        
        const f = opts[Math.floor(Math.random()*opts.length)];
        figs.push(f);
        rem -= getTicks(f);
    }

    // Ajuste de margem (xStart) para evitar colisão com o símbolo 4/4
    const xStart = 32;
    const xEnd   = 94;
    const step   = figs.length > 1 ? (xEnd - xStart) / (figs.length - 1) : 0;

    sequence = [];
    const staff = document.getElementById('pentagrama');

    for(let i=0; i<figs.length; i++){
        const fig = figs[i];
        const xPct = figs.length === 1
            ? ((xStart + xEnd) / 2) + '%'
            : (xStart + step * i) + '%';

        const isPause = fig.includes('pausa');
        let pitch = null;

        if(!isPause){
            const ns = CLEFS[clef].notas;
            pitch = ns[Math.floor(Math.random() * ns.length)];
        }

        sequence.push({ figura:fig, pitch, answerPitch: isPause ? fig : pitch.nome, answerTime: TIMES_STR[fig] });

        if(isPause){
            const d = document.createElement('div');
            d.className = 'pausa-texto';
            d.style.left = xPct;
            d.innerHTML = PAUSE_SYMS[fig];
            d.style.bottom = '40px'; 
            staff.appendChild(d);
        } else {
            const w = document.createElement('div');
            w.className = 'nota-wrapper';
            w.style.left   = xPct;
            w.style.bottom = pitch.y + 'px';

            const h = document.createElement('div');
            if(fig==='semibreve')      h.className='head-semibreve';
            else if(fig==='minima')    h.className='head-minima';
            else                       h.className='head-preta';
            w.appendChild(h);

            if(fig !== 'semibreve'){
                const isUp = pitch.y >= 40;
                const st = document.createElement('div');
                st.className = isUp ? 'stem-up' : 'stem-down';
                w.appendChild(st);

                if(fig==='colcheia'||fig==='semicolcheia'){
                    const f1=document.createElement('div');
                    f1.className=isUp?'flag-colcheia-up':'flag-colcheia-down';
                    w.appendChild(f1);
                    if(fig==='semicolcheia'){
                        const f2=document.createElement('div');
                        f2.className=isUp?'flag-semi-up':'flag-semi-down';
                        w.appendChild(f2);
                    }
                }
            }
            staff.appendChild(w);
            drawSupp(pitch.y, xPct);
        }
    }

    answersPitch  = new Array(sequence.length).fill(null);
    answersTime   = new Array(sequence.length).fill(null);
    slotStatusPitch = new Array(sequence.length).fill('');
    slotStatusTime  = new Array(sequence.length).fill('');
    slotEvaluated = new Array(sequence.length).fill(false);
    activeIndex   = 0;
    activeType    = 'pitch';
    renderSlots();
}

function drawSupp(y, x){
    const staff = document.getElementById('pentagrama');
    const add = (yy) => {
        const l = document.createElement('div');
        l.className = 'linha-suplementar';
        l.style.bottom = yy+'px';
        l.style.left   = x;
        staff.appendChild(l);
    };
    
    if (y >= 100) add(100);
    if (y >= 120) add(120);
    if (y <= -20) add(-20);
    if (y <= -40) add(-40);
}

function renderSlots(){
    const cont = document.getElementById('slots-container');
    cont.innerHTML = '';
    for(let i=0;i<sequence.length;i++){
        const col = document.createElement('div');
        col.className = 'slot-col';
        
        const sp = document.createElement('div');
        sp.className = 'slot slot-pitch'; sp.id = 'slot-p-'+i;
        sp.onclick = () => selectSlot(i, 'pitch');
        
        const st = document.createElement('div');
        st.className = 'slot slot-time'; st.id = 'slot-t-'+i;
        st.onclick = () => selectSlot(i, 'time');

        col.appendChild(sp);
        col.appendChild(st);
        cont.appendChild(col);
    }
    refreshSlots();
}

function selectSlot(i, type){
    if(isAnimating) return;
    activeIndex = i; 
    activeType = type;
    
    if(type === 'pitch') { answersPitch[i] = null; slotStatusPitch[i] = ''; } 
    else { answersTime[i] = null; slotStatusTime[i] = ''; }
    
    document.getElementById('message-area').innerHTML='';
    refreshSlots(); sfxClick();
}

function answerPitch(val){
    if(isAnimating) return;
    sfxClick();
    answersPitch[activeIndex] = val; 
    slotStatusPitch[activeIndex] = '';
    
    const s = document.getElementById('slot-p-'+activeIndex);
    s.classList.add('pop');
    setTimeout(()=>s.classList.remove('pop'),300);
    
    activeType = 'time';
    document.getElementById('message-area').innerHTML='';
    refreshSlots();
}

function answerTime(val){
    if(isAnimating) return;
    sfxClick();
    answersTime[activeIndex] = val; 
    slotStatusTime[activeIndex] = '';
    
    const s = document.getElementById('slot-t-'+activeIndex);
    s.classList.add('pop');
    setTimeout(()=>s.classList.remove('pop'),300);
    
    if(activeIndex < sequence.length - 1) { activeIndex++; activeType = 'pitch'; }
    
    document.getElementById('message-area').innerHTML='';
    refreshSlots();
}

function refreshSlots(){
    for(let i=0;i<sequence.length;i++){
        const sp = document.getElementById('slot-p-'+i);
        const vp = answersPitch[i];
        sp.innerHTML = vp
            ? (vp.includes('pausa')
                ? `<span style="font-family:'Noto Music',serif;font-size:26px;display:inline-block;transform:translateY(-2px)">${PAUSE_SYMS[vp]}</span>`
                : `<span>${vp.toUpperCase()}</span>`)
            : '';
        sp.className = 'slot slot-pitch';
        if(i === activeIndex && activeType === 'pitch') sp.classList.add('active');
        if(slotStatusPitch[i] === 'correct') sp.classList.add('correct');
        if(slotStatusPitch[i] === 'wrong')   sp.classList.add('wrong');

        const st = document.getElementById('slot-t-'+i);
        const vt = answersTime[i];
        st.innerHTML = vt ? `<span>${vt}</span>` : '';
        st.className = 'slot slot-time';
        if(i === activeIndex && activeType === 'time') st.classList.add('active');
        if(slotStatusTime[i] === 'correct') st.classList.add('correct');
        if(slotStatusTime[i] === 'wrong')   st.classList.add('wrong');
    }
}

function verify(){
    if(isAnimating) return;
    
    if(answersPitch.includes(null) || answersTime.includes(null)){
        document.getElementById('message-area').innerHTML='<div class="msg-warning">⚠ Preencha todas as notas e todos os tempos!</div>';
        return;
    }
    
    let allRight=true, errHTML='';
    
    for(let i=0;i<sequence.length;i++){
        let pGiven = answersPitch[i];
        let pCorrect = sequence[i].answerPitch;
        let tGiven = answersTime[i];
        let tCorrect = sequence[i].answerTime;
        
        let pOk = (pGiven === pCorrect);
        let tOk = (tGiven === tCorrect);

        slotStatusPitch[i] = pOk ? 'correct' : 'wrong';
        slotStatusTime[i]  = tOk ? 'correct' : 'wrong';

        if(pOk && tOk){
            if(!slotEvaluated[i]){ totalRight++; slotEvaluated[i]=true; }
        } else {
            allRight = false;
            if(!slotEvaluated[i]){ totalWrong++; slotEvaluated[i]=true; }
            
            let txtNoteCorrect = NAMES[pCorrect] || pCorrect;
            
            if(!pOk && !tOk) {
                errHTML+=`<div class="msg-error-item">❌ <b>Caixa ${i+1}:</b> Nota e Tempo errados. Era <b>${txtNoteCorrect}</b> valendo <b>${tCorrect}</b>.</div>`;
            } else if(!pOk) {
                errHTML+=`<div class="msg-error-item">❌ <b>Caixa ${i+1}:</b> Nota errada. Era <b>${txtNoteCorrect}</b>.</div>`;
            } else if(!tOk) {
                errHTML+=`<div class="msg-error-item">❌ <b>Caixa ${i+1}:</b> Tempo errado. Era <b>${tCorrect}</b>.</div>`;
            }
        }
    }
    
    refreshSlots(); updateHeader();

    if(allRight){
        setInteractionState(false);
        streak++; sfxOk(); updateHeader();
        let html='<div class="msg-success">🎉 Perfeito! Acertou notas e tempos!</div>';
        if(streak>=3 && level<6){
            level++; streak=0; sfxUp(); updateHeader();
            html+=`<div class="msg-level-up">🚀 Avançou para o Nível ${level}!</div>`;
            confetti();
        } else if(level===6 && streak>=3){
            streak=0; sfxUp(); updateHeader();
            html+=`<div class="msg-level-up">🏆 Mestre! Você dominou a Rítmica e a Melodia!</div>`;
            confetti();
        }
        document.getElementById('message-area').innerHTML=html;
        nextTimer=setTimeout(generateSeq, 2800);
    } else {
        streak=0; updateHeader(); sfxErr();
        document.getElementById('message-area').innerHTML='<div class="msg-errors-list">'+errHTML+'</div>';
    }
}

function endSession(){
    clearTimeout(nextTimer);
    setInteractionState(true);
    const total=totalRight+totalWrong;
    if(total===0){
        document.getElementById('summary-emoji').textContent='🤷';
        document.getElementById('summary-title').textContent='Nenhuma nota avaliada';
        document.getElementById('summary-sub').textContent='Tente verificar pelo menos uma resposta antes de terminar.';
        document.getElementById('summary-bar').style.width='0%';
        document.getElementById('stat-acertos').textContent='0';
        document.getElementById('stat-erros').textContent='0';
        document.getElementById('stat-pct-a').textContent='';
        document.getElementById('stat-pct-e').textContent='';
        showScreen('screen-summary'); return;
    }
    const pct=Math.round(totalRight/total*100);
    let emoji,title,sub;
    if(pct>=90){emoji='🏆';title='Excelente desempenho!';sub='Você está dominando a leitura musical.'}
    else if(pct>=70){emoji='🎵';title='Muito bem!';sub='Continue praticando para atingir a fluência total.'}
    else if(pct>=50){emoji='📚';title='Bom esforço!';sub='Revise as figuras com mais erros e tente novamente.'}
    else{emoji='💪';title='Continue estudando!';sub='Prática diária vai fazer uma grande diferença.'}
    document.getElementById('summary-emoji').textContent=emoji;
    document.getElementById('summary-title').textContent=title;
    document.getElementById('summary-sub').textContent=sub;
    document.getElementById('stat-acertos').textContent=totalRight;
    document.getElementById('stat-erros').textContent=totalWrong;
    document.getElementById('stat-pct-a').textContent=pct+'%';
    document.getElementById('stat-pct-e').textContent=(100-pct)+'%';
    showScreen('screen-summary');
    setTimeout(()=>{ document.getElementById('summary-bar').style.width=pct+'%' }, 100);
    if(pct>=70) sfxUp();
}

function confetti(){
    const colors=['#9b7ff0','#e08a4a','#5baa6e','#e5696f','#e8a633','#60a5fa'];
    for(let i=0;i<40;i++){
        setTimeout(()=>{
            const p=document.createElement('div');
            p.className='confetti-piece';
            p.style.left=(Math.random()*100)+'vw';
            p.style.top='-10px';
            p.style.background=colors[Math.floor(Math.random()*colors.length)];
            p.style.animationDuration=(1+Math.random()*.8)+'s';
            p.style.animationDelay=(Math.random()*.4)+'s';
            document.body.appendChild(p);
            setTimeout(()=>p.remove(),2500);
        }, i*28);
    }
}