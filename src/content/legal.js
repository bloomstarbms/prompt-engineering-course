/**
 * The legal documents, authored by the site owner and stored as markdown.
 *
 * Rendered by LessonBody, the same renderer the lessons use — it already
 * supports the exact subset these use (headings, tables, lists, bold, code,
 * rules) and gained inline links for this.
 *
 * ─── WHAT WAS CHANGED FROM THE SUPPLIED DRAFTS, AND WHY ──────────────────
 * Nothing substantive. Four categories of edit, all reported:
 *
 *  1. The "DRAFT — not legal advice, have a practitioner review" banner at the
 *     top of each document was removed. It is addressed to the site owner, not
 *     to the reader; publishing it would tell 814 users their privacy policy is
 *     unfinished.
 *
 *  2. Author-instruction TODOs were removed — the ones that tell the owner to
 *     go and confirm something rather than mark a value to be filled in. That
 *     includes the note in Security about a past exposure of certificate holder
 *     names and emails. Publishing an internal note about a possible breach
 *     inside a live privacy policy is a legal decision and not a wiring one.
 *     VALUE placeholders are kept and remain visible: [DATE], the controller
 *     name, the Supabase region, the retention period, contact addresses.
 *
 *  3. In Terms section 11 the Privacy Policy linked to https://claude.ai/privacy
 *     — a paste artifact. Repointed at /privacy.
 *
 *  4. Malformed markdown links (`[www.prompten.xyz**](https://...**)`) fixed.
 *
 * The document titles and "Last updated" lines live in the page components so
 * they render as real headings rather than markdown.
 */

export const PRIVACY_MD = `## 1. Who we are

Prompten ("we", "us") operates the website at [www.prompten.xyz](https://www.prompten.xyz), a free self-paced course in prompt engineering.

- **Data controller:** [TODO — your name or registered entity]
- **Contact for privacy matters:** privacy@prompten.xyz
- **Location:** Nigeria

If you have a question about this policy or about your data, email the address above. We aim to respond within 30 days.

---

## 2. What we collect, and why

We collect only what the course needs to work. We do not sell data, we do not run advertising, and we do not use third-party trackers.

### When you create an account

| Data | Why |
|---|---|
| Email address | To identify your account, sign you in, and recover access |
| Password | To secure your account. It is hashed by our authentication provider; we never see or store the plain text |
| Display name | Shown in the app and printed on your certificate |
| Optional bio and avatar URL | Only if you choose to add them to your profile |

### As you use the course

| Data | Why |
|---|---|
| Lessons you have completed | To save your progress and let you resume |
| Quiz scores | To track completion and determine certificate eligibility |
| Last lesson visited | To return you to where you stopped |
| Usage events (event type, timestamp, and your name and email) | To understand how the course is used and where people get stuck |

### When you earn a certificate

| Data | Why |
|---|---|
| Your name, score, grade, issue date, and a unique credential ID | To issue and verify the certificate |

---

## 3. Certificates are publicly verifiable — please read this

Every certificate has a verification page at \`www.prompten.xyz/verify/<credential-ID>\`.

**Anyone who has that link can see the name on the certificate, the score, the grade, and the issue date.** That is the purpose of the page — it lets an employer confirm a certificate is real.

- Your **email address is never shown** on the verification page.
- Verification pages are marked \`noindex\`, so search engines are instructed not to list them.
- The link is not secret. If you share it — for example on LinkedIn — anyone with the link can view it.

If you would prefer your certificate not to be publicly verifiable, email privacy@prompten.xyz and we will remove it.

---

## 4. Our lawful basis for processing

Under section 25 of the NDPA, we rely on:

- **Contract** — for your account, progress and certificate. We cannot provide the course without this data.
- **Consent** — for optional profile fields, and for any future emails. You may withdraw consent at any time.
- **Legitimate interest** — for basic usage analytics, to improve the course. This is limited and you may object.

---

## 5. Where your data is stored, and cross-border transfer

Our database and authentication are provided by **Supabase**, and the site is hosted by **Vercel**. Both are outside Nigeria; our database is located in **[TODO — Supabase project region]**.

This means your personal data is transferred outside Nigeria. Under sections 41–43 of the NDPA we rely on the contractual protections in our agreements with these providers, which require them to protect your data to a standard comparable to the NDPA.

---

## 6. Cookies and local storage

**We do not use cookies for tracking or advertising.**

To keep you signed in, we store an authentication token in your browser's local storage. This is strictly necessary for the site to function — without it you would be signed out on every page. It contains no advertising or tracking identifiers, and it is removed when you sign out.

We use no analytics cookies, no advertising cookies, and no third-party trackers.

---

## 7. How long we keep it

- **Account, profile and progress** — until you delete your account.
- **Certificates** — indefinitely, unless you ask us to remove yours, because a certificate that stops verifying is worthless.
- **Usage events** — [TODO — retention period]

When you ask us to delete your account, we delete your profile, progress and usage events. Tell us if you also want your certificate removed.

---

## 8. Your rights

Under the NDPA you have the right to:

- **Access** the personal data we hold about you
- **Correct** anything inaccurate
- **Delete** your data ("right to erasure")
- **Restrict or object to** processing
- **Portability** — receive your data in a usable format
- **Withdraw consent** at any time, where we rely on consent
- **Not be subject** to solely automated decisions with legal or similarly significant effects. We make none.

To exercise any of these, email **privacy@prompten.xyz**. We will respond within 30 days and will not charge you.

**If you are unhappy with how we handle your data,** you may complain to the Nigeria Data Protection Commission (NDPC) at [ndpc.gov.ng](https://ndpc.gov.ng).

---

## 9. If you are in the UK or EU

If you access the course from the UK or EU, the UK GDPR or EU GDPR may also apply. The rights in section 8 are substantially the same, and you may complain to your national supervisory authority as well as, or instead of, the NDPC.

---

## 10. Security

We protect your data with:

- Encrypted connections (HTTPS) throughout
- Row-level access controls, so one account cannot read another's data
- Passwords hashed by our authentication provider — we never store or see them
- Server-side issuing of certificates, so they cannot be fabricated by a browser

No system is perfectly secure. If we discover a personal data breach we will report it to the NDPC within 72 hours of becoming aware of it, and will notify you directly where the risk to you is high, as required by the GAID.

---

## 11. Children

This course is intended for adults. You must be **18 or older** to create an account.

Under the NDPA, processing a child's data requires verifiable parental consent, which we are not set up to obtain. If you believe someone under 18 has created an account, email privacy@prompten.xyz and we will delete it.

---

## 12. Changes to this policy

If we change this policy we will update the date at the top. If the change materially affects your rights we will tell you by email before it takes effect.

---

## 13. Contact

**privacy@prompten.xyz**
`;

