import type {
  ActivityRegistration,
  AssessmentResult,
  AssessmentSummary,
} from "@/components/reflective-assessment/types";
import type { McqBlockData } from "./data/types";
import McqQuestion from "./activities/McqQuestion";

function extractSummary(
  questionIndex: number,
  result: AssessmentResult
): AssessmentSummary {
  const c = result.choices as {
    selectedOption: string;
    weight: number;
    gridCells: string[];
  };

  const weight = c.weight || 0;
  let color: string;
  let label: string;
  if (weight >= 8) {
    color = "text-emerald-400";
    label = "Strong shift";
  } else if (weight >= 5) {
    color = "text-amber-400";
    label = "Moderate";
  } else {
    color = "text-red-400";
    label = "Low shift";
  }

  return {
    headline: `Q${questionIndex + 1}`,
    value: `${weight}/10`,
    score: weight,
    sub: label,
    color,
    pairs: (c.gridCells || []).map((cell) => ({
      label: cell.replace("-", " × "),
      value: weight,
      color: weight >= 8 ? "bg-emerald-500" : weight >= 5 ? "bg-amber-500" : "bg-red-500",
    })),
  };
}

export function createBlockActivities(
  block: McqBlockData
): ActivityRegistration[] {
  return block.questions.map((question, i) => ({
    meta: {
      id: question.id,
      name: `Question ${i + 1}`,
      subtitle: question.prompt.length > 80
        ? question.prompt.slice(0, 77) + "..."
        : question.prompt,
      landingLine: "",
      shift: block.framework,
    },
    component: (props: {
      onComplete: (result: AssessmentResult) => void;
      savedResult?: AssessmentResult;
    }) => {
      const McqQuestionComponent = McqQuestion as React.ComponentType<{
        question: typeof question;
        source: typeof block.source;
        framework: string;
        questionNumber: number;
        totalQuestions: number;
        onComplete: typeof props.onComplete;
        savedResult?: AssessmentResult;
      }>;
      return (
        <McqQuestionComponent
          question={question}
          source={block.source}
          framework={block.framework}
          questionNumber={i + 1}
          totalQuestions={block.questions.length}
          onComplete={props.onComplete}
          savedResult={props.savedResult}
        />
      );
    },
    extractSummary: (result: AssessmentResult) => extractSummary(i, result),
  }));
}
