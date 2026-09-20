import { EmergencyContacts } from '../components/EmergencyContacts';

// Opens from the sign-in page, so someone who cannot log in can still reach help.
export default function EmergencyScreen() {
  return <EmergencyContacts standalone />;
}
