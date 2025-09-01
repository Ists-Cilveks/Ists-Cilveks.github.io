/* Hide all language-specific elements except for the selected language (English by default). */
/* Elements of one language inside an element of (another) language aren't translated, so this selects all the elements that need to be shown/hidden to change the language of the page. To be clear, this is jank. */

/* <style> insertion based on https://stackoverflow.com/a/524721/10630826 */
head = document.head || document.getElementsByTagName('head')[0];
style = document.createElement('style');
head.appendChild(style);
style.type = 'text/css';
style.id = "language-hider";
resetLanguageFromURL();

function resetLanguageFromURL() {
  var urlParams = new URLSearchParams(window.location.search);
  var language = urlParams.get('l') || 'en';
  console.log(language);
  var body = document.body
  console.log(body);
  setLanguageStyles(language)
}
function setLanguageStyles(language) {
  var style = document.getElementById('language-hider');
  style.textContent = "[lang]:not([lang] [lang]):not([lang='"+language+"']) {display: none;}"
}
function setLanguage(language) {
  // https://stackoverflow.com/a/41542008/10630826
  if ('URLSearchParams' in window) {
    const url = new URL(window.location)
    url.searchParams.set('l', language)
    history.pushState(null, '', url);
  }
  setLanguageStyles(language)
}
