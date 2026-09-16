(function(){
"use strict";

/* ══════════════════════════════════════════════════════════════
   NEXT STUDIO / comportamento
   Sem dependências. Tudo escrito à mão.
   ══════════════════════════════════════════════════════════════ */

/* ── CONFIG: planos ────────────────────────────────────────────
   Para editar os preços ou adicionar recursos, mexa só aqui.
   `recursos` aceita quantos itens você quiser. A lista aparece
   sozinha embaixo do nome do plano. Deixe [] para não exibir nada.
   ────────────────────────────────────────────────────────────── */
var PLANOS = [
  {
    nome:"Start", preco:"R$ 599", msg:"Oi! Vim pelo site da Next Studio. Quero o plano Start (R$ 599).", tag:"", destaque:false,
    resumo:"Uma página só, do começo ao fim.",
    explica:"A pessoa entra, rola a tela até o fim e já sabe quem é você, o que você faz e como te chamar. Não tem menu, não tem para onde se perder: é tudo numa página.",
    recursos:["Uma página, do topo ao rodapé","Escrito do zero, sem template","Funciona bem no celular"],
    exemplo:{ texto:"Ver um site assim", url:"https://danielebeauty.com.br" }
  },
  {
    nome:"Pro", preco:"R$ 789", msg:"Oi! Vim pelo site da Next Studio. Quero o plano Pro (R$ 789).", tag:"Mais escolhido", destaque:true,
    resumo:"Várias páginas, com menu em cima.",
    explica:"Para quando uma página só não dá conta. O site ganha um menu e cada assunto vira uma aba separada: serviços, cardápio, sobre, contato. A pessoa clica e vai direto no que quer.",
    recursos:["Várias páginas com menu","Escrito do zero, sem template","Funciona bem no celular"],
    exemplo:{ texto:"Ver um site assim", url:"https://netxstudiobr.github.io/geladapocket/" }
  },
  {
    nome:"Premium", preco:"R$ 978", msg:"Oi! Vim pelo site da Next Studio. Quero o plano Premium (R$ 978).", tag:"", destaque:false,
    resumo:"Tudo do Pro mais uma aba de compras.",
    explica:"O cliente escolhe o que quer no próprio site e paga ali mesmo pelo Pix. A sua chave fica integrada na página, então o dinheiro cai direto na sua conta, sem intermediário.",
    recursos:["Tudo o que tem no Pro","Aba de compras no site","Pagamento por Pix integrado"],
    exemplo:null
  }
];
/* ── Contato ──────────────────────────────────────────────────
   Um número, uma função. Cada botão manda a sua própria
   mensagem já escrita, para você saber de onde a pessoa veio. */
var ZAP = "5511998677704";
function zap(msg){
  return "https://wa.me/" + ZAP + "?text=" + encodeURIComponent(msg);
}
var MSG_GERAL  = "Oi! Vim pelo site da Next Studio. Quero fazer um site.";
var MSG_DUVIDA = "Oi! Vim pelo site da Next Studio e queria tirar uma dúvida.";

/* ── utilidades ─────────────────────────────────────────────── */
var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var clamp = function(v,a,b){ return v<a?a:(v>b?b:v); };
var lerp  = function(a,b,t){ return a+(b-a)*t; };
var suave = function(t){ return t<0?0:t>1?1:t*t*(3-2*t); };
var saida = function(t){ return 1-Math.pow(1-clamp(t,0,1),3); };

var mqReduz = window.matchMedia("(prefers-reduced-motion: reduce)");
var REDUZ   = mqReduz.matches;
var FINO    = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
var DESK    = function(){ return window.innerWidth >= 900; };

/* ── nível de desempenho ────────────────────────────────────── */
function nivel(){
  if (REDUZ) return "off";
  var mem = navigator.deviceMemory || 4;
  var cpu = navigator.hardwareConcurrency || 4;
  var w   = window.innerWidth;
  var econ = window.matchMedia("(prefers-reduced-data: reduce)").matches;
  if (econ) return "off";
  if (w < 700 || mem <= 2 || cpu <= 3) return "baixo";
  if (w < 1280 || mem <= 4 || cpu <= 5) return "medio";
  return "alto";
}
var NIVEL = nivel();

/* ══ 01. AMBIENTE GENERATIVO (WebGL próprio) ═════════════════ */
var Ambiente = (function(){
  var cv, gl, prog, u = {}, raf = null, t0 = performance.now();
  var esc = 0.7, dprMax = 1.5, planos = 5, oct = 4;
  var alvoM = [0,0], m = [0,0], mood = 0, alvoMood = 0, inten = 0;
  var vivo = false, estatico = false;

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  function FS(){
    return [
      "precision " + (NIVEL === "alto" ? "highp" : "mediump") + " float;",
      "#define PLANOS " + planos,
      "#define OCT " + oct,
      "uniform vec2 uRes;uniform vec2 uM;uniform float uT,uS,uMood,uInt;",
      "float hash(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+34.7);return fract(p.x*p.y);}",
      "float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
      "float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));",
      "return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}",
      "float fbm(vec2 p){float s=0.,a=.55;mat2 r=mat2(.8,.6,-.6,.8);",
      "for(int i=0;i<OCT;i++){s+=a*ruido(p);p=r*p*2.02;a*=.5;}return s;}",
      "void main(){",
      "vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;",
      "float acc=0.,bri=0.;",
      "for(int i=0;i<PLANOS;i++){",
      " float fi=float(i);float z=1.+fi*.9;",
      " vec2 p=uv*(1.15+fi*.55);",
      " p+=uM*(.09/z);",
      " p.y+=uS*(.55/z)+uT*.014/z;",
      " p.x+=uT*.006/z;",
      " float w=fbm(p*1.35+fbm(p*.65+uT*.02)*.9);",
      " float r=1.-abs(w*2.-1.);r=pow(clamp(r,0.,1.),3.2);",
      " float pe=exp(-fi*.52);acc+=r*pe;bri+=r*pe*pe;}",
      "acc/=1.9;",
      "vec3 cor=mix(vec3(.034,.029,.024),vec3(.104,.088,.072),clamp(acc*1.2,0.,1.));",
      "vec2 g=gl_FragCoord.xy/uRes-.5;",
      "vec2 e=vec2(.17+uM.x*.11+sin(uT*.11)*.055,-.05+uM.y*.085+cos(uT*.08)*.045);",
      "float d=length((g-e)*vec2(1.2,1.0));",
      "float brasa=exp(-d*d*13.5);",
      "cor+=vec3(1.,.416,.122)*brasa*(.017+bri*.19)*(.5+uMood*.8)*uInt;",
      "cor*=1.+.02*sin(uv.y*170.+uT*.2);",
      "cor*=mix(.42,1.,smoothstep(1.15,.15,length(uv)));",
      "cor+=(hash(gl_FragCoord.xy+fract(uT)*91.)-.5)*.018;",
      "gl_FragColor=vec4(max(cor,0.),1.);}"
    ].join("\n");
  }

  function compilar(tipo, src){
    var s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }

  function iniciar(){
    cv = document.getElementById("amb");
    if (!cv) return false;
    if (NIVEL === "off") { estatico = true; return false; }

    if (NIVEL === "baixo")      { esc = .42; dprMax = 1.0; planos = 3; oct = 2; }
    else if (NIVEL === "medio") { esc = .58; dprMax = 1.3; planos = 4; oct = 3; }
    else                        { esc = .72; dprMax = 1.5; planos = 5; oct = 4; }

    try {
      gl = cv.getContext("webgl", { alpha:false, antialias:false, depth:false, stencil:false, powerPreference:"low-power" })
        || cv.getContext("experimental-webgl");
    } catch(e){ gl = null; }
    if (!gl) return false;

    var vs = compilar(gl.VERTEX_SHADER, VS), fs = compilar(gl.FRAGMENT_SHADER, FS());
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    ["uRes","uM","uT","uS","uMood","uInt"].forEach(function(n){ u[n] = gl.getUniformLocation(prog, n); });

    redimensionar();
    vivo = true;
    return true;
  }

  function redimensionar(){
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, dprMax);
    var w = Math.max(1, Math.round(window.innerWidth  * dpr * esc));
    var h = Math.max(1, Math.round(window.innerHeight * dpr * esc));
    if (cv.width === w && cv.height === h) return;
    cv.width = w; cv.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.uRes, w, h);
  }

  function quadro(agora){
    raf = null;
    if (!vivo) return;
    var t = (agora - t0) / 1000;
    m[0] = lerp(m[0], alvoM[0], .045);
    m[1] = lerp(m[1], alvoM[1], .045);
    mood  = lerp(mood, alvoMood, .02);
    inten = lerp(inten, 1, .02);
    gl.uniform1f(u.uT, t);
    gl.uniform1f(u.uS, window.scrollY / Math.max(1, window.innerHeight) * 0.5);
    gl.uniform2f(u.uM, m[0], m[1]);
    gl.uniform1f(u.uMood, mood);
    gl.uniform1f(u.uInt, inten);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    agendar();
  }
  function agendar(){ if (vivo && !raf && !document.hidden) raf = requestAnimationFrame(quadro); }

  return {
    iniciar: function(){
      var ok = iniciar();
      if (!ok) { if (cv) cv.style.display = estatico ? "" : ""; return; }
      agendar();
      window.addEventListener("resize", function(){ redimensionar(); }, { passive:true });
      document.addEventListener("visibilitychange", function(){
        if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
        else { t0 = performance.now() - 1000; agendar(); }
      });
      if (FINO) window.addEventListener("mousemove", function(ev){
        alvoM[0] = (ev.clientX / window.innerWidth  - .5) * 2;
        alvoM[1] = (.5 - ev.clientY / window.innerHeight) * 2;
      }, { passive:true });
    },
    clima: function(v){ alvoMood = v; },
    ativo: function(){ return vivo; }
  };
})();

