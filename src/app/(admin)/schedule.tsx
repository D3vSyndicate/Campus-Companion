import { scheduleConfig } from '../../components/manage/configs';
import { ManageScreen } from '../../components/manage/ManageScreen';

export default function AdminScheduleScreen() {
  return <ManageScreen config={scheduleConfig} />;
}
