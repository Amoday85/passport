import { useNavigate } from "react-router-dom";

export function SurveysStartPage() {
  const nav = useNavigate();

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Опитування ТТ</div>

      <div style={styles.grid}>
        <button style={styles.card} onClick={() => nav("/app/surveys/new")}>
          <div style={styles.cardTitle}>Нова точка</div>
          <div style={styles.cardSub}>Створити новий візит</div>
        </button>

        <button style={{ ...styles.card, ...styles.cardDisabled }} disabled>
          <div style={styles.cardTitle}>Наявні точки</div>
          <div style={styles.cardSub}>Скоро буде доступно</div>
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { padding: 20 },
  title: { fontSize: 20, fontWeight: 800, marginBottom: 16 },
  grid: { display: "grid", gap: 12 },
  card: {
    textAlign: "left",
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  cardDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  cardTitle: { fontSize: 16, fontWeight: 800 },
  cardSub: { fontSize: 13, opacity: 0.75, marginTop: 4 },
};
