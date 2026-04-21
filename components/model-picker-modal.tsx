import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

import { MODELS, Provider } from '@/lib/providers/models';
import { useModelStore } from '@/store/model-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: 'Anthropic Claude',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
};

export function ModelPickerModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const modelId = useModelStore((s) => s.modelId);
  const setModelId = useModelStore((s) => s.setModelId);

  const grouped: Record<Provider, typeof MODELS> = { claude: [], gemini: [], openai: [] };
  MODELS.forEach((m) => grouped[m.provider].push(m));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
        <View className="flex-row justify-between items-center px-5 pt-2 pb-3 border-b border-cream-border">
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xl text-charcoal">
            {t('analysis_model')}
          </Text>
          <Pressable onPress={onClose} className="active:opacity-80 p-2">
            <MaterialIcons name="close" size={24} color="#1c1c1c" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {(['claude', 'gemini', 'openai'] as Provider[]).map((provider) => (
            <View key={provider} className="mb-6">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-sm text-muted uppercase tracking-wider mb-2"
              >
                {PROVIDER_LABEL[provider]}
              </Text>
              {grouped[provider].map((m) => {
                const selected = m.id === modelId;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setModelId(m.id)}
                    className={`border rounded-xl p-4 mb-2 active:opacity-80 ${
                      selected ? 'border-charcoal bg-charcoal/5' : 'border-cream-border'
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold' }}
                          className="text-base text-charcoal"
                        >
                          {m.label}
                        </Text>
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular' }}
                          className="text-xs text-muted mt-0.5"
                        >
                          {m.id}
                        </Text>
                      </View>
                      {selected && (
                        <MaterialIcons name="check-circle" size={22} color="#1c1c1c" />
                      )}
                    </View>
                    <View className="flex-row mt-3 gap-4">
                      <View>
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular' }}
                          className="text-[11px] text-muted uppercase"
                        >
                          {t('input_cost')}
                        </Text>
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold' }}
                          className="text-sm text-charcoal"
                        >
                          ${m.inputPer1M.toFixed(2)}/M
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{ fontFamily: 'DMSans_400Regular' }}
                          className="text-[11px] text-muted uppercase"
                        >
                          {t('output_cost')}
                        </Text>
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold' }}
                          className="text-sm text-charcoal"
                        >
                          ${m.outputPer1M.toFixed(2)}/M
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-xs text-muted text-center mt-2"
          >
            {t('prices_note')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
