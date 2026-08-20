import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button onClick={toggleTheme} style={styles.button}>
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

const styles = {
  button: {
    padding: "10px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: "var(--card-bg)",
    color: "var(--text-color)",
  },
};

export default ThemeToggle;