import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Download, Sparkles } from 'lucide-react';
import AnimatedCard from '../../components/shared/AnimatedCard';
import { useStore } from '../../state/store';

const UserStoriesPage: React.FC = () => {
  const { opportunities, selectedOpportunityId, setSelectedOpportunityId } = useStore();
  const [selectedId, setSelectedId] = useState(selectedOpportunityId ?? opportunities.find(o => o.backlogItems.length)?.id ?? opportunities[0]?.id ?? '');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const opp = opportunities.find(o => o.id === selectedId);
  const stories = opp?.backlogItems ?? [];

  useEffect(() => {
    if (opportunities.length && !opportunities.some(o => o.id === selectedId)) setSelectedId(opportunities[0].id);
  }, [opportunities, selectedId]);

  useEffect(() => {
    if (selectedId) setSelectedOpportunityId(selectedId);
  }, [selectedId, setSelectedOpportunityId]);

  const generate = async () => {
    if (!opp) return;
    setGenerating(true);
    setMessage('');
    try {
      await useStore.getState().runWorkflowAction(opp.id, 'generate-backlog');
      setMessage('User stories generated and saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate user stories.');
    } finally {
      setGenerating(false);
    }
  };

  const exportStories = async () => {
    if (!opp) return;
    const response = await fetch(`/api/documents/${opp.id}/sprint-backlog/export`);
    if (!response.ok) return setMessage('User story export failed.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `${opp.id}-user-stories.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="user-stories-page">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600"><BookOpen className="w-4 h-4 text-white" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">User Story Creation</h1>
          <p className="max-w-3xl text-sm text-gray-300">
            Generate detailed user stories and acceptance criteria from use case or requirement
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Opportunity:</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200">
          {opportunities.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.id} - {o.processName}</option>)}
        </select>
        <button onClick={generate} disabled={!opp || generating} className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50">
          <Sparkles className="w-4 h-4" />{generating ? 'Generating...' : stories.length ? 'Regenerate User Stories' : 'Generate User Stories'}
        </button>
        <button onClick={exportStories} disabled={!stories.length} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm disabled:opacity-40"><Download className="w-4 h-4" />Export</button>
      </div>
      {message && <p className="text-sm text-blue-300">{message}</p>}

      {stories.length ? <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {stories.map(story => (
          <AnimatedCard key={story.jiraKey}>
            <div className="flex items-start justify-between gap-3">
              <div><span className="text-[10px] text-violet-400 font-bold">{story.jiraKey} · {story.type}</span><h3 className="text-sm font-semibold text-white mt-1">{story.title}</h3></div>
              <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded">{story.storyPoints} SP</span>
            </div>
            <p className="text-sm text-gray-300 mt-3 leading-relaxed"><strong className="text-gray-200">Story:</strong> As a business user, I want {story.description.charAt(0).toLowerCase() + story.description.slice(1)} so that the process is reliable, traceable, and efficient.</p>
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs font-semibold text-gray-300 mb-2">Acceptance criteria</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                {(story.acceptanceCriteria ?? ['Acceptance criteria require regeneration from the backend.']).map((criterion, index) => (
                  <li key={index} className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />{criterion}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 text-[10px] text-gray-400"><span>{story.priority} priority</span><span>•</span><span>{story.sprint}</span><span>•</span><span>{story.assignee}</span></div>
          </AnimatedCard>
        ))}
      </div> : <AnimatedCard><p className="text-sm text-gray-400 text-center py-8">Generate user stories after the PDD and SDD are ready.</p></AnimatedCard>}
    </div>
  );
};

export default UserStoriesPage;
