# Create the Inngest Client - Inngest Documentation

The `Inngest` client object is used to configure your application, enabling you to create functions and send events.

---

- Name

  `id`

  Type

  string

  Required

  required

  Description

  A unique identifier for your application. We recommend a hyphenated slug.

- Name

  `baseUrl`

  Type

  string

  Required

  optional

  Description

  Override the default (`https://inn.gs/`) base URL for sending events. See also the [`INNGEST_BASE_URL`](about:/docs/sdk/environment-variables#inngest-base-url) environment variable.

- Name

  `env`

  Type

  string

  Required

  optional

  Description

  The environment name. Required only when using [Branch Environments](https://www.inngest.com/docs/platform/environments).

- Name

  `eventKey`

  Type

  string

  Required

  optional

  Description

  An Inngest [Event Key](https://www.inngest.com/docs/events/creating-an-event-key). Alternatively, set the [`INNGEST_EVENT_KEY`](about:/docs/sdk/environment-variables#inngest-event-key) environment variable.

- Name

  `fetch`

  Type

  Fetch API compatible interface

  Required

  optional

  Description

  Override the default [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) implementation. Defaults to the runtime's native Fetch API.

  If you need to specify this, make sure that you preserve the function's [binding](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind), either by using `.bind` or by wrapping it in an anonymous function.

- Name

  `isDev`

  Type

  boolean

  Required

  optional

  Description

  Set to `true` to force Dev mode, setting default local URLs and turning off signature verification, or force Cloud mode with `false`. Alternatively, set [`INNGEST_DEV`](about:/docs/sdk/environment-variables#inngest-dev).

- Name

  `logger`

  Type

  Logger

  Required

  optional

  Description

  A logger object that provides the following interfaces (`.info()`, `.warn()`, `.error()`, `.debug()`). Defaults to using `console` if not provided. Overwrites [`INNGEST_LOG_LEVEL`](about:/docs/sdk/environment-variables#inngest-log-level) if set. See [logging guide](https://www.inngest.com/docs/guides/logging) for more details.

- Name

  `middleware`

  Type

  array

  Required

  optional

  Description

  A stack of [middleware](https://www.inngest.com/docs/reference/middleware/overview) to add to the client.

- Name

  `schemas`

  Type

  EventSchemas

  Required

  optional

  Description

  Event payload types. See [Defining Event Payload Types](about:/docs/reference/client/create#defining-event-payload-types).

We recommend setting the [`INNGEST_EVENT_KEY`](about:/docs/sdk/environment-variables#inngest-event-key) as an environment variable over using the `eventKey` option. As with any secret, it's not a good practice to hard-code the event key in your codebase.

You can leverage TypeScript or Zod to define your event payload types. When you pass types to the Inngest client, events are fully typed when using them with `inngest.send()` and `inngest.createFunction()`. This can more easily alert you to issues with your code during compile time.

Click the toggles on the top left of the code block to see the different methods available!

### [Reusing event types v2.0.0+](about:/docs/reference/client/create#reusing-event-types)

You can use the `GetEvents<>` generic to access the final event types from an Inngest client.

It's recommended to use this instead of directly reusing your event types, as Inngest will add extra properties and internal events such as `ts` and `inngest/function.failed`.

For more information on this and other TypeScript helpers, see [TypeScript - Helpers](about:/docs/typescript#helpers).

An SDK can run in two separate "modes:" **Cloud** or **Dev**.

- **Cloud Mode**
  - 🔒 Signature verification **ON**
  - Defaults to communicating with Inngest Cloud (e.g. `https://api.inngest.com`)
- **Dev Mode**
  - ❌ Signature verification **OFF**
  - Defaults to communicating with an Inngest Dev Server (e.g. `http://localhost:8288`)

You can force either Dev or Cloud Mode by setting [`INNGEST_DEV`](about:/docs/sdk/environment-variables#inngest-dev) or the [`isDev`](about:/docs/reference/client/create#configuration) option.

If neither is set, the SDK will attempt to infer which mode it should be in based on environment variables such as `NODE_ENV`. Most of the time, this inference is all you need and explicitly setting a mode isn't required.

Instantiating the `Inngest` client in a single file and sharing it across your codebase is ideal as you only need a single place to configure your client and define types which can be leveraged anywhere you send events or create functions.

### [Handling multiple environments with middleware](about:/docs/reference/client/create#handling-multiple-environments-with-middleware)

If your client uses middleware, that middleware may import dependencies that are not supported across multiple environments such as "Edge" and "Serverless" (commonly with either access to WebAPIs or Node).

In this case, we'd recommend creating a separate client for each environment, ensuring Node-compatible middleware is only used in Node-compatible environments and vice versa.

This need is common in places where function execution should declare more involved middleware, while sending events from the edge often requires much less.

Also see [Referencing functions](https://www.inngest.com/docs/functions/references), which can help you invoke functions across these environments without pulling in any dependencies.