export const TERMS_MD = `## 1. Agreement

By using [www.prompten.xyz](https://www.prompten.xyz) you agree to these terms. If you don't agree, please don't use the site.

The site is operated by [TODO — your name or registered entity], based in Nigeria.

---

## 2. The course is free

There is no fee, no subscription, and no payment details are ever collected. We may change this in future, but any change would apply only to new enrolments, not retroactively to work you've already completed.

---

## 3. Your account

- You must be 18 or older.
- Give us an email address you actually control — it's how you recover access.
- Keep your password to yourself. You're responsible for what happens under your account.
- One account per person.
- Tell us at [TODO — contact address] if you think someone else is using your account.

We may suspend or remove an account that abuses the service, attempts to interfere with it, or is used to harass others.

---

## 4. What the certificate is — and what it isn't

Please read this section carefully. We'd rather be plain about it than have you rely on something we can't support.

**What it is:** a Certificate of Completion, issued when you finish all lessons and pass the quizzes. It confirms that you worked through this course and answered its questions correctly. It carries a unique credential ID and a public verification page.

**What it is not:**

- It is not accredited by any institution, university or professional body.
- It is not endorsed by, affiliated with, or issued in partnership with Anthropic, OpenAI, Google, or any other AI company. Where we cite their published documentation, that is citation, not association.
- It is not a proctored assessment. The course is self-paced, quizzes are taken unsupervised, and there is no limit on retries.
- It does not certify professional competence, and no one is obliged to recognise it.

We issue it because completing 26 lessons is worth marking. We describe it honestly so you can decide what it's worth to you.

---

## 5. Acceptable use

Don't:

- Copy, republish or resell the course content
- Scrape or bulk-download the site
- Try to break, overload, or gain unauthorised access to any part of it
- Interfere with anyone else's use of it
- Attempt to obtain a certificate by manipulating stored data rather than completing the course

We may remove access, and revoke a certificate, if we find it was obtained by manipulation rather than completion.

---

## 6. Who owns what

**Our content.** Lesson text, diagrams, quizzes and site design belong to us. You may read them, learn from them and use what you learn — including at work. You may not republish, redistribute or sell them, or present them as your own.

**Third-party material.** Where we cite published research papers or vendor documentation, those belong to their authors and publishers. We link to sources rather than reproduce them.

**Your content.** Anything you enter — your name, bio, avatar — remains yours. You give us permission to display it within the service and, where you've earned one, on your certificate.

---

## 7. Availability

We try to keep the site up but make no promise about it. It's a free service and may be unavailable, changed, or discontinued.

We may add, alter or remove lessons. If we add lessons, people who already completed the course under the earlier syllabus keep their certificates — we don't move the finish line retroactively.

---

## 8. No warranty

The site and course are provided "as is". We don't warrant that the content is error-free, complete, or current — the field moves quickly and material can date. Nothing here is professional advice.

To the fullest extent permitted by Nigerian law, we exclude all implied warranties.

---

## 9. Limitation of liability

To the fullest extent permitted by law, we are not liable for indirect or consequential loss, lost profits, lost opportunities, or loss arising from reliance on the course content or on a certificate.

Nothing in these terms excludes liability that cannot lawfully be excluded — including for death or personal injury caused by negligence, or for fraud.

---

## 10. Ending it

You can delete your account at any time — email [TODO — contact address]. See the Privacy Policy for what happens to your data.

We may suspend or end your access if you break these terms. We'll tell you why unless there's a good reason not to.

---

## 11. Privacy

How we handle your data is set out in our [Privacy Policy](/privacy), which forms part of these terms.

---

## 12. Changes

We may update these terms. The date at the top will change. If a change materially affects you, we'll tell you by email before it takes effect. Continuing to use the site after that means you accept the change.

---

## 13. Governing law

These terms are governed by the laws of the Federal Republic of Nigeria, and the Nigerian courts have jurisdiction.

---

## 14. Contact

[TODO — contact address, e.g. hello@prompten.xyz]
`;
