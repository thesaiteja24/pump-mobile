import { useThemeColor } from '@/hooks/useThemeColor'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function CustomToast({
	text1,
	text2,
	type,
}: {
	text1?: string
	text2?: string
	type: 'success' | 'error' | 'info'
}) {
	const colors = useThemeColor()
	const insets = useSafeAreaInsets()

	// Map types to theme colors if available, or fallback to standard semantic colors
	const borderColors = {
		success: colors.success,
		error: colors.danger,
		info: colors.primary,
	}

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					borderColor: borderColors[type],
					borderWidth: 1,
					shadowColor: '#000', // Shadow usually stays black, or use colors.shadow if exists
					marginTop: 30,
				},
			]}
		>
			{text1 && <Text style={[styles.title, { color: colors.text }]}>{text1}</Text>}
			{text2 && <Text style={[styles.subtitle, { color: colors.text }]}>{text2}</Text>}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '90%',
		padding: 12,
		borderRadius: 12,
		borderLeftWidth: 6,
		marginHorizontal: 16,

		// soft shadow for both iOS + Android
		shadowOpacity: 0.15,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
		elevation: 4,
	},
	title: {
		fontSize: 16,
		fontWeight: '700',
	},
	subtitle: {
		fontSize: 14,
		marginTop: 2,
	},
})
