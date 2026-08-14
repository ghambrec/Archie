

export enum ErrorCode {
    EmailAlreadyRegistered = 'AUTH_EMAIL_ALREADY_REGISTERED',
    InvalidCredentials = 'AUTH_INVALID_CREDENTIALS',
    UserNotFound = 'USER_NOT_FOUND',
    UserNameAlreadyRegistered = 'USER_NAME_ALREADY_REGISTERED',
    InternalServerError = 'INTERNAL_SERVER_ERROR',
    ValidationFailed = 'VALIDATION_FAILED',
    InvalidAvatarFileType = 'INVALID_AVATAR_FILE_TYPE',
    AvatarFileTooLarge = 'AVATAR_FILE_TOO_LARGE',
    DocumentNotFound = 'DOCUMENT_NOT_FOUND',
    DocumentAlreadyInGroup = 'DOCUMENT_ALREADY_IN_GROUP',

    //LanguageNotAvailable ='LANGUAGE_NOT_AVAILABLE',
  }
