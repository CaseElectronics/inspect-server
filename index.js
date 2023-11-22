const fs                  = require('fs');
const bodyParser          = require('body-parser');
const morgan              = require('morgan');
const express             = require('express');
const jsonPath            = require('jsonpath');
const {program}           = require('commander');
const expressAsyncHandler = require('express-async-handler');
const timers              = require('timers/promises');

program
    .option('-w, --write <path>', 'Write requests to this path (use %date% for timestamp)')
    .option('-r, --response <path>', 'Read response from this path (instead of echoing the request)')
    .option('-j, --json-path <string>', 'Use only the part of the incoming request body at this JSON path', '$')
    .option('-s, --status <code>', 'HTTP response code', 200)
    .option('-d, --delay <ms>', 'Sleep this many seconds during each request', 0)
    .option('-t, --throttle <ms>', 'Wait this many milliseconds between sending each line', 0)
    .option('-p, --port <number>', 'Port', 5555);

const opts = program.parse().opts();

const app = express();

// Logging middleware
app.use(morgan('common'));

// Body parser middleware
app.use(bodyParser.json({
    type:   '*/json',
    limit:  '25mb',
    verify: (req, res, buf) => {
        req.rawBody = buf
    },
}));

// HTTP status middleware
app.use((req, res, next) => {
    res.status(parseInt(req.header('X-Status') || opts.status));
    next();
});

// Delay middleware
app.use((req, res, next) => {
    if (opts.delay) setTimeout(next, opts.delay * 1000);
    else next();
});

// JSON path middleware
app.use((req, res, next) => {
    if (typeof req.body === 'object') {
        const path = req.header('X-Json-Path') ?? opts.jsonPath;
        if (path !== "$") {
            req.body = jsonPath.query(req.body, path);
        }
    }
    next();
});


app.all('*', expressAsyncHandler(async (req, res) => {
    if (opts.write) {
        const path = opts.write.replace('%date%', Date.now());
        fs.writeFileSync(path, req.rawBody);
    }
    if (opts.response) {
        const file  = (await fs.promises.readFile(opts.response)).toString();
        const lines = file.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const isLastLine = i === lines.length - 1;
            res.write(`${lines[i]}${isLastLine ? '' : '\n'}`);
            if (opts.throttle) {
                await timers.setTimeout(opts.throttle);
            }
        }
        res.end();
    } else {
        res.json(req.body);
    }
}));

const port = opts.port;

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
