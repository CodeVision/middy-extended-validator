# middy-extended-validator

![version](https://img.shields.io/npm/v/middy-extended-validator) ![downloads](https://img.shields.io/npm/dm/middy-extended-validator)

Middy middleware that extends the included [validator](https://github.com/middyjs/middy/blob/master/packages/validator) middleware.

Adds:
- Extended validation error messages (with details)
- Allow mounting a JSON schema file under a `body` root property. This allow using the JSON schema file to server as schema for the actual request not just the request as received in a lambda function.

## Getting Started

Installing `middy-extended-validator`

```
npm install --save @middy/core
npm install --save middy-extended-validator
```

## Usage


```javascript
const middy = require('@middy/core');
const httpErrorHandler = require('@middy/http-error-handler');
const jsonBodyParser = require('@middy/http-json-body-parser');
const validator = require('middy-extended-validator');

const schema = require('some-json-schema.json');


const handler = async event => {
  // do something with event.body...

  const statusCode = 200;
  const body = JSON.stringify({ message: 'something' })
  return {
    statusCode,
    body,
  };
};

module.exports.handler = middy(handler)
  .use(jsonBodyParser())
  .use(validator({ inputSchema: schema, mountSchemaAtBody: true, detailedErrors: true }))
  .use(httpErrorHandler());
```

## Options

The middleware accepts the following options:

### mountSchemaAtBody

The `mountSchemaAtBody` takes the inputSchema and mounts its properties under a `body` property in the root.

Allows using a schema such as:

```js
const schema = {
  type: 'object',
  properties: {
    foo: { type: 'string' }
  },
  required: ['foo'],
}
```

and turns it into this:

```js
const schema = {
  type: 'object',
  properties: {
    body: { type: 'object' },
    properties: {
      foo: { type: 'string' }
    }
    required: ['foo'],
  },
  require: ['body']
}
```

which corresponds to how the `event` actually looks as received in the lambda function.

This is especially useful if the schema is defined externally and also used for
generating documentation for example.

### detailedErrors

The default message returned by the included validator is just that validation
failed (Event object failed validation).

The `detailedErrors` option instead returns a
[http-errors](https://www.npmjs.com/package/http-errors) compatible object that
includes both a message as well as a details property which are both
returned to the client as JSON.

For example:

```json
{
  "details:" "should have required property foo",
  "message": "Event object failed validation"
}
```
