import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
  ActivityIndicator, Linking, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getMyAddresses, addAddress, createBooking, getAgencyById,
  setBookingPrice, initiatePayment
} from '../services/api';

const SERVICE_CATEGORIES = [
  { id: '1c19a96b-944f-4d61-87db-59c24024d666', label: 'Nanny' },
  { id: '0c67561e-55b1-4947-ac5b-a37221c01e09', label: 'Cleaning' },
  { id: '77cbd85e-3b8d-47be-ba57-3c687b24628e', label: 'Cooking' },
];

export default function BookingScreen({ route, navigation }: any) {
  const agencyId: string | undefined = route.params?.agencyId;
  const agencyNameParam: string | undefined = route.params?.agencyName;

  const [agencyPhone, setAgencyPhone] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState(agencyNameParam ?? '');

  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].id);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const [newLabel, setNewLabel] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRegion, setNewRegion] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hours, setHours] = useState('3');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const [payAmount, setPayAmount] = useState('');
  const [payingNow, setPayingNow] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!agencyId) {
          Alert.alert('Missing agency', 'Please book from an agency profile page.');
          navigation.goBack();
          return;
        }

        const [addressRes, agencyRes] = await Promise.all([
          getMyAddresses(),
          getAgencyById(agencyId),
        ]);

        const addressList = addressRes.data ?? addressRes ?? [];
        setAddresses(addressList);
        const defaultAddr = addressList.find((a: any) => a.default) ?? addressList[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        if (addressList.length === 0) setShowAddAddress(true);

        const agency = agencyRes.data ?? agencyRes;
        setAgencyPhone(agency.phone ?? null);
        if (!agencyNameParam) setAgencyName(agency.name ?? '');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load booking details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [agencyId]);

  const handleAddAddress = async () => {
    if (!newLabel.trim() || !newLine1.trim() || !newCity.trim() || !newRegion.trim()) {
      Alert.alert('Missing info', 'Fill in all address fields.');
      return;
    }
    setAddingAddress(true);
    try {
      const response = await addAddress({
        label: newLabel.trim(),
        line1: newLine1.trim(),
        city: newCity.trim(),
        region: newRegion.trim(),
        latitude: 0,
        longitude: 0,
        default: addresses.length === 0,
      });
      const created = response.data ?? response;
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewLabel(''); setNewLine1(''); setNewCity(''); setNewRegion('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save address.');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (!agencyId) {
      Alert.alert('Error', 'Missing agency information.');
      return;
    }
    if (!selectedAddressId) {
      Alert.alert('Missing address', 'Select or add an address first.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Missing date', 'Enter a date (YYYY-MM-DD).');
      return;
    }
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      Alert.alert('Invalid hours', 'Enter how many hours you need.');
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const startTime = new Date(year, (month || 1) - 1, day, time.getHours(), time.getMinutes());
    if (isNaN(startTime.getTime())) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD, e.g. 2026-08-01');
      return;
    }
    const endTime = new Date(startTime.getTime() + hoursNum * 60 * 60 * 1000);

    setSubmitting(true);
    try {
      const response = await createBooking({
        agencyId,
        serviceCategoryId: category,
        familyAddressId: selectedAddressId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isRecurring,
        hourlyRateMinorUnits: 1,
        familyNotes: notes.trim(),
      });
      setBookingResult(response.data ?? response);
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallAgency = () => {
    if (agencyPhone) Linking.openURL(`tel:${agencyPhone}`);
  };

  const handlePayNow = async () => {
    const rate = parseFloat(payAmount);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid amount', 'Enter the amount you agreed with the agency.');
      return;
    }
    setPayingNow(true);
    try {
      await setBookingPrice(bookingResult.id, Math.round(rate * 100));
      const response = await initiatePayment(bookingResult.id);
      const payment = response.data ?? response;
      if (payment.authorizationUrl) {
        await Linking.openURL(payment.authorizationUrl);
      } else {
        Alert.alert('Error', 'No payment link was returned. Try again.');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Could not start payment.');
    } finally {
      setPayingNow(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#0D1B2A" />
      </SafeAreaView>
    );
  }

  if (bookingResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centered}>
          <Text style={styles.successTitle}>Booking Request Sent</Text>
          <Text style={styles.successBody}>
            Call {agencyName || 'the agency'} to agree on a price. Once you've agreed,
            enter the amount below and pay securely.
          </Text>

          {agencyPhone && (
            <TouchableOpacity style={styles.callButton} onPress={handleCallAgency}>
              <Text style={styles.callButtonText}>Call {agencyPhone}</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, styles.fullWidth, { marginTop: 30 }]}>
            Agreed Amount (GHS)
          </Text>
          <TextInput
            style={[styles.input, styles.fullWidth]}
            placeholder="e.g. 150"
            placeholderTextColor="#999"
            value={payAmount}
            onChangeText={setPayAmount}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.button, styles.fullWidth, payingNow && styles.buttonDisabled]}
            onPress={handlePayNow}
            disabled={payingNow}>
            {payingNow
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Pay Now</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('BookingMain')}>
            <Text style={styles.secondaryButtonText}>View Booking History</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Book {agencyName || 'Agency'}</Text>

        <Text style={styles.label}>Service Needed</Text>
        <View style={styles.chipRow}>
          {SERVICE_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, category === c.id && styles.chipActive]}
              onPress={() => setCategory(c.id)}>
              <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Address</Text>
        {addresses.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardActive]}
            onPress={() => setSelectedAddressId(addr.id)}>
            <Text style={styles.addressLabel}>{addr.label}</Text>
            <Text style={styles.addressLine}>{addr.line1}, {addr.city}, {addr.region}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => setShowAddAddress((s) => !s)}>
          <Text style={styles.addAddressLink}>
            {showAddAddress ? 'Cancel' : '+ Add New Address'}
          </Text>
        </TouchableOpacity>

        {showAddAddress && (
          <View style={styles.addAddressBox}>
            <TextInput style={styles.input} placeholder="Label (e.g. Home)"
              placeholderTextColor="#999" value={newLabel} onChangeText={setNewLabel} />
            <TextInput style={styles.input} placeholder="Street Address"
              placeholderTextColor="#999" value={newLine1} onChangeText={setNewLine1} />
            <TextInput style={styles.input} placeholder="City"
              placeholderTextColor="#999" value={newCity} onChangeText={setNewCity} />
            <TextInput style={styles.input} placeholder="Region/State"
              placeholderTextColor="#999" value={newRegion} onChangeText={setNewRegion} />
            <TouchableOpacity
              style={[styles.smallButton, addingAddress && styles.buttonDisabled]}
              onPress={handleAddAddress} disabled={addingAddress}>
              {addingAddress
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.smallButtonText}>Save Address</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD"
          placeholderTextColor="#999" value={date} onChangeText={setDate} />

        <Text style={styles.label}>Start Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.timeText}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setTime(selectedTime);
            }}
          />
        )}

        <Text style={styles.label}>How Many Hours?</Text>
        <TextInput style={styles.input} placeholder="e.g. 4"
          placeholderTextColor="#999" value={hours} onChangeText={setHours}
          keyboardType="numeric" />

        <TouchableOpacity
          style={styles.recurringRow}
          onPress={() => setIsRecurring((r) => !r)}>
          <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
            {isRecurring && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.recurringText}>This is a recurring booking</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Notes for the Agency (optional)</Text>
        <TextInput style={[styles.input, styles.multiline]}
          placeholder="Anything the agency should know"
          placeholderTextColor="#999" value={notes} onChangeText={setNotes}
          multiline numberOfLines={3} />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Send Booking Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  centered:         { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 60 },
  scroll:           { padding: 20, paddingTop: 50, paddingBottom: 60 },
  title:            { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  label:            { color: '#0D1B2A', fontSize: 13, marginTop: 18, marginBottom: 8 },
  fullWidth:        { width: '100%' },
  chipRow:          { flexDirection: 'row', gap: 10 },
  chip:             { flex: 1, borderWidth: 1, borderColor: '#0D1B2A', borderRadius: 12, padding: 12, alignItems: 'center' },
  chipActive:       { backgroundColor: '#0D1B2A' },
  chipText:         { color: '#0D1B2A', fontSize: 12, fontWeight: '600' },
  chipTextActive:   { color: '#fff' },
  addressCard:      { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, marginBottom: 8 },
  addressCardActive:{ borderColor: '#0D1B2A' },
  addressLabel:     { color: '#1A1A1A', fontWeight: '600', fontSize: 14 },
  addressLine:      { color: '#666666', fontSize: 12, marginTop: 2 },
  addAddressLink:   { color: '#0D1B2A', fontSize: 13, fontWeight: '600', marginTop: 4 },
  addAddressBox:    { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginTop: 10 },
  input:            { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', color: '#1A1A1A', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 10 },
  timeText:         { color: '#1A1A1A', fontSize: 15 },
  multiline:        { height: 80, textAlignVertical: 'top' },
  smallButton:      { backgroundColor: '#0D1B2A', borderRadius: 8, padding: 12, alignItems: 'center' },
  smallButtonText:  { color: '#fff', fontWeight: '600', fontSize: 13 },
  recurringRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  checkbox:         { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#0D1B2A', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked:  { backgroundColor: '#0D1B2A' },
  checkmark:        { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  recurringText:    { color: '#1A1A1A', fontSize: 14 },
  button:           { backgroundColor: '#0D1B2A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonDisabled:   { opacity: 0.5 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  successTitle:     { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' },
  successBody:      { fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  callButton:       { backgroundColor: '#0D1B2A', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 30, marginTop: 24 },
  callButtonText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secondaryButton:  { marginTop: 16 },
  secondaryButtonText: { color: '#0D1B2A', fontSize: 14, fontWeight: '600' },
});