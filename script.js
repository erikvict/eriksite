// ===== MiniJogo: Arremesso =====
(() => {
  const gameModal = document.getElementById("gameModal");
  const openBtn = document.getElementById("openGame");
  const closeBtn = document.getElementById("closeGame");
  const resetBtn = document.getElementById("resetGame");
  const windBtn = document.getElementById("newWind");

  const c = document.getElementById("gameCanvas");
  if (!c) return;
  const ctx = c.getContext("2d");

  const windEl  = document.getElementById("windVal");
  const angleEl = document.getElementById("angleVal");
  const powerEl = document.getElementById("powerVal");
  const distEl  = document.getElementById("distVal");
  const bestEl  = document.getElementById("bestVal");

  let best = Number(localStorage.getItem("bestThrow") || 0);
  bestEl.textContent = best.toFixed(1);

  // mundo
  const groundY = 360;
  const start = { x: 90, y: groundY };
  let wind = 0;

  // projétil
  let ball = null;
  let running = false;

  // mira (arrastar)
  let dragging = false;
  let dragStart = null;
  let dragNow = null;

  function setWind() {
    // filtra a galeria pelo ano
if (window.filterGalleryByYear) {
  window.filterGalleryByYear(year);
}
    wind = (Math.random() * 2.4 - 1.2); // -1.2 a +1.2
    windEl.textContent = wind.toFixed(1);
  }
  setWind();

  function openGame(){
    gameModal.classList.add("isOpen");
    gameModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    reset();
  }

  function closeGame(){
    gameModal.classList.remove("isOpen");
    gameModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function reset(){
    ball = { x: start.x, y: start.y, vx: 0, vy: 0 };
    running = false;
    dragging = false;
    dragStart = null;
    dragNow = null;
    distEl.textContent = "0.0";
    angleEl.textContent = "0";
    powerEl.textContent = "0";
    draw();
  }

  function launch(angleDeg, powerPct){
    const p = Math.max(0, Math.min(100, powerPct));
    const ang = angleDeg * Math.PI / 180;

    // velocidade base (ajuste aqui se quiser mais “rápido”)
    const speed = 10 + (p / 100) * 26;

    ball.x = start.x;
    ball.y = start.y;

    ball.vx = Math.cos(ang) * speed;
    ball.vy = -Math.sin(ang) * speed;

    running = true;
    loop();
  }

  function loop(){
    if (!running) return;

    // física
    const g = 0.55;           // gravidade
    const air = 0.994;        // “resistência”
    const windPush = wind * 0.06;

    ball.vx = (ball.vx + windPush) * air;
    ball.vy = (ball.vy + g) * air;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // chão
    if (ball.y >= groundY) {
      ball.y = groundY;
      running = false;

      const meters = (ball.x - start.x) / 14; // escala simples px -> metros
      distEl.textContent = meters.toFixed(1);

      if (meters > best) {
        best = meters;
        localStorage.setItem("bestThrow", String(best));
        bestEl.textContent = best.toFixed(1);
        flash("🥇 NOVO RECORDE!");
      }
      draw();
      return;
    }

    // limites
    if (ball.x > c.width + 200) {
      running = false;
      draw();
      return;
    }

    draw();
    requestAnimationFrame(loop);
  }

  function flash(txt){
    // efeito simples no título
    const t = gameModal.querySelector(".title");
    const old = t.textContent;
    t.textContent = txt;
    setTimeout(() => t.textContent = old, 900);
  }

  function draw(){
    // fundo
    ctx.clearRect(0,0,c.width,c.height);

    // chão
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(0, groundY, c.width, c.height - groundY);

    // linha de base
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(c.width, groundY + 0.5);
    ctx.stroke();

    // marcador início
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fillRect(start.x - 2, groundY - 50, 4, 50);

    // vento (setinha)
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "16px Arial";
    const arrow = wind >= 0 ? "➡" : "⬅";
    ctx.fillText(`Vento ${arrow} ${wind.toFixed(1)}`, 14, 26);

    // mira
    if (dragging && dragStart && dragNow) {
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(dragNow.x, dragNow.y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.25)";
      ctx.beginPath();
      ctx.arc(dragNow.x, dragNow.y, 8, 0, Math.PI*2);
      ctx.fill();
    }

    // projétil
    if (ball) {
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function getPos(evt){
    const rect = c.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    const x = (clientX - rect.left) * (c.width / rect.width);
    const y = (clientY - rect.top) * (c.height / rect.height);
    return { x, y };
  }

  function onDown(e){
    if (running) return;
    dragging = true;
    dragStart = getPos(e);
    dragNow = dragStart;
    draw();
  }

  function onMove(e){
    if (!dragging) return;
    dragNow = getPos(e);

    // calcula ângulo/força (arrasto)
    const dx = start.x - dragNow.x;
    const dy = start.y - dragNow.y;

    // força = tamanho do arrasto
    const len = Math.min(260, Math.sqrt(dx*dx + dy*dy));
    const powerPct = Math.round((len / 260) * 100);

    // ângulo (0 a 85)
    let ang = Math.atan2(dy, dx) * 180 / Math.PI; // arrasto pra trás dá positivo
    ang = Math.max(10, Math.min(85, ang));

    angleEl.textContent = String(Math.round(ang));
    powerEl.textContent = String(powerPct);

    draw();
  }

  function onUp(){
    if (!dragging) return;
    dragging = false;

    // usar os valores do HUD
    const ang = Number(angleEl.textContent);
    const pow = Number(powerEl.textContent);

    if (pow < 5) { // se arrastou quase nada, não lança
      draw();
      return;
    }

    launch(ang, pow);
  }

  // eventos mouse + touch
  c.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  c.addEventListener("touchstart", (e)=>{ e.preventDefault(); onDown(e); }, { passive:false });
  c.addEventListener("touchmove", (e)=>{ e.preventDefault(); onMove(e); }, { passive:false });
  c.addEventListener("touchend", (e)=>{ e.preventDefault(); onUp(e); }, { passive:false });

  // modal eventos
  openBtn?.addEventListener("click", openGame);
  closeBtn?.addEventListener("click", closeGame);
  resetBtn?.addEventListener("click", reset);
  windBtn?.addEventListener("click", () => { setWind(); draw(); });

  gameModal?.addEventListener("click", (e) => {
    if (e.target === gameModal) closeGame();
  });

  document.addEventListener("keydown", (e) => {
    if (!gameModal.classList.contains("isOpen")) return;
    if (e.key === "Escape") closeGame();
  });

  // desenha a primeira vez
  draw();
})();
// ===== Linha do Tempo Interativa =====
(() => {
  const nodes = Array.from(document.querySelectorAll(".tlNode"));
  const panel = document.getElementById("tlPanel");
  const title = document.getElementById("tlTitle");
  const sub = document.getElementById("tlSub");
  const list = document.getElementById("tlList");
  const photos = document.getElementById("tlPhotos");
  const closeBtn = document.getElementById("tlClose");
  const goGalleryBtn = document.getElementById("tlGoGallery");

  if (!nodes.length || !panel) return;

  // Dados da sua história (você pode editar depois)
  const TIMELINE = {
    "2021": {
      title: "2021 • Começo no atletismo 🏃‍♂️",
      sub: "Primeiro treino e primeira competição em Recife",
      bullets: [
        "🤝 Primeiro dia de treino com o treinador Ismael Marques",
        "🏟️ Primeira competição: Jogos Paralímpicos do Recife",
        "🥇🥇🥇 3 ouros nas 3 provas"
      ],
      // Você pode trocar pelos caminhos reais das suas imagens
      imgs: [
        "imagens/2021/IMG_2515.png",
        "imagens/2021/IMG_2514.jpeg"
      ]
    },
    "2022": {
      title: "2022 • Viagem + ouro nas escolares 🥇",
      sub: "Regional em Natal e fase nacional em SP",
      bullets: [
        "✈️ Paraolimpíadas Escolares Regional: Natal (RN)",
        "🥇 Ouro no peso (7,11m) e 🥇 ouro na pelota (21,33m)",
        "🏙️ Fase nacional em São Paulo: ouro e recordes"
      ],
      imgs: [
        "imagens/2022/IMG_2513.jpeg",
        "imagens/2022/IMG_2516.jpeg"
      ]
    },
    "2023": {
      title: "2023 • Prêmio destaque ⭐",
      sub: "Reconhecimento em Pernambuco",
      bullets: [
        "🏆 Prêmio de melhores atletas de Pernambuco",
        "📈 Evolução técnica nas provas"
      ],
      imgs: [
        "imagens/2023/49B8A9A3-239D-438E-A41A-203A9A773CFA.jpeg"
      ]
    },
    "2024": {
      title: "2024 • Ouro + recordes 🏆",
      sub: "Temporada forte com fase nacional",
      bullets: [
        "🥇🥇🥇 Nacional SP: ouro nas 3 provas",
        "🏹 Recorde no dardo + 🏋️ recorde no peso",
        "🔥 Consolidação como campeão escolar"
      ],
      imgs: [
        "imagens/2024/IMG_2518.jpeg",
        "imagens/2024/C161A907-0957-4A51-AA98-8542EB0B6A3B.jpeg"
      ]
    },
    "2025": {
      title: "2025 • Domínio no regional 💪",
      sub: "Recife + Open",
      bullets: [
        "🥇🥇🥇 Regional escolar Recife: 3 ouros nas 3 provas",
        "🏅 Recife Open: 🥇 ouro e 🥉 bronze",
        "📸 Mais fotos e momentos de competição"
      ],
      imgs: [
        "imagens/2025/IMG_2507.jpeg",
        "imagens/2025/IMG_2505.jpeg"
      ]
    }
  };

  let activeYear = null;

  function renderYear(year){
    const data = TIMELINE[year];
    if (!data) return;

    activeYear = year;

    // ativa visual
    nodes.forEach(n => n.classList.toggle("isActive", n.dataset.year === year));

    // abre painel
    panel.classList.add("open");

    // texto
    title.textContent = data.title;
    sub.textContent = data.sub;

    // lista
    list.innerHTML = "";
    data.bullets.forEach(txt => {
      const li = document.createElement("li");
      li.textContent = txt;
      list.appendChild(li);
    });

    // fotos (mini)
    photos.innerHTML = "";
    data.imgs.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Foto ${year}`;
      photos.appendChild(img);
    });

    // rolar até o painel de forma suave
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  nodes.forEach(btn => {
    btn.addEventListener("click", () => renderYear(btn.dataset.year));
  });

  closeBtn?.addEventListener("click", () => {
    panel.classList.remove("open");
    nodes.forEach(n => n.classList.remove("isActive"));
    activeYear = null;
  });

  // Pula pra galeria e mostra só o ano (se você quiser integrar com filtro depois)
  goGalleryBtn?.addEventListener("click", () => {
    const g = document.getElementById("gallery");
    if (g) g.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
// ===== Filtro da galeria por ano =====
(() => {
  const items = Array.from(document.querySelectorAll(".gItem"));
  const btnShowAll = document.getElementById("showAll");

  if (!items.length) return;

  function filterGallery(year){
    items.forEach(it => {
      if (it.dataset.year === year) {
        it.style.display = "";
      } else {
        it.style.display = "none";
      }
    });

    btnShowAll.style.display = "inline-flex";
  }

  function showAll(){
    items.forEach(it => it.style.display = "");
    btnShowAll.style.display = "none";
  }

  // botão mostrar tudo
  btnShowAll?.addEventListener("click", showAll);

  // expõe função global pra timeline usar
  window.filterGalleryByYear = filterGallery;
})();
// ===== Contadores animados (Conquistas em números) =====
(() => {
  const section = document.getElementById("numbers");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll(".numCard"));
  const values = Array.from(section.querySelectorAll(".numValue"));

  function animateValue(el, to){
    const duration = 900; // ms
    const start = 0;
    const t0 = performance.now();

    function tick(now){
      const p = Math.min(1, (now - t0) / duration);
      // easing suave
      const eased = 1 - Math.pow(1 - p, 3);

      const v = Math.round(start + (to - start) * eased);
      el.textContent = String(v);

      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  let done = false;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting || done) return;
      done = true;

      // anima entrada
      cards.forEach((c, i) => {
        setTimeout(() => c.classList.add("show"), i * 80);
      });

      // anima números
      values.forEach(el => {
        const to = Number(el.dataset.count || 0);
        animateValue(el, to);
      });

      obs.disconnect();
    });
  }, { threshold: 0.35 });

  obs.observe(section);
})();
// ===== Gráfico de evolução (Canvas) =====
(() => {
  const canvas = document.getElementById("evoChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Dados REAIS (do PDF)
  const years = ["2023", "2024", "2025"];

  const data = {
    peso:  [6.23, 7.11, 7.84],
    dardo: [18.90, 21.80, 23.77],
    disco: [15.17, 19.40, 22.11]
  };

  const series = [
    { key: "peso",  label: "🏋️ Peso",  color: "#22c55e" },
    { key: "dardo", label: "🎯 Dardo", color: "#3b82f6" },
    { key: "disco", label: "💿 Disco", color: "#eab308" }
  ];

  // escala
  const maxY = 30; // metros (escala visual)
  const pad = { l: 50, r: 20, t: 20, b: 40 };

  function resize(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * devicePixelRatio);
    canvas.height = Math.round(420 * devicePixelRatio);
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  resize();
  window.addEventListener("resize", resize);

  function drawAxes(){
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 1;

    // eixo Y
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, canvas.height / devicePixelRatio - pad.b);
    ctx.stroke();

    // eixo X
    ctx.beginPath();
    ctx.moveTo(pad.l, canvas.height / devicePixelRatio - pad.b);
    ctx.lineTo(canvas.width / devicePixelRatio - pad.r, canvas.height / devicePixelRatio - pad.b);
    ctx.stroke();

    // marcas Y
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = "12px Arial";
    for (let i = 0; i <= maxY; i += 5) {
      const y = yPos(i);
      ctx.fillText(i + "m", 6, y + 4);
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(canvas.width / devicePixelRatio - pad.r, y);
      ctx.stroke();
    }

    // anos
    years.forEach((y, i) => {
      const x = xPos(i);
      ctx.fillText(y, x - 10, canvas.height / devicePixelRatio - 12);
    });
  }

  function xPos(i){
    const w = canvas.width / devicePixelRatio - pad.l - pad.r;
    return pad.l + (w / (years.length - 1)) * i;
  }

  function yPos(v){
    const h = canvas.height / devicePixelRatio - pad.t - pad.b;
    return canvas.height / devicePixelRatio - pad.b - (v / maxY) * h;
  }

  function drawLine(values, color, progress){
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    values.forEach((v, i) => {
      const x = xPos(i);
      const y = yPos(v * progress);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // pontos
    ctx.fillStyle = color;
    values.forEach((v, i) => {
      const x = xPos(i);
      const y = yPos(v * progress);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // animação
  let start = null;
  function animate(ts){
    if (!start) start = ts;
    const p = Math.min(1, (ts - start) / 900);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawAxes();

    series.forEach(s => drawLine(data[s.key], s.color, p));

    if (p < 1) requestAnimationFrame(animate);
  }

  // observa quando entra na tela
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        requestAnimationFrame(animate);
        obs.disconnect();
      }
    });
  }, { threshold: 0.4 });

  obs.observe(canvas);
})();
// ===== Crescimento percentual (animação) =====
(() => {
  const section = document.getElementById("growth");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll(".gCard"));

  function animateNumber(el, to){
    const duration = 900;
    const t0 = performance.now();

    function tick(now){
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = (to * eased);
      el.textContent = v.toFixed(1);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  let done = false;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting || done) return;
      done = true;

      // anima entrada + barras + números
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add("show"), i * 90);

        const pct = Number(card.dataset.pct || 0);
        const fill = card.querySelector(".gFill");
        const num = card.querySelector(".gNum");

        // barra: 0 a 100% (e a gente usa o pct real)
        // se você quiser, dá pra “capar” em 60% pra ficar mais dramático
        setTimeout(() => {
          if (fill) fill.style.width = Math.min(100, pct) + "%";
          if (num) animateNumber(num, pct);
        }, 120 + i * 90);
      });

      obs.disconnect();
    });
  }, { threshold: 0.35 });

  obs.observe(section);
})();
// 🧠 MINI HUD - lógica
(function(){
  const hud = document.getElementById("hud");
  const toggle = document.getElementById("hudToggle");

  const hudMedalhas = document.getElementById("hudMedalhas");
  const hudRecordes = document.getElementById("hudRecordes");
  const hudMelhorAno = document.getElementById("hudMelhorAno");
  const hudProva = document.getElementById("hudProva");

  const btnIrGrafico = document.getElementById("btnIrGrafico");
  const btnIrGaleria = document.getElementById("btnIrGaleria");

  // 👉 Ajuste os números como você quiser:
  const dados = {
    medalhas: 7,
    recordes: 7,
    melhorAno: 2024,
    prova: "Dardo"
  };

  hudMedalhas.textContent = dados.medalhas;
  hudRecordes.textContent = dados.recordes;
  hudMelhorAno.textContent = dados.melhorAno;
  hudProva.textContent = dados.prova;

  // minimizar
  toggle.addEventListener("click", () => {
    hud.classList.toggle("isMin");
    toggle.textContent = hud.classList.contains("isMin") ? "➕" : "➖";
    toggle.title = hud.classList.contains("isMin") ? "Expandir" : "Minimizar";
  });

  btnIrGrafico.addEventListener("click", () => {
  const alvo = document.getElementById("grafico");
  if (!alvo) return;

  const y = alvo.getBoundingClientRect().top + window.pageYOffset - 120;

  window.scrollTo({
    top: y,
    behavior: "smooth"
  });
});


  btnIrGaleria.addEventListener("click", () => {
    const alvo = document.getElementById("gallery");
    if(alvo) alvo.scrollIntoView({behavior:"smooth", block:"start"});
  });
})();
// 🟩 Animar o gráfico quando ele aparecer na tela
const graficoSec = document.getElementById("grafico");

if (graficoSec) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        graficoSec.classList.add("isOn");
        io.disconnect(); // anima só 1x (se quiser animar sempre, apaga essa linha)
      }
    });
  }, { threshold: 0.25 });

  io.observe(graficoSec);
}
