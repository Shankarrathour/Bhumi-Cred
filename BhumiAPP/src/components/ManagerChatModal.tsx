import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, 
  FlatList, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  time: string;
  isWelcomeCard?: boolean;
}

interface ManagerChatModalProps {
  visible: boolean;
  onClose: () => void;
  managerName?: string;
  managerRole?: string;
}

const SUGGESTION_CHIPS = [
  "🌍 Project verification",
  "🌳 Tree plantation query",
  "💰 Reward payouts",
  "📅 Next inspection"
];

const BOT_RESPONSES: Record<string, string> = {
  "default": "Thank you for reaching out. Our team is currently reviewing your project status and will respond to your query shortly.",
  "project verification": "Your land verification is complete. The MRV team is currently running the carbon estimation models.",
  "tree plantation query": "Please ensure you have submitted accurate tree counts and photos. Field inspectors verify 10% of plots randomly.",
  "reward payouts": "Once your eco-credits are fully generated, the rewards will be transferred directly to your registered bank account via DBT.",
  "next inspection": "Your next MRV satellite inspection is scheduled for next month. Ensure your plantation remains undisturbed."
};

export const ManagerChatModal: React.FC<ManagerChatModalProps> = ({ 
  visible, 
  onClose,
  managerName = "BhumiCred MRV Team",
  managerRole = "Carbon Project Operations"
}) => {
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
  
  const flatListRef = useRef<FlatList>(null);

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

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    // Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      time: getCurrentTime()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    
    // Simulate Bot Reply
    setIsTyping(true);
    Keyboard.dismiss();
    
    setTimeout(() => {
      setIsTyping(false);
      
      const cleanText = text.toLowerCase().trim();
      let replyText = BOT_RESPONSES[cleanText];
      
      if (!replyText) {
        // Partial match search
        const key = Object.keys(BOT_RESPONSES).find(k => k !== 'default' && cleanText.includes(k.replace('🌍 ', '').replace('🌳 ', '').replace('💰 ', '').replace('📅 ', '')));
        if (key) {
          replyText = BOT_RESPONSES[key];
        } else {
          replyText = BOT_RESPONSES["default"];
        }
      }
      
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'bot',
        time: getCurrentTime()
      };
      
      setMessages(prev => [...prev, newBotMsg]);
    }, 1200);
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.isWelcomeCard) {
      return (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>
            👋 <Text style={{ fontWeight: 'bold', color: COLORS.primaryDark }}>Namaste!</Text> I'm {managerName}, your Program Leader.
          </Text>
          <Text style={styles.welcomeSubtitle}>How can I assist you with your project today?</Text>
          
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🌍</Text>
            <Text style={styles.listText}>Project timeline and verification</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>🌳</Text>
            <Text style={styles.listText}>Tree plantation queries</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listEmoji}>💰</Text>
            <Text style={styles.listText}>Carbon credit payouts</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgBubbleWrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
        {!isUser && (
          <View style={styles.botBubbleAvatar}>
            <MaterialCommunityIcons name="account-tie" size={14} color="#FFF" />
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
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Chat Header */}
          <View style={styles.header}>
            <View style={styles.headerProfile}>
              <View style={styles.headerAvatar}>
                <MaterialCommunityIcons name="account-tie" size={20} color="#84CC16" />
              </View>
              <View style={styles.headerMeta}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.botName}>{managerName}</Text>
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.botSub}>{managerRole} • BhumiCred</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
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
                    <MaterialCommunityIcons name="account-tie" size={14} color="#FFF" />
                  </View>
                  <View style={[styles.msgBubble, styles.bubbleBot, styles.typingBubble]}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.typingText}>MRV Team is typing...</Text>
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
              placeholder="Ask MRV Team about your project..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage(inputText)}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.6 }]}
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
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
    backgroundColor: 'rgba(2, 44, 34, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#022C22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#84CC16',
  },
  headerMeta: {
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#84CC16',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  botSub: {
    color: '#A7F3D0',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.soft,
  },
  welcomeGreeting: {
    fontSize: 13.5,
    color: COLORS.textDark,
    lineHeight: 19,
    marginBottom: 12,
    fontWeight: '600',
  },
  welcomeSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listEmoji: {
    fontSize: 16,
    width: 24,
  },
  listText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  msgBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '85%',
  },
  wrapperBot: {
    alignSelf: 'flex-start',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
  },
  botBubbleAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  msgBubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...SHADOWS.soft,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
  },
  textBot: {
    color: COLORS.textDark,
  },
  textUser: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 8.5,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  timeBot: {
    color: COLORS.textSecondary,
  },
  timeUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 11.5,
    color: COLORS.primary,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  suggestionContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
  },
  chipScroll: {
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 13,
    color: '#1E293B',
    marginRight: 10,
    fontWeight: '600',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  }
});
