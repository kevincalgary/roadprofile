import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { SegmentedPicker } from '../../components/ui/SegmentedPicker';
import { RecordPhotoPicker } from '../../components/vehicle/RecordPhotoPicker';
import { RecordDocumentPicker } from '../../components/vehicle/RecordDocumentPicker';
import { CATEGORY_LABELS, RELATIONSHIP_LABELS } from '../../lib/format';
import { saveRecordDraft, publishRecord, getRecordById, getRecordPhotos, getRecordDocuments, type RecordDraftInput } from '../../lib/api/records';
import type { RecordCategory, Relationship, MileageUnit, RecordPhoto, RecordDocument } from '../../lib/types/database';

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value: value as RecordCategory, label }));
const RELATIONSHIPS = Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => ({ value: value as Relationship, label }));

export default function RecordForm() {
  const { vehicleId, vin, recordId: recordIdParam } = useLocalSearchParams<{ vehicleId: string; vin: string; recordId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recordId, setRecordId] = useState<string | undefined>(recordIdParam);
  const [relationship, setRelationship] = useState<Relationship>('current_owner');
  const [category, setCategory] = useState<RecordCategory>('maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [partBrandAndNumbers, setPartBrandAndNumbers] = useState('');
  const [facility, setFacility] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costIsPrivate, setCostIsPrivate] = useState(true);
  const [warrantyInfo, setWarrantyInfo] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState('');
  const [mileageUnit, setMileageUnit] = useState<MileageUnit>('mi');
  const [locationText, setLocationText] = useState('');

  const [photos, setPhotos] = useState<RecordPhoto[]>([]);
  const [documents, setDocuments] = useState<RecordDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!recordIdParam) return;
    getRecordById(recordIdParam).then((r) => {
      if (!r) return;
      setRelationship(r.relationship);
      setCategory(r.category);
      setTitle(r.title);
      setDescription(r.description ?? '');
      setSymptoms(r.symptoms ?? '');
      setDiagnosis(r.diagnosis ?? '');
      setWorkPerformed(r.work_performed ?? '');
      setPartsReplaced(r.parts_replaced ?? '');
      setPartBrandAndNumbers(r.part_brand_and_numbers ?? '');
      setFacility(r.facility_or_technician ?? '');
      setCostAmount(r.cost_amount != null ? String(r.cost_amount) : '');
      setCostIsPrivate(r.cost_is_private);
      setWarrantyInfo(r.warranty_info ?? '');
      setNextServiceDate(r.next_service_date ?? '');
      setNextServiceMileage(r.next_service_mileage != null ? String(r.next_service_mileage) : '');
      setEventDate(r.event_date);
      setMileage(r.mileage != null ? String(r.mileage) : '');
      if (r.mileage_unit) setMileageUnit(r.mileage_unit);
      setLocationText(r.location_text ?? '');
    });
    getRecordPhotos(recordIdParam).then(setPhotos);
    getRecordDocuments(recordIdParam).then(setDocuments);
  }, [recordIdParam]);

  function buildInput(): RecordDraftInput {
    return {
      vehicleId,
      relationship,
      category,
      title: title.trim(),
      description: description.trim() || undefined,
      symptoms: symptoms.trim() || undefined,
      diagnosis: diagnosis.trim() || undefined,
      workPerformed: workPerformed.trim() || undefined,
      partsReplaced: partsReplaced.trim() || undefined,
      partBrandAndNumbers: partBrandAndNumbers.trim() || undefined,
      facilityOrTechnician: facility.trim() || undefined,
      costAmount: costAmount ? Number(costAmount) : undefined,
      costIsPrivate,
      warrantyInfo: warrantyInfo.trim() || undefined,
      nextServiceDate: nextServiceDate || undefined,
      nextServiceMileage: nextServiceMileage ? Number(nextServiceMileage) : undefined,
      eventDate,
      mileage: mileage ? Number(mileage) : undefined,
      mileageUnit,
      locationText: locationText.trim() || undefined,
    };
  }

  const canSaveDraft = title.trim().length > 0 && !!eventDate;

  async function handleSaveDraft(): Promise<string | undefined> {
    if (!canSaveDraft) return undefined;
    setSaving(true);
    setError(null);
    try {
      const record = await saveRecordDraft(buildInput(), recordId);
      setRecordId(record.id);
      return record.id;
    } catch (err: any) {
      setError(err?.message ?? 'Could not save draft.');
      return undefined;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const id = recordId ?? (await handleSaveDraft());
      if (!id) return;
      await publishRecord(id);
      router.replace(`/record/${id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not publish this record.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: insets.top + 8 }}>
        <CircularIconButton icon="x" accessibilityLabel="Close" onPress={() => router.back()} />
        <Text className="font-bold text-charcoal dark:text-dark-text">{recordId ? 'Edit record' : 'New record'}</Text>
        <Pressable onPress={() => setPreviewOpen(true)} accessibilityRole="button" accessibilityLabel="Preview" className="px-3 py-2">
          <Text className="text-mint-600 font-semibold">Preview</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 40 }}>
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary tracking-wide">VIN {vin}</Text>

        <SegmentedPicker label="Your relationship to this vehicle" options={RELATIONSHIPS} value={relationship} onChange={setRelationship} />
        <SegmentedPicker label="Category" options={CATEGORIES} value={category} onChange={setCategory} />

        <TextField label="Title" required value={title} onChangeText={setTitle} maxLength={140} />
        <TextField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }} />

        {(category === 'repair' || category === 'maintenance' || category === 'inspection') && (
          <>
            <TextField label="Symptoms / reason for service" value={symptoms} onChangeText={setSymptoms} />
            <TextField label="Diagnosis" value={diagnosis} onChangeText={setDiagnosis} />
            <TextField label="Work performed" value={workPerformed} onChangeText={setWorkPerformed} />
            <TextField label="Parts replaced" value={partsReplaced} onChangeText={setPartsReplaced} />
            <TextField label="Part brands / numbers" value={partBrandAndNumbers} onChangeText={setPartBrandAndNumbers} />
            <TextField label="Repair facility / technician (optional)" value={facility} onChangeText={setFacility} />
            <TextField label="Warranty information" value={warrantyInfo} onChangeText={setWarrantyInfo} />
          </>
        )}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Event date" required placeholder="YYYY-MM-DD" value={eventDate} onChangeText={setEventDate} />
          </View>
        </View>

        <View className="flex-row gap-3 items-end">
          <View className="flex-1">
            <TextField label="Mileage (optional)" keyboardType="number-pad" value={mileage} onChangeText={setMileage} />
          </View>
          <View className="w-28">
            <SegmentedPicker
              options={[{ value: 'mi', label: 'miles' }, { value: 'km', label: 'km' }]}
              value={mileageUnit}
              onChange={setMileageUnit}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Next service date (optional)" placeholder="YYYY-MM-DD" value={nextServiceDate} onChangeText={setNextServiceDate} />
          </View>
          <View className="flex-1">
            <TextField label="Next service mileage (optional)" keyboardType="number-pad" value={nextServiceMileage} onChangeText={setNextServiceMileage} />
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <TextField label="Cost (optional)" keyboardType="decimal-pad" value={costAmount} onChangeText={setCostAmount} />
          </View>
          <View className="items-center">
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary mb-1.5">Private</Text>
            <Switch value={costIsPrivate} onValueChange={setCostIsPrivate} trackColor={{ true: '#62C58F' }} accessibilityLabel="Keep cost private" />
          </View>
        </View>

        <TextField label="Approximate location (optional)" placeholder="City, region — never a precise address" value={locationText} onChangeText={setLocationText} />

        {recordId ? (
          <>
            <RecordPhotoPicker recordId={recordId} photos={photos} onChange={setPhotos} />
            <RecordDocumentPicker recordId={recordId} documents={documents} onChange={setDocuments} />
          </>
        ) : (
          <View className="bg-cardgray dark:bg-dark-card rounded-xl p-4 flex-row items-center gap-2">
            <Feather name="info" size={14} color="#5C6470" />
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary flex-1">Save as a draft to add photos or documents.</Text>
          </View>
        )}

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="Save Draft" variant="outline" onPress={handleSaveDraft} loading={saving} disabled={!canSaveDraft} fullWidth />
          </View>
          <View className="flex-1">
            <Button label="Publish" onPress={handlePublish} loading={publishing} disabled={!canSaveDraft} fullWidth />
          </View>
        </View>
      </ScrollView>

      <Modal visible={previewOpen} animationType="slide" onRequestClose={() => setPreviewOpen(false)}>
        <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="font-bold text-lg text-charcoal dark:text-dark-text">Preview</Text>
            <CircularIconButton icon="x" accessibilityLabel="Close preview" onPress={() => setPreviewOpen(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary mb-2">{RELATIONSHIP_LABELS[relationship]} · Not verified by RoadProfile</Text>
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text">{title || 'Untitled record'}</Text>
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary mt-1">{CATEGORY_LABELS[category]} · {eventDate}</Text>
            {description ? <Text className="text-sm text-charcoal dark:text-dark-text mt-3">{description}</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
