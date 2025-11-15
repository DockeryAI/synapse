/**
 * PROFILE GENERATION LOADING - Multi-Stage Animation
 *
 * Shows detailed progress as we generate a full industry profile on-demand
 * Maps to the 40-field template stages
 */

import React, { useEffect, useState } from 'react';
import type { GenerationProgress } from '../../services/industry/OnDemandProfileGeneration';

interface Props {
  industryName: string;
  progress: GenerationProgress;
}

const STAGE_CONFIG = {
  research: {
    icon: '🔍',
    title: 'Industry Research',
    subtitle: 'Analyzing market data and trends',
    fields: ['Market Size', 'Growth Trends', 'Key Players']
  },
  psychology: {
    icon: '🧠',
    title: 'Customer Psychology',
    subtitle: 'Understanding triggers and motivations',
    fields: ['Customer Triggers', 'Pain Points', 'Success Metrics']
  },
  market: {
    icon: '📊',
    title: 'Market Intelligence',
    subtitle: 'Gathering competitive insights',
    fields: ['Seasonal Patterns', 'Demographics', 'Market Trends']
  },
  messaging: {
    icon: '✨',
    title: 'Messaging Frameworks',
    subtitle: 'Developing power words and templates',
    fields: ['Headline Templates', 'Power Words', 'CTAs']
  },
  generating: {
    icon: '🤖',
    title: 'AI Generation',
    subtitle: 'Creating comprehensive profile',
    fields: ['Value Props', 'Differentiators', 'Positioning']
  },
  saving: {
    icon: '💾',
    title: 'Finalizing',
    subtitle: 'Validating and saving profile',
    fields: ['Validation', 'Storage', 'Indexing']
  },
  complete: {
    icon: '✅',
    title: 'Complete',
    subtitle: 'Profile ready to use',
    fields: []
  }
};

export const ProfileGenerationLoading: React.FC<Props> = ({ industryName, progress }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const currentStage = STAGE_CONFIG[progress.stage as keyof typeof STAGE_CONFIG] || STAGE_CONFIG.research;

  // Smoothly animate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev < progress.progress) {
          return Math.min(prev + 1, progress.progress);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [progress.progress]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="profile-generation-loading">
      <div className="loading-container">
        {/* Header */}
        <div className="loading-header">
          <h2 className="loading-title">
            Generating {industryName} Profile
          </h2>
          <p className="loading-subtitle">
            Building comprehensive marketing intelligence...
          </p>
        </div>

        {/* Current Stage */}
        <div className="current-stage">
          <div className="stage-icon">{currentStage.icon}</div>
          <div className="stage-info">
            <h3 className="stage-title">{currentStage.title}</h3>
            <p className="stage-subtitle">{currentStage.subtitle}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${animatedProgress}%` }}
            >
              <div className="progress-shine" />
            </div>
          </div>
          <div className="progress-stats">
            <span className="progress-percent">{animatedProgress}%</span>
            <span className="progress-eta">
              {progress.estimatedTimeRemaining > 0 && (
                <>~{formatTime(progress.estimatedTimeRemaining)} remaining</>
              )}
            </span>
          </div>
        </div>

        {/* Field Generation Activity */}
        <div className="field-activity">
          <h4 className="activity-title">Generating Fields</h4>
          <div className="field-list">
            {currentStage.fields.map((field, index) => (
              <div
                key={field}
                className="field-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="field-spinner" />
                <span className="field-name">{field}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Timeline */}
        <div className="stage-timeline">
          {Object.entries(STAGE_CONFIG).map(([key, stage]) => {
            const stageNum = Object.keys(STAGE_CONFIG).indexOf(key);
            const currentStageNum = Object.keys(STAGE_CONFIG).indexOf(progress.stage);

            return (
              <div
                key={key}
                className={`timeline-stage ${
                  stageNum < currentStageNum ? 'complete' :
                  stageNum === currentStageNum ? 'active' :
                  'pending'
                }`}
              >
                <div className="timeline-dot">{stage.icon}</div>
                <div className="timeline-label">{stage.title}</div>
              </div>
            );
          })}
        </div>

        {/* Fun Fact */}
        <div className="generation-info">
          <p className="info-text">
            💡 This profile includes 40 comprehensive fields with 3,200+ words of industry intelligence
          </p>
        </div>
      </div>

      <style>{`
        .profile-generation-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-container {
          max-width: 600px;
          width: 100%;
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .loading-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .loading-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .loading-subtitle {
          font-size: 16px;
          color: #6b7280;
        }

        .current-stage {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 16px;
          margin-bottom: 32px;
        }

        .stage-icon {
          font-size: 48px;
          line-height: 1;
        }

        .stage-info {
          flex: 1;
        }

        .stage-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stage-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .progress-section {
          margin-bottom: 32px;
        }

        .progress-bar-container {
          height: 12px;
          background: #e5e7eb;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 12px;
          position: relative;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 999px;
          transition: width 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .progress-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shine 2s infinite;
        }

        @keyframes shine {
          to {
            left: 100%;
          }
        }

        .progress-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .progress-percent {
          font-weight: 600;
          color: #667eea;
        }

        .progress-eta {
          color: #6b7280;
        }

        .field-activity {
          margin-bottom: 32px;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }

        .field-list {
          display: grid;
          gap: 12px;
        }

        .field-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .field-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .field-name {
          font-size: 14px;
          color: #4b5563;
        }

        .stage-timeline {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 0 8px;
        }

        .timeline-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.3s ease;
        }

        .timeline-stage.complete .timeline-dot {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .timeline-stage.active .timeline-dot {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: pulse 2s ease-in-out infinite;
        }

        .timeline-stage.pending .timeline-dot {
          background: #e5e7eb;
          opacity: 0.5;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
          }
        }

        .timeline-label {
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
        }

        .timeline-stage.active .timeline-label {
          color: #667eea;
          font-weight: 600;
        }

        .generation-info {
          text-align: center;
          padding: 16px;
          background: #fef3c7;
          border-radius: 12px;
        }

        .info-text {
          font-size: 14px;
          color: #92400e;
          margin: 0;
        }
      `}</style>
    </div>
  );
};
