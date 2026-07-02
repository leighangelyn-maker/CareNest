import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Linking, Alert
} from 'react-native';

export default function AgencyProfileScreen({ navigation, route }: any) {
  const { agency, service } = route.params;

  const handleCall = () => {
    Linking.openURL(`tel:${agency.phone}`);
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Agency Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{agency.name[0]}</Text>
          </View>
          <Text style={styles.name}>{agency.name}</Text>
          {agency.verified && <Text style={styles.verified}>✓ Verified Agency</Text>}
          <Text style={styles.stars}>{renderStars(agency.rating)}</Text>
          <Text style={styles.ratingNum}>{agency.rating} ({agency.reviews} reviews)</Text>
          <Text style={styles.location}>📍 {agency.location}</Text>
        </View>

        {/* Services */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Services Offered</Text>
          <View style={styles.servicesRow}>
            {agency.services.map((s: string) => (
              <View key={s} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <Text style={styles.phone}>📞 {agency.phone}</Text>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How it works</Text>
          <Text style={styles.step}>1. Contact the agency below</Text>
          <Text style={styles.step}>2. Discuss your needs and agree on a price</Text>
          <Text style={styles.step}>3. Come back to the app to make payment</Text>
          <Text style={styles.step}>4. Agency assigns a worker to you</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Text style={styles.callBtnText}>📞 Call Agency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatBtn}
          onPress={() => navigation.navigate('Chat', {
            agencyId: agency.id,
            agencyName: agency.name,
            service,
          })}>
          <Text style={styles.chatBtnText}>💬 Chat with Agency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.payBtn}
          onPress={() => navigation.navigate('Payment', {
            service: service,
            agencyName: agency.name,
          })}>
          <Text style={styles.payBtnText}>💳 Proceed to Payment</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A1F44' },
  backBtn:        { padding: 16 },
  backText:       { color: '#00BCD4', fontSize: 16 },
  scroll:         { padding: 24, paddingBottom: 48 },
  profileHeader:  { alignItems: 'center', marginBottom: 24 },
  avatarBox:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00BCD4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:     { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name:           { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  verified:       { color: '#00BCD4', fontSize: 13, marginBottom: 8 },
  stars:          { color: '#FFD700', fontSize: 20, marginBottom: 4 },
  ratingNum:      { color: '#888', fontSize: 13, marginBottom: 4 },
  location:       { color: '#888', fontSize: 14 },
  card:           { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle:      { color: '#00BCD4', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  servicesRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  serviceTag:     { backgroundColor: '#0A1F44', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  serviceTagText: { color: '#00BCD4', fontSize: 13 },
  phone:          { color: '#fff', fontSize: 16 },
  step:           { color: '#aaa', fontSize: 14, marginBottom: 8 },
  callBtn:        { backgroundColor: '#1C2E4A', borderWidth: 1, borderColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  callBtnText:    { color: '#00BCD4', fontSize: 16, fontWeight: 'bold' },
  chatBtn:        { backgroundColor: '#1C2E4A', borderWidth: 1, borderColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  chatBtnText:    { color: '#00BCD4', fontSize: 16, fontWeight: 'bold' },
  payBtn:         { backgroundColor: '#00BCD4', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  payBtnText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});