/**
 * Power Campaign Mode - Level 3: Power User
 * Full control with connection builder, advanced scheduling, and competitive insights
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Network,
  Plus,
  Settings,
  TrendingUp,
  Zap,
  BarChart3,
  Target,
  Calendar,
  Link2,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type {
  CampaignPhase,
  CampaignPiece,
  EmotionalTrigger,
  ConnectionBuilderNode,
  ConnectionBuilderEdge,
  PowerModeConfig
} from '@/types/v2';
import { uiLevelManager } from '@/services/v2/ui-level-manager.service';

export interface PowerCampaignModeProps {
  brandId: string;
  campaignId?: string;
  phases: CampaignPhase[];
  pieces: CampaignPiece[];
  onPhasesUpdate: (phases: CampaignPhase[]) => void;
  onPiecesUpdate: (pieces: CampaignPiece[]) => void;
  onConnectionCreate: (edge: ConnectionBuilderEdge) => void;
  onConnectionDelete: (edgeId: string) => void;
  competitiveData?: any;
  breakthroughScore?: number;
  className?: string;
}

export const PowerCampaignMode: React.FC<PowerCampaignModeProps> = ({
  brandId,
  campaignId,
  phases: initialPhases,
  pieces: initialPieces,
  onPhasesUpdate,
  onPiecesUpdate,
  onConnectionCreate,
  onConnectionDelete,
  competitiveData,
  breakthroughScore,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState<'arc' | 'connections' | 'insights' | 'tuning'>('arc');
  const [phases, setPhases] = React.useState<CampaignPhase[]>(initialPhases);
  const [pieces, setPieces] = React.useState<CampaignPiece[]>(initialPieces);
  const [connections, setConnections] = React.useState<ConnectionBuilderEdge[]>([]);
  const [config] = React.useState<PowerModeConfig>(uiLevelManager.getPowerModeConfig());
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPhases(initialPhases);
  }, [initialPhases]);

  React.useEffect(() => {
    setPieces(initialPieces);
  }, [initialPieces]);

  const handleAddPhase = () => {
    if (!config.showAllControls) return;

    const newPhase: CampaignPhase = {
      id: crypto.randomUUID(),
      name: `Phase ${phases.length + 1}`,
      dayNumber: phases.length + 1,
      emotionalTrigger: 'trust',
      objective: '',
      contentType: 'mixed'
    };

    const updatedPhases = [...phases, newPhase];
    setPhases(updatedPhases);
    onPhasesUpdate(updatedPhases);

    // Track usage
    uiLevelManager.updateUsageStats(brandId, {
      advancedFeaturesUsed: 1
    } as any);
  };

  const handleDeletePhase = (phaseId: string) => {
    const updatedPhases = phases.filter(p => p.id !== phaseId);
    setPhases(updatedPhases);
    onPhasesUpdate(updatedPhases);
  };

  const handlePhaseUpdate = (phaseId: string, updates: Partial<CampaignPhase>) => {
    const updatedPhases = phases.map(p =>
      p.id === phaseId ? { ...p, ...updates } : p
    );
    setPhases(updatedPhases);
    onPhasesUpdate(updatedPhases);
  };

  const handleAddConnection = (source: string, target: string, type: ConnectionBuilderEdge['type']) => {
    if (!config.enableManualConnections) return;

    const newConnection: ConnectionBuilderEdge = {
      id: crypto.randomUUID(),
      source,
      target,
      type,
      strength: 100
    };

    setConnections([...connections, newConnection]);
    onConnectionCreate(newConnection);

    // Track usage
    uiLevelManager.updateUsageStats(brandId, {
      advancedFeaturesUsed: 1
    } as any);
  };

  const handleDeleteConnection = (edgeId: string) => {
    setConnections(connections.filter(c => c.id !== edgeId));
    onConnectionDelete(edgeId);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Power User Mode
          </h2>
          <p className="text-sm text-muted-foreground">
            Full control over campaign architecture, connections, and optimization
          </p>
        </div>

        {config.showAdvancedAnalytics && breakthroughScore !== undefined && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Breakthrough Score</div>
            <div className="text-3xl font-bold text-primary">{breakthroughScore}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <TabButton
            active={activeTab === 'arc'}
            onClick={() => setActiveTab('arc')}
            icon={<Target />}
            label="Campaign Arc"
          />
          {config.enableManualConnections && (
            <TabButton
              active={activeTab === 'connections'}
              onClick={() => setActiveTab('connections')}
              icon={<Network />}
              label="Connections"
            />
          )}
          {config.showCompetitiveData && competitiveData && (
            <TabButton
              active={activeTab === 'insights'}
              onClick={() => setActiveTab('insights')}
              icon={<TrendingUp />}
              label="Competitive Insights"
            />
          )}
          {config.enableBreakthroughTuning && (
            <TabButton
              active={activeTab === 'tuning'}
              onClick={() => setActiveTab('tuning')}
              icon={<Settings />}
              label="Score Tuning"
            />
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'arc' && (
          <CampaignArcEditor
            phases={phases}
            pieces={pieces}
            onAddPhase={handleAddPhase}
            onDeletePhase={handleDeletePhase}
            onPhaseUpdate={handlePhaseUpdate}
            config={config}
          />
        )}

        {activeTab === 'connections' && config.enableManualConnections && (
          <ConnectionBuilder
            phases={phases}
            pieces={pieces}
            connections={connections}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        )}

        {activeTab === 'insights' && config.showCompetitiveData && competitiveData && (
          <CompetitiveInsights data={competitiveData} />
        )}

        {activeTab === 'tuning' && config.enableBreakthroughTuning && (
          <ScoreTuning
            currentScore={breakthroughScore || 0}
            phases={phases}
            pieces={pieces}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Tab Button Component
 */
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
        active
          ? 'border-primary text-primary font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      <span>{label}</span>
    </button>
  );
};

