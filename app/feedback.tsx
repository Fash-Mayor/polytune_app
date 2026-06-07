import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useState } from 'react';

export default function FeedbackScreen() {
  const [type, setType] = useState<'bug' | 'translation'>('bug');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your feedback helps us provide a better experience. Please let us know if you encountered a bug or if you have suggestions for a better translation.</Text>

      <Text style={styles.label}>FEEDBACK TYPE</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'bug' && styles.toggleActive]}
          onPress={() => setType('bug')}
        >
          <Text style={[styles.toggleText, type === 'bug' && styles.textActive]}>🐛 Report a Bug</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'translation' && styles.toggleActive]}
          onPress={() => setType('translation')}
        >
          <Text style={[styles.toggleText, type === 'translation' && styles.textActive]}>A/文 Suggest Translation</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>DETAILS</Text>
      <TextInput 
        style={styles.input}
        multiline
        placeholder="Please describe the issue or provide your suggested translation here..."
        placeholderTextColor={COLORS.textInactive}
      />

      <TouchableOpacity style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Submit Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.margin },
  header: { color: COLORS.textInactive, fontSize: 16, marginBottom: 32, lineHeight: 24 },
  label: { color: COLORS.textActive, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center' },
  toggleActive: { borderColor: COLORS.primary },
  toggleText: { color: COLORS.textInactive, fontWeight: '600' },
  textActive: { color: COLORS.textActive },
  input: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 16, color: COLORS.textActive, textAlignVertical: 'top', fontSize: 16 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 9999, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#000000', fontWeight: '700', fontSize: 16 }
});