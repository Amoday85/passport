import { BottomNav } from "../nav/BottomNav";

export function MobileLayout({ children, hideNav }) {
  return (
    <div style={styles.root}>
      <div style={{ ...styles.content, paddingBottom: hideNav ? 16 : 76 }}>
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh" },
  content: { padding: 0 },
};
