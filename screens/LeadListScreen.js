import { SafeAreaView, FlatList, StyleSheet, Text } from "react-native";
import LeadCard from "../components/LeadCard";
import leads from '../constants/leadsData'

export default function LeadListScreen() {


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Leads</Text>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LeadCard name={item.name} phone={item.phone} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 30,
  },
});