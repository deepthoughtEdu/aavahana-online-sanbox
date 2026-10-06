import { FeedbackContainer } from "@/components/aavahana/feedback/FeedbackContainer";
import { PageHeader } from "@/components/shared/PageHeader";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Feedback"
        subtitle="Honest input makes people better at what they do. Upward feedback is anonymous — your identity is never revealed. Downward feedback shows strengths and stretch zones, not verdicts. The goal is growth, not judgment."
      />
      <div>
        <FeedbackContainer />
      </div>
    </div>
  );
}
