import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing basic authorization header');
    }

    const encodedCredentials = authorizationHeader
      .slice('Basic '.length)
      .trim();
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      'base64',
    ).toString('utf-8');
    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex === -1) {
      throw new UnauthorizedException('Invalid basic authorization header');
    }

    const username = decodedCredentials.slice(0, separatorIndex);
    const password = decodedCredentials.slice(separatorIndex + 1);
    const expectedUsername = process.env.AUTH_BASIC_USERNAME;
    const expectedPassword = process.env.AUTH_BASIC_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      throw new UnauthorizedException('Basic auth is not configured');
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      throw new UnauthorizedException('Invalid basic auth credentials');
    }

    return true;
  }
}