/* ══ 02. MOTOR DE SCROLL ═════════════════════════════════════ */
var R = { y:0, ey:0, vh:0, vel:0 }, atores = [], rodando = false;

function ator(el, fn, modo){
  if (!el) return null;
  var a = { el:el, fn:fn, modo:modo || "passa", top:0, h:0 };
  atores.push(a); return a;
}
function medir(){
  R.vh = window.innerHeight;
  for (var i=0;i<atores.length;i++){
    var a = atores[i], r = a.el.getBoundingClientRect();
    a.top = r.top + window.scrollY; a.h = r.height;
  }
  medirServicos(); medirTicker(); medirEspinha();
}

function quadro(){
  var y = window.scrollY;
  R.vel = y - R.y; R.y = y;
  R.ey = REDUZ ? y : lerp(R.ey, y, .14);
  if (Math.abs(R.ey - y) < .05) R.ey = y;

  for (var i=0;i<atores.length;i++){
    var a = atores[i], p;
    if (a.modo === "pin") p = (y - a.top) / Math.max(1, a.h - R.vh);
    else                  p = (R.ey + R.vh - a.top) / Math.max(1, a.h + R.vh);
    if (p > -.3 && p < 1.3) a.fn(clamp(p,0,1), y, a);
  }
  passoTicker(); passoEspinha();
  document.documentElement.classList.toggle("claro", claroSec || fimClaro);
  if (rodando) requestAnimationFrame(quadro);
}
function ligarLoop(){ if (!rodando){ rodando = true; requestAnimationFrame(quadro); } }
document.addEventListener("visibilitychange", function(){
  if (document.hidden) rodando = false; else ligarLoop();
});

