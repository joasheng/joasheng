(function() {
  const canvas = document.getElementById("c");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Track viewport size
  let VW = 0, VH = 0;

  function getViewportSize() {
    const vv = window.visualViewport;
    if (vv) return { w: Math.round(vv.width), h: Math.round(vv.height) };
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function resize() {
    const { w, h } = getViewportSize();
    VW = w;
    VH = h;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  resize();

  // Gentle rightward wind with soft gusts
  let windBase = 0.08;
  let windGust = 0;
  let gustTarget = 0.25;
  let lastGustChange = 0;

  // Mouse-driven wind: horizontal movement influences gust (only above speed threshold)
  let lastMouseX = null;
  let lastMouseTime = null;
  let mouseWind = 0;
  const MOUSE_WIND_SCALE = 0.01;
  const MOUSE_WIND_MAX = 3;
  const MOUSE_WIND_DECAY = 0.99;
  const MOUSE_SPEED_THRESHOLD = 2.5;

  window.addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (lastMouseX !== null && lastMouseTime !== null) {
      const deltaX = e.clientX - lastMouseX;
      const deltaTime = now - lastMouseTime;
      if (deltaTime > 0 && deltaTime < 100) {
        const speed = Math.abs(deltaX) / deltaTime;
        if (speed >= MOUSE_SPEED_THRESHOLD) {
          mouseWind += deltaX * MOUSE_WIND_SCALE;
          mouseWind = Math.max(-MOUSE_WIND_MAX, Math.min(MOUSE_WIND_MAX, mouseWind));
        }
      }
    }
    lastMouseX = e.clientX;
    lastMouseTime = now;
  });

  window.addEventListener("mouseleave", () => {
    lastMouseX = null;
    lastMouseTime = null;
  });

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function updateWind(t) {
    if (t - lastGustChange > rand(900, 2600)) {
      lastGustChange = t;
      gustTarget = rand(0.0, 0.45);
    }

    windGust += (gustTarget - windGust) * 0.015;
    mouseWind *= MOUSE_WIND_DECAY;
  }

  class Snowflake {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = VW * Math.pow(Math.random(), 1.7);
      this.y = -10;
      this.size = (Math.random() * 3 + 1) | 0;
      this.speed = Math.random() * 1.5 + 0.8;
      this.drift = Math.random() * 0.14 - 0.07;
      this.phase = Math.random() * Math.PI * 2;
    }

    update() {
      this.y += this.speed * 0.5;
      this.x += windBase + windGust + mouseWind + this.drift + Math.sin(this.y * 0.02 + this.phase) * 0.12;

      if (this.x > VW + 10) this.x = -10;
      if (this.x < -10) this.x = VW + 10;

      if (this.y > VH + 10) {
        this.reset();
      }
    }

    draw() {
      const x = this.x | 0;
      const y = this.y | 0;
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, this.size, this.size);
    }
  }

  const snowflakes = [];
  const snowflakeCount = 200;

  function initSnowflakes() {
    snowflakes.length = 0;
  }

  initSnowflakes();

  function frame(t) {
    const w = VW || window.innerWidth;
    const h = VH || window.innerHeight;

    updateWind(t);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    if (snowflakes.length < snowflakeCount) {
      if (Math.random() < 0.25) {
        snowflakes.push(new Snowflake());
      }
    }

    for (const flake of snowflakes) {
      flake.update();
      flake.draw();
    }

    requestAnimationFrame(frame);
  }

  setTimeout(() => {
    requestAnimationFrame(frame);
  }, 500);
})();
