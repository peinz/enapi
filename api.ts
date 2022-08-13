import { buildEndpoint, EndpDef, RestEndpointImplementation } from "./api-lib.ts";

const paarung_endpnt_def = EndpDef({
  get: {
    result: {
      id: 'number',
      name: 'string',
    },
  },
  post: {
    body: {
      id: 'number',
      name: 'string',
    },
  },
  // patch: {
  //   id: 'number',
  // },
  getCollection: {
    queryParams: {
      season: 'number',
    },
  },
  // postCollection: {
  //   id: 'number',
  // },
})

const details_endpnt_def = EndpDef({
  get: {
    result: {
      id: 'number',
      name: 'string',
    },
  },
  getCollection: {
    queryParams: {
      season: 'number',
    },
  },
})

const paarung_endpnt_impl: RestEndpointImplementation<typeof paarung_endpnt_def> = {
  get: (id) => ({id: id, name: 'avc'+id }),
  post: (id, body) => console.log('post implementation executed', id, body),
  getCollection: (queryParams) => ([{id: 7, name: 'avc'+queryParams.season }]),
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
