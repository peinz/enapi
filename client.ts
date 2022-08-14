#!/usr/bin/env -S deno run --allow-read --allow-net

import { endpoints } from "./api.ts";
import { ApiClient } from "./api-lib.ts";


const client = ApiClient(endpoints)

// client.post.detail({name: 'abc'}) // FIXME: should not work details/post does not exist
const posted_data = await client.post.paarung({id: 0, name: 'dfg'}) // TODO: number should not be there
console.log('posted_data', posted_data)

const details = await client.getCollection.detail({season: 99});

console.log('details', details)

const last_detail = details[details.length-1]
const last_detail_again = await client.get.detail(last_detail.id);

console.log(last_detail_again);
