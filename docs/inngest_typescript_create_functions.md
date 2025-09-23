# Create Function - Inngest Documentation

Define your functions using the `createFunction` method on the [Inngest client](https://www.inngest.com/docs/reference/client/create).

---

The `createFunction` method accepts a series of arguments to define your function.

### [Configuration](about:/docs/reference/functions/create#configuration)

- Name

  `id`

  Type

  string

  Required

  required

  Description

  A unique identifier for your function. This should not change between deploys.

- Name

  `name`

  Type

  string

  Required

  optional

  Description

  A name for your function. If defined, this will be shown in the UI as a friendly display name instead of the ID.

- Name

  `concurrency`

  Type

  number | object | \[object, object\]

  Required

  optional

  Description

  Limit the number of concurrently running functions ([reference](https://www.inngest.com/docs/functions/concurrency))

- Name

  `throttle`

  Type

  object

  Required

  optional

  Description

  Limits the number of new function runs started over a given period of time ([guide](https://www.inngest.com/docs/guides/throttling)).

- Name

  `idempotency`

  Type

  string

  Required

  optional

  Description

  A key expression which is used to prevent duplicate events from triggering a function more than once in 24 hours. This is equivalent to setting `rateLimit` with a `key`, a `limit` of `1` and `period` of `24hr`. [Read the idempotency guide here](https://www.inngest.com/docs/guides/handling-idempotency).

  Expressions are defined using the Common Expression Language (CEL) with the original event accessible using dot-notation. Read [our guide to writing expressions](https://www.inngest.com/docs/guides/writing-expressions) for more info. Examples:

  - Only run once for each customer id: `'event.data.customer_id'`
  - Only run once for each account and email address: `'event.data.account_id + "-" + event.user.email'`

- Name

  `rateLimit`

  Type

  object

  Required

  optional

  Description

  Options to configure how to rate limit function execution ([reference](https://www.inngest.com/docs/reference/functions/rate-limit))

- Name

  `debounce`

  Type

  object

  Required

  optional

  Description

  Options to configure function debounce ([reference](https://www.inngest.com/docs/reference/functions/debounce))

- Name

  `priority`

  Type

  object

  Required

  optional

  Description

  Options to configure how to prioritize functions

- Name

  `batchEvents`

  Type

  object

  Required

  optional

  Description

  Configure how the function should consume batches of events ([reference](https://www.inngest.com/docs/guides/batching))

- Name

  `retries`

  Type

  number

  Required

  optional

  Description

  Configure the number of times the function will be retried from `0` to `20`. Default: `4`

- Name

  `onFailure`

  Type

  function

  Required

  optional

  Description

  A function that will be called only when this Inngest function fails after all retries have been attempted ([reference](https://www.inngest.com/docs/reference/functions/handling-failures))

- Name

  `cancelOn`

  Type

  array of objects

  Required

  optional

  Description

  Define events that can be used to cancel a running or sleeping function ([reference](https://www.inngest.com/docs/reference/typescript/functions/cancel-on))

- Name

  `timeouts`

  Type

  object

  Required

  optional

  Description

  Options to configure timeouts for cancellation ([reference](https://www.inngest.com/docs/features/inngest-functions/cancellation/cancel-on-timeouts))

### [Trigger](about:/docs/reference/functions/create#trigger)

One of the following function triggers is **Required**.

You can also specify an array of up to 10 of the following triggers to invoke your function with multiple events or crons. See the [Multiple Triggers](https://www.inngest.com/docs/guides/multiple-triggers) guide.

Cron triggers with overlapping schedules for a single function will be deduplicated.

- Name

  `event`

  Type

  string

  Required

  optional

  Description

  The name of the event that will trigger this event to run

- Name

  `cron`

  Type

  string

  Required

  optional

  Description

  A [unix-cron](https://crontab.guru/) compatible schedule string.  
  Optional timezone prefix, e.g. `TZ=Europe/Paris 0 12 * * 5`.

When using an `event` trigger, you can optionally combine it with the `if` option to filter events:

Additional options

- Name

  `if`

  Type

  string

  Required

  optional

  Description

  A comparison expression that returns true or false whether the function should handle or ignore a given matching event.

  Expressions are defined using the Common Expression Language (CEL) with the original event accessible using dot-notation. Read [our guide to writing expressions](https://www.inngest.com/docs/guides/writing-expressions) for more info. Examples:

  - `'event.data.action == "published"'`
  - `'event.data.priority >= 4'`

### [Handler](about:/docs/reference/functions/create#handler)

The handler is your code that runs whenever the trigger occurs. Every function handler receives a single object argument which can be deconstructed. The key arguments are `event` and `step`. Note, that scheduled functions that use a `cron` trigger will not receive an `event` argument.

### [`event`](about:/docs/reference/functions/create#event)

The event payload `object` that triggered the given function run. The event payload object will match what you send with [`inngest.send()`](https://www.inngest.com/docs/reference/events/send). Below is an example event payload object:

### [`events` v2.2.0+](about:/docs/reference/functions/create#events)

`events` is an array of `event` payload objects that's accessible when the `batchEvents` is set on the function configuration. If batching is not configured, the array contains a single event payload matching the `event` argument.

### [`step`](about:/docs/reference/functions/create#step)

The `step` object has methods that enable you to define

- [`step.run()`](https://www.inngest.com/docs/reference/functions/step-run) - Run synchronous or asynchronous code as a retriable step in your function
- [`step.sleep()`](https://www.inngest.com/docs/reference/functions/step-sleep) - Sleep for a given amount of time
- [`step.sleepUntil()`](https://www.inngest.com/docs/reference/functions/step-sleep-until) - Sleep until a given time
- [`step.invoke()`](https://www.inngest.com/docs/reference/functions/step-invoke) - Invoke another Inngest function as a step, receiving the result of the invoked function
- [`step.waitForEvent()`](https://www.inngest.com/docs/reference/functions/step-wait-for-event) - Pause a function's execution until another event is received
- [`step.sendEvent()`](https://www.inngest.com/docs/reference/functions/step-send-event) - Send event(s) reliability within your function. Use this instead of `inngest.send()` to ensure reliable event delivery from within functions.

### [`runId`](about:/docs/reference/functions/create#run-id)

The unique ID for the given function run. This can be useful for logging and looking up specific function runs in the Inngest dashboard.

### [`logger` v2.0.0+](about:/docs/reference/functions/create#logger)

The `logger` object exposes the following interfaces.

It is a proxy object that is either backed by `console` or the logger you provided ([reference](https://www.inngest.com/docs/guides/logging)).

### [`attempt` v2.5.0+](about:/docs/reference/functions/create#attempt)

The current zero-indexed attempt number for this function execution. The first attempt will be 0, the second 1, and so on. The attempt number is incremented every time the function throws an error and is retried.
