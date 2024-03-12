import express from 'express';
import path from 'node:path'
import * as url from 'node:url';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express();

app.use(express.static(path.resolve(`${dirname}/../public`)));

export default app;
