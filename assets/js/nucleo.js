/* ══════════════════════════════════════════════════════════════════════════
   NEXT STUDIO — núcleo
   Motor de interação escrito à mão. Zero dependência externa.

   Rolagem: a página rola NATIVAMENTE. Nada de sequestrar a roda do mouse —
   isso quebra teclado, busca na página, inércia do celular e leitor de tela.
   O que é suavizado é o VALOR que alimenta as animações, então o movimento
   tem a maciez de um scroll suave sem nenhum dos prejuízos dele.

   Ordem: 0 base · 1 relógio · 2 revelar · 3 capa · 6 topo e menu
          7 fio de progresso · 7b roteiro · 7c janelas · 7d régua · 7e fecho
          7f whatsapp fixo
          8 processo · 9 acordeão · 11 formulário · 12 saída · 13 miudezas
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

/* ═══ 0. BASE ════════════════════════════════════════════════════════════ */
var raiz = document.documentElement;
raiz.classList.remove("no-js");
raiz.classList.add("js");

var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var trava   = function(v,a,b){ return v<a?a:(v>b?b:v); };
var mistura = function(a,b,t){ return a+(b-a)*t; };

var REDUZ = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ═══ 0b. ENDEREÇOS SEM ".html" ══════════════════════════════════════════
   No ar, o GitHub Pages entrega "contato.html" quando alguém pede
   "/contato"; por isso os links do site não levam a extensão. Aberto direto
   do disco (file://) não existe essa troca, então lá os links internos
   ganham o ".html" de volta. E quem chegar por um endereço antigo com
   ".html" vê a barra de endereço limpa. */
var NO_DISCO = location.protocol === "file:";

function pagina(h){
  if (!NO_DISCO || !h) return h;
  var m = h.match(/^([^#?]*)(.*)$/), cam = m[1], resto = m[2];
  if (!cam) return h;                                   // só âncora
  if (/^[a-z][a-z0-9+.-]*:/i.test(cam)) return h;       // http:, mailto:, tel:
  if (cam === "./" || cam === ".") return "index.html" + resto;
  if (cam.slice(-1) === "/" || /\.[a-z0-9]+$/i.test(cam)) return h;  // pasta ou arquivo
  return cam + ".html" + resto;
}
function linksNoDisco(){
  if (!NO_DISCO) return;
  $$("a[href]").forEach(function(a){
    var h = a.getAttribute("href"), n = pagina(h);
    if (n !== h) a.setAttribute("href", n);
  });
}
function enderecoLimpo(){
  if (NO_DISCO || !history.replaceState || $("#erro404")) return;
  var p = location.pathname;
  if (!/\.html$/.test(p)) return;
  p = p.replace(/index\.html$/, "").replace(/\.html$/, "");
  try { history.replaceState(history.state, "", p + location.search + location.hash); } catch(e){}
}

var ZAP = "5511998677704";
function zap(msg){ return "https://wa.me/" + ZAP + "?text=" + encodeURIComponent(msg); }

/* ═══ 1. RELÓGIO ═════════════════════════════════════════════════════════
   Um só requestAnimationFrame para o site inteiro. Dezenas de laços
   concorrentes é como se perde quadro. */
var inscritos = [];
var rolo = 0, roloSuave = 0, veloc = 0, roloAnterior = 0;
var alt = innerHeight;

function inscreve(fn){ inscritos.push(fn); return fn; }

function tique(){
  rolo = scrollY || pageYOffset;
  roloSuave = mistura(roloSuave, rolo, REDUZ ? 1 : 0.12);
  veloc = mistura(veloc, rolo - roloAnterior, 0.18);
  roloAnterior = rolo;
  for (var i=0;i<inscritos.length;i++){
    try { inscritos[i](roloSuave, veloc, rolo); } catch(e){}
  }
  requestAnimationFrame(tique);
}
requestAnimationFrame(tique);

/* medidas: lidas uma vez por redimensionamento, nunca dentro do laço */
var remede = [];
function aoMedir(fn){ remede.push(fn); fn(); }
var pausaMedida;
function remedeTudo(){
  alt = innerHeight;
  for (var i=0;i<remede.length;i++){ try{ remede[i](); }catch(e){} }
}
addEventListener("resize", function(){
  clearTimeout(pausaMedida);
  pausaMedida = setTimeout(remedeTudo, 140);
}, { passive:true });
/* fontes e imagens mudam a altura das seções depois do primeiro desenho:
   as posições guardadas precisam ser lidas de novo quando elas chegam */
addEventListener("load", remedeTudo);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedeTudo);

/* ═══ 2. REVELAR ═════════════════════════════════════════════════════════ */
var observa = null;
if ("IntersectionObserver" in window){
  observa = new IntersectionObserver(function(ent){
    for (var i=0;i<ent.length;i++){
      if (!ent[i].isIntersecting) continue;
      ent[i].target.classList.add("vivo");
      observa.unobserve(ent[i].target);
    }
  }, { rootMargin:"0px 0px -10% 0px", threshold:0.06 });
}

function acorda(raizEl){
  var alvos = $$("[data-rv], .rv, .janela, .passo, [data-tracar]", raizEl||document);
  if (!observa){
    alvos.forEach(function(el){ el.classList.add("vivo"); });
    return;
  }
  alvos.forEach(function(el){
    // escalona as linhas para o bloco ser traçado em sequência, não de uma vez
    var linhas = $$(".tr", el);
    if (linhas.length > 1){
      linhas.forEach(function(l,i){
        if (!l.style.getPropertyValue("--atraso")) l.style.setProperty("--atraso", (i*0.13)+"s");
      });
    }
    observa.observe(el);
  });
}

/* ═══ 3. A CAPA ═════════════════════════════════════════════════════════
   A capa é só a foto, parada e nítida. Aqui ela ganha a classe que solta o
   traçado do título, e o texto e os botões dela aparecem juntos. */
function comecaCapa(){
  var c = $("#capa");
  if (!c) return;
  c.classList.add("vivo");
  // o que está na capa aparece na entrada, mesmo que fique rente à borda de
  // baixo da tela (tablet em pé): o botão não pode esperar a rolagem
  $$(".rv", c).forEach(function(el){ el.classList.add("vivo"); });
}

/* ═══ 6. TOPO E MENU ═════════════════════════════════════════════════════ */
/* O topo some quando a pessoa rola para baixo e volta assim que ela rola
   para cima. A direção é lida da rolagem REAL, não da suavizada: a suavizada
   anda poucos pixels por quadro e fazia o topo piscar em vez de sumir.
   Ele fica sempre à vista perto do começo da página, com o menu aberto e
   quando o foco do teclado está nele. */
function topo(){
  var el = $("#topo");
  if (!el) return;
  var claras = $$("[data-claro]");

  var TOLERA = 6;      // px na mesma direção antes de trocar: evita tremida
  var PERTO  = 120;    // até aqui o topo nunca some
  var anterior = scrollY || 0, virada = anterior, dir = 0;
  var escondido = false, focoDentro = false, fim = 0;

  aoMedir(function(){ fim = Math.max(0, document.documentElement.scrollHeight - innerHeight); });

  function poe(esconde){
    if (esconde === escondido) return;
    escondido = esconde;
    el.classList.toggle("topo--some", esconde);
  }
  el.addEventListener("focusin",  function(){ focoDentro = true; poe(false); });
  el.addEventListener("focusout", function(){ focoDentro = false; });

  inscreve(function(s, v, real){
    el.classList.toggle("topo--preso", s > 40);

    // o "quique" do celular passa do começo e do fim da página: não conta
    var y = Math.max(0, Math.min(real, fim || real));
    if (raiz.classList.contains("menu-on") || focoDentro || y < PERTO){
      poe(false);
      dir = 0; virada = y;
    } else if (y > anterior){
      if (dir !== 1){ dir = 1; virada = anterior; }
      if (y - virada > TOLERA) poe(true);
    } else if (y < anterior){
      if (dir !== -1){ dir = -1; virada = anterior; }
      if (virada - y > TOLERA) poe(false);
    }
    anterior = y;

    var claro = false, yc = s + 40;
    for (var i=0;i<claras.length;i++){
      var c = claras[i];
      if (yc >= c.offsetTop && yc < c.offsetTop + c.offsetHeight){ claro = true; break; }
    }
    el.classList.toggle("topo--claro", claro);
  });
}

function menu(){
  var bt = $("#hamb"), painel = $("#menu");
  if (!bt || !painel) return;
  var aberto = false, foiFoco = null;

  function abre(){
    aberto = true; foiFoco = document.activeElement;
    painel.hidden = false;
    requestAnimationFrame(function(){ painel.classList.add("menu--on"); });
    bt.setAttribute("aria-expanded","true");
    bt.setAttribute("aria-label","Fechar menu");
    raiz.classList.add("menu-on");
    document.body.style.overflow = "hidden";
    var p = $("a", painel); if (p) p.focus({ preventScroll:true });
  }
  function fecha(){
    aberto = false;
    painel.classList.remove("menu--on");
    bt.setAttribute("aria-expanded","false");
    bt.setAttribute("aria-label","Abrir menu");
    raiz.classList.remove("menu-on");
    document.body.style.overflow = "";
    setTimeout(function(){ if(!aberto) painel.hidden = true; }, 500);
    if (foiFoco && foiFoco.focus) foiFoco.focus({ preventScroll:true });
  }
  bt.addEventListener("click", function(){ aberto ? fecha() : abre(); });
  addEventListener("keydown", function(e){ if (e.key === "Escape" && aberto) fecha(); });
  $$("a", painel).forEach(function(a){ a.addEventListener("click", fecha); });

  // o foco não escapa do menu aberto
  painel.addEventListener("keydown", function(e){
    if (e.key !== "Tab" || !aberto) return;
    var f = $$("a,button", painel).filter(function(x){ return x.offsetParent !== null; });
    if (!f.length) return;
    var pri = f[0], ult = f[f.length-1];
    if (e.shiftKey && document.activeElement === pri){ e.preventDefault(); ult.focus(); }
    else if (!e.shiftKey && document.activeElement === ult){ e.preventDefault(); pri.focus(); }
  });
}

/* ═══ 7. FIO DE PROGRESSO ════════════════════════════════════════════════
   Um traço fino no topo da janela. Ocupa 2px e não rouba largura da página. */
function fioPagina(){
  var fio = $("#fioPg");
  if (!fio) return;
  var doc = 1;
  aoMedir(function(){ doc = Math.max(1, document.body.scrollHeight - innerHeight); });
  inscreve(function(s){
    fio.style.setProperty("--rolo", trava(s/doc,0,1).toFixed(4));
  });
}

/* ═══ 7b. ROTEIRO ════════════════════════════════════════════════════════
   Seções com [data-roteiro] ficam presas na tela enquanto a rolagem avança.
   O progresso p (0 → 1) desenha as linhas .tr--roteiro uma a uma e, no fim
   do percurso, traz os elementos .roteiro-fim. */
function roteiros(){
  $$("[data-roteiro]").forEach(function(sec){
    var palco   = sec.firstElementChild;
    var linhas  = $$(".tr--roteiro", sec);
    var fins    = $$(".roteiro-fim", sec);
    var marca   = $("[data-roteiro-marca]", sec);
    var topo = 0, alto = 1, preso = false, ultimo = -1;

    aoMedir(function(){
      var r = sec.getBoundingClientRect();
      topo  = r.top + (scrollY || 0);
      alto  = sec.offsetHeight;
      preso = !!palco && getComputedStyle(palco).position === "sticky";
      if (!preso){
        // sem palco fixo (tela baixa, menos movimento): tudo aparece inteiro
        linhas.forEach(function(l){ l.style.setProperty("--l","1"); });
        fins.forEach(function(el){ el.style.setProperty("--f","1"); });
      }
    });

    inscreve(function(s){
      if (!preso) return;
      if (s + alt < topo - alt || s > topo + alt * 2) return;
      // o percurso começa quando a seção está a meia tela de distância: a
      // primeira linha já vai sendo traçada enquanto o palco sobe, em vez de
      // a seção entrar vazia e só depois começar a escrever
      var meio = innerHeight * 0.5;
      var p = trava((s - topo + meio) / Math.max(1, alto - meio), 0, 1);
      if (Math.abs(p - ultimo) < 0.0005) return;
      ultimo = p;
      // três linhas em sequência, cada uma com um pedaço do percurso
      for (var i=0;i<linhas.length;i++){
        linhas[i].style.setProperty("--l", trava((p - 0.06 - i*0.19) / 0.21, 0, 1).toFixed(4));
      }
      var f = trava((p - 0.7) / 0.16, 0, 1);
      for (var j=0;j<fins.length;j++) fins[j].style.setProperty("--f", f.toFixed(4));
      if (marca) marca.textContent = String(Math.round(p*100)).padStart(3,"0");
    });
  });
}

/* ═══ 7c. JANELAS ════════════════════════════════════════════════════════
   Cada janela de projeto chega deitada, como a tampa de um notebook, e se
   ergue até ficar de frente quando alcança o meio da tela. Só a rolagem
   move; o ponteiro não. */
function janelas(){
  if (REDUZ) return;
  var itens = $$(".janela__quadro").map(function(el){ return { el:el, topo:0, alto:1, ult:"" }; });
  if (!itens.length) return;

  aoMedir(function(){
    itens.forEach(function(it){
      it.el.style.transform = "";
      var r = it.el.getBoundingClientRect();
      it.topo = r.top + (scrollY || 0);
      it.alto = r.height;
    });
  });

  inscreve(function(s){
    for (var i=0;i<itens.length;i++){
      var it = itens[i];
      if (it.topo + it.alto < s - 60 || it.topo > s + alt + 60) continue;
      // distância do centro da janela ao centro da tela; positiva = ainda abaixo
      var d = trava(((it.topo + it.alto/2) - (s + alt/2)) / (alt * 0.8), 0, 1);
      var ang = d * 16;
      var esc = 1 - d * 0.05;
      var t = "perspective(1600px) rotateX(" + ang.toFixed(2) + "deg) scale(" + esc.toFixed(3) + ")";
      if (t !== it.ult){ it.el.style.transform = t; it.ult = t; }
    }
  });
}

/* ═══ 7d. RÉGUA ══════════════════════════════════════════════════════════
   Os traços de medida correm na horizontal conforme a página desce, como
   uma fita métrica sendo puxada. Só as réguas em tela são atualizadas. */
function reguas(){
  if (REDUZ) return;
  var rs = $$(".regua").map(function(el){ return { el:el, topo:0 }; });
  if (!rs.length) return;
  aoMedir(function(){
    rs.forEach(function(r){ r.topo = r.el.getBoundingClientRect().top + (scrollY || 0); });
  });
  inscreve(function(s){
    var x = (-(s * 0.35) % 4000).toFixed(1) + "px";
    for (var i=0;i<rs.length;i++){
      var r = rs[i];
      if (r.topo < s - 40 || r.topo > s + alt + 40) continue;
      if (r.x !== x){ r.el.style.setProperty("--regua-x", x); r.x = x; }
    }
  });
}

/* ═══ 7e. FECHO: O VÍDEO DE FUNDO ═══════════════════════════════════════
   O arquivo só é pedido quando a seção chega perto da tela (600px) e só
   toca enquanto ela está à vista — fora dela, ou com a aba escondida, pausa.
   Com menos movimento ou em economia de dados o vídeo nem é baixado: fica o
   quadro parado que está por baixo. */
function fechoVideo(){
  var v = $("#filmeFecho");
  if (!v || !("IntersectionObserver" in window)) return;
  var economia = navigator.connection && navigator.connection.saveData;
  if (REDUZ || economia) return;

  var carregado = false, avista = false;
  function carrega(){
    if (carregado) return;
    carregado = true;
    v.addEventListener("playing", function(){ v.classList.add("fecho__video--on"); }, { once:true });
    v.preload = "auto";          // já perto da tela: pode baixar de vez
    v.src = v.getAttribute("data-src");
    v.load();
  }
  function ajusta(){
    if (!carregado) return;
    if (avista && !document.hidden){
      var p = v.play();
      if (p && p.catch) p.catch(function(){ /* recusado: fica o quadro parado */ });
    } else {
      v.pause();
    }
  }

  new IntersectionObserver(function(ent){
    if (ent[0].isIntersecting) carrega();
  }, { rootMargin:"600px 0px" }).observe(v);

  new IntersectionObserver(function(ent){
    avista = ent[0].isIntersecting;
    if (avista) carrega();
    ajusta();
  }).observe(v);

  document.addEventListener("visibilitychange", ajusta);
}

/* ═══ 7f. WHATSAPP FIXO ══════════════════════════════════════════════════
   O atalho acompanha o site inteiro e só se recolhe em três lugares: a capa,
   o fecho e o rodapé. Nos três o contato já está na página em tamanho
   grande, e é ali que o flutuante cobriria texto — a legenda no pé da capa,
   os botões do fecho, o "voltar ao topo" do rodapé. */
function zapFlutua(){
  var el = $(".zap-flutua");
  if (!el || !("IntersectionObserver" in window)) return;

  var alvos = $$(".capa, .fecho, .rodape");
  if (!alvos.length) return;

  var obs = new IntersectionObserver(function(ent){
    for (var i=0;i<ent.length;i++) ent[i].target.dataset.aVista = ent[i].isIntersecting ? "1" : "";
    var algum = alvos.some(function(a){ return a.dataset.aVista === "1"; });
    el.classList.toggle("zap-flutua--oculto", algum);
  }, { threshold:0.01 });
  alvos.forEach(function(a){ obs.observe(a); });
}

/* ═══ 8. PROCESSO ════════════════════════════════════════════════════════ */
function processo(){
  var lista = $("#rito");
  if (!lista) return;
  var passos = $$(".passo", lista);
  if (!passos.length) return;
  inscreve(function(){
    var r = lista.getBoundingClientRect();
    var p = (innerHeight*0.76 - r.top) / Math.max(1, r.height);
    passos.forEach(function(el, i){
      if (p > (i + 0.3) / passos.length) el.classList.add("vivo");
    });
  });
}

/* ═══ 9. ACORDEÃO ════════════════════════════════════════════════════════ */
function acordeao(){
  $$("[data-faq]").forEach(function(grupo){
    var itens = $$(".faq__it", grupo);
    itens.forEach(function(it){
      var bt = $(".faq__b", it);
      if (!bt) return;
      bt.addEventListener("click", function(){
        var estava = it.hasAttribute("data-aberto");
        itens.forEach(function(o){
          o.removeAttribute("data-aberto");
          var b = $(".faq__b", o); if (b) b.setAttribute("aria-expanded","false");
        });
        if (!estava){
          it.setAttribute("data-aberto","");
          bt.setAttribute("aria-expanded","true");
        }
      });
    });
  });
}

/* ═══ 11. FORMULÁRIO ═════════════════════════════════════════════════════
   Site estático, sem servidor. Em vez de fingir um back-end, o formulário
   monta a mensagem e abre o WhatsApp. Se o navegador bloquear a janela, o
   recado diz exatamente isso e entrega o número e o link na mão. */
function formulario(){
  var f = $("#formContato");
  if (!f) return;

  var aviso  = $("#formAviso");
  var contas = $$("[data-conta]", f);

  contas.forEach(function(campo){
    var alvo = $("#" + campo.dataset.conta);
    if (!alvo) return;
    var max = parseInt(campo.getAttribute("maxlength"), 10) || 0;
    function pinta(){
      var n = campo.value.length;
      alvo.textContent = n + " / " + max + " caracteres";
      alvo.toggleAttribute("data-perto", n > max*0.8 && n < max);
      alvo.toggleAttribute("data-cheio", n >= max);
    }
    campo.addEventListener("input", pinta);
    pinta();
  });

  var REGRAS = {
    nome: function(v){
      if (!v.trim()) return "Escreva o seu nome para eu saber com quem falo.";
      if (v.trim().length < 2) return "O nome está curto demais — escreva pelo menos 2 letras.";
      return "";
    },
    telefone: function(v){
      var d = v.replace(/\D/g,"");
      if (!d) return "Preciso de um telefone com DDD para te responder.";
      if (d.length < 10) return "Faltam números. Use DDD + número, por exemplo (11) 99867-7704.";
      if (d.length > 13) return "Esse telefone tem números demais. Confira se não repetiu algum dígito.";
      return "";
    },
    email: function(v){
      if (!v.trim()) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
        return "Esse e-mail parece incompleto. Confira se tem @ e o final, como .com ou .com.br.";
      return "";
    },
    mensagem: function(v){
      if (!v.trim()) return "Conte em uma linha o que você precisa — ajuda muito a já responder certo.";
      if (v.trim().length < 10) return "Escreva um pouco mais: com 10 caracteres eu ainda não entendo o pedido.";
      return "";
    }
  };

  function erra(campo, recado){
    var caixa = campo.closest(".campo");
    var saida = $(".campo__erro", caixa);
    if (recado){
      caixa.setAttribute("data-erro","");
      campo.setAttribute("aria-invalid","true");
      if (saida) saida.textContent = recado;
    } else {
      caixa.removeAttribute("data-erro");
      campo.removeAttribute("aria-invalid");
      if (saida) saida.textContent = "";
    }
    return !recado;
  }

  Object.keys(REGRAS).forEach(function(nome){
    var campo = f.elements[nome];
    if (!campo) return;
    campo.addEventListener("blur", function(){ erra(campo, REGRAS[nome](campo.value)); });
    campo.addEventListener("input", function(){
      if (campo.closest(".campo").hasAttribute("data-erro")) erra(campo, REGRAS[nome](campo.value));
    });
  });

  function mostra(texto, ruim){
    if (!aviso) return;
    aviso.innerHTML = texto;
    aviso.classList.toggle("aviso--ruim", !!ruim);
    aviso.setAttribute("data-on","");
    aviso.setAttribute("role", ruim ? "alert" : "status");
  }

  f.addEventListener("submit", function(ev){
    ev.preventDefault();
    var ok = true, primeiro = null;

    Object.keys(REGRAS).forEach(function(nome){
      var campo = f.elements[nome];
      if (!campo) return;
      if (!erra(campo, REGRAS[nome](campo.value))){ ok = false; if (!primeiro) primeiro = campo; }
    });

    if (!ok){
      mostra(
        "<b>Faltou preencher alguma coisa.</b> Os campos marcados em vermelho têm o recado " +
        "do que corrigir logo abaixo deles. Ajuste e mande de novo.", true
      );
      if (primeiro){
        primeiro.focus();
        primeiro.scrollIntoView({ block:"center", behavior:REDUZ?"auto":"smooth" });
      }
      return;
    }

    var d = new FormData(f);
    var linhas = [
      "Oi! Vim pelo site da Next Studio.",
      "",
      "Nome: "     + (d.get("nome")||"").trim(),
      d.get("empresa") ? "Empresa: " + String(d.get("empresa")).trim() : null,
      "Telefone: " + (d.get("telefone")||"").trim(),
      d.get("email") ? "E-mail: " + String(d.get("email")).trim() : null,
      "Tipo de projeto: " + (d.get("tipo")||"A definir"),
      "",
      String(d.get("mensagem")||"").trim()
    // só os campos ausentes saem; as linhas vazias são o respiro da mensagem
    ].filter(function(l){ return l !== null; });

    var url = zap(linhas.join("\n"));
    var janela = window.open(url, "_blank", "noopener");

    if (!janela || janela.closed || typeof janela.closed === "undefined"){
      mostra(
        "<b>Não foi possível abrir o WhatsApp automaticamente.</b> " +
        "O seu navegador provavelmente bloqueou a nova janela. Você pode " +
        "liberar o bloqueio no ícone que apareceu na barra de endereço, ou usar um destes caminhos:" +
        '<span class="aviso__acoes">' +
          '<a href="' + url + '" target="_blank" rel="noopener noreferrer">Abrir a conversa no WhatsApp</a>' +
          '<a href="tel:+55' + ZAP + '">Ligar para (11) 99867-7704</a>' +
        "</span>", true
      );
      return;
    }

    mostra(
      "<b>Pronto, a conversa abriu numa nova aba.</b> " +
      "É só apertar enviar por lá. Se a aba não apareceu, " +
      '<a href="' + url + '" target="_blank" rel="noopener noreferrer">abra por aqui</a>.'
    );
    setTimeout(function(){ location.href = pagina("obrigado"); }, 1400);
  });

  var tel = f.elements.telefone;
  if (tel) tel.addEventListener("input", function(){
    var d = tel.value.replace(/\D/g,"").slice(0,11);
    var v = d;
    if (d.length > 2)  v = "(" + d.slice(0,2) + ") " + d.slice(2);
    if (d.length > 7)  v = "(" + d.slice(0,2) + ") " + d.slice(2, d.length>10?7:6) + "-" + d.slice(d.length>10?7:6);
    tel.value = v;
  });
}

/* ═══ 12. SAÍDA DE PÁGINA ════════════════════════════════════════════════
   Uma cortina cruza a tela da esquerda para a direita antes da troca — o
   mesmo gesto do traço que revela os títulos. Se o JS falhar, o link
   continua sendo um link. */
function saida(){
  if (REDUZ) return;
  var cortina = document.createElement("div");
  cortina.setAttribute("aria-hidden","true");
  cortina.style.cssText =
    "position:fixed;inset:0;z-index:95;background:#0B0908;pointer-events:none;" +
    "clip-path:inset(0 100% 0 0);transition:clip-path .5s cubic-bezier(.76,0,.24,1);";
  document.body.appendChild(cortina);

  addEventListener("pageshow", function(e){
    if (e.persisted) cortina.style.clipPath = "inset(0 100% 0 0)";
  });

  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;
    if (/^(mailto:|tel:)/i.test(href)) return;
    if (/^https?:\/\//i.test(href) && a.host !== location.host) return;
    // âncora na mesma página, mesmo escrita com caminho: só rola, sem cortina
    if (a.pathname === location.pathname && a.search === location.search && a.hash) return;
    e.preventDefault();
    cortina.style.clipPath = "inset(0 0 0 0)";
    setTimeout(function(){ location.href = a.href; }, 400);
  });
}

/* ═══ 13. MIUDEZAS ═══════════════════════════════════════════════════════ */

/* o logo responde a quem insiste nele */
function selo(){
  var m = $(".marca");
  if (!m) return;
  var n = 0, t;
  m.addEventListener("click", function(){
    n++; clearTimeout(t); t = setTimeout(function(){ n = 0; }, 900);
    if (n >= 3){
      n = 0;
      raiz.classList.toggle("fio-aparente");
      if (!$("#seloFio")){
        var s = document.createElement("style");
        s.id = "seloFio";
        s.textContent =
          ".fio-aparente *{ outline:1px solid rgba(255,106,31,.3)!important; }";
        document.head.appendChild(s);
      }
    }
  });
}

/* recado no console: quem abre o inspetor é exatamente o público daqui */
function console_(){
  if (!window.console || !console.log) return;
  try{
    console.log(
      "%c>%c NEXT STUDIO",
      "color:#FF6A1F;font:900 22px/1 system-ui;padding:6px 0",
      "color:#F5EFE7;font:600 20px/1 system-ui;letter-spacing:.22em"
    );
    console.log(
      "%cVocê abriu o inspetor. Então já sabe: nada aqui é template.\n" +
      "Sem framework, sem biblioteca de animação, sem CSS gerado.\n" +
      "Quer um assim? (11) 99867-7704 — nextstudio.site",
      "color:#A39A90;font:400 12px/1.7 ui-monospace,monospace"
    );
  }catch(e){}
}

function ano(){
  $$("[data-ano]").forEach(function(el){ el.textContent = new Date().getFullYear(); });
}

/* ═══ ARRANQUE ═══════════════════════════════════════════════════════════ */
function liga(){
  linksNoDisco(); enderecoLimpo();
  acorda();
  topo(); menu(); fioPagina(); processo();
  roteiros(); janelas(); reguas(); fechoVideo(); zapFlutua();
  acordeao(); formulario();
  selo(); saida(); ano();
  console_();

  comecaCapa();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", liga);
else liga();

window.NS = { inscreve:inscreve, aoMedir:aoMedir, acorda:acorda, REDUZ:REDUZ, zap:zap };

})();
