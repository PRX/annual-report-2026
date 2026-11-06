const STORAGE_KEY = 'prx-ar-2026-board';
const buttons = [...document.querySelectorAll('.build-block')];
const total = buttons.length;
const toast = document.querySelector('[data-board-toast]');
const tray = document.querySelector('.board-tray');
const finale = document.querySelector('[data-board-finale]');
const collected = new Set();
let toastTimer;
let finaleInView = false;

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  buttons.forEach(({ dataset: { blockId } }) => saved.includes(blockId) && collected.add(blockId));
} catch {
  // Nothing saved yet, or storage is blocked (private mode).
}

const isComplete = () => collected.size === total;

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collected]));
  } catch {
    // Storage blocked: progress lasts for this visit only.
  }
};

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
};

const render = (newId) => {
  document.querySelectorAll('.build-scene [data-part]').forEach((part) => {
    part.classList.toggle('is-earned', collected.has(part.dataset.part));
    part.classList.toggle('is-new', part.dataset.part === newId);
  });
  buttons.forEach((btn) => {
    const isCollected = collected.has(btn.dataset.blockId);
    btn.classList.toggle('is-collected', isCollected);
    btn.setAttribute('aria-disabled', isCollected);
  });
  document.querySelectorAll('[data-board-count]').forEach((el) => { el.textContent = collected.size; });
  document.querySelectorAll('[data-part-item]').forEach((item) => { item.hidden = collected.has(item.dataset.partItem); });
  document.querySelectorAll('[data-board-state]').forEach((el) => {
    el.toggleAttribute('data-board-complete', isComplete());
    el.style.setProperty('--board-progress', collected.size / total);
  });
  if (!isComplete()) finale.classList.remove('is-live');
};

document.querySelectorAll('[data-board-ui]').forEach((el) => el.removeAttribute('hidden'));
render();

buttons.forEach((btn) => btn.addEventListener('click', () => {
  const id = btn.dataset.blockId;
  if (collected.has(id)) return;

  collected.add(id);
  save();
  render(id);
  plausible('Board Block Collected', { props: { block: id } });

  if (!isComplete()) {
    showToast(`+ ${btn.dataset.blockLabel} added (${collected.size}/${total})`);
    return;
  }
  showToast('All blocks collected! Scroll to the finale to go on air.');
  plausible('Board Completed');
  if (finaleInView) finale.classList.add('is-live');
}));

document.querySelector('[data-board-reset]').addEventListener('click', () => {
  collected.clear();
  save();
  render();
  plausible('Board Reset');
});

new IntersectionObserver((entries) => {
  finaleInView = entries.at(-1).isIntersecting;
  tray.classList.toggle('is-tucked', finaleInView);
  if (finaleInView && isComplete()) finale.classList.add('is-live');
}, { threshold: 0.35 }).observe(finale.querySelector('.board-finale-stage'));
