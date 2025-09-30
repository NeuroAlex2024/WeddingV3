(function () {
  const core = window.AppCore || {};
  const views = window.AppViews || {};
  const App = core;

  Object.assign(App, views);

  window.App = App;

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof App.init === "function") {
      const maybePromise = App.init();
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch((error) => {
          console.error("Не удалось инициализировать приложение", error);
        });
      }
    }
  });
})();
