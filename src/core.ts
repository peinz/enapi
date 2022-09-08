import {
  ExpandRecursively,
  FilterOutNeverProperties,
  GetDefinedKeys,
  MaybePromise,
} from "./util.ts";

export type SupportedApiType = "string" | "number";
export type SupportedTypeToInternType<Ttype extends SupportedApiType> =
  Ttype extends "string" ? string
    : Ttype extends "number" ? number
    : never;

export type MapSupportedTypeToInternType<
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

export type RestEndpointImplementation<
  Tdefinition extends RestEndpointDefinition<any, any, any, any, any>,
> = FilterOutNeverProperties<{
  get: (
    id: number,
  ) => MaybePromise<MapSupportedTypeToInternType<Tdefinition["getResult"]>>;
  post: "postBody" extends (keyof Tdefinition) ? (
      body: MapSupportedTypeToInternType<Tdefinition["postBody"]>,
    ) => MaybePromise<MapSupportedTypeToInternType<Tdefinition["getResult"]>>
    : never;
  patch: "patchBody" extends (keyof Tdefinition) ? (
      id: number,
      body: MapSupportedTypeToInternType<Tdefinition["patchBody"]>,
    ) => MaybePromise<MapSupportedTypeToInternType<Tdefinition["getResult"]>>
    : never;
  delete: "remove" extends (keyof Tdefinition)
    ? (id: number) => MaybePromise<void>
    : never;
  getCollection: "collectionQueryParams" extends (keyof Tdefinition) ? (
      queryParams: MapSupportedTypeToInternType<
        Tdefinition["collectionQueryParams"]
      >,
    ) => MaybePromise<MapSupportedTypeToInternType<Tdefinition["getResult"]>[]>
    : never;
}>;

export type Endpoint<
  Tdef extends RestEndpointDefinition<any, any, any, any, any>,
  Timp extends RestEndpointImplementation<Tdef>,
> = {
  definition: Tdef;
  implementation: Timp;
};

export type Endpoints = { [key: string]: Endpoint<any, any> };
