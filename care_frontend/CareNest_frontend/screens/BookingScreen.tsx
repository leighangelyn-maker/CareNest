import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView
} from 'react-native';

const services = [
  { id: '1', icon: '👶', name: 'Nanny',   desc: 'Trusted childcare at home', price: 'GHS 50/hr' },
  { id: '2', icon: '🧹', name: 'Cleaner', desc: 'Professional home cleaning', price: 'GHS 50/hr' },
  { id: '3', icon: '👨‍', name: 'Cook',    desc: 'Skilled home cooking',       price: 'GHS 50/hr' },
];

export default function BookingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Our Services</Text>
        <Text style={styles.subtitle}>Choose a service to book</Text>

        {services.map((s) => (
          <TouchableOpacity key={s.id} style={styles.card}
            onPress={() => navigation.navigate('NewBooking', { service: s.name })}>
            <Text style={styles.cardIcon}>{s.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              <Text style={styles.cardDesc}>{s.desc}</Text>
              <Text style={styles.cardPrice}>{s.price}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A1F44' },
  scroll:     { padding: 24, paddingBottom: 48 },
  title:      { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  subtitle:   { color: '#888', fontSize: 15, marginBottom: 24 },
  card:       { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIcon:   { fontSize: 40, marginRight: 16 },
  cardText:   { flex: 1 },
  cardTitle:  { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardDesc:   { color: '#888', fontSize: 14, marginTop: 4 },
  cardPrice:  { color: '#00BCD4', fontSize: 13, marginTop: 4 },
  arrow:      { color: '#00BCD4', fontSize: 20},
});