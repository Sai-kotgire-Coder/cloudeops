import { useState } from 'react';
import { Save, User as UserIcon, Phone, Linkedin, Instagram, Calendar, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ProfileFields } from '@/store/profileStore';

interface PersonalInfoFormProps {
  initial: ProfileFields;
  onSave?: (fields: ProfileFields) => void | Promise<void>;
  onChange?: (fields: ProfileFields) => void;
  submitLabel?: string;
  saving?: boolean;
  hideSubmit?: boolean;
}

export const PersonalInfoForm = ({ initial, onSave, onChange, submitLabel = 'Save', saving, hideSubmit }: PersonalInfoFormProps) => {
  const [fields, setFields] = useState<ProfileFields>(initial);

  const set = <K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) => {
    setFields((f) => {
      const next = { ...f, [key]: value };
      onChange?.(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(fields);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="flex items-center gap-1.5 text-xs">
            <UserIcon className="w-3.5 h-3.5" /> Full name
          </Label>
          <Input
            id="fullName"
            placeholder="e.g. Priya Sharma"
            value={fields.fullName}
            onChange={(e) => set('fullName', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
            <Phone className="w-3.5 h-3.5" /> Contact number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={fields.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5 text-xs">
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn profile
          </Label>
          <Input
            id="linkedinUrl"
            placeholder="e.g. linkedin.com/in/priyasharma"
            value={fields.linkedinUrl}
            onChange={(e) => set('linkedinUrl', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instagramHandle" className="flex items-center gap-1.5 text-xs">
            <Instagram className="w-3.5 h-3.5" /> Instagram handle
          </Label>
          <Input
            id="instagramHandle"
            placeholder="e.g. @priyasharma"
            value={fields.instagramHandle}
            onChange={(e) => set('instagramHandle', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth" className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" /> Date of birth
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={fields.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="institute" className="flex items-center gap-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5" /> College / Institute
          </Label>
          <Input
            id="institute"
            placeholder="e.g. IIT Bombay"
            value={fields.institute}
            onChange={(e) => set('institute', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Are you a student or a professional?</Label>
        <RadioGroup
          value={fields.occupation}
          onValueChange={(v) => set('occupation', v)}
          className="flex flex-wrap gap-4"
        >
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="student" id="occupation-student" />
            Student
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="professional" id="occupation-professional" />
            Professional
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="other" id="occupation-other" />
            Other
          </label>
        </RadioGroup>
      </div>

      {!hideSubmit && (
        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {submitLabel}
        </Button>
      )}
    </form>
  );
};
