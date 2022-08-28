import {
  createEndpointDefinition,
  createEndpointImplementation,
  Endpoint,
} from "https://deno.land/x/enapi/mod.ts";

const foo_endpoint_def = createEndpointDefinition({
  getResult: {
    id: "number",
    name: "string",
  },
  postBody: {
    name: "string",
  },
  patchBody: {
    name: "string",
  },
  collectionQueryParams: {
    name: "string",
  },
  remove: true,
});

const bar_endpoint_def = createEndpointDefinition({
  getResult: {
    name: "string",
  },
  collectionQueryParams: {},
});

let c = 0;
const foos = {} as Record<number, { id: number; name: string }>;

const foo_endpoint_impl = createEndpointImplementation<
  typeof foo_endpoint_def
>({
  get: (id) => foos[id],
  post: (body) => foos[++c] = { ...body, id: c },
  patch: (id, body) => foos[id] = { ...foos[id], ...body },
  delete: (id) => delete foos[id],
  getCollection: (queryParams) => {
    return Object.values(foos).filter((it) =>
      it.name.startsWith(queryParams.name)
    );
  },
});

const bars = {} as Record<number, { id: number; name: string }>;

const bar_endpoint_impl = createEndpointImplementation<
  typeof bar_endpoint_def
>({
  get: (id) => bars[id],
  getCollection: (_queryParams) => Object.values(bars),
});

export const endpoints = {
  foo: Endpoint(foo_endpoint_def, foo_endpoint_impl),
  bar: Endpoint(bar_endpoint_def, bar_endpoint_impl),
};
