(function () {
  const createHeaders = (headersInit) => {
    if (headersInit instanceof Headers) {
      return new Headers(headersInit);
    }
    return new Headers(headersInit || {});
  };

  const request = (input, init = {}) => fetch(input, init);

  const getJson = async (input, init = {}) => {
    const response = await request(input, init);
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  };

  const postJson = (input, body, init = {}) => {
    const headers = createHeaders(init.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const nextInit = {
      ...init,
      method: init.method || "POST",
      headers,
      body: JSON.stringify(body ?? {})
    };
    return request(input, nextInit);
  };

  const putJson = (input, body, init = {}) => {
    const headers = createHeaders(init.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const nextInit = {
      ...init,
      method: init.method || "PUT",
      headers,
      body: JSON.stringify(body ?? {})
    };
    return request(input, nextInit);
  };

  const applyAuth = (init = {}, tokenProvider) => {
    const headers = createHeaders(init.headers);
    const token = tokenProvider();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return {
      ...init,
      headers
    };
  };

  const parseJsonResponse = async (response) => {
    try {
      const text = await response.text();
      if (!text) {
        return null;
      }
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  };

  const ApiClient = {
    request,
    getJson,
    postJson,
    putJson,
    async fetchProfile(init = {}) {
      const stores = window.AppStores;
      const tokenProvider = stores && stores.AuthStore && typeof stores.AuthStore.getToken === "function"
        ? () => stores.AuthStore.getToken()
        : () => null;
      const response = await request("/api/profile", applyAuth(init, tokenProvider));
      const data = await parseJsonResponse(response);
      return {
        ok: response.ok,
        status: response.status,
        data
      };
    },
    async updateProfile(body = {}, init = {}) {
      const stores = window.AppStores;
      const tokenProvider = stores && stores.AuthStore && typeof stores.AuthStore.getToken === "function"
        ? () => stores.AuthStore.getToken()
        : () => null;
      const response = await putJson("/api/profile", body, applyAuth(init, tokenProvider));
      const data = await parseJsonResponse(response);
      return {
        ok: response.ok,
        status: response.status,
        data
      };
    },
    withAuth(tokenOrProvider) {
      const provider = typeof tokenOrProvider === "function" ? tokenOrProvider : () => tokenOrProvider;
      return {
        request(input, init = {}) {
          return request(input, applyAuth(init, provider));
        },
        getJson(input, init = {}) {
          return getJson(input, applyAuth(init, provider));
        },
        postJson(input, body, init = {}) {
          return postJson(input, body, applyAuth(init, provider));
        },
        putJson(input, body, init = {}) {
          return putJson(input, body, applyAuth(init, provider));
        },
        async fetchProfile(init = {}) {
          const response = await request("/api/profile", applyAuth(init, provider));
          const data = await parseJsonResponse(response);
          return {
            ok: response.ok,
            status: response.status,
            data
          };
        },
        async updateProfile(body = {}, init = {}) {
          const response = await putJson("/api/profile", body, applyAuth(init, provider));
          const data = await parseJsonResponse(response);
          return {
            ok: response.ok,
            status: response.status,
            data
          };
        }
      };
    }
  };

  window.ApiClient = ApiClient;
})();
