/* Compatibility for old bookmarks; all behavior lives in the shared module. */
(() => {
  const script=document.createElement("script");
  script.src="/design/app.js?v=6";
  script.defer=true;
  document.head.append(script);
})();
