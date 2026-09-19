import { StaffDashboard } from '../../components/StaffDashboard';
import { contentSections } from '../../data/staffSections';

const SECTIONS = contentSections('(coordinator)');

export default function DashboardScreen() {
  return (
    <StaffDashboard
      sections={SECTIONS}
      roleTitle="Coordinator"
      description="Manage campus orientation content and keep first-year students informed."
      statusText="Orientation content is ready"
      sectionTitle="Keep students informed"
      footerText="Orientation management for the School of IT"
      profileHref="/(coordinator)/profile"
    />
  );
}
