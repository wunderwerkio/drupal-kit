/**
 * Augment DrupalkitOptions and add custom configuration.
 */
declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    /**
     * Endpoint path for the User API AdvancedRegistrationResource.
     *
     * @default '/user-api/register'
     */
    userApiRegistrationEndpoint?: string;
    /**
     * Endpoint path for the User API ResendRegisterEmailResource.
     *
     * @default '/user-api/register/resend-email'
     */
    userApiRegisterResendEmailEndpoint?: string;
    /**
     * Endpoint path for the User API InitCancelAccountResource.
     *
     * @default '/user-api/cancel-account/init'
     */
    userApiInitCancelAccountEndpoint?: string;
    /**
     * Endpoint path for the User API CancelAccountResource.
     *
     * @default '/user-api/cancel-account'
     */
    userApiCancelAccountEndpoint?: string;
    /**
     * Endpoint path for the User API InitSetPasswordResource.
     *
     * @default '/user-api/set-password/init'
     */
    userApiInitSetPasswordEndpoint?: string;
    /**
     * Endpoint path for the User API SetPasswordResource.
     *
     * @default '/user-api/set-password'
     */
    userApiSetPasswordEndpoint?: string;
    /**
     * Endpoint path for the User API InitSetPasswordResource.
     *
     * @default '/user-api/set-password/init'
     */
    userApiInitUnsetPasswordEndpoint?: string;
    /**
     * Endpoint path for the User API SetPasswordResource.
     *
     * @default '/user-api/set-password'
     */
    userApiUnsetPasswordEndpoint?: string;
    /**
     * Endpoint path for the User API PasswordlessLoginResource.
     *
     * @default '/user-api/passwordless-login'
     */
    userApiPasswordlessLoginEndpoint?: string;
    /**
     * Endpoint path for the User API InitSetEmailResource.
     *
     * @default '/user-api/set-email/init'
     */
    userApiInitSetEmailEndpoint?: string;
    /**
     * Endpoint path for the User API SetEmailResource.
     *
     * @default '/user-api/set-email'
     */
    userApiSetEmailEndpoint?: string;

    //
    // Deprecated properties.
    //

    /**
     * Endpoint path for the User API ResendRegisterEmailResource.
     *
     * @deprecated Deprecated in `0.9.3` will be removed in `1.0.0`. Use `userApiRegisterResendEmailEndpoint` instead.
     */
    userApiResendMailEndpoint?: string;
    /**
     * Endpoint path for the User API InitCancelAccountResource.
     *
     * @deprecated Deprecated in `0.9.3` will be removed in `1.0.0`. Use `userApiInitCancelAccountEndpoint` instead.
     */
    userApiInitAccountCancelEndpoint?: string;
    /**
     * Endpoint path for the User API InitSetPasswordResource.
     *
     * @deprecated Deprecated in `0.9.3` will be removed in `1.0.0`. Use `userApiInitSetPasswordEndpoint` instead.
     */
    userApiResetPasswordEndpoint?: string;
    /**
     * Endpoint path for the User API SetPasswordResource.
     *
     * @deprecated Deprecated in `0.9.3` will be removed in `1.0.0`. Use `userApiSetPasswordEndpoint` instead.
     */
    userApiUpdatePasswordEndpoint?: string;
    /**
     * Endpoint path for the User API InitSetEmailResource.
     *
     * @deprecated Deprecated in `0.9.3` will be removed in `1.0.0`. Use `userApiInitSetEmailEndpoint` instead.
     */
    userApiUpdateEmailEndpoint?: string;
    /**
     * Endpoint path for the User API SetEmailResource.
     *
     * @deprecated Deprecated in `0.9.3` will be removed in `1.0.0`. Use `userApiSetEmailEndpoint` instead.
     */
    userApiVerifyEmailEndpoint?: string;
  }
}
/**
 * Augment this interface to include all fields
 * that are needed for registration.
 */
export interface RegisterPayload {
  name: EntityField;
  mail: EntityField;
}

/**
 * Register options.
 */
export interface RegisterOptions {
  disableEmailNotification?: boolean;
  disableAccountActivation?: boolean;
}

/**
 * Augment this interface to include additional
 * fields for the user entity.
 */
export interface RegisterResponse {
  uid: [EntityField<number>];
  uuid: [EntityField];
  langcode: [EntityField];
  name: [EntityField];
  created: [EntityFieldWithFormat];
  changed: [EntityFieldWithFormat];
  default_langcode: [EntityField];
  path: [EntityPath];
  content_translation_source?: [EntityField];
  content_translation_outdated?: [EntityField<boolean>];
  content_translation_uid?: [TranslationField];
  content_translation_created?: [EntityFieldWithFormat];
}

/**
 * Generic success response.
 */
export interface SuccessResponse {
  status: "success";
}

export type EntityField<V = string> = {
  value: V;
};

export type EntityFieldWithFormat<V = string> = EntityField<V> & {
  format: string;
};

export type EntityPath = {
  alias?: string;
  pid?: string;
  langcode: string;
};

export type TranslationField = {
  target_id: number;
  target_type: string;
  target_uuid: string;
  url: string;
};
