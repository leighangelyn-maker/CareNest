import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView
} from 'react-native';

const services = [
  { id: '1', icon: '👶', name: 'Nanny',   desc: 'Trusted childcare at home' },
  { id: '2', icon: '🧹', name: 'Cleaner', desc: 'Professional home cleaning' },
  { id: '3', icon: '👨‍🍳', name: 'Cook',    desc: 'Skilled home cooking' },
];

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Hello 👋</Text>
        <Text style={styles.title}>What service do you need today?</Text>

        {services.map((s) => (
          <TouchableOpacity key={s.id} style={styles.card}
             onPress={() => navigation.navigate('AgencySearch', { service: s.name })}>
            <Text style={styles.cardIcon}>{s.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              <Text style={styles.cardDesc}>{s.desc}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.banner}>
          <Text style={styles.bannerText}>🇬🇭 Serving across Ghana</Text>
          <Text style={styles.bannerSub}>Verified agencies. Trusted workers.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A1F44' },
  scroll:     { padding: 24, paddingBottom: 48 },
  greeting:   { color: '#888', fontSize: 16, marginBottom: 4 },
  title:      { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  card:       { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIcon:   { fontSize: 40, marginRight: 16 },
  cardText:   { flex: 1 },
  cardTitle:  { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardDesc:   { color: '#888', fontSize: 14, marginTop: 4 },
  arrow:      { color: '#00BCD4', fontSize: 20 },
  banner:     { backgroundColor: '#1C2E4A', borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 8 },
  bannerText: { color: '#00BCD4', fontSize: 16, fontWeight: 'bold' },
  bannerSub:  { color: '#888', fontSize: 13, marginTop: 4 },
});