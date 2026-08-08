/**
 * Exists only to carry metadata. page.js is a client component and client
 * components cannot export metadata, so the tag has to live in a layout.
 *
 * NOT IN THE ORIGINAL noindex LIST — see the commit message. A password reset
 * form is a utility surface with nothing to index, and it was indexable by
 * default simply because nobody had said otherwise.
 */
export const metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }) {
  return children;
}
