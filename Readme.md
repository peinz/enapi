# Entity API

Entity based API-Platform

The aim of this project is to create a lightweight and easy to use library, that
provides you with typesupport on the backend as well as the frontend.

You start by defining your api-schema in code. That will you provide you with
typesupport for you server implementation, and for you api client. Without code
generation.\
You can also use your schema to generate an
[openapi documentation](https://swagger.io/specification/)

Supported actions are: get, post, patch, delete, getCollection

## Usage

### 1. Define your api-schema

```typescript
const foo_endpoint_def = createEndpointDefinition({
  getResult: {
    id: "number",
    name: "string",
  },
  postBody: {
    name: "string",
  },
});
```

### 2. Implement your RequestHandler

```typescript
let c = 0;
const foos = {} as Record<number, { id: number; name: string }>;

const foo_endpoint_impl = createEndpointImplementation<
  typeof foo_endpoint_def
>({
  get: (id) => foos[id],
  post: (body) => foos[++c] = { ...body, id: c },
});
```

### 3. Choose your favorite webserver (enapi is web-server agnostic)

```typescript
import {
  createOpenApiJsonDoc,
  RequestHandler,
} from "https://deno.land/x/enapi/mod.ts";
import { json, opine } from "https://deno.land/x/opine@2.0.0/mod.ts";
import { opineCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { endpoints } from "./api.ts";

const api_base_url = "http://localhost:3000";

const requestHandler = RequestHandler(endpoints);

const server = opine();
server.use(opineCors());
server.use(json());

// handle entity requests
server.use((req, res, next) => {
  const result = requestHandler.handle({
    method: req.method as any,
    url: req.url.split("?")[0],
    body: req.parsedBody,
    queryParams: req.query,
  });

  if (!result) next();
  else res.setStatus(result.statusCode).json(result.body);
});

// provide openapi documentation
server.get("/_docs.openapi", (_req, res) => {
  const doc = createOpenApiJsonDoc(api_base_url, endpoints);
  res.json(doc);
});

server.listen(
  3000,
  () => console.log(`server has started on ${api_base_url} 🚀`),
);
```

### 4. Call your api on the frontend

```typescript
import { endpoints } from "./api.ts";
import { Client } from "https://deno.land/x/enapi/mod.ts";

const client = Client("http://localhost:3000", endpoints);

const data_post_result = await client.post.foo({ name: "dfg" });
const data_get_result = await client.get.foo(data_post_result.id);

console.log(data_get_result);
```

## Future Plans

- add more entity property types
- support entity-relations
- include errors in return types
- support transactions
