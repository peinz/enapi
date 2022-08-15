// filter out undefined keys
type GetDefinedKeys<Tobj extends Record<string, any>> = {
  [key in keyof Tobj]: Tobj[key] extends undefined ? never : key;
}[keyof Tobj];

type FilterOutNeverProperties<Tobj extends Record<string, any>> = {
  [key in GetDefinedKeys<Tobj>]: Tobj[key];
};

type SupportedApiType = "string" | "number";
type SupportedTypeToInternType<Ttype extends SupportedApiType> = Ttype extends
  "string" ? string
  : Ttype extends "number" ? number
  : never;

type MapSupportedTypeToInternType<
  TtypeDict extends { [key: string]: SupportedApiType },
> = {
  [key in keyof TtypeDict]: SupportedTypeToInternType<TtypeDict[key]>;
};

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

type APIClient<Tendpoints extends { [key: string]: Endpoint<any, any> }> = {
  get: {
    [route in keyof Tendpoints]: (
      id: number,
    ) => Promise<
      MapSupportedTypeToInternType<Tendpoints[route]["definition"]["getResult"]>
    >;
  };
  post: {
    [route in keyof Tendpoints]: (
      body: MapSupportedTypeToInternType<
        Tendpoints[route]["definition"]["postBody"]
      >,
    ) => Promise<
      MapSupportedTypeToInternType<Tendpoints[route]["definition"]["getResult"]>
    >;
  };
  patch: {
    [route in keyof Tendpoints]: (
      id: number,
      body: MapSupportedTypeToInternType<
        Tendpoints[route]["definition"]["patchBody"]
      >,
    ) => Promise<
      MapSupportedTypeToInternType<Tendpoints[route]["definition"]["getResult"]>
    >;
  };
  delete: {
    [route in keyof Tendpoints]: (id: number) => Promise<void>;
  };
  getCollection: {
    [route in keyof Tendpoints]: (
      params: MapSupportedTypeToInternType<
        Tendpoints[route]["definition"]["collectionQueryParams"]
      >,
    ) => Promise<
      MapSupportedTypeToInternType<
        Tendpoints[route]["definition"]["getResult"]
      >[]
    >;
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
