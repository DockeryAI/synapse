/**
 * Brand Header Component
 * Shows brand name and logo in top-left, with edit capabilities
 */

import * as React from 'react'
import { useBrand } from '@/contexts/BrandContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, Building2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BrandHeader: React.FC<{ className?: string }> = ({ className }) => {
  const { currentBrand, refreshBrand } = useBrand()
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedName, setEditedName] = React.useState('')
  const [editedLogo, setEditedLogo] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (currentBrand) {
      setEditedName(currentBrand.name || '')
      setEditedLogo(currentBrand.logo_url || '')
    }
  }, [currentBrand])

  const handleSave = async () => {
    if (!currentBrand?.id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('brands')
        .update({
          name: editedName,
          logo_url: editedLogo || null,
        })
        .eq('id', currentBrand.id)

      if (error) throw error

      await refreshBrand?.()
      setIsEditing(false)
    } catch (error) {
      console.error('[BrandHeader] Failed to update brand:', error)
      alert('Failed to update brand. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, just use a data URL
    // In production, you'd upload to Supabase Storage
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditedLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setEditedLogo('')
  }

  if (!currentBrand) return null

  const logo = currentBrand.logo_url
  const brandName = currentBrand.name

  return (
    <>
      <div className={cn('flex items-center gap-3 group', className)}>
        {/* Logo - only show if exists */}
        {logo && (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            <img
              src={logo}
              alt={brandName}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Hide if image fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Brand Name */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">{brandName}</h2>

          {/* Edit Button - appears on hover */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Brand Details</DialogTitle>
            <DialogDescription>
              Update your brand name and logo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name</label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo</label>

              {editedLogo ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center border">
                    <img
                      src={editedLogo}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Logo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload logo
                    </span>
                  </div>
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editedName.trim()}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
