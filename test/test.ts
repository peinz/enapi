import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import {
  createEndpointDefinition,
  createEndpointImplementation,
  Endpoint,
} from "../mod.ts";
import { LocalTestClient } from "../src/Client.ts";

Deno.test("test stuff", async () => {
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

  const endpoints = {
    foo: Endpoint(foo_endpoint_def, foo_endpoint_impl),
  };

  const client = LocalTestClient(endpoints);

  const posted_data = await client.post.foo({ name: "dfg" });

  assertEquals(posted_data.id, 1);
  assertEquals(posted_data.name, "dfg");

  const posted_data_2 = await client.post.foo({ name: "nnn" });
  await client.delete.foo(posted_data_2.id);

  await client.post.foo({ name: "hij" });

  const foo_results_1 = await client.getCollection.foo({ name: "" });
  const foo_results_2 = await client.getCollection.foo({ name: "d" });

  assertEquals(foo_results_1.length, 2);

  assertEquals(foo_results_2.length, 1);
  assertEquals(foo_results_2[0].name, "dfg");

  const last_foo = foo_results_2[foo_results_2.length - 1];

  await client.patch.foo(last_foo.id, { name: "new" });

  const last_foo_again = await client.get.foo(last_foo.id);

  assertEquals(last_foo_again.id, 1);
  assertEquals(last_foo_again.name, "new");
});
