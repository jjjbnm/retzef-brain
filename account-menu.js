(() => {
  const avatarButton = document.getElementById('avatarControl');
  if (!avatarButton) return;
  const host = avatarButton.parentElement;
  const menu = document.createElement('section');
  menu.className = 'account-popover';
  menu.id = 'accountPopover';
  menu.hidden = true;
  menu.setAttribute('aria-label', 'תפריט חשבון');
  menu.innerHTML = `
    <div class="account-popover-head">
      <div class="account-popover-avatar"><img id="popoverAvatar" alt=""></div>
      <div class="account-popover-identity"><strong id="popoverDisplayName"></strong><span id="popoverUsername"></span><small><i></i> מחובר</small></div>
    </div>
    <div class="account-popover-divider"></div>
    <button class="account-popover-item" type="button" data-action="profile"><span class="account-popover-icon">◉</span><span>הפרופיל שלי</span><b>‹</b></button>
    <button class="account-popover-item" type="button" data-action="switch"><span class="account-popover-icon">⇄</span><span>החלפת חשבון</span><b>‹</b></button>
    <div class="account-popover-divider"></div>
    <button class="account-popover-item logout" type="button" data-action="logout"><span class="account-popover-icon">↪</span><span>התנתקות</span></button>`;
  host.appendChild(menu);
  const popAvatar = menu.querySelector('#popoverAvatar');
  const popName = menu.querySelector('#popoverDisplayName');
  const popUser = menu.querySelector('#popoverUsername');
  const close = () => { menu.hidden = true; avatarButton.setAttribute('aria-expanded','false'); };
  const open = () => {
    const image = document.getElementById('accountAvatar');
    const label = document.getElementById('accountUser');
    const user = window.retzefCurrentUser || {};
    popAvatar.src = image?.src || '';
    const hasImage = !!image?.getAttribute('src');
    popAvatar.style.display = hasImage ? 'block' : 'none';
    menu.querySelector('.account-popover-avatar').classList.toggle('no-image', !hasImage);
    popName.textContent = user.displayName || label?.textContent?.replace(/^👤\s*/, '') || 'החשבון שלי';
    popUser.textContent = user.username ? '@' + user.username : '';
    menu.hidden = false;
    avatarButton.setAttribute('aria-expanded','true');
  };
  avatarButton.setAttribute('aria-haspopup','menu');
  avatarButton.setAttribute('aria-expanded','false');
  avatarButton.addEventListener('click', event => { event.stopPropagation(); menu.hidden ? open() : close(); });
  menu.addEventListener('click', async event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    close();
    if (action === 'profile') location.href = '/profile.html';
    if (action === 'switch' || action === 'logout') {
      try { await fetch('/api/account?action=logout', { method:'POST', credentials:'same-origin' }); } catch {}
      location.reload();
    }
  });
  document.addEventListener('click', event => { if (!menu.contains(event.target) && !avatarButton.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.addEventListener('retzef-account-ready', event => { window.retzefCurrentUser = event.detail || {}; });
})();
