// Hand-authored types mirroring supabase/migrations/*.sql. Keep in sync
// with the schema; regenerate/reconcile with `supabase gen types typescript`
// once a real project is linked (see docs/SETUP.md).

export type Relationship =
  | 'current_owner'
  | 'former_owner'
  | 'mechanic'
  | 'dealer'
  | 'family_member'
  | 'enthusiast'
  | 'witness'
  | 'other';

export type RecordCategory =
  | 'maintenance'
  | 'repair'
  | 'inspection'
  | 'modification'
  | 'damage'
  | 'recall'
  | 'sale_auction'
  | 'ownership_experience'
  | 'mileage_update'
  | 'general_history'
  | 'photo_sighting';

export type RecordStatus = 'draft' | 'published';
export type MileageUnit = 'mi' | 'km';
export type DataStatus = 'community_submitted' | 'verified';
export type UserRole = 'user' | 'moderator' | 'admin';
export type MessagePrivacy = 'everyone' | 'followed_only' | 'no_one';
export type SharedObjectType = 'vehicle' | 'record' | 'list' | 'profile';
export type FolloweeType = 'user' | 'vehicle' | 'list';
export type NotificationType =
  | 'new_follower'
  | 'new_comment'
  | 'comment_reply'
  | 'mention'
  | 'list_invitation'
  | 'new_contribution'
  | 'record_correction'
  | 'moderation_update'
  | 'message_request';
export type ReportTargetType = 'record' | 'comment' | 'reply' | 'message' | 'user' | 'list' | 'vehicle';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'sensitive_information'
  | 'incorrect_vin'
  | 'duplicate_vehicle'
  | 'inappropriate_content'
  | 'impersonation'
  | 'unsupported_accusation'
  | 'other';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ModerationActionType =
  | 'warn'
  | 'suspend'
  | 'ban'
  | 'lift_suspension'
  | 'remove_content'
  | 'restore_content'
  | 'merge_vehicles'
  | 'approve_correction'
  | 'reject_correction'
  | 'dismiss_report'
  | 'resolve_report'
  | 'review_report'
  | 'uphold_appeal'
  | 'overturn_appeal';
export type AppealStatus = 'pending' | 'upheld' | 'overturned';

export interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location_text: string | null;
  bio: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountSettings {
  id: string;
  minimum_age_confirmed: boolean;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  guidelines_accepted_at: string | null;
  message_privacy: MessagePrivacy;
  notify_new_follower: boolean;
  notify_comment: boolean;
  notify_comment_reply: boolean;
  notify_mention: boolean;
  notify_list_invitation: boolean;
  notify_followed_vehicle_contribution: boolean;
  notify_record_correction: boolean;
  notify_moderation_update: boolean;
  notify_message_request: boolean;
  push_token: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  vin_length: number;
  is_short_vin_exception: boolean;
  short_vin_exception_approved_by: string | null;
  short_vin_exception_approved_at: string | null;
  cover_photo_url: string | null;
  created_by: string;
  merged_into_vehicle_id: string | null;
  is_flagged: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleDetails {
  vehicle_id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  body_style: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  short_description: string | null;
  data_status: DataStatus;
  updated_at: string;
}

export interface ProfileStats {
  user_id: string;
  follower_count: number;
  following_count: number;
  post_count: number;
}

export interface VehicleStats {
  vehicle_id: string;
  post_count: number;
  contributor_count: number;
  follower_count: number;
  latest_mileage: number | null;
  latest_mileage_unit: MileageUnit | null;
}

export interface VehicleDetailRevision {
  id: string;
  vehicle_id: string;
  field_name: string;
  original_value: string | null;
  suggested_value: string | null;
  reason: string;
  evidence_urls: string[];
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  created_at: string;
}

export interface VehicleRecord {
  id: string;
  vehicle_id: string;
  author_id: string;
  relationship: Relationship;
  category: RecordCategory;
  title: string;
  description: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  work_performed: string | null;
  parts_replaced: string | null;
  part_brand_and_numbers: string | null;
  facility_or_technician: string | null;
  cost_amount: number | null;
  cost_currency: string | null;
  cost_is_private: boolean;
  warranty_info: string | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
  event_date: string;
  mileage: number | null;
  mileage_unit: MileageUnit | null;
  location_text: string | null;
  status: RecordStatus;
  published_at: string | null;
  is_edited: boolean;
  mileage_inconsistency_flag: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RecordPhoto {
  id: string;
  record_id: string;
  url: string;
  thumbnail_url: string | null;
  position: number;
  width: number | null;
  height: number | null;
  exif_stripped: boolean;
  created_at: string;
}

export interface RecordDocument {
  id: string;
  record_id: string;
  url: string;
  filename: string;
  doc_type: 'receipt' | 'invoice' | 'other';
  redaction_ack: boolean;
  created_at: string;
}

export interface RecordRevision {
  id: string;
  record_id: string;
  editor_id: string;
  previous_snapshot: Record<string, unknown>;
  changed_at: string;
}

export interface Comment {
  id: string;
  record_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Reply {
  id: string;
  comment_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ListRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListStats {
  list_id: string;
  vehicle_count: number;
  follower_count: number;
}

export interface ListVehicle {
  id: string;
  list_id: string;
  vehicle_id: string;
  position: number;
  added_by: string;
  added_at: string;
}

export interface ListCollaborator {
  id: string;
  list_id: string;
  user_id: string;
  invited_by: string;
  accepted: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  last_message_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  is_request_pending: boolean;
  muted: boolean;
  deleted_at: string | null;
  last_read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  shared_object_type: SharedObjectType | null;
  shared_object_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  target_type: string | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: string;
  target_id: string;
  action: ModerationActionType;
  reason: string;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Appeal {
  id: string;
  moderation_action_id: string;
  appellant_id: string;
  statement: string;
  status: AppealStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  created_at: string;
}

export interface AppealableAction {
  moderation_action_id: string;
  target_type: string;
  target_id: string;
  action: ModerationActionType;
  reason: string;
  created_at: string;
  appeal_id: string | null;
  appeal_status: AppealStatus | null;
  appeal_decision_notes: string | null;
}

export interface VinCorrectionRequest {
  id: string;
  vehicle_id: string;
  original_vin: string;
  suggested_vin: string;
  reason: string;
  evidence_urls: string[];
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  moderator_id: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  created_at: string;
}

export interface DuplicateVehicleRequest {
  id: string;
  vehicle_id_a: string;
  vehicle_id_b: string;
  reason: string;
  evidence_urls: string[];
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  moderator_id: string | null;
  decided_at: string | null;
  merged_into: string | null;
  created_at: string;
}
