import { LucideCalendarDays, LucideMoreHorizontal, LucidePencil, LucidePencilRuler, LucideTrash } from 'lucide-react-native'
import React, { memo, useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Menu } from '@/components/ui/menu'
import { useTheme } from '@/hooks/use-theme'
import { useUnitConverter } from '@/hooks/use-unit-converter'

import type { MeasurementEntry, MeasurementMetrics } from '@/types/user'

const METRIC_LABELS: Record<keyof MeasurementMetrics, string> = {
  weight: 'Weight',
  neck: 'Neck',
  waist: 'Waist',
  hips: 'Hips',
  shoulders: 'Shoulders',
  chest: 'Chest',
  abdomen: 'Abdomen',
  leftBicep: 'L Bicep',
  rightBicep: 'R Bicep',
  leftForearm: 'L Forearm',
  rightForearm: 'R Forearm',
  leftThigh: 'L Thigh',
  rightThigh: 'R Thigh',
  leftCalf: 'L Calf',
  rightCalf: 'R Calf',
  bodyFat: 'Body Fat',
  leanBodyMass: 'Lean Mass',
}

const METRIC_KEYS = Object.keys(METRIC_LABELS) as (keyof MeasurementMetrics)[]

interface MeasurementCardProps {
  entry: MeasurementEntry
  onEdit: (entry: MeasurementEntry) => void
  onDelete: (entry: MeasurementEntry) => void
  formatWeight: (v: number) => number
  formatLength: (v: number) => number
  weightUnit: string
  lengthUnit: string
}

function formatActiveMetrics({
  entry,
  formatWeight,
  formatLength,
  weightUnit,
  lengthUnit,
}: {
  entry: MeasurementEntry
  formatWeight: (v: number) => number
  formatLength: (v: number) => number
  weightUnit: string
  lengthUnit: string
}) {
  const list: { label: string, value: string, key: string }[] = []
  METRIC_KEYS.forEach((key) => {
    const val = entry[key]
    if (val === null || val === undefined || val === 0)
      return

    const numericVal = typeof val === 'string' ? Number.parseFloat(val) : val
    if (Number.isNaN(numericVal))
      return

    const displayValue = (key === 'weight' || key === 'leanBodyMass')
      ? `${formatWeight(numericVal).toFixed(1)} ${weightUnit}`
      : (key === 'bodyFat')
          ? `${numericVal.toFixed(1)}%`
          : `${formatLength(numericVal).toFixed(1)} ${lengthUnit}`

    list.push({ label: METRIC_LABELS[key], value: displayValue, key })
  })
  return list
}

const CardActionsMenu = memo(({ entry, onEdit, onDelete }: {
  entry: MeasurementEntry
  onEdit: (entry: MeasurementEntry) => void
  onDelete: (entry: MeasurementEntry) => void
}) => {
  const { colors } = useTheme()
  const items = useMemo(() => [
    {
      id: 'edit',
      title: 'Edit Entry',
      icon: <LucidePencil size={18} color={colors.text} />,
      systemIcon: 'pencil',
      onPress: () => onEdit(entry),
    },
    {
      id: 'delete',
      title: 'Delete Entry',
      icon: <LucideTrash size={18} color={colors.danger} />,
      systemIcon: 'trash',
      destructive: true,
      onPress: () => onDelete(entry),
    },
  ], [entry, onEdit, onDelete, colors])

  return (
    <Menu items={items}>
      <Pressable
        hitSlop={8}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          backgroundColor: colors.input,
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <LucideMoreHorizontal size={18} color={colors.textSecondary} />
      </Pressable>
    </Menu>
  )
})
CardActionsMenu.displayName = 'CardActionsMenu'

export const MeasurementCard = memo(({ entry, onEdit, onDelete, formatWeight, formatLength, weightUnit, lengthUnit }: MeasurementCardProps) => {
  const { colors, spacing, typography, layout, radius } = useTheme()

  const formattedDate = useMemo(() => {
    const d = new Date(entry.date)
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [entry.date])

  const activeMetrics = useMemo(() => {
    return formatActiveMetrics({ entry, formatWeight, formatLength, weightUnit, lengthUnit })
  }, [entry, formatWeight, formatLength, weightUnit, lengthUnit])

  return (
    <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
      <View style={[layout.rowAlign, layout.rowBetween, { marginBottom: spacing.sm }]}>
        <View style={[layout.rowAlign, { gap: spacing.sm }]}>
          <LucideCalendarDays size={16} color={colors.textSecondary} />
          <Text style={[typography.bodySmStrong, { color: colors.text }]}>{formattedDate}</Text>
        </View>
        <CardActionsMenu entry={entry} onEdit={onEdit} onDelete={onDelete} />
      </View>

      <View style={[layout.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
        {activeMetrics.map(item => (
          <View
            key={item.key}
            style={{
              backgroundColor: colors.background,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.md,
              minWidth: 80,
              flexGrow: 1,
            }}
          >
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>
              {item.label}
            </Text>
            <Text style={[typography.bodySmStrong, { color: colors.text }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {entry.notes
        ? (
            <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontStyle: 'italic' }]} numberOfLines={2}>
                "
                {entry.notes}
                "
              </Text>
            </View>
          )
        : null}
    </Card>
  )
})
MeasurementCard.displayName = 'MeasurementCard'

export const EmptyState = memo(({ onAdd }: { onAdd: () => void }) => {
  const { colors, spacing, typography, layout } = useTheme()
  return (
    <View style={[layout.center, { paddingVertical: 80, paddingHorizontal: spacing.xl }]}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.input,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        }}
      >
        <LucidePencilRuler size={32} color={colors.textSecondary} />
      </View>
      <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm, textAlign: 'center' }]}>
        No measurements logged yet
      </Text>
      <Text style={[typography.bodySm, { color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' }]}>
        Track weight, body fat, waist circumference and more to monitor your physical transformation.
      </Text>
      <Button title="Log First Entry" onPress={onAdd} style={{ paddingHorizontal: spacing.xl }} />
    </View>
  )
})
EmptyState.displayName = 'EmptyState'

interface HistoryListProps {
  history: MeasurementEntry[]
  onEdit: (entry: MeasurementEntry) => void
  onDelete: (entry: MeasurementEntry) => void
  onAdd: () => void
}

export const MeasurementsHistoryList = memo(({ history, onEdit, onDelete, onAdd }: HistoryListProps) => {
  const { spacing } = useTheme()
  const { formatWeight, formatLength, weightUnit, lengthUnit } = useUnitConverter()

  if (history.length === 0) {
    return <EmptyState onAdd={onAdd} />
  }

  return (
    <View style={{ paddingBottom: spacing.xxl }}>
      {history.map(entry => (
        <MeasurementCard
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
          formatWeight={formatWeight}
          formatLength={formatLength}
          weightUnit={weightUnit}
          lengthUnit={lengthUnit}
        />
      ))}
    </View>
  )
})
MeasurementsHistoryList.displayName = 'MeasurementsHistoryList'
