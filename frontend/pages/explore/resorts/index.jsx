import TripFinder from '@/src/components/customer/TripFinder';
import { finderProps } from '@/src/lib/customer/finderPage';
export default TripFinder;
TripFinder.customerPage = true;
export const getServerSideProps = context => finderProps(context, true);
