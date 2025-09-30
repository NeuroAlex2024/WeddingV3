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

  const ApiClient = {
    request,
    getJson,
    postJson,
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
        }
      };
    }
  };

  window.ApiClient = ApiClient;
})();
