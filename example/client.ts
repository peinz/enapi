#!/usr/bin/env -S deno run --allow-read --allow-net

import { endpoints } from "./api.ts";
import { Client } from "https://deno.land/x/enapi/mod.ts";

const client = Client("http://localhost:3000", endpoints);

const posted_data = await client.post.foo({ name: "dfg" });
console.log("posted_data", posted_data);

const posted_data_2 = await client.post.foo({ name: "nnn" });
await client.delete.foo(posted_data_2.id);

const foos = await client.getCollection.foo({ name: "d" });

console.log("foos", foos);

const last_foo = foos[foos.length - 1];

await client.patch.foo(last_foo.id, { name: "new" });

const last_foo_again = await client.get.foo(last_foo.id);

if (isError(last_foo_again)) {
  throw new Error("something went wrong");
}

console.log(last_foo_again);
