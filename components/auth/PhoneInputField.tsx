import type { Country } from '@/constants/countries'
import { COUNTRIES } from '@/constants/countries'
import { useThemeColor } from '@/hooks/useThemeColor'

import { useMemo, useState } from 'react'
import { FlatList, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ChevronDownIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline'

// helper: convert ISO country code to emoji flag
function countryCodeToFlag(iso: string) {
	if (!iso) return '🏳️'
	// Regional Indicator Symbol Letter A starts at 0x1F1E6
	return iso
		.toUpperCase()
		.split('')
		.map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
		.join('')
}

type Props = {
	value?: string
	onChangeText?: (text: string) => void
	style?: any
	inputProps?: React.ComponentProps<typeof TextInput>
	initialCountry?: string // e.g. "IN" or "US"
	onCountryChange?: (country: Country) => void
}

export default function PhoneInputField({
	value = '',
	onChangeText,
	style,
	inputProps,
	initialCountry = 'IN',
	onCountryChange,
}: Props) {
	const colors = useThemeColor()
	const [modalVisible, setModalVisible] = useState(false)
	const [query, setQuery] = useState('')
	const [selected, setSelected] = useState<Country>(
		() => COUNTRIES.find(c => c.code === initialCountry) ?? COUNTRIES[0]
	)

	const results = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return COUNTRIES
		return COUNTRIES.filter(
			c => c.name.toLowerCase().includes(q) || c.dial_code.includes(q) || c.code.toLowerCase().includes(q)
		)
	}, [query])

	function selectCountry(c: Country) {
		setSelected(c)
		setModalVisible(false)
		if (onCountryChange) onCountryChange(c)
	}

	return (
		<View style={style} className="w-full">
			<View
				className="flex-row items-center overflow-hidden rounded-lg border"
				style={{
					backgroundColor: colors.background,
					borderColor: colors.neutral[200], // or a specific border token
				}}
			>
				{/* Country selector */}
				<TouchableOpacity
					activeOpacity={0.8}
					className="flex-row items-center bg-transparent px-3 py-3"
					onPress={() => setModalVisible(true)}
				>
					<Text className="mr-2 text-lg">{countryCodeToFlag(selected.code)}</Text>
					<Text className="mr-1 text-base" style={{ color: colors.text }}>
						{selected.dial_code}
					</Text>
					{/* show chevron; if react-native-heroicons not installed, replace with simple text */}
					{Platform.OS === 'web' ? (
						<Text className="ml-1" style={{ color: colors.text }}>
							▾
						</Text>
					) : (
						<ChevronDownIcon size={18} color={colors.text} />
					)}
				</TouchableOpacity>

				{/* Divider */}
				<View className="h-8 w-px" style={{ backgroundColor: colors.neutral[200] }} />

				{/* Phone input */}
				<TextInput
					value={value}
					onChangeText={onChangeText}
					keyboardType="phone-pad"
					placeholder={`${selected.dial_code} 98765 43210`}
					placeholderTextColor={colors.neutral[500]}
					className="flex-1 px-4 py-3"
					style={{ color: colors.text }}
					{...inputProps}
				/>
			</View>

			{/* Country selection modal */}
			<Modal
				visible={modalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setModalVisible(false)}
			>
				<Pressable className="flex-1 justify-end bg-black/40" onPress={() => setModalVisible(false)}>
					<Pressable
						className="max-h-[70%] rounded-t-2xl p-4"
						style={{ backgroundColor: colors.background }} // Ensure modal bg is correct
					>
						{/* Search */}
						<View
							className="mb-4 flex-row items-center rounded-lg border px-3 py-2"
							style={{
								borderColor: colors.neutral[200],
								backgroundColor: colors.background,
							}}
						>
							{/* optional icon */}
							{Platform.OS === 'web' ? (
								<Text className="mr-2">🔍</Text>
							) : (
								<MagnifyingGlassIcon size={18} color={colors.text} />
							)}
							<TextInput
								autoFocus
								value={query}
								onChangeText={setQuery}
								placeholder="Search"
								placeholderTextColor={colors.neutral[500]}
								className="flex-1"
								style={{ color: colors.text }}
							/>
						</View>

						<FlatList
							data={results}
							keyExtractor={item => item.code}
							showsVerticalScrollIndicator={false}
							renderItem={({ item }) => (
								<TouchableOpacity
									onPress={() => selectCountry(item)}
									className="flex-row items-center justify-between px-2 py-3"
								>
									<View className="flex-row items-center">
										<Text className="mr-3 text-xl">{countryCodeToFlag(item.code)}</Text>
										<Text className="text-base" style={{ color: colors.text }}>
											{item.name}
										</Text>
									</View>
									<Text className="text-base" style={{ color: colors.text }}>
										{item.dial_code}
									</Text>
								</TouchableOpacity>
							)}
							ItemSeparatorComponent={() => (
								<View className="h-px" style={{ backgroundColor: colors.neutral[200] }} />
							)}
						/>
					</Pressable>
				</Pressable>
			</Modal>
		</View>
	)
}