/* ══ 03. REVELAÇÕES ══════════════════════════════════════════ */
function revelacoes(){
  var alvos = $$(".rv, .linhas, .sobre__fig, [data-passo]");
  if (!("IntersectionObserver" in window)){
    alvos.forEach(function(el){ el.classList.add(el.classList.contains("linhas") ? "revelado" : "dentro"); });
    return;
  }
  var io = new IntersectionObserver(function(ents){
    ents.forEach(function(en){
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add(el.classList.contains("linhas") ? "revelado" : "dentro");
      io.unobserve(el);
    });
  }, { rootMargin:"0px 0px -12% 0px", threshold:.12 });
  alvos.forEach(function(el){ io.observe(el); });

  var acesos = new IntersectionObserver(function(ents){
    ents.forEach(function(en){ if (en.isIntersecting) en.target.classList.add("aceso"); });
  }, { rootMargin:"-52% 0px -34% 0px" });
  $$("[data-passo]").forEach(function(el){ acesos.observe(el); });
}

/* ══ 04. ABERTURA ════════════════════════════════════════════ */
function abertura(feito){
  var carga = $("#carga"), fio = $("#cargaFio"), num = $("#cargaN");
  if (!carga){ feito(); return; }
  if (REDUZ){ carga.parentNode.removeChild(carga); feito(); return; }

  /* a contagem inteira só na primeira página da visita.
     Trocar de aba não pode custar mais um segundo de espera. */
  var voltou = false;
  try {
    voltou = sessionStorage.getItem("ns-visita") === "1";
    sessionStorage.setItem("ns-visita", "1");
  } catch(e){}

  var t0 = performance.now(), dur = voltou ? 240 : 1050, fim = false;
  function sai(){
    if (fim) return; fim = true;
    carga.classList.add("fora");
    setTimeout(function(){ if (carga.parentNode) carga.parentNode.removeChild(carga); }, 1150);
    feito();
  }
  (function passo(agora){
    var p = clamp((agora - t0) / dur, 0, 1), e = saida(p);
    fio.style.transform = "scaleX(" + e.toFixed(4) + ")";
    num.textContent = ("00" + Math.round(e * 100)).slice(-3);
    if (p < 1) requestAnimationFrame(passo); else setTimeout(sai, voltou ? 20 : 150);
  })(t0);
  setTimeout(sai, 3600);
}

