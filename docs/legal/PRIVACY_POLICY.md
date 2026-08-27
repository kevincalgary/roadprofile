> **DRAFT — NOT LEGAL ADVICE.** This is a placeholder for professional legal review before publication. It is written to reflect what RoadProfile's code actually does (see cross-references), not the other way around — legal counsel should verify both the accuracy and the legal sufficiency of every section.

# RoadProfile Privacy Policy (Draft)

_Last updated: [DATE] — replace before publishing_

## 1. What RoadProfile is

RoadProfile is a public, crowdsourced vehicle-history platform. Vehicle profiles, VINs, and the history records contributed to them are public by design — this is core to the product and is disclosed to users before they create an account (`app/(auth)/sign-up.tsx`) and again before they create a vehicle profile (`app/vehicle/new.tsx`).

## 2. Information we collect

| Category | Examples | Public? |
|---|---|---|
| Account information | Email address, password (hashed by Supabase Auth) | Never shown publicly |
| Profile information | Username, display name, avatar, general location (city/region), bio | Public |
| Contributed content | Vehicle records, comments, replies, photos, documents | Public |
| Private messages | One-to-one messages with other users | Private to participants |
| Usage data | Recently viewed vehicles/users/lists (`recently_viewed` table) | Private to the user |
| Device data | Push notification token, if notifications are enabled | Private |

We do not collect government ID numbers, payment information, or precise (GPS-level) location. The product deliberately keeps location fields to city/region text (`vehicle records: location_text`) and strips GPS/EXIF metadata from uploaded photos and documents on upload (`lib/api/uploads.ts`, `compressImage`).

## 3. What we never do

- We never use a VIN to expose a person's name, home address, phone number, or private ownership records. RoadProfile has no license-plate lookup and no connection to DMV/title databases.
- We never sell VIN search results tied to personal identity.
- We never expose a user's email address publicly.

## 4. How contributed content is used

Vehicle records, comments, and revision history are permanent and public, including after a contributor deletes their account — see Section 7. This is disclosed before publishing (`app/vehicle/new.tsx`, `app/record/new.tsx`).

## 5. Third parties

- **Supabase** (database, authentication, file storage, realtime messaging) — see [Supabase's privacy policy].
- **Expo** (push notification delivery via Expo's push service) — see [Expo's privacy policy].
- A future licensed VIN-decode provider may be added (see `lib/services/vin-provider.ts`); none is active today, and none is called with any of your account data.

## 6. Your controls

- **Download your data**: `app/(app)/account/download-data.tsx` exports your account, profile, contributions, comments, lists, follows, bookmarks, and sent messages as a JSON file.
- **Notification preferences**: `app/(app)/account/notification-settings.tsx`.
- **Message privacy**: choose who can start a conversation with you (`app/(app)/account/message-privacy.tsx`).
- **Blocking**: blocking a user prevents them from messaging, following, or mentioning you (`app/(app)/account/blocked-users.tsx`).

## 7. Account deletion

Deleting your account (`app/(app)/account/delete-account.tsx`) permanently removes your login, private account settings, drafts, private messages, and follow relationships. Your public profile is anonymized (username replaced, display name set to "Deleted user," avatar/bio/location cleared) rather than deleted, because your vehicle-history contributions remain part of the public record other users rely on — this mirrors how the product is described at signup. [Counsel: confirm this satisfies applicable right-to-erasure obligations, or specify additional redaction steps required.]

## 8. Cookies / analytics

No analytics or advertising SDKs are integrated by default. If added, this section must be updated to disclose them and, where required, obtain consent before they load.

## 9. Children

RoadProfile requires users to confirm a minimum age at signup. [Counsel: finalize the exact age threshold and any additional verification required for your target markets.]

## 10. Changes to this policy

[Standard change-notice language — finalize with counsel.]

## 11. Contact

[Insert legal entity name, address, and privacy contact email.]
