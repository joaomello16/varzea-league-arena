import { useState } from 'react';
import { Player } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { X, Upload, User as UserIcon } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

interface PlayerEditModalProps {
  player: Player;
  onClose: () => void;
  onSaveSuccess: (updatedPlayer: Player) => void;
}

export function PlayerEditModal({
  player,
  onClose,
  onSaveSuccess,
}: PlayerEditModalProps) {
  const [nick, setNick] = useState(player.nick);
  const [bio, setBio] = useState(player.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    player.avatar_url
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(
    player.cover_url
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cropper states
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar deve ter no máximo 5MB');
        return;
      }
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError('Avatar deve ser uma imagem');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCrop(e.target?.result as string);
        setShowAvatarCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Foto de capa deve ter no máximo 10MB');
        return;
      }
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError('Foto de capa deve ser uma imagem');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCrop(e.target?.result as string);
        setShowCoverCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropComplete = (croppedImage: string) => {
    setAvatarPreview(croppedImage);
    setShowAvatarCropper(false);
    setImageToCrop(null);
  };

  const handleCoverCropComplete = (croppedImage: string) => {
    setCoverPreview(croppedImage);
    setShowCoverCropper(false);
    setImageToCrop(null);
  };

  const uploadImage = async (
    imageData: string,
    bucket: string,
    playerId: string,
    type: 'avatar' | 'cover'
  ): Promise<string | null> => {
    try {
      // Converter data URL para blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Gerar nome único para a imagem
      const timestamp = Date.now();
      const fileName = `${playerId}/${type}-${timestamp}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error(`Erro ao fazer upload de ${type}:`, err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // Validar nick
      const trimmedNick = nick.trim();
      if (!trimmedNick || trimmedNick.length < 1) {
        setError('Nick não pode estar vazio');
        setIsSubmitting(false);
        return;
      }

      let newAvatarUrl = player.avatar_url;
      let newCoverUrl = player.cover_url;

      // Upload de avatar se houver mudança
      if (avatarPreview && avatarPreview !== player.avatar_url) {
        newAvatarUrl = await uploadImage(
          avatarPreview,
          'avatars',
          player.id,
          'avatar'
        );
      }

      // Upload de cover se houver mudança
      if (coverPreview && coverPreview !== player.cover_url) {
        newCoverUrl = await uploadImage(
          coverPreview,
          'covers',
          player.id,
          'cover'
        );
      }

      // Atualizar dados do player no banco
      const { data, error: updateError } = await supabase
        .from('players')
        .update({
          nick: trimmedNick,
          bio: bio.trim() || null,
          avatar_url: newAvatarUrl,
          cover_url: newCoverUrl,
        })
        .eq('id', player.id)
        .select()
        .single();

      if (updateError) {
        // Se for erro de permissão (403), exibir mensagem clara
        if (updateError.code === 'PGRST301') {
          setError('Você não tem permissão para editar este player');
        } else {
          setError(updateError.message || 'Erro ao salvar player');
        }
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Player atualizado com sucesso!');

      // Chamar callback com dados atualizados
      if (data) {
        onSaveSuccess(data as Player);
      }

      // Fechar modal após sucesso
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col items-center text-center">
            {/* Messages */}
            {error && (
              <div className="card-base p-3 border-destructive/50 bg-destructive/10 mb-4 w-full">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="card-base p-3 border-success/50 bg-success/10 mb-4 w-full">
                <p className="text-success text-sm">{successMessage}</p>
              </div>
            )}

            {/* Cover */}
            <div className="relative w-full mb-4">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="w-full h-32 object-cover rounded-lg border-2 border-primary/30"
                />
              ) : (
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">Foto de capa</span>
                </div>
              )}
              <label className="absolute bottom-2 right-2 p-2 bg-primary hover:bg-primary/90 rounded-full cursor-pointer transition-colors">
                <Upload size={14} className="text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-primary/30 overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={nick}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon size={48} className="text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary/90 rounded-full cursor-pointer transition-colors">
                <Upload size={14} className="text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Nick Input */}
            <div className="w-full mb-4">
              <input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="input-base w-full text-center text-2xl font-heading font-bold"
                placeholder="Nick do Player"
                required
                minLength={1}
              />
            </div>

            {/* Bio Input */}
            <div className="w-full mb-6">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-base w-full text-center text-sm text-muted-foreground resize-none"
                placeholder="Bio (opcional)"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bio.length}/500
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 w-full">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Avatar Cropper */}
      {showAvatarCropper && imageToCrop && (
        <ImageCropper
          imageSource={imageToCrop}
          aspectRatio={1}
          title="Cortar Avatar"
          onCropComplete={handleAvatarCropComplete}
          onCancel={() => {
            setShowAvatarCropper(false);
            setImageToCrop(null);
          }}
        />
      )}

      {/* Cover Cropper */}
      {showCoverCropper && imageToCrop && (
        <ImageCropper
          imageSource={imageToCrop}
          aspectRatio={16 / 9}
          title="Cortar Foto de Capa"
          onCropComplete={handleCoverCropComplete}
          onCancel={() => {
            setShowCoverCropper(false);
            setImageToCrop(null);
          }}
        />
      )}
    </div>
  );
}
