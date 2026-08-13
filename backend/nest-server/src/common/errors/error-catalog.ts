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
  //[ErrorCode.LanguageNotAvailable]: {
  //  status: HttpStatus.BAD_REQUEST,
  //  message: 'Language not available, only <en>, <de> or <es> are available'
  //}
  [ErrorCode.ValidationFailed]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The request contains invalid data'
  },
  [ErrorCode.InvalidAvatarFileType]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Avatar must be a JPEG, PNG, or WebP image.'
  },
  [ErrorCode.AvatarFileTooLarge]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Avatar file exceeds the maximum allowed size of 5MB.'
  },
  [ErrorCode.DocumentNotFound]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Document was not found.'
  },
  [ErrorCode.DocumentAlreadyInGroup]: {
    status: HttpStatus.CONFLICT,
    message: 'Document is already assigned to a group.'
  }

  } satisfies Record<ErrorCode, ErrorDefinition>;

