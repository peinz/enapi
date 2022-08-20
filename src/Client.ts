import { Endpoint, Endpoints, MapSupportedTypeToInternType } from "./core.ts";
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

export const Client = <Tendpoints extends Endpoints>(
  endpoints: Tendpoints,
): Client<Tendpoints> => {
  const base = "http://localhost:3000";
  const client = {} as Client<any>;

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

const of = (value: any) => new Promise((res) => res(value));

export const LocalTestClient = <Tendpoints extends Endpoints>(
  endpoints: Tendpoints,
): Client<Tendpoints> => {
  const client = {} as Client<any>;

  const routes = Object.keys(endpoints);

  const requestHandler = RequestHandler(endpoints);

  client.get = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      of(
        requestHandler.handle({
          method: "GET",
          url: "/" + route + "/" + id,
        })?.body,
      ),
  }), {} as any);

  client.post = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (body: Record<string, any>) =>
      of(
        requestHandler.handle({
          method: "POST",
          url: "/" + route,
          body,
        })?.body,
      ),
  }), {} as any);

  client.patch = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number, body: Record<string, any>) =>
      of(
        requestHandler.handle({
          method: "PATCH",
          url: "/" + route + "/" + id,
          body,
        })?.body,
      ),
  }), {} as any);

  client.delete = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (id: number) =>
      of(
        requestHandler.handle({
          method: "DELETE",
          url: "/" + route + "/" + id,
        })?.body,
      ),
  }), {} as any);

  client.getCollection = routes.reduce((obj, route) => ({
    ...obj,
    [route]: (queryParams: Record<string, string>) =>
      of(
        requestHandler.handle({
          method: "GET",
          url: "/" + route,
          queryParams,
        })?.body,
      ),
  }), {} as any);

  return client;
};
