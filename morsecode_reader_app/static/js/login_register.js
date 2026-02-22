// eyetalk/static/js/login_register.js
// - Handles animated switch between Login / Register
// - Handles password show/hide on lock icons
// - Plays animation Register -> Login on successful form submit

(function () {
  // -------------------------------
  // CONFIG
  // -------------------------------
  const NAV_DELAY = 2500; // ms (match your CSS transition)
  const SIGNUP_SELECTOR = '.SignUpLink';
  const SIGNIN_SELECTOR = '.SignInLink';
  const CONTAINER_SELECTOR = '.container';

  // -------------------------------
  // NAV HELPERS
  // -------------------------------

  function normalizeHref(href) {
    if (!href) return null;
    href = href.trim();
    if (/^https?:\/\//i.test(href)) return href; // absolute
    if (href.startsWith('/')) return href;       // root-relative
    if (href.startsWith('#') || href.startsWith('javascript:')) return null;
    return null; // relative like "register.html" -> treat as unsafe
  }

  function safeNavigate(href) {
    if (!href) return;
    try {
      window.location.assign(href);
    } catch (err) {
      window.location.href = href;
    }
  }

  function attachAnimatedNav(nodeList, makeActive) {
    if (!nodeList || nodeList.length === 0) return;

    const container = document.querySelector(CONTAINER_SELECTOR);

    nodeList.forEach(el => {
      if (!el) return;

      el.addEventListener('click', function (event) {
        // let Ctrl+click, middle click, etc behave normally
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button === 1) {
          return;
        }

        const rawHref = el.getAttribute('href');
        const href = normalizeHref(rawHref);

        // If href is null (like "#"), just play animation, no navigation
        if (!href) {
          event.preventDefault();
          event.stopPropagation();

          if (container) {
            if (makeActive) container.classList.add('active');
            else container.classList.remove('active');
          }
          return;
        }

        // Safe href: animate, then navigate
        event.preventDefault();
        event.stopPropagation();

        if (container) {
          if (makeActive) container.classList.add('active');
          else container.classList.remove('active');
        }

        setTimeout(() => safeNavigate(href), NAV_DELAY);
      }, { passive: false });
    });
  }

  // -------------------------------
  // PASSWORD TOGGLE HELPER
  // -------------------------------

  function attachPasswordToggle(inputSelector, iconSelector) {
    const input = document.querySelector(inputSelector);
    const icon = document.querySelector(iconSelector);

    if (!input || !icon) return; // if element not found, skip

    icon.style.cursor = 'pointer';

    icon.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      // change icon between lock-closed and lock-open
      icon.setAttribute('name', isPassword ? 'lock-open-alt' : 'lock-alt');
    });
  }

  // -------------------------------
  // INIT
  // -------------------------------

  function init() {
    const signupEls = Array.from(document.querySelectorAll(SIGNUP_SELECTOR));
    const signinEls = Array.from(document.querySelectorAll(SIGNIN_SELECTOR));

    // Login <-> Register animation (via links)
    attachAnimatedNav(signupEls, true);   // SignUpLink => show Register side (.active)
    attachAnimatedNav(signinEls, false);  // SignInLink => show Login side (remove .active)

    const container = document.querySelector(CONTAINER_SELECTOR);
    const registerForm = document.querySelector('.form-box.Register form');
    let hasAnimatedSubmit = false;

    // 🔹 Animate Register -> Login on submit
    if (container && registerForm) {
      registerForm.addEventListener('submit', function (event) {
        // avoid infinite loop when we call form.submit() programmatically
        if (hasAnimatedSubmit) return;

        event.preventDefault();
        hasAnimatedSubmit = true;

        // slide back to Login (remove .active)
        container.classList.remove('active');

        // wait for animation, then really submit the form (POST to Django)
        setTimeout(function () {
          registerForm.submit();
        }, NAV_DELAY);
      });
    }

    // --------------------
    // Attach password toggles
    // --------------------
    // Login password (your HTML: id="password", id="loginTogglePassword")
    attachPasswordToggle(
      '.form-box.Login input#password',
      '.form-box.Login box-icon#loginTogglePassword'
    );

    // Register password (id="registerPassword", id="registerTogglePassword")
    attachPasswordToggle(
      '.form-box.Register input#registerPassword',
      '.form-box.Register box-icon#registerTogglePassword'
    );

    // Register confirm password (id="registerConfirmPassword", id="registerToggleConfirmPassword")
    attachPasswordToggle(
      '.form-box.Register input#registerConfirmPassword',
      '.form-box.Register box-icon#registerToggleConfirmPassword'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();










































