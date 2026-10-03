(() => {
  'use strict';

  const scenes = [
    {
      id: 'noisy-world',
      prompt: 'Maya stared at her tablet, but everything felt too loud. Find Maya.',
      success: 'There she is. Maya is surrounded by messages competing for her attention.',
      targetLabel: 'Maya',
      fullArt: null,
      clearVisual: 'maya',
      simpleDistractors: ['BUY NOW', 'FREE PRIZE', 'NEW!', 'LIMITED TIME']
    },
    {
      id: 'clearcam-appears',
      prompt: 'Then something weird happened. A quiet new app appeared on Maya’s screen. Find CLEARCAM.',
      success: 'CLEARCAM. No prize wheel. No countdown. Just a quiet new app.',
      targetLabel: 'CLEARCAM app',
      fullArt: null,
      clearVisual: 'app',
      simpleDistractors: ['GAME!', 'PUPPY!', 'CHIPS!', 'WIN!']
    },
    {
      id: 'magic-screen',
      prompt: 'Maya pointed CLEARCAM at her breakfast. Find the cereal box.',
      success: 'CLEARCAM changes the message: “Mostly sugar. Designed to make you crave more.”',
      targetLabel: 'cereal box',
      fullArt: null,
      clearVisual: 'cereal',
      simpleDistractors: ['JUICE', 'BOWL', 'FRUIT', 'TABLET']
    }
  ];

  const $ = (id) => document.getElementById(id);
  const setup = $('setup');
  const reader = $('reader');
  const finish = $('finish');
  const stage = $('stage');
  const sceneEl = $('scene');
  const target = $('target');
  const focusRing = $('focusRing');
  const storyPanel = $('storyPanel');
  const storyText = $('storyText');
  const successText = $('successText');
  const nextBtn = $('nextBtn');
  const pageIndicator = $('pageIndicator');

  let current = 0;
  let assistLevel = 0;
  let found = false;
  let settings = loadSettings();

  function loadSettings() {
    try {
      return Object.assign({presentation:'clear', narration:true, showText:true, gentlePulse:false}, JSON.parse(localStorage.getItem('clearcamCviSettings') || '{}'));
    } catch (_) {
      return {presentation:'clear', narration:true, showText:true, gentlePulse:false};
    }
  }

  function saveSettings() {
    localStorage.setItem('clearcamCviSettings', JSON.stringify(settings));
  }

  function applySetupSettings() {
    const radio = document.querySelector(`input[name="presentation"][value="${settings.presentation}"]`);
    if (radio) radio.checked = true;
    $('narration').checked = !!settings.narration;
    $('showText').checked = !!settings.showText;
    $('gentlePulse').checked = !!settings.gentlePulse;
  }

  function readSetupSettings() {
    const selected = document.querySelector('input[name="presentation"]:checked');
    settings = {
      presentation: selected ? selected.value : 'clear',
      narration: $('narration').checked,
      showText: $('showText').checked,
      gentlePulse: $('gentlePulse').checked
    };
    saveSettings();
  }

  function speak(text) {
    if (!settings.narration || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
  }

  function targetMarkup(type, extraClass='') {
    if (type === 'maya') {
      return `<div class="maya-symbol target-visual ${extraClass}" aria-hidden="true"></div>`;
    }
    if (type === 'app') {
      return `<div class="app-symbol target-visual ${extraClass}" aria-hidden="true"><span class="eye">◉</span><strong>CLEARCAM</strong></div>`;
    }
    return `<div class="cereal-symbol target-visual ${extraClass}" aria-hidden="true"><span class="rocket">🚀</span><strong>BLAST-O'S<br><small>SUPER CHOCO STARS</small></strong></div>`;
  }

  function renderClear(scene) {
    sceneEl.innerHTML = `<div class="clear-object">${targetMarkup(scene.clearVisual)}</div>`;
    target.style.left = '12%';
    target.style.top = '8%';
    target.style.width = '76%';
    target.style.height = '84%';
    placeRing('16%','12%','68%','76%');
  }

  function renderSimple(scene) {
    const d = scene.simpleDistractors.map((txt,i) => `<div class="distractor d${i+1}" aria-hidden="true">${txt}</div>`).join('');
    sceneEl.innerHTML = `<div class="simple-layout">${d}<div class="simple-target-wrap">${targetMarkup(scene.clearVisual)}</div></div>`;
    target.style.left = '20%';
    target.style.top = '12%';
    target.style.width = '60%';
    target.style.height = '76%';
    placeRing('24%','16%','52%','68%');
  }

  function renderFull(scene, index) {
    if (!scene.fullArt) {
      renderSimple(scene);
      return;
    }
    sceneEl.innerHTML = `<img class="full-art" src="${scene.fullArt}" alt="Rich ClearCAM story illustration">`;
    target.style.left = '';
    target.style.top = '';
    target.style.width = '';
    target.style.height = '';
    focusRing.style.left = '';
    focusRing.style.top = '';
    focusRing.style.width = '';
    focusRing.style.height = '';
  }

  function placeRing(left, top, width, height) {
    focusRing.style.left = left;
    focusRing.style.top = top;
    focusRing.style.width = width;
    focusRing.style.height = height;
  }

  function renderScene() {
    const scene = scenes[current];
    found = false;
    assistLevel = 0;
    stage.dataset.assist = '0';
    stage.dataset.mode = settings.presentation;
    stage.className = `stage ${settings.presentation} scene-${current}${settings.gentlePulse ? ' pulse' : ''}`;
    target.setAttribute('aria-label', `Find ${scene.targetLabel}`);
    successText.hidden = true;
    nextBtn.hidden = true;
    target.hidden = false;
    pageIndicator.textContent = `${current + 1} of ${scenes.length}`;
    storyText.textContent = scene.prompt;
    storyPanel.hidden = !settings.showText;

    if (settings.presentation === 'clear') renderClear(scene);
    else if (settings.presentation === 'simple') renderSimple(scene);
    else renderFull(scene, current);

    window.setTimeout(() => speak(scene.prompt), 180);
  }

  function findTarget() {
    if (found) return;
    found = true;
    const scene = scenes[current];
    stopSpeech();
    stage.dataset.assist = '2';
    successText.textContent = scene.success;
    successText.hidden = false;
    storyPanel.hidden = false;
    nextBtn.hidden = false;
    target.hidden = true;
    speak(scene.success);
    nextBtn.focus({preventScroll:true});
  }

  function nextScene() {
    stopSpeech();
    if (current >= scenes.length - 1) {
      reader.hidden = true;
      finish.hidden = false;
      return;
    }
    current += 1;
    renderScene();
  }

  function assist() {
    if (found) return;
    assistLevel = Math.min(3, assistLevel + 1);
    stage.dataset.assist = String(assistLevel);
    if (assistLevel === 1) speak('ClearCAM is reducing the visual noise.');
    if (assistLevel === 2) speak('ClearCAM is marking the area to look at.');
    if (assistLevel === 3) speak('ClearCAM is isolating the important part of the scene.');
  }

  function begin() {
    readSetupSettings();
    current = 0;
    setup.hidden = true;
    finish.hidden = true;
    reader.hidden = false;
    renderScene();
  }

  function goSetup() {
    stopSpeech();
    reader.hidden = true;
    finish.hidden = true;
    setup.hidden = false;
    applySetupSettings();
  }

  $('startBtn').addEventListener('click', begin);
  target.addEventListener('click', findTarget);
  nextBtn.addEventListener('click', nextScene);
  $('assistBtn').addEventListener('click', assist);
  $('exitBtn').addEventListener('click', goSetup);
  $('finishSetupBtn').addEventListener('click', goSetup);
  $('replayBtn').addEventListener('click', () => {
    finish.hidden = true;
    reader.hidden = false;
    current = 0;
    renderScene();
  });

  document.addEventListener('keydown', (event) => {
    if (reader.hidden) return;
    if (event.key === 'Enter' || event.key === ' ') {
      if (!found) {
        event.preventDefault();
        target.click();
      }
    }
  });

  applySetupSettings();
})();
