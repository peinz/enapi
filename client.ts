#!/usr/bin/env -S deno run --allow-read --allow-net

import { endpoints } from "./api.ts";
import { ApiClient } from "./api-lib.ts";


const client = ApiClient(endpoints)
const res = await client.entity.paarung.get(7)

console.log(res);
