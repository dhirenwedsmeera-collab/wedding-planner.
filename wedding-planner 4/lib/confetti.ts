import confetti from "canvas-confetti";

export function fireConfetti() {
  const colors = ["#0f7a56", "#1fa373", "#d18f1e", "#eec455", "#ffffff"];
  const duration = 1500;
  const end = Date.now() + duration;

  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors });
}
