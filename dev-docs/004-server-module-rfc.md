- Start Date: 2019-05-14
- RFC PR: [#453](https://github.com/uber/xviz/pull/453)
- XVIZ Issues: [#274](https://github.com/uber/xviz/issues/274)

# Summary

**@xviz/server** will implement a complete XVIZ Server module.

![@xviz/server diagram](../docs/api-reference/server/images/xviz-server-block-diagram.svg)

This server will support the following:
 - Multiple log support
 - Dynamic XVIZ conversion
 - XVIZ format conversion
 - XVIZ stream filtering
 - Dynamic scenarios
 - Message validation

# Motivation

The current adhoc script is unstructured and was meant as a simple way to serve up a single
set of XVIZ data. Users coming to XVIZ quickly progress to wanting to understand what the
eco-system can do to make data-based decisions on if XVIZ and streetscape.gl are a good fit
for their use-cases. The simple script is not scalable to achieving more sophisticated examples
of the types of interactions XVIZ was designed for and therefore a more complete and well-structured
server module is required.

# Detailed Design

## Overview

The **@xviz/server** follows the **@xviz/cli** internal design by using a middleware stack defined
in terms of the [XVIZ Session](/docs/api-reference/server/xviz-server.md) types. The server module
defines core classes, described below, and the overall structure for how the server is designed to
work. The default server command line application serves as an example for how to register custom
[XVIZProviders](/docs/api-reference/io/overview-provider.md) in order for the server to construct
the appropriate instance capable of handling a request.

The next step in customization would be to construct the middleware stack. There are a few components
that are basic and required for every stack structure and included such as XVIZ message handling and
sending data out the websocket.  Here is a list of examples of middleware that could be created to customize
the server for a specific use-case:

 - Filter streams from a fixed XVIZ data source
 - Convert XVIZ to another format
 - Proxy an upstream connection for custom protocol conversion
 - Dynamic converison of data to XVIZ 

## Server structure

An easy way to see the structure is to see the code that is connected together
in close proximity so you can easily follow the flow of control and data. The
psuedo code below with inline comments describes the flow and context along the way.

### Server startup

Lets start at the entry point for a custom application.  The [XVIZServer](/docs/api-reference/server/xviz-server.md)
is responsible for starting the websocket server and dispatching on connection
to the [XVIZHandler](/docs/api-reference/server/xviz-handler.md).

```
import {CustomHandler} from './custom-handler';
import {XVIZServer} from '@xviz/server';

function main() {
  // This is the code that will receive the 
  const myHandler = new CustomHandler(...);  

  // This starts the server.
  const server = new  XVIZServer([myHandlers], ...);
}
```

### Connection dispatch to handlers

Upon connection the server will iterate over the handlers
stopping at the first valid session returned and calling the
`onConnection` method for that session.

```
XVIZServer.onConnect(socket, request) {
  for (const handler in this.handlers) {
    const session = handler.newSession(socket, request);
    if (session) {
      session.onConnect();
      break;
    }
  }
}
```

### Handling a request

A handler will determine if it can support a specific request and if so
return an [XVIZSession](/docs/api-reference/server/xviz-session.md) to take over the websocket and respond to events.

```
import {CustomSession} from './custom-session';

class CustomHandler {
  newSession(socket, request) {

    // A handler would inspect the request object to determine
    // if this request can handled.  A handler could accept all
    // connections and wait for the 'start' message in order to make
    // a determination if a request can be handled.

    if (this.validRequest(request)) {
      return new CustomSession(socket, request);
    }

    return null;
  }
}
```

### Managing the Session

Now that a connection is setup, the rest of the control is handled by the
Session. The session is where most of the flow is controlled.

The Session must construct the [XVIZServerMiddleware](/docs/api-reference/server/xviz-server-middleware.md) and delegate incoming
message to the middleware as appropriate. It also must register event handlers for the
websocket.

An XVIZSession is responsible for setting up any middleware components.  The components
are may wish to have a reference to the session state available in the [XVIZSessionContext](/docs/api-reference/server/xviz-session-context.md)
class.

```
class CustomSession {
  constructor(socket, request, ...) {
    this.socket = socket;
    this.request = request;

    // The XVIZMiddlewareContext provides access to state and can store
    // state for the duration of the session.
    this.context = new XVIZSessionContext();
    this.middlware = new XVIZServerMiddlewareStack);

    // The stack will be processed in order. We are providing a 'context'
    // that stores state shared across the middleware components.
    // In addition we are passing the 'middleware' to the components so
    // they may make calls in response to a particular context.
    const stack = [
      new XVIZProviderRequestHandler(this.context, this.middleware, ...),
      new XVIZWebsocketSender(this.context, this.middleware, this.socket, ...)
    ];

    this.middleware.set(stack);

    this.socket.onmessage => msg => this.onMessage(msg);
  }

  onMessage(message) {
    // Route XVIZ messages throught the middleware stack
    if (isXVIZMessage(message.data)) {
      const xvizData = new XVIZData(message.data);
      switch (xvizData.type) {
        case 'start':
          this.middleware.onStart(xvizData);
          break;
        case 'transform_log':
          this.middleware.onTransformLog(xvizData);
          break;
        default:
          break; 
      }
    } else {
      // Handle non-XVIZ messages
    }
  }
}
```

### The middleware stack

The [XVIZServerMiddleware](/docs/api-reference/server/overview-middleware.md) is processed in order. If the instance has
the middleware method present it will be called. If the method returns
the value **false** then propogation through the stack will stop and the
subsequent handlers will not be called.

This interaction between the middleware instances means you must know
what the middleware does to ensure the flow is conformant to the specification.

# Future Plans

## ROS Bag support

ROS is very important 

## Missing Session commands

The message **transform_point_in_time** and **reconfigure** are not implement. The workflow
for them requires support from the source to change settings.  Currently settings are not
able to be changed. This will required expanding the **Providers** in the current design
to support settings and changes to them.

The providers could even augment the Metadata with a custom UI panel for controlling settings.

## Websocket proxy for format conversion

Connecting to an upstream websocket will be a valuable example and worth providing a
basic implementation.

## Addition of KITTI and Nutonomy Providers

This will provide runtime conversion of these data sources which will make it easier to explore.
