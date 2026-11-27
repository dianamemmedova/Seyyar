import type { CookieOptions, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';
import { isProduction } from '../config';

const REFRESH_COOKIE = 'seyyar_rt';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/api/auth',
};

function sendSession(res: Response, session: authService.Session, status = 200) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...cookieOptions,
    expires: session.refreshExpiresAt,
  });

  res.status(status).json({
    data: { user: session.user, accessToken: session.accessToken },
  });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const session = await authService.registerUser(input);
  sendSession(res, session, 201);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const session = await authService.loginUser(input);
  sendSession(res, session);
}

export async function refresh(req: Request, res: Response) {
  const session = await authService.refreshSession(req.cookies?.[REFRESH_COOKIE]);
  sendSession(res, session);
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ data: user });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.requestPasswordReset(email);
  res.json({ data: { message: 'If this email is registered, a reset link has been sent' } });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(token, password);
  res.status(204).end();
}
