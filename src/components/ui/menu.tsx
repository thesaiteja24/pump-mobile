import { MenuView } from '@expo/ui/community/menu'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { createContext, memo, useContext, useRef, useState } from 'react'
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native'

import { useTheme } from '@/hooks/use-theme'

import type { ReactElement, ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

interface PopoverContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerLayout: { x: number, y: number, width: number, height: number }
  setTriggerLayout: (layout: { x: number, y: number, width: number, height: number }) => void
  isDimmed: boolean
  setIsDimmed: (dimmed: boolean) => void
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined)

function usePopover() {
  const context = useContext(PopoverContext)
  if (!context)
    throw new Error('Popover components must be used within a Popover')
  return context
}

function calculatePosition(
  trigger: { x: number, y: number, width: number, height: number },
  contentSize: { width: number, height: number },
  maxWidth: number,
  maxHeight: number,
) {
  const screen = Dimensions.get('window')
  const { x, y, width, height } = trigger
  const wWidth = contentSize.width || maxWidth
  const wHeight = Math.min(contentSize.height || maxHeight, screen.height * 0.8)

  let top = y + height + 6
  let left = x + width - wWidth

  const padding = 16
  if (top + wHeight > screen.height - padding) {
    top = y - wHeight - 6
  }

  left = Math.max(padding, Math.min(left, screen.width - wWidth - padding))
  top = Math.max(padding, Math.min(top, screen.height - wHeight - padding))

  return {
    top,
    left,
    maxWidth,
    maxHeight: Math.min(maxHeight, screen.height - 2 * padding),
  }
}

interface PopoverProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Popover({ children, open = false, onOpenChange }: PopoverProps) {
  const [prevOpen, setPrevOpen] = useState(open)
  const [isOpen, setIsOpen] = useState(open)
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDimmed, setIsDimmed] = useState(false)

  if (open !== prevOpen) {
    setPrevOpen(open)
    setIsOpen(open)
    if (!open)
      setIsDimmed(false)
  }

  const changeOpen = (newOpen: boolean) => {
    setIsOpen(newOpen)
    if (!newOpen)
      setIsDimmed(false)
    onOpenChange?.(newOpen)
  }

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen: changeOpen, triggerLayout, setTriggerLayout, isDimmed, setIsDimmed }}>
      {children}
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({ children, style }: { children: ReactNode, style?: ViewStyle }) {
  const { setIsOpen, setTriggerLayout, isOpen } = usePopover()
  const triggerRef = useRef<View>(null)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    if (triggerRef.current) {
      triggerRef.current.measure((...args: number[]) => {
        const [, , width = 0, height = 0, pageX = 0, pageY = 0] = args
        setTriggerLayout({ x: pageX, y: pageY, width, height })
        setIsOpen(!isOpen)
      })
    }
  }

  return (
    <Pressable ref={triggerRef} style={style} onPress={handlePress}>
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </Pressable>
  )
}

function PopoverContent({ children, style }: { children: ReactNode, style?: ViewStyle }) {
  const { isOpen, setIsOpen, triggerLayout, isDimmed } = usePopover()
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 })
  const { colors, radius } = useTheme()

  const position = calculatePosition(triggerLayout, contentSize, 200, 500)

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
      <Pressable
        style={{ flex: 1, backgroundColor: isDimmed ? 'rgba(0, 0, 0, 0.25)' : 'transparent' }}
        onPress={() => setIsOpen(false)}
      >
        <View
          style={[
            {
              position: 'absolute',
              borderWidth: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              minWidth: 200,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              top: position.top,
              left: position.left,
              maxWidth: position.maxWidth,
              maxHeight: position.maxHeight,
            },
            style,
          ]}
          onLayout={event => setContentSize(event.nativeEvent.layout)}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  )
}

export interface MenuItem {
  id: string
  title: string
  icon?: React.ComponentProps<typeof Ionicons>['name']
  destructive?: boolean
  onPress?: () => void
  subItems?: MenuItem[]
}

