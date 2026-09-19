import { FaqBrowser } from '../../components/FaqBrowser';

// Buddies can also share an answer straight to a student, or suggest one that is missing.
export default function BuddyAnswers() {
  return <FaqBrowser canShare canSuggest />;
}