/**
 * Campaign Arc Editor Component
 */
interface CampaignArcEditorProps {
  phases: CampaignPhase[];
  pieces: CampaignPiece[];
  onAddPhase: () => void;
  onDeletePhase: (phaseId: string) => void;
  onPhaseUpdate: (phaseId: string, updates: Partial<CampaignPhase>) => void;
  config: PowerModeConfig;
}

const CampaignArcEditor: React.FC<CampaignArcEditorProps> = ({
  phases,
  pieces,
  onAddPhase,
  onDeletePhase,
  onPhaseUpdate,
  config
}) => {
  const [expandedPhase, setExpandedPhase] = React.useState<string | null>(null);

  const getPiecesForPhase = (phaseId: string) => {
    return pieces.filter(p => p.phaseId === phaseId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campaign Phases</h3>
        {phases.length < config.maxCustomPhases && (
          <button
            onClick={onAddPhase}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Phase
          </button>
        )}
      </div>

      {/* Phases List */}
      <div className="space-y-3">
        {phases.map((phase, index) => (
          <div key={phase.id} className="border rounded-lg overflow-hidden">
            {/* Phase Header */}
            <button
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedPhase === phase.id ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="text-left">
                  <div className="font-medium">{phase.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Day {phase.dayNumber} • {phase.emotionalTrigger} • {getPiecesForPhase(phase.id).length} pieces
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhase(phase.id);
                }}
                className="p-2 hover:bg-red-100 text-red-600 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </button>

            {/* Phase Details */}
            {expandedPhase === phase.id && (
              <div className="p-4 border-t space-y-4 bg-muted/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phase Name</label>
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => onPhaseUpdate(phase.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Day Number</label>
                    <input
                      type="number"
                      value={phase.dayNumber}
                      onChange={(e) => onPhaseUpdate(phase.id, { dayNumber: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emotional Trigger</label>
                    <select
                      value={phase.emotionalTrigger}
                      onChange={(e) => onPhaseUpdate(phase.id, { emotionalTrigger: e.target.value as EmotionalTrigger })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="trust">Trust</option>
                      <option value="fear">Fear</option>
                      <option value="urgency">Urgency</option>
                      <option value="hope">Hope</option>
                      <option value="curiosity">Curiosity</option>
                      <option value="authority">Authority</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content Type</label>
                    <input
                      type="text"
                      value={phase.contentType}
                      onChange={(e) => onPhaseUpdate(phase.id, { contentType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Objective</label>
                  <textarea
                    value={phase.objective}
                    onChange={(e) => onPhaseUpdate(phase.id, { objective: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md resize-none"
                    placeholder="What is the goal of this phase?"
                  />
                </div>

                {/* Pieces for this phase */}
                {getPiecesForPhase(phase.id).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Content Pieces ({getPiecesForPhase(phase.id).length})</div>
                    <div className="space-y-2">
                      {getPiecesForPhase(phase.id).map(piece => (
                        <div key={piece.id} className="flex items-center gap-2 text-sm p-2 bg-card rounded border">
                          <span className="font-medium">{piece.title}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{piece.channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Connection Builder Component
 */
interface ConnectionBuilderProps {
  phases: CampaignPhase[];
  pieces: CampaignPiece[];
  connections: ConnectionBuilderEdge[];
  onAddConnection: (source: string, target: string, type: ConnectionBuilderEdge['type']) => void;
  onDeleteConnection: (edgeId: string) => void;
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const ConnectionBuilder: React.FC<ConnectionBuilderProps> = ({
  phases,
  pieces,
  connections,
  onAddConnection,
  onDeleteConnection,
  selectedNode,
  onSelectNode
}) => {
  const [connectionType, setConnectionType] = React.useState<ConnectionBuilderEdge['type']>('causal');
  const [sourceNode, setSourceNode] = React.useState<string | null>(null);

  const handleNodeClick = (nodeId: string) => {
    if (!sourceNode) {
      setSourceNode(nodeId);
      onSelectNode(nodeId);
    } else if (sourceNode !== nodeId) {
      onAddConnection(sourceNode, nodeId, connectionType);
      setSourceNode(null);
      onSelectNode(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Connection Builder</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Connection Type:</span>
          <select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value as ConnectionBuilderEdge['type'])}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="causal">Causal</option>
            <option value="sequential">Sequential</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
        {sourceNode
          ? 'Click a second node to create a connection'
          : 'Click a node to start creating a connection'}
      </div>

      {/* Visual Graph */}
      <div className="border rounded-lg p-6 bg-muted/20 min-h-[400px]">
        <div className="grid grid-cols-3 gap-4">
          {pieces.slice(0, 9).map((piece, i) => (
            <button
              key={piece.id}
              onClick={() => handleNodeClick(piece.id)}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                sourceNode === piece.id
                  ? 'border-primary bg-primary/10'
                  : selectedNode === piece.id
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30'
              )}
            >
              <div className="font-medium text-sm line-clamp-2">{piece.title}</div>
              <div className="text-xs text-muted-foreground mt-1">Day {piece.order + 1}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Connections List */}
      {connections.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Active Connections ({connections.length})</h4>
          <div className="space-y-2">
            {connections.map(connection => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {pieces.find(p => p.id === connection.source)?.title || 'Unknown'} →{' '}
                    {pieces.find(p => p.id === connection.target)?.title || 'Unknown'}
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{connection.type}</span>
                </div>
                <button
                  onClick={() => onDeleteConnection(connection.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Competitive Insights Component
 */
interface CompetitiveInsightsProps {
  data: any;
}

const CompetitiveInsights: React.FC<CompetitiveInsightsProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Competitive Intelligence</h3>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Market Position"
          value={data?.marketPosition || 'N/A'}
          icon={<TrendingUp />}
        />
        <MetricCard
          label="Competitive Advantage"
          value={data?.advantage || 'N/A'}
          icon={<Target />}
        />
      </div>
      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
        Competitive data integration - full implementation would show detailed competitive analysis,
        gap opportunities, and strategic recommendations.
      </div>
    </div>
  );
};

/**
 * Score Tuning Component
 */
interface ScoreTuningProps {
  currentScore: number;
  phases: CampaignPhase[];
  pieces: CampaignPiece[];
}

const ScoreTuning: React.FC<ScoreTuningProps> = ({ currentScore, phases, pieces }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Breakthrough Score Tuning</h3>

      <div className="text-center p-6 border rounded-lg">
        <div className="text-sm text-muted-foreground mb-2">Current Score</div>
        <div className="text-5xl font-bold text-primary">{currentScore}</div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Score Factors</div>
        {[
          { label: 'Narrative Continuity', value: 85, weight: 15 },
          { label: 'Emotional Progression', value: 78, weight: 15 },
          { label: 'Content Variety', value: 92, weight: 10 },
          { label: 'Timing Optimization', value: 88, weight: 10 },
          { label: 'Platform Fit', value: 90, weight: 10 }
        ].map((factor, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{factor.label}</span>
              <span className="text-muted-foreground">{factor.value}% (weight: {factor.weight}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${factor.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
        Tune individual scoring factors to optimize your campaign's breakthrough potential.
        Adjust weights and thresholds for each of the 11 scoring factors.
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon }) => {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};
