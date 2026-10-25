import { createHash } from 'node:crypto';

export interface Notice {
  version: string;
  title: string;
  paragraphs: string[];
  consentLabel: string;
  // Set to true only after counsel has approved this exact wording. Production refuses applications under unapproved notices.
  legalApproved: boolean;
}

// RULE: never edit the text of a published version. Add a new version at the end instead, so every consent
// record points at wording that can be reproduced exactly.
export const NOTICES: Notice[] = [
  {
    version: 'v1-draft',
    title: 'How your application is used',
    paragraphs: [
      'Software helps the hiring team by extracting and organizing evidence from what you submit. People, not software, make hiring decisions.',
      'Your details are used only for this application.',
    ],
    consentLabel: 'I understand and agree to my application being processed this way.',
    legalApproved: false,
  },
];

export const CURRENT_NOTICE: Notice = NOTICES[NOTICES.length - 1];

export function getNotice(version: string): Notice | undefined {
  return NOTICES.find((n) => n.version === version);
}

// Stored with each consent record so what the candidate agreed to can be proven later.
export function noticeHash(notice: Notice): string {
  return createHash('sha256').update(JSON.stringify([notice.version, notice.title, notice.paragraphs, notice.consentLabel])).digest('hex');
}

// What the public page may show: no internal flags.
export function publicNotice(notice: Notice) {
  return { version: notice.version, title: notice.title, paragraphs: notice.paragraphs, consentLabel: notice.consentLabel };
}
