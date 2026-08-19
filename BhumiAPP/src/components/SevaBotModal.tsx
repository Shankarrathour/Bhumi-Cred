import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard, LayoutAnimation, UIManager, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  time: string;
  isWelcomeCard?: boolean;
  actionRoute?: string;
  actionText?: string;
  isError?: boolean;
}

interface SevaBotModalProps {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTION_CHIPS = [
  "📍 Explain my land status",
  "🧪 Explain soil report",
  "🌳 Check project progress",
  "💎 Explain carbon credits",
  "🛡️ Help with insurance"
];

export const SevaBotModal: React.FC<SevaBotModalProps> = ({ visible, onClose }) => {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '',
      sender: 'bot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWelcomeCard: true
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    const loadChatData = async () => {
      try {
        const savedMsgs = await AsyncStorage.getItem('chat_messages');
        const savedThread = await AsyncStorage.getItem('chat_thread_id');
        if (savedMsgs) {
          setMessages(JSON.parse(savedMsgs));
        }
        if (savedThread) {
          setThreadId(savedThread);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadChatData();
  }, []);

  const flatListRef = useRef<FlatList>(null);
  const avatarScale = useRef(new Animated.Value(0.5)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  // Avatar entrance animation when modal opens
  useEffect(() => {
    if (visible) {
      avatarScale.setValue(0.5);
      avatarOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(avatarScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(avatarOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, avatarScale, avatarOpacity]);

  // Automatically scroll to the latest message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClearChat = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages([{
      id: '1',
      text: '',
      sender: 'bot',
      time: getCurrentTime(),
      isWelcomeCard: true
    }]);
    setThreadId(null);
    setIsTyping(false);
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);

    AsyncStorage.removeItem('chat_messages').catch(console.error);
    AsyncStorage.removeItem('chat_thread_id').catch(console.error);
  };

  const handleScriptedResponse = (text: string): { replyText: string; actionRoute?: string; actionText?: string } | null => {
    const lower = text.toLowerCase();
    if (lower.includes('land status') || lower.includes('land')) {
      return {
        replyText: '📍 Your land parcel is currently Under Review for boundary tree verification and satellite GIS mapping. Tap below to track real-time verification touchpoints!',
        actionRoute: '/(tabs)/projects',
        actionText: 'View My Lands & Status'
      };
    }
    if (lower.includes('soil') || lower.includes('report')) {
      return {
        replyText: '🧪 Your Soil Audit shows NPK Balance (N: 142, P: 28, K: 210 mg/kg) with Soil pH 6.8 (Slightly Acidic). High Organic Carbon (1.2%) detected! Tap below to view your full lab report.',
        actionRoute: '/soil-testing',
        actionText: 'Open Soil Testing Report'
      };
    }
    if (lower.includes('project') || lower.includes('progress')) {
      return {
        replyText: '🌳 Active Carbon Project: MP-Bhopal Block A (Stage 3: Soil Testing & Inspection Completed). Estimated carbon yield: 37.5 tCO₂e. Tap below to open your Project Roadmap!',
        actionRoute: '/(tabs)/projects',
        actionText: 'Open Project Roadmap'
      };
    }
    if (lower.includes('carbon') || lower.includes('credit')) {
      return {
        replyText: '💎 You currently have 37.5 CO₂e carbon credits in your wallet! Each verified tree earns ₹500/year + carbon bonus payouts. Tap below to visit your Eco Wallet.',
        actionRoute: '/(tabs)/wallet',
        actionText: 'Open Eco Wallet'
      };
    }
    if (lower.includes('insurance') || lower.includes('policy')) {
      return {
        replyText: '🛡️ Tree Eco-Shield covers climate perils (cyclone, drought, pest attack, flood). Instant claim payout via drone spectrometer scan. Tap below to explore plans!',
        actionRoute: '/insurance',
        actionText: 'Explore Tree Insurance'
      };
    }
    return null;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      time: getCurrentTime()
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => {
      const updated = [...prev, newUserMsg];
      AsyncStorage.setItem('chat_messages', JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();

    // Check scripted prompt match first
    const scripted = handleScriptedResponse(text);

    try {
      if (scripted) {
        // Simulated AI response delay
        setTimeout(() => {
          setIsTyping(false);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMessages(prev => {
            const updated = [...prev, {
              id: (Date.now() + 1).toString(),
              text: scripted.replyText,
              sender: 'bot' as const,
              time: getCurrentTime(),
              actionRoute: scripted.actionRoute,
              actionText: scripted.actionText
            }];
            AsyncStorage.setItem('chat_messages', JSON.stringify(updated)).catch(console.error);
            return updated;
          });
        }, 1000);
        return;
      }

      const requestBody: any = {
        message: text.trim(),
      };
      if (threadId) {
        requestBody.thread_id = threadId;
      }

      const { data } = await api.post("/chat", requestBody, {
        baseURL: api.defaults.baseURL?.replace('/v1', '')
      });

      if (data.thread_id) {
        setThreadId(data.thread_id);
        AsyncStorage.setItem('chat_thread_id', data.thread_id).catch(console.error);
      }

      const replyText = data.response || "Namaste! I am Bhumitra AI. How can I help you with your land or carbon credits today?";

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => {
        const updated = [...prev, {
          id: (Date.now() + 1).toString(),
          text: replyText,
          sender: 'bot' as const,
          time: getCurrentTime()
        }];
        AsyncStorage.setItem('chat_messages', JSON.stringify(updated)).catch(console.error);
        return updated;
      });

    } catch (error: any) {
      console.log('AI Chat Fallback Triggered:', error?.message);

      // Fallback fallback response with retry action
      const fallbackText = "🌱 Bhumitra AI: I am currently operating in offline mode. You can check your land status, soil report, or eco wallet using the quick action cards below!";

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => {
        const updated = [...prev, {
          id: (Date.now() + 1).toString(),
          text: fallbackText,
          sender: 'bot' as const,
          time: getCurrentTime(),
          isError: true,
          actionRoute: '/(tabs)/projects',
          actionText: 'View My Lands & Projects'
        }];
        AsyncStorage.setItem('chat_messages', JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    } finally {
      if (!scripted) {
        setIsTyping(false);
      }
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.isWelcomeCard) {
      return (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>
            👋 <Text style={{ fontWeight: 'bold', color: COLORS.primaryDark }}>Namaste!</Text> I'm Bhumitra AI — your intelligent agricultural assistant.
          </Text>
          <Text style={styles.welcomeSubtitle}>Tap any quick prompt or type your query:</Text>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>📍</Text>
            <Text style={styles.listText}>Explain my land status</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🧪</Text>
            <Text style={styles.listText}>Explain soil NPK report</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🌳</Text>
            <Text style={styles.listText}>Check carbon project roadmap</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🛡️</Text>
            <Text style={styles.listText}>Help with tree insurance</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgBubbleWrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
        {!isUser && (
          <View style={styles.botBubbleAvatar}>
            <MaterialCommunityIcons name="robot" size={14} color="#FFF" />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.msgText, isUser ? styles.textUser : styles.textBot]}>
            {item.text}
          </Text>

          {/* Action Deep-Link Card */}
          {item.actionRoute && item.actionText && (
            <TouchableOpacity
              style={styles.actionCardBtn}
              onPress={() => {
                onClose();
                router.push(item.actionRoute as any);
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="open-in-new" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionCardText}>{item.actionText}</Text>
            </TouchableOpacity>
          )}

          {/* Retry Button on Error */}
          {item.isError && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => handleSendMessage("📍 Explain my land status")}
            >
              <MaterialCommunityIcons name="refresh" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.retryText}>Retry Query</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.msgTime, isUser ? styles.timeUser : styles.timeBot]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Premium Chat Header */}
          <View style={styles.header}>
            <View style={styles.headerProfile}>
              <Animated.View style={[
                styles.headerAvatar,
                { opacity: avatarOpacity, transform: [{ scale: avatarScale }] }
              ]}>
                <MaterialCommunityIcons name="robot-outline" size={22} color="#84CC16" />
                <View style={styles.onlineDot} />
              </Animated.View>
              <View style={styles.headerMeta}>
                <Text style={styles.botName}>Bhumi AI Assistant</Text>
                <Text style={styles.botSub}>Eco Assistant</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleClearChat} activeOpacity={0.7}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Body */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.chatBody}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isTyping ? (
                <View style={[styles.msgBubbleWrapper, styles.wrapperBot]}>
                  <View style={styles.botBubbleAvatar}>
                    <MaterialCommunityIcons name="robot-outline" size={14} color="#FFF" />
                  </View>
                  <View style={[styles.msgBubble, styles.bubbleBot, styles.typingBubble]}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={styles.typingText}>typing...</Text>
                  </View>
                </View>
              ) : null
            }
          />

          {/* Quick Suggestion Chips */}
          <View style={styles.suggestionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSendMessage(chip)}
                  disabled={isTyping}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Bottom Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about farming..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage(inputText)}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && { backgroundColor: '#E2E8F0', shadowOpacity: 0 }]}
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="send" size={20} color={inputText.trim() ? "#FFF" : "#94A3B8"} style={inputText.trim() ? { marginLeft: 2, marginBottom: -2 } : {}} />
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...SHADOWS.soft,
    elevation: 8,
    zIndex: 10,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerMeta: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  botName: {
    color: '#0F172A',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  botSub: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
  },
  deleteBtnText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBody: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.soft,
  },
  welcomeGreeting: {
    fontSize: 14.5,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '600',
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listEmoji: {
    fontSize: 18,
    width: 28,
  },
  listText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
  },
  msgBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    maxWidth: '85%',
  },
  wrapperBot: {
    alignSelf: 'flex-start',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
  },
  botBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  msgBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...SHADOWS.soft,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  textBot: {
    color: '#1E293B',
  },
  textUser: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 9,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '700',
  },
  timeBot: {
    color: '#94A3B8',
  },
  timeUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 13,
    color: '#10B981',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  suggestionContainer: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
  },
  chipScroll: {
    paddingHorizontal: 20,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 10,
    ...SHADOWS.soft,
    shadowOpacity: 0.05,
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#0F172A',
    marginRight: 12,
    fontWeight: '500',
    minHeight: 46,
    maxHeight: 120,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  actionCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  actionCardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  }
});
