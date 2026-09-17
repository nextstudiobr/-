/* ══════════════════════════════════════════════════════════════════════════
   NEXT STUDIO — malha
   WebGL escrito à mão, sem three.js.

   O que ela conta: uma nuvem de pontos em desordem — o material bruto, o
   código — se organiza numa grade e ganha fios que desenham blocos de
   layout. É o próprio serviço da Next Studio virando imagem: da linha solta
   à interface montada. A ordem é controlada pela rolagem, então quem lê o
   manifesto vê a página se montar.

   Nada de esfera 3D genérica. Se o navegador não tiver WebGL, a seção
   continua perfeita — o canvas simplesmente não aparece.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;

var VERT = [
"attribute vec2 aGrade;",     // posição final, na grade
"attribute vec3 aCaos;",      // deslocamento do estado desordenado + semente
"uniform float uOrdem;",      // 0 = caos, 1 = layout montado
"uniform float uTempo;",
"uniform vec2  uTela;",
"varying float vBrilho;",
"varying float vOrdem;",
"",
"void main(){",
"  float s = aCaos.z;",
"  // a deriva do estado bruto: cada ponto no seu próprio compasso",
"  vec2 deriva = vec2(",
"    sin(uTempo*0.34 + s*7.7) * aCaos.x,",
"    cos(uTempo*0.29 + s*5.3) * aCaos.y",
"  );",
"  // o encaixe não é linear: os pontos chegam em ondas, da esquerda",
"  float atraso = clamp((aGrade.x + 1.0) * 0.5, 0.0, 1.0);",
"  float o = clamp((uOrdem - atraso*0.35) / 0.65, 0.0, 1.0);",
"  o = o*o*(3.0-2.0*o);",
"  vec2 pos = mix(aGrade + deriva, aGrade, o);",
"",
"  vBrilho = 0.5 + o*0.5;",
"  vOrdem  = o;",
"  gl_Position = vec4(pos, 0.0, 1.0);",
"  gl_PointSize = mix(2.0, 4.2, o) * min(uTela.y/720.0, 2.0);",
"}"
].join("\n");

var FRAG = [
"precision mediump float;",
"uniform vec3 uCorA;",
"uniform vec3 uCorB;",
"varying float vBrilho;",
"varying float vOrdem;",
"void main(){",
"  vec2 c = gl_PointCoord - 0.5;",
"  float r = length(c);",
"  if (r > 0.5) discard;",
"  float borda = smoothstep(0.5, 0.15, r);",
"  vec3 cor = mix(uCorA, uCorB, vOrdem);",
"  gl_FragColor = vec4(cor, borda * vBrilho * 0.9);",
"}"
].join("\n");

var VERT_FIO = [
"attribute vec2 aGrade;",
"attribute vec3 aCaos;",
"attribute float aPar;",      // 1 quando o fio pertence a um bloco de layout
"uniform float uOrdem;",
"uniform float uTempo;",
"uniform vec2  uTela;",
"varying float vAlfa;",
"void main(){",
"  float s = aCaos.z;",
"  vec2 deriva = vec2(",
"    sin(uTempo*0.34 + s*7.7) * aCaos.x,",
"    cos(uTempo*0.29 + s*5.3) * aCaos.y",
"  );",
"  float atraso = clamp((aGrade.x + 1.0) * 0.5, 0.0, 1.0);",
"  float o = clamp((uOrdem - atraso*0.35) / 0.65, 0.0, 1.0);",
"  o = o*o*(3.0-2.0*o);",
"  vec2 pos = mix(aGrade + deriva, aGrade, o);",
"  // o fio só existe depois que a grade se forma; os de bloco chegam por último",
"  vAlfa = o * mix(0.3, 0.85, aPar) * smoothstep(0.2, 0.8, uOrdem);",
"  gl_Position = vec4(pos, 0.0, 1.0);",
"}"
].join("\n");

var FRAG_FIO = [
"precision mediump float;",
"uniform vec3 uCorB;",
"varying float vAlfa;",
"void main(){ gl_FragColor = vec4(uCorB, vAlfa); }"
].join("\n");

function compila(gl, tipo, fonte){
  var s = gl.createShader(tipo);
  gl.shaderSource(s, fonte); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
  return s;
}
function programa(gl, v, f){
  var vs = compila(gl, gl.VERTEX_SHADER, v), fs = compila(gl, gl.FRAGMENT_SHADER, f);
  if (!vs || !fs) return null;
  var p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

function monta(tela, opcoes){
  opcoes = opcoes || {};
  var gl;
  try{
    gl = tela.getContext("webgl", { alpha:true, antialias:true, premultipliedAlpha:false, powerPreference:"low-power" })
      || tela.getContext("experimental-webgl");
  }catch(e){ return null; }
  if (!gl) return null;

  var pPonto = programa(gl, VERT, FRAG);
  var pFio   = programa(gl, VERT_FIO, FRAG_FIO);
  if (!pPonto || !pFio) return null;

  /* — a grade: densidade menor no celular, o efeito é o mesmo — */
  var estreito = innerWidth < 900;
  var COL = estreito ? 22 : 40;
  var LIN = estreito ? 14 : 22;

  var grade = [], caos = [];
  var i, j;
  for (j=0;j<LIN;j++){
    for (i=0;i<COL;i++){
      var x = (i/(COL-1)) * 2 - 1;
      var y = (j/(LIN-1)) * 2 - 1;
      grade.push(x * 0.94, y * 0.88);
      caos.push(
        (Math.random()*0.5 + 0.12) * 0.34,
        (Math.random()*0.5 + 0.12) * 0.30,
        Math.random()*10
      );
    }
  }

  /* — os fios: vizinhos da grade, mais os retângulos que viram blocos — */
  var fioG = [], fioC = [], fioP = [];
  function liga(a, b, bloco){
    fioG.push(grade[a*2], grade[a*2+1], grade[b*2], grade[b*2+1]);
    fioC.push(caos[a*3], caos[a*3+1], caos[a*3+2], caos[b*3], caos[b*3+1], caos[b*3+2]);
    fioP.push(bloco, bloco);
  }
  for (j=0;j<LIN;j++){
    for (i=0;i<COL;i++){
      var k = j*COL + i;
      if (i < COL-1) liga(k, k+1, 0);
      if (j < LIN-1) liga(k, k+COL, 0);
    }
  }
  /* os blocos: retângulos de layout desenhados por cima da grade.
     proporções de coluna de página, não formas aleatórias */
  var BLOCOS = estreito
    ? [[2,2,18,4],[2,7,8,5],[12,7,8,5]]
    : [[3,2,16,5],[21,2,16,5],[3,9,10,8],[15,9,22,4],[15,14,22,3]];
  BLOCOS.forEach(function(b){
    var x0=b[0], y0=b[1], w=b[2], h=b[3];
    var x1=Math.min(COL-1,x0+w), y1=Math.min(LIN-1,y0+h);
    var A=y0*COL+x0, B=y0*COL+x1, C=y1*COL+x1, D=y1*COL+x0;
    liga(A,B,1); liga(B,C,1); liga(C,D,1); liga(D,A,1);
  });

  function buf(dados, n){
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dados), gl.STATIC_DRAW);
    b.n = n; return b;
  }
  var bG = buf(grade,2),  bC = buf(caos,3);
  var bFG= buf(fioG,2),   bFC= buf(fioC,3), bFP = buf(fioP,1);

  var nPontos = grade.length/2;
  var nFios   = fioG.length/2;

  function atr(prog, nome, buffer, tam){
    var loc = gl.getAttribLocation(prog, nome);
    if (loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, tam, gl.FLOAT, false, 0, 0);
  }
  function uni(prog){
    return {
      ordem: gl.getUniformLocation(prog,"uOrdem"),
      tempo: gl.getUniformLocation(prog,"uTempo"),
      tela:  gl.getUniformLocation(prog,"uTela"),
      corA:  gl.getUniformLocation(prog,"uCorA"),
      corB:  gl.getUniformLocation(prog,"uCorB")
    };
  }
  var uP = uni(pPonto), uF = uni(pFio);

  var COR_A = opcoes.corA || [0.64,0.60,0.56];   // pedra: o material bruto
  var COR_B = opcoes.corB || [1.0,0.416,0.121];  // laranja da marca: montado

  var largura=0, altura=0, dpr=1;
  function mede(){
    dpr = Math.min(devicePixelRatio||1, innerWidth<900 ? 1.5 : 2);
    var r = tela.getBoundingClientRect();
    largura = Math.max(1, Math.round(r.width*dpr));
    altura  = Math.max(1, Math.round(r.height*dpr));
    if (tela.width !== largura || tela.height !== altura){
      tela.width = largura; tela.height = altura;
    }
    gl.viewport(0,0,largura,altura);
  }
  mede();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0,0,0,0);

  var ordem = REDUZ ? 1 : 0, ordemAlvo = REDUZ ? 1 : 0;
  var t0 = performance.now();
  var visivel = true;

  // a malha não reage ao ponteiro: quem a move é só a rolagem
  function desenha(){
    if (!visivel) return;
    var t = (performance.now() - t0)/1000;
    ordem += (ordemAlvo - ordem) * (REDUZ ? 1 : 0.055);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(pFio);
    gl.uniform1f(uF.ordem, ordem);
    gl.uniform1f(uF.tempo, t);
    gl.uniform2f(uF.tela, largura, altura);
    gl.uniform3fv(uF.corB, COR_B);
    atr(pFio,"aGrade",bFG,2); atr(pFio,"aCaos",bFC,3); atr(pFio,"aPar",bFP,1);
    gl.drawArrays(gl.LINES, 0, nFios);

    gl.useProgram(pPonto);
    gl.uniform1f(uP.ordem, ordem);
    gl.uniform1f(uP.tempo, t);
    gl.uniform2f(uP.tela, largura, altura);
    gl.uniform3fv(uP.corA, COR_A);
    gl.uniform3fv(uP.corB, COR_B);
    atr(pPonto,"aGrade",bG,2); atr(pPonto,"aCaos",bC,3);
    gl.drawArrays(gl.POINTS, 0, nPontos);
  }

  return {
    desenha: desenha,
    mede: mede,
    ordem: function(v){ ordemAlvo = v; },
    visivel: function(v){ visivel = v; },
    perdido: function(){ return gl.isContextLost(); }
  };
}

