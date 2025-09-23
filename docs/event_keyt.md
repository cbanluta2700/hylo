# Creating an Event Key - Inngest Documentation

“Event Keys” are unique keys that allow applications to send (aka publish) events to Inngest. When using Event Keys with the [Inngest SDK](https://www.inngest.com/docs/events), you can configure the `Inngest` client in 2 ways:

1.  Setting the key as an [`INNGEST_EVENT_KEY`](about:/docs/sdk/environment-variables#inngest-event-key) environment variable in your application\*
2.  Passing the key as an argument

```
// Recommended: Set an INNGEST_EVENT_KEY environment variable for automatic configuration:
const inngest = new Inngest({ name: "Your app name" });

// Or you can pass the eventKey explicitly to the constructor:
const inngest = new Inngest({ name: "Your app name", eventKey: "xyz..." });

// With the Event Key, you're now ready to send data:
await inngest.send({ ... })

```

\* Our [Vercel integration](https://www.inngest.com/docs/deploy/vercel) automatically sets the [`INNGEST_EVENT_KEY`](about:/docs/sdk/environment-variables#inngest-event-key) as an environment variable for you

🙋 Event Keys should be unique to a given **environment** (e.g. production, branch environments) and a specific **application** (your API, your mobile app, etc.). Keeping keys separated by application makes it easier to manage keys and rotate them when necessary.

🔐 **Securing Event Keys** - As Event Keys are used to send data to your Inngest environment, you should take precautions to secure your keys. Avoid storing them in source code and store the keys as secrets in your chosen platform when possible.

## [Creating a new Event Key](about:/docs/events/creating-an-event-key#creating-a-new-event-key)

From the Inngest Cloud dashboard, Event Keys are listed in the "Manage" tab:

1.  Click on "Manage" ([direct link](https://app.inngest.com/env/production/manage/keys))
2.  Click the "+ Create Event Key" button at the top right
3.  Update the Event Key's name to something descriptive and click "Save changes"
4.  Copy the newly created key using the “Copy” button:

![A newly created Event Key in the Inngest Cloud dashboard](https://www.inngest.com/_next/image?url=%2Fassets%2Fdocs%2Fcreating-an-event-key%2Fnew-event-key-2023.png&w=3840&q=75)

🎉 You can now use this event key with the Inngest SDK to send events directly from any codebase. You can also:

- Rename your event key at any time using the “Name” field so you and your team can identify it later
- Delete the event key when your key is no longer needed
- Filter events by name or IP addresses for increased control and security

⚠️ While it is _possible_ to use Event Keys to send events from the browser, this practice presents risks as anyone inspecting your client side code will be able to read your key and send events to your Inngest environment. If you'd like to send events from the client, we recommend creating an API endpoint or edge function to proxy the sending of events.
