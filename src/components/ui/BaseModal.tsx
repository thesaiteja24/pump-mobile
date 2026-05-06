import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/buttons/Button'
import { useThemeColor } from '@/hooks/theme'

// TYPES
export type ModalAction = {
  title?: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

export interface BaseModalHandle {
  present: () => void
  dismiss: () => void
}

export type BaseModalProps = {
  title: string
  description?: string
  children?: React.ReactNode
  floating?: boolean

  confirmAction?: ModalAction
  editAction?: ModalAction
  deleteAction?: ModalAction
  cancelAction?: ModalAction

  snapPoints?: (string | number)[]
  enableDynamicSizing?: boolean
  onDismiss?: () => void
  onChange?: (index: number) => void
  headerRight?: React.ReactNode
}

// COMPONENT
export const BaseModal = forwardRef<BaseModalHandle, BaseModalProps>(
  (
    {
      title,
      description,
      children,
      floating = false,
      confirmAction,
      editAction,
      deleteAction,
      cancelAction,
      snapPoints: customSnapPoints,
      enableDynamicSizing = false,
      onDismiss,
      onChange,
      headerRight,
    },
    ref,
  ) => {
    const colors = useThemeColor()
    const isDark = useColorScheme() === 'dark'
    const insets = useSafeAreaInsets()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // expose API
    useImperativeHandle(ref, () => ({
      present: () => {
        if (floating) {
          setIsVisible(true)
        } else {
          bottomSheetModalRef.current?.present()
        }
      },
      dismiss: () => {
        setIsVisible(false)
        bottomSheetModalRef.current?.dismiss()
      },
    }))

    // Android Back Handler support
    useEffect(() => {
      const onBackPress = () => {
        if (isOpen || (floating && isVisible)) {
          // Use the internal dismiss logic
          setIsOpen(false)
          setIsVisible(false)
          bottomSheetModalRef.current?.dismiss()
          return true
        }
        return false
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => subscription.remove()
    }, [isOpen, isVisible, floating])

    // Note: We avoid an aggressive "Ghost Killer" useEffect here as it interferes with transitions.
    // Instead, we use the `key` prop on BottomSheetModal below to force a reset on theme change.

    // backdrop
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    )

    // snap points logic
    const snapPoints = useMemo(() => {
      if (enableDynamicSizing) return customSnapPoints
      return customSnapPoints || ['90%']
    }, [customSnapPoints, enableDynamicSizing])

    // styles memoization to prevent re-mounting/re-opening on theme toggle
    const handleIndicatorStyle = useMemo(
      () => ({
        backgroundColor: isDark ? '#525252' : '#d1d5db',
      }),
      [isDark],
    )

    const backgroundStyle = useMemo(
      () => ({
        backgroundColor: isDark ? colors.neutral[900] : colors.neutral[100],
        borderRadius: 24,
      }),
      [isDark, colors.neutral],
    )

    const animationConfigs = useMemo(() => ({ duration: 500 }), [])

    // footer
    const renderFooter = useCallback(() => {
      const allActions = [
        {
          key: 'cancel',
          action: cancelAction,
          variant: 'secondary' as const,
          icon: 'close' as const,
          defaultTitle: 'Cancel',
        },
        {
          key: 'edit',
          action: editAction,
          variant: 'secondary' as const,
          icon: 'pencil' as const,
          defaultTitle: 'Edit',
        },
        {
          key: 'delete',
          action: deleteAction,
          variant: 'danger' as const,
          icon: 'trash' as const,
          defaultTitle: 'Delete',
        },
        {
          key: 'confirm',
          action: confirmAction,
          variant: 'success' as const,
          icon: 'checkmark' as const,
          defaultTitle: 'Confirm',
        },
      ].filter((a) => !!a.action)

      if (allActions.length === 0) return null

      // 1 or 2 buttons: all are full width
      if (allActions.length <= 2) {
        return (
          <View className="mt-8 flex-row gap-3">
            {allActions.map(({ action, variant, defaultTitle }, idx) => (
              <Button
                key={`action-${idx}`}
                variant={variant}
                className="flex-1 rounded-full"
                title={action!.title || defaultTitle}
                onPress={action!.onPress}
                loading={action!.loading}
                disabled={action!.disabled}
              />
            ))}
          </View>
        )
      }

      // 3 or more buttons: edit, delete, cancel become icons, confirm stays full
      const iconActions = allActions.filter((a) => a.key !== 'confirm')
      const confirmBtn = allActions.find((a) => a.key === 'confirm')

      return (
        <View className="mt-8 flex-row items-center gap-3">
          {iconActions.map(({ action, variant, icon }, idx) => (
            <Button
              key={`icon-${idx}`}
              variant={variant}
              className="h-12 w-12 rounded-full p-0"
              leftIcon={
                <Ionicons
                  name={icon}
                  size={20}
                  color={variant === 'danger' ? '#ef4444' : isDark ? 'white' : 'black'}
                />
              }
              onPress={action!.onPress}
              loading={action!.loading}
              disabled={action!.disabled}
              title=""
            />
          ))}
          {confirmBtn && (
            <Button
              key="confirm-btn"
              variant={confirmBtn.variant}
              className="flex-1 rounded-full"
              title={confirmBtn.action!.title || confirmBtn.defaultTitle}
              onPress={confirmBtn.action!.onPress}
              loading={confirmBtn.action!.loading}
              disabled={confirmBtn.action!.disabled}
            />
          )}
        </View>
      )
    }, [confirmAction, cancelAction, editAction, deleteAction, isDark])

    // floating behavior (FIXED)

    const renderContent = () => (
      <View>
        {/* Header */}
        <View className="mb-2">
          <View className="flex-row items-center justify-center">
            <View className="flex-1" />
            <View className="flex-[4]">
              <Text className="text-center text-xl font-bold" style={{ color: colors.text }}>
                {title}
              </Text>
            </View>
            <View className="flex-1 items-end">{headerRight}</View>
          </View>

          {description && (
            <Text className="mt-1 text-center text-base" style={{ color: colors.neutral[500] }}>
              {description}
            </Text>
          )}
        </View>

        {/* Body */}
        <View className="mt-4">{children}</View>

        {/* Footer */}
        {renderFooter()}
      </View>
    )

    if (floating) {
      return (
        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsVisible(false)
            onDismiss?.()
          }}
        >
          <View className="flex-1 justify-center bg-black/40 px-4">
            <Pressable
              className="absolute inset-0"
              onPress={() => {
                setIsVisible(false)
                onDismiss?.()
              }}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <View
                className="overflow-hidden rounded-[32px] p-6 shadow-xl"
                style={{ backgroundColor: colors.background }}
              >
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  {renderContent()}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )
    }

    return (
      <BottomSheetModal
        key={isDark ? 'dark' : 'light'}
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        backdropComponent={renderBackdrop}
        onDismiss={() => {
          setIsOpen(false)
          onDismiss?.()
        }}
        onChange={(index) => {
          setIsOpen(index >= 0)
          onChange?.(index)
        }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        enablePanDownToClose={true}
        handleIndicatorStyle={handleIndicatorStyle}
        backgroundStyle={backgroundStyle}
        animationConfigs={animationConfigs}
        stackBehavior="push"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 16,
              paddingBottom: insets.bottom + 16,
            }}
          >
            {renderContent()}
          </BottomSheetScrollView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    )
  },
)

BaseModal.displayName = 'BaseModal'
