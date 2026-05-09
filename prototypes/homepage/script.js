const chaosContainer = document.getElementById("chaosContainer");
const chaosIcons = Array.from(document.querySelectorAll(".chaos-icon"));
const topNav = document.getElementById("topNav");
const revealElements = Array.from(document.querySelectorAll(".reveal"));
const yearEl = document.getElementById("year");
const billingButtons = Array.from(document.querySelectorAll(".billing-btn"));
const proPrice = document.getElementById("proPrice");
const proSuffix = document.getElementById("proSuffix");

const motionState = {
  mouseX: null,
  mouseY: null,
};

const iconState = [];

function initChaosMotion() {
  if (!chaosContainer || chaosIcons.length === 0) {
    return;
  }

  const bounds = chaosContainer.getBoundingClientRect();

  chaosIcons.forEach((icon) => {
    const size = 42;
    const x = Math.random() * (bounds.width - size);
    const y = Math.random() * (bounds.height - size);
    const vx = (Math.random() - 0.5) * 1.2;
    const vy = (Math.random() - 0.5) * 1.2;
    const phase = Math.random() * Math.PI * 2;

    iconState.push({
      element: icon,
      x,
      y,
      vx,
      vy,
      size,
      phase,
      spin: (Math.random() - 0.5) * 0.9,
    });
  });

  let lastTime = performance.now();

  function animate(now) {
    const delta = Math.min((now - lastTime) / 16.67, 2);
    lastTime = now;

    const rect = chaosContainer.getBoundingClientRect();

    iconState.forEach((icon, index) => {
      icon.x += icon.vx * delta;
      icon.y += icon.vy * delta;

      if (icon.x <= 0 || icon.x >= rect.width - icon.size) {
        icon.vx *= -1;
        icon.x = Math.max(0, Math.min(icon.x, rect.width - icon.size));
      }

      if (icon.y <= 0 || icon.y >= rect.height - icon.size) {
        icon.vy *= -1;
        icon.y = Math.max(0, Math.min(icon.y, rect.height - icon.size));
      }

      if (motionState.mouseX !== null && motionState.mouseY !== null) {
        const centerX = icon.x + icon.size / 2;
        const centerY = icon.y + icon.size / 2;
        const dx = centerX - motionState.mouseX;
        const dy = centerY - motionState.mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 90 && distance > 0.001) {
          const force = (90 - distance) / 90;
          icon.vx += (dx / distance) * force * 0.17;
          icon.vy += (dy / distance) * force * 0.17;
        }
      }

      icon.vx *= 0.995;
      icon.vy *= 0.995;

      icon.phase += 0.04 * delta;
      const wobble = Math.sin(icon.phase + index) * 3;
      const scale = 1 + Math.sin(icon.phase * 0.65) * 0.05;

      icon.element.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${wobble + icon.spin * now * 0.01}deg) scale(${scale})`;
    });

    requestAnimationFrame(animate);
  }

  chaosContainer.addEventListener("mousemove", (event) => {
    const rect = chaosContainer.getBoundingClientRect();
    motionState.mouseX = event.clientX - rect.left;
    motionState.mouseY = event.clientY - rect.top;
  });

  chaosContainer.addEventListener("mouseleave", () => {
    motionState.mouseX = null;
    motionState.mouseY = null;
  });

  requestAnimationFrame(animate);
}

function initScrollReveal() {
  if (revealElements.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function initNavbarScroll() {
  if (!topNav) {
    return;
  }

  const update = () => {
    topNav.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initPricingToggle() {
  if (!proPrice || !proSuffix || billingButtons.length === 0) {
    return;
  }

  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      billingButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");

      const plan = button.dataset.plan;
      if (plan === "yearly") {
        proPrice.textContent = "$72";
        proSuffix.textContent = "/yr";
      } else {
        proPrice.textContent = "$8";
        proSuffix.textContent = "/mo";
      }
    });
  });
}

function initFooterYear() {
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

initChaosMotion();
initScrollReveal();
initNavbarScroll();
initPricingToggle();
initFooterYear();
