'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMember, useReferenceData, useAssemblies } from '@/hooks/queries';
import { useAuthStore } from '@/stores/auth-store';

const memberSchema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  gender: z.enum(['M', 'F']).optional(),
  dateOfBirth: z.string().optional(),
  conversionDate: z.string().optional(),
  waterBaptismDate: z.string().optional(),
  holySpiritBaptismDate: z.string().optional(),
  profession: z.string().optional(),
  arrivalDate: z.string().optional(),
  maritalStatusId: z.string().optional(),
  filiere: z.string().trim().optional(),
  level: z.string().trim().optional(),
  assemblyId: z.string().optional(),
  phone: z.string().optional(),
});

type MemberValues = z.infer<typeof memberSchema>;

export function MemberForm({ onSuccess, defaultValues }: { onSuccess?: () => void; defaultValues?: any }) {
  const create = useCreateMember();
  const { data: ref } = useReferenceData();
  const { data: assemblies } = useAssemblies();
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.some((r) => r.name === 'GENERAL_TREASURY');

  const [phone, setPhone] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaultValues || { arrivalDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (values: MemberValues) => {
    const contacts = phone
      ? [{ contactValue: phone, contactType: 'PHONE', isPrimary: true }]
      : [];

    try {
      await create.mutateAsync({
        ...values,
        dateOfBirth: values.dateOfBirth || undefined,
        conversionDate: values.conversionDate || undefined,
        waterBaptismDate: values.waterBaptismDate || undefined,
        holySpiritBaptismDate: values.holySpiritBaptismDate || undefined,
        profession: values.profession?.trim() || undefined,
        contacts,
      });
      toast.success('Membre ajouté avec succès');
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nom complet *</Label>
          <Input {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label>Sexe</Label>
          <Select onValueChange={(v) => setValue('gender', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Homme</SelectItem>
              <SelectItem value="F">Femme</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date de naissance</Label>
          <Input type="date" {...register('dateOfBirth')} />
        </div>
        <div>
          <Label>Profession</Label>
          <Input {...register('profession')} />
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-3">
        <p className="mb-2 text-xs font-semibold text-blue-800">Informations spirituelles</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Conversion</Label>
            <Input type="date" {...register('conversionDate')} />
          </div>
          <div>
            <Label className="text-xs">Baptême d&apos;eau</Label>
            <Input type="date" {...register('waterBaptismDate')} />
          </div>
          <div>
            <Label className="text-xs">Baptême Saint-Esprit</Label>
            <Input type="date" {...register('holySpiritBaptismDate')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Statut matrimonial</Label>
          <Select onValueChange={(v) => setValue('maritalStatusId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {ref?.maritalStatuses?.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="member-filiere">Filière</Label>
          <Input
            id="member-filiere"
            placeholder="Saisir une filière (facultatif)"
            aria-invalid={!!errors.filiere}
            {...register('filiere')}
          />
          {errors.filiere && <p className="text-xs text-destructive">{errors.filiere.message}</p>}
        </div>
        <div>
          <Label htmlFor="member-level">Niveau</Label>
          <Input
            id="member-level"
            placeholder="Saisir un niveau (facultatif)"
            aria-invalid={!!errors.level}
            {...register('level')}
          />
          {errors.level && <p className="text-xs text-destructive">{errors.level.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Téléphone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 ..." />
        </div>
        <div>
          <Label>Date d&apos;arrivée</Label>
          <Input type="date" {...register('arrivalDate')} />
        </div>
      </div>

      {isAdmin && (
        <div>
          <Label>Assemblée d&apos;appartenance *</Label>
          <Select onValueChange={(v) => setValue('assemblyId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une assemblée" />
            </SelectTrigger>
            <SelectContent>
              {assemblies?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={create.isPending} className="w-full">
        {create.isPending ? 'Enregistrement...' : 'Enregistrer le membre'}
      </Button>
    </form>
  );
}
