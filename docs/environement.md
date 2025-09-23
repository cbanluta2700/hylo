# Environment Variables - Inngest Documentation

You can set environment variables to change various parts of Inngest's configuration.

We'll look at all available environment variables here, what to set them to, and what our recommendations are for their use.

- [INNGEST_BASE_URL](about:/docs/sdk/environment-variables#inngest-base-url)
- [INNGEST_DEV](about:/docs/sdk/environment-variables#inngest-dev)
- [INNGEST_ENV](about:/docs/sdk/environment-variables#inngest-env)
- [INNGEST_EVENT_KEY](about:/docs/sdk/environment-variables#inngest-event-key)
- [INNGEST_LOG_LEVEL](about:/docs/sdk/environment-variables#inngest-log-level)
- [INNGEST_SERVE_HOST](about:/docs/sdk/environment-variables#inngest-serve-host)
- [INNGEST_SERVE_PATH](about:/docs/sdk/environment-variables#inngest-serve-path)
- [INNGEST_SIGNING_KEY](about:/docs/sdk/environment-variables#inngest-signing-key)
- [INNGEST_STREAMING](about:/docs/sdk/environment-variables#inngest-streaming)

Within some frameworks and platforms such as Cloudflare Workers, environment variables are not available in the global scope and are instead passed as runtime arguments to your handler. In this case, you can use `inngest.setEnvVars()` to ensure your client has the correct configuration before communicating with Inngest.

---

Use this to tell an SDK the host to use to communicate with Inngest.

If set, it should be the host including the protocol and port, e.g. `http://localhost:8288` or `https://my.tunnel.com`. Can be overwritten by manually specifying `baseUrl` in `new Inngest()` or `serve()`.

In most cases we recommend keeping this unset. A common case, though, is wanting to force a production build of your app to use the Inngest Dev Server instead of Inngest Cloud for local integration testing or similar.

In this case, prefer using [INNGEST_DEV=1](about:/docs/sdk/environment-variables#inngest-dev). For Docker, it may be appropriate to also set `INNGEST_BASE_URL=http://host.docker.internal:8288`. Learn more in our [Docker guide](https://www.inngest.com/docs/guides/development-with-docker).

---

Use this to force an SDK to be in Dev Mode with `INNGEST_DEV=1`, or Cloud mode with `INNGEST_DEV=0`. A URL for the dev server can be set at the same time with `INNGEST_DEV=http://localhost:8288`.

Can be overwritten by manually specifying `isDev` in `new Inngest()`.

Explicitly setting either mode will change the URLs used to communicate with Inngest, as well as turning **off** signature verification in Dev mode, or **on** in Cloud mode.

If neither the environment variable nor config option are specified, the SDK will attempt to infer which mode it should be in based on environment variables such as `NODE_ENV`.

---

Use this to tell Inngest which [Inngest Environment](https://www.inngest.com/docs/platform/environments?ref=environment-variables) you're wanting to send and receive events from.

Can be overwritten by manually specifying `env` in `new Inngest()`.

This is detected and set automatically for some platforms, but others will need manual action. See [Configuring branch environments](about:/docs/platform/environments#configuring-branch-environments?ref=environment-variables) to see if you need this.

---

The key to use to send events to Inngest. See [Creating an Event Key](https://www.inngest.com/docs/events/creating-an-event-key?ref=environment-variables) for more information.

Can be overwritten by manually specifying `eventKey` in `new Inngest()`.

---

The log level to use for the SDK. Can be one of `fatal`, `error`, `warn`, `info`, `debug`, or `silent`.

Defaults to `info`.

---

The host used to access this application from Inngest Cloud.

If set, it should be the host including the protocol and port, e.g. `http://localhost:8288` or `https://my.tunnel.com`. Can be overwritten by manually specifying `serveHost` in `serve()`.

By default, an SDK will try to infer this using request details such as the `Host` header, but sometimes this isn't possible (e.g. when running in a more controlled environment such as AWS Lambda or when dealing with proxies/redirects).

---

The path used to access this application from Inngest Cloud.

If set, it should be a valid URL path with a leading `/`, e.g. `/api/inngest`.

By default, an SDK will try to infer this using request details, but sometimes this isn't possible (e.g. when running in a more controlled environment such as AWS Lambda or when dealing with proxies/redirects).

---

The key used to sign requests to and from Inngest to ensure secure communication. See [Serve - Signing Key](about:/docs/learn/serving-inngest-functions#signing-key?ref=environment-variables) for more information.

Can be overwritten by manually specifying `signingKey` in `serve()`.

---

Only used during signing key rotation. When it's specified, the SDK will automatically retry signing key auth failures with the fallback key.

Available in version `3.18.0` and above.

---

Sets an SDK's streaming support, potentially circumventing restrictive request timeouts and other limitations. See [Streaming](https://www.inngest.com/docs/streaming?ref=environment-variables) for more information.

Can be one of `allow`, `force`, or `false`.

By default, this is `false`, disabling streaming. It can also be overwritten by setting `streaming` in `serve()` with the same values.
