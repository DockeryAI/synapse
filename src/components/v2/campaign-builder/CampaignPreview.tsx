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
      <div className={cn('p-8 text-center border rounded-lg bg-muted/50', className)}>
        <p className="text-muted-foreground">
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
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{campaign.name || `${brandName} Campaign`}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {pieces.length} pieces over {totalDuration} days
        </p>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <span className="text-xs text-muted-foreground">Purpose</span>
            <div className="font-medium text-sm capitalize">{campaign.purpose || 'General'}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Start Date</span>
            <div className="font-medium text-sm">
              {campaign.startDate
                ? new Date(campaign.startDate).toLocaleDateString()
                : 'Not set'}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">End Date</span>
            <div className="font-medium text-sm">
              {campaign.endDate
                ? new Date(campaign.endDate).toLocaleDateString()
                : 'Not set'}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <div className="font-medium text-sm capitalize">{campaign.status || 'Draft'}</div>
          </div>
        </div>
      </div>

      {/* Narrative Flow Visualization */}
      <div className="p-4 border rounded-lg">
        <h4 className="text-sm font-medium mb-3">Narrative Flow</h4>
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
                <div className="flex-1 h-0.5 bg-border mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pieces List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Campaign Pieces</h4>
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
      <div className="flex gap-3 p-4 border rounded-lg bg-muted/50">
        <button className="flex-1 px-4 py-2 text-sm border rounded-md hover:bg-background">
          Export as PDF
        </button>
        <button className="flex-1 px-4 py-2 text-sm border rounded-md hover:bg-background">
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
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <h5 className="font-medium text-sm">{piece.title}</h5>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {new Date(piece.scheduledDate).toLocaleDateString()}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-muted rounded capitalize">
                {piece.emotionalTrigger}
              </span>
            </div>
          </div>
        </div>
        <ChevronIcon className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t bg-muted/30">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm">{piece.content}</p>
          </div>
          {piece.performancePrediction && (
            <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Expected CTR</span>
                <div className="font-medium">{piece.performancePrediction.expectedCTR}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Engagement</span>
                <div className="font-medium">{piece.performancePrediction.expectedEngagement}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence</span>
                <div className="font-medium">{piece.performancePrediction.confidenceScore}%</div>
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
