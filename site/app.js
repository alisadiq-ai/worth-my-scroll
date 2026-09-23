const demo = document.querySelector('#demo-image');
const toggle = document.querySelector('#demo-toggle');
const state = document.querySelector('#demo-state');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let playing = !motionPreference.matches;
function renderPlayback() {
  demo.src = playing ? 'assets/linkedin-feed-demo.gif' : 'assets/demo-poster.webp';
  toggle.textContent = playing ? 'Pause animation  Ⅱ' : 'Play animation  ▶';
  toggle.setAttribute('aria-pressed', String(playing));
  state.textContent = playing ? 'Autoplay · 9-second loop' : 'Animation paused';
}
renderPlayback();
toggle.addEventListener('click', () => {
  playing = !playing;
  renderPlayback();
});
motionPreference.addEventListener('change', (event) => {
  if (event.matches) { playing = false; renderPlayback(); }
});
demo.addEventListener('error', () => {
  if (!playing) return;
  playing = false;
  demo.src = 'assets/demo-poster.webp';
  toggle.textContent = 'Retry the demo  ▶';
  toggle.setAttribute('aria-pressed', 'false');
  state.textContent = 'The demo could not load. Please try again.';
});
document.querySelector('#copy-install').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(document.querySelector('#install-code').textContent);
    button.textContent = 'Copied';
    document.querySelector('#copy-status').textContent = 'Installation commands copied.';
  } catch {
    document.querySelector('#copy-status').textContent = 'Copy unavailable. Select and copy the commands below.';
    button.textContent = 'Select below';
  }
});
// Deep links to the privacy answer also expand it for keyboard and screen-reader users.
function openLinkedAnswer() {
  if (location.hash === '#privacy') document.querySelector('#privacy').open = true;
}
window.addEventListener('hashchange', openLinkedAnswer);
openLinkedAnswer();
