import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  StyleSheet, ActivityIndicator, Alert, ScrollView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Account Problem');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        window.alert('Permission Denied: Camera roll permissions are required.');
      } else {
        Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      }
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async () => {
    if (!imageUri) return null;

    const data = new FormData();
    
    if (Platform.OS === 'web') {
      const blobResponse = await fetch(imageUri);
      const blob = await blobResponse.blob();
      data.append('file', blob, 'screenshot.jpg');
    } else {
      data.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'screenshot.jpg',
      });
    }
    
    data.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data,
    });

    const result = await cloudinaryResponse.json();
    
    if (result.error) {
      throw new Error(`Cloudinary Error: ${result.error.message}`);
    }

    return result.secure_url;
  };

  const sendEmail = async (uploadedImageUrl) => {
    const emailData = {
      service_id: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
      template_id: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
      user_id: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
      template_params: {
        name,
        reply_to: email,
        issue_category: category,
        message,
        image_url: uploadedImageUrl || 'No screenshot provided',
      },
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS Error: ${errorText}`);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      if (Platform.OS === 'web') {
        window.alert('Missing Fields: Please fill out all required fields.');
      } else {
        Alert.alert('Missing Fields', 'Please fill out all required fields.');
      }
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadToCloudinary();
      }

      await sendEmail(imageUrl);
      
      const successMessage = 'Your support ticket has been submitted.';
      if (Platform.OS === 'web') {
        window.alert(`Success: ${successMessage}`);
      } else {
        Alert.alert('Success', successMessage);
      }
      
      setName(''); setEmail(''); setMessage(''); setImageUri(null); setCategory('Account Problem');
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support Ticket</Text>
        <Text style={styles.subtitle}>Let us know how we can help.</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} placeholder="Enter your name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Issue Category</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker} itemStyle={{ fontSize: 16 }} dropdownIconColor="#0EA5E9">
            <Picker.Item label="Account Problem" value="Account Problem" />
            <Picker.Item label="Technical Issue" value="Technical Issue" />
            <Picker.Item label="Payment Concern" value="Payment Concern" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Message</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the problem in detail..." placeholderTextColor="#94A3B8" multiline numberOfLines={5} value={message} onChangeText={setMessage} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Attachment</Text>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.buttonText}>{imageUri ? 'Tap to change screenshot' : '+ Upload Screenshot'}</Text>
        </TouchableOpacity>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit Ticket</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FFFFFF', padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#0EA5E9', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 6 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#0EA5E9', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAFC', color: '#0F172A', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#CBD5E1' },
  textArea: { height: 120, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' },
  picker: { color: '#0F172A', height: 55, backgroundColor: '#F8FAFC', fontSize: 16 },
  imageButton: { backgroundColor: 'transparent', padding: 18, borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#0EA5E9' },
  buttonText: { color: '#0EA5E9', fontSize: 15, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  submitButton: { backgroundColor: '#0EA5E9', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});