/* ══ 05. NAVEGAÇÃO ═══════════════════════════════════════════ */
function navegacao(){
  var nav = $("#navbar"), cap = $("#capitulo");
  var ultimo = 0;

  window.addEventListener("scroll", function(){
    var y = window.scrollY;
    nav.classList.toggle("densa", y > 40);
    var descendo = y > ultimo;
    if (y > 560 && descendo && !document.body.classList.contains("trava")) nav.classList.add("oculta");
    else nav.classList.remove("oculta");
    ultimo = y;
  }, { passive:true });

  if (!("IntersectionObserver" in window)) return;

  /* cada seção carrega o próprio capítulo e o próprio clima no HTML
     (data-cap="01 / Projetos" e data-clima=".16"), então o trilho da
     esquerda funciona igual em qualquer aba, sem lista fixa aqui. */
  var secoes = $$("[data-cap]");
  if (!secoes.length) return;

  var io = new IntersectionObserver(function(ents){
    ents.forEach(function(en){
      if (!en.isIntersecting) return;
      var partes = (en.target.getAttribute("data-cap") || "").split("/");
      if (cap && partes.length > 1){
        cap.innerHTML = "<b>" + partes[0].trim() + "</b> / " + partes[1].trim().toUpperCase();
      }
      var clima = parseFloat(en.target.getAttribute("data-clima"));
      Ambiente.clima(isNaN(clima) ? .2 : clima);
    });
  }, { rootMargin:"-46% 0px -46% 0px" });
  secoes.forEach(function(el){ io.observe(el); });
}

/* ══ 06. MENU ════════════════════════════════════════════════ */
function menu(){
  var bt = $("#burg"), mn = $("#menu"), nav = $("#navbar");
  if (!bt || !mn) return;
  var aberto = false;

  function abrir(){
    aberto = true; mn.hidden = false;
    requestAnimationFrame(function(){ mn.classList.add("aberto"); });
    bt.setAttribute("aria-expanded", "true");
    bt.setAttribute("aria-label", "Fechar menu");
    document.body.classList.add("trava");
    nav.classList.remove("oculta"); nav.classList.add("com-menu");
  }
  function fechar(){
    aberto = false; mn.classList.remove("aberto");
    bt.setAttribute("aria-expanded", "false");
    bt.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("trava");
    nav.classList.remove("com-menu");
    setTimeout(function(){ if (!aberto) mn.hidden = true; }, 800);
  }
  bt.addEventListener("click", function(){ aberto ? fechar() : abrir(); });
  $$("a", mn).forEach(function(a){ a.addEventListener("click", fechar); });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && aberto){ fechar(); bt.focus(); }
  });
}

