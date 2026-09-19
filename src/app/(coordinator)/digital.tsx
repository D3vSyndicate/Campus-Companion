import { readinessModuleConfig } from '../../components/manage/configs';
import { ManageScreen } from '../../components/manage/ManageScreen';

export default function DigitalModulesScreen() {
  return <ManageScreen config={readinessModuleConfig} />;
}
