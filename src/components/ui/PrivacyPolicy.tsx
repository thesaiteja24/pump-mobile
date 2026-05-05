import { useThemeColor } from '@/hooks/theme'
import React from 'react'
import { Text, View } from 'react-native'

const PrivacyPolicy: React.FC = () => {
  const colors = useThemeColor()

  const Heading: React.FC<{ children: React.ReactNode; level: 1 | 2 | 3 }> = ({
    children,
    level,
  }) => {
    const fontSize = level === 1 ? 24 : level === 2 ? 20 : 18
    const marginTop = level === 1 ? 0 : 24
    return (
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: colors.text,
          marginTop,
          marginBottom: 12,
        }}
      >
        {children}
      </Text>
    )
  }

  const Paragraph: React.FC<{ children: React.ReactNode; bold?: boolean }> = ({
    children,
    bold,
  }) => (
    <Text
      style={{
        fontSize: 16,
        lineHeight: 24,
        color: colors.text,
        marginBottom: 12,
        fontWeight: bold ? '700' : '400',
      }}
    >
      {children}
    </Text>
  )

  const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={{ flexDirection: 'row', marginBottom: 8, paddingLeft: 8 }}>
      <Text style={{ color: colors.text, marginRight: 8, fontSize: 16 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 16, lineHeight: 24, color: colors.text }}>{children}</Text>
    </View>
  )

  const TableRow: React.FC<{ cells: string[]; isHeader?: boolean }> = ({ cells, isHeader }) => (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: isHeader ? (colors.isDark ? '#262626' : '#f5f5f5') : 'transparent',
      }}
    >
      {cells.map((cell, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            padding: 8,
            borderRightWidth: index < cells.length - 1 ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: isHeader ? '700' : '400',
              color: colors.text,
            }}
          >
            {cell}
          </Text>
        </View>
      ))}
    </View>
  )

  return (
    <View style={{ paddingBottom: 40 }}>
      <Heading level={1}>Privacy Policy for PUMP</Heading>
      <Paragraph>
        <Text style={{ fontWeight: '700' }}>Last Updated:</Text> 13 February 2026
      </Paragraph>

      <Heading level={2}>1. Introduction</Heading>
      <Paragraph>
        Welcome to PUMP ("we," "our," or "us"). We are committed to protecting your privacy and
        ensuring you understand how your information is collected, used, and shared. This Privacy
        Policy applies to our mobile application PUMP (the "App").
      </Paragraph>
      <Paragraph>
        By using the App, you agree to the collection and use of information in accordance with this
        policy.
      </Paragraph>

      <Heading level={2}>2. Information We Collect</Heading>

      <Heading level={3}>2.1. Personal Information</Heading>
      <Paragraph>
        We collect the following personal information when you create an account or update your
        profile:
      </Paragraph>
      <ListItem>Identity Data: First name, last name, date of birth, gender.</ListItem>
      <ListItem>Contact Data: Email address, phone number.</ListItem>
      <ListItem>Profile Media: Profile picture (uploaded from your device).</ListItem>
      <ListItem>Authentication Data: Google ID (if logging in via Google).</ListItem>

      <Heading level={3}>2.2. Health and Fitness Data</Heading>
      <Paragraph>To provide our core fitness tracking and coaching features, we collect:</Paragraph>
      <ListItem>Body Metrics: Height, weight.</ListItem>
      <ListItem>
        Fitness Profile: Fitness goals (e.g., gain muscle, lose weight), fitness level (beginner,
        intermediate, advanced), injuries, and available equipment.
      </ListItem>
      <ListItem>
        Workout Data: Workout logs, exercises performed, sets, reps, weight used, RPE (Rate of
        Perceived Exertion), and workout duration.
      </ListItem>

      <Heading level={3}>2.3. Device and Usage Data</Heading>
      <Paragraph>
        We automatically collect certain information about your device and how you interact with the
        App:
      </Paragraph>
      <ListItem>
        Device Information: IP address, device model, operating system, and unique device
        identifiers.
      </ListItem>
      <ListItem>Usage Logs: App launch times, features used, and interaction patterns.</ListItem>

      <Heading level={3}>2.4. Audio Data</Heading>
      <Paragraph>
        Voice Interactions: When you use the AI Coach feature, we collect and process your voice
        recordings to transcribe your queries and provide coaching responses.
      </Paragraph>

      <Heading level={2}>3. How We Use Your Information</Heading>
      <Paragraph>We use your data to:</Paragraph>
      <ListItem>
        Provide Services: Create and manage your account, track your workouts, and visualize your
        progress.
      </ListItem>
      <ListItem>
        AI Coaching: Process your voice and text inputs via OpenAI to act as your virtual fitness
        coach.
      </ListItem>
      <ListItem>
        Personalization: Tailor workout recommendations based on your fitness profile and goals.
      </ListItem>
      <ListItem>
        Communication: Send you important updates, security alerts, and support messages.
      </ListItem>
      <ListItem>
        Improvement: Analyze usage trends (via Vexo Analytics) to improve App performance and user
        experience.
      </ListItem>

      <Heading level={2}>4. Permissions We Request</Heading>
      <Paragraph>The App requires the following permissions to function correctly:</Paragraph>
      <ListItem>Camera & Photo Library: To allow you to upload or change your profile picture.</ListItem>
      <ListItem>Microphone: To enable voice interaction with the AI Coach.</ListItem>
      <Paragraph bold>Note: We do not track your precise geolocation.</Paragraph>

      <Heading level={2}>5. Data Sharing and Third Parties</Heading>
      <Paragraph>
        We do not sell your personal data. We share data only with the following third-party service
        providers who assist in our operations:
      </Paragraph>

      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          overflow: 'hidden',
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <TableRow cells={['Service Provider', 'Purpose', 'Data Shared']} isHeader />
        <TableRow
          cells={['Google (Firebase/Auth)', 'Authentication', 'Email, Google ID, Profile generic info']}
        />
        <TableRow
          cells={[
            'OpenAI',
            'AI Coaching Features',
            'Voice transcripts, fitness queries, workout context',
          ]}
        />
        <TableRow cells={['AWS (Amazon Web Services)', 'File Storage', 'Profile pictures']} />
        <TableRow
          cells={['Vexo Analytics', 'App Analytics', 'Anonymized usage data, device info']}
        />
        <TableRow cells={['Twilio', 'SMS Verification (if applicable)', 'Phone number']} />
      </View>

      <Heading level={2}>6. Data Retention</Heading>
      <Paragraph>
        We retain your personal and health data for as long as your account is active or as needed
        to provide you services.
      </Paragraph>
      <Paragraph>
        <Text style={{ fontWeight: '700' }}>Voice Data:</Text> Voice recordings are processed for
        immediate transcription and interaction.
      </Paragraph>

      <Heading level={2}>7. Your Rights and Choices</Heading>

      <Heading level={3}>7.1. Access and Update</Heading>
      <Paragraph>
        You can view and update your personal profile, body metrics, and fitness preferences
        directly within the App's "Profile" and "Settings" sections.
      </Paragraph>

      <Heading level={3}>7.2. Account Deletion</Heading>
      <Paragraph>
        You have the right to request the deletion of your account and all associated data. Current
        Process: Since an automated deletion feature is currently under development, please contact
        us at iamsaiteja2411@gmail.com with the subject line "Delete Account" to request complete
        data removal. We will process your request within 30 days.
      </Paragraph>

      <Heading level={2}>8. Security</Heading>
      <Paragraph>
        We implement industry-standard security measures (including encryption and secure tokens) to
        protect your data. However, no method of transmission over the internet is 100% secure.
      </Paragraph>

      <Heading level={2}>9. Children's Privacy</Heading>
      <Paragraph>
        Our App is not intended for use by children under the age of 13. We do not knowingly collect
        personal data from children.
      </Paragraph>

      <Heading level={2}>10. Changes to This Policy</Heading>
      <Paragraph>
        We may update this Privacy Policy from time to time. We will notify you of any changes by
        posting the new policy on this page and updating the "Last Updated" date.
      </Paragraph>

      <Heading level={2}>11. Contact Us</Heading>
      <Paragraph>If you have any questions about this Privacy Policy, please contact us at:</Paragraph>
      <Paragraph>
        <Text style={{ fontWeight: '700' }}>Email:</Text> iamsaiteja2411@gmail.com
      </Paragraph>
    </View>
  )
}

export default PrivacyPolicy
