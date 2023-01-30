const baseValidator = require('@middy/validator');
const { transpileSchema } = require('@middy/validator/transpile');

const copyFields = [
  'properties',
  'required',
  'allOf',
];
const mount = schema => {
  const inputSchema = {
    type: 'object',
    properties: {
      body: {
        type: 'object',
        required: schema.required,
      },
    },
    required: ['body'],
  };
  const { body } = inputSchema.properties;
  for (const copyField of copyFields) {
    if (schema[copyField]) {
      body[copyField] = schema[copyField];
    }
  }
  if (schema.$defs) {
    inputSchema.$defs = schema.$defs;
  }

  return inputSchema;
};

const transpile = (schema, mountSchemaAtBody = false) => {
  let inputSchema = schema;
  if (mountSchemaAtBody) {
    inputSchema = mount(schema);
  }

  return transpileSchema(inputSchema, { strictRequired: false });
};

const transformPath = instancePath => {
  // transform instancePath from '/body/something' to '.body.something'
  const sliceIndex = 0;
  return instancePath.slice(sliceIndex).replace(/\//g, '.');
};

const validator = options => {
  const { detailedErrors } = options;

  const validatorObject = baseValidator(options);
  if (detailedErrors) {
    validatorObject.onError = request => {
      if (request.error.name === 'BadRequestError') {
        if (Array.isArray(request.error.cause)) {
          const detailedMessage = {
            message: request.error.message,
            details: request.error.cause.map(cause => {
              const transformedPath = transformPath(cause.instancePath);
              return transformedPath ? `${transformedPath} ${cause.message}` : cause.message;
            }),
          };
          if (detailedMessage.details.length === 1) {
            [detailedMessage.details] = detailedMessage.details;
          }
          request.error.message = JSON.stringify(detailedMessage);
        }
      }
    };
  }

  return validatorObject;
};

module.exports = {
  validator,
  transpile,
};
