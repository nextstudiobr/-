/* ══════════════════════════════════════════════════════════════════════════
   NEXT STUDIO — abertura

   O vídeo 1 é a entrada e aparece INTEIRO, sem recorte: `object-fit:contain`
   garante que nenhuma parte seja cortada em proporção de tela nenhuma. Só as
   bordas se dissolvem no fundo preto, para não sobrar faixa nas laterais.

   A medição de carregamento não disputa espaço com ele: é um fio rente ao
   rodapé com o número ao lado. Ela reflete o carregamento real dos assets
   críticos — não é um contador de tempo fingindo ser progresso.

   A foto da capa entra na conta, para já estar pronta quando ela aparecer.

   Saídas de emergência: autoplay bloqueado, vídeo com erro, rede lenta,
   aba em segundo plano, retorno na mesma sessão, prefers-reduced-motion
   e sem-JS (aí a abertura simplesmente não existe).
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var raiz  = document.documentElement;
var palco = document.getElementById("abertura");
if (!palco) return;

var capa    = document.getElementById("capa");
var filme1  = document.getElementById("filmeAbertura");
var elN     = document.getElementById("aberturaN");

var REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;
var VISTO = (function(){
  try { return sessionStorage.getItem("ns:abertura") === "1"; } catch(e){ return false; }
})();

/* Se a aba nasceu em segundo plano (alguém abriu com Ctrl+clique), não há
   espetáculo para assistir: entrega o conteúdo pronto quando a pessoa chegar. */
var nasceuOculta = document.hidden;

var PISO = VISTO ? 600  : 2000;
var TETO = VISTO ? 2400 : 6000;

var t0 = performance.now();
var prog = 0;      // o que se vê (sobe sempre, nunca volta)
var real = 0;      // o que de fato carregou
var acabou = false;
var quadro = 0;
var ultimoPasso = 0;   // quando o laço de animação rodou pela última vez

/* ══ 1. MEDIÇÃO REAL ═════════════════════════════════════════════════════ */
var itens = [];

function item(peso, nome){
  var o = { peso:peso, v:0, nome:nome, fim:false };
  itens.push(o);
  return o;
}
function fecha(o){
  if (o.fim) return;
  o.fim = true; o.v = 1;
  calcula();
}
function calcula(){
  var soma = 0, total = 0;
  for (var i=0;i<itens.length;i++){
    total += itens[i].peso;
    soma  += itens[i].peso * itens[i].v;
  }
  real = total ? soma/total : 1;
}

function segueVideo(v, peso, nome){
  var o = item(peso, nome);
  if (!v){ fecha(o); return o; }

  function medir(){
    if (o.fim) return;
    try{
      var d = v.duration;
      if (v.buffered && v.buffered.length && d && isFinite(d)){
        var fim = v.buffered.end(v.buffered.length-1);
        o.v = Math.min(1, (fim/d) / 0.6);
        calcula();
      }
    }catch(e){}
  }

  v.addEventListener("progress", medir);
  v.addEventListener("loadedmetadata", medir);
  v.addEventListener("canplay",        function(){ fecha(o); });
  v.addEventListener("canplaythrough", function(){ fecha(o); });
  v.addEventListener("error", function(){ o.erro = true; fecha(o); });

  if (v.readyState >= 3) fecha(o);
  return o;
}

function segueImagem(src, peso, nome){
  var o = item(peso, nome);
  if (!src){ fecha(o); return o; }
  var im = new Image();
  im.onload = im.onerror = function(){ fecha(o); };
  im.src = src;
  if (im.complete) fecha(o);
  return o;
}

var oV1 = segueVideo(filme1, 34, "abertura");

/* a foto da capa é carregada enquanto o vídeo 1 roda: quando a abertura
   sai, ela já está inteira embaixo */
var fotoCel = palco.getAttribute("data-capa-foto-cel");
var emPe = fotoCel && matchMedia("(max-width: 899px) and (max-aspect-ratio: 3/4)").matches;
segueImagem(emPe ? fotoCel : palco.getAttribute("data-capa-foto"), 14, "foto da capa");
segueImagem(palco.getAttribute("data-marca"), 4, "marca");

var oFontes = item(16, "fontes");
if (document.fonts && document.fonts.ready){
  document.fonts.ready.then(function(){ fecha(oFontes); });
  setTimeout(function(){ fecha(oFontes); }, 4000);
} else {
  fecha(oFontes);
}

/* O evento `load` fecha o que não é vídeo: CSS, fontes e imagens acabaram.
   O vídeo carrega por fora do `load` e se anuncia sozinho pelo `canplay`. */
window.addEventListener("load", function(){
  for (var i=0;i<itens.length;i++){
    var o = itens[i];
    if (o.fim) continue;
    if (o === oV1) o.v = Math.max(o.v, 0.75);
    else fecha(o);
  }
  calcula();
});

calcula();

/* ══ 2. O LAÇO ═══════════════════════════════════════════════════════════ */
function passo(){
  if (acabou) return;
  ultimoPasso = performance.now();

  var t = performance.now() - t0;
  var pelaHora = Math.min(1, t / PISO);
  var alvo = Math.min(Math.max(real, pelaHora * 0.92), 1);

  prog += (alvo - prog) * 0.075;
  if (prog > alvo) prog = alvo;

  var venceu   = (t >= PISO && real >= 0.999);
  var estourou = t >= TETO;
  if (venceu || estourou) prog += (1 - prog) * 0.16;

  pinta(prog);

  if (prog >= 0.995 && (venceu || estourou)){ pinta(1); encerra(); return; }
  quadro = requestAnimationFrame(passo);
}

