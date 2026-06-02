import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'

import { MeasurementsModal } from '@/components/profile/measurements-modal'
import { BaseScreen } from '@/components/ui/base-screen'
import { Menu } from '@/components/ui/menu'
import { useDeleteMeasurementMutation, useMeasurementsQuery } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import { MeasurementsHistoryList } from './measurements-components'

import type { MeasurementEntry } from '@/types/user'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'

export default function MeasurementsHistoryScreen() {
  const router = useRouter()
  const { colors, layout } = useTheme()

  const { data, isLoading } = useMeasurementsQuery('all')
  const history = data?.history || []
  const deleteMeasurement = useDeleteMeasurementMutation()

  const modalRef = useRef<BottomSheetMethods | null>(null)
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementEntry | undefined>(undefined)

  const handleOpenAdd = useCallback(() => {
    setSelectedMeasurement(undefined)
    modalRef.current?.present()
  }, [])

  const handleOpenEdit = useCallback((entry: MeasurementEntry) => {
    setSelectedMeasurement(entry)
    modalRef.current?.present()
  }, [])

  const handleDelete = useCallback((entry: MeasurementEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this measurement entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMeasurement.mutate(entry.id, {
              onSuccess: () => {
                Arise.success('Entry deleted successfully!')
              },
              onError: (err: Error) => {
                Arise.error(err.message || 'Failed to delete entry.')
              },
            })
          },
        },
      ],
    )
  }, [deleteMeasurement])

  return (
    <BaseScreen
      title="Body Measurements"
      scrollable
      headerLeft={() => (
        <Menu onPressTrigger={() => router.back()} roundedOutline>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Menu>
      )}
      headerRight={() => (
        <Menu onPressTrigger={handleOpenAdd} roundedOutline>
          <Ionicons name="add" size={24} color={colors.text} />
        </Menu>
      )}
    >
      {isLoading
        ? (
            <View style={[layout.flex1, layout.center, { paddingVertical: 100 }]}>
              <ActivityIndicator size="large" color={colors.text} />
            </View>
          )
        : (
            <MeasurementsHistoryList history={history} onEdit={handleOpenEdit} onDelete={handleDelete} onAdd={handleOpenAdd} />
          )}
      <MeasurementsModal ref={modalRef} measurement={selectedMeasurement} />
    </BaseScreen>
  )
}
