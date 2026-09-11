import { ScenarioSelector } from '@/components/scenario/ScenarioSelector';
import { TopNavBar } from '@/components/game/TopNavBar';

const ScenariosPage = () => {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopNavBar />

      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <ScenarioSelector />
        </div>
      </div>
    </div>
  );
};

export default ScenariosPage;
