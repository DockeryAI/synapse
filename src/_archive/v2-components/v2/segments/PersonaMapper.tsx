/**
 * Persona Mapper Component
 * Visual interface for mapping personas to campaign pieces with drag-drop
 */

import React, { useState, useEffect } from 'react';
import type {
  CustomerPersona,
  PersonaAssignment,
  SegmentMatchInput,
  CreatePersonaInput,
} from '@/types/v2';
import {
  personaMappingService,
  PersonaMatchResult,
} from '@/services/v2/persona-mapping.service';

export interface PersonaMapperProps {
  pieceId?: string;
  content?: SegmentMatchInput;
  existingAssignments?: PersonaAssignment[];
  onAssignmentChange?: (assignments: PersonaAssignment[]) => void;
  onPersonaCreate?: (persona: CustomerPersona) => void;
  showMatchScores?: boolean;
  allowMultiple?: boolean;
}

export const PersonaMapper: React.FC<PersonaMapperProps> = ({
  pieceId,
  content,
  existingAssignments = [],
  onAssignmentChange,
  onPersonaCreate,
  showMatchScores = true,
  allowMultiple = true,
}) => {
  const [personas, setPersonas] = useState<CustomerPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [matchScores, setMatchScores] = useState<Map<string, PersonaMatchResult>>(new Map());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignments, setAssignments] = useState<PersonaAssignment[]>(existingAssignments);

  useEffect(() => {
    loadPersonas();
    if (content && pieceId) {
      calculateMatchScores();
    }
  }, [content, pieceId]);

  const loadPersonas = () => {
    const allPersonas = personaMappingService.getAllPersonas();
    setPersonas(allPersonas);
  };

  const calculateMatchScores = async () => {
    if (!content || !pieceId) return;

    const scores = new Map<string, PersonaMatchResult>();
    for (const persona of personas) {
      const match = personaMappingService.calculatePersonaMatch(content, persona.id);
      if (match) {
        scores.set(persona.id, match);
      }
    }
    setMatchScores(scores);
  };

  const handlePersonaClick = (personaId: string) => {
    if (selectedPersona === personaId) {
      setSelectedPersona(null);
    } else {
      setSelectedPersona(personaId);
    }
  };

  const handleAssignPersona = (personaId: string) => {
    if (!pieceId) return;

    const existingPrimary = assignments.find(a => a.assignmentType === 'primary');
    const assignmentType = existingPrimary && allowMultiple ? 'secondary' : 'primary';

    const match = matchScores.get(personaId);
    const assignment = personaMappingService.assignPersonaToPiece(
      pieceId,
      personaId,
      assignmentType,
      match?.matchScore
    );

    const newAssignments = [...assignments, assignment];
    setAssignments(newAssignments);
    onAssignmentChange?.(newAssignments);
  };

  const handleRemoveAssignment = (personaId: string) => {
    const newAssignments = assignments.filter(a => a.personaId !== personaId);
    setAssignments(newAssignments);
    onAssignmentChange?.(newAssignments);
  };

  const handleAutoAssign = () => {
    if (!pieceId || !content) return;

    const autoAssignments = personaMappingService.autoAssignPersonas(pieceId, content);
    setAssignments(autoAssignments);
    onAssignmentChange?.(autoAssignments);
  };

  const handleCreatePersona = (input: CreatePersonaInput) => {
    const newPersona = personaMappingService.createPersona(input);
    setPersonas([...personas, newPersona]);
    setShowCreateModal(false);
    onPersonaCreate?.(newPersona);
  };

  const isAssigned = (personaId: string) => {
    return assignments.some(a => a.personaId === personaId);
  };

  const getAssignmentType = (personaId: string): 'primary' | 'secondary' | null => {
    const assignment = assignments.find(a => a.personaId === personaId);
    return assignment?.assignmentType || null;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Persona Mapping</h3>
            <p className="text-sm text-gray-500">
              {assignments.length} persona{assignments.length !== 1 ? 's' : ''} assigned
            </p>
          </div>
          <div className="flex gap-2">
            {content && pieceId && (
              <button
                onClick={handleAutoAssign}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Auto-Assign
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              + New Persona
            </button>
          </div>
        </div>
      </div>

      {/* Persona Grid */}
      <div className="p-4">
        {personas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No personas defined yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Create your first persona
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map(persona => {
              const match = matchScores.get(persona.id);
              const assignmentType = getAssignmentType(persona.id);
              const assigned = isAssigned(persona.id);

              return (
                <div
                  key={persona.id}
                  onClick={() => handlePersonaClick(persona.id)}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${assigned ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                    ${selectedPersona === persona.id ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  {/* Assignment Badge */}
                  {assigned && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${assignmentType === 'primary' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}
                        `}
                      >
                        {assignmentType}
                      </span>
                    </div>
                  )}

                  {/* Persona Info */}
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900">{persona.name}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{persona.description}</p>
                  </div>

                  {/* Demographics */}
                  {persona.demographics.ageRange && (
                    <div className="text-xs text-gray-500 mb-2">
                      {persona.demographics.ageRange}
                      {persona.demographics.occupation && ` • ${persona.demographics.occupation}`}
                    </div>
                  )}

                  {/* Pain Points */}
                  {persona.psychographics.painPoints.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Top Pain Points:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {persona.psychographics.painPoints.slice(0, 2).map((point, idx) => (
                          <li key={idx} className="line-clamp-1">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Match Score */}
                  {showMatchScores && match && (
                    <div className={`mt-3 pt-3 border-t border-gray-200 ${getScoreBg(match.matchScore)}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Match Score:</span>
                        <span className={`text-lg font-bold ${getScoreColor(match.matchScore)}`}>
                          {match.matchScore}%
                        </span>
                      </div>
                      {match.matchReasons.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {match.matchReasons[0]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    {!assigned ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignPersona(persona.id);
                        }}
                        className="flex-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                      >
                        Assign
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAssignment(persona.id);
                        }}
                        className="flex-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Persona Modal */}
      {showCreateModal && (
        <CreatePersonaModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePersona}
        />
      )}
    </div>
  );
};

/**
 * Create Persona Modal Component
 */
interface CreatePersonaModalProps {
  onClose: () => void;
  onCreate: (input: CreatePersonaInput) => void;
}

const CreatePersonaModal: React.FC<CreatePersonaModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<CreatePersonaInput>({
    name: '',
    description: '',
    psychographics: {
      goals: [],
      painPoints: [],
      values: [],
      challenges: [],
    },
    behavioralTraits: {
      decisionMakingStyle: 'analytical',
      informationPreference: 'text',
      purchaseDrivers: [],
    },
  });

  const [currentGoal, setCurrentGoal] = useState('');
  const [currentPainPoint, setCurrentPainPoint] = useState('');

  const handleAddGoal = () => {
    if (currentGoal.trim()) {
      setFormData({
        ...formData,
        psychographics: {
          ...formData.psychographics,
          goals: [...formData.psychographics.goals, currentGoal.trim()],
        },
      });
      setCurrentGoal('');
    }
  };

  const handleAddPainPoint = () => {
    if (currentPainPoint.trim()) {
      setFormData({
        ...formData,
        psychographics: {
          ...formData.psychographics,
          painPoints: [...formData.psychographics.painPoints, currentPainPoint.trim()],
        },
      });
      setCurrentPainPoint('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.psychographics.goals.length > 0) {
      onCreate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Persona</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Persona Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Health-Conscious Professional"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Brief description of this persona..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goals *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGoal())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a goal and press Enter"
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.psychographics.goals.map((goal, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pain Points
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentPainPoint}
                onChange={(e) => setCurrentPainPoint(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPainPoint())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a pain point and press Enter"
              />
              <button
                type="button"
                onClick={handleAddPainPoint}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.psychographics.painPoints.map((point, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Persona
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
