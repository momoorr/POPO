/* POPO Stage 4E.2 — single integrated hero scene. Preserve real DOM controls.
 * Desktop/mobile illustrations are rendered by CSS backgrounds, so no stitched
 * image fragments are inserted in the DOM or fetched through JavaScript.
 * All other POPO screens, FastAPI, calculation and AI chat remain unchanged.
 */
(function () {
  'use strict';
  function start() {
    const home = document.querySelector('.view[data-panel="home"]');
    if (!home) return;
    const hero = home.querySelector('.hero.storybook-hero');
    const heading = home.querySelector('#home-title');
    const desc = home.querySelector('.hero-desc');
    const begin = home.querySelector('#open-birth');
    if (!hero || !heading || !desc || !begin) return;
    if (hero.dataset.popoBoardSync === 'true') return;
    hero.dataset.popoBoardSync = 'true';
    hero.classList.add('popo-board-landing');

    // All copy and the CTA remain semantic, accessible HTML, never part of art.
    heading.replaceChildren();
    heading.append('나를 읽는');
    heading.appendChild(document.createElement('br'));
    heading.append('AI 사주 상담,');
    heading.appendChild(document.createElement('br'));
    const brandLine = document.createElement('span');
    brandLine.className = 'popo-board-title-accent';
    brandLine.textContent = 'POPO';
    heading.appendChild(brandLine);

    desc.replaceChildren();
    desc.append('달토끼 포포와 함께,');
    desc.appendChild(document.createElement('br'));
    desc.append('당신의 오늘과 내일을 더 깊이 이해해 보세요.');

    const intro = hero.querySelector('.hero-left .eyebrow');
    if (intro) intro.textContent = '✦  달빛 아래 포포가 기다리고 있어';
    begin.replaceChildren();
    begin.append('사주 보기 시작하기');
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = ' →';
    begin.appendChild(arrow);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
