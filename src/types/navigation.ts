import { Ionicons } from '@expo/vector-icons'

export type IoniconName = keyof typeof Ionicons.glyphMap

export type RightIcon = {
  name: IoniconName
  onPress: () => void
  disabled?: boolean
  color?: string
}

export type CustomHeaderProps = {
  title: string
  leftIcon?: IoniconName
  rightIcons?: RightIcon[]
  onLeftPress?: () => void
  iconColor?: string
}
