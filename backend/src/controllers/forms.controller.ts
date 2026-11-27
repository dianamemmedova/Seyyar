import type { Request, Response } from 'express';
import * as formsService from '../services/forms.service';
import {
  contactSchema,
  faqQuerySchema,
  partnerApplicationSchema,
  subscribeSchema,
} from '../schemas/forms.schema';

export async function contact(req: Request, res: Response) {
  const input = contactSchema.parse(req.body);
  await formsService.sendContactMessage(input);
  res.status(201).json({ data: { message: 'Thank you! We will reply by email.' } });
}

export async function subscribe(req: Request, res: Response) {
  const input = subscribeSchema.parse(req.body);
  await formsService.subscribe(input);
  res.status(201).json({ data: { message: 'You are subscribed.' } });
}

export async function applyAsPartner(req: Request, res: Response) {
  const input = partnerApplicationSchema.parse(req.body);
  const result = await formsService.applyAsPartner(input);
  res.status(201).json({ data: result });
}

export async function faq(req: Request, res: Response) {
  const query = faqQuerySchema.parse(req.query);
  res.json({ data: await formsService.listFaq(query) });
}
