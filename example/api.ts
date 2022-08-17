import {
  createEndpointDefinition,
  createEndpointImplementation,
  Endpoint,
} from "../mod.ts";

const paarung_endpnt_def = createEndpointDefinition({
  getResult: {
    id: "number",
    name: "string",
  },
  postBody: {
    name: "string",
  },
  patchBody: {
    name: "string",
  },
  collectionQueryParams: {
    season: "number",
  },
  remove: true,
});

const details_endpnt_def = createEndpointDefinition({
  getResult: {
    name: "string",
  },
  collectionQueryParams: {
    season: "number",
  },
});

let pc = 0;
const paarungen = {} as Record<number, { id: number; name: string }>;

const paarung_endpnt_impl = createEndpointImplementation<
  typeof paarung_endpnt_def
>({
  get: (id) => paarungen[id],
  post: (body) => paarungen[++pc] = { ...body, id: pc },
  patch: (id, body) => paarungen[id] = { ...paarungen[id], ...body },
  delete: (id) => delete paarungen[id],
  getCollection: (queryParams) => Object.values(paarungen),
});

const details_endpnt_impl = createEndpointImplementation<
  typeof details_endpnt_def
>({
  get: (id) => ({ id: id, name: "avc" + id }),
  getCollection: (queryParams) => [{ id: 7, name: "avc" + queryParams.season }],
});

export const endpoints = {
  paarung: Endpoint(paarung_endpnt_def, paarung_endpnt_impl),
  abc: Endpoint(paarung_endpnt_def, paarung_endpnt_impl),
  detail: Endpoint(details_endpnt_def, details_endpnt_impl),
};
