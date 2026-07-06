// Clickjacking defense. Runs before anything else renders (see index.html,
// which starts the page hidden via `html { display: none }`).
//
// If this page is the top-level document, reveal it normally. If it's been
// loaded inside someone else's frame/iframe, redirect the whole browser
// window to the real page instead of letting it render invisibly-overlaid
// content for a clickjacking attack.
(function () {
  if (window.top === window.self) {
    document.documentElement.style.display = 'block';
  } else {
    window.top.location = window.self.location.href;
  }
})();
