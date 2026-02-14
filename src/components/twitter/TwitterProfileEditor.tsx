import { useState } from 'react';
import { TwitterProfile } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

interface Props {
  profile: TwitterProfile;
  onChange: (p: TwitterProfile) => void;
}

export default function TwitterProfileEditor({ profile, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);

  const handleSave = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ ...draft, avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(profile); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="h-4 w-4 mr-2" /> Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perfil do Twitter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Foto (upload)</Label>
            <Input type="file" accept="image/*" onChange={handleFileUpload} />
            {draft.avatarUrl && (
              <img src={draft.avatarUrl} alt="" className="w-12 h-12 rounded-full mt-2 object-cover" />
            )}
          </div>
          <div>
            <Label>Ou URL da foto</Label>
            <Input value={draft.avatarUrl} onChange={e => setDraft({ ...draft, avatarUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <Label>@handle</Label>
            <Input value={draft.handle} onChange={e => setDraft({ ...draft, handle: e.target.value })} />
          </div>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
