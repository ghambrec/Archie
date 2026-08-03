import { HttpStatus } from "@nestjs/common";
import { ErrorCode } from "./error-code";

export interface ErrorDefinition{
	status: HttpStatus;
	message:string;
}

export const ERROR_CATALOG ={
	[ErrorCode.EmailAlreadyRegistered]: {
      status: HttpStatus.CONFLICT,
      message: 'Email is already registered.',
    },

    [ErrorCode.InvalidCredentials]: {
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid credentials.',
    },

    [ErrorCode.UserNotFound]: {
      status: HttpStatus.NOT_FOUND,
      message: 'User was not found.',
    },

	[ErrorCode.UserNameAlreadyRegistered]: {
		status: HttpStatus.CONFLICT,
		message: 'Display Name is already registered.'
	},
	[ErrorCode.InternalServerError]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred.',
  },

  } satisfies Record<ErrorCode, ErrorDefinition>;

