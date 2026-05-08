// Sha'p Left Production-Spec Briefing — password gate
// Pattern matches docs.drsophia.ai/briefings/2026-04-30/ — sessionStorage hash, SHA-256.
// NOT real security — client-side only. Briefing is confidential but not high-risk material.

(function () {
  const STORAGE_KEY = 'briefing-auth-2026-05-08';
  // SHA-256 of 'DrSophia2027!@#$' — computed via: printf 'DrSophia2027!@#$' | sha256sum
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

  // ===== Index page: render the gate, validate input =====
  // The index page must include <body class="auth-locked"> and an #auth-overlay.
  // Chapter pages must include the <body class="auth-locked"> by default and call
  // BriefingAuth.requireAuth() which redirects to index.html if no auth in sessionStorage.

  window.BriefingAuth = {
    isAuthed,
    expectedHash: EXPECTED_HASH,

    // Called by index.html after DOM is ready.
    initIndexGate() {
      const overlay = document.getElementById('auth-overlay');
      const form = document.getElementById('auth-form');
      const input = document.getElementById('auth-input');
      const errorEl = document.getElementById('auth-error');
      if (!overlay || !form || !input) return;

      // Already authed? Drop the lock.
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

    // Called by chapter pages. Redirects to ../index.html if not authed.
    requireAuth(indexPath) {
      const path = indexPath || './index.html';
      if (isAuthed()) {
        document.body.classList.remove('auth-locked');
        return true;
      }
      // Soft redirect — the body remains hidden via .auth-locked + display:none rule.
      window.location.replace(path);
      return false;
    }
  };
})();
