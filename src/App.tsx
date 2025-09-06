import { useState } from "react";
import MultiSelect from "./components/MultiSelect";
import type { Option } from "./components/MultiSelect";

import "./styles.css";

const seed: Option[] = [
  { value: "education", label: "Education", icon: "🎓" },
  { value: "science", label: "Yeeeah, science!", icon: "🧪" },
  { value: "art", label: "Art", icon: "🖼️" },
  { value: "sport", label: "Sport", icon: "⚽" },
  { value: "games", label: "Games", icon: "🎮" },
  { value: "health", label: "Health", icon: "🧰" },
];

export default function App() {
  const [options, setOptions] = useState<Option[]>(seed);
  const [selected, setSelected] = useState<string[]>(["science"]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7f8fb",
        padding: 24,
      }}
    >
      <div style={{ width: 360 }}>
        <MultiSelect
          options={options}
          value={selected}
          onChange={(vals, nextOptions) => {
            setSelected(vals);
            if (nextOptions) setOptions(nextOptions);
          }}
          placeholder="Science"
          allowCreate
          maxDropdownHeight={320}
          renderOption={(opt, selected) => (
            <div className="ms__itemMain">
              <span className="ms__icon">{opt.icon}</span>
              <span className="ms__label">{opt.label}</span>
              {selected ? <span className="ms__check">✔</span> : null}
            </div>
          )}
        />
      </div>
    </div>
  );
}
