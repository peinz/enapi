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
  const getSchemaRef = (name: string, propDef: any) => {
    const refId = '#/components/schemas/' + name;
    schemas[name] = {
      // required: [],
      type: "object",
      properties: apiTypeDefToOpenApiTypeDef(propDef),
    };

    return refId;
  }

  const paths = Object.entries(endpoints).reduce( (pathObj, [path, ep]) => {
    const action = 'get';

    const pathActionObj = {} as any;

    if(action === 'get'){
      pathActionObj.get = {
        tags: [ path ],
        summary: `${action} ${path} resource`,
        description: "Update an existing pet by Id",
        operationId: action+path,
        parameters: [{
          name: 'id',
          in: 'path',
          description: 'resource identifier',
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
                  "$ref": getSchemaRef(path, ep.definition.get.result),
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
    }

    pathObj['/' + path + '/{id}'] = pathActionObj;
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