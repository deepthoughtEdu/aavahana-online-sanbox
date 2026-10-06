// src/app/examples/page.tsx
import { ContextMenuExample } from '@/components/shared/examples/ContextMenuExample';

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="container mx-auto py-8">
        <ContextMenuExample />
      </div>
    </div>
  );
}
