/**
 * Augment this interface to include all fields
 * that are needed for registration.
 */
export interface RegisterPayload {
  name: EntityField;
  mail: EntityField;
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
