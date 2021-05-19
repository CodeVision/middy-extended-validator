'use strict';

const baseValidator = require('@middy/validator');


const bodyMount = schema => ({
  type: 'object', properties: {
    body: {
      type: 'object',
      properties: schema.properties,
      required: schema.required,
    },
  },
  required: ['body'],
});

const transformPath = (instancePath, { mountSchemaAtBody }) => {
  // transform instancePath from '/body/something' to '.body.something' or
  // just '.something' (if body was inserted previously)
  let sliceIndex = 0;
  if (mountSchemaAtBody) {
    const slashIndex = instancePath.indexOf('/', 2);
    if (slashIndex >= 0) {
      sliceIndex = slashIndex;
    } else {
      sliceIndex = instancePath.length;
    }
  }
  return instancePath.slice(sliceIndex).replace(/\//g, '.');
};

const extendedValidatorMiddleWare = options => {
  const { mountSchemaAtBody, detailedErrors } = options;

  if (mountSchemaAtBody) {
    options.inputSchema = bodyMount(options.inputSchema);
  }

  if (!options.ajvOptions) {
    options.ajvOptions = { strict: false, ...options.ajvOptions };
  }
  const validatorObject = baseValidator(options);
  if (detailedErrors) {
    validatorObject.onError = request => {
      if (request.error.name === 'BadRequestError') {
        const detailedMessage = {
          message: request.error.message,
          details: request.error.details.map(detail => {
            const transformedPath = transformPath(detail.instancePath, { mountSchemaAtBody });
            return transformedPath ? `${transformedPath} ${detail.message}` : detail.message;
          }),
        };
        if (detailedMessage.details.length === 1) {
          detailedMessage.details = detailedMessage.details[0];
        }
        request.error.message = JSON.stringify(detailedMessage);
      }
    };
  }

  return validatorObject;
};

module.exports = extendedValidatorMiddleWare;
