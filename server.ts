#!/usr/bin/env -S deno run --allow-read --allow-net --watch

import {
  json,
  NextFunction,
  opine,
  OpineRequest,
  OpineResponse,
} from "https://deno.land/x/opine@2.0.0/mod.ts";
import { opineCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { endpoints } from "./api.ts";
import { createOpenApiJsonDoc } from "./open-api-docs.ts";
import { Endpoint } from "./api-lib.ts";

const app = opine();
app.use(opineCors());
app.use(json());

app.use((
  req: OpineRequest<any, any, any>,
  res: OpineResponse<any>,
  next: NextFunction,
) => {
  const base_url = req.url.split("?")[0];
  const routes = Object.keys(endpoints);

  const entity_route_match = (() => {
    const isDig = "[0|1|2|3|4|5|6|7|8|9]"; // \d did not work; deno bug???
    const regep = new RegExp(`^/([^/]+)/(${isDig}+)$`);
    const m = regep.exec(base_url);
    if (!m) return undefined;
    const route = m[1];
    if (!routes.includes(route)) return undefined;
    return {
      route: route as keyof (typeof endpoints),
      id: parseInt(m[2]),
    };
  })();

  const collection_route_match = (() => {
    const regep = new RegExp(`^/([^/]+)/?$`);
    const m = regep.exec(base_url);
    if (!m) return undefined;
    const route = m[1];
    if (!routes.includes(route)) return undefined;
    return route as keyof (typeof endpoints);
  })();

  if (req.method === "GET" && entity_route_match) {
    const ep = endpoints[entity_route_match.route];
    const result = ep.implementation.get(entity_route_match.id);
    return result
      ? res.json(result)
      : res.setStatus(404).json({ err: "not found" });
  }

  if (req.method === "POST" && collection_route_match) {
    const ep = endpoints[collection_route_match] as Endpoint<any, any>;
    if (!ep.implementation.post) return next();
    const body = req.parsedBody;
    if (!body) return res.setStatus(400).json({ err: "body missing" });
    const result = ep.implementation.post(body);
    return res.setStatus(201).json(result);
  }

  if (req.method === "PATCH" && entity_route_match) {
    const ep = endpoints[entity_route_match.route] as Endpoint<any, any>;
    if (!ep.implementation.patch) return next();
    const body = req.parsedBody;
    if (!body) return res.setStatus(400).json({ err: "body missing" });
    const result = ep.implementation.patch(entity_route_match.id, body);
    return result
      ? res.json(result)
      : res.setStatus(404).json({ err: "not found" });
  }

  if (req.method === "DELETE" && entity_route_match) {
    const ep = endpoints[entity_route_match.route] as Endpoint<any, any>;
    if (!ep.implementation.delete) return next();
    ep.implementation.delete(entity_route_match.id);
    return res.setStatus(204).end();
  }

  if (req.method === "GET" && collection_route_match) {
    const ep = endpoints[collection_route_match];
    if (!ep.implementation.getCollection) return next();
    const queryParams = req.query;
    const result = ep.implementation.getCollection(queryParams);
    return res.json(result);
  }

  next();
});

app.get("/_docs.openapi", (_req, res) => {
  const doc = createOpenApiJsonDoc(endpoints);
  res.json(doc);
});

app.listen(
  3000,
  () => console.log("server has started on http://localhost:3000 🚀"),
);
