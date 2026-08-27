import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { NAV_CLEARANCE } from '../../../components/nav/AppShell';
import { formatVinForDisplay, formatMileage, CATEGORY_LABELS } from '../../../lib/format';
import { getVehicleByVin, getMileageHistory, type VehicleWithDetails, type MileagePoint } from '../../../lib/api/vehicles';
import { getHistorySummary, type HistorySummary } from '../../../lib/api/summary';

const DISCLAIMER =
  'RoadProfile contains crowdsourced information that may be incomplete or inaccurate. It is not a substitute for a professional inspection or an official vehicle-history report.';

export default function VehicleSummary() {
  const { vin } = useLocalSearchParams<{ vin: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<VehicleWithDetails | null>(null);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [mileage, setMileage] = useState<MileagePoint[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getVehicleByVin(vin).then(async (v) => {
      setData(v);
      if (v?.details) {
        const [s, m] = await Promise.all([getHistorySummary(v.vehicle.id, v.details.year), getMileageHistory(v.vehicle.id)]);
        setSummary(s);
        setMileage(m);
      }
    });
  }, [vin]);

  async function handleExportPdf() {
    if (!data) return;
    setExporting(true);
    try {
      const html = buildSummaryHtml(data, summary, mileage);
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        // On web, printToFileAsync opens the browser print dialog directly.
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'RoadProfile vehicle history summary' });
      }
    } finally {
      setExporting(false);
    }
  }

  if (!data || !data.details) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }

  const { vehicle, details, stats } = data;
  const title = `${details.year} ${details.make} ${details.model}${details.trim ? ` ${details.trim}` : ''}`;

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <Head>
        <title>{`${title} History Summary · RoadProfile`}</title>
        <meta name="description" content={`Buyer-ready vehicle history summary for VIN ${vehicle.vin}.`} />
      </Head>
      <View style={{ paddingTop: insets.top }} className="px-5 pt-2 flex-row items-center justify-between">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Button label="Export PDF" size="sm" onPress={handleExportPdf} loading={exporting} icon={<Feather name="download" size={14} color="#0F2518" />} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: NAV_CLEARANCE, paddingHorizontal: 20, paddingTop: 8 }}>
        <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text">{title}</Text>
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary tracking-wide mt-1">{formatVinForDisplay(vehicle.vin)}</Text>

        <View className="bg-amber-bg rounded-2xl p-4 mt-4">
          <Text className="text-xs text-amber">{DISCLAIMER}</Text>
        </View>

        <Section title="Specifications">
          <SpecRow label="Body style" value={details.body_style} />
          <SpecRow label="Exterior color" value={details.exterior_color} />
          <SpecRow label="Interior color" value={details.interior_color} />
          <SpecRow label="Engine" value={details.engine} />
          <SpecRow label="Transmission" value={details.transmission} />
          <SpecRow label="Drivetrain" value={details.drivetrain} />
        </Section>

        {stats?.latest_mileage != null && stats.latest_mileage_unit ? (
          <Section title="Most recently reported mileage">
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text">{formatMileage(stats.latest_mileage, stats.latest_mileage_unit)}</Text>
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-1">{mileage.length} mileage points on record</Text>
          </Section>
        ) : null}

        <SummaryList title="Maintenance history" records={summary?.maintenance ?? []} />
        <SummaryList title="Major repairs" records={summary?.repairs ?? []} />
        <SummaryList title="Reported damage" records={summary?.damage ?? []} />
        <SummaryList title="Modifications" records={summary?.modifications ?? []} />
        <SummaryList title="Recall work" records={summary?.recalls ?? []} />
        <SummaryList title="Sales / auction appearances" records={summary?.salesOrAuctions ?? []} />

        <Section title="Contributors">
          <Text className="text-charcoal dark:text-dark-text">{summary?.contributorCount ?? 0} people have contributed to this history.</Text>
        </Section>

        {summary && summary.disputedRevisions.length > 0 ? (
          <Section title="Disputed or corrected information">
            {summary.disputedRevisions.map((rev) => (
              <View key={rev.id} className="mb-2">
                <Badge label={rev.status === 'pending' ? 'Pending review' : rev.status === 'approved' ? 'Corrected' : 'Rejected'} tone={rev.status === 'approved' ? 'mint' : 'amber'} />
                <Text className="text-sm text-charcoal dark:text-dark-text mt-1">
                  {rev.field_name}: "{rev.original_value ?? '—'}" → "{rev.suggested_value}"
                </Text>
              </View>
            ))}
          </Section>
        ) : null}

        {summary && summary.gapYears.length > 0 ? (
          <Section title="Gaps in reported history">
            <Text className="text-charcoal dark:text-dark-text">No records found for: {summary.gapYears.join(', ')}</Text>
          </Section>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="text-base font-bold text-charcoal dark:text-dark-text mb-2">{title}</Text>
      {children}
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between py-1.5 border-b border-black/5 dark:border-dark-border">
      <Text className="text-sm text-asphalt dark:text-dark-textSecondary">{label}</Text>
      <Text className="text-sm text-charcoal dark:text-dark-text">{value}</Text>
    </View>
  );
}

