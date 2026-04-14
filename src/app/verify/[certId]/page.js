import VerifyClient from './VerifyClient';

export const metadata = {
  title: 'Verify Certificate — Prompt Engineering',
  description: 'Verify a Prompt Engineering certificate of completion.',
};

export default function VerifyPage({ params }) {
  return <VerifyClient certId={params.certId} />;
}
