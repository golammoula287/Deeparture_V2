import { SearchDesignPreview } from '@/src/components/customer/DesignPreview';
import { previewPageAccess } from '@/src/lib/phase4/previewData';

export default SearchDesignPreview;
SearchDesignPreview.designPreview = true;

export function getServerSideProps({ res }) {
  return previewPageAccess(res) ? { props: {} } : { notFound: true };
}
