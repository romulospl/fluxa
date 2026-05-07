import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './react-swagger';
import { notFound } from 'next/navigation';

export default async function IndexPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const spec = await getApiDocs();
  return (
    <section className="container p-8">
      <ReactSwagger spec={spec} />
    </section>
  );
}
