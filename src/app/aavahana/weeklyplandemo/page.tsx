import type { Metadata } from 'next';
import { WeeklyPlanDemo } from './_components/WeeklyPlanDemo';

export const metadata: Metadata = {
  title: 'Weekly Plan Demo',
  description: 'V1/V2/V3 weekly plan transformation arc — demo with sample data',
};

export default function WeeklyPlanDemoPage() {
  return <WeeklyPlanDemo />;
}
