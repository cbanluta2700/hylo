# TypeScript - Inngest Documentation

The Inngest SDK leverages the full power of TypeScript, providing you with some awesome benefits when handling events:

- 📑 **Autocomplete**  
  Tab ↹ your way to victory with inferred types for every event.
- **Instant feedback**  
  Understand exactly where your code might error before you even save the file.

All of this comes together to provide some awesome type inference based on your actual production data.

Once your types are generated, there are a few ways we can use them to ensure our functions are protected.

### [`new Inngest()` client](about:/docs/typescript#new-inngest-client)

We can use these when creating a new Inngest client via `new Inngest()`.

This comes with powerful inference; we autocomplete your event names when selecting what to react to, without you having to dig for the name and data.

### [Sending events](about:/docs/typescript#sending-events)

TypeScript will also enforce your custom events being the right shape - see [Event Format](https://www.inngest.com/docs/reference/events/send) for more details.

We recommend putting your `new Inngest()` client and types in a single file, i.e. `/inngest/client.ts` so you can use it anywhere that you send an event.

Here's an example of sending an event within a Next.js API handler:

### [Using with `waitForEvent`](about:/docs/typescript#using-with-wait-for-event)

When writing step functions, you can use `waitForEvent` to pause the current function until another event is received or the timeout expires - whichever happens first. When you declare your types using the `Inngest` constructor, `waitForEvent` leverages any types that you have:

The TS SDK exports some helper types to allow you to access the type of particular Inngest internals outside of an Inngest function.

### [GetEvents v2.0.0+](about:/docs/typescript#get-events)

Get a record of all available events given an Inngest client.

It's recommended to use this instead of directly reusing your own event types, as Inngest will add extra properties and internal events such as `ts` and `inngest/function.failed`.

By default, the returned events do not include internal events prefixed with `inngest/`, such as `inngest/function.finished`.

To include these events in v3.13.1+, pass a second `true` generic:

### [GetFunctionInput v3.3.0+](about:/docs/typescript#get-function-input)

Get the argument passed to Inngest functions given an Inngest client and, optionally, an event trigger.

Useful for building function factories or other such abstractions.

### [GetStepTools v3.3.0+](about:/docs/typescript#get-step-tools)

Get the `step` object passed to an Inngest function given an Inngest client and, optionally, an event trigger.

Is a small shim over the top of `GetFunctionInput<...>["step"]`.

### [Inngest.Any / InngestFunction.Any v3.10.0+](about:/docs/typescript#inngest-any-inngest-function-any)

Some exported classes have an `Any` type within their namespace that represents any instance of that class without inference or generics.

This is useful for typing lists of functions or factories that create Inngest primitives.
