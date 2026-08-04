import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  ActivityIndicator, Keyboard, LayoutAnimation, UIManager, Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
}

interface SevaBotModalProps {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTION_CHIPS = [
  "🌾 Crop tips",
  "🌳 Green Family",
  "💧 Water saving",
  "🧪 Soil Health",
  "🛒 Store trends",
  "🌦️ Weather insight"
];

export const SevaBotModal: React.FC<SevaBotModalProps> = ({ visible, onClose }) => {
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

    try {
      const requestBody: any = {
        message: text.trim(),
      };
      if (threadId) {
        requestBody.thread_id = threadId;
      }

      console.log('Sending Chat Request');
      console.log('/chat');
      console.log(requestBody);

      // The backend /chat endpoint is at the root, not under /v1
      const { data } = await api.post("/chat", requestBody, {
        baseURL: api.defaults.baseURL?.replace('/v1', '')
      });

      console.log(data);

      if (data.thread_id) {
        setThreadId(data.thread_id);
        AsyncStorage.setItem('chat_thread_id', data.thread_id).catch(console.error);
      }

      const replyText = data.response || "Sorry, I received an empty response.";

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
      console.error(error);

      let errorMsgText = "I'm having trouble connecting to the server. Please try again later.";

      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 400) {
          errorMsgText = 'HTTP 400: Bad Request. The backend rejected our request.';
        } else if (error.response.status === 422) {
          errorMsgText = 'HTTP 422: Validation Error. Please check your input.';
        } else if (error.response.status === 500) {
          errorMsgText = 'HTTP 500: Internal Server Error. The backend encountered a problem.';
        } else {
          errorMsgText = `HTTP ${error.response.status}: Server returned an error.`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        if (error.code === 'ECONNABORTED') {
          errorMsgText = 'Request timeout. The server took too long to respond.';
        } else {
          errorMsgText = 'Network request failed. Backend might be unavailable.';
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMsgText = `An unexpected error occurred: ${error.message}`;
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => {
        const updated = [...prev, {
          id: (Date.now() + 1).toString(),
          text: errorMsgText,
          sender: 'bot' as const,
          time: getCurrentTime()
        }];
        AsyncStorage.setItem('chat_messages', JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.isWelcomeCard) {
      return (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>
            👋 <Text style={{ fontWeight: 'bold', color: COLORS.primaryDark }}>Namaste!</Text> I'm Bhumi Mitra — your simulated agricultural intelligence assistant.
          </Text>
          <Text style={styles.welcomeSubtitle}>How can I maximize your eco points today?</Text>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🌾</Text>
            <Text style={styles.listText}>Wheat Crop Optimization</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🌳</Text>
            <Text style={styles.listText}>Carbon Tree Payout milestones</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🧪</Text>
            <Text style={styles.listText}>Soil NPK & Organic Carbon tips</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>💧</Text>
            <Text style={styles.listText}>Water-saving micro-irrigation</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgBubbleWrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
        {!isUser && (
          <View style={styles.botBubbleAvatar}>
            <MaterialCommunityIcons name="creation" size={14} color="#FFF" />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.msgText, isUser ? styles.textUser : styles.textBot]}>
            {item.text}
          </Text>
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
  }
});
