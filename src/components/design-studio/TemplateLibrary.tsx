/**
 * TemplateLibrary Component
 * Template selection and management
 */

import React, { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateManager } from '@/services/design-studio';
import type { Template, Platform, TemplateCategory } from '@/types/design-studio.types';
import { cn } from '@/lib/utils';

interface TemplateLibraryProps {
  onTemplateSelect: (template: Template) => void;
  onClose?: () => void;
}

const CATEGORIES: TemplateCategory[] = [
  'Social Post',
  'Story',
  'Ad',
  'Banner',
  'Thumbnail',
  'Infographic',
];

const PLATFORMS: Platform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
];

/**
 * Template library component
 */
export function TemplateLibrary({ onTemplateSelect, onClose }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  /**
   * Load templates
   */
  useEffect(() => {
    loadTemplates();
  }, []);

  /**
   * Load templates from manager
   */
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await TemplateManager.getTemplates();
      setTemplates(allTemplates);
      setFilteredTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter templates
   */
  useEffect(() => {
    let filtered = [...templates];

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter((t) => t.platform === selectedPlatform);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedPlatform, selectedCategory, searchQuery]);

  /**
   * Toggle favorite
   */
  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });
  };

  /**
   * Handle template click
   */
  const handleTemplateClick = (template: Template) => {
    onTemplateSelect(template);
  };

  /**
   * Get favorite templates
   */
  const favoriteTemplates = templates.filter((t) => favorites.has(t.id));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Template Library</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select
            value={selectedPlatform}
            onValueChange={(value) => setSelectedPlatform(value as Platform | 'all')}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="all">
            All ({filteredTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites ({favoriteTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates found
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isFavorite={favorites.has(template.id)}
                      onToggleFavorite={() => toggleFavorite(template.id)}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {favoriteTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No favorite templates yet
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favoriteTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isFavorite={true}
                      onToggleFavorite={() => toggleFavorite(template.id)}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Template card component
 */
interface TemplateCardProps {
  template: Template;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}

function TemplateCard({
  template,
  isFavorite,
  onToggleFavorite,
  onClick,
}: TemplateCardProps) {
  /**
   * Get template thumbnail color based on platform
   */
  const getThumbnailColor = (platform: Platform): string => {
    const colors: Record<Platform, string> = {
      instagram: '#E1306C',
      facebook: '#1877F2',
      linkedin: '#0A66C2',
      twitter: '#1DA1F2',
      tiktok: '#000000',
    };
    return colors[platform] || '#6366f1';
  };

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div
        className="aspect-square flex items-center justify-center text-white font-bold text-lg"
        style={{ backgroundColor: getThumbnailColor(template.platform) }}
      >
        {template.name.substring(0, 2).toUpperCase()}
      </div>

      {/* Favorite button */}
      <button
        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        <Star
          className={cn(
            'h-4 w-4',
            isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
          )}
        />
      </button>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{template.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {template.width} × {template.height}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
            {template.platform}
          </span>
          {template.isPremium && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
              Premium
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
