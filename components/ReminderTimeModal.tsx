import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import PillButton from './PillButton';
import IconButton from './IconButton';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';
import { hapticSelect, hapticTick, hapticSuccess } from '../lib/haptics';
import { formatTime } from '../lib/reminders';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialHour: number;
  initialMinute: number;
  presets: { hour: number; minute: number }[];
  onSave: (hour: number, minute: number) => void;
  onClose: () => void;
}

export default function ReminderTimeModal({
  visible,
  title,
  subtitle,
  initialHour,
  initialMinute,
  presets,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const [prev, setPrev] = useState({ visible, initialHour, initialMinute });
  if (
    prev.visible !== visible ||
    prev.initialHour !== initialHour ||
    prev.initialMinute !== initialMinute
  ) {
    setPrev({ visible, initialHour, initialMinute });
    if (visible) {
      setHour(initialHour);
      setMinute(initialMinute);
    }
  }

  const changeHour = (delta: number) => {
    hapticTick();
    setHour((h) => (h + delta + 24) % 24);
  };

  const changeMinute = (delta: number) => {
    hapticTick();
    setMinute((m) => (m + delta + 60) % 60);
  };

  const setExactMinute = (m: number) => {
    hapticSelect();
    setMinute(m);
  };

  const selectPreset = (p: { hour: number; minute: number }) => {
    hapticSelect();
    setHour(p.hour);
    setMinute(p.minute);
  };

  const handleSave = () => {
    hapticSuccess();
    onSave(hour, minute);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <IconButton icon="close" size={20} onPress={onClose} accessibilityLabel={t('common.close')} />
          </View>

          {/* Stepper display */}
          <View style={styles.stepperContainer}>
            {/* Hour column */}
            <View style={styles.stepperCol}>
              <TouchableOpacity
                onPress={() => changeHour(1)}
                style={styles.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+1 hodina"
              >
                <Ionicons name="chevron-up" size={22} color={Colors.accent.main} />
              </TouchableOpacity>
              <Text style={styles.timeDigit}>{hour.toString().padStart(2, '0')}</Text>
              <TouchableOpacity
                onPress={() => changeHour(-1)}
                style={styles.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="-1 hodina"
              >
                <Ionicons name="chevron-down" size={22} color={Colors.accent.main} />
              </TouchableOpacity>
              <Text style={styles.unitLabel}>{t('reminders.hour')}</Text>
            </View>

            <Text style={styles.colon}>:</Text>

            {/* Minute column */}
            <View style={styles.stepperCol}>
              <TouchableOpacity
                onPress={() => changeMinute(5)}
                style={styles.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+5 minut"
              >
                <Ionicons name="chevron-up" size={22} color={Colors.accent.main} />
              </TouchableOpacity>
              <Text style={styles.timeDigit}>{minute.toString().padStart(2, '0')}</Text>
              <TouchableOpacity
                onPress={() => changeMinute(-5)}
                style={styles.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="-5 minut"
              >
                <Ionicons name="chevron-down" size={22} color={Colors.accent.main} />
              </TouchableOpacity>
              <Text style={styles.unitLabel}>{t('reminders.minute')}</Text>
            </View>
          </View>

          {/* Quick minute rounders */}
          <View style={styles.minutePills}>
            {[0, 15, 30, 45].map((m) => {
              const active = minute === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setExactMinute(m)}
                  style={[styles.minChip, active && styles.minChipActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.minChipText, active && styles.minChipTextActive]}>
                    :{m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Presets */}
          {presets.length > 0 && (
            <View style={styles.presetSection}>
              <Text style={styles.sectionHeading}>{t('reminders.presets')}</Text>
              <View style={styles.presetWrap}>
                {presets.map((p) => {
                  const active = p.hour === hour && p.minute === minute;
                  return (
                    <TouchableOpacity
                      key={`${p.hour}:${p.minute}`}
                      onPress={() => selectPreset(p)}
                      style={[styles.presetChip, active && styles.presetChipActive]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.presetText, active && styles.presetTextActive]}>
                        {formatTime(p.hour, p.minute)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Save CTA */}
          <View style={styles.footer}>
            <PillButton label={t('reminders.save_time')} onPress={handleSave} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 36, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.sheet,
    padding: 22,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.screenTitle - 4,
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  stepperCol: {
    alignItems: 'center',
    width: 80,
  },
  stepBtn: {
    padding: 6,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDigit: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 40,
    color: Colors.text.primary,
    letterSpacing: 1,
    marginVertical: 4,
  },
  colon: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 36,
    color: Colors.text.secondary,
    marginHorizontal: 10,
    marginTop: -20,
  },
  unitLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.micro + 1,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  minutePills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  minChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface.card2,
  },
  minChipActive: {
    backgroundColor: Colors.accent.main,
  },
  minChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  minChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.dmSansSemiBold,
  },
  presetSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall - 1,
    color: Colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface.card2,
  },
  presetChipActive: {
    backgroundColor: Colors.accent.soft,
    borderColor: Colors.accent.main,
    borderWidth: 1,
  },
  presetText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  presetTextActive: {
    color: Colors.accent.main,
    fontFamily: FontFamily.dmSansSemiBold,
  },
  footer: {
    marginTop: 6,
  },
});
