// filter out undefined keys
type GetDefinedKeys<Tobj extends Record<string, any>> = {
  [key in keyof Tobj]: Tobj[key] extends undefined ? never : key;
}[keyof Tobj];

type FilterOutNeverProperties<Tobj extends Record<string, any>> = {
  [key in GetDefinedKeys<Tobj>]: Tobj[key];
};

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

type SupportedApiType = "string" | "number";
type SupportedTypeToInternType<Ttype extends SupportedApiType> = Ttype extends
  "string" ? string
  : Ttype extends "number" ? number
  : never;

type MapSupportedTypeToInternType<
  TtypeDict extends { [key: string]: SupportedApiType },
> = ExpandRecursively<
  {
    [key in keyof TtypeDict]: SupportedTypeToInternType<TtypeDict[key]>;
  }
>;

export type RestEndpointDefinition<
  TgetResult extends Record<string, SupportedApiType>,
  TpostBody extends Record<string, SupportedApiType> | undefined,
  TpatchBody extends Record<string, SupportedApiType> | undefined,
  TgetCollectionQueryParams extends
    | Record<string, SupportedApiType>
    | undefined,
  Tactions extends {
    getResult: TgetResult;
    postBody?: TpostBody;
    patchBody?: TpatchBody;
    remove?: boolean;
    collectionQueryParams?: TgetCollectionQueryParams;
  },
> = { [key in GetDefinedKeys<Tactions>]: Tactions[key] };

export const EndpDef = <
  TgetResult extends Record<string, SupportedApiType>,
  TpostBody extends Record<string, SupportedApiType> | undefined,
  TpatchBody extends Record<string, SupportedApiType> | undefined,
  TgetCollectionQueryParams extends
    | Record<string, SupportedApiType>
    | undefined,
  Tactions extends {
    getResult: TgetResult;
    postBody?: TpostBody;
    patchBody?: TpatchBody;
    remove?: boolean;
    collectionQueryParams?: TgetCollectionQueryParams;
  },
>(
  epc: Tactions,
): RestEndpointDefinition<
  TgetResult,
  TpostBody,
  TpatchBody,
  TgetCollectionQueryParams,
  Tactions
> => {
  return epc;
};

export type RestEndpointImplementation<
  Tdefinition extends RestEndpointDefinition<any, any, any, any, any>,
> = FilterOutNeverProperties<{
  get: (id: number) => MapSupportedTypeToInternType<Tdefinition["getResult"]>;
  post: "postBody" extends (keyof Tdefinition) ? (
      body: MapSupportedTypeToInternType<Tdefinition["postBody"]>,
    ) => MapSupportedTypeToInternType<Tdefinition["getResult"]>
    : never;
  patch: "patchBody" extends (keyof Tdefinition) ? (
      id: number,
      body: MapSupportedTypeToInternType<Tdefinition["patchBody"]>,
    ) => MapSupportedTypeToInternType<Tdefinition["getResult"]>
    : never;
  delete: "remove" extends (keyof Tdefinition) ? (id: number) => void
    : never;
  getCollection: "collectionQueryParams" extends (keyof Tdefinition) ? (
      queryParams: MapSupportedTypeToInternType<
        Tdefinition["collectionQueryParams"]
      >,
    ) => MapSupportedTypeToInternType<Tdefinition["getResult"]>[]
    : never;
}>;

export const buildEndpoint = <
  Tdef extends RestEndpointDefinition<any, any, any, any, any>,
>(definition: Tdef) =>
  <
    Timp extends RestEndpointImplementation<Tdef>,
  >(implementation: Timp) => ({ definition, implementation });

export type Endpoint<
  Tdef extends RestEndpointDefinition<any, any, any, any, any>,
  Timp extends RestEndpointImplementation<Tdef>,
> = {
  definition: Tdef;
  implementation: Timp;
};

export type Endpoints = { [key: string]: Endpoint<any, any> };

type FilterEndpointKeys<
  Tendpoints extends { [key: string]: Endpoint<any, any> },
  Tby extends "postBody" | "patchBody" | "remove" | "collectionQueryParams",
> = {
  [key in keyof Tendpoints]: Tendpoints[key]["definition"][Tby] extends {} ? key
    : never;
}[keyof Tendpoints];

