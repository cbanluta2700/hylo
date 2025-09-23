# Send events - Inngest Documentation

An event payload object or an array of event payload objects.

Properties

- Name

  `name`

  Type

  string

  Required

  required

  Description

  The event name. We recommend using lowercase dot notation for names, prepending `prefixes/` with a slash for organization.

- Name

  `data`

  Type

  object

  Required

  required

  Description

  Any data to associate with the event. Will be serialized as JSON.

- Name

  `user`

  Type

  object

  Required

  optional

  Description

  Any relevant user identifying data or attributes associated with the event. **This data is encrypted at rest.**

  Properties

  - Name

    `external_id`

    Type

    string

    Required

    optional

    Description

    An external identifier for the user. Most commonly, their user id in your system.

- Name

  `id`

  Type

  string

  Required

  optional

  Description

  A unique ID used to idempotently trigger function runs. If duplicate event IDs are seen, only the first event will trigger function runs. [Read the idempotency guide here](https://www.inngest.com/docs/guides/handling-idempotency).

- Name

  `ts`

  Type

  number

  Required

  optional

  Description

  A timestamp integer representing the time (in milliseconds) at which the event occurred. Defaults to the time the Inngest receives the event.

  If the `ts` time is in the future, function runs will be scheduled to start at the given time. This has the same effect as running `await step.sleepUntil(event.ts)` at the start of the function.

  Note: This does not apply to functions waiting for events. Functions waiting for events will immediately resume, regardless of the timestamp.

- Name

  `v`

  Type

  string

  Required

  optional

  Description

  A version identifier for a particular event payload. e.g. `"2023-04-14.1"`
