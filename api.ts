import { buildEndpoint, EndpDef, RestEndpointImplementation } from "./api-lib.ts";

const paarung_endpnt_def = EndpDef({
  getResult: {
    id: 'number',
    name: 'string',
  },
  postBody: {
    name: 'string',
  },
  patchBody: {
    name: 'string',
  },
  collectionQueryParams: {
    season: 'number',
  },
  remove: true,
})

const details_endpnt_def = EndpDef({
  getResult: {
    name: 'string',
  },
  collectionQueryParams: {
    season: 'number',
  },
})

let pc = 0
const paarungen = {} as Record<number, {id: number, name: string}>

const paarung_endpnt_impl: RestEndpointImplementation<typeof paarung_endpnt_def> = {
  get: (id) => paarungen[id],
  post: (body) => paarungen[++pc] = {...body, id: pc},
  patch: (id, body) => paarungen[id] = {...paarungen[id], ...body},
  delete: (id) => delete paarungen[id],
  getCollection: (queryParams) => Object.values(paarungen),
}

const details_endpnt_impl: RestEndpointImplementation<typeof details_endpnt_def> = {
  get: (id) => ({id: id, name: 'avc'+id }),
  getCollection: (queryParams) => ([{id: 7, name: 'avc'+queryParams.season }]),
}

const ep = buildEndpoint(paarung_endpnt_def)(paarung_endpnt_impl);
export const endpoints = {
  paarung: ep,
  abc: {
    definition: paarung_endpnt_def,
    implementation: paarung_endpnt_impl,
  },
  detail: {
    definition: details_endpnt_def,
    implementation: details_endpnt_impl,
  }
}
