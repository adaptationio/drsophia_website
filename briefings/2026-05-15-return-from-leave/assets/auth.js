// Return-from-leave briefing — password gate
// SHA-256 of 'DrSophia2027!@#$' (same password as 2026-04-30 + 2026-05-08 briefings).
// Storage key differs so a stale session from the 8 May briefing doesn't bypass this one.

(function () {
  const STORAGE_KEY = 'briefing-auth-2026-05-15-return';
  const EXPECTED_HASH = '8e56d1894de3e96f63f10721f639a224292987ce36b6a3e5f560650be9fced6f';

  async function sha256Hex(input) {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function isAuthed() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === EXPECTED_HASH;
    } catch (e) {
      return false;
    }
  }

  function persist(hash) {
    try { sessionStorage.setItem(STORAGE_KEY, hash); } catch (e) {}
  }

  window.BriefingAuth = {
    isAuthed,
    expectedHash: EXPECTED_HASH,

    initIndexGate() {
      const overlay = document.getElementById('auth-overlay');
      const form = document.getElementById('auth-form');
      const input = document.getElementById('auth-input');
      const errorEl = document.getElementById('auth-error');
      if (!overlay || !form || !input) return;

      if (isAuthed()) {
        document.body.classList.remove('auth-locked');
        overlay.style.display = 'none';
        return;
      }

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const value = input.value;
        if (!value) return;
        try {
          const hash = await sha256Hex(value);
          if (hash === EXPECTED_HASH) {
            persist(hash);
            document.body.classList.remove('auth-locked');
            overlay.style.display = 'none';
            errorEl.classList.remove('visible');
          } else {
            errorEl.textContent = 'Wrong password. Try again, or contact Willie.';
            errorEl.classList.add('visible');
            input.value = '';
            input.focus();
          }
        } catch (err) {
          errorEl.textContent = 'Browser does not support SHA-256. Use a modern browser.';
          errorEl.classList.add('visible');
        }
      });
      input.focus();
    },

    requireAuth(indexPath) {
      const path = indexPath || './index.html';
      if (isAuthed()) {
        document.body.classList.remove('auth-locked');
        return true;
      }
      window.location.replace(path);
      return false;
    }
  };
})();
