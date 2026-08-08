/**
 * Renders a JSON-LD block. Server component by design — no 'use client'.
 *
 * `<` is escaped to the \\u003c sequence. JSON.stringify leaves it alone, so a string
 * containing "</script>" would otherwise close the tag early and inject
 * markup. None of the current data is user-supplied, but lesson titles and
 * intros flow through here and the cost of the guard is one replace.
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
