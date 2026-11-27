import type { Request, Response } from 'express';
import * as requestsService from '../services/requests.service';
import {
  createMessageSchema,
  createRequestSchema,
  myRequestsQuerySchema,
  requestCodeParamsSchema,
  requestLangQuerySchema,
} from '../schemas/requests.schema';

export async function create(req: Request, res: Response) {
  const input = createRequestSchema.parse(req.body);
  const { lang } = requestLangQuerySchema.parse(req.query);
  const request = await requestsService.createRequest(req.user!.id, input, lang);
  res.status(201).json({ data: request });
}

export async function listMine(req: Request, res: Response) {
  const query = myRequestsQuerySchema.parse(req.query);
  const { items, meta } = await requestsService.listMyRequests(req.user!.id, query);
  res.json({ data: items, meta });
}

export async function getMine(req: Request, res: Response) {
  const { code } = requestCodeParamsSchema.parse(req.params);
  const { lang } = requestLangQuerySchema.parse(req.query);
  res.json({ data: await requestsService.getMyRequest(req.user!.id, code, lang) });
}

export async function cancel(req: Request, res: Response) {
  const { code } = requestCodeParamsSchema.parse(req.params);
  const { lang } = requestLangQuerySchema.parse(req.query);
  res.json({ data: await requestsService.cancelMyRequest(req.user!.id, code, lang) });
}

export async function addMessage(req: Request, res: Response) {
  const { code } = requestCodeParamsSchema.parse(req.params);
  const { text } = createMessageSchema.parse(req.body);
  const message = await requestsService.addMessage(req.user!.id, code, text);
  res.status(201).json({ data: message });
}
