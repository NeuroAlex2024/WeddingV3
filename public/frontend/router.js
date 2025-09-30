(function () {
  function attachRouter(App) {
    Object.assign(App, {
      handleRouteChange() {
        const hash = location.hash || "#/dashboard";
        this.state.profile = this.loadProfile();
        this.syncMarketplaceFavoritesFromProfile(this.state.profile);
        if (hash === "#/welcome") {
          location.replace("#/dashboard");
          return;
        }
        if (!this.allowedRoutes.includes(hash)) {
          location.replace("#/dashboard");
          return;
        }
        this.state.currentRoute = hash;
        if (hash !== "#/quiz") {
          this.state.currentStep = 0;
        }
        this.render();
      },
      render() {
        switch (this.state.currentRoute) {
          case "#/quiz":
            this.renderQuiz();
            break;
          case "#/website":
            this.renderWebsiteDesigner();
            break;
          case "#/dashboard":
            this.renderDashboard();
            break;
          default:
            this.renderDashboard();
        }
      }
    });
  }

  window.AppRouter = {
    attach: attachRouter
  };
})();