/* ═══ LIGAÇÃO COM A PÁGINA ═══════════════════════════════════════════════ */
function liga(){
  var telas = [].slice.call(document.querySelectorAll("[data-malha]"));
  if (!telas.length || !window.NS) return;

  telas.forEach(function(tela){
    var modo = tela.getAttribute("data-malha");
    var m = monta(tela, modo === "erro" ? { corA:[0.45,0.42,0.39] } : {});
    if (!m){ tela.remove(); return; }   // sem WebGL a seção segue inteira

    tela.classList.add("vivo");
    var secao = tela.closest("section") || tela.parentNode;

    // só desenha o que está na tela E com a aba à vista: as duas condições
    // valem juntas, uma não pode liberar o que a outra bloqueou
    var naTela = true, abaVisivel = !document.hidden;
    function atualiza(){ m.visivel(naTela && abaVisivel); }
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(e){
        naTela = e[0].isIntersecting; atualiza();
      }, { rootMargin:"120px" }).observe(tela);
    }
    document.addEventListener("visibilitychange", function(){
      abaVisivel = !document.hidden; atualiza();
    });

    /* medidas guardadas: ler o layout dentro do laço, depois que outros
       módulos já escreveram estilos no mesmo quadro, força recálculo */
    var topo = 0, alto = 1, roteiro = false;
    window.NS.aoMedir(function(){
      var r = secao.getBoundingClientRect();
      topo = r.top + (scrollY || 0);
      alto = secao.offsetHeight;
      var palco = secao.hasAttribute("data-roteiro") ? secao.firstElementChild : null;
      roteiro = !!palco && getComputedStyle(palco).position === "sticky";
      m.mede();
    });

    if (modo === "erro"){
      // no 404 a malha nunca se resolve: fica no limiar, sempre incompleta
      m.ordem(0.34);
      window.NS.inscreve(function(){ m.desenha(); });
      return;
    }

    window.NS.inscreve(function(s){
      var p;
      if (roteiro){
        // palco preso: a malha termina de se montar pouco depois da
        // terceira linha do manifesto, no mesmo percurso da rolagem
        var meio = innerHeight * 0.5;
        p = (s - topo + meio) / Math.max(1, alto - meio);
        m.ordem(Math.max(0, Math.min(1, (p - 0.06) / 0.62)));
      } else {
        // seção comum: entra em caos, sai montada
        p = (s + innerHeight - topo) / (alto + innerHeight);
        m.ordem(Math.max(0, Math.min(1, (p - 0.14) / 0.6)));
      }
      m.desenha();
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", liga);
else liga();

})();
