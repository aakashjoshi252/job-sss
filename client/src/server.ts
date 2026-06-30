import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(browserDistFolder, 'index.html');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false
  })
);

app.use('/api', (_req: Request, res: Response) => {
  res.status(502).json({
    success: false,
    message: 'SSR server does not proxy API requests. Use Nginx or the Node API server for /api.'
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`JewelCancy Angular SSR listening on http://localhost:${port}`);
    console.log(`Serving ${indexHtml}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
