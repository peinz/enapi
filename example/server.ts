#!/usr/bin/env -S deno run --allow-read --allow-net --watch

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

server.use(async (req, res, next) => {
  const result = await requestHandler.handle({
    method: req.method as any,
    url: req.url.split("?")[0],
    body: req.parsedBody,
    queryParams: req.query,
  });

  if (!result) next();
  else res.setStatus(result.statusCode).json(result.body);
});

server.get("/_docs.openapi", (_req, res) => {
  const doc = createOpenApiJsonDoc(api_base_url, endpoints);
  res.json(doc);
});

server.listen(
  3000,
  () => console.log(`server has started on ${api_base_url} 🚀`),
);
