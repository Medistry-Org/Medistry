/** Question 6: what the patient has tried before (many answers; a first attempt clears the rest). */

import { EXPERIENCES } from "../onboardingOptions";
import AnswerOptions from "./AnswerOptions";

export default function ExperienceStep({ selected, onToggle }: { selected: string[]; onToggle: (code: string) => void }) {
  return <AnswerOptions label="Previous experience" multi options={EXPERIENCES.map((e) => ({ value: e.code, label: e.label }))} selected={selected} onToggle={onToggle} />;
}