type APIClient<Tendpoints extends { [key: string]: Endpoint<any, any> }> =
  FilterOutNeverProperties<{
    get: {
      [route in keyof Tendpoints]: (
        id: number,
      ) => Promise<
        MapSupportedTypeToInternType<
          Tendpoints[route]["definition"]["getResult"]
        >
      >;
    };
    post: FilterEndpointKeys<Tendpoints, "postBody"> extends never ? never : {
      [route in FilterEndpointKeys<Tendpoints, "postBody">]: (
        body: MapSupportedTypeToInternType<
          Tendpoints[route]["definition"]["postBody"]
        >,
      ) => Promise<
        MapSupportedTypeToInternType<
          Tendpoints[route]["definition"]["getResult"]
        >
      >;
    };
    patch: FilterEndpointKeys<Tendpoints, "patchBody"> extends never ? never : {
      [route in FilterEndpointKeys<Tendpoints, "patchBody">]: (
        id: number,
        body: MapSupportedTypeToInternType<
          Tendpoints[route]["definition"]["patchBody"]
        >,
      ) => Promise<
        MapSupportedTypeToInternType<
          Tendpoints[route]["definition"]["getResult"]
        >
      >;
    };
    delete: FilterEndpointKeys<Tendpoints, "remove"> extends never ? never : {
      [route in FilterEndpointKeys<Tendpoints, "remove">]: (
        id: number,
      ) => Promise<void>;
    };
    getCollection:
      FilterEndpointKeys<Tendpoints, "collectionQueryParams"> extends never
        ? never
        : {
          [route in FilterEndpointKeys<Tendpoints, "collectionQueryParams">]: (
            params: MapSupportedTypeToInternType<
              Tendpoints[route]["definition"]["collectionQueryParams"]
            >,
          ) => Promise<
            MapSupportedTypeToInternType<
              Tendpoints[route]["definition"]["getResult"]
            >[]
          >;
        };
  }>;

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
      queryParams: Record<string, string>;
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
        const result = ep.implementation.getCollection(queryParams);
        return makeResult(200, result);
      }
    },
  };
};

export const ApiClient = <Tendpoints extends Endpoints>(
  endpoints: Tendpoints,
): APIClient<Tendpoints> => {
  const base = "http://localhost:3000";
  const client = {} as APIClient<any>;

  const routes = Object.keys(endpoints);

  client.get = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      fetch([base, route, id].join("/"), {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
      })
        .then((res) => {
          if (res.status !== 200) {
            throw { status: res.status, statusText: res.statusText };
          }
          return res.json();
        })
        .catch((err) => ({ err })),
  }), {} as any);

  client.post = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (body: Record<string, any>) =>
      fetch([base, route].join("/"), {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        referrerPolicy: "no-referrer",
        body: JSON.stringify(body),
      })
        .then((res) => {
          if (res.status !== 201) {
            throw { status: res.status, statusText: res.statusText };
          }
          return res.json();
        })
        .catch((err) => ({ err })),
  }), {} as any);

  client.patch = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number, body: Record<string, any>) =>
      fetch([base, route, id].join("/"), {
        method: "PATCH",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        referrerPolicy: "no-referrer",
        body: JSON.stringify(body),
      })
        .then((res) => {
          if (res.status !== 200) {
            throw { status: res.status, statusText: res.statusText };
          }
          return res.json();
        })
        .catch((err) => ({ err })),
  }), {} as any);

  client.delete = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      fetch([base, route, id].join("/"), {
        method: "DELETE",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        referrerPolicy: "no-referrer",
      })
        .then((res) => {
          if (res.status !== 204) {
            throw { status: res.status, statusText: res.statusText };
          }
        })
        .catch((err) => ({ err })),
  }), {} as any);

  const getUrl = (baseUrl: string, params: Record<string, string>) => {
    const url = new URL(baseUrl);
    url.search = new URLSearchParams(params).toString();
    return url;
  };

  client.getCollection = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (queryParams: Record<string, string>) =>
      fetch(getUrl([base, route].join("/"), queryParams), {
        method: "GET",
        mode: "cors",
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
      })
        .then((res) => {
          if (res.status !== 200) {
            throw { status: res.status, statusText: res.statusText };
          }
          return res.json();
        })
        .catch((err) => ({ err })),
  }), {} as any);

  return client;
};