/* ══ 07. TICKER ══════════════════════════════════════════════ */
var tickRow, tickMeio = 0, tickX = 0;
function montarTicker(){
  tickRow = $("#tickRow"); if (!tickRow) return;
  var frases = ["Sites feitos à mão","Sem template","Código próprio","Design autoral","Feito do zero"];
  var base = frases.map(function(f, i){
    return '<span class="tick__it' + (i % 2 ? " tick__it--oco" : "") + '">' + f +
           '<img src="assets/logo-mark.png" alt="" width="101" height="124"></span>';
  }).join("");
  tickRow.innerHTML = base;
  var w1 = tickRow.scrollWidth || 1;
  var k = Math.max(1, Math.ceil(window.innerWidth / w1) + 1);
  var conjunto = new Array(k + 1).join(base);
  tickRow.innerHTML = conjunto + conjunto;
  medirTicker();
}
function medirTicker(){ if (tickRow) tickMeio = tickRow.scrollWidth / 2; }
function passoTicker(){
  if (!tickRow || !tickMeio) return;
  if (REDUZ){ tickRow.style.transform = "translate3d(0,0,0)"; return; }
  var v = .45 + clamp(R.vel * .07, -5.5, 9);
  tickX -= v;
  if (tickX <= -tickMeio) tickX += tickMeio;
  if (tickX > 0) tickX -= tickMeio;
  tickRow.style.transform = "translate3d(" + tickX.toFixed(2) + "px,0,0)";
}

/* ══ 08. ESPINHA (progresso do site) ═════════════════════════ */
var espFill, espMark, espAlt = 0;
function medirEspinha(){
  var esp = $(".espinha");
  espAlt = esp ? esp.getBoundingClientRect().height : 0;
}
function passoEspinha(){
  if (!espFill) return;
  var max = Math.max(1, document.documentElement.scrollHeight - R.vh);
  var p = clamp(R.ey / max, 0, 1);
  espFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
  espMark.style.transform = "translateY(" + (p * espAlt).toFixed(1) + "px)";
}

/* ══ 09. SERVIÇOS / varredura horizontal ═════════════════════ */
var servSec, servTrack, servFio, servNum, servDist = 0;
function medirServicos(){
  if (!servSec || !servTrack) return;
  var itens = $$(".serv__it", servTrack);
  if (!DESK() || !itens.length){
    servSec.style.height = ""; servTrack.style.transform = ""; servDist = 0; return;
  }
  var pad = parseFloat(getComputedStyle(servTrack).paddingLeft) || 0;
  var ult = itens[itens.length - 1];
  var total = (ult.offsetLeft - itens[0].offsetLeft) + ult.offsetWidth + pad * 2;
  servDist = Math.max(0, Math.round(total - window.innerWidth));
  servSec.style.height = (window.innerHeight + servDist) + "px";
}
function servicos(){
  servSec = $("[data-serv]"); servTrack = $("#servTrack");
  servFio = $("#servFio"); servNum = $("#servN");
  if (!servSec || !servTrack) return;

  ator(servSec, function(p){
    if (!servDist) return;
    servTrack.style.transform = "translate3d(" + (-servDist * p).toFixed(1) + "px,0,0)";
    if (servFio) servFio.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (servNum){
      var n = Math.min(4, Math.floor(p * 3.999) + 1);
      servNum.textContent = "0" + n + " / 04";
    }
  }, "pin");

  /* arrastar = avançar o scroll (1:1 com a varredura) */
  var arrastando = false, x0 = 0, y0 = 0, movido = false;
  servTrack.addEventListener("pointerdown", function(e){
    if (!DESK() || !servDist || e.pointerType === "touch") return;
    arrastando = true; movido = false; x0 = e.clientX; y0 = window.scrollY;
    servTrack.classList.add("arrastando");
    servTrack.setPointerCapture(e.pointerId);
  });
  servTrack.addEventListener("pointermove", function(e){
    if (!arrastando) return;
    var dx = e.clientX - x0;
    if (Math.abs(dx) > 3) movido = true;
    window.scrollTo(0, y0 - dx);
  });
  function solta(e){
    if (!arrastando) return;
    arrastando = false;
    servTrack.classList.remove("arrastando");
    try { servTrack.releasePointerCapture(e.pointerId); } catch(err){}
  }
  servTrack.addEventListener("pointerup", solta);
  servTrack.addEventListener("pointercancel", solta);
  servTrack.addEventListener("click", function(e){ if (movido) e.preventDefault(); }, true);
  servTrack.addEventListener("dragstart", function(e){ e.preventDefault(); });
}

