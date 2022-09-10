import { Endpoint, Endpoints, MapSupportedTypeToInternType } from "./core.ts";
import { ErrorEntityNotFound } from "./error.ts";
import { RequestHandler } from "./RequestHandler.ts";
import { FilterOutNeverProperties } from "./util.ts";

type FilterEndpointKeys<
  Tendpoints extends { [key: string]: Endpoint<any, any> },
  Tby extends "postBody" | "patchBody" | "remove" | "collectionQueryParams",
> = {
  [key in keyof Tendpoints]: Tendpoints[key]["definition"][Tby] extends {} ? key
    : never;
}[keyof Tendpoints];

type Client<Tendpoints extends { [key: string]: Endpoint<any, any> }> =
  FilterOutNeverProperties<{
    get: {
      [route in keyof Tendpoints]: (
        id: number,
      ) => Promise<
        MapSupportedTypeToInternType<
          Tendpoints[route]["definition"]["getResult"]
        > | typeof ErrorEntityNotFound
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
        > | typeof ErrorEntityNotFound
      >;
    };
    delete: FilterEndpointKeys<Tendpoints, "remove"> extends never ? never : {
      [route in FilterEndpointKeys<Tendpoints, "remove">]: (
        id: number,
      ) => Promise<void | typeof ErrorEntityNotFound>;
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

const formatResponse = (response: Response) => ({
  statusCode: response.status,
  body: response.json(),
});

const handleResponse = (expectedStatusCode: number) =>
  (resp: { statusCode: number; body: Record<string, any> }) => {
    if (resp.statusCode === expectedStatusCode) {
      return resp.body;
    }
    if (resp.body.hasOwnProperty("err")) {
      return { err: resp.body.err, code: resp.statusCode };
    }
    throw new Error("problem with: " + JSON.stringify(resp));
  };

export const Client = <Tendpoints extends Endpoints>(
  api_base_url: string,
  endpoints: Tendpoints,
): Client<Tendpoints> => {
  const client = {} as Client<any>;
  const routes = Object.keys(endpoints);

  client.get = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      fetch([api_base_url, route, id].join("/"), {
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
        .then(formatResponse)
        .then(handleResponse(200))
        .catch((err) => ({ err })),
  }), {} as any);

  client.post = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (body: Record<string, any>) =>
      fetch([api_base_url, route].join("/"), {
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
        .then(formatResponse)
        .then(handleResponse(201))
        .catch((err) => ({ err })),
  }), {} as any);

  client.patch = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number, body: Record<string, any>) =>
      fetch([api_base_url, route, id].join("/"), {
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
        .then(formatResponse)
        .then(handleResponse(200))
        .catch((err) => ({ err })),
  }), {} as any);

  client.delete = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      fetch([api_base_url, route, id].join("/"), {
        method: "DELETE",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        referrerPolicy: "no-referrer",
      })
        .then(formatResponse)
        .then(handleResponse(204))
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
      fetch(getUrl([api_base_url, route].join("/"), queryParams), {
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
        .then(formatResponse)
        .then(handleResponse(200))
        .catch((err) => ({ err })),
  }), {} as any);

  return client;
};

const fallbackTo = <
  Tfallback,
  Tresult extends Texpected | undefined,
  Texpected extends { statusCode: number; body: Record<string, any> },
>(fallback: Tfallback) =>
  (result: Tresult) =>
    (result !== undefined ? result : fallback) as Texpected | Tfallback;

const ENTITY_NOT_FOUND_RESPONSE = {
  body: { err: "entity not found" },
  statusCode: 404,
};

export const LocalTestClient = <Tendpoints extends Endpoints>(
  endpoints: Tendpoints,
): Client<Tendpoints> => {
  const client = {} as Client<any>;

  const routes = Object.keys(endpoints);

  const requestHandler = RequestHandler(endpoints);

  client.get = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      requestHandler.handle({
        method: "GET",
        url: "/" + route + "/" + id,
      })
        .then(fallbackTo(ENTITY_NOT_FOUND_RESPONSE))
        .then(handleResponse(200)),
  }), {} as any);

  client.post = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (body: Record<string, any>) =>
      requestHandler.handle({
        method: "POST",
        url: "/" + route,
        body,
      })
        .then(fallbackTo(ENTITY_NOT_FOUND_RESPONSE))
        .then(handleResponse(201)),
  }), {} as any);

  client.patch = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number, body: Record<string, any>) =>
      requestHandler.handle({
        method: "PATCH",
        url: "/" + route + "/" + id,
        body,
      })
        .then(fallbackTo(ENTITY_NOT_FOUND_RESPONSE))
        .then(handleResponse(200)),
  }), {} as any);

  client.delete = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      requestHandler.handle({
        method: "DELETE",
        url: "/" + route + "/" + id,
      })
        .then(fallbackTo(ENTITY_NOT_FOUND_RESPONSE))
        .then(handleResponse(200)),
  }), {} as any);

  client.getCollection = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (queryParams: Record<string, string>) =>
      requestHandler.handle({
        method: "GET",
        url: "/" + route,
        queryParams,
      })
        .then((resp) => {
          if (resp === undefined) throw new Error("should not be undefined");
          return resp;
        })
        .then(handleResponse(200)),
  }), {} as any);

  return client;
};
