## External Libraries

The processor exposes several external libraries that can be used:

|**Variable**          | **Library name**                                                                        |
|----------------------| ----------------------------------------------------------------------------------------|
|`_`                   | The lodash library. (https://lodash.com/)                                               |
|`moment`              | The Moment.js library(https://momentjs.com/)                                            |
|`urijs`               | The URI.js library (https://github.com/medialize/URI.js/)                               |
|`request` (deprecated)| The simplified request client (https://github.com/request/request)                      |
|`superagent`          | The simple and elegant request library (https://github.com/visionmedia/superagent)      |
|`uuid`                | The uuid library (https://github.com/uuidjs/uuid)                                       |
|`LibPhoneNumber`      | The google-LibPhoneNumber library (https://ruimarinho.github.io/google-libphonenumber/) |

Please visit the linked pages for documentation and further information about these third party libraries.

### uuid Library

The `uuid` library exposes the version 4 of the algorithm, and only accepts the first `options` argument - other arguments will be ignored. As a result, here's the way to use it:

```js
const user_id = uuid()
//or
const user_id = uuid({ random: [ 0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea, 0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36, ] });
```

### LibPhoneNumber Library

The `LibPhoneNumber` library exposes a subset of the `google-libphonenumber` library. Here's how to use it

```js
//PhoneNumberFormat is the PhoneNumberFormat object from the library;
//PhoneNumberUtil is an INSTANCE of the PhoneNumberUtil methods
const { CountrySourceCode, PhoneNumberType, PhoneNumberFormat, PhoneNumberUtil } = LibPhoneNumber;

const number = PhoneNumberUtil.parseAndKeepRawInput('202-456-1414', 'US');
console.log(number.getCountryCode()); //1
// Print the phone's national number.
console.log(number.getNationalNumber());
// => 2024561414

// Result from isPossibleNumber().
console.log(PhoneNumberUtil.isPossibleNumber(number));
// => true
```

### Supported Methods for `PhoneNumberUtil`

Checkout `i18n.phonenumbers.PhoneNumberUtil`: https://ruimarinho.github.io/google-libphonenumber/#google-libphonenumber-methods-i18nphonenumbersphonenumberutil

Calling `PhoneNumberUtil.parse("1234-1234")` will return an instance of `PhoneNumber`, which has the following methods: https://ruimarinho.github.io/google-libphonenumber/#google-libphonenumber-methods-i18nphonenumbersphonenumber

Checkout the Docs for `CountryCodeSource`, `PhoneNumberFormat`, `PhoneNumberType` which are statics

## \[Deprecated\] Using Request

The request library is now deprecated. Processors using the request library will be still operational,
but we advise you to migrate to the super-agent request library which is much more intuitive and elegant to use.

If you are about to write new code to perform any API request, please refer to the [Using Superagent](#Using-Superagent) section.

The library exposes `request-promise` to allow you to call external APIs seamlessly:

```javascript
const response = await request({
    uri: 'https://api.github.com/user/repos',
    qs: {
        access_token: 'xxxxx xxxxx' // -> uri + '?access_token=xxxxx%20xxxxx'
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
})
console.log(response)
```

## Using Superagent

To perform API requests, the processor connector exposes the superagent library through the `superagent` keyword.
It is an instance of the original [superagent](https://visionmedia.github.io/superagent/) library with additional plugins added behind the scenes to make it run smoothly in your processor code.
This comes with some syntax restrictions that our instance of superagent won't work with, more on that right below.

### Differences

The exposed superagent instances cannot be called as function, so following code won't work:

```javascript
const res = await superagent('GET', 'https://www.foobar.com/search');
```

Instead always call a method on superagent object choosing which HTTP method you want to use. See examples Below.

### Usage

Here are a few code snippets to use the super-agent request library in your processor code:

```javascript
const response = await superagent
    .get("https://example.com/foo")
    .set("accept", "json")                    // Set a header variable by using the set() function.
    .set(`Authorization: Bearer ${api_key}`)
    .send({                                   // Set a body by using the send() function
      body_variable: "something"              // and by giving it an object.
    })
    .query({                                  // Set a query by using the query() function
      orderBy: "asc"                          // and by giving it an object.
    })
```

You can also perform asynchronous requests by using promises as such:

```javascript
superagent
    .get("https://example.com/foo")
    .set("accept", "json")
    .set(`Authorization: Bearer ${api_key}`)
    .send({
      body_variable: "something"
    })
    .query({
      orderBy: "asc"
    })
    .then(res => {
      console.log(res.body);
    })
```

Handling errors is also possible, either by using promises or by wrapping the code in a `try catch` statement:

```javascript
superagent
    .get("https://example.com/foo")
    .set("accept", "json")
    .set(`Authorization: Bearer ${api_key}`)
    .then(res => {
      console.log(res.body);
    })
    .catch(err => {
      console.log(`Error: ${err}`);
    })
```

```javascript
try {
  const response = await superagent
    .get("https://example.com/foo")
    .set("accept", "json")
    .set(`Authorization: Bearer ${api_key}`);
} catch (err) {
  console.log(`Error: ${err}`);
}
```

You can find full documentation of the superagent library [here](https://visionmedia.github.io/superagent/).
Keep in mind that calling superagent as function does not work.

### Migrating from the Request library to the Superagent library

You might have noticed a warning message coming on your processor saying that your code is using a deprecated request library.
In order to fix that, you need to replace `request` with the superagent library.

There are mostly two things to adjust. First you need to replace your request options object with set of chained methods on superagent instance.
Second you will need to look for the `response.body` object instead of looking directly at the `data` object.

To illustrate that, let's have a look at a code block using the deprecated request library, and another code block with the result of migrating it.

```javascript
// Old request library

const reqOpts = {
  method: "GET",
  uri: "http://www.omdbapi.com/?t=James+Bond"
};

return new Promise((resolve, reject) => {
    request(reqOpts, (err, res, data) => {
      if (err) {
        console.info("Error:", err);
        return reject(err);
      }
      // data contains the response body
      if(_.isString(data)) {
        data = JSON.parse(data);
      }
      resolve(data);
    });
});
```

```javascript
// With super-agent library

return superagent
    .get("http://www.omdbapi.com/?t=James+Bond")
    .then(res => {
      // res.body is parsed response body
      return res.body;
    })
    .catch(err => {
      console.info("Error:", err);
    })
```
