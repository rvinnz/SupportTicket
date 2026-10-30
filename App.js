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
    // Pide permiso para usa el gallery
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
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
    // Fetch the local blob URL and convert it into an actual file object
    const blobResponse = await fetch(imageUri);
    const blob = await blobResponse.blob();
    data.append('file', blob, 'screenshot.jpg');
  } else {
    // Mobile formatting remains the same
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
    console.log("Cloudinary Rejection:", result.error.message);
    throw new Error(`Cloudinary Error: ${result.error.message}`);
  }

  return result.secure_url;
};

  const sendEmail = async (uploadedImageUrl) => {
    // Prepara el data para EmailJS
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

    // Chequea si tiene error el response de EmailJS
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS Error: ${errorText}`);
    }
  };

  const handleSubmit = async () => {
    // Pone console.log para busca el error si no ta funciona el submit
    console.log("1. Button pressed");
    console.log(`Data -> Name: ${name}, Email: ${email}, Message: ${message}`);

    if (!name || !email || !message) {
      console.log("2. Stopped: Missing required fields");
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    console.log("3. Validation passed, starting upload...");
    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadToCloudinary();
        if (!imageUrl) throw new Error('Image upload failed');
      }

      console.log("4. Image uploaded, sending email...");
      await sendEmail(imageUrl);
      
      console.log("5. Email sent successfully!");
      Alert.alert('Success', 'Your support request has been sent!');
      setName(''); setEmail(''); setMessage(''); setImageUri(null); setCategory('Account Problem');
    } catch (error) {
      console.log("Error caught:", error.message);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.glassCard}>
        <Text style={styles.title}>Support Ticket</Text>

        <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#888" keyboardType="email-address" value={email} onChangeText={setEmail} />
        
        <View style={styles.pickerContainer}>
          <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker} dropdownIconColor="#fff">
            <Picker.Item label="Account Problem" value="Account Problem" color="#fff" />
            <Picker.Item label="Technical Issue" value="Technical Issue" color="#fff" />
            <Picker.Item label="Payment Concern" value="Payment Concern" color="#fff" />
            <Picker.Item label="Other" value="Other" color="#fff" />
          </Picker>
        </View>

        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your issue..." placeholderTextColor="#888" multiline numberOfLines={4} value={message} onChangeText={setMessage} />

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.buttonText}>{imageUri ? 'Change Screenshot' : 'Upload Screenshot'}</Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', padding: 20 },
  glassCard: { width: '100%', backgroundColor: 'rgba(25, 25, 25, 0.45)', padding: 25, borderRadius: 24, borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 25, textAlign: 'center', textShadowColor: 'rgba(255, 255, 255, 0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  input: { backgroundColor: 'rgba(40, 40, 40, 0.6)', color: '#FFF', borderRadius: 12, padding: 16, marginBottom: 15, fontSize: 16, borderColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1 },
  textArea: { height: 120, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: 'rgba(40, 40, 40, 0.6)', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1 },
  picker: { color: '#FFF', height: 55 },
  imageButton: { backgroundColor: 'rgba(60, 60, 65, 0.5)', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1 },
  buttonText: { color: '#4DA8DA', fontSize: 16, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 15, resizeMode: 'cover', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1 },
  submitButton: { backgroundColor: '#4DA8DA', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#4DA8DA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});