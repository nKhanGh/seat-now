import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('auth')
export class AuthController {
  private readonly cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';

  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() input: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(input);
    this.setCookie(response, result.token);
    return { data: result.user };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(input);
    this.setCookie(response, result.token);
    return { data: result.user };
  }

  @Get('me')
  async me(@Req() request: CookieRequest) {
    return { data: await this.auth.authenticate(request.cookies?.[this.cookieName]) };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: CookieRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[this.cookieName]);
    response.clearCookie(this.cookieName, { path: '/' });
  }

  private setCookie(response: Response, token: string) {
    const secure = process.env.NODE_ENV === 'production';
    if (secure && !process.env.PUBLIC_ORIGIN?.startsWith('https://')) {
      throw new UnauthorizedException('Production PUBLIC_ORIGIN must be HTTPS');
    }
    response.cookie(this.cookieName, token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
