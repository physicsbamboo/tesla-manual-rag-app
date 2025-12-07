// app/index.tsx
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    SafeAreaView, 
    ScrollView,
    TouchableOpacity,
    Image,
  } from 'react-native';
  import * as ImagePicker from 'expo-image-picker';
  import { useState } from 'react';
  
  export default function HomeScreen() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
  
    // 现在：即使没有文字，只要有图片也可以 Ask
    async function askBackend() {
      // 如果用户没写文字，但有图片，我们造一个兜底问题
      const trimmed = question.trim();
      const finalQuestion =
        trimmed ||
        '用户只发送了一张与 Tesla 相关的图片，没有输入文字问题，请根据已知手册内容给出可能有用的说明。';
  
      try {
        const res = await fetch("https://tesla-manual-rag.onrender.com/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            question: finalQuestion,
            image_base64: imageBase64, 
        }),
        });
  
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }
  
        const data = await res.json();
        setAnswer(data.answer);
      } catch (err) {
        console.error("Fetch error:", err);
        setAnswer("服务器无响应，请稍后再试。");
      }
    }
  
    // ✅ 只要有文字 或 有图片，就可以点 Ask
    const canAsk = question.trim().length > 0 || !!imageUri;
  
    // 从相册选图片
    const handlePickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('需要相册权限才能选择图片');
          return;
        }
      
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,           // ✅ 让 Expo 返回 base64
          quality: 0.8,
        });
      
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          setImageUri(asset.uri);                   // 继续保存 uri，用来预览
          setImageBase64(asset.base64 ?? null);     // ✅ 新增：保存 base64
        }
      };
      
  
    // 打开相机拍照
    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('需要相机权限才能拍照');
          return;
        }
      
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,        // ✅ 让拍照也返回 base64
          quality: 0.8,
        });
      
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          setImageUri(asset.uri);                   // 预览
          setImageBase64(asset.base64 ?? null);     // ✅ 保存 base64
        }
      };
      
  
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>TeslAsk</Text>
  
          <TextInput
            style={styles.input}
            placeholder="Ask something about your Tesla..."
            placeholderTextColor="#9CA3AF"
            onChangeText={setQuestion}
            value={question}
          />
  
          {/* 操作区：拍照 / 选图 / Ask */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
            >
              <Text style={styles.iconButtonText}>📷</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: 8 }]}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <Text style={styles.iconButtonText}>🖼️</Text>
            </TouchableOpacity>
  
            <View style={{ flex: 1 }} />
  
            <TouchableOpacity
              style={[styles.button, !canAsk && styles.buttonDisabled]}
              onPress={askBackend}
              disabled={!canAsk}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Ask</Text>
            </TouchableOpacity>
          </View>
  
          {/* 如果选了图，就显示一个小预览 */}
          {imageUri && (
            <View style={styles.imagePreviewBox}>
              <Text style={styles.previewLabel}>已选图片</Text>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </View>
          )}
  
          {/* 答案区域：可滚动 */}
          <View style={styles.answerBox}>
            <ScrollView
              style={styles.answerScroll}
              contentContainerStyle={styles.answerContent}
              showsVerticalScrollIndicator
            >
              <Text style={styles.answerText}>
                {answer ||
                  '还没有答案。你可以输入问题，或者只拍一张和 Tesla 相关的图片，然后点击 Ask（目前图片只作为辅助信息，后端还是主要按文字来查手册）。'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    // 整体背景
    safe: {
      flex: 1,
      backgroundColor: '#0F172A',
    },
    // 主容器
    container: { 
      flex: 1, 
      padding: 20, 
      paddingTop: 40,
      justifyContent: "flex-start",
    },
    title: { 
      fontSize: 24, 
      marginBottom: 20, 
      textAlign: "center",
      fontWeight: '700',
      color: '#F9FAFB',
    },
    input: { 
      borderWidth: 1, 
      borderColor: '#4B5563',
      padding: 12, 
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: '#111827',
      color: '#F9FAFB',
    },
  
    // 底部操作行：📷 / 🖼️ / Ask
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#4B5563',
    },
    iconButtonText: {
      fontSize: 20,
    },
  
    // 按钮样式
    button: {
      paddingHorizontal: 28,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: '#3B82F6',
    },
    buttonDisabled: {
      backgroundColor: '#1D4ED8',
      opacity: 0.5,
    },
    buttonText: {
      color: '#F9FAFB',
      fontSize: 16,
      fontWeight: '600',
    },
  
    // 图片预览区域
    imagePreviewBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      padding: 8,
      borderRadius: 12,
      backgroundColor: '#111827',
    },
    previewLabel: {
      color: '#9CA3AF',
      marginRight: 8,
    },
    previewImage: {
      width: 64,
      height: 64,
      borderRadius: 8,
    },
  
    // 答案区域
    answerBox: {
      flex: 1,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#374151',
      borderRadius: 12,
      backgroundColor: '#020617',
      overflow: 'hidden',
    },
    answerScroll: {
      flex: 1,
    },
    answerContent: {
      padding: 12,
    },
    answerText: { 
      fontSize: 16, 
      lineHeight: 22,
      color: '#E5E7EB',
    },
  });
  