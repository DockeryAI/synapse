/**
 * Platform Character Limits Configuration
 */

export interface PlatformLimits {
  maxCharacters: number;
  maxHashtags?: number;
  maxMentions?: number;
  maxImages?: number;
  maxVideos?: number;
}

export const platformLimits: Record<string, PlatformLimits> = {
  twitter: {
    maxCharacters: 280,
    maxHashtags: 2,
    maxMentions: 10,
    maxImages: 4,
    maxVideos: 1,
  },
  linkedin: {
    maxCharacters: 3000,
    maxHashtags: 5,
    maxImages: 9,
    maxVideos: 1,
  },
  facebook: {
    maxCharacters: 63206,
    maxHashtags: 30,
    maxImages: 10,
    maxVideos: 1,
  },
  instagram: {
    maxCharacters: 2200,
    maxHashtags: 30,
    maxImages: 10,
    maxVideos: 1,
  },
  tiktok: {
    maxCharacters: 2200,
    maxHashtags: 10,
    maxVideos: 1,
  },
  email: {
    maxCharacters: 100000,
  },
  blog: {
    maxCharacters: 100000,
  },
};
