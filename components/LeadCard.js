import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  NativeModules,
} from "react-native";

const { CallStateModule } = NativeModules;

export default function LeadCard({ name, phone }) {
  const handleCall = () => {
    CallStateModule.markNextCallAsAppInitiated();
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
      </View>

      <TouchableOpacity style={styles.callButton} onPress={handleCall}>
        <Text style={styles.callIcon}>📞</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },

  phone: {
    fontSize: 15,
    color: "#666",
  },

  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#dff5e1",
  },

  callIcon: {
    fontSize: 22,
  },
});