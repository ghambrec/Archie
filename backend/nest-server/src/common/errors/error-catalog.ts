import { HttpStatus } from "@nestjs/common";
import { ErrorCode } from "./error-code";

export interface ErrorDefinition{
	status: HttpStatus;
	message:string;
}

export const ERROR_CATALOG ={
  [ErrorCode.AiRateLimited]: { status: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many chat requests. Please wait before trying again.' },
  [ErrorCode.AiRequestTimeout]: { status: HttpStatus.GATEWAY_TIMEOUT, message: 'The chat request timed out.' },
  [ErrorCode.AiRequestCancelled]: { status: HttpStatus.REQUEST_TIMEOUT, message: 'The chat request was cancelled.' },
  [ErrorCode.AiConversationBusy]: { status: HttpStatus.CONFLICT, message: 'An answer is already being generated for this chat.' },
  [ErrorCode.AiConversationNotFound]: { status: HttpStatus.NOT_FOUND, message: 'Conversation was not found.' },
  [ErrorCode.AiContextLimit]: { status: HttpStatus.UNPROCESSABLE_ENTITY, message: 'The model context or output limit was exceeded.' },
  [ErrorCode.AiInvalidResponse]: { status: HttpStatus.BAD_GATEWAY, message: 'The AI service returned an invalid response.' },
  [ErrorCode.AiGenerationFailed]: { status: HttpStatus.BAD_GATEWAY, message: 'An answer could not be generated.' },
  [ErrorCode.AiSaveFailed]: { status: HttpStatus.SERVICE_UNAVAILABLE, message: 'The answer could not be saved.' },
  [ErrorCode.AiStreamInterrupted]: { status: HttpStatus.BAD_GATEWAY, message: 'The answer stream ended before completion.' },

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
  [ErrorCode.AvatarNotExisted]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'User has no avatar image.'
  },
  [ErrorCode.DocumentNotFound]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Document was not found.'
  },
  [ErrorCode.DocumentAlreadyInGroup]: {
    status: HttpStatus.CONFLICT,
    message: 'Document is already assigned to a group.'
  },
  [ErrorCode.DocumentNotInGroup]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Document is not assigned to the given group.'
  },
  [ErrorCode.DocumentAlreadyExistsInGroup]: {
    status: HttpStatus.CONFLICT,
    message: 'Document already exists in this group.'
  },
  [ErrorCode.TagNotFound]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Tag was not found.'
  },
  [ErrorCode.TagNameAlreadyRegistered]: {
    status: HttpStatus.CONFLICT,
    message: 'Tag name is already taken.'
  },
  [ErrorCode.TagHasDependents]: {
    status: HttpStatus.CONFLICT,
    message: 'Tag still has child tags or documents assigned to it.'
  },
  [ErrorCode.DocumentTagAlreadyAssigned]: {
    status: HttpStatus.CONFLICT,
    message: 'Document already has this tag assigned.'
  },
  [ErrorCode.DocumentTagNotAssigned]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Document does not have the given tag assigned.'
  },
  [ErrorCode.DocumentFileTypeNotAllowed] : {
	status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
	message: 'Document file type is not whitelisted.'
  },
  [ErrorCode.DocumentFileTypeMismatch] : {
	status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
	message: 'Document content does not match mime type.'
  },
  [ErrorCode.DocumentFileEmpty] : {
	status: HttpStatus.BAD_REQUEST,
	message: 'Document file is empty.'
  },
  [ErrorCode.DocumentStillProcessing] : {
	status: HttpStatus.CONFLICT,
	message: 'Document is still processing the ai pipeline.'
  },
    [ErrorCode.DocumentIngestionNotRetryable] : {
	status: HttpStatus.CONFLICT,
	message: 'Document ingestion is not retryable, only possible if it was not started or has failed'
  },
    [ErrorCode.AiServiceUnavailable] : {
	status: HttpStatus.SERVICE_UNAVAILABLE,
	message: 'AI Service is currently unavailable.'
  },
  [ErrorCode.DocumentNotPreviewable] : {
	status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
	message: 'Document file type cannot be previewed.'
  },

  } satisfies Record<ErrorCode, ErrorDefinition>;
