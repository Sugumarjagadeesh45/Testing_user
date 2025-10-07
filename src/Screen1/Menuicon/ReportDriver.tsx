import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ReportDriver = () => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [rideId, setRideId] = useState('');

  const reportTypes = [
    'Unsafe Driving',
    'Rude Behavior',
    'Wrong Route',
    'Vehicle Condition',
    'Overcharging',
    'Other'
  ];

  const handleSubmitReport = () => {
    if (!reportType) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }
    
    // 这里添加提交报告的逻辑
    Alert.alert('Success', 'Your report has been submitted successfully');
    // 可以添加导航回上一页的代码
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Driver</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Report Type</Text>
          <View style={styles.reportTypesContainer}>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.reportTypeButton,
                  reportType === type && styles.selectedReportType
                ]}
                onPress={() => setReportType(type)}
              >
                <Text style={[
                  styles.reportTypeText,
                  reportType === type && styles.selectedReportTypeText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Ride ID (if available)"
            value={rideId}
            onChangeText={setRideId}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please describe the issue in detail..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 15,
  },
  reportTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportTypeButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedReportType: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  reportTypeText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedReportTypeText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333333',
  },
  textArea: {
    height: 120,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReportDriver;