import { Endpoints } from "./api-lib.ts";


const apiTypeDefToOpenApiTypeDef = (apiTypeDef: Record<string, string>) => {
  const m = Object.entries(apiTypeDef).reduce( (openApiTypeDef, [key, value]) => ({
    ...openApiTypeDef,
    [key]: value === 'string'
      ? { type: 'string' }
      : { type: 'integer', format: 'int64' }
  }), {})
  return m;
}

export const createOpenApiJsonDoc = (endpoints: Endpoints) => {

  const schemas = {} as any;
  const getSchemaRef = (route: string, action: string, propDef: any) => {
    const schema_name = route + '_' + action
    const refId = '#/components/schemas/' + schema_name
    schemas[schema_name] = {
      // required: [],
      type: "object",
      properties: apiTypeDefToOpenApiTypeDef(propDef),
    };

    return refId;
  }

  const paths = Object.entries(endpoints).reduce( (pathObj, [path, ep]) => {

    const pathEntityActionObj = {} as any;
    const pathCollectionActionObj = {} as any;

    pathEntityActionObj.get = {
      tags: [ path ],
      summary: `get ${path} entity`,
      description: `get ${path} entity`,
      operationId: 'get' + path,
      parameters: [{
        name: 'id',
        in: 'path',
        description: 'entity identifier',
        required: true,
        schema: {
          type: 'integer',
          format: 'int64',
        },
      }],
      responses: {
        "200": {
          description: "Successful operation",
          content: {
            "application/json": {
              "schema": {
                "$ref": getSchemaRef(path, 'get', ep.definition.getResult),
              }
            },
          }
        },
        "400": {
          description: "invalid request"
        },
        "404": {
          description: "not found"
        },
      }
    };

    if(ep.definition.postBody) pathCollectionActionObj.post = {
      tags: [ path ],
      summary: `create ${path} entity`,
      description: `create ${path} entity`,
      operationId: 'post' + path,
      requestBody: {
        description: `create ${path} entity`,
        content: {
          "application/json": {
            schema: {
              "$ref": getSchemaRef(path, 'post', ep.definition.postBody),
            }
          },
        },
        required: true
      },
      responses: {
        "201": {
          description: "Entity created",
          content: {
            "application/json": {
              "schema": {
                "$ref": getSchemaRef(path, 'get', ep.definition.getResult),
              }
            },
          }
        },
        "400": {
          description: "invalid request"
        },
      }
    }

    if(ep.definition.patchBody) pathEntityActionObj.patch = {
      tags: [ path ],
      summary: `update ${path} entity`,
      description: `update ${path} entity`,
      operationId: 'patch' + path,
      parameters: [{
        name: 'id',
        in: 'path',
        description: 'entity identifier',
        required: true,
        schema: {
          type: 'integer',
          format: 'int64',
        },
      }],
      requestBody: {
        description: `create ${path} entity`,
        content: {
          "application/json": {
            schema: {
              "$ref": getSchemaRef(path, 'patch', ep.definition.patchBody),
            }
          },
        },
        required: false
      },
      responses: {
        "200": {
          description: "Entity updated",
          content: {
            "application/json": {
              "schema": {
                "$ref": getSchemaRef(path, 'get', ep.definition.getResult),
              }
            },
          }
        },
        "400": {
          description: "invalid request"
        },
      }
    }

    if(ep.definition.remove) pathEntityActionObj.delete = {
      tags: [ path ],
      summary: `delete ${path} entity`,
      description: `delete${path} entity`,
      operationId: 'delete' + path,
      parameters: [{
        name: 'id',
        in: 'path',
        description: 'entity identifier',
        required: true,
        schema: {
          type: 'integer',
          format: 'int64',
        },
      }],
      responses: {
        "204": {
          description: "Entity deleted",
        },
        "404": {
          description: "not found"
        },
      }
    };

    if(ep.definition.collectionQueryParams) pathCollectionActionObj.get = {
      tags: [ path ],
      summary: `get ${path} entities`,
      description: `get ${path} entities`,
      operationId: 'getCollection' + path,
      parameters: Object.entries(ep.definition.collectionQueryParams).map( ([name, def]) => ({
        name,
        in: 'query',
        description: 'entity query paramterer: ' + name,
        required: false,
        schema: {
          type: 'integer',
          format: 'int64',
        },
      })),
      responses: {
        "200": {
          description: "Successful operation",
          content: {
            "application/json": {
              "schema": {
                type: 'array',
                items: {
                  $ref: getSchemaRef(path, 'getCollection', ep.definition.getResult),
                }
              }
            },
          }
        },
        "400": {
          description: "invalid request"
        },
        "404": {
          description: "not found"
        },
      }
    };

    pathObj['/' + path + '/{id}'] = pathEntityActionObj;
    pathObj['/' + path] = pathCollectionActionObj;
    return pathObj;
  }, {} as any)


  return {
    openapi: "3.0.3",
    servers: [
      {
        url: "http://localhost:3000"
      }
    ],
    info: {
      title: "My Api",
      version: "0.0.0"
    },
    paths,
    components: {
      schemas,
      requestBodies: {},
    },
  } 
}