
// filter out undefined keys
type GetDefinedKeys<Tobj extends Record<string, any>> = {
  [key in keyof Tobj]: Tobj[key] extends undefined ? never : key
}[keyof Tobj]

type SupportedApiType = 'string'|'number'
type SupportedTypeToInternType<Ttype extends SupportedApiType> = Ttype extends 'string' 
  ? string
  : Ttype extends 'number'
    ? number
    : never;

type MapSupportedTypeToInternType<TtypeDict extends {[key: string]: SupportedApiType}> = {
  [key in keyof TtypeDict]: SupportedTypeToInternType<TtypeDict[key]>
}

export type RestEndpointDefinition<
  TgetResult extends Record<string, SupportedApiType>|undefined,
  TpostBody extends Record<string, SupportedApiType>|undefined,
  TgetCollectionQueryParams extends Record<string, SupportedApiType>|undefined,
  Tactions extends Partial<{
    get: { result: TgetResult },
    post: { body: TpostBody },
    getCollection: { queryParams: TgetCollectionQueryParams },
  }>,
> = { [key in GetDefinedKeys<Tactions>]: Tactions[key] }

export const EndpDef = <
  TgetResult extends Record<string, SupportedApiType>|undefined,
  TpostBody extends Record<string, SupportedApiType>|undefined,
  TgetCollectionQueryParams extends Record<string, SupportedApiType>|undefined,
  Tactions extends Partial<{
    get: { result: TgetResult },
    post: { body: TpostBody },
    getCollection: { queryParams: TgetCollectionQueryParams },
  }>,
>(epc: Tactions): RestEndpointDefinition<TgetResult, TpostBody, TgetCollectionQueryParams, Tactions> => {
  return epc;
}

export type RestEndpointImplementation<
  Tdefinition extends RestEndpointDefinition<any, any, any, any>,
> = {
  [key in keyof Tdefinition]: key extends 'get'
    ? (id: number) => MapSupportedTypeToInternType<Tdefinition[key]['result']>
    : key extends 'post'
      ? (id: number, body: MapSupportedTypeToInternType<Tdefinition[key]['body']>) => void 
      : key extends 'getCollection'
        ? (queryParams: MapSupportedTypeToInternType<Tdefinition[key]['queryParams']>) => MapSupportedTypeToInternType<Tdefinition['get']['result']>[] 
        : never
};

export const buildEndpoint = <
  Tdef extends RestEndpointDefinition<any, any, any, any>,
>(definition: Tdef) => <
  Timp extends RestEndpointImplementation<Tdef>
>(implementation: Timp) => ({definition, implementation})


type Endpoint<
  Tdef extends RestEndpointDefinition<any, any, any, any>,
  Timp extends RestEndpointImplementation<Tdef>
> = {
  definition: Tdef,
  implementation: Timp,
}


export type Endpoints = { [key: string]: Endpoint<any, any> };

type APIClient<Tendpoints extends { [key: string]: Endpoint<any, any> }> = {
	get: {},
	post: {},
	entity: {
    [route in keyof Tendpoints]: {
      [action in keyof RestEndpointImplementation<Tendpoints[route]['definition']>]: 
      (...args:
        Parameters<
          RestEndpointImplementation<Tendpoints[route]['definition']>[action]
        >
      ) => Promise<
        ReturnType<
          RestEndpointImplementation<Tendpoints[route]['definition']>[action]
        >
      >
    }
  } 
}

export const ApiClient = <Tendpoints extends Endpoints>(endpoints: Tendpoints): APIClient<Tendpoints> => {
  return {
    entity: Object.entries(endpoints).reduce( (entityObj, [route, ep]) => {

      Object.entries(ep.definition).forEach( ([action, method]) => {

        entityObj[route] = entityObj[route]||{};

        const base = 'http://localhost:3000'

        if(action === 'get'){
          entityObj[route][action] = (id: number) => fetch([base, route, id].join('/'), {
            method: 'GET',
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'include', // include, *same-origin, omit
            headers: {
              'Content-Type': 'application/json'
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            // body: JSON.stringify(data) // body data type must match "Content-Type" header
          })
          .then( res => {
            if(res.status !== 200) throw { status: res.status, statusText: res.statusText};
            return res.json();
          })
          .catch( err => ({err}))
        }


        // TODO: implement post, getCollection, ...

      })

      return entityObj;
    }, {} as Record<string, any>),
  } as any
}
