#!/usr/bin/env -S deno run --allow-read --allow-net --watch

import { opine } from "https://deno.land/x/opine@2.0.0/mod.ts";
import { opineCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { endpoints } from "./api.ts";
import { createOpenApiJsonDoc } from "./open-api-docs.ts";
import { Endpoint } from "./api-lib.ts";


const app = opine();
app.use(opineCors());

Object.entries(endpoints).forEach( ([route, ep]: [string, Endpoint<any, any>]) => {

  if(ep.implementation.getCollection)
    app.get(`/${route}`, (req, res) => {
      const queryParams = req.query;
      const result = ep.implementation.getCollection(queryParams)
      res.json(result);
    });

  if(ep.implementation.get)
    app.get(`/${route}/:id`, (req, res) => {
      const id = parseInt(req.params.id);
      const result = ep.implementation.get(id);
      res.json(result);
    });

  if(ep.implementation.post)
    app.post(`/${route}/:id`, (req, res) => {
      const id = parseInt(req.params.id);
      const body = req.body;
      ep.implementation.post(id, body);
      const result = ep.implementation.get(id);
      res.json(result);
    });

})

app.get("/_docs.openapi", (_req, res) => {
  const doc = createOpenApiJsonDoc(endpoints);
  res.json(doc)
})

app.listen(
  3000,
  () => console.log("server has started on http://localhost:3000 🚀"),
);
