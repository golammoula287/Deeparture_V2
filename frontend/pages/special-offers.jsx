import DiscoveryPage from '@/src/components/customer/DiscoveryPage';
import { discoveryProps } from '@/src/lib/customer/discovery';

export default function SpecialOffers(props) {
  return <DiscoveryPage {...props} />;
}

SpecialOffers.customerPage = true;
export const getServerSideProps = context => discoveryProps(context, true);