function pinta(p){
  var n = Math.round(p * 100);
  palco.style.setProperty("--p", p.toFixed(4));
  if (elN){
    var s = n < 100 ? ("0" + n).slice(-2) : "100";
    if (elN.dataset.n !== s){
      elN.dataset.n = s;
      elN.innerHTML = s + "<b>%</b>";
    }
  }
}

/* ══ 3. A SAÍDA ══════════════════════════════════════════════════════════
   O vídeo apaga inteiro, como entrou. O fio de medição sobe e vira a linha
   da leitura da capa e se recolhe ali. */
function encerra(){
  if (acabou) return;
  acabou = true;
  cancelAnimationFrame(quadro);
  prog = 1; pinta(1);
  try { sessionStorage.setItem("ns:abertura","1"); } catch(e){}

  document.body.classList.remove("travado");
  raiz.classList.add("entrou");

  if (REDUZ || nasceuOculta || document.hidden){
    revela();
    some(0);
    return;
  }

  var passou = passagem();
  palco.classList.add("abertura--saindo");
  revela();
  // o fio leva ~1,05s para subir; a capa assume a linha aos 1,2s (53% de
  // 2,3s). A abertura some logo depois, com as duas linhas sobrepostas.
  some(passou ? 1300 : 700);
}

/* A passagem: mede onde está o fio da abertura e onde está a linha da
   leitura da capa, e manda o fio subir até lá. Se a capa não estiver em
   quadro (tela restaurada no meio da página), não há passagem: só apaga. */
function passagem(){
  var medida = palco.querySelector(".abertura__medida");
  var fio    = palco.querySelector(".abertura__fio");
  var alvo   = document.querySelector(".capa__leitura");
  if (!medida || !fio || !alvo || !capa) return false;

  var a = fio.getBoundingClientRect();
  var b = alvo.getBoundingClientRect();
  if (!b.height || b.top < 0 || b.top > innerHeight) return false;

  var dy = (b.top - 0.5) - (a.top + a.height/2);
  palco.classList.add("abertura--passa");
  medida.style.transform = "translate3d(0," + dy.toFixed(1) + "px,0)";
  capa.classList.add("recebeu");
  return true;
}

function revela(){
  if (capa) capa.classList.add("vivo");
  document.dispatchEvent(new CustomEvent("ns:capa"));
}

function some(atraso){
  setTimeout(function(){
    palco.hidden = true;
    palco.setAttribute("aria-hidden","true");
    /* o vídeo 1 sai de cena de verdade. Ele usa <source> filho, então tirar
       o atributo src do <video> não faria nada: é a fonte que precisa sair. */
    if (filme1){
      try {
        filme1.pause();
        var fontes = filme1.querySelectorAll("source");
        for (var i=0;i<fontes.length;i++) fontes[i].remove();
        filme1.removeAttribute("src");
        filme1.load();
        filme1.dataset.descarregado = "1";
      } catch(e){}
    }
  }, atraso);
}

/* ══ 4. ARRANQUE ═════════════════════════════════════════════════════════ */
if (REDUZ){
  pinta(1);
  revela();
  document.body.classList.remove("travado");
  raiz.classList.add("entrou");
  palco.hidden = true;
  return;
}

document.body.classList.add("travado");

/* A abertura sempre começa no topo: sem isto, um recarregamento no meio da
   página restauraria a rolagem por baixo da tela de entrada. */
if (!VISTO){
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch(e){}
  scrollTo(0, 0);
}

/* autoplay: se o navegador recusar, o pôster assume e a abertura segue */
if (filme1){
  var p = filme1.play();
  if (p && p.catch) p.catch(function(){ /* o pôster cobre; nada a fazer */ });
}

/* rede muito ruim: se o vídeo nem metadados trouxer em 3,5s, sai da conta */
setTimeout(function(){
  if (filme1 && filme1.readyState < 1) fecha(oV1);
}, 3500);

quadro = requestAnimationFrame(passo);

/* ── vigia ────────────────────────────────────────────────────────────────
   requestAnimationFrame PARA de todo numa aba em segundo plano — não é
   throttling, é pausa. Um temporizador continua correndo, então é ele quem
   garante o encerramento, com ou sem quadros desenhados. */
var vigia = setInterval(function(){
  if (acabou){ clearInterval(vigia); return; }
  var agora = performance.now(), t = agora - t0;
  // o vigia só assume se o laço estiver parado; com quadros correndo, quem
  // encerra é o próprio laço, depois de o número subir até 100 sem saltos
  var parado = agora - ultimoPasso > 300;
  if (parado && real >= 0.999 && t >= PISO){ encerra(); clearInterval(vigia); return; }
  if (t >= TETO){ encerra(); clearInterval(vigia); return; }
}, 200);

document.addEventListener("visibilitychange", function(){
  if (document.hidden || acabou) return;
  if (performance.now() - t0 >= PISO && real >= 0.999) encerra();
  else quadro = requestAnimationFrame(passo);
});

/* trava dura final */
setTimeout(function(){ if (!acabou) encerra(); }, 10000);

})();
