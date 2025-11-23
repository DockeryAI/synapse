/**
 * Campaign Preview - Full campaign preview panel
 * Shows all pieces, narrative flow, and export options
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignPiece, EmotionalTrigger } from '@/types/v2';

export interface CampaignPreviewProps {
  campaign: Partial<Campaign> | null;
  pieces: CampaignPiece[];
  brandName: string;
  className?: string;
}

export const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  campaign,
  pieces,
  brandName,
  className,
}) => {
  const [expandedPiece, setExpandedPiece] = React.useState<string | null>(null);

  if (!campaign || pieces.length === 0) {
    return (
      <div className={cn('p-8 text-center border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-800', className)}>
        <p className="text-gray-600 dark:text-gray-300">
          No campaign to preview. Please complete the previous steps.
        </p>
      </div>
    );
  }

  const totalDuration = pieces.length > 1
    ? Math.ceil(
        (new Date(pieces[pieces.length - 1].scheduledDate).getTime() -
          new Date(pieces[0].scheduledDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Campaign Header */}
      <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.name || `${brandName} Campaign`}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {pieces.length} pieces over {totalDuration} days
        </p>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <span className="text-xs text-muted-foreground">Purpose</span>
            <div className="font-medium text-sm text-gray-900 dark:text-white capitalize">{campaign.purpose || 'General'}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Start Date</span>
            <div className="font-medium text-sm text-gray-900 dark:text-white">
              {campaign.startDate
                ? new Date(campaign.startDate).toLocaleDateString()
                : 'Not set'}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">End Date</span>
            <div className="font-medium text-sm text-gray-900 dark:text-white">
              {campaign.endDate
                ? new Date(campaign.endDate).toLocaleDateString()
                : 'Not set'}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <div className="font-medium text-sm text-gray-900 dark:text-white capitalize">{campaign.status || 'Draft'}</div>
          </div>
        </div>
      </div>

      {/* Narrative Flow Visualization */}
      <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Narrative Flow</h4>
        <div className="flex items-center">
          {pieces.map((piece, idx) => (
            <React.Fragment key={piece.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                    'bg-primary/10 text-primary'
                  )}
                >
                  {idx + 1}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 text-center max-w-[60px] truncate">
                  {piece.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
              {idx < pieces.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-300 dark:bg-slate-600 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pieces List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Campaign Pieces</h4>
        {pieces.map((piece, idx) => (
          <PreviewPieceCard
            key={piece.id}
            piece={piece}
            index={idx}
            expanded={expandedPiece === piece.id}
            onToggle={() =>
              setExpandedPiece(expandedPiece === piece.id ? null : piece.id)
            }
          />
        ))}
      </div>

      {/* Export Options */}
      <div className="flex gap-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
        <button className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300">
          Export as PDF
        </button>
        <button className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300">
          Copy All Content
        </button>
        <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Schedule Campaign
        </button>
      </div>
    </div>
  );
};

interface PreviewPieceCardProps {
  piece: CampaignPiece;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

const PreviewPieceCard: React.FC<PreviewPieceCardProps> = ({
  piece,
  index,
  expanded,
  onToggle,
}) => {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <h5 className="font-medium text-sm text-gray-900 dark:text-white">{piece.title}</h5>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {new Date(piece.scheduledDate).toLocaleDateString()}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded capitalize">
                {piece.emotionalTrigger}
              </span>
            </div>
          </div>
        </div>
        <ChevronIcon className={cn('w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{piece.content}</p>
          </div>
          {piece.performancePrediction && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Expected CTR</span>
                <div className="font-medium text-gray-900 dark:text-white">{piece.performancePrediction.expectedCTR}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Engagement</span>
                <div className="font-medium text-gray-900 dark:text-white">{piece.performancePrediction.expectedEngagement}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence</span>
                <div className="font-medium text-gray-900 dark:text-white">{piece.performancePrediction.confidenceScore}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default CampaignPreview;
