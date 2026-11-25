'use client';

import { useState, useEffect } from 'react';
import { Plus, Tags, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries';

export default function CategoriesPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const { data, isLoading } = useCategories(includeInactive);
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  return (
    <div className="p-6">
      <PageHeader
        title="Rubriques financières"
        description="Catégories de répartition des offrandes"
        action={
          <Button onClick={() => { setEditItem(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle rubrique
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} id="inactive" />
        <Label htmlFor="inactive" className="text-sm">Afficher les rubriques inactives</Label>
      </div>

      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Tags className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{cat.name}</h3>
                  </div>
                  <Badge variant={cat.isActive ? 'success' : 'secondary'}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cat.description || '—'}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {cat._count?.allocations || 0} contribution(s)
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditItem(cat); setOpen(true); }}
                  >
                    <Pencil className="h-3 w-3" /> Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await deleteCat.mutateAsync(cat.id);
                        toast.success('Rubrique désactivée/supprimée');
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {data?.length === 0 && <p className="text-muted-foreground">Aucune rubrique.</p>}
        </div>
      )}

      <CategoryDialog open={open} onOpenChange={setOpen} editItem={editItem} />
    </div>
  );
}

function CategoryDialog({ open, onOpenChange, editItem }: { open: boolean; onOpenChange: (v: boolean) => void; editItem: any }) {
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Synchroniser le formulaire quand on ouvre pour modifier
  useEffect(() => {
    if (open && editItem) {
      setName(editItem.name);
      setDescription(editItem.description || '');
      setIsActive(editItem.isActive);
    } else if (open && !editItem) {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [open, editItem]);

  const submit = async () => {
    try {
      if (editItem) {
        await updateCat.mutateAsync({ id: editItem.id, data: { name, description, isActive } });
        toast.success('Rubrique modifiée');
      } else {
        await createCat.mutateAsync({ name, description });
        toast.success('Rubrique créée');
      }
      setName(''); setDescription(''); setIsActive(true);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editItem ? 'Modifier la rubrique' : 'Nouvelle rubrique'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Construction" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {editItem && (
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="cat-active" />
              <Label htmlFor="cat-active">Active</Label>
            </div>
          )}
          <Button onClick={submit} disabled={createCat.isPending || updateCat.isPending || !name} className="w-full">
            {editItem ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
