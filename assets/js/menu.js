document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('nav-toggle');
  const body = document.body;
  const main = document.getElementById('layout-content');
  const navDrawer = document.getElementById('nav-drawer');
  let isDesktop = window.innerWidth >= 768;

  // set initial state
  const updateMenuState = () => {
    const isMenuOpen = getIsMenuOpen();
    if (isMenuOpen && !isDesktop) {
      main.setAttribute('inert', ''); // desktop default open
    } else {
      main.removeAttribute('inert'); // mobile default closed
    }

    // sync ARIA states for accessibility
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(isMenuOpen));
    }
    if (navDrawer) {
      if (isMenuOpen) {
        navDrawer.removeAttribute('inert');
      } else {
        navDrawer.setAttribute('inert', '');
      }
    }
  };

  function getIsMenuOpen() {
    return isDesktop ? body.dataset.menuOpen !== 'false' : body.dataset.menuOpen === 'true';
  }

  function handleResize(){
    isDesktop = window.innerWidth >= 768;
    updateMenuState();
  };

  updateMenuState();
  window.addEventListener('resize', handleResize);

  // toggle handler
  toggleBtn.addEventListener('click', () => {
    const isOpen = getIsMenuOpen();
    const newOpen = !isOpen;
    body.setAttribute('data-menu-open', String(newOpen));

    updateMenuState();
  });
});
