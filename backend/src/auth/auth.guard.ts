import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class AuthGuard implements CanActivate
{
	constructor(
		private readonly jwwtService: JwtService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean>
	{
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
		if (isPublic)
		{
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);

		if (!token)
		{
			throw new UnauthorizedException('No token available')
		}

		try
		{
			const payload = await this.jwwtService.verifyAsync(token);
			request['user'] = payload;
		}
		catch
		{
			throw new UnauthorizedException('Token not valid or expired');
		}

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined
	{
		const authHeader = request.headers.authorization;
		if (!authHeader)
		{
			return undefined;
		}

		const [type, token] = authHeader.split(' ');
		return type == 'Bearer' ? token : undefined;
	}
}
