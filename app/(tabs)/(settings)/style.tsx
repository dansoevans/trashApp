import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f7f9f9" },
    container: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 6 },
    small: { color: "#666", marginBottom: 12 },

    fieldLabel: { color: "#666", fontWeight: "700", marginTop: 6, marginBottom: 6 },
    input: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#eee" },

    primaryBtn: { backgroundColor: "#17cf17", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    primaryBtnText: { color: "#fff", fontWeight: "800" },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    iconBtn: { padding: 8, borderRadius: 8 },
    icon: { fontSize: 25 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },


    rowPlain: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#f0f0f0" },
    rowTitle: { fontWeight: "700", color: "#111" },
    rowSubtitle: { color: "#666", marginTop: 4 },

    card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0" },
    cardTitle: { fontWeight: "700", color: "#111" },
    cardSub: { color: "#666", marginTop: 6 },

});

export default styles;