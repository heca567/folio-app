/**
 * Security Rules Verification Suite for Folio (Folders & Notes)
 * Verifies the "Dirty Dozen" adversarial payloads against firestore.rules.
 * Intended for execution with @firebase/rules-unit-testing against the Firestore Emulator.
 */

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Unauthenticated access to folders and notes is denied',
    operation: 'create/list',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Unverified email user cannot write folders or notes',
    operation: 'create',
    auth: { uid: 'user_a', token: { email_verified: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Identity spoofing (userId != auth.uid) is denied',
    operation: 'create',
    auth: { uid: 'attacker', token: { email_verified: true } },
    payload: { id: 'folder_1', userId: 'victim', name: 'Hijack', color: '#1E3A5F', icon: 'folder' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Cross-tenant get/list of another user document is denied',
    operation: 'get/list',
    auth: { uid: 'attacker', token: { email_verified: true } },
    targetOwner: 'victim',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Creating note referencing nonexistent or foreign folderId is denied',
    operation: 'create',
    auth: { uid: 'user_a', token: { email_verified: true } },
    payload: { folderId: 'foreign_or_missing_folder' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Shadow field injection (ghost field isAdmin) is denied',
    operation: 'create/update',
    auth: { uid: 'user_a', token: { email_verified: true } },
    payload: { isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. ID poisoning (invalid characters or > 128 chars) is denied',
    operation: 'create',
    auth: { uid: 'user_a', token: { email_verified: true } },
    documentId: 'bad id with spaces/../etc',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Mutating immutable userId or createdAt on update is denied',
    operation: 'update',
    auth: { uid: 'user_a', token: { email_verified: true } },
    payload: { userId: 'other_user' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Client-forged timestamp not matching request.time is denied',
    operation: 'create',
    auth: { uid: 'user_a', token: { email_verified: true } },
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Invalid writing stage enum value is denied',
    operation: 'update',
    auth: { uid: 'user_a', token: { email_verified: true } },
    payload: { stage: 'INVALID_STAGE' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Unbounded tags list (> 20 items) or oversized title (> 200 chars) is denied',
    operation: 'create',
    auth: { uid: 'user_a', token: { email_verified: true } },
    payload: { tagsCount: 25, titleLength: 250 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Cross-tenant delete is denied',
    operation: 'delete',
    auth: { uid: 'attacker', token: { email_verified: true } },
    targetOwner: 'victim',
    expected: 'PERMISSION_DENIED',
  },
] as const;
