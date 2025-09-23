# Referencing functions - Inngest Documentation

Using [`step.invoke()`](https://www.inngest.com/docs/reference/functions/step-invoke), you can directly call one Inngest function from another and handle the result. You can use this with `referenceFunction` to call Inngest functions located in other apps, or to avoid importing dependencies of functions within the same app.

The simplest reference just contains a `functionId`. When used, this will invoke the function with the given ID in the same app that is used to invoke it.

The input and output types are `unknown`.

If referencing a function in a different application, specify an `appId` too:

You can optionally provide `schemas`, which are a collection of [Zod](https://zod.dev/) schemas used to provide typing to the input and output of the referenced function.

In the future, this will also _validate_ the input and output.

Even if functions are within the same app, this can also be used to avoid importing the dependencies of one function into another, which is useful for frameworks like Next.js where edge and serverless logic can be colocated but require different dependencies.

- Name

  `functionId`

  Type

  string

  Required

  required

  Description

  The ID of the function to reference. This can be either a local function ID or the ID of a function that exists in another app.

  If the latter, `appId` must also be provided. If `appId` is not provided, the function ID will be assumed to be a local function ID (the app ID of the calling app will be used).

- Name

  `appId`

  Type

  string

  Required

  optional

  Description

  The ID of the app that the function belongs to. This is only required if the function being refenced exists in another app.

- Name

  `schemas`

  Type

  object

  Required

  optional

  Description

  The schemas of the referenced function, providing typing to the input `data` and `return` of invoking the referenced function.

  If not provided and a local function type is not being passed as a generic into `referenceFunction()`, the schemas will be inferred as `unknown`.

  Properties

  - Name

    `data`

    Type

    zod

    Required

    optional

    Description

    The [Zod](https://zod.dev/) schema to use to provide typing to the `data` payload required by the referenced function.

  - Name

    `return`

    Type

    zod

    Required

    optional

    Description

    The [Zod](https://zod.dev/) schema to use to provide typing to the return value of the referenced function when invoked.