/* ══ 10. PROJETOS ════════════════════════════════════════════ */
function projetos(){
  $$("[data-caso]").forEach(function(el){
    var fant = $(".caso__fant", el),
        quadro = $(".caso__quadro", el),
        img = $("[data-par-img]", el);
    ator(el, function(p){
      if (REDUZ) return;
      if (fant)  fant.style.transform = "translate3d(0," + ((.5 - p) * 190).toFixed(1) + "px,0)";
      if (quadro){
        var e = saida(clamp(p * 1.85, 0, 1));
        quadro.style.transform = "translate3d(0," + ((p - .5) * -26).toFixed(1) + "px,0) scale(" + (.932 + .068 * e).toFixed(4) + ")";
      }
    });
  });
}

/* ══ 11. SOBRE / foto em parallax ════════════════════════════ */
function sobre(){
  var fig = $(".sobre__fig"), foto = $("[data-foto]");
  if (!fig || !foto) return;
  ator(fig, function(p){
    if (REDUZ) return;
    foto.style.transform = "translate3d(0," + ((p - .5) * -8).toFixed(2) + "%,0)";
  });
}

/* ══ 12. PROCESSO + DIFERENCIAL ══════════════════════════════ */
function fios(){
  var lista = $("#procLista"), fio = $("#procFio");
  if (lista && fio) ator(lista, function(p){
    fio.style.transform = "scaleY(" + clamp((p - .12) * 1.85, 0, 1).toFixed(4) + ")";
  });

  var dif = $(".dif"), risco = $("#difRisco");
  if (dif && risco) ator(dif, function(p){
    risco.style.transform = "scaleX(" + suave(clamp((p - .08) * 2.4, 0, 1)).toFixed(4) + ")";
  });
}

/* ══ 13. CTA FINAL / cortina laranja ═════════════════════════ */
var fimClaro = false, claroSec = false;
function cortina(){
  var sec = $("[data-fim]"), on = $("#fimOn");
  if (!sec || !on) return;
  if (REDUZ){ fimClaro = false; return; }
  ator(sec, function(p){
    var e = suave(clamp((p - .10) / .42, 0, 1));
    var v = "inset(" + ((1 - e) * 100).toFixed(2) + "% 0 0 0)";
    on.style.webkitClipPath = v; on.style.clipPath = v;
    fimClaro = e > .55;
  });
}

function luz(){
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function(ents){
    ents.forEach(function(en){ claroSec = en.isIntersecting; });
  }, { rootMargin:"-50% 0px -50% 0px" });
  $$("[data-claro]").forEach(function(el){ io.observe(el); });
}

/* ══ 14. FILME DO HERO ═══════════════════════════════════════ */
function filme(){
  var cx = $("#heroFilme"), vd = $("#heroVideo");
  if (!cx || !vd) return;

  /* quem pediu menos movimento não recebe vídeo nenhum */
  if (REDUZ){ vd.pause(); vd.removeAttribute("src"); vd.load(); return; }

  function acender(){ cx.classList.add("no-ar"); }
  function tocar(){ var p = vd.play(); if (p && p.catch) p.catch(function(){}); }

  if (vd.readyState >= 2) acender();
  vd.addEventListener("loadeddata", acender);
  vd.addEventListener("playing", acender);
  vd.addEventListener("error", function(){ cx.classList.remove("no-ar"); });

  tocar();

  /* alguns navegadores só liberam o autoplay depois do primeiro toque */
  ["pointerdown","keydown"].forEach(function(ev){
    document.addEventListener(ev, function um(){
      document.removeEventListener(ev, um);
      if (vd.paused) tocar();
    }, { passive:true });
  });

  /* fora da tela ou aba escondida: pausa e devolve a CPU */
  document.addEventListener("visibilitychange", function(){
    if (document.hidden) vd.pause(); else if (dentroDaTela()) tocar();
  });

  function dentroDaTela(){
    var r = cx.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  }

  if ("IntersectionObserver" in window){
    new IntersectionObserver(function(regs){
      regs.forEach(function(reg){
        if (reg.isIntersecting){ if (!document.hidden) tocar(); }
        else vd.pause();
      });
    }, { threshold:0 }).observe(cx);
  }
}

