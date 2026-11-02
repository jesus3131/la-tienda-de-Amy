import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const suppliedId = req.header('x-request-id');
  const requestId = suppliedId && /^[a-zA-Z0-9._-]{1,100}$/.test(suppliedId) ? suppliedId : randomUUID();
  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  next();
}
