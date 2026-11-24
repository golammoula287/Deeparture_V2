import TripSelectionUnavailable from '@/src/components/customer/TripSelectionUnavailable';
import { tripSelectionProps } from '@/src/lib/customer/tripSelection';

export default TripSelectionUnavailable;
export const getServerSideProps = tripSelectionProps('offers');
