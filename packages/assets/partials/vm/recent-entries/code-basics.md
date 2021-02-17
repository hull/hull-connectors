## Code Basics

You can access the **request data** directly using the following variables:

| Variable Name        | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `body`               | Contains the parsed data as a `json` object.           |
| `requestBody`        | Object containing the body that was sent.              |
| `requestHeaders`     | Object containing HTTP headers.                        |
| `responseHeader`     | Object containing HTTP headers.                        |
| `url`                | The url that was called.                               |
| `method`             | A string describing the HTTP method.                   |
| `status`             | The response status code                               |
| `params`             | Object containing the route parameters of the request. |

Please note that the availability of these variables may be dependent on the external service.
