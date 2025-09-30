(function () {
  function attachProfileStorage(App) {
    Object.assign(App, {
      loadProfile() {
        try {
          const raw = localStorage.getItem(this.storageKey);
          if (!raw) return null;
          const profile = JSON.parse(raw);
          if (!profile || typeof profile !== "object") {
            return null;
          }
          if (profile.schemaVersion !== this.PROFILE_SCHEMA_VERSION) {
            const { profile: upgradedProfile, updated } = this.upgradeProfile(profile);
            if (!upgradedProfile) {
              return null;
            }
            if (updated) {
              this.saveProfile(upgradedProfile);
            } else {
              this.state.profile = upgradedProfile;
            }
            return upgradedProfile;
          }
          const normalizedChecklist = this.normalizeChecklistData(profile);
          let nextProfile = { ...profile };
          let needsSave = false;
          if (normalizedChecklist.updated) {
            nextProfile.checklist = normalizedChecklist.checklist;
            nextProfile.checklistFolders = normalizedChecklist.checklistFolders;
            needsSave = true;
          }
          const websiteNormalization = this.normalizeWebsiteInvitation(nextProfile.websiteInvitation, Date.now());
          if (!nextProfile.websiteInvitation || websiteNormalization.updated) {
            nextProfile.websiteInvitation = websiteNormalization.invitation;
            needsSave = true;
          } else {
            nextProfile.websiteInvitation = websiteNormalization.invitation;
          }
          if (needsSave) {
            nextProfile = {
              ...nextProfile,
              schemaVersion: this.PROFILE_SCHEMA_VERSION,
              updatedAt: Date.now()
            };
            this.saveProfile(nextProfile);
          }
          return nextProfile;
        } catch (error) {
          console.error("Не удалось загрузить профиль", error);
          return null;
        }
      },
      saveProfile(profile) {
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(profile));
          this.state.profile = profile;
          this.syncMarketplaceFavoritesFromProfile(profile);
        } catch (error) {
          console.error("Не удалось сохранить профиль", error);
        }
      },
      updateProfile(patch) {
        const current = this.state.profile || {};
        const next = {
          ...current,
          ...patch,
          updatedAt: Date.now(),
          schemaVersion: this.PROFILE_SCHEMA_VERSION
        };
        this.saveProfile(next);
      },
      clearProfile() {
        localStorage.removeItem(this.storageKey);
        this.state.profile = null;
        this.state.marketplaceFavorites = new Set();
        this.state.marketplaceSelections = {};
      }
    });
  }

  window.ProfileStorage = {
    attach: attachProfileStorage
  };
})();
