/**
 * BrandAssets Component
 * Brand colors, fonts, logos, and stock photos
 */

import React, { useEffect, useState } from 'react';
import { Palette, Type, Image as ImageIcon, Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { DEFAULT_FONTS, GOOGLE_FONTS } from '@/types/design-studio.types';
import { cn } from '@/lib/utils';

interface BrandAssetsProps {
  brandId: string;
  onColorSelect: (color: string) => void;
  onFontSelect: (font: string) => void;
  onImageSelect: (url: string) => void;
}

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  [key: string]: string | undefined;
}

/**
 * Brand assets panel component
 */
export function BrandAssets({
  brandId,
  onColorSelect,
  onFontSelect,
  onImageSelect,
}: BrandAssetsProps) {
  const [brandColors, setBrandColors] = useState<BrandColors>({});
  const [brandFonts, setBrandFonts] = useState<string[]>([]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const allFonts = [...DEFAULT_FONTS, ...GOOGLE_FONTS];

  /**
   * Load brand data
   */
  useEffect(() => {
    loadBrandData();
  }, [brandId]);

  /**
   * Load brand colors, fonts, and assets
   */
  const loadBrandData = async () => {
    try {
      // Load brand mirror data for colors and fonts
      const { data: mirrorData } = await supabase
        .from('mirror_sections')
        .select('data')
        .eq('brand_id', brandId)
        .eq('section', 'brand-identity')
        .single();

      if (mirrorData?.data) {
        const identity = mirrorData.data as any;

        // Extract colors
        if (identity.colors) {
          setBrandColors(identity.colors);
        }

        // Extract fonts
        if (identity.fonts) {
          setBrandFonts(identity.fonts);
        }
      }

      // Load uploaded images from storage
      const { data: images } = await supabase.storage
        .from('brand-assets')
        .list(brandId);

      if (images) {
        const imageUrls = images.map((img) => {
          const { data } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(`${brandId}/${img.name}`);
          return data.publicUrl;
        });
        setUploadedImages(imageUrls);
      }
    } catch (error) {
      console.error('Error loading brand data:', error);
    }
  };

  /**
   * Handle color click
   */
  const handleColorClick = (color: string) => {
    onColorSelect(color);

    // Add to recent colors
    setRecentColors((prev) => {
      const updated = [color, ...prev.filter((c) => c !== color)].slice(0, 10);
      return updated;
    });
  };

  /**
   * Handle font click
   */
  const handleFontClick = (font: string) => {
    onFontSelect(font);
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Upload to Supabase storage
      const filename = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(`${brandId}/${filename}`, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(data.path);

      setUploadedImages((prev) => [urlData.publicUrl, ...prev]);
      onImageSelect(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search Unsplash (mock implementation - requires API key)
   */
  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) return;

    setLoading(true);
    try {
      // Mock results - in production, use Unsplash API
      // const unsplash = createApi({ accessKey: process.env.VITE_UNSPLASH_ACCESS_KEY });
      // const result = await unsplash.search.getPhotos({ query: unsplashQuery, perPage: 20 });

      // For now, show placeholder
      setUnsplashResults([
        {
          id: '1',
          urls: {
            small: `https://source.unsplash.com/400x300/?${unsplashQuery}`,
            regular: `https://source.unsplash.com/800x600/?${unsplashQuery}`,
          },
          user: { name: 'Photographer', username: 'photographer' },
        },
      ]);
    } catch (error) {
      console.error('Error searching Unsplash:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Unsplash image click
   */
  const handleUnsplashClick = (imageUrl: string) => {
    onImageSelect(imageUrl);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm">Brand Assets</h3>
      </div>

      <Tabs defaultValue="colors" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2">
          <TabsTrigger value="colors" className="flex-1">
            <Palette className="h-4 w-4 mr-1" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="fonts" className="flex-1">
            <Type className="h-4 w-4 mr-1" />
            Fonts
          </TabsTrigger>
          <TabsTrigger value="images" className="flex-1">
            <ImageIcon className="h-4 w-4 mr-1" />
            Images
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Brand Colors */}
              {Object.keys(brandColors).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Brand Colors</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(brandColors).map(([key, color]) => (
                      <button
                        key={key}
                        className="aspect-square rounded border border-gray-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => color && handleColorClick(color)}
                        title={key}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Recent Colors</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {recentColors.map((color, index) => (
                      <button
                        key={index}
                        className="aspect-square rounded border border-gray-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorClick(color)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Color Picker */}
              <div>
                <h4 className="text-xs font-semibold mb-2">Custom Color</h4>
                <Input
                  type="color"
                  onChange={(e) => handleColorClick(e.target.value)}
                  className="h-10 w-full"
                />
              </div>

              {/* Common Colors */}
              <div>
                <h4 className="text-xs font-semibold mb-2">Common Colors</h4>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    '#000000',
                    '#ffffff',
                    '#ef4444',
                    '#f59e0b',
                    '#eab308',
                    '#22c55e',
                    '#06b6d4',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                  ].map((color) => (
                    <button
                      key={color}
                      className="aspect-square rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorClick(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Brand Fonts */}
              {brandFonts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Brand Fonts</h4>
                  <div className="space-y-1">
                    {brandFonts.map((font) => (
                      <button
                        key={font}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                        style={{ fontFamily: font }}
                        onClick={() => handleFontClick(font)}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Fonts */}
              <div>
                <h4 className="text-xs font-semibold mb-2">Available Fonts</h4>
                <div className="space-y-1">
                  {allFonts.map((font) => (
                    <button
                      key={font}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      style={{ fontFamily: font }}
                      onClick={() => handleFontClick(font)}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Upload */}
              <div>
                <label className="block">
                  <Button variant="outline" className="w-full" disabled={loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Uploaded Images</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((url, index) => (
                      <button
                        key={index}
                        className="aspect-square rounded overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
                        onClick={() => onImageSelect(url)}
                      >
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unsplash Search */}
              <div>
                <h4 className="text-xs font-semibold mb-2">Stock Photos</h4>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Search Unsplash..."
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                  />
                  <Button onClick={searchUnsplash} disabled={loading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {unsplashResults.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {unsplashResults.map((photo) => (
                      <button
                        key={photo.id}
                        className="aspect-square rounded overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
                        onClick={() => handleUnsplashClick(photo.urls.regular)}
                      >
                        <img
                          src={photo.urls.small}
                          alt="Unsplash"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
