import { useStore } from '../state/store';
import type { PipelineStage } from '../models/types';

type PipelineConfigStage = {
  name: string;
  route: string;
  status: PipelineStage;
  aliases: string[];
};

const pipelineStages: PipelineConfigStage[] = [
  { name: 'Intake', route: '/intake', status: 'Submitted', aliases: ['Submitted'] },
  { name: 'Classification', route: '/classification', status: 'Classified', aliases: ['Classified'] },
  { name: 'Qualification', route: '/qualification', status: 'Qualified', aliases: ['Qualified'] },
  { name: 'Scoring', route: '/scoring', status: 'Scored', aliases: ['Scored'] },
  { name: 'Discovery', route: '/discovery', status: 'Discovery', aliases: [] },
  { name: 'PDD Creation', route: '/pdd', status: 'PDD Creation', aliases: ['PRD Creation'] },
  { name: 'A2B Readiness Check', route: '/a2b', status: 'A2B Readiness Check', aliases: ['A2B'] },
  { name: 'SDD Creation', route: '/sdd', status: 'SDD Creation', aliases: ['Solution Design', 'Solution Designed'] },
  { name: 'ROI Approved', route: '/roi', status: 'ROI Approved', aliases: ['ROI'] },
  { name: 'Prioritized', route: '/prioritization', status: 'Prioritized', aliases: ['Prioritization'] },
  { name: 'Pod Allocated', route: '/pods', status: 'Pod Allocated', aliases: ['Pod Allocation'] },
  { name: 'Sprint Ready', route: '/sprint-readiness', status: 'Sprint Ready', aliases: ['Sprint Readiness'] },
];

const stageByName = new Map(
  pipelineStages.flatMap((stage) => [
    [stage.name, stage] as const,
    [stage.status, stage] as const,
    ...stage.aliases.map((alias) => [alias, stage] as const),
  ])
);

const stageByRoute = new Map(pipelineStages.map((stage) => [stage.route, stage]));

const getConfiguredStages = () => {
  const { stages } = useStore.getState();

  if (!stages || stages.length === 0) return pipelineStages.map((stage) => ({ ...stage, isEnabled: true }));

  return stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((configuredStage) => {
      const stage = stageByName.get(configuredStage.name);
      return stage ? { ...stage, isEnabled: configuredStage.isEnabled } : null;
    })
    .filter((stage): stage is PipelineConfigStage & { isEnabled: boolean } => Boolean(stage));
};

export const getEnabledPipelineStages = () => {
  return getConfiguredStages().filter((stage) => stage.isEnabled);
};

export const getEnabledPipelineStageStatuses = (): PipelineStage[] => {
  return getEnabledPipelineStages().map((stage) => stage.status);
};

const getNextEnabledStage = (currentStageName: string) => {
  const currentStage = stageByName.get(currentStageName);
  if (!currentStage) return null;

  const configuredStages = getConfiguredStages();
  const currentIndex = configuredStages.findIndex((stage) => stage.name === currentStage.name);

  if (currentIndex === -1) return null;

  return configuredStages.slice(currentIndex + 1).find((stage) => stage.isEnabled) ?? null;
};

export const getNextStageRoute = (currentStageName: string): string => {
  return getNextEnabledStage(currentStageName)?.route ?? '/dashboard';
};

export const getNextStageStatus = (currentStageName: string): PipelineStage => {
  return getNextEnabledStage(currentStageName)?.status ?? 'Sprint Ready';
};

export const getStageStatus = (stageName: string): PipelineStage | null => {
  return stageByName.get(stageName)?.status ?? null;
};

export const getStageStatusByRoute = (route: string): PipelineStage | null => {
  return stageByRoute.get(route)?.status ?? null;
};

export const getStageRoute = (stageName: string): string => {
  return stageByName.get(stageName)?.route ?? '/dashboard';
};
