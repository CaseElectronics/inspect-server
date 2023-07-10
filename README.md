# `inspect-server`

```sh
yarn && yarn start
```

Exposes a server that listens on any path, on `localhost:5555` (by default). This is useful
as a substitute when the actual implementation of a service is not (yet) available and/or
while testing/development.

By default, the server echoes the request body back as response. If the `--response <path>`
option is provided, this file will be read and used as the response instead.

Designed to work with correctly formatted JSON payloads only.

### Options

```
  -w, --write <path>        Write request bodies to this path
  -r, --response <path>     Read response JSON from this path (instead of echoing the request)
  -j, --json-path <string>  Use only the part of the incoming request body at this JSON path (default: "$")
  -s, --status <code>       HTTP response code (default: 200)
  -p, --port <number>       Port (default: 5555)
```

The `log` and `fixtures` folders are recommended locations to use with `--write` and `--response` respectively
(e.g. `--write log/request.json`, `--response fixtures/response.json`).

If one of the following headers is given on a request, it takes
precedence over the corresponding CLI option:

#### `--status` or `X-Status` header

The status code of the response.

#### `--json-path` or `X-Json-Path` header

The request payload may be selected at the middleware layer by providing this option (or header).

### Examples

```
$ node ./index.js --json-path "$.foo.bar"

$ curl --request POST \
  --url http://localhost:5555/random/path \
  --header 'Content-Type: application/json' \
  --header 'X-Status: 400' \
  --data '{"foo": {"bar": "baz"}}'

# ["baz"] with code 400
```