import { StaffDashboard } from '../../components/StaffDashboard';
import { contentSections } from '../../data/staffSections';

const SECTIONS = contentSections('(admin)');

export default function DashboardScreen() {
  return (
    <StaffDashboard
      sections={SECTIONS}
      roleTitle="Administrator"
      description="Manage campus orientation information, schedules, contacts, announcements and FAQs from one place."
      statusText="All management tools are available"
      sectionTitle="Manage everything students see"
      footerText="Administration for the School of IT"
      profileHref="/(admin)/profile"
    />
  );
}
