import { readinessStepConfig } from '../../components/manage/configs';
import { ManageScreen } from '../../components/manage/ManageScreen';

export default function DigitalStepsScreen() {
  return <ManageScreen config={readinessStepConfig} />;
}
