import { Endpoints } from "./core.ts";
import { ErrorEntityNotFound } from "./error.ts";

export const RequestHandler = <Tendpoints extends Endpoints>(
  endpoints: Tendpoints,
) => {
  const routes = Object.keys(endpoints);
  const makeResult = (statusCode: number, body: Record<string, any>) => ({
    statusCode,
    body,
  });

  const makeError = (error: { err: string; code: number }) => ({
    statusCode: error.code,
    body: { err: error.err },
  });

  return {
    handle: async (request: {
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
        let result = ep.implementation.get(entity_route_match.id);
        if (result instanceof Promise) result = await result;
        return result
          ? makeResult(200, result)
          : makeError(ErrorEntityNotFound);
      }

      if (method === "POST" && collection_route_match) {
        const ep = endpoints[collection_route_match];
        if (!ep.implementation.post) return undefined;
        if (!body) return makeResult(400, { err: "body missing" });
        let result = ep.implementation.post(body);
        if (result instanceof Promise) result = await result;
        return makeResult(201, result);
      }

      if (method === "PATCH" && entity_route_match) {
        const ep = endpoints[entity_route_match.route];
        if (!ep.implementation.patch) return undefined;
        if (!body) return makeResult(400, { err: "body missing" });
        let result = ep.implementation.patch(entity_route_match.id, body);
        if (result instanceof Promise) result = await result;
        return result
          ? makeResult(200, result)
          : makeError(ErrorEntityNotFound);
      }

      if (method === "DELETE" && entity_route_match) {
        const ep = endpoints[entity_route_match.route];
        if (!ep.implementation.delete) return undefined;
        const result = ep.implementation.delete(entity_route_match.id);
        if (result instanceof Promise) await result;
        return result !== undefined
          ? makeResult(204, { status: "success" })
          : makeError(ErrorEntityNotFound);
      }

      if (method === "GET" && collection_route_match) {
        const ep = endpoints[collection_route_match];
        if (!ep.implementation.getCollection) return undefined;
        let result = ep.implementation.getCollection(queryParams ?? {});
        if (result instanceof Promise) result = await result;
        return makeResult(200, result);
      }
    },
  };
};
