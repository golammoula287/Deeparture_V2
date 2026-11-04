import { DetailDesignPreview } from '@/src/components/customer/DesignPreview';
import { previewPageAccess, previewTrips } from '@/src/lib/phase4/previewData';

export default function PreviewLiveaboard(props) { return <DetailDesignPreview {...props} />; }
PreviewLiveaboard.designPreview = true;

export function getServerSideProps({ params, res }) {
  if (!previewPageAccess(res)) return { notFound: true };
  const trip = previewTrips.find(item => item.slug === params.slug);
  return trip ? { props: { trip } } : { notFound: true };
}
