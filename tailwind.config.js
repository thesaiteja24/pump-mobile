/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			fontFamily: {
				monoton: ['Monoton_400Regular'],
			},
			colors: {
				primary: '#3b82f6', // blue-500
				success: '#16a34a', // green-600
				danger: '#dc2626', // red-600
				// surface colors could be added here if we want to override defaults
			},
		},
	},
	plugins: [],
}