export interface MenuProps {
  children: ReactElement
  items?: MenuItem[]
  onPressTrigger?: () => void
  align?: 'start' | 'center' | 'end'
  roundedOutline?: boolean
}

const AndroidMenuItemRow = memo(({ item, onClose }: { item: MenuItem, onClose: () => void }) => {
  const { colors, spacing, typography, radius } = useTheme()
  const { setIsDimmed } = usePopover()
  const [isExpanded, setIsExpanded] = useState(false)
  const hasSubItems = item.subItems && item.subItems.length > 0

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    if (hasSubItems) {
      const nextExpanded = !isExpanded
      setIsExpanded(nextExpanded)
      setIsDimmed(nextExpanded)
    }
    else {
      onClose()
      item.onPress?.()
    }
  }

  return (
    <View style={{ width: '100%' }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          { flexDirection: 'row', alignItems: 'center', borderRadius: radius.sm, minWidth: 140, padding: spacing.md, gap: spacing.sm, justifyContent: 'space-between' },
          pressed && { backgroundColor: colors.input },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {item.icon && <Ionicons name={item.icon} size={18} color={item.destructive ? colors.danger : colors.text} />}
          <Text style={[typography.bodyStrong, { color: item.destructive ? colors.danger : colors.text }]}>
            {item.title}
          </Text>
        </View>
        {hasSubItems && <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />}
      </Pressable>

      {hasSubItems && isExpanded && (
        <View style={{ paddingLeft: spacing.md, borderLeftWidth: 1, borderLeftColor: colors.border, marginLeft: spacing.md + 7, marginTop: spacing.xxs, marginBottom: spacing.sm }}>
          {item.subItems?.map(sub => (
            <Pressable
              key={sub.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                onClose()
                sub.onPress?.()
              }}
              style={({ pressed }) => [
                { flexDirection: 'row', alignItems: 'center', borderRadius: radius.sm, minWidth: 140, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, gap: spacing.sm },
                pressed && { backgroundColor: colors.input },
              ]}
            >
              {sub.icon && <Ionicons name={sub.icon} size={16} color={sub.destructive ? colors.danger : colors.text} />}
              <Text style={[typography.body, { color: sub.destructive ? colors.danger : colors.text }]}>
                {sub.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
})
AndroidMenuItemRow.displayName = 'AndroidMenuItemRow'

export const Menu = memo(({ children, items = [], onPressTrigger, align: _align = 'end', roundedOutline }: MenuProps) => {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)

  const triggerStyle: ViewStyle | undefined = (roundedOutline && Platform.OS === 'android')
    ? {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }
    : undefined

  if (items.length === 0) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          onPressTrigger?.()
        }}
        style={({ pressed }) => [
          triggerStyle,
          pressed && { opacity: 0.6 },
        ]}
      >
        <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      </Pressable>
    )
  }

  if (Platform.OS === 'android') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger style={triggerStyle}>{children}</PopoverTrigger>
        <PopoverContent>
          {items.map(item => (
            <AndroidMenuItemRow key={item.id} item={item} onClose={() => setOpen(false)} />
          ))}
        </PopoverContent>
      </Popover>
    )
  }

  const nativeActions = items.map((item) => {
    let imageName = item.icon
    if (imageName === 'pencil-outline')
      imageName = 'pencil'
    if (imageName === 'trash-outline')
      imageName = 'trash'
    return {
      id: item.id,
      title: item.title,
      image: imageName as React.ComponentProps<typeof MenuView>['actions'][number]['image'],
      attributes: item.destructive ? { destructive: true } : undefined,
    }
  })

  return (
    <MenuView
      actions={nativeActions}
      onPressAction={({ nativeEvent }) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        const item = items.find(i => i.id === nativeEvent.event)
        item?.onPress?.()
      }}
    >
      <Pressable style={triggerStyle}>
        <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      </Pressable>
    </MenuView>
  )
})
Menu.displayName = 'Menu'
