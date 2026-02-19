import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

export function BottomNav() {
  return (
    <div style={styles.wrap}>
      {NAV_ITEMS.map((it) => {
        const content = (
          <>
            <div style={styles.icon}>●</div>
            <div style={styles.label}>{it.label}</div>
          </>
        );

        if (!it.enabled) {
          return (
            <div key={it.key} style={{ ...styles.item, opacity: 0.45 }}>
              {content}
            </div>
          );
        }

        return (
          <NavLink
            key={it.key}
            to={it.to}
            style={({ isActive }) => ({
              ...styles.item,
              color: isActive ? "#a5b4fc" : "#e5e7eb",
            })}
          >
            {content}
          </NavLink>
        );
      })}
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    borderTop: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(11,18,32,0.92)",
    backdropFilter: "blur(10px)",
  },
  item: {
    textDecoration: "none",
    display: "grid",
    placeItems: "center",
    gap: 4,
    fontSize: 11,
  },
  icon: { fontSize: 14, lineHeight: "14px" }, // пока точка, позже заменим на Lucide
  label: { opacity: 0.9 },
};
