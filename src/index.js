'use strict';

const baseValidator = require('@middy/validator');


const bodyMount = schema => ({
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: schema.properties,
      required: schema.required,
    },
  },
  required: ['body'],
});

const validator = options => {
  const { mountSchemaAtBody, detailedErrors } = options;

  if (mountSchemaAtBody) {
    options.inputSchema = bodyMount(options.inputSchema);
  }

  const validatorObject = baseValidator(options);
  if (detailedErrors) {
    validatorObject.onError = (handler, next) => {
      if (handler.error.name === 'BadRequestError') {
        const detailedMessage = {
          message: handler.error.message,
          details: handler.error.details.map(detail => {
            // transform dataPath from '/body/something' to '.body.something' or
            // just '.something' (if body was inserted previously)
            const sliceIndex = mountSchemaAtBody ? detail.dataPath.indexOf('/', 2) : 1;
            const transformedPath = detail.dataPath.slice(sliceIndex).replace(/\//g, '.');
            return `${transformedPath} ${detail.message}`;
          }),
        };
        if (detailedMessage.details.length === 1) {
          detailedMessage.details = detailedMessage.details[0];
        }
        handler.error.message = JSON.stringify(detailedMessage);
      }

      return next(handler.error);
    };
  }

  return validatorObject;
};

module.exports = validator;