function SummaryList({ title, records }: { title: string; records: any[] }) {
  if (records.length === 0) return null;
  return (
    <Section title={title}>
      {records.map((r) => (
        <View key={r.id} className="mb-2">
          <Text className="text-sm font-semibold text-charcoal dark:text-dark-text">{r.title}</Text>
          <Text className="text-xs text-asphalt dark:text-dark-textSecondary">
            {r.event_date} {r.mileage ? `· ${formatMileage(r.mileage, r.mileage_unit)}` : ''}
          </Text>
        </View>
      ))}
    </Section>
  );
}

function buildSummaryHtml(data: VehicleWithDetails, summary: HistorySummary | null, mileage: MileagePoint[]): string {
  const { vehicle, details, stats } = data;
  if (!details) return '<html><body>No data</body></html>';
  const title = `${details.year} ${details.make} ${details.model}${details.trim ? ` ${details.trim}` : ''}`;

  const section = (label: string, records: VehicleRecordLike[]) =>
    records.length
      ? `<h3>${label}</h3><ul>${records.map((r) => `<li><strong>${escapeHtml(r.title)}</strong> — ${r.event_date}${r.mileage ? ` — ${r.mileage.toLocaleString()} ${r.mileage_unit}` : ''}</li>`).join('')}</ul>`
      : '';

  return `
    <html>
      <head><meta charset="utf-8" /><style>
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A1D1F; padding: 32px; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .vin { color: #5C6470; letter-spacing: 1px; margin-bottom: 16px; }
        .disclaimer { background: #FCEED9; color: #B8791A; padding: 12px 16px; border-radius: 12px; font-size: 12px; margin-bottom: 24px; }
        h3 { font-size: 15px; margin-top: 20px; margin-bottom: 6px; }
        ul { margin: 0; padding-left: 18px; }
        li { font-size: 13px; margin-bottom: 4px; }
      </style></head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="vin">VIN: ${escapeHtml(vehicle.vin)}</div>
        <div class="disclaimer">${DISCLAIMER}</div>
        ${stats?.latest_mileage ? `<p><strong>Most recently reported mileage:</strong> ${stats.latest_mileage.toLocaleString()} ${stats.latest_mileage_unit}</p>` : ''}
        ${section('Maintenance history', summary?.maintenance ?? [])}
        ${section('Major repairs', summary?.repairs ?? [])}
        ${section('Reported damage', summary?.damage ?? [])}
        ${section('Modifications', summary?.modifications ?? [])}
        ${section('Recall work', summary?.recalls ?? [])}
        ${section('Sales / auction appearances', summary?.salesOrAuctions ?? [])}
        <p style="font-size:12px;color:#5C6470;margin-top:24px;">Generated by RoadProfile · ${summary?.contributorCount ?? 0} contributors · Community-submitted, crowdsourced data.</p>
      </body>
    </html>
  `;
}

interface VehicleRecordLike {
  title: string;
  event_date: string;
  mileage: number | null;
  mileage_unit: string | null;
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
