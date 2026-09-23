

export enum ErrorCode {
    EmailAlreadyRegistered = 'AUTH_EMAIL_ALREADY_REGISTERED',
    InvalidCredentials = 'AUTH_INVALID_CREDENTIALS',
    UserNotFound = 'USER_NOT_FOUND',
    UserNameAlreadyRegistered = 'USER_NAME_ALREADY_REGISTERED',
    InternalServerError = 'INTERNAL_SERVER_ERROR',
    ValidationFailed = 'VALIDATION_FAILED',
    InvalidAvatarFileType = 'INVALID_AVATAR_FILE_TYPE',
    AvatarFileTooLarge = 'AVATAR_FILE_TOO_LARGE',
    AvatarNotExisted = 'AVATAR_NOT_EXIST',
    DocumentNotFound = 'DOCUMENT_NOT_FOUND',
    DocumentAlreadyInGroup = 'DOCUMENT_ALREADY_IN_GROUP',
    DocumentNotInGroup = 'DOCUMENT_NOT_IN_GROUP',
    DocumentAlreadyExistsInGroup = 'DOCUMENT_ALREADY_EXISTS_IN_GROUP',
    TagNotFound = 'TAG_NOT_FOUND',
    TagNameAlreadyRegistered = 'TAG_NAME_ALREADY_REGISTERED',
    TagHasDependents = 'TAG_HAS_DEPENDENTS',
    DocumentTagAlreadyAssigned = 'DOCUMENT_TAG_ALREADY_ASSIGNED',
    DocumentTagNotAssigned = 'DOCUMENT_TAG_NOT_ASSIGNED',
    //LanguageNotAvailable ='LANGUAGE_NOT_AVAILABLE',
  }
