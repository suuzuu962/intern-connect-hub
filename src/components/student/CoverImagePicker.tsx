import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, ImageIcon, Palette, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CoverImagePickerProps {
  currentCoverUrl?: string;
  userId: string;
  onCoverChange: (url: string) => void;
}

// Preset cover templates
const PRESET_COVERS = [
  '/covers/cover-1.png',
  '/covers/cover-2.png',
  '/covers/cover-3.png',
  '/covers/cover-4.png',
  '/covers/cover-5.png',
  '/covers/cover-6.png',
  '/covers/cover-7.png',
  '/covers/cover-8.png',
  '/covers/cover-9.png',
  '/covers/cover-10.png',
];

// Color themes for gradient covers
const COLOR_THEMES = [
  { name: 'Blue', gradient: 'from-blue-600 to-blue-400' },
  { name: 'Purple', gradient: 'from-purple-600 to-purple-400' },
  { name: 'Green', gradient: 'from-green-600 to-green-400' },
  { name: 'Orange', gradient: 'from-orange-500 to-yellow-400' },
  { name: 'Pink', gradient: 'from-pink-600 to-rose-400' },
  { name: 'Teal', gradient: 'from-teal-600 to-cyan-400' },
  { name: 'Red', gradient: 'from-red-600 to-red-400' },
  { name: 'Indigo', gradient: 'from-indigo-600 to-blue-400' },
];

export const CoverImagePicker = ({
  currentCoverUrl,
  userId,
  onCoverChange,
}: CoverImagePickerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${userId}/cover_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-files')
        .getPublicUrl(fileName);

      onCoverChange(publicUrl);
      toast.success('Cover image uploaded successfully');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
    } finally {
      setUploading(false);
    }
  };

  const handlePresetSelect = (cover: string) => {
    setSelectedCover(cover);
    setSelectedGradient(null);
  };

  const handleGradientSelect = (gradient: string) => {
    setSelectedGradient(gradient);
    setSelectedCover(null);
  };

  const handleConfirm = () => {
    if (selectedCover) {
      onCoverChange(selectedCover);
      toast.success('Cover image selected');
    } else if (selectedGradient) {
      // Store gradient class name as a special identifier
      onCoverChange(`gradient:${selectedGradient}`);
      toast.success('Cover theme selected');
    }
    setIsDialogOpen(false);
    setSelectedCover(null);
    setSelectedGradient(null);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedCover(null);
    setSelectedGradient(null);
  };

  const isGradientCover = currentCoverUrl?.startsWith('gradient:');
  const currentGradient = isGradientCover ? currentCoverUrl.replace('gradient:', '') : null;

  return (
    <div className="w-full">
      {/* Cover Preview */}
      <div className="relative w-full h-32 sm:h-40 rounded-t-lg overflow-hidden group">
        {currentCoverUrl ? (
          isGradientCover ? (
            <div className={cn("w-full h-full bg-gradient-to-r", currentGradient)} />
          ) : (
            <img
              src={currentCoverUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40" />
        )}
        
        {/* Edit overlay */}
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-lg">
            <ImageIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{currentCoverUrl ? 'Change Cover' : 'Add Cover'}</span>
          </div>
        </button>
      </div>

      {/* Cover Picker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Cover Image</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Choose from professional themed banners
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {PRESET_COVERS.map((cover, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetSelect(cover)}
                    className={cn(
                      "relative rounded-lg overflow-hidden aspect-[4/1] transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      selectedCover === cover && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <img
                      src={cover}
                      alt={`Cover template ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedCover === cover && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Choose a color theme for your cover
              </p>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => handleGradientSelect(theme.gradient)}
                    className={cn(
                      "relative rounded-lg overflow-hidden aspect-[2/1] transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      selectedGradient === theme.gradient && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <div className={cn("w-full h-full bg-gradient-to-r", theme.gradient)} />
                    {selectedGradient === theme.gradient && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-white text-primary rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-white font-medium drop-shadow-md">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Upload your own cover image</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended resolution: 1130×200 pixels
                    </p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                  </div>
                  <Label htmlFor="cover-upload-input">
                    <Button type="button" variant="outline" asChild disabled={uploading}>
                      <span className="cursor-pointer gap-2">
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Choose File
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="cover-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm} 
              disabled={!selectedCover && !selectedGradient}
            >
              Apply Cover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
