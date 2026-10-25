import { CURRENT_NOTICE, NOTICES, getNotice, noticeHash } from './notices';

describe('consent notices', () => {
  it('finds published versions and rejects unknown ones', () => {
    expect(getNotice(CURRENT_NOTICE.version)).toBeDefined();
    expect(getNotice('made-up-version')).toBeUndefined();
  });

  it('has unique version labels', () => {
    expect(new Set(NOTICES.map((n) => n.version)).size).toBe(NOTICES.length);
  });

  it('hashes deterministically and changes when the wording changes', () => {
    const base = noticeHash(CURRENT_NOTICE);
    expect(noticeHash({ ...CURRENT_NOTICE })).toBe(base);
    expect(noticeHash({ ...CURRENT_NOTICE, paragraphs: [...CURRENT_NOTICE.paragraphs, 'Extra sentence.'] })).not.toBe(base);
  });
});
