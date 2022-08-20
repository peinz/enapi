import { Endpoints } from "./core.ts";

export const RequestHandler = <Tendpoints extends Endpoints>(
  endpoints: Tendpoints,
) => {
  const routes = Object.keys(endpoints);
  const makeResult = (statusCode: number, body: Record<string, any>) => ({
    statusCode,
    body,
  });

  return {
    handle: (request: {
      method: "GET" | "POST" | "PATCH" | "DELETE";
      url: string;
      body?: Record<string, any>;
      queryParams?: Record<string, string>;
    }) => {
      const { method, url, body, queryParams } = request;
      const entity_route_match = (() => {
        const isDig = "[0|1|2|3|4|5|6|7|8|9]"; // \d did not work; deno bug???
        const regep = new RegExp(`^/([^/]+)/(${isDig}+)$`);
        const m = regep.exec(url);
        if (!m) return undefined;
        const route = m[1];
        if (!routes.includes(route)) return undefined;
        return {
          route: route as keyof Tendpoints,
          id: parseInt(m[2]),
        };
      })();

      const collection_route_match = (() => {
        const regep = new RegExp(`^/([^/]+)/?$`);
        const m = regep.exec(url);
        if (!m) return undefined;
        const route = m[1];
        if (!routes.includes(route)) return undefined;
        return route as keyof Tendpoints;
      })();

      if (method === "GET" && entity_route_match) {
        const ep = endpoints[entity_route_match.route];
        const result = ep.implementation.get(entity_route_match.id);
        return result
          ? makeResult(200, result)
          : makeResult(404, { err: "not found" });
      }

      if (method === "POST" && collection_route_match) {
        const ep = endpoints[collection_route_match];
        if (!ep.implementation.post) return undefined;
        if (!body) return makeResult(400, { err: "body missing" });
        const result = ep.implementation.post(body);
        return makeResult(201, result);
      }

      if (method === "PATCH" && entity_route_match) {
        const ep = endpoints[entity_route_match.route];
        if (!ep.implementation.patch) return undefined;
        if (!body) return makeResult(400, { err: "body missing" });
        const result = ep.implementation.patch(entity_route_match.id, body);
        return result
          ? makeResult(200, result)
          : makeResult(404, { err: "not found" });
      }

      if (method === "DELETE" && entity_route_match) {
        const ep = endpoints[entity_route_match.route];
        if (!ep.implementation.delete) return undefined;
        ep.implementation.delete(entity_route_match.id);
        return makeResult(204, { status: "success" });
      }

      if (method === "GET" && collection_route_match) {
        const ep = endpoints[collection_route_match];
        if (!ep.implementation.getCollection) return undefined;
        const result = ep.implementation.getCollection(queryParams ?? {});
        return makeResult(200, result);
      }
    },
  };
};
