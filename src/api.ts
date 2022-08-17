import {
  RestEndpointDefinition,
  RestEndpointImplementation,
  SupportedApiType,
} from "./core.ts";

export const createEndpointDefinition = <
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
> => epc;

export const createEndpointImplementation = <
  Tdefinition extends RestEndpointDefinition<any, any, any, any, any>,
>(implementation: RestEndpointImplementation<Tdefinition>) => implementation;

export const Endpoint = <
  Tdef extends RestEndpointDefinition<any, any, any, any, any>,
  Timp extends RestEndpointImplementation<Tdef>,
>(definition: Tdef, implementation: Timp) => ({ definition, implementation });
