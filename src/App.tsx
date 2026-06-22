import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import IntakeWizard from './pages/Intake/IntakeWizard';
import ClassificationPage from './pages/Classification/ClassificationPage';
import QualificationPage from './pages/Qualification/QualificationPage';
import ScoringPage from './pages/Scoring/ScoringPage';
import DiscoveryWorkspace from './pages/Discovery/DiscoveryWorkspace';
import PRDCreationPage from './pages/PRD/PRDCreationPage';
import SolutionPage from './pages/Solution/SolutionPage';
import ROICalculator from './pages/ROI/ROICalculator';
import PrioritizationBoard from './pages/Prioritization/PrioritizationBoard';
import PodAllocationPage from './pages/PodAllocation/PodAllocationPage';
import SprintReadinessPage from './pages/SprintReadiness/SprintReadinessPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
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
        <Route path="/prd" element={<PRDCreationPage />} />
        <Route path="/solution" element={<SolutionPage />} />
        <Route path="/roi" element={<ROICalculator />} />
        <Route path="/prioritization" element={<PrioritizationBoard />} />
        <Route path="/pods" element={<PodAllocationPage />} />
        <Route path="/sprint-readiness" element={<SprintReadinessPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
