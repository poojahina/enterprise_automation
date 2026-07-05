import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './state/store';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import IntakeWizard from './pages/Intake/IntakeWizard';
import ClassificationPage from './pages/Classification/ClassificationPage';
import QualificationPage from './pages/Qualification/QualificationPage';
import ScoringPage from './pages/Scoring/ScoringPage';
import DiscoveryWorkspace from './pages/Discovery/DiscoveryWorkspace';
import PDDCreationPage from './pages/PDD/PDDCreationPage';
import A2BReadinessPage from './pages/A2B/A2BReadinessPage';
import SolutionPage from './pages/Solution/SolutionPage';
import UserStoriesPage from './pages/UserStories/UserStoriesPage';
import ROICalculator from './pages/ROI/ROICalculator';
import PrioritizationBoard from './pages/Prioritization/PrioritizationBoard';
import PodAllocationPage from './pages/PodAllocation/PodAllocationPage';
import SprintReadinessPage from './pages/SprintReadiness/SprintReadinessPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import StageConfigPanel from './pages/Settings/StageConfigPanel';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const { fetchOpportunities, fetchStages } = useStore();

  useEffect(() => {
    fetchOpportunities().catch((error) => console.error('Failed to load opportunities', error));
    fetchStages().catch((error) => console.error('Failed to load stages', error));
  }, [fetchOpportunities, fetchStages]);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/intake" element={<IntakeWizard />} />
        <Route path="/classification" element={<ClassificationPage />} />
        <Route path="/qualification" element={<QualificationPage />} />
        <Route path="/scoring" element={<ScoringPage />} />
        <Route path="/discovery" element={<DiscoveryWorkspace />} />
        <Route path="/pdd" element={<PDDCreationPage />} />
        <Route path="/a2b" element={<A2BReadinessPage />} />
        <Route path="/projects/:projectId/a2b" element={<A2BReadinessPage />} />
        <Route path="/prd" element={<Navigate to="/pdd" replace />} />
        <Route path="/sdd" element={<SolutionPage />} />
        <Route path="/solution" element={<Navigate to="/sdd" replace />} />
        <Route path="/user-stories" element={<UserStoriesPage />} />
        <Route path="/roi" element={<ROICalculator />} />
        <Route path="/prioritization" element={<PrioritizationBoard />} />
        <Route path="/pods" element={<PodAllocationPage />} />
        <Route path="/sprint-readiness" element={<SprintReadinessPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/settings" element={<StageConfigPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
