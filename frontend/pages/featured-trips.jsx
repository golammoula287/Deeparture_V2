import DiscoveryPage from '@/src/components/customer/DiscoveryPage';
import { discoveryProps } from '@/src/lib/customer/discovery';

export default function FeaturedTrips(props) {
  return <DiscoveryPage {...props} />;
}

FeaturedTrips.customerPage = true;
export const getServerSideProps = context => discoveryProps(context);