/* ══ 15. PLANOS ══════════════════════════════════════════════ */
function planos(){
  var lista = $("#preLista"); if (!lista) return;
  lista.innerHTML = PLANOS.map(function(pl, i){
    var n = ("0" + (i + 1)).slice(-2);
    var rec = (pl.recursos && pl.recursos.length)
      ? '<ul class="pre__rec">' + pl.recursos.map(function(r){ return "<li>" + r + "</li>"; }).join("") + "</ul>"
      : "";
    var ex = pl.exemplo
      ? '<a class="lk" href="' + pl.exemplo.url + '" target="_blank" rel="noopener noreferrer">' +
          pl.exemplo.texto + " <i>&rarr;</i></a>"
      : "";
    return '<article class="pre__l' + (pl.destaque ? " pre__l--destaque" : "") + '">' +
      '<div class="pre__in">' +
        '<div class="pre__cab">' +
          '<span class="pre__idx">Plano ' + n + "</span>" +
          '<h3 class="pre__nome">' + pl.nome +
            (pl.tag ? ' <span class="pre__tag">' + pl.tag + "</span>" : "") + "</h3>" +
          '<span class="pre__valor">' + pl.preco + "</span>" +
        "</div>" +
        '<div class="pre__corpo">' +
          '<p class="pre__resumo">' + pl.resumo + "</p>" +
          '<p class="pre__exp">' + pl.explica + "</p>" + rec +
          '<div class="pre__acoes">' +
            '<a class="bt' + (pl.destaque ? " bt--forte" : "") + '" href="' +
              zap(pl.msg || MSG_GERAL) +
              '" target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp sobre o plano ' +
              pl.nome + '"><span>Quero esse</span><i>&rarr;</i></a>' + ex +
          "</div>" +
        "</div>" +
      "</div></article>";
  }).join("");
}

/* ══ 16. PARTIDA ═════════════════════════════════════════════ */
function partida(){
  planos();
  montarTicker();
  espFill = $("#espFill"); espMark = $("#espMark");

  projetos(); sobre(); fios(); cortina(); servicos(); filme();

  /* eco do chevron no hero */
  var eco = $("#heroEco"), hero = $(".hero");
  if (eco && hero) ator(hero, function(p){
    if (REDUZ) return;
    eco.style.transform = "translateY(-50%) translate3d(0," + (p * 90).toFixed(1) + "px,0) rotate(" + (p * 5).toFixed(2) + "deg)";
  });

  navegacao(); menu(); luz(); revelacoes();
  Ambiente.iniciar();

  medir(); ligarLoop();

  var tRedim;
  window.addEventListener("resize", function(){
    clearTimeout(tRedim);
    tRedim = setTimeout(function(){ medir(); montarTicker(); }, 180);
  }, { passive:true });

  window.addEventListener("load", function(){ medir(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ medir(); });
  setTimeout(medir, 900);
  setTimeout(medir, 2200);

  mqReduz.addEventListener && mqReduz.addEventListener("change", function(){ location.reload(); });
}

/* abre a cortina, revela o hero, liga o resto */
function comecar(){
  abertura(function(){
    var h1 = $("#heroTit");
    if (h1) h1.classList.add("revelado");
    $$(".hero .rv").forEach(function(el){ el.classList.add("dentro"); });
  });
  partida();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", comecar);
else comecar();

})();